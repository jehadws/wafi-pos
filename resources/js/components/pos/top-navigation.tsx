"use client"

import { Button } from "@/components/ui/button"
import { Home, Barcode, Percent } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TopNavigationProps {
  isListeningForBarcodes: boolean
  toggleBarcodeListening: () => void
  applyAutoMargin: () => void
}

export default function TopNavigation({
  isListeningForBarcodes,
  toggleBarcodeListening,
  applyAutoMargin,
}: TopNavigationProps) {
  return (
    <header className="border-b bg-card px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold">POS System</h1>
        </div>
        <div className="flex items-center space-x-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                  <Switch id="barcode-mode" checked={isListeningForBarcodes} onCheckedChange={toggleBarcodeListening} />
                  <Label htmlFor="barcode-mode" className="flex items-center cursor-pointer">
                    <Barcode className="h-4 w-4 mr-1" />
                    Barcode Mode
                    {isListeningForBarcodes && (
                      <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 border-green-200">
                        Active
                      </Badge>
                    )}
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>When enabled, automatically adds scanned items to cart</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={applyAutoMargin} className="flex items-center">
                  <Percent className="mr-2 h-4 w-4" />
                  Auto-Margin
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Apply consistent margin to same items</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button variant="outline" size="sm">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </div>
      </div>
    </header>
  )
}
