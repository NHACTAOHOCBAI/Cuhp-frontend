/**
 * Due-date helpers for the Todo feature.
 *
 * Due dates travel as bare ISO `YYYY-MM-DD` strings (no timezone), so all
 * comparisons here are done on the string/local-date level to avoid the
 * off-by-one that `new Date("2026-08-17")` (parsed as UTC) would introduce.
 */

/** Today as ISO `YYYY-MM-DD` in the user's local timezone. */
export function todayISO(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** Parse a bare `YYYY-MM-DD` as a *local* midnight Date. */
export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

/** Whole days from today to `iso` (negative = in the past). */
export function daysUntil(iso: string): number {
  const target = parseISODate(iso).getTime()
  const today = parseISODate(todayISO()).getTime()
  return Math.round((target - today) / 86_400_000)
}

export function isOverdue(iso: string | null | undefined): boolean {
  if (!iso) return false
  return daysUntil(iso) < 0
}

export function isDueToday(iso: string | null | undefined): boolean {
  if (!iso) return false
  return daysUntil(iso) === 0
}

/**
 * Human label for a deadline: "Hôm nay", "Ngày mai", "Quá hạn 3 ngày",
 * or a plain `DD/MM` date once it is further out than a week.
 */
export function formatDueLabel(iso: string | null | undefined): string {
  if (!iso) return "Không hạn"
  const diff = daysUntil(iso)
  if (diff === 0) return "Hôm nay"
  if (diff === 1) return "Ngày mai"
  if (diff === -1) return "Quá hạn 1 ngày"
  if (diff < -1) return `Quá hạn ${Math.abs(diff)} ngày`
  if (diff <= 7) return `Còn ${diff} ngày`
  return parseISODate(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  })
}

/** Short `DD/MM` label used on chart axes. */
export function formatShortDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  })
}

/** Vietnamese short weekday (e.g. "T2", "CN") for a bare ISO date. */
export function getDayShortName(iso: string): string {
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
  return days[parseISODate(iso).getDay()]
}
