import { LayoutDashboard, Users, Headphones, BookOpen, Languages, Dumbbell, ListChecks, type LucideIcon } from "lucide-react"

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  match: RegExp
}

export const navItems: NavItem[] = [
  {
    to: "/admin",
    label: "Tổng quan",
    icon: LayoutDashboard,
    match: /^\/admin\/?$/,
  },
  {
    to: "/admin/users",
    label: "Quản lý thành viên",
    icon: Users,
    match: /^\/admin\/users(\/|$)/,
  },
  {
    to: "/admin/audio",
    label: "Quản lý bài nghe",
    icon: Headphones,
    match: /^\/admin\/audio(\/|$)/,
  },
  {
    to: "/admin/vocabulary",
    label: "Quản lý từ vựng",
    icon: BookOpen,
    match: /^\/admin\/vocabulary(\/|$)/,
  },
  {
    to: "/admin/reading",
    label: "Luyện dịch & Bài đọc",
    icon: Languages,
    match: /^\/admin\/reading(\/|$)/,
  },
  {
    to: "/admin/gym",
    label: "Hỗ trợ tập gym",
    icon: Dumbbell,
    match: /^\/admin\/gym(\/|$)/,
  },
  {
    to: "/admin/todo",
    label: "Quản lý công việc",
    icon: ListChecks,
    match: /^\/admin\/todo(\/|$)/,
  },
]



export function getPageTitle(pathname: string): string {
  const match = navItems.find((n) => n.match.test(pathname))
  if (match) return match.label
  return ""
}