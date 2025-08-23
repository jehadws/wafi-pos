import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import SelectableItem from "@/components/ui/selectable-item"

interface ActionSelectorModalProps {
  actions: { [key: string]: string }
  isOpen: boolean
  onClose: () => void
  onSelect: (action: { key: string; label: string }) => void
  selectedAction?: { key: string; label: string } | null
}

export function ActionSelectorModal({
  actions,
  isOpen,
  onClose,
  onSelect,
  selectedAction,
}: ActionSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const actionsArray = Object.keys(actions).map((key) => ({
    key,
    label: actions[key],
  }))

  const filteredActions = actionsArray.filter((action) =>
    action.label.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSelect = (action: { key: string; label: string }) => {
    onSelect(action)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="relative">
          <DialogTitle className="text-center">Choose Action</DialogTitle>
        </DialogHeader>

        <div className="bg-accent/30 p-3 rounded text-center text-sm text-primary mb-4">
          Choose the action you want to perform.
        </div>

        <Input
          placeholder="Search for options"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />

        <div className="max-h-80 overflow-y-auto space-y-1">
          {filteredActions.map((action) => (
            <SelectableItem onChange={() => handleSelect(action)} label={action.label} value={action.key} key={action.key} selected={action?.key === selectedAction?.key} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
