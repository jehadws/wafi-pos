"use client"

import { Button } from "@/components/ui/button"
import { Frown, Plus } from "lucide-react"

interface EmptyStateProps {
  onCreateCategories: () => void
}

export default function EmptyState({ onCreateCategories }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <Frown className="h-10 w-10 text-muted-foreground/60" />
      <h3 className="mt-4 text-lg font-semibold">No products or categories</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Looks like there is either no products and no categories. How about creating those first to get started?
      </p>
      <Button className="mt-4" onClick={onCreateCategories}>
        <Plus className="mr-2 h-4 w-4" />
        Create Categories
      </Button>
    </div>
  )
}
