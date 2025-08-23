"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import SelectableItem from "@/components/ui/selectable-item"

interface AccountSelectorModalProps {
  accounts: TransactionAccount[]
  isOpen: boolean
  onClose: () => void
  onSelect: (account: TransactionAccount) => void
  selectedAccount?: TransactionAccount | null
}

export function AccountSelectorModal({ accounts, isOpen, onClose, onSelect, selectedAccount }: AccountSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredAccounts = accounts.filter((account) => account.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleSelect = (account: TransactionAccount) => {
    onSelect(account)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="relative">
          <DialogTitle className="text-center">Choose Account</DialogTitle>
        </DialogHeader>

        <div className="bg-accent/30 p-3 rounded text-center text-sm text-primary mb-4">
          Choose the account you want to use
        </div>

        <Input
          placeholder="Search for options"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />

        <div className="max-h-80 overflow-y-auto space-y-1">
          {filteredAccounts.map((account) => (
            <SelectableItem onChange={() => handleSelect(account)} label={account.name} value={account.id} key={account.id} selected={selectedAccount?.id === account.id} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

