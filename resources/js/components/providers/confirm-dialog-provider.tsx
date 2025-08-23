"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createContext, useCallback, useContext, useState } from "react"
import type { ReactNode } from "react"

type ConfirmOptions = {
  title?: string
  message?: string
  content?: ReactNode
  confirmText?: string
  cancelText?: string
}

type ConfirmDialogContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | null>(null)

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({})
  const [resolver, setResolver] = useState<(value: boolean) => void>()

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions({
      ...opts, // defaults overridden by caller
    })
    setOpen(true)
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve)
    })
  }, [])

  const handleClose = (result: boolean) => {
    setOpen(false)
    resolver?.(result)
  }

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title ?? "Confirm Action"}</AlertDialogTitle>
            {options.message && (
              <AlertDialogDescription>{options.message}</AlertDialogDescription>
            )}
          </AlertDialogHeader>

          {options.content && (
            <div className="my-4">{options.content}</div>
          )}

          <AlertDialogFooter>
            {options.cancelText && (
              <AlertDialogCancel onClick={() => handleClose(false)}>
                {options.cancelText}
              </AlertDialogCancel>
            )}
            {options.confirmText && (
              <AlertDialogAction onClick={() => handleClose(true)}>
                {options.confirmText}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmDialogContext.Provider>
  )
}

export function useConfirmDialog() {
  const ctx = useContext(ConfirmDialogContext)
  if (!ctx) {
    throw new Error("useConfirmDialog must be used inside ConfirmDialogProvider")
  }
  return ctx.confirm
}

