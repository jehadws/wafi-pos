import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface CommentsDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (note: string, displayOnReceipt: boolean) => void
  initialNote?: string
  initialDisplayOnReceipt?: boolean
}

export default function CommentsDialog({
  isOpen,
  onClose,
  onSave,
  initialNote = "",
  initialDisplayOnReceipt = false,
}: CommentsDialogProps) {
  const [note, setNote] = useState(initialNote)
  const [displayOnReceipt, setDisplayOnReceipt] = useState(initialDisplayOnReceipt)

  const handleSave = () => {
    onSave(note, displayOnReceipt)
    toast.success("Order note saved")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Order Note</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              placeholder="More details about this order"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[150px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Display On Receipt</Label>
            <RadioGroup
              value={displayOnReceipt ? "yes" : "no"}
              onValueChange={(value) => setDisplayOnReceipt(value === "yes")}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="yes" />
                <Label htmlFor="yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no">No</Label>
              </div>
            </RadioGroup>
            <p className="text-sm text-muted-foreground">Will display the note on the receipt</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
