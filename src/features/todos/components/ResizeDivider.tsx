import { type RefObject } from "react"
import { cn } from "@/lib/utils"
import type { UseResizeHandleResult } from "@/hooks/useResizeHandle"

export interface ResizeDividerProps {
  handleRef: RefObject<HTMLDivElement | null>
  handleProps: UseResizeHandleResult["handleProps"]
  isDragging: boolean
  isHovering: boolean
  currentWidth: number
  min: number
  max: number
  label: string
  hidden?: boolean
}

/**
 * Vertical separator the user can drag to resize an adjacent column.
 * Visually minimal: a 1px line that thickens on hover/drag, plus three tiny grip dots.
 */
export function ResizeDivider({
  handleRef,
  handleProps,
  isDragging,
  isHovering,
  currentWidth,
  min,
  max,
  label,
  hidden = false,
}: ResizeDividerProps) {
  const active = isHovering || isDragging
  return (
    <div
      ref={handleRef}
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={Math.round(currentWidth)}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-label={label}
      tabIndex={hidden ? -1 : 0}
      {...handleProps}
      style={{ touchAction: "none" }}
      className={cn(
        "group relative shrink-0 self-stretch cursor-col-resize select-none",
        "w-1.5 mx-3",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm",
        hidden && "hidden lg:flex pointer-events-none"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border transition-all duration-150",
          active && "w-[2px] bg-foreground/40"
        )}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-[3px] opacity-0 transition-opacity duration-150",
          active && "opacity-70"
        )}
      >
        <span className="block h-1 w-1 rounded-full bg-foreground/40" />
        <span className="block h-1 w-1 rounded-full bg-foreground/40" />
        <span className="block h-1 w-1 rounded-full bg-foreground/40" />
      </span>
    </div>
  )
}