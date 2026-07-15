'use client'

import { memo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

function CodeBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(children))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }
  return (
    <div className="relative group my-2">
      <pre className="overflow-x-auto rounded-lg bg-slate-900 text-slate-100 p-3 text-[11px] leading-relaxed border border-slate-700/60 dark:border-slate-700">
        <code className={className}>{children}</code>
      </pre>
      <button
        onClick={copy}
        aria-label="Copy code"
        className="absolute top-1.5 right-1.5 p-1 rounded-md bg-slate-800/80 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-700"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  )
}

export const Markdown = memo(function Markdown({ content }: { content: string }) {
  return (
    <div
      className={cn(
        'text-[13px] leading-relaxed',
        '[&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0',
        '[&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5',
        '[&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5',
        '[_li]:my-0.5',
        '[_strong]:font-bold',
        '[_h1]:text-base [&_h1]:font-black [&_h1]:mt-3 [&_h1]:mb-1.5',
        '[_h2]:text-sm [&_h2]:font-black [&_h2]:mt-2.5 [&_h2]:mb-1',
        '[_h3]:text-[13px] [&_h3]:font-bold [&_h3]:mt-2 [&_h3]:mb-1',
        '[_a]:text-bhutan-maroon dark:[&_a]:text-bhutan-gold [_a]:font-semibold [_a]:underline [_a]:underline-offset-2',
        '[_blockquote]:border-l-2 [&_blockquote]:border-bhutan-maroon/40 dark:[&_blockquote]:border-bhutan-gold/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-slate-500 dark:[&_blockquote]:text-slate-400',
        '[_hr]:my-3 [&_hr]:border-slate-200 dark:[&_hr]:border-slate-700',
        '[_table]:w-full [&_table]:text-[11px] [&_table]:my-2',
        '[_th]:font-bold [&_th]:text-left [&_th]:px-2 [&_th]:py-1 [&_th]:border [&_th]:border-slate-200 dark:[&_th]:border-slate-700',
        '[_td]:px-2 [&_td]:py-1 [&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-slate-700'
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ ...props }) => <a target="_blank" rel="noopener noreferrer" {...props} />,
          // Avoid nested <pre> — let the code handler below render its own <pre>
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            if (match) {
              return <CodeBlock className={className}>{String(children).replace(/\n$/, '')}</CodeBlock>
            }
            return (
              <code
                className="rounded bg-slate-200/70 dark:bg-slate-700/60 px-1 py-0.5 text-[11px] font-mono"
                {...props}
              >
                {children}
              </code>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})
