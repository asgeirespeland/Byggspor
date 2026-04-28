import { useParams, useNavigate } from 'react-router-dom'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react'
import { articleDefs, type ArticleId } from './articles/articleDefs'
import { articleContent } from './articles/articleContent'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'

function ArticleNavItem({
  def,
  activeId,
  onSelect,
}: {
  def: (typeof articleDefs)[number]
  activeId: ArticleId
  onSelect: (id: ArticleId) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(def.id)}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-left w-full transition-colors cursor-pointer ${
        activeId === def.id
          ? 'bg-violet-600/10 text-violet-600 dark:text-violet-400'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {def.icon}
      {def.label}
    </button>
  )
}

export default function WikiPage() {
  const { articleId } = useParams<{ articleId: string }>()
  const navigate = useNavigate()

  const activeId = (
    articleDefs.some((d) => d.id === articleId) ? articleId : 'intro'
  ) as ArticleId
  const activeIndex = articleDefs.findIndex((d) => d.id === activeId)
  const active = articleDefs[activeIndex]
  const prev = articleDefs[activeIndex - 1] ?? null
  const next = articleDefs[activeIndex + 1] ?? null
  const content = articleContent[activeId]

  function handleSelect(id: ArticleId) {
    navigate(`/wiki/${id}`)
  }

  function handleLinkClick(href: string | undefined) {
    if (!href) return
    if (href.startsWith('/wiki/')) {
      navigate(href)
    } else {
      window.open(href, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col flex-1 min-h-0 rounded-xl bg-card border border-border overflow-hidden">
        {/* Mobile burger header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border shrink-0 md:hidden">
          <Sheet>
            <SheetTrigger
              className="flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer shrink-0"
              aria-label="Åpne meny"
            >
              <Menu className="h-4 w-4" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="px-4 pt-5 pb-3 border-b border-border">
                <SheetTitle>Innhold</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 p-2 pt-3">
                {articleDefs.map((def) => (
                  <SheetClose key={def.id} render={<span />}>
                    <ArticleNavItem
                      def={def}
                      activeId={activeId}
                      onSelect={handleSelect}
                    />
                  </SheetClose>
                ))}
              </div>
            </SheetContent>
          </Sheet>
          <span className="text-sm text-muted-foreground">{active.label}</span>
        </div>

        {/* Scrollable article content */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-6 md:px-8 py-6 md:py-8">
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold text-foreground mb-6">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-semibold text-foreground mt-6 mb-2">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-sm text-foreground/90 leading-relaxed mb-3">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="text-sm text-foreground/90 leading-relaxed mb-3 list-disc pl-5 space-y-1">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="text-sm text-foreground/90 leading-relaxed mb-3 list-decimal pl-5 space-y-1">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed">{children}</li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">
                  {children}
                </strong>
              ),
              em: ({ children }) => <em className="italic">{children}</em>,
              a: ({ href, children }) => (
                <button
                  type="button"
                  onClick={() => handleLinkClick(href)}
                  className="text-violet-600 dark:text-violet-400 underline underline-offset-2 hover:opacity-80 cursor-pointer"
                >
                  {children}
                </button>
              ),
              code: ({ children }) => (
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">
                  {children}
                </code>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-border pl-4 text-sm text-muted-foreground italic mb-3">
                  {children}
                </blockquote>
              ),
            }}
          >
            {content}
          </Markdown>
        </div>

        {/* Pinned prev/next footer */}
        <div className="shrink-0 flex items-center justify-between px-6 md:px-8 py-4 border-t border-border">
          {prev ? (
            <button
              type="button"
              onClick={() => navigate(`/wiki/${prev.id}`)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
            >
              <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>
                <span className="block text-xs text-muted-foreground/60 mb-0.5">
                  Forrige
                </span>
                {prev.label}
              </span>
            </button>
          ) : (
            <div />
          )}

          {next && (
            <button
              type="button"
              onClick={() => navigate(`/wiki/${next.id}`)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group text-right"
            >
              <span>
                <span className="block text-xs text-muted-foreground/60 mb-0.5">
                  Neste
                </span>
                {next.label}
              </span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
