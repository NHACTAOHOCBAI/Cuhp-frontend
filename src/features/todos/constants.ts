/**
 * Static metadata for the four Eisenhower quadrants.
 *
 * The matrix is rendered from this array (order = reading order of the 2x2
 * grid), and the same entries drive the quadrant picker in the edit dialog,
 * the badge colours on task cards, and the labels in the stats panel.
 * Colour bundles follow the same shape as `features/gym/utils/colors.ts`.
 */
import { CalendarClock, CircleSlash, Send, Zap, Inbox } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { TodoQuadrant } from "@/types"

export interface QuadrantMeta {
  key: TodoQuadrant
  /** Short name used on the card header and in pickers. */
  label: string
  /** The urgent/important rule this quadrant encodes. */
  rule: string
  /** One-line coaching hint shown under the header. */
  hint: string
  icon: LucideIcon
  /** Soft tinted background + text + border, for badges. */
  badge: string
  /** Solid dot colour, for the header marker and chart bars. */
  dot: string
  /** Header strip tint for the quadrant card. */
  header: string
  /** Full card background colour. */
  bg: string
  /** Border colour applied while a card is dragged over this quadrant. */
  ring: string
  /** Raw hex, needed by the inline SVG charts. */
  hex: string
}

export const INBOX_META: QuadrantMeta = {
  key: "inbox",
  label: "This Week's Inbox",
  rule: "Not categorized yet",
  hint: "Quickly capture tasks for the week here, then categorize them later.",
  icon: Inbox,
  badge: "bg-slate-500/10 text-slate-500 border border-slate-500/20 dark:text-slate-400 dark:border-slate-500/30",
  dot: "bg-slate-500",
  header: "bg-slate-500/5",
  bg: "bg-slate-500/[0.03] dark:bg-slate-900/20",
  ring: "border-slate-500 bg-slate-500/10",
  hex: "#64748b",
}

export const QUADRANTS: QuadrantMeta[] = [
  {
    key: "do",
    label: "Do First",
    rule: "Urgent + Important",
    hint: "Handle it today, do not procrastinate.",
    icon: Zap,
    badge: "bg-rose-500/10 text-rose-500 border border-rose-500/20",
    dot: "bg-rose-500",
    header: "bg-rose-500/5",
    bg: "bg-rose-500/[0.03] dark:bg-rose-950/15",
    ring: "border-rose-500 bg-rose-500/10",
    hex: "#f43f5e",
  },
  {
    key: "schedule",
    label: "Schedule",
    rule: "Important, Not Urgent",
    hint: "Set a specific time — this is where long-term value is created.",
    icon: CalendarClock,
    badge: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
    dot: "bg-blue-500",
    header: "bg-blue-500/5",
    bg: "bg-blue-500/[0.03] dark:bg-blue-950/15",
    ring: "border-blue-500 bg-blue-500/10",
    hex: "#3b82f6",
  },
  {
    key: "delegate",
    label: "Delegate",
    rule: "Urgent, Not Important",
    hint: "Hand it off to someone else or minimize the time spent on it.",
    icon: Send,
    badge: "bg-amber-600/10 text-amber-600 border border-amber-600/20",
    dot: "bg-amber-600",
    header: "bg-amber-600/5",
    bg: "bg-amber-500/[0.03] dark:bg-amber-950/15",
    ring: "border-amber-600 bg-amber-600/10",
    hex: "#d97706",
  },
  {
    key: "eliminate",
    label: "Eliminate",
    rule: "Not Urgent, Not Important",
    hint: "Consider dropping it entirely to reclaim your time.",
    icon: CircleSlash,
    badge: "bg-violet-500/10 text-violet-500 border border-violet-500/20",
    dot: "bg-violet-500",
    header: "bg-violet-500/5",
    bg: "bg-violet-500/[0.03] dark:bg-violet-950/15",
    ring: "border-violet-500 bg-violet-500/10",
    hex: "#8b5cf6",
  },
]

export const ALL_QUADRANTS: QuadrantMeta[] = [INBOX_META, ...QUADRANTS]

const QUADRANT_MAP = new Map<TodoQuadrant, QuadrantMeta>(
  ALL_QUADRANTS.map((q) => [q.key, q])
)

export function getQuadrant(key: TodoQuadrant): QuadrantMeta {
  return QUADRANT_MAP.get(key) ?? INBOX_META
}

export const QUADRANT_OPTIONS = ALL_QUADRANTS.map((q) => ({
  value: q.key,
  label: q.key === "inbox" ? q.label : `${q.label} — ${q.rule}`,
}))

export const SCOPE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "all", label: "All" },
] as const
