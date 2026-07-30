import * as React from "react"
import { cn } from "@/lib/utils"

interface SheetContextValue {
  open: boolean
  setOpen: (v: boolean) => void
  side: "left" | "right" | "top" | "bottom"
}

const SheetContext = React.createContext<SheetContextValue | null>(null)

function useSheet() {
  const ctx = React.useContext(SheetContext)
  if (!ctx) throw new Error("Sheet sub-components must be inside <Sheet>")
  return ctx
}

export function Sheet({
  open,
  onOpenChange,
  side = "right",
  children,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  side?: "left" | "right" | "top" | "bottom"
  children: React.ReactNode
}) {
  React.useEffect(() => {
    if (!open) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    document.addEventListener("keydown", handleEscape)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [open, onOpenChange])

  return (
    <SheetContext.Provider value={{ open, setOpen: onOpenChange, side }}>
      {open ? children : null}
    </SheetContext.Provider>
  )
}

export function SheetContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { setOpen, side } = useSheet()

  const sideClass = {
    left: "inset-y-0 left-0 h-full w-3/4 max-w-sm border-r",
    right: "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l",
    top: "inset-x-0 top-0 w-full max-h-[80vh] border-b",
    bottom: "inset-x-0 bottom-0 w-full max-h-[80vh] border-t",
  }[side]

  const slideClass = {
    left: "animate-in slide-in-from-left",
    right: "animate-in slide-in-from-right",
    top: "animate-in slide-in-from-top",
    bottom: "animate-in slide-in-from-bottom",
  }[side]

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div
        className={cn(
          "fixed z-50 gap-4 bg-background shadow-lg",
          sideClass,
          slideClass,
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}