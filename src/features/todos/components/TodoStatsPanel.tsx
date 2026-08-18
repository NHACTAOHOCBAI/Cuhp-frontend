/**
 * Report view: KPI tiles + gamification panel + the two charts + detailed quadrant table.
 *
 * Rendered inside the "Thống kê" tab of the Todo page.
 */
import { 
  AlertTriangle, 
  CheckCircle2, 
  Target, 
  Zap, 
  Flame, 
  ShieldCheck, 
  Sparkles, 
  Trophy, 
  Crown, 
  Lock 
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { QUADRANTS } from "../constants"
import type { TodoStats } from "../types"
import { DailyCompletionChart } from "./DailyCompletionChart"
import { QuadrantDistributionChart } from "./QuadrantDistributionChart"

interface StatTileProps {
  label: string
  value: string
  hint: string
  icon: LucideIcon
  tone?: "default" | "warning"
}

function StatTile({ label, value, hint, icon: Icon, tone = "default" }: StatTileProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex items-start gap-3 p-4">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            tone === "warning"
              ? "bg-rose-500/10 text-rose-500"
              : "bg-primary/10 text-primary"
          )}
        >
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold leading-tight tabular-nums">{value}</p>
          <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function CircularProgress({ percentage, label }: { percentage: number; label: string }) {
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-card rounded-2xl border border-border/80">
      <div className="relative size-24">
        <svg className="size-full -rotate-90">
          {/* Background circle */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            className="stroke-muted/40 dark:stroke-muted/20 fill-none"
            strokeWidth="7"
          />
          {/* Progress circle */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            className="stroke-primary fill-none transition-all duration-700 ease-out"
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold leading-none tabular-nums">{percentage}%</span>
        </div>
      </div>
      <p className="text-xs font-bold text-foreground mt-3.5 text-center leading-none">{label}</p>
    </div>
  )
}

export function TodoStatsPanel({ stats }: { stats: TodoStats }) {
  const byKey = new Map(stats.quadrant_stats.map((s) => [s.quadrant, s]))

  // Calculate Gamification Levels (e.g. 1 Level per 10 completed tasks)
  const totalCompleted = stats.total_completed
  const level = Math.floor(totalCompleted / 10) + 1
  const xp = totalCompleted % 10
  const xpPercentage = xp * 10

  const getRankName = (lvl: number) => {
    if (lvl === 1) return "Tập sự Năng suất"
    if (lvl === 2) return "Chiến binh Tập trung"
    if (lvl === 3) return "Bậc thầy Trực quan"
    if (lvl === 4) return "Đại sứ Hiệu quả"
    return "Huyền thoại Năng suất"
  }

  // Dynamic Motivational Feedback
  const getMotivationalMessage = () => {
    if (stats.overdue_count > 0) {
      return {
        title: "Tập trung giải quyết việc quá hạn nhé!",
        description: `Bạn đang có ${stats.overdue_count} công việc quá hạn. Giải quyết chúng trước sẽ giúp giảm áp lực tinh thần và lấy lại nhịp độ làm việc! 💪`,
        emoji: "💪",
        theme: "from-rose-500/10 to-orange-500/5 border-rose-200/50 dark:border-rose-500/20 text-rose-700 dark:text-rose-400"
      }
    }
    if (stats.completed_today > 0) {
      return {
        title: "Khởi đầu ngày mới đầy phấn khởi!",
        description: `Hôm nay bạn đã hoàn thành xuất sắc ${stats.completed_today} việc. Mỗi bước tiến nhỏ hôm nay sẽ tạo ra thành tựu lớn ngày mai! 🌟`,
        emoji: "🌟",
        theme: "from-emerald-500/10 to-teal-500/5 border-emerald-200/50 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
      }
    }
    if (stats.focus_rate >= 70) {
      return {
        title: "Tuyệt đỉnh! Tiêu điểm cực kỳ rõ ràng!",
        description: `Chỉ số tập trung của bạn đạt ${stats.focus_rate}%. Bạn đang hướng năng lượng vào các mục tiêu quan trọng và khẩn cấp nhất! 🎯`,
        emoji: "🎯",
        theme: "from-indigo-500/10 to-sky-500/5 border-indigo-200/50 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400"
      }
    }
    return {
      title: "Hôm nay là một ngày tuyệt vời để làm việc!",
      description: "Hãy chọn một mục tiêu quan trọng nhất trong Ma trận độ ưu tiên để bắt đầu ngay bây giờ. Bạn nhất định sẽ làm được! 🚀",
      emoji: "🚀",
      theme: "from-primary/10 to-indigo-500/5 border-primary/20 text-primary"
    }
  }

  const motivation = getMotivationalMessage()

  // Achievements/Medals Configuration
  const achievements = [
    {
      id: "strong-start",
      title: "Khởi Đầu Mạnh Mẽ",
      description: "Hoàn thành công việc đầu tiên",
      unlocked: stats.total_completed >= 1,
      icon: Flame,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20"
    },
    {
      id: "productivity-warrior",
      title: "Chiến Binh Năng Suất",
      description: "Hoàn thành từ 10 việc trở lên",
      unlocked: stats.total_completed >= 10,
      icon: Zap,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20"
    },
    {
      id: "iron-discipline",
      title: "Kỷ Luật Thép",
      description: "Không có việc nào bị quá hạn",
      unlocked: stats.overdue_count === 0 && stats.total_open > 0,
      icon: ShieldCheck,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    },
    {
      id: "daily-champ",
      title: "Vô Địch Ngày",
      description: "Hoàn thành >= 3 việc hôm nay",
      unlocked: stats.completed_today >= 3,
      icon: Trophy,
      color: "text-rose-500 bg-rose-500/10 border-rose-500/20"
    },
    {
      id: "focus-master",
      title: "Bậc Thầy Tiêu Điểm",
      description: "Độ tập trung quan trọng >= 70%",
      unlocked: stats.focus_rate >= 70,
      icon: Sparkles,
      color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Gamification Header Panel */}
      <div className="grid gap-4 md:grid-cols-12">
        {/* Level Card */}
        <div className="md:col-span-5 flex flex-col justify-between p-5 bg-gradient-to-br from-primary/10 via-indigo-500/5 to-background border border-primary/25 rounded-2xl relative overflow-hidden">
          <div className="absolute right-4 top-4 text-primary/15 dark:text-primary/10">
            <Crown className="size-20" />
          </div>
          <div className="z-10">
            <span className="text-[10px] uppercase font-bold tracking-wider text-primary">Tiến trình cá nhân</span>
            <h2 className="text-2xl font-black text-foreground mt-1 flex items-baseline gap-2">
              Level {level} 
              <span className="text-xs font-semibold text-muted-foreground">({getRankName(level)})</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
              Cần thêm <span className="font-bold text-foreground tabular-nums">{10 - xp}</span> việc hoàn thành để lên cấp.
            </p>
          </div>
          <div className="mt-6 z-10">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-muted-foreground">Điểm kinh nghiệm (XP)</span>
              <span className="tabular-nums">{xp}/10 XP</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border/50">
              <div 
                className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${xpPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Motivation Card */}
        <div className={cn("md:col-span-7 flex items-start gap-4 p-5 bg-gradient-to-br border rounded-2xl relative overflow-hidden", motivation.theme)}>
          <span className="text-4xl select-none leading-none mt-1 shrink-0">{motivation.emoji}</span>
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold leading-tight">{motivation.title}</h3>
            <p className="text-xs leading-relaxed opacity-90">{motivation.description}</p>
          </div>
        </div>
      </div>

      {/* Achievements and Key Metrics */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Column 1: Completion gauges */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3">
          <CircularProgress percentage={stats.completion_rate} label="Tỉ lệ hoàn thành" />
          <CircularProgress percentage={stats.focus_rate} label="Mức độ tập trung" />
        </div>

        {/* Column 2: Achievements Badges */}
        <div className="lg:col-span-8 flex flex-col gap-3 p-4 bg-card/50 border border-border/80 rounded-2xl justify-center">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Huy chương đạt được</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Đã mở: {achievements.filter(a => a.unlocked).length}/{achievements.length}
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {achievements.map((ach) => {
              const Icon = ach.icon
              return (
                <div
                  key={ach.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all duration-300",
                    ach.unlocked
                      ? "bg-card border-border/80 shadow-none"
                      : "bg-muted/40 border-muted text-muted-foreground opacity-50"
                  )}
                >
                  <div className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors duration-300",
                    ach.unlocked ? ach.color : "bg-muted border-muted-foreground/10 text-muted-foreground"
                  )}>
                    {ach.unlocked ? <Icon className="size-4.5" /> : <Lock className="size-4 text-muted-foreground/60" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className={cn("text-xs font-bold leading-snug", ach.unlocked ? "text-foreground" : "text-muted-foreground")}>{ach.title}</h4>
                    <p className="text-[9px] text-muted-foreground leading-snug truncate mt-0.5">{ach.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Basic Metrics Tiles */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Việc chưa xong"
          value={String(stats.total_open)}
          hint={`${stats.due_today_count} việc đến hạn hôm nay`}
          icon={Target}
        />
        <StatTile
          label="Hoàn thành hôm nay"
          value={String(stats.completed_today)}
          hint={`Tổng đã xong: ${stats.total_completed}`}
          icon={CheckCircle2}
        />
        <StatTile
          label="Quá hạn"
          value={String(stats.overdue_count)}
          hint={
            stats.overdue_count > 0
              ? "Cần xử lý hoặc dời hạn ngay"
              : "Không có việc nào trễ hạn"
          }
          icon={AlertTriangle}
          tone={stats.overdue_count > 0 ? "warning" : "default"}
        />
      </div>

      {/* Visual Charts Layout */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Phân bổ theo ma trận</CardTitle>
            <CardDescription>
              Bạn đang dành nhiều sự tập trung vào góc phần tư nào nhất?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuadrantDistributionChart stats={stats.quadrant_stats} />
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">
              Nhịp độ hoàn thành (7 ngày qua)
            </CardTitle>
            <CardDescription>
              Số lượng công việc đã hoàn thành so với số việc tạo mới.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DailyCompletionChart data={stats.daily_completion} />
          </CardContent>
        </Card>
      </div>

      {/* Quadrant Detail Table */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Bảng phân tích góc phần tư</CardTitle>
          <CardDescription>
            Bảng thống kê số lượng công việc chi tiết theo từng nhóm ma trận Eisenhower.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Góc phần tư</th>
                  <th className="pb-2 pr-3 font-medium">Quy tắc</th>
                  <th className="pb-2 pr-3 text-right font-medium">Đang làm</th>
                  <th className="pb-2 pr-3 text-right font-medium">Đã xong</th>
                  <th className="pb-2 text-right font-medium">Quá hạn</th>
                </tr>
              </thead>
              <tbody>
                {QUADRANTS.map((meta) => {
                  const stat = byKey.get(meta.key)
                  return (
                    <tr key={meta.key} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-3">
                        <span className="flex items-center gap-2 font-medium">
                          <span
                            className={cn("size-2 rounded-full", meta.dot)}
                          />
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">
                        {meta.rule}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {stat?.open_count ?? 0}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">
                        {stat?.completed ?? 0}
                      </td>
                      <td
                        className={cn(
                          "py-2 text-right tabular-nums",
                          (stat?.overdue ?? 0) > 0
                            ? "font-medium text-rose-500"
                            : "text-muted-foreground"
                        )}
                      >
                        {stat?.overdue ?? 0}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
