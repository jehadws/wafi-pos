
"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useEffect, useState } from "react"

interface PermissionSearchProps {
  onSearch: (query: string) => void
  placeholder?: string
}

export default function PermissionSearch({
  onSearch,
  placeholder = "Press '/' to search permissions",
}: PermissionSearchProps) {
  const [query, setQuery] = useState("")

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        const searchInput = document.getElementById("permission-search") as HTMLInputElement
        searchInput?.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleChange = (value: string) => {
    setQuery(value)
    onSearch(value)
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        id="permission-search"
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-10 h-12 text-base"
      />
    </div>
  )
}
