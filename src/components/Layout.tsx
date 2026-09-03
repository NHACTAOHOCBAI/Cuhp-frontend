import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import {
  LayoutDashboard,
  Dumbbell,
  Languages,
  CheckSquare,
  LogOut,
  Menu,
  User as UserIcon,
  Flame,
  ChevronDown
} from "lucide-react"

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const navItems = [
    { label: "Hub", path: "/", icon: LayoutDashboard },
    { label: "Gym", path: "/gym", icon: Dumbbell },
    { label: "English", path: "/english", icon: Languages },
    { label: "Tasks", path: "/todo", icon: CheckSquare },
    { label: "Habits", path: "/habits", icon: Flame },
  ]

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setUserDropdownOpen(false)
    setMobileMenuOpen(false)
    await logout()
    navigate("/login")
  }

  const getInitials = (name?: string) => {
    if (!name) return "CU"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAF7] font-outfit text-[#1f1a1d] antialiased">
      {/* Top Navbar */}
      <header className="bg-[#FFFFFF] fixed w-full top-0 border-b border-[#E5DFE2] z-50 h-[72px] flex items-center">
        <div className="flex justify-between items-center w-full px-[48px] h-full">
          {/* Logo Brand Text */}
          <Link to="/" className="flex items-center">
            <span className="font-sora font-bold text-2xl text-[#EFBCD5] tracking-tight">Cuhp</span>
          </Link>

          {/* Grouped links and actions on the right */}
          <div className="hidden md:flex items-center gap-8 h-full ml-auto">
            {/* Navigation Links for Desktop */}
            <nav className="flex gap-8 items-center h-full">
              {navItems.map((item) => {
                const isActive =
                  item.path === "/"
                    ? location.pathname === "/"
                    : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative font-sora text-base h-full flex items-center justify-center min-w-[64px] transition-colors duration-200 ${
                      isActive
                        ? "text-[#EFBCD5] font-bold"
                        : "text-[#706065] hover:text-[#EFBCD5] font-normal"
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute bottom-[20px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#EFBCD5] rounded-full"></span>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Desktop User Avatar & Dropdown Menu */}
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-[16px] bg-white hover:bg-[#F4ECEF] border border-[#E5DFE2] transition-all duration-200 focus:outline-none shadow-sm"
                  title="Tài khoản cá nhân"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover border border-[#EFBCD5]"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#EFBCD5]/30 text-[#7b5268] font-sora font-bold flex items-center justify-center text-xs">
                      {getInitials(user.name)}
                    </div>
                  )}
                  <span className="text-sm font-sora font-semibold text-[#1f1a1d] max-w-[130px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-[#7b5268] transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu Overlay */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-60 bg-white border border-[#E5DFE2] rounded-[20px] shadow-[0_15px_35px_-5px_rgba(239,188,213,0.25)] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2.5 mb-1 bg-[#FCFAF7] rounded-[14px] border border-[#E5DFE2]/60">
                      <p className="font-sora font-bold text-sm text-[#1f1a1d] truncate">{user.name}</p>
                      <p className="font-outfit text-xs text-[#706065] truncate">@{user.username}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 text-sm font-sora font-medium rounded-[12px] transition-colors ${
                        location.pathname === "/profile"
                          ? "bg-[#F4ECEF] text-[#7b5268] font-bold"
                          : "text-[#1f1a1d] hover:bg-[#F4ECEF] hover:text-[#7b5268]"
                      }`}
                    >
                      <UserIcon className="w-4 h-4 text-[#7b5268]" />
                      <span>Hồ sơ cá nhân</span>
                    </Link>

                    <div className="border-t border-[#E5DFE2] my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-sora font-medium text-rose-600 hover:bg-rose-50 rounded-[12px] transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex items-center gap-2 md:hidden">
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-[#7b5268] hover:bg-[#F4ECEF] rounded-full transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="absolute top-[72px] right-0 w-64 bg-white border-l border-[#E5DFE2] h-[calc(100vh-72px)] p-6 flex flex-col gap-6 shadow-xl animate-in slide-in-from-right"
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 pb-4 border-b border-[#E5DFE2] hover:bg-[#FCFAF7] p-2 rounded-xl transition-colors"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-[#EFBCD5]" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#EFBCD5]/30 flex items-center justify-center text-[#7b5268] font-sora font-bold">
                  {getInitials(user?.name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-sora font-semibold text-[#1f1a1d] truncate">{user?.name}</p>
                <p className="font-outfit text-xs text-[#706065] truncate">@{user?.username}</p>
              </div>
            </Link>

            <nav className="flex flex-col gap-4">
              {navItems.map((item) => {
                const isActive =
                  item.path === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.path) || (item.path === "/todo" && location.pathname.startsWith("/habits"))
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-[#FCFAF7] text-[#7b5268] font-bold border-l-4 border-[#EFBCD5]"
                        : "text-[#4f4449] hover:bg-zinc-50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-sora">{item.label}</span>
                  </Link>
                )
              })}

              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  location.pathname === "/profile"
                    ? "bg-[#FCFAF7] text-[#7b5268] font-bold border-l-4 border-[#EFBCD5]"
                    : "text-[#4f4449] hover:bg-zinc-50"
                }`}
              >
                <UserIcon className="h-5 w-5" />
                <span className="font-sora">Hồ sơ cá nhân</span>
              </Link>
            </nav>

            <button
              onClick={handleLogout}
              className="mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#F4ECEF] text-[#7b5268] font-sora font-bold hover:bg-[#EFBCD5]/30 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow w-full px-[48px] pb-[80px] pt-[24px] mt-[92px]">
        {children}
      </main>

      {/* Bottom Nav Bar for Mobile */}
      <nav className="md:hidden fixed bottom-0 w-full bg-[#FFFFFF] border-t border-[#E5DFE2] z-40 p-2 pb-safe">
        <ul className="flex justify-around items-center w-full">
          {navItems.map((item) => {
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path) || (item.path === "/todo" && location.pathname.startsWith("/habits"))
            const Icon = item.icon
            return (
              <li key={item.path} className="flex-1">
                <Link
                  to={item.path}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                    isActive ? "text-[#7b5268] font-bold" : "text-[#4f4449] hover:text-[#EFBCD5]"
                  }`}
                >
                  <Icon className={`h-6 w-6 ${isActive ? "stroke-[2.5px]" : "stroke-[1.8px]"}`} />
                  <span className="text-xs mt-1 font-mono">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
