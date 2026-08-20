/**
 * Lightweight styled Select component.
 * - Trigger button styled like the existing Input
 * - Dropdown panel positioned below the trigger
 * - Keyboard navigation: ArrowUp/Down, Enter, Escape
 * - Click-outside to close
 */
import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: string
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  className,
  ariaLabel,
  position = "below",
}: {
  value: string
  onChange: (v: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  ariaLabel?: string
  /**
   * Where the dropdown panel opens relative to the trigger.
   * - "below" (default): panel sits below the trigger
   * - "above": panel sits above the trigger — use when the trigger is
   *   near the bottom of a clipped/overflow container so the panel
   *   is not hidden behind sibling content.
   */
  position?: "below" | "above"
}) {
  const [open, setOpen] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const selected = options.find((o) => o.value === value)

  // Close on click outside
  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  // Reset active index whenever dropdown opens
  React.useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value)
      setActiveIndex(idx >= 0 ? idx : 0)
    }
  }, [open, options, value])

  const handleSelect = (opt: SelectOption) => {
    onChange(opt.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === "Escape") {
      e.preventDefault()
      setOpen(false)
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, options.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const opt = options[activeIndex]
      if (opt) handleSelect(opt)
    }
  }

  return (
    <div ref={wrapRef} className={cn("relative", className)} onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
          "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <span className={cn("truncate text-left", !selected && "text-muted-foreground")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className={cn(
            "absolute z-50 w-full overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
            position === "above" ? "bottom-full mb-1" : "mt-1",
          )}
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value
            const isActive = i === activeIndex
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => handleSelect(opt)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm",
                  isActive && "bg-accent text-accent-foreground",
                )}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}