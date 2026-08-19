import * as React from "react"
import { type RefObject } from "react"

/**
 * Direction of the resize handle relative to the target column.
 * - "left"  : handle sits on the LEFT edge of the target → dragging RIGHT shrinks the target (width = startWidth - dx).
 * - "right" : handle sits on the RIGHT edge of the target → dragging RIGHT widens the target (width = startWidth + dx).
 */
export type ResizeDirection = "left" | "right"

export interface UseResizeHandleOptions {
  handleRef: RefObject<HTMLElement | null>
  targetRef?: RefObject<HTMLElement | null>
  width: number
  /** Receives the new width in px (not clamped — caller clamps). */
  onResize: (nextWidth: number) => void
  min: number
  max: number
  /** Pixel step for keyboard arrows. Default 8. */
  step?: number
  direction: ResizeDirection
  /** When true, the hook is inert (e.g. column collapsed, or another drag is in progress). */
  disabled?: boolean
  /**
    Optional minimum total width the rest of the layout needs (used to clamp against viewport).
    If provided, width is additionally clamped so that window.innerWidth - width >= minContainerWidth.
    */
  minContainerWidth?: number
}

export interface UseResizeHandleResult {
  handleProps: {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => void
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void
    onPointerEnter: (e: React.PointerEvent<HTMLElement>) => void
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => void
  }
  isDragging: boolean
  isHovering: boolean
}

/**
 * Generic horizontal resize handle hook.
 *
 * Drives a width via pointer drag or keyboard. Window-level pointermove/pointerup are
 * attached while dragging so the gesture survives the cursor leaving the handle.
 *
 * `onPointerDown` calls `preventDefault` + `stopPropagation` so the @dnd-kit/core
 * PointerSensor (which listens at the document level) does NOT start a task drag.
 */
export function useResizeHandle(opts: UseResizeHandleOptions): UseResizeHandleResult {
  const {
    handleRef,
    targetRef,
    width,
    onResize,
    min,
    max,
    step = 8,
    direction,
    disabled = false,
    minContainerWidth,
  } = opts

  const [isDragging, setIsDragging] = React.useState(false)
  const [isHovering, setIsHovering] = React.useState(false)

  // Refs hold live drag state without re-binding window listeners.
  const startXRef = React.useRef(0)
  const startWidthRef = React.useRef(0)
  const pointerIdRef = React.useRef<number | null>(null)
  const widthRef = React.useRef(width)
  const onResizeRef = React.useRef(onResize)
  const directionRef = React.useRef(direction)
  const minRef = React.useRef(min)
  const maxRef = React.useRef(max)
  const minContainerRef = React.useRef(minContainerWidth)

  React.useEffect(() => {
    widthRef.current = width
    onResizeRef.current = onResize
    directionRef.current = direction
    minRef.current = min
    maxRef.current = max
    minContainerRef.current = minContainerWidth
  })

  const clamp = React.useCallback((value: number) => {
    const lo = minRef.current
    const hi = maxRef.current
    let next = Math.min(hi, Math.max(lo, value))
    const containerMin = minContainerRef.current
    if (typeof window !== "undefined" && containerMin) {
      const viewportCap = window.innerWidth - containerMin
      if (viewportCap < hi) {
        next = Math.min(next, Math.max(lo, viewportCap))
      }
    }
    return next
  }, [])

  // Window-level pointer listeners — bound only while dragging.
  React.useEffect(() => {
    if (!isDragging) return

    const handleMove = (e: PointerEvent) => {
      const dx = e.clientX - startXRef.current
      const base = startWidthRef.current
      const dir = directionRef.current
      const nextRaw = dir === "right" ? base + dx : base - dx
      const next = clamp(nextRaw)
      onResizeRef.current(next)
    }

    const handleUp = (e: PointerEvent) => {
      const pid = pointerIdRef.current
      if (pid !== null && handleRef.current) {
        try {
          handleRef.current.releasePointerCapture(pid)
        } catch {
          // ignore: pointer may have already been released
        }
      }
      pointerIdRef.current = null
      setIsDragging(false)
      setIsHovering(false)
      if (typeof document !== "undefined") {
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
      }
      // Prevent stray click after a drag.
      e.preventDefault()
    }

    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", handleUp)
    window.addEventListener("pointercancel", handleUp)

    return () => {
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", handleUp)
      window.removeEventListener("pointercancel", handleUp)
    }
  }, [isDragging, clamp, handleRef])

  const handleProps = React.useMemo(
    () => ({
      onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
        if (disabled) return
        // Only react to the primary button.
        if (e.button !== 0) return
        // Critical: prevent the @dnd-kit PointerSensor from starting a task drag.
        e.preventDefault()
        e.stopPropagation()
        const node = handleRef.current
        if (!node) return
        try {
          node.setPointerCapture(e.pointerId)
          pointerIdRef.current = e.pointerId
        } catch {
          pointerIdRef.current = null
        }
        startXRef.current = e.clientX
        startWidthRef.current = widthRef.current
        if (typeof document !== "undefined") {
          document.body.style.cursor = "col-resize"
          document.body.style.userSelect = "none"
        }
        setIsDragging(true)
      },
      onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
        if (disabled) return
        const cur = widthRef.current
        const lo = minRef.current
        const hi = maxRef.current
        let next: number | null = null
        if (e.key === "ArrowLeft") next = cur - step
        else if (e.key === "ArrowRight") next = cur + step
        else if (e.key === "Home") next = lo
        else if (e.key === "End") next = hi
        if (next !== null) {
          e.preventDefault()
          onResizeRef.current(clamp(next))
        }
      },
      onPointerEnter: (_e: React.PointerEvent<HTMLElement>) => {
        if (!disabled) setIsHovering(true)
      },
      onPointerLeave: (_e: React.PointerEvent<HTMLElement>) => {
        if (!isDragging) setIsHovering(false)
      },
    }),
    [disabled, handleRef, step, clamp, isDragging]
  )

  // Optional measurement fallback (targetRef) is unused right now but kept for future use.
  void targetRef

  return { handleProps, isDragging, isHovering }
}