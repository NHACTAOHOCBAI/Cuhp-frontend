import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { LayoutDashboard, Dumbbell, Languages, CheckSquare, LogOut, Menu, User as UserIcon } from "lucide-react"

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const navItems = [
    { label: "Hub", path: "/", icon: LayoutDashboard },
    { label: "Gym", path: "/gym", icon: Dumbbell },
    { label: "English", path: "/english", icon: Languages },
    { label: "Tasks", path: "/todo", icon: CheckSquare },
  ]

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAF7] font-outfit text-[#1f1a1d] antialiased">
      {/* Top Navbar */}
      <header className="bg-[#FFFFFF] fixed w-full top-0 border-b border-[#E5DFE2] z-50 h-[72px] flex items-center">
        <div className="flex justify-between items-center w-full px-[48px] h-full">
          {/* Logo Brand Text */}
          <Link to="/" className="flex items-center">
            <span className="font-sora font-bold text-[28px] text-[#EFBCD5] tracking-tight">Cuhp</span>
          </Link>

          {/* Grouped links and actions on the right */}
          <div className="hidden md:flex items-center gap-8 h-full ml-auto">
            {/* Navigation Links for Desktop */}
            <nav className="flex gap-8 items-center h-full">
              {navItems.map((item) => {
                const isActive =
                  item.path === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative font-sora text-[16px] h-full flex items-center transition-colors duration-200 active:scale-95 transition-transform ${
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

            {/* Desktop User Avatar & Actions */}
            {user && (
              <div className="flex items-center">
                <button
                  onClick={handleLogout}
                  className="p-1 text-[#EFBCD5] hover:bg-[#F4ECEF] hover:text-[#7b5268] rounded-full transition-colors flex items-center justify-center"
                  title="Đăng xuất"
                >
                  <UserIcon className="h-7 w-7 stroke-[1.5]" />
                </button>
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
            <div className="flex items-center gap-3 pb-4 border-b border-[#E5DFE2]">
              <div className="w-10 h-10 rounded-full bg-[#EFBCD5]/30 flex items-center justify-center text-[#7b5268] font-bold">
                {user?.initials || "U"}
              </div>
              <div>
                <p className="font-semibold text-[#1f1a1d]">{user?.name}</p>
                <p className="text-xs text-[#7b5268]">{user?.username}</p>
              </div>
            </div>

            <nav className="flex flex-col gap-4">
              {navItems.map((item) => {
                const isActive =
                  item.path === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.path)
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
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <button
              onClick={handleLogout}
              className="mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#F4ECEF] text-[#7b5268] font-bold hover:bg-[#EFBCD5]/30 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Đăng xuất</span>
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
                : location.pathname.startsWith(item.path)
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
                  <span className="text-[10px] mt-1 font-mono">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
