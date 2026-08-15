import * as React from "react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { MascotAssistant } from "@/components/ui/MascotAssistant"

const COLLAPSED_KEY = "admin-sidebar-collapsed"

function readCollapsedPreference(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(COLLAPSED_KEY) === "1"
}

export function AdminLayout() {
  const [collapsed, setCollapsed] = React.useState<boolean>(readCollapsedPreference)
  const [mobileOpen, setMobileOpen] = React.useState<boolean>(false)

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0")
      return next
    })
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground relative">
      {/* Desktop sidebar */}
      <div className="hidden md:block h-full">
        <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      </div>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen} side="left">
        <SheetContent className="p-0">
          <Sidebar
            collapsed={false}
            onToggleCollapsed={toggleCollapsed}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        <Topbar onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-hidden bg-background min-h-0">
          <Outlet />
        </main>
      </div>

      {/* Floating Mascot Assistant */}
      <MascotAssistant />
    </div>
  )
}