/**
 * Date helpers for the Gym feature.
 *
 * Centralises all date formatting/calendar math used by week navigation,
 * the schedule picker, and chart tooltips.
 */

/** Get the Monday of the week that contains `d` (start-of-week = Monday). */
export function getMonday(d: Date): Date {
  const target = new Date(d)
  const day = target.getDay()
  const diff = target.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(target.setDate(diff))
}

/** Format a date as ISO `YYYY-MM-DD` (used as a query-param value). */
export function formatDateToISO(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const date = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${date}`
}

/** Format a date as `DD/MM` (Vietnamese locale). */
export function formatDateToDisplay(d: Date): string {
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
}

/** Vietnamese long day name (e.g. "Thứ 2", "Chủ nhật"). */
export function getDayName(d: Date): string {
  const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]
  return days[d.getDay()]
}

/** Vietnamese short day name (e.g. "T2", "CN"). */
export function getDayShortName(d: Date): string {
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
  return days[d.getDay()]
}
