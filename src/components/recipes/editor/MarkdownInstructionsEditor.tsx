import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MarkdownInstructionsEditorProps {
  instructions: string
  error?: string
  onChange: (value: string) => void
  onBlur: () => void
}

/**
 * MarkdownInstructionsEditor Component
 *
 * Editor for recipe instructions with Markdown support.
 * Features split view with live preview.
 *
 * Split View Layout:
 * - Left: Textarea for editing
 * - Right: Rendered Markdown preview
 * - Toggle button to show/hide preview
 *
 * Markdown Support:
 * - Headers (# ## ###)
 * - Lists (ordered and unordered)
 * - Bold, italic, code
 * - Links
 * - XSS protection via react-markdown + rehype-sanitize
 *
 * Note: react-markdown will be installed separately
 * For now, this is a placeholder that will work without it
 */
export const MarkdownInstructionsEditor = ({
  instructions,
  error,
  onChange,
  onBlur,
}: MarkdownInstructionsEditorProps): JSX.Element => {
  const [showPreview, setShowPreview] = useState(true)

  /**
   * Handles textarea change
   */
  const handleChange = (value: string): void => {
    onChange(value)
  }

  /**
   * Toggles preview visibility
   */
  const togglePreview = (): void => {
    setShowPreview(prev => !prev)
  }

  return (
    <div className="space-y-2">
      {/* Label and toggle button */}
      <div className="flex items-center justify-between">
        <Label htmlFor="recipe-instructions">
          Instructions <span className="text-destructive">*</span>
        </Label>
        <Button type="button" variant="ghost" size="sm" onClick={togglePreview} className="h-8">
          {showPreview ? (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              Hide preview
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Show preview
            </>
          )}
        </Button>
      </div>

      {/* Help text */}
      <p className="text-sm text-muted-foreground">
        You can use Markdown for formatting (e.g.{' '}
        <code className="text-xs bg-muted px-1 py-0.5 rounded">**bold**</code>,{' '}
        <code className="text-xs bg-muted px-1 py-0.5 rounded">- list</code>)
      </p>

      {/* Split view or single view */}
      <div className={cn('grid gap-4', showPreview ? 'lg:grid-cols-2' : 'grid-cols-1')}>
        {/* Textarea */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Edit</div>
          <textarea
            id="recipe-instructions"
            name="instructions"
            placeholder="Describe step by step how to prepare the recipe...&#10;&#10;You can use Markdown:&#10;# Heading&#10;## Subheading&#10;- Bullet point&#10;1. Numbered list&#10;**bold** *italic*"
            value={instructions}
            onChange={e => handleChange(e.target.value)}
            onBlur={onBlur}
            rows={12}
            className={cn(
              'flex min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
              'ring-offset-background placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'resize-y font-mono',
              error && 'border-destructive'
            )}
            aria-invalid={!!error}
            aria-describedby={error ? 'instructions-error' : undefined}
            data-testid="recipe-editor-instructions"
            required
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Preview</div>
            <div
              className={cn(
                'min-h-[300px] w-full rounded-md border border-input bg-muted/30 px-3 py-2',
                'prose prose-sm max-w-none dark:prose-invert'
              )}
            >
              {instructions ? (
                <MarkdownPreview content={instructions} />
              ) : (
                <p className="text-muted-foreground italic">
                  Instructions preview will appear here...
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p id="instructions-error" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * MarkdownPreview Component
 *
 * Renders Markdown content safely.
 * This is a placeholder implementation that will be replaced
 * with react-markdown once the library is installed.
 *
 * For now, it does basic text rendering with line breaks.
 */
const MarkdownPreview = ({ content }: { content: string }): JSX.Element => {
  // TODO: Replace with react-markdown + remark-gfm + rehype-sanitize
  // For now, render as plain text with basic formatting

  // Simple markdown-like rendering (temporary until react-markdown is installed)
  const renderSimpleMarkdown = (text: string): JSX.Element => {
    const lines = text.split('\n')

    return (
      <div className="space-y-2">
        {lines.map((line, index) => {
          // Headers
          if (line.startsWith('# ')) {
            return (
              <h1 key={index} className="text-2xl font-bold mt-4">
                {line.slice(2)}
              </h1>
            )
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={index} className="text-xl font-bold mt-3">
                {line.slice(3)}
              </h2>
            )
          }
          if (line.startsWith('### ')) {
            return (
              <h3 key={index} className="text-lg font-bold mt-2">
                {line.slice(4)}
              </h3>
            )
          }

          // Lists
          if (line.match(/^\d+\.\s/)) {
            return (
              <li key={index} className="ml-4">
                {line.replace(/^\d+\.\s/, '')}
              </li>
            )
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <li key={index} className="ml-4 list-disc">
                {line.slice(2)}
              </li>
            )
          }

          // Empty line
          if (line.trim() === '') {
            return <br key={index} />
          }

          // Regular paragraph
          return <p key={index}>{line}</p>
        })}
      </div>
    )
  }

  return renderSimpleMarkdown(content)
}
