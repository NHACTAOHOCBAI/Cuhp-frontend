import { NavLink } from "react-router-dom"
import {
  ChevronsLeft,
  ChevronsRight,
  LogOut,
} from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { navItems } from "./navItems"

interface SidebarProps {
  collapsed: boolean
  onToggleCollapsed: () => void
  onNavigate?: () => void
  className?: string
}

export function Sidebar({ collapsed, onToggleCollapsed, onNavigate, className }: SidebarProps) {
  const { user, logout } = useAuth()

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card transition-[width] duration-200 shrink-0 h-full",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header / brand */}
      <div className="flex items-center justify-between p-3 border-b border-border min-h-[3.5rem]">
        <div className={cn("flex items-center gap-2 overflow-hidden", collapsed && "justify-center w-full")}>
          <div className="h-7 w-7 shrink-0 rounded-md bg-foreground text-background flex items-center justify-center font-bold text-sm">
            C
          </div>
          {!collapsed && (
            <span className="font-bold tracking-tight text-base whitespace-nowrap">Monochat</span>
          )}
        </div>
        {!collapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            title="Thu gọn"
            aria-label="Thu gọn sidebar"
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Collapsed toggle (icon-only) */}
      {collapsed && (
        <div className="hidden md:flex justify-center py-2">
          <button
            type="button"
            onClick={onToggleCollapsed}
            title="Mở rộng"
            aria-label="Mở rộng sidebar"
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const linkContent = (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onNavigate?.()}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    collapsed && "justify-center px-0",
                    isActive
                      ? "bg-foreground text-background"
                      : "text-foreground hover:bg-secondary"
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            )
            if (collapsed) {
              return (
                <li key={item.to} title={item.label}>
                  {linkContent}
                </li>
              )
            }
            return <li key={item.to}>{linkContent}</li>
          })}
        </ul>
      </nav>

      <Separator />

      {/* Footer / user */}
      <div className="p-3 flex items-center justify-between gap-2">
        <div className={cn("flex items-center gap-2 min-w-0", collapsed && "justify-center w-full")}>
          <Avatar fallback={user?.initials || "?"} className="h-9 w-9 shrink-0 border border-border" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">Quản trị viên</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            type="button"
            onClick={() => void logout()}
            title="Đăng xuất"
            aria-label="Đăng xuất"
            className="h-8 w-8 shrink-0 flex items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  )
}
