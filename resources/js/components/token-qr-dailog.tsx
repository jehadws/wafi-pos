"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Copy } from "lucide-react"
import QRCode from "./qr-code"

interface TokenModalProps {
  isOpen: boolean
  onClose: () => void
  tokenName: string
  tokenValue: string
}

export function TokenQrDialog({ isOpen, onClose, tokenName, tokenValue }: TokenModalProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tokenValue)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
      onClose()
    }, 500)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">API Token</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          {/* QR Code - Generated locally */}
          <div className="border border-slate-200 p-2 bg-white">
            <div className="w-[200px] h-[200px] flex items-center justify-center">
              <QRCode value={tokenValue} size={200} />
            </div>
          </div>

          <p className="text-sm text-slate-600 text-center">
            This QR code is provided to ease authentication on external applications.
          </p>

          <p className="text-center text-sm text-slate-700 max-w-md">
            The API token has been generated. Make sure to copy this code in a safe place as it will only be displayed
            once. If you lose this token, you'll need to revoke it and generate a new one.
          </p>

          {/* Token Display */}
          <div className="w-full">
            <Input value={tokenValue} readOnly className="font-mono text-sm bg-blue-50 border-blue-200 select-all" />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={copyToClipboard} className="bg-blue-600 hover:bg-blue-700">
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy And Close
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

