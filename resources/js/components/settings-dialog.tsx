"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { format } from "date-fns"
import { DatePicker } from "../ui/date-picker"

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (settings: { orderName: string; createdAt: string }) => void
  initialSettings?: {
    orderName: string
    createdAt: string
  }
}

export default function SettingsDialog({
  isOpen,
  onClose,
  onSave,
  initialSettings = {
    orderName: "",
    createdAt: format(new Date(), "MM-dd-yyyy"),
  },
}: SettingsDialogProps) {
  const [orderName, setOrderName] = useState(initialSettings.orderName)
  const [createdAt, setCreatedAt] = useState(initialSettings.createdAt)

  const handleSave = () => {
    onSave({
      orderName,
      createdAt,
    })
    toast.success("Order settings saved")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Order Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="order-name">Name</Label>
            <Input
              id="order-name"
              value={orderName}
              onChange={(e) => setOrderName(e.target.value)}
              placeholder="Enter order name"
            />
            <p className="text-sm text-muted-foreground">Define the order name.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="created-at">Created At</Label>
            <DatePicker
              date={createdAt}
              onDateChange={(date) => setCreatedAt(format(date, "MM-dd-yyyy"))}
            />

            <p className="text-sm text-muted-foreground">Define the date of creation of the order.</p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
