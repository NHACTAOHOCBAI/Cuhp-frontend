/**
 * Static metadata for the four Eisenhower quadrants.
 *
 * The matrix is rendered from this array (order = reading order of the 2x2
 * grid), and the same entries drive the quadrant picker in the edit dialog,
 * the badge colours on task cards, and the labels in the stats panel.
 * Colour bundles follow the same shape as `features/gym/utils/colors.ts`.
 */
import { CalendarClock, CircleSlash, Send, Zap } from "lucide-react"
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
  /** Border colour applied while a card is dragged over this quadrant. */
  ring: string
  /** Raw hex, needed by the inline SVG charts. */
  hex: string
}

export const QUADRANTS: QuadrantMeta[] = [
  {
    key: "do",
    label: "Làm ngay",
    rule: "Khẩn cấp + Quan trọng",
    hint: "Xử lý ngay hôm nay, đừng trì hoãn.",
    icon: Zap,
    badge: "bg-rose-500/10 text-rose-500 border border-rose-500/20",
    dot: "bg-rose-500",
    header: "bg-rose-500/5",
    ring: "border-rose-500 bg-rose-500/10",
    hex: "#f43f5e",
  },
  {
    key: "schedule",
    label: "Lên lịch",
    rule: "Quan trọng, không khẩn cấp",
    hint: "Đặt lịch cụ thể — đây là nơi tạo ra giá trị dài hạn.",
    icon: CalendarClock,
    badge: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
    dot: "bg-blue-500",
    header: "bg-blue-500/5",
    ring: "border-blue-500 bg-blue-500/10",
    hex: "#3b82f6",
  },
  {
    key: "delegate",
    label: "Ủy thác",
    rule: "Khẩn cấp, không quan trọng",
    hint: "Giao cho người khác hoặc rút gọn tối đa thời gian.",
    icon: Send,
    badge: "bg-amber-600/10 text-amber-600 border border-amber-600/20",
    dot: "bg-amber-600",
    header: "bg-amber-600/5",
    ring: "border-amber-600 bg-amber-600/10",
    hex: "#d97706",
  },
  {
    key: "eliminate",
    label: "Loại bỏ",
    rule: "Không khẩn cấp, không quan trọng",
    hint: "Cân nhắc bỏ hẳn để lấy lại thời gian.",
    icon: CircleSlash,
    badge: "bg-violet-500/10 text-violet-500 border border-violet-500/20",
    dot: "bg-violet-500",
    header: "bg-violet-500/5",
    ring: "border-violet-500 bg-violet-500/10",
    hex: "#8b5cf6",
  },
]

const QUADRANT_MAP = new Map<TodoQuadrant, QuadrantMeta>(
  QUADRANTS.map((q) => [q.key, q])
)

export function getQuadrant(key: TodoQuadrant): QuadrantMeta {
  return QUADRANT_MAP.get(key) ?? QUADRANTS[0]
}

export const QUADRANT_OPTIONS = QUADRANTS.map((q) => ({
  value: q.key,
  label: `${q.label} — ${q.rule}`,
}))

export const SCOPE_OPTIONS = [
  { value: "today", label: "Hôm nay" },
  { value: "week", label: "Tuần này" },
  { value: "all", label: "Tất cả" },
] as const
