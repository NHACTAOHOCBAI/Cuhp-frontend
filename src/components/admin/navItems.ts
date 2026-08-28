import {
  LayoutDashboard,
  Users,
  Headphones,
  BookOpen,
  Languages,
  Dumbbell,
  ListChecks,
  GraduationCap,
  Settings,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react"

/**
 * A standalone navigation entry (used for top-level routes like Dashboard).
 */
export interface NavLeaf {
  to: string
  label: string
  icon: LucideIcon
  match: RegExp
}

/**
 * A collapsible group of related navigation entries. The optional `hub` is
 * rendered first under the group and usually points to a domain overview page.
 */
export type NavEntry =
  | { kind: "leaf"; item: NavLeaf }
  | {
    kind: "group"
    id: string
    label: string
    icon: LucideIcon
    hub?: NavLeaf
    children: NavLeaf[]
  }

export const navEntries: NavEntry[] = [
  {
    kind: "leaf",
    item: {
      to: "/admin",
      label: "Tổng quan",
      icon: LayoutDashboard,
      match: /^\/admin\/?$/,
    },
  },

  {
    kind: "group",
    id: "english",
    label: "Tiếng Anh",
    icon: GraduationCap,
    children: [
      {
        to: "/admin/audio",
        label: "Bài nghe",
        icon: Headphones,
        match: /^\/admin\/audio(\/|$)/,
      },
      {
        to: "/admin/vocabulary",
        label: "Từ vựng",
        icon: BookOpen,
        match: /^\/admin\/vocabulary(\/|$)/,
      },
      {
        to: "/admin/reading",
        label: "Luyện dịch & Bài đọc",
        icon: Languages,
        match: /^\/admin\/reading(\/|$)/,
      },
    ],
  },

  {
    kind: "group",
    id: "gym",
    label: "Tập gym",
    icon: Dumbbell,
    children: [
      {
        to: "/admin/gym",
        label: "Hỗ trợ tập gym",
        icon: Dumbbell,
        match: /^\/admin\/gym(\/|$)/,
      },
    ],
  },

  {
    kind: "group",
    id: "todo",
    label: "Công việc",
    icon: ListChecks,
    children: [
      {
        to: "/admin/todo",
        label: "Quản lý công việc",
        icon: ListChecks,
        match: /^\/admin\/todo(\/|$)/,
      },
    ],
  },
  {
    kind: "group",
    id: "habits",
    label: "Thói quen",
    icon: CalendarCheck,
    children: [
      {
        to: "/admin/habits",
        label: "Theo dõi thói quen",
        icon: CalendarCheck,
        match: /^\/admin\/habits(\/|$)/,
      },
    ],
  },

  {
    kind: "group",
    id: "admin",
    label: "Quản trị",
    icon: Settings,
    children: [
      {
        to: "/admin/users",
        label: "Quản lý thành viên",
        icon: Users,
        match: /^\/admin\/users(\/|$)/,
      },
    ],
  },
]

/**
 * Flat list of all leaves (standalone + group hubs + group children).
 * Used by getPageTitle() and any other consumer that needs a single lookup.
 */
export function flattenLeaves(entries: NavEntry[] = navEntries): NavLeaf[] {
  const out: NavLeaf[] = []
  for (const e of entries) {
    if (e.kind === "leaf") {
      out.push(e.item)
    } else {
      if (e.hub) out.push(e.hub)
      out.push(...e.children)
    }
  }
  return out
}

/**
 * Checks whether a given pathname falls within a group's hub or any child.
 */
export function isGroupActive(
  group: Extract<NavEntry, { kind: "group" }>,
  pathname: string
): boolean {
  if (group.hub?.match.test(pathname)) return true
  return group.children.some((c) => c.match.test(pathname))
}

/**
 * Returns the page title for a given pathname. For a group's hub page, the
 * group's label is returned so the topbar reads as a domain name.
 */
export function getPageTitle(pathname: string): string {
  for (const e of navEntries) {
    if (e.kind === "leaf" && e.item.match.test(pathname)) {
      return e.item.label
    }
    if (e.kind === "group") {
      if (e.hub?.match.test(pathname)) return e.label
      const child = e.children.find((c) => c.match.test(pathname))
      if (child) return child.label
    }
  }
  return ""
}
