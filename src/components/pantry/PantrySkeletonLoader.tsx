'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

interface PantrySkeletonLoaderProps {
  variant?: 'table' | 'card'
  count?: number
}

/**
 * PantrySkeletonLoader Component
 *
 * Displays skeleton placeholders while pantry data is loading.
 *
 * Features:
 * - Two variants: table (desktop) and card (mobile)
 * - Configurable number of skeleton items
 * - Matches the layout of actual pantry items
 *
 * @param variant - Display variant: 'table' (default) or 'card'
 * @param count - Number of skeleton items to display (default: 5)
 */
export function PantrySkeletonLoader({ variant = 'table', count = 5 }: PantrySkeletonLoaderProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i)

  if (variant === 'card') {
    // Mobile card skeletons
    return (
      <div className="space-y-4">
        {skeletons.map(index => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Item name */}
                  <Skeleton className="h-5 w-[180px]" />
                  {/* Quantity and unit */}
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[80px]" />
                  </div>
                </div>
                {/* Action buttons */}
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <Skeleton className="h-9 w-9 rounded-md" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Desktop table skeletons
  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-4 text-left font-medium">Name</th>
            <th className="p-4 text-left font-medium">Quantity</th>
            <th className="p-4 text-left font-medium">Unit</th>
            <th className="p-4 text-left font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {skeletons.map(index => (
            <tr key={index} className="border-b">
              <td className="p-4">
                <Skeleton className="h-5 w-[160px]" />
              </td>
              <td className="p-4">
                <Skeleton className="h-5 w-[60px]" />
              </td>
              <td className="p-4">
                <Skeleton className="h-5 w-[80px]" />
              </td>
              <td className="p-4">
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
