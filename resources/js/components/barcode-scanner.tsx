import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Barcode, Camera, X } from "lucide-react"
import { toast } from "sonner"

interface BarcodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (barcode: string) => void
}

export default function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const [barcode, setBarcode] = useState("")
  const [isScanning, setIsScanning] = useState(false)

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setBarcode("")
      setIsScanning(false)
    }
  }, [isOpen])

  const handleManualEntry = () => {
    if (barcode.trim()) {
      onScan(barcode)
    }
  }

  const startScanning = () => {
    setIsScanning(true)
    // In a real implementation, this would activate the camera and barcode scanner
    // For this demo, we'll simulate scanning after a short delay
    setTimeout(() => {
      // Simulate a successful scan with a random product barcode
      const sampleBarcodes = [
        "1234567890123", // Coffee
        "2234567890123", // Sandwich
        "3234567890123", // Muffin
        "4234567890123", // Salad
        "5234567890123", // Tea
      ]
      const randomBarcode = sampleBarcodes[Math.floor(Math.random() * sampleBarcodes.length)]
      setBarcode(randomBarcode)
      setIsScanning(false)

      toast.success("Barcode detected", {
        description: randomBarcode,
      })
    }, 2000)
  }

  const stopScanning = () => {
    setIsScanning(false)
    toast.info("Scanning cancelled")
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Barcode className="mr-2 h-5 w-5" />
            Barcode Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          {isScanning ? (
            <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* This would be a camera view in a real implementation */}
                <div className="animate-pulse flex flex-col items-center justify-center">
                  <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Scanning...</p>
                </div>
              </div>

              {/* Scanning animation */}
              <div className="absolute left-0 right-0 h-0.5 bg-primary animate-[scan_2s_ease-in-out_infinite]" />

              <Button variant="secondary" size="sm" className="absolute top-2 right-2" onClick={stopScanning}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Enter barcode manually"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleManualEntry} disabled={!barcode.trim()}>
                  Add
                </Button>
              </div>

              <div className="flex justify-center">
                <div className="w-px h-6 bg-border" />
              </div>

              <Button onClick={startScanning} variant="outline" className="w-full">
                <Camera className="mr-2 h-4 w-4" />
                Scan Barcode
              </Button>
            </>
          )}
        </div>

        <DialogFooter className="sm:justify-start">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
