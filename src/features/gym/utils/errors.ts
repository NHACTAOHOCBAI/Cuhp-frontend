/**
 * Toast helpers for the Gym feature.
 *
 * All catch blocks in the Gym flow route through `toastError` so the
 * fallback message is consistent (matches audio/vocabulary/reading pattern).
 */
import { toast } from "sonner"

export function toastError(err: unknown, fallback: string): void {
  const msg = err instanceof Error ? err.message : fallback
  toast.error(msg)
}

export function toastSuccess(message: string): void {
  toast.success(message)
}
