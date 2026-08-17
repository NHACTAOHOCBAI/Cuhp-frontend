/**
 * Category color tokens for workout groups.
 *
 * Each category carries a semantic `color` string (e.g. "blue") that maps
 * to a small bundle of Tailwind utility classes. Keeping this in one place
 * avoids duplicating the same color rules across dialogs, list rows, and
 * the color-picker UI.
 */

export type CategoryColor =
  | "blue"
  | "emerald"
  | "violet"
  | "amber"
  | "cyan"
  | "rose"
  | "orange"

export interface ColorClasses {
  /** Soft tinted background + text + border, e.g. for badges. */
  bg: string
  /** Solid dot color, e.g. for grid cards. */
  dot: string
  /** Solid background + white text, e.g. for the selected picker pill. */
  badge: string
}

export const COLOR_LABELS: Record<CategoryColor, string> = {
  blue: "Xanh dương",
  emerald: "Lục",
  violet: "Tím",
  amber: "Vàng",
  cyan: "Lam",
  rose: "Hồng",
  orange: "Cam",
}

export const AVAILABLE_COLORS: CategoryColor[] = [
  "blue",
  "emerald",
  "violet",
  "amber",
  "cyan",
  "rose",
  "orange",
]

export const DEFAULT_COLOR: CategoryColor = "blue"

export function getColorClasses(color: string): ColorClasses {
  switch (color as CategoryColor) {
    case "blue":
      return {
        bg: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
        dot: "bg-blue-500",
        badge: "bg-blue-500 text-white",
      }
    case "emerald":
      return {
        bg: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
        dot: "bg-emerald-500",
        badge: "bg-emerald-500 text-white",
      }
    case "violet":
      return {
        bg: "bg-violet-500/10 text-violet-500 border border-violet-500/20",
        dot: "bg-violet-500",
        badge: "bg-violet-500 text-white",
      }
    case "amber":
      return {
        bg: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
        dot: "bg-amber-500",
        badge: "bg-amber-500 text-white",
      }
    case "cyan":
      return {
        bg: "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20",
        dot: "bg-cyan-500",
        badge: "bg-cyan-500 text-white",
      }
    case "rose":
      return {
        bg: "bg-rose-500/10 text-rose-500 border border-rose-500/20",
        dot: "bg-rose-500",
        badge: "bg-rose-500 text-white",
      }
    case "orange":
      return {
        bg: "bg-orange-500/10 text-orange-500 border border-orange-500/20",
        dot: "bg-orange-500",
        badge: "bg-orange-500 text-white",
      }
    default:
      return {
        bg: "bg-gray-500/10 text-gray-500 border border-gray-500/20",
        dot: "bg-gray-500",
        badge: "bg-gray-500 text-white",
      }
  }
}
