'use client'

import { useState } from 'react'
import { AiRecipeGenerationButton } from '@/components/recipes/AiRecipeGenerationButton'
import { AiRecipeGenerationModal } from '@/components/recipes/AiRecipeGenerationModal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'

/**
 * Recipes Page
 *
 * Main page for managing and viewing recipes.
 *
 * Features:
 * - AI Recipe Generation button in toolbar
 * - Modal for generating recipes with AI
 * - List of recipes (placeholder for now - to be implemented)
 *
 * State Management:
 * - `modalOpen`: controls visibility of AI generation modal
 * - Uses local state for simple modal control
 * - Could be extended to use query params for deep linking
 */
export default function RecipesPage() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Recipes</h1>
            <p className="text-muted-foreground mt-1">
              Manage your recipes and generate new ones with AI
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex gap-2">
            <AiRecipeGenerationButton onOpen={() => setModalOpen(true)} />
          </div>
        </div>

        {/* Recipes List - Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Your Recipes
            </CardTitle>
            <CardDescription>
              Recipes you&apos;ve created or generated with AI will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No recipes yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by generating your first recipe with AI
              </p>
              <AiRecipeGenerationButton onOpen={() => setModalOpen(true)} />
            </div>
          </CardContent>
        </Card>

        {/* AI Recipe Generation Modal */}
        <AiRecipeGenerationModal open={modalOpen} onOpenChange={setModalOpen} />
      </div>
    </div>
  )
}
