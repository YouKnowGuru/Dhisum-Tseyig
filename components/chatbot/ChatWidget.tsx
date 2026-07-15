'use client'

import { useState, useRef, useEffect, useCallback, FormEvent } from 'react'
import { MessageSquare, X, Send, Sparkles, Loader2, User, Bot, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Markdown } from './Markdown'

type Role = 'user' | 'assistant'
interface Message {
  id: string
  role: Role
  content: string
}

const STORAGE_KEY = 'jinda_chat_history_v1'
const GREETING: Message = {
  id: 'greeting',
  role: 'assistant',
  content:
    "**Hello! I'm Jinda AI** 👋\n\nYour intelligent assistant for **Jinda POS** — Bhutan's #1 POS & accounting software.\n\nI can help you with:\n- Features & how Jinda works\n- Pricing & free trial\n- GST, payments (mBOB, BNB Pay, TPay) & offline use\n- Downloading & license activation\n\nWhat would you like to know?",
}

const SUGGESTIONS = [
  'What can Jinda POS do?',
  'Who is the founder?',
  'Is there a free trial?',
  'Does it work offline?',
  'How does GST work?',
]

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function loadHistory(): Message[] {
  if (typeof window === 'undefined') return [GREETING]
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [GREETING]
    const parsed = JSON.parse(raw) as Message[]
    if (!Array.isArray(parsed) || parsed.length === 0) return [GREETING]
    return parsed
  } catch {
    return [GREETING]
  }
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([GREETING])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Hydrate-safe: load persisted history after mount
  useEffect(() => {
    setMounted(true)
    setMessages(loadHistory())
  }, [])

  // Persist history
  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)))
    } catch {
      /* storage full / unavailable */
    }
  }, [messages, mounted])

  // Auto-scroll on new content
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, open])

  // Autofocus input when opened
  useEffect(() => {
    if (open && mounted) inputRef.current?.focus()
  }, [open, mounted])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsStreaming(false)
  }, [])

  const send = useCallback(
    async (text: string) => {
      const content = text.trim()
      if (!content || isStreaming) return

      setError(null)
      setInput('')

      const userMsg: Message = { id: uid(), role: 'user', content }
      const assistantId = uid()
      const placeholder: Message = { id: assistantId, role: 'assistant', content: '' }

      // Build the history we send to the API (previous messages + new user msg)
      const history = [...messages, userMsg]
        .filter((m) => m.id !== 'greeting')
        .map((m) => ({ role: m.role, content: m.content }))

      setMessages([...messages, userMsg, placeholder])
      setIsStreaming(true)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        })

        if (!res.ok) {
          let msg = 'Something went wrong. Please try again.'
          try {
            const data = await res.json()
            if (data?.error) msg = data.error
          } catch {
            /* ignore */
          }
          throw new Error(msg)
        }
        if (!res.body) throw new Error('No response stream.')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let acc = ''
        let firstChunk = true

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          if (firstChunk && chunk) {
            firstChunk = false
          }
          acc += chunk
          // Update the assistant message live
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m))
          )
        }

        if (!acc.trim()) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: "I couldn't generate a response. Please try rephrasing your question." }
                : m
            )
          )
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          // keep partial content
        } else {
          const message = (err as Error).message || 'Something went wrong.'
          setError(message)
          setMessages((prev) => prev.filter((m) => m.id !== assistantId))
        }
      } finally {
        abortRef.current = null
        setIsStreaming(false)
      }
    },
    [messages, isStreaming]
  )

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    send(input)
  }

  const clearChat = () => {
    stop()
    setMessages([GREETING])
    setError(null)
  }

  // Don't render anything on the server to avoid hydration mismatch
  if (!mounted) return null

  return (
    <>
      {/* Floating Launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat' : 'Open Jinda AI chat'}
        className={cn(
          'fixed bottom-5 right-5 z-[60] flex items-center justify-center h-14 w-14 rounded-full',
          'bg-gradient-to-br from-bhutan-maroon to-bhutan-maroon-dark text-bhutan-gold',
          'shadow-xl shadow-bhutan-maroon/30 ring-4 ring-white/10',
          'transition-all duration-300 hover:scale-110 active:scale-95',
          open && 'rotate-90'
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bhutan-gold opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-bhutan-gold" />
          </span>
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div
          className={cn(
            'fixed z-[59] flex flex-col',
            'bottom-24 right-5 w-[calc(100vw-2.5rem)] max-w-[400px]',
            'h-[min(70vh,560px)]',
            'rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700',
            'bg-white dark:bg-slate-950 shadow-2xl shadow-bhutan-maroon/20',
            'animate-in fade-in slide-in-from-bottom-3 duration-300'
          )}
        >
          {/* Header */}
          <div className="relative flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-bhutan-maroon to-bhutan-maroon-dark text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-bhutan-gold/20 ring-1 ring-bhutan-gold/40">
              <Sparkles className="h-5 w-5 text-bhutan-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-black tracking-tight leading-none">Jinda AI Assistant</h2>
              <p className="text-[10px] font-bold text-bhutan-gold/90 mt-1 tracking-wide">
                Powered by Phojaa95
              </p>
            </div>
            <button
              onClick={clearChat}
              aria-label="Clear conversation"
              className="text-[10px] font-bold uppercase tracking-wider text-white/70 hover:text-white px-2 py-1 rounded-md hover:bg-white/10 transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3.5 bg-slate-50 dark:bg-slate-900/40"
          >
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} streaming={isStreaming && m.id === messages[messages.length - 1]?.id && m.role === 'assistant'} />
            ))}

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 px-3 py-2 text-[12px] text-red-700 dark:text-red-300">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Quick suggestions (only before first user message) */}
          {messages.filter((m) => m.role === 'user').length === 0 && !isStreaming && (
            <div className="px-3.5 pb-2 flex flex-wrap gap-1.5 bg-slate-50 dark:bg-slate-900/40">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] font-bold px-2.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-bhutan-maroon hover:text-bhutan-maroon dark:hover:border-bhutan-gold dark:hover:text-bhutan-gold transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 px-3.5 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send(input)
                }
              }}
              rows={1}
              placeholder="Ask me anything about Jinda POS..."
              className="flex-1 resize-none max-h-28 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-[13px] font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-bhutan-maroon/40 dark:focus:ring-bhutan-gold/40 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              aria-label="Send message"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-bhutan-maroon text-bhutan-gold hover:bg-bhutan-maroon-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>

          {/* Footer credit */}
          <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-center text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Jinda AI · Powered by Phojaa95 · Founded by Keshab Baral
            </p>
          </div>
        </div>
      )}
    </>
  )
}

function MessageBubble({ message, streaming }: { message: Message; streaming: boolean }) {
  const isUser = message.role === 'user'
  const empty = !message.content

  return (
    <div className={cn('flex gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg',
          isUser
            ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200'
            : 'bg-gradient-to-br from-bhutan-maroon to-bhutan-maroon-dark text-bhutan-gold'
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3.5 py-2.5',
          isUser
            ? 'bg-bhutan-maroon text-white rounded-tr-sm'
            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-sm shadow-sm'
        )}
      >
        {empty && streaming ? (
          <div className="flex items-center gap-1.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-bhutan-maroon/60 dark:bg-bhutan-gold/60 animate-bounce [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-bhutan-maroon/60 dark:bg-bhutan-gold/60 animate-bounce [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-bhutan-maroon/60 dark:bg-bhutan-gold/60 animate-bounce" />
          </div>
        ) : isUser ? (
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="break-words">
            <Markdown content={message.content} />
            {streaming && <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-bhutan-maroon dark:bg-bhutan-gold animate-pulse align-middle" />}
          </div>
        )}
      </div>
    </div>
  )
}
