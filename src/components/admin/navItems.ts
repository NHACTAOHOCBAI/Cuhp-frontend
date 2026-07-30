import { LayoutDashboard, Users, Headphones, type LucideIcon } from "lucide-react"

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
]

export function getPageTitle(pathname: string): string {
  const match = navItems.find((n) => n.match.test(pathname))
  if (match) return match.label
  return ""
}