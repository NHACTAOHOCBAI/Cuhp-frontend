import * as React from "react"
import { ChevronLeft, ChevronRight, Check, Calendar, RotateCcw } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  useHabitsQuery,
  useHabitLogsQuery,
  useToggleHabitLog,
} from "../hooks"


// Timezone-safe date helper
function getSqlDateString(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getMondayOfCurrentWeek(d: Date): Date {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  const monday = new Date(d.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}

function generateWeekDates(monday: Date): Date[] {
  const days = []
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday)
    nextDay.setDate(monday.getDate() + i)
    days.push(nextDay)
  }
  return days
}

export function HabitTracker({ onAddHabit }: { onAddHabit?: () => void }) {
  const [currentMonday, setCurrentMonday] = React.useState<Date>(() =>
    getMondayOfCurrentWeek(new Date())
  )


  const weekDates = React.useMemo(() => generateWeekDates(currentMonday), [currentMonday])
  const startDateStr = getSqlDateString(weekDates[0])
  const endDateStr = getSqlDateString(weekDates[6])

  // Queries
  const { data: habits = [], isLoading: habitsLoading } = useHabitsQuery()
  const { data: logs = [], isLoading: logsLoading } = useHabitLogsQuery(
    startDateStr,
    endDateStr
  )

  const toggleMut = useToggleHabitLog()

  // Filter active habits
  const activeHabits = React.useMemo(() => {
    return habits.filter((h) => h.is_active)
  }, [habits])

  // Split habits for left and right columns
  const { leftHabits, rightHabits } = React.useMemo(() => {
    const N = activeHabits.length
    const mid = Math.ceil(N / 2)
    return {
      leftHabits: activeHabits.slice(0, mid),
      rightHabits: activeHabits.slice(mid),
    }
  }, [activeHabits])

  // Check if a habit is logged as completed on a specific date
  const isLogged = React.useCallback(
    (habitId: string, dateStr: string) => {
      const log = logs.find((l) => l.habit_id === habitId && l.date === dateStr)
      return log ? log.completed : false
    },
    [logs]
  )

  // Toggle log status
  const handleToggle = (habitId: string, dateStr: string) => {
    const currentlyCompleted = isLogged(habitId, dateStr)
    toggleMut.mutate(
      {
        habit_id: habitId,
        date: dateStr,
        completed: !currentlyCompleted,
      },
      {
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Cập nhật nhật ký thói quen thất bại."
          )
        },
      }
    )
  }

  // Toggle all habits for a day
  const handleToggleAllForDay = (dateStr: string) => {
    // If all active habits are completed for this day, mark all as uncompleted.
    // Otherwise, mark all as completed.
    const allCompleted = activeHabits.every((h) => isLogged(h.id, dateStr))
    const targetState = !allCompleted

    activeHabits.forEach((h) => {
      const currentState = isLogged(h.id, dateStr)
      if (currentState !== targetState) {
        toggleMut.mutate({
          habit_id: h.id,
          date: dateStr,
          completed: targetState,
        })
      }
    })

    toast.success(
      targetState ? `Đã hoàn thành toàn bộ thói quen ngày ${dateStr}.` : `Đã huỷ hoàn thành ngày ${dateStr}.`
    )
  }

  // Date navigation
  const handlePrevWeek = () => {
    setCurrentMonday((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() - 7)
      return next
    })
  }

  const handleNextWeek = () => {
    setCurrentMonday((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() + 7)
      return next
    })
  }

  const handleTodayWeek = () => {
    setCurrentMonday(getMondayOfCurrentWeek(new Date()))
  }

  const renderIcon = (iconName: string | null, className?: string) => {
    const IconComponent = (iconName && (LucideIcons as any)[iconName]) || LucideIcons.CheckSquare
    return <IconComponent className={className} />
  }

  const formatDateDisplay = (d: Date) => {
    const daysVietnamese = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
    const dayName = daysVietnamese[d.getDay()]
    const monthsVietnamese = [
      "Th01", "Th02", "Th03", "Th04", "Th05", "Th06",
      "Th07", "Th08", "Th09", "Th10", "Th11", "Th12"
    ]
    const monthName = monthsVietnamese[d.getMonth()]
    return {
      dayOfWeek: dayName,
      dateFormatted: `${d.getDate()} ${monthName}, ${d.getFullYear()}`
    }
  }

  const isLoading = habitsLoading || logsLoading

  return (
    <div className="space-y-6">
      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-border rounded-2xl bg-card/60 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevWeek}
            className="size-9 cursor-pointer hover:bg-muted"
            title="Tuần trước"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            onClick={handleTodayWeek}
            className="h-9 px-3.5 cursor-pointer font-semibold flex items-center gap-1.5 hover:bg-muted"
          >
            <RotateCcw className="size-3.5" />
            Tuần này
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextWeek}
            className="size-9 cursor-pointer hover:bg-muted"
            title="Tuần sau"
          >
            <ChevronRight className="size-4" />
          </Button>

          <span className="text-sm font-semibold text-foreground/80 ml-2">
            Từ {weekDates[0].toLocaleDateString("vi-VN")} đến {weekDates[6].toLocaleDateString("vi-VN")}
          </span>
        </div>


      </div>

      {/* Grid habit table */}
      <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden select-none">
        {isLoading ? (
          <div className="p-16 text-center text-muted-foreground font-medium animate-pulse">
            Đang tải dữ liệu thói quen...
          </div>
        ) : activeHabits.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground flex flex-col items-center gap-4">
            <Calendar className="size-12 text-muted-foreground/40" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Không tìm thấy thói quen nào</p>
              <p className="text-xs max-w-[280px]">Bấm vào nút "Quản lý thói quen" ở trên để tạo thói quen đầu tiên của bạn.</p>
            </div>
            <Button
              onClick={onAddHabit}
              className="mt-2 cursor-pointer font-semibold"
            >
              Tạo thói quen ngay
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-fixed min-w-[900px]">
              {/* Table Header */}
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {/* Select all column */}
                  <th className="w-[50px] p-4 text-center"></th>

                  {/* Left habits */}
                  {leftHabits.map((h) => (
                    <th key={h.id} className="p-4 text-center font-semibold text-xs border-r border-border/40">
                      <div className="flex flex-col items-center gap-1.5 max-w-[120px] mx-auto">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-background border border-border shadow-sm">
                          {renderIcon(h.icon, "size-4 text-primary")}
                        </div>
                        <span className="truncate w-full text-foreground/80 hover:text-foreground" title={h.name}>
                          {h.name}
                        </span>
                        {h.streak > 0 && (
                          <span className="text-[10px] text-orange-600 font-bold flex items-center gap-0.5" title="Chuỗi hoàn thành hiện tại">
                            🔥 {h.streak}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}

                  {/* Date Column (Center) */}
                  <th className="w-[180px] p-4 text-center font-bold text-xs bg-primary/10 border-x border-primary/20">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shadow-sm text-primary">
                        <Calendar className="size-4" />
                      </div>
                      <span className="text-primary font-bold">Ngày / Date</span>
                    </div>
                  </th>

                  {/* Right habits */}
                  {rightHabits.map((h) => (
                    <th key={h.id} className="p-4 text-center font-semibold text-xs border-l border-border/40">
                      <div className="flex flex-col items-center gap-1.5 max-w-[120px] mx-auto">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-background border border-border shadow-sm">
                          {renderIcon(h.icon, "size-4 text-primary")}
                        </div>
                        <span className="truncate w-full text-foreground/80 hover:text-foreground" title={h.name}>
                          {h.name}
                        </span>
                        {h.streak > 0 && (
                          <span className="text-[10px] text-orange-600 font-bold flex items-center gap-0.5" title="Chuỗi hoàn thành hiện tại">
                            🔥 {h.streak}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-border/60">
                {weekDates.map((dateObj) => {
                  const dateStr = getSqlDateString(dateObj)
                  const displayDate = formatDateDisplay(dateObj)
                  const isAllDone = activeHabits.every((h) => isLogged(h.id, dateStr))

                  return (
                    <tr
                      key={dateStr}
                      className={cn(
                        "transition-colors hover:bg-muted/15",
                        isAllDone && "bg-emerald-50/15"
                      )}
                    >
                      {/* Day select all toggle */}
                      <td className="p-3 text-center border-r border-border/30">
                        <button
                          type="button"
                          onClick={() => handleToggleAllForDay(dateStr)}
                          title={isAllDone ? "Đánh dấu tất cả thói quen là chưa hoàn thành" : "Đánh dấu tất cả thói quen là hoàn thành"}
                          className={cn(
                            "flex size-5 mx-auto items-center justify-center rounded border transition-colors cursor-pointer",
                            isAllDone
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-input hover:border-emerald-500 hover:bg-emerald-500/10"
                          )}
                        >
                          {isAllDone ? <Check className="size-3.5" /> : null}
                        </button>
                      </td>

                      {/* Left checkboxes */}
                      {leftHabits.map((h) => {
                        const checked = isLogged(h.id, dateStr)
                        return (
                          <td key={h.id} className="p-3 text-center border-r border-border/40">
                            <button
                              type="button"
                              onClick={() => handleToggle(h.id, dateStr)}
                              className={cn(
                                "flex size-6 mx-auto items-center justify-center rounded-lg border transition-all duration-150 cursor-pointer active:scale-90 hover:scale-105",
                                checked
                                  ? "border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                                  : "border-input hover:border-emerald-500 hover:bg-emerald-500/10"
                              )}
                            >
                              {checked ? <Check className="size-4" /> : null}
                            </button>
                          </td>
                        )
                      })}

                      {/* Date details (Center) */}
                      <td className="p-3 text-center bg-primary/5 border-x border-primary/10">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-extrabold text-foreground/75">
                            {displayDate.dayOfWeek}
                          </span>
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {displayDate.dateFormatted}
                          </span>
                        </div>
                      </td>

                      {/* Right checkboxes */}
                      {rightHabits.map((h) => {
                        const checked = isLogged(h.id, dateStr)
                        return (
                          <td key={h.id} className="p-3 text-center border-l border-border/40">
                            <button
                              type="button"
                              onClick={() => handleToggle(h.id, dateStr)}
                              className={cn(
                                "flex size-6 mx-auto items-center justify-center rounded-lg border transition-all duration-150 cursor-pointer active:scale-90 hover:scale-105",
                                checked
                                  ? "border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                                  : "border-input hover:border-emerald-500 hover:bg-emerald-500/10"
                              )}
                            >
                              {checked ? <Check className="size-4" /> : null}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
