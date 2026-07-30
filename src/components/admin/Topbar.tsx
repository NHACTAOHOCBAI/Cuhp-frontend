import { useLocation, Link } from "react-router-dom"
import { Menu, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/useTheme"
import { getPageTitle } from "./navItems"
import { UserMenu } from "./UserMenu"

interface TopbarProps {
  onOpenMobileSidebar: () => void
}

export function Topbar({ onOpenMobileSidebar }: TopbarProps) {
  const { isDark, toggle } = useTheme()
  const location = useLocation()
  const title = getPageTitle(location.pathname)

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-3 sm:px-4 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileSidebar}
          className="md:hidden"
          aria-label="Mở menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold text-base sm:text-lg truncate">
          {title || "Quản trị"}
        </h1>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <Link
          to="/admin/conversations"
          className="hidden sm:inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors px-2"
        >
          Đi tới Chat
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <UserMenu />
      </div>
    </header>
  )
}