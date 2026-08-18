/**
 * Report view: KPI tiles + the two charts + an accessible table fallback.
 *
 * Rendered inside the "Thống kê" tab of the Todo page.
 */
import { AlertTriangle, CalendarCheck, CheckCircle2, Target } from "lucide-react"
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
          <p className="text-2xl font-bold leading-tight">{value}</p>
          <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function TodoStatsPanel({ stats }: { stats: TodoStats }) {
  const byKey = new Map(stats.quadrant_stats.map((s) => [s.quadrant, s]))

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
        <StatTile
          label="Tỉ lệ hoàn thành"
          value={`${stats.completion_rate}%`}
          hint={`${stats.focus_rate}% việc đang mở nằm ở nhóm quan trọng`}
          icon={CalendarCheck}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Phân bổ theo ma trận</CardTitle>
            <CardDescription>
              Bạn đang dồn thời gian vào góc phần tư nào?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuadrantDistributionChart stats={stats.quadrant_stats} />
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">
              Việc hoàn thành 7 ngày qua
            </CardTitle>
            <CardDescription>
              Nhịp độ làm việc theo từng ngày trong tuần.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DailyCompletionChart data={stats.daily_completion} />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Chi tiết từng góc phần tư</CardTitle>
          <CardDescription>
            Cùng dữ liệu với biểu đồ trên, ở dạng bảng.
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
