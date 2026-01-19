import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
}

/**
 * Component displaying empty state
 * Used when there is no data to display
 */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        {Icon && (
          <div className="mb-4 rounded-full bg-muted p-4">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        {description && <p className="mb-6 text-sm text-muted-foreground">{description}</p>}
        {action && <div>{action}</div>}
      </CardContent>
    </Card>
  )
}
