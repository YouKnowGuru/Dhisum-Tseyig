import { NextRequest } from 'next/server'
import { rateLimit } from '@/lib/rate-limit/rate-limit'
import { JINDA_SYSTEM_PROMPT } from '@/lib/chatbot/system-prompt'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_MODEL = 'meta-llama/llama-3.3-70b-instruct:free'

// Free fallback models tried in order if the primary is rate-limited / unavailable.
// Verified against OpenRouter's live /models endpoint — only currently-free slugs.
// Ordered by quality, with diverse providers to avoid simultaneous rate limits.
const FALLBACK_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'openai/gpt-oss-20b:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
]

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

function isPlaceholderKey(key: string | undefined): boolean {
  if (!key) return true
  const k = key.trim()
  return (
    k.length < 20 ||
    k.includes('YOUR_FREE_KEY') ||
    k.includes('your-openrouter') ||
    k.startsWith('sk-or-v1-your') ||
    k === 'changeme'
  )
}

/**
 * Build the ordered list of models to attempt.
 * The configured model goes first, then fallbacks (deduped).
 */
function getModelChain(): string[] {
  const configured = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL
  const chain = [configured]
  for (const m of FALLBACK_MODELS) {
    if (!chain.includes(m)) chain.push(m)
  }
  return chain
}

/**
 * Attempt a streaming call to OpenRouter with a specific model.
 * Returns the Response if successful (status 200 + body), or null to try next.
 */
async function tryModel(
  apiKey: string,
  model: string,
  messages: ChatMessage[]
): Promise<Response | null> {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://jindapos.com',
      'X-Title': 'Jinda POS Assistant',
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.4,
      max_tokens: 1200,
      messages: [{ role: 'system', content: JINDA_SYSTEM_PROMPT }, ...messages],
    }),
  })

  if (res.ok && res.body) return res

  // Log and move to next model on retryable errors
  const errText = await res.text().catch(() => '')
  console.error(`[chat] model "${model}" failed (${res.status})`, errText.slice(0, 300))

  // 400/401/403 = config issue — no point trying other models on 401/403
  if (res.status === 401 || res.status === 403) {
    throw new Error('AUTH')
  }
  // All other errors (429, 500, 502, 503, etc.) → try next model
  return null
}

export async function POST(req: NextRequest) {
  // 1. Rate limit — 30 chat messages / minute / client
  const limited = await rateLimit(req, { windowMs: 60_000, maxRequests: 30 })
  if (limited) return limited

  // 2. Verify OpenRouter key is configured
  const apiKey = process.env.OPENROUTER_API_KEY
  if (isPlaceholderKey(apiKey)) {
    return new Response(
      JSON.stringify({ error: 'The AI assistant is not configured yet. Please set OPENROUTER_API_KEY.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // 3. Parse + sanitize incoming message history (keep last 20 turns)
  let messages: ChatMessage[]
  try {
    const body = await req.json()
    const raw: unknown[] = Array.isArray(body?.messages) ? body.messages : []
    messages = raw
      .filter(
        (m: unknown): m is ChatMessage =>
          !!m &&
          typeof m === 'object' &&
          ((m as ChatMessage).role === 'user' || (m as ChatMessage).role === 'assistant') &&
          typeof (m as ChatMessage).content === 'string'
      )
      .slice(-20)
      .map((m: ChatMessage) => ({ role: m.role, content: m.content.slice(0, 4000) }))

    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
      return new Response(JSON.stringify({ error: 'No user message provided.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 4. Try models in order until one succeeds
  const models = getModelChain()
  let upstream: Response | null = null
  let authError = false

  for (const model of models) {
    try {
      upstream = await tryModel(apiKey!, model, messages)
      if (upstream) {
        console.log(`[chat] serving with model: ${model}`)
        break
      }
    } catch (err) {
      if ((err as Error).message === 'AUTH') {
        authError = true
        break
      }
      console.error(`[chat] unexpected error for model ${model}:`, err)
    }
    // Brief pause before trying next model (helps with rate-limit windows)
    await new Promise((r) => setTimeout(r, 300))
  }

  if (!upstream) {
    const msg = authError
      ? 'The OpenRouter API key is invalid or unauthorized. Please check OPENROUTER_API_KEY.'
      : 'All free AI models are currently rate-limited. Please try again in a few seconds.'
    return new Response(JSON.stringify({ error: msg }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 5. Transform OpenRouter SSE stream -> plain text token stream
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream!.body!.getReader()
      let buffer = ''
      let closed = false
      const safeClose = () => {
        if (!closed) {
          closed = true
          try {
            controller.close()
          } catch {
            /* already closed */
          }
        }
      }
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith('data:')) continue
            const data = trimmed.slice(5).trim()
            if (data === '[DONE]') {
              safeClose()
              return
            }
            try {
              const json = JSON.parse(data)
              const delta: string | undefined = json?.choices?.[0]?.delta?.content
              if (delta) controller.enqueue(encoder.encode(delta))
            } catch {
              /* ignore malformed/keep-alive chunk */
            }
          }
        }
        safeClose()
      } catch (err) {
        console.error('[chat] stream error', err)
        safeClose()
      }
    },
    cancel() {
      // Client disconnected — stop reading upstream
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
