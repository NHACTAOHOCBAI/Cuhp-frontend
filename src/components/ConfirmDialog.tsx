import * as React from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

export type ConfirmOptions = {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
}

type Pending = { options: ConfirmOptions; resolve: (v: boolean) => void }

let externalEnqueue: ((opts: ConfirmOptions, resolve: (v: boolean) => void) => void) | null = null

/**
 * Hook to show a confirmation dialog. Returns a function that resolves to true (confirmed) or false (cancelled).
 *
 * @example
 *   const confirm = useConfirm()
 *   if (!await confirm({ title: "Xóa?", description: "...", variant: "destructive" })) return
 */
export function useConfirm() {
  return React.useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      if (externalEnqueue) {
        externalEnqueue(options, resolve)
      } else {
        // ConfirmDialogHost not mounted yet — auto-resolve false so the caller proceeds safely
        resolve(false)
      }
    })
  }, [])
}

export function ConfirmDialogHost() {
  const [current, setCurrent] = React.useState<Pending | null>(null)
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    externalEnqueue = (options, resolve) => {
      setCurrent({ options, resolve })
      setOpen(true)
    }
    return () => {
      externalEnqueue = null
    }
  }, [])

  const handleClose = React.useCallback(
    (result: boolean) => {
      setOpen(false)
      current?.resolve(result)
      // Clear options after close animation
      setTimeout(() => setCurrent(null), 200)
    },
    [current]
  )

  if (!current) return null

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) handleClose(false) }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{current.options.title}</AlertDialogTitle>
          {current.options.description && (
            <AlertDialogDescription>{current.options.description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => handleClose(false)}>
            {current.options.cancelText ?? "Hủy"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => handleClose(true)}
            className={cn(
              current.options.variant === "destructive" &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            {current.options.confirmText ?? "Xác nhận"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}