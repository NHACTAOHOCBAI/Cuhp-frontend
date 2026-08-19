import * as React from "react"
import { NavLink, useLocation } from "react-router-dom"
import {
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronRight,
  LogOut,
} from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { navEntries, isGroupActive, type NavLeaf } from "./navItems"

interface SidebarProps {
  collapsed: boolean
  onToggleCollapsed: () => void
  onNavigate?: () => void
  className?: string
}

const COLLAPSED_GROUPS_STORAGE_KEY = "admin-sidebar-groups-collapsed"

function loadCollapsedGroups(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = window.localStorage.getItem(COLLAPSED_GROUPS_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return new Set(parsed.filter((v) => typeof v === "string"))
  } catch {
    // ignore parse errors
  }
  return new Set()
}

function persistCollapsedGroups(set: Set<string>): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(
      COLLAPSED_GROUPS_STORAGE_KEY,
      JSON.stringify(Array.from(set))
    )
  } catch {
    // ignore quota errors
  }
}

interface SidebarRowProps {
  leaf: NavLeaf
  collapsed: boolean
  indented?: boolean
  onNavigate?: () => void
}

function SidebarRow({ leaf, collapsed, indented, onNavigate }: SidebarRowProps) {
  const Icon = leaf.icon
  return (
    <NavLink
      to={leaf.to}
      end={leaf.to === "/admin"}
      onClick={() => onNavigate?.()}
      title={collapsed ? leaf.label : undefined}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md text-sm font-medium transition-all duration-200",
          collapsed ? "justify-center px-0 py-2" : "px-3 py-2",
          indented && !collapsed && "pl-4",
          isActive
            ? "bg-[#c2e6fb] text-foreground font-semibold"
            : "text-foreground/80 hover:bg-[#c2e6fb]/40"
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{leaf.label}</span>}
    </NavLink>
  )
}

export function Sidebar({ collapsed, onToggleCollapsed, onNavigate, className }: SidebarProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const pathname = location.pathname

  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(loadCollapsedGroups)

  // Auto-expand any group whose hub or child is active.
  React.useEffect(() => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      let changed = false
      for (const e of navEntries) {
        if (e.kind !== "group") continue
        if (isGroupActive(e, pathname) && next.has(e.id)) {
          next.delete(e.id)
          changed = true
        }
      }
      if (changed) persistCollapsedGroups(next)
      return changed ? next : prev
    })
  }, [pathname])

  const toggleGroup = React.useCallback((id: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      persistCollapsedGroups(next)
      return next
    })
  }, [])

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-background transition-[width] duration-200 shrink-0 h-full text-foreground",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header / brand */}
      <div className="flex items-center justify-between p-3 border-b border-border min-h-[3.5rem]">
        <div className={cn("flex items-center gap-2 overflow-hidden", collapsed && "justify-center w-full")}>
          <img src="/logo.png" alt="Logo" className="h-9 w-9 shrink-0 object-contain rounded-md select-none" />
          {!collapsed && (
            <span className="font-bold tracking-tight text-base whitespace-nowrap text-foreground">Cuhp</span>
          )}
        </div>
        {!collapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            title="Thu gọn"
            aria-label="Thu gọn sidebar"
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-md text-foreground/60 hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
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
            className="h-7 w-7 flex items-center justify-center rounded-md text-foreground/60 hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-1">
          {navEntries.map((entry) => {
            if (entry.kind === "leaf") {
              return (
                <li key={entry.item.to}>
                  <SidebarRow leaf={entry.item} collapsed={collapsed} onNavigate={onNavigate} />
                </li>
              )
            }

            const open = !collapsedGroups.has(entry.id)
            const GroupIcon = entry.icon
            const active = isGroupActive(entry, pathname)

            return (
              <li key={entry.id} className="space-y-1">
                {!collapsed && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(entry.id)}
                    aria-expanded={open}
                    aria-controls={`group-${entry.id}`}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-md",
                      active
                        ? "text-foreground"
                        : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    {open ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                    <GroupIcon className="h-4 w-4" />
                    <span className="truncate">{entry.label}</span>
                  </button>
                )}
                {open && (
                  <ul
                    id={`group-${entry.id}`}
                    className={cn(
                      "space-y-1",
                      !collapsed && "pl-2 border-l border-border/40 ml-[18px]"
                    )}
                  >
                    {entry.hub && (
                      <li>
                        <SidebarRow
                          leaf={entry.hub}
                          collapsed={collapsed}
                          indented
                          onNavigate={onNavigate}
                        />
                      </li>
                    )}
                    {entry.children.map((child) => (
                      <li key={child.to}>
                        <SidebarRow
                          leaf={child}
                          collapsed={collapsed}
                          indented
                          onNavigate={onNavigate}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-border my-1" />

      {/* Footer / user */}
      <div className="p-3 flex items-center justify-between gap-2">
        <div className={cn("flex items-center gap-2 min-w-0", collapsed && "justify-center w-full")}>
          <Avatar fallback={user?.initials || "?"} className="h-9 w-9 shrink-0 border border-border" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-foreground">{user?.name}</p>
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
            className="h-8 w-8 shrink-0 flex items-center justify-center rounded-md text-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  )
}
