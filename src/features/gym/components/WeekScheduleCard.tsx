/**
 * "Lịch tuần" card - 7-day date picker with prev/next navigation.
 *
 * Layout:
 *   ┌──────────────────────────────────────────┐
 *   │ Lịch tuần        Tuần 17/08 - 23/08   [Hôm nay] [<] [>]│
 *   ├──────────────────────────────────────────┤
 *   │   T2   T3   T4   T5   T6   T7   CN     │
 *   │ [17]  18   19   20   21   22   23      │
 *   └──────────────────────────────────────────┘
 *   • hôm nay (chưa chọn) → viền + nền nhạt primary
 *   [n] = selected (primary fill)
 */
import * as React from "react"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatDateToISO, getDayShortName, getMonday } from "../utils/dates"

interface WeekScheduleCardProps {
  currentWeekMonday: Date
  selectedDateStr: string
  onSelectDate: (iso: string) => void
  onPrevWeek: () => void
  onNextWeek: () => void
  onJumpToToday: (todayIso: string, todayMonday: Date) => void
}

export function WeekScheduleCard({
  currentWeekMonday,
  selectedDateStr,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
  onJumpToToday,
}: WeekScheduleCardProps) {
  const weekDays = React.useMemo(() => {
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekMonday)
      d.setDate(currentWeekMonday.getDate() + i)
      days.push(d)
    }
    return days
  }, [currentWeekMonday])

  const todayIso = formatDateToISO(new Date())
  const weekRange = `${formatDateToISO(weekDays[0])} → ${formatDateToISO(
    weekDays[6]
  )}`

  const isOnCurrentWeek = selectedDateStr === todayIso

  const handleToday = () => {
    onJumpToToday(todayIso, getMonday(new Date()))
  }

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-semibold text-foreground leading-none">
            Lịch tuần
          </span>
          <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
            {weekRange}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="outline"
            size="sm"
            disabled={isOnCurrentWeek}
            onClick={handleToday}
            title="Lướt tới hôm nay"
            className="gap-1 h-7 px-2 cursor-pointer shadow-none text-[11px] font-bold"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Hôm nay
          </Button>
          <div className="flex items-center rounded-md border border-border bg-muted/40 p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-sm shadow-none cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={onPrevWeek}
              title="Tuần trước"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="h-4 w-px bg-border" aria-hidden />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-sm shadow-none cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={onNextWeek}
              title="Tuần sau"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((day) => {
            const isoStr = formatDateToISO(day)
            const isSelected = isoStr === selectedDateStr
            const isToday = todayIso === isoStr

            return (
              <button
                key={isoStr}
                type="button"
                onClick={() => onSelectDate(isoStr)}
                aria-pressed={isSelected}
                aria-label={`${getDayShortName(day)} ${day.getDate()} tháng ${day.getMonth() + 1}`}
                title={isoStr}
                className={cn(
                  "group flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg border transition-all duration-150 cursor-pointer select-none",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : isToday
                      ? "bg-primary/10 text-primary border-primary/50 hover:bg-primary/15 hover:border-primary"
                      : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-muted/60"
                )}
              >
                <span
                  className={cn(
                    "text-[10px] font-semibold leading-none uppercase tracking-wide",
                    isSelected ? "text-primary-foreground/80" : isToday ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {getDayShortName(day)}
                </span>
                <span className="text-sm font-bold leading-none tabular-nums">
                  {day.getDate()}
                </span>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
