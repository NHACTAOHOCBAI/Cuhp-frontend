import * as React from "react"
import { Link, useLocation, Outlet } from "react-router-dom"
import { BookOpen, Volume2, Layers, TrendingUp, Gamepad2, Zap, BookmarkCheck } from "lucide-react"

export default function EnglishLayout() {
  const location = useLocation()

  // Track page key to allow force-restarting sessions on the child page if needed
  const [restartKey, setRestartKey] = React.useState(0)

  const handleRestartSession = () => {
    setRestartKey((prev) => prev + 1)
  }

  const navItems = [
    { label: "Vocabulary", path: "/english/vocabularies", icon: Layers },
    { label: "Luyện Phản Xạ", path: "/english/reflex", icon: Zap },
    { label: "Sổ Lỗi Sai", path: "/english/error-bank", icon: BookmarkCheck },
    { label: "Reading", path: "/english/reading", icon: BookOpen },
    { label: "Listening", path: "/english/listening", icon: Volume2 },
    { label: "Analytics", path: "/english/analytics", icon: TrendingUp },
    { label: "Word Snake", path: "/english/snake", icon: Gamepad2 },
  ]

  return (
    <div className="flex flex-col md:flex-row gap-[24px]">
      {/* SideNavBar (Desktop Aside Layout) */}
      <aside className="w-full md:w-64 flex flex-col border-r border-[#E5DFE2] md:sticky md:top-[120px] flex-shrink-0 md:pr-[24px] gap-[8px] pb-6 md:pb-0">
        <div className="mb-[24px]">
          <h2 className="font-sora text-2xl font-bold text-[#EFBCD5] tracking-tight">English Hub</h2>
          <p className="font-outfit text-xs text-[#706065] mt-1">Level: Upper Intermediate</p>
        </div>

        <nav className="flex flex-col gap-1.5 flex-grow">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path)
            const Icon = item.icon

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-[12px] px-[12px] py-2.5 rounded-xl text-left transition-all ${
                  isActive
                    ? "bg-[#fcf1f5] text-[#7b5268] font-bold border-l-4 border-[#EFBCD5]"
                    : "text-[#706065] hover:bg-[#F6EBEF] hover:text-[#EFBCD5] font-semibold"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-outfit text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Actions */}
        <div className="mt-8 pt-[24px] border-t border-[#E5DFE2]">
          <button
            onClick={handleRestartSession}
            className="w-full py-3 bg-white text-[#201B1E] font-sora text-sm rounded-full font-semibold hover:bg-[#FCF1F5] transition-colors border border-[#E5DFE2] flex items-center justify-center gap-2 shadow-sm"
          >
            <span className="text-xs">▶</span>
            <span>Start Review</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area via Outlet */}
      <main className="flex-grow md:pl-[24px] min-h-[500px]">
        <Outlet context={{ restartKey }} />
      </main>
    </div>
  )
}
export type EnglishOutletContext = {
  restartKey: number
}
