import * as React from "react"
import { Link } from "react-router-dom"
import { 
  Loader2, 
  Flame, 
  Target, 
  BookOpen, 
  Music, 
  BookMarked,
  ArrowRight,
  TrendingUp,
  Sparkles,
  CalendarDays
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"
import type { User } from "@/types"

interface Counts {
  users: number | null
  reading: number | null
  audio: number | null
  vocab: number | null
}

export default function Dashboard() {
  const { token } = useAuth()
  const [counts, setCounts] = React.useState<Counts>({
    users: null,
    reading: null,
    audio: null,
    vocab: null,
  })
  const [currentUser, setCurrentUser] = React.useState<User | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!token) return
    let cancelled = false
    
    // Fetch users count
    apiFetch<unknown[]>("/users", { token })
      .then((data) => {
        if (!cancelled) setCounts(c => ({ ...c, users: data.length }))
      })
      .catch((err) => {
        if (!cancelled) setError("Không thể kết nối đến máy chủ.")
        console.error(err)
      })

    // Fetch reading passages count
    apiFetch<{ total: number }>("/reading?page=1&page_size=1", { token })
      .then((data) => {
        if (!cancelled) setCounts(c => ({ ...c, reading: data.total }))
      })
      .catch(err => console.error(err))

    // Fetch audios count
    apiFetch<{ total: number }>("/audio?page=1&page_size=1", { token })
      .then((data) => {
        if (!cancelled) setCounts(c => ({ ...c, audio: data.total }))
      })
      .catch(err => console.error(err))

    // Fetch vocabulary count
    apiFetch<{ total: number }>("/vocabulary?page=1&page_size=1", { token })
      .then((data) => {
        if (!cancelled) setCounts(c => ({ ...c, vocab: data.total }))
      })
      .catch(err => console.error(err))

    // Fetch user profile details
    apiFetch<User>("/users/me", { token })
      .then((data) => {
        if (!cancelled) setCurrentUser(data)
      })
      .catch((err) => {
        console.error("Không thể tải thông tin cá nhân:", err)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  // Generate Weekly visual contribution cells based on streak
  const getWeeklyCalendar = () => {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
    const today = new Date()
    const todayDayIndex = today.getDay() // 0 = Sunday, 6 = Saturday

    const streak = currentUser?.current_streak ?? 0

    return days.map((dayLabel, idx) => {
      const diff = idx - todayDayIndex
      const cellDate = new Date()
      cellDate.setDate(today.getDate() + diff)
      
      const isToday = diff === 0
      const isFuture = diff > 0
      const isActive = !isFuture && Math.abs(diff) < streak

      return (
        <div key={dayLabel} className="flex flex-col items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground font-semibold">{dayLabel}</span>
          <div
            className={`h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
              isToday
                ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                : ""
            } ${
              isActive
                ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25 scale-105"
                : isFuture
                ? "bg-muted/30 text-muted-foreground/30 border border-dashed border-border cursor-not-allowed"
                : "bg-muted text-muted-foreground"
            }`}
            title={`${cellDate.toLocaleDateString("vi-VN")} - ${isActive ? "Đã ôn tập" : "Chưa ôn tập"}`}
          >
            {cellDate.getDate()}
          </div>
        </div>
      )
    })
  }

  const dailyTarget = currentUser?.daily_target ?? 10
  const reviewedToday = currentUser?.words_reviewed_today ?? 0
  const progressRatio = Math.min(reviewedToday / dailyTarget, 1)

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full h-full overflow-y-auto">
      {/* Welcome banner */}
      <div className="relative rounded-2xl overflow-hidden border border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 text-center md:text-left z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold select-none animate-pulse">
            <Sparkles className="h-3.5 w-3.5" /> Chào mừng quay trở lại!
          </div>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Chào, {currentUser?.name || "Bạn học"} 👋
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md leading-relaxed">
            Hôm nay là một ngày tuyệt vời để nâng tầm vốn từ vựng của bạn. Tiếp tục giữ vững phong độ nhé!
          </p>
          <div className="pt-2 flex flex-wrap gap-3 justify-center md:justify-start">
            <Link to="/admin/reading">
              <Button className="gap-1.5 cursor-pointer shadow-none">
                Luyện dịch ngay <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="relative shrink-0 select-none">
          <div className="absolute -inset-1 rounded-full bg-primary/20 blur-xl opacity-70"></div>
          <img
            src="/image-3.png"
            alt="Welcome Mascot"
            className="h-36 w-auto relative object-contain drop-shadow-lg hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* KPI Cards & Circular Progress */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Streak & Vocabulary Cards */}
        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KpiCard
            title="Chuỗi ôn tập liên tục"
            value={currentUser === null ? null : `${currentUser.current_streak} ngày`}
            desc={currentUser?.current_streak && currentUser.current_streak > 0 ? "Tuyệt vời, giữ vững ngọn lửa học tập!" : "Bắt đầu học ngay để thiết lập chuỗi học!"}
            icon={Flame}
            iconColor="text-orange-500 fill-orange-500 animate-pulse"
          />
          <KpiCard
            title="Từ vựng tích luỹ"
            value={counts.vocab === null ? null : `${counts.vocab} từ`}
            desc="Tổng số từ mới đã lưu lại trong sổ tay"
            icon={BookMarked}
            iconColor="text-primary"
          />
          <KpiCard
            title="Tài liệu bài đọc"
            value={counts.reading === null ? null : `${counts.reading} bài`}
            desc="Bài viết, tiểu luận song ngữ"
            icon={BookOpen}
            iconColor="text-sky-500"
          />
          <KpiCard
            title="Tài liệu bài nghe"
            value={counts.audio === null ? null : `${counts.audio} bài`}
            desc="Bài nghe phát âm bản xứ"
            icon={Music}
            iconColor="text-emerald-500"
          />
        </div>

        {/* Circular progress card */}
        <Card className="md:col-span-4 shadow-none rounded-2xl flex flex-col justify-between p-5 border border-border">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-1.5 text-foreground pb-2 border-b border-border/50">
              <Target className="h-4 w-4 text-primary" /> Mục tiêu hôm nay
            </CardTitle>
          </div>
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <div className="relative h-28 w-28 flex items-center justify-center select-none">
              <svg className="absolute transform -rotate-90 w-full h-full">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className="stroke-muted"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className="stroke-primary transition-all duration-500 ease-out"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={2 * Math.PI * 48 * (1 - progressRatio)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <div className="text-xl font-extrabold text-foreground">{reviewedToday}</div>
                <div className="text-[10px] text-muted-foreground">Mục tiêu {dailyTarget}</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center px-4 leading-relaxed">
              {progressRatio >= 1
                ? "🎉 Chúc mừng! Bạn đã hoàn thành xuất sắc mục tiêu học tập ngày hôm nay!"
                : `Học thêm ${dailyTarget - reviewedToday} từ nữa để hoàn thành mục tiêu ngày.`}
            </p>
          </div>
        </Card>
      </div>

      {/* Weekly Streak Calendar & Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly activity */}
        <Card className="lg:col-span-7 shadow-none rounded-2xl p-5 border border-border">
          <div className="flex items-center justify-between pb-4 border-b border-border/50 mb-4">
            <CardTitle className="text-base font-bold flex items-center gap-1.5 text-foreground">
              <CalendarDays className="h-4 w-4 text-primary" /> Chuỗi học tập tuần này
            </CardTitle>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> +{currentUser?.current_streak} streak
            </div>
          </div>
          <div className="flex items-center justify-around py-2 overflow-x-auto gap-2">
            {getWeeklyCalendar()}
          </div>
        </Card>

        {/* Learning shortcuts */}
        <Card className="lg:col-span-5 shadow-none rounded-2xl p-5 border border-border flex flex-col justify-between">
          <div className="pb-3 border-b border-border/50 mb-3">
            <CardTitle className="text-base font-bold text-foreground">
              Lối tắt học tập nhanh
            </CardTitle>
          </div>
          <div className="space-y-2.5">
            <ShortcutRow
              title="Luyện dịch & Bài đọc"
              desc="Đọc văn bản song ngữ, bôi đen tra từ"
              to="/admin/reading"
              icon={BookOpen}
              color="bg-sky-500/10 text-sky-500"
            />
            <ShortcutRow
              title="Luyện nghe tiếng Anh"
              desc="Nghe audio shadowing và Dictation"
              to="/admin/audio"
              icon={Music}
              color="bg-emerald-500/10 text-emerald-500"
            />
            <ShortcutRow
              title="Sổ tay từ vựng"
              desc="Quản lý và ôn luyện bộ thẻ từ vựng"
              to="/admin/vocabulary"
              icon={BookMarked}
              color="bg-primary/10 text-primary"
            />
          </div>
        </Card>
      </div>
    </div>
  )
}

function KpiCard({
  title,
  value,
  desc,
  icon: Icon,
  iconColor,
}: {
  title: string
  value: string | null
  desc?: string
  icon: React.ComponentType<{ className?: string }>
  iconColor?: string
}) {
  return (
    <Card className="shadow-none rounded-2xl border border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-4">
        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor || "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {value === null ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <div className="text-2xl font-black text-foreground">{value}</div>
        )}
        {desc && <p className="text-xs text-muted-foreground mt-1 select-none leading-relaxed">{desc}</p>}
      </CardContent>
    </Card>
  )
}

function ShortcutRow({
  title,
  desc,
  to,
  icon: Icon,
  color,
}: {
  title: string
  desc: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between p-2.5 rounded-xl border border-border/80 hover:border-primary/40 hover:bg-primary/5 transition-all group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">{title}</p>
          <p className="text-[10px] text-muted-foreground truncate">{desc}</p>
        </div>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  )
}