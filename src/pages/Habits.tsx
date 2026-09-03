import * as React from "react"
import {
  useHabitsQuery,
  useHabitLogsQuery,
  useCreateHabit,
  useDeleteHabit,
  useToggleHabitLog,
} from "@/features/habits/hooks"
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
  Star,
} from "lucide-react"
import { toast } from "sonner"

export default function Habits() {
  // 1. Fetch habits list & logs
  const { data: habits = [] } = useHabitsQuery()
  const createHabitMutation = useCreateHabit()
  const deleteHabitMutation = useDeleteHabit()
  const toggleLogMutation = useToggleHabitLog()

  // 2. Week view start date (always standard Monday of the week)
  const [weekStart, setWeekStart] = React.useState<Date>(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    const monday = new Date(today.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    return monday
  })

  // Date helpers
  const getWeekDates = (start: Date) => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      dates.push(d)
    }
    return dates
  }

  const formatYYYYMMDD = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const date = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${date}`
  }

  const weekDates = getWeekDates(weekStart)
  const startDateStr = formatYYYYMMDD(weekDates[0])
  const endDateStr = formatYYYYMMDD(weekDates[6])

  // Fetch logs for current week view
  const { data: weekLogs = [] } = useHabitLogsQuery(startDateStr, endDateStr)

  // 3. Heatmap setup (representing 3 months: 14 weeks)
  const heatmapStart = React.useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 90) // Last 90 days
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const heatmapEnd = React.useMemo(() => {
    const d = new Date()
    d.setHours(23, 59, 59, 999)
    return d
  }, [])

  const { data: heatmapLogs = [] } = useHabitLogsQuery(
    formatYYYYMMDD(heatmapStart),
    formatYYYYMMDD(heatmapEnd)
  )

  // Get completion logs map by date
  const logMap = React.useMemo(() => {
    const map: Record<string, Record<string, boolean>> = {}
    weekLogs.forEach((log) => {
      if (!map[log.date]) map[log.date] = {}
      map[log.date][log.habit_id] = log.completed
    })
    return map
  }, [weekLogs])

  // Check if a habit is logged for a specific date
  const isHabitCompleted = (habitId: string, dateStr: string) => {
    return logMap[dateStr]?.[habitId] || false
  }

  // Toggle habit log
  const handleToggleLog = (habitId: string, dateStr: string, currentStatus: boolean) => {
    toggleLogMutation.mutate(
      {
        habit_id: habitId,
        date: dateStr,
        completed: !currentStatus,
      },
      {
        onSuccess: () => {
          toast.success("Habit progress updated!")
        },
      }
    )
  }

  // Next / Prev week navigations
  const handlePrevWeek = () => {
    setWeekStart((prev) => {
      const d = new Date(prev)
      d.setDate(prev.getDate() - 7)
      return d
    })
  }

  const handleNextWeek = () => {
    setWeekStart((prev) => {
      const d = new Date(prev)
      d.setDate(prev.getDate() + 7)
      return d
    })
  }

  // Check if the viewed week is the current week
  const isCurrentWeek = React.useMemo(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    const currentMonday = new Date(today.setDate(diff))
    currentMonday.setHours(0, 0, 0, 0)
    return currentMonday.getTime() === weekStart.getTime()
  }, [weekStart])

  // Format week switcher text: "This Week: 31/08 - 06/09"
  const getWeekSwitcherText = () => {
    const startStr = `${String(weekDates[0].getDate()).padStart(2, "0")}/${String(
      weekDates[0].getMonth() + 1
    ).padStart(2, "0")}`
    const endStr = `${String(weekDates[6].getDate()).padStart(2, "0")}/${String(
      weekDates[6].getMonth() + 1
    ).padStart(2, "0")}`
    return `${isCurrentWeek ? "This Week" : "Period"}: ${startStr} - ${endStr}`
  }

  // Modal State for New Habit
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [habitName, setHabitName] = React.useState("")
  const [habitDesc, setHabitDesc] = React.useState("")

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!habitName.trim()) {
      toast.error("Please enter a habit name.")
      return
    }

    createHabitMutation.mutate(
      {
        name: habitName.trim(),
        description: habitDesc.trim() || null,
        icon: "flame",
        is_active: true,
        order: habits.length + 1,
      },
      {
        onSuccess: () => {
          toast.success("New habit added!")
          setIsModalOpen(false)
          setHabitName("")
          setHabitDesc("")
        },
      }
    )
  }

  const handleDeleteHabit = (id: string) => {
    if (confirm("Are you sure you want to delete this habit and all its history?")) {
      deleteHabitMutation.mutate(id, {
        onSuccess: () => {
          toast.success("Habit deleted.")
        },
      })
    }
  }

  // Current month name (e.g. "September")
  const currentMonthName = React.useMemo(() => {
    return new Date().toLocaleString("en-US", { month: "long" })
  }, [])

  // Calculate consistency analytics for sidebar
  const stats = React.useMemo(() => {
    const now = new Date()
    const currentMonthIndex = now.getMonth()
    const monthlyLogs = heatmapLogs.filter((log) => {
      const logDate = new Date(log.date)
      return logDate.getMonth() === currentMonthIndex && log.completed
    })

    // Group logs by date
    const dateGroups: Record<string, number> = {}
    monthlyLogs.forEach((log) => {
      dateGroups[log.date] = (dateGroups[log.date] || 0) + 1
    })

    const activeDaysCount = Object.keys(dateGroups).length
    const year = now.getFullYear()
    const daysInMonth = new Date(year, currentMonthIndex + 1, 0).getDate()

    return {
      activeDays: activeDaysCount,
      totalDays: daysInMonth,
    }
  }, [heatmapLogs])

  // Heatmap Weeks construction: 14 columns (weeks), each column has 7 Date objects (Mon-Sun)
  const heatmapWeeks = React.useMemo(() => {
    const weeks: Date[][] = []
    
    const startOfPeriod = new Date(heatmapStart)
    const day = startOfPeriod.getDay()
    const diff = startOfPeriod.getDate() - day + (day === 0 ? -6 : 1)
    const firstMonday = new Date(startOfPeriod.setDate(diff))
    firstMonday.setHours(0, 0, 0, 0)

    const totalWeeks = 14
    for (let w = 0; w < totalWeeks; w++) {
      const weekDates: Date[] = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(firstMonday)
        date.setDate(firstMonday.getDate() + w * 7 + d)
        weekDates.push(date)
      }
      weeks.push(weekDates)
    }
    return weeks
  }, [heatmapStart])

  // Calculate heatmap data count by date
  const heatmapCompletionMap = React.useMemo(() => {
    const map: Record<string, number> = {}
    heatmapLogs.forEach((log) => {
      if (log.completed) {
        map[log.date] = (map[log.date] || 0) + 1
      }
    })
    return map
  }, [heatmapLogs])

  // Get color intensity class for heatmap cells
  const getHeatmapColorClass = (date: Date) => {
    const dStr = formatYYYYMMDD(date)
    const count = heatmapCompletionMap[dStr] || 0
    if (count === 0) return "bg-[#E5DFE2]/40"
    if (count === 1) return "bg-[#EFBCD5]/35"
    if (count === 2) return "bg-[#EFBCD5]/70"
    return "bg-[#EFBCD5] shadow-xs"
  }

  // DYNAMIC Streak History Chart & Active Streak Calculation
  const streakChartData = React.useMemo(() => {
    if (!heatmapWeeks || heatmapWeeks.length === 0) {
      return { pathD: "", areaD: "", points: [], currentStreak: 0, lastPoint: { x: 272, y: 35 } }
    }

    // Calculate completions per week across the 14-week window
    const weeklyCounts: number[] = heatmapWeeks.map((week) => {
      let count = 0
      week.forEach((day) => {
        const dStr = formatYYYYMMDD(day)
        if (heatmapCompletionMap[dStr]) {
          count += heatmapCompletionMap[dStr]
        }
      })
      return count
    })

    const maxCount = Math.max(...weeklyCounts, 1)

    // Generate 7 bi-weekly trend points for the SVG curve
    const points: { x: number; y: number; val: number }[] = []
    const START_X = 15
    const END_X = 285
    const STEP_X = (END_X - START_X) / 6

    for (let i = 0; i < 7; i++) {
      const w1 = weeklyCounts[i * 2] || 0
      const w2 = weeklyCounts[i * 2 + 1] || 0
      const avg = (w1 + w2) / 2

      const x = Math.round(START_X + i * STEP_X)
      // Normalize y: 130 is bottom (0%), 35 is top (100%)
      const ratio = Math.min(avg / maxCount, 1)
      const y = Math.round(130 - ratio * 95)
      points.push({ x, y, val: Math.round(avg) })
    }

    // Smooth Bezier path
    let pathD = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i]
      const p2 = points[i + 1]
      const cx = (p1.x + p2.x) / 2
      pathD += ` C ${cx} ${p1.y}, ${cx} ${p2.y}, ${p2.x} ${p2.y}`
    }

    const lastPoint = points[points.length - 1]
    const firstPoint = points[0]
    const areaD = `${pathD} L ${lastPoint.x} 150 L ${firstPoint.x} 150 Z`

    // Real active consecutive streak calculation
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let streak = 0
    let checkDate = new Date(today)
    const todayStr = formatYYYYMMDD(checkDate)

    // If today has no completed log yet, check starting from yesterday
    if (!heatmapCompletionMap[todayStr]) {
      checkDate.setDate(checkDate.getDate() - 1)
    }

    while (true) {
      const dStr = formatYYYYMMDD(checkDate)
      if (heatmapCompletionMap[dStr] && heatmapCompletionMap[dStr] > 0) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    return {
      pathD,
      areaD,
      points,
      lastPoint,
      currentStreak: streak,
    }
  }, [heatmapWeeks, heatmapCompletionMap])

  return (
    <div className="space-y-8 font-outfit">
      {/* Top Header */}
      <header className="mt-4 mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-sora font-bold text-3xl mb-2 text-[#201B1E] tracking-tight">
            Habit Tracker
          </h1>
          <p className="font-outfit font-normal text-base text-[#706065]">
            Build good habits every day.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#EFBCD5] text-[#201B1E] font-sora font-bold text-sm px-5 py-2.5 rounded-2xl hover:bg-[#ebb8d1] active:scale-95 transition-all border border-[#ffd8ea] shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Habit</span>
        </button>
      </header>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Weekly Grid & Heatmap */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Weekly Habit Tracker Matrix Card */}
          <div className="bg-white rounded-[24px] border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] p-6">
            
            {/* Navigation Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E5DFE2]/60">
              <button
                onClick={handlePrevWeek}
                className="p-1.5 rounded-lg border border-[#E5DFE2] hover:bg-[#fcf1f5] text-[#706065] hover:text-[#EFBCD5] transition-colors cursor-pointer"
                title="Previous week"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <span className="font-sora font-bold text-sm sm:text-base text-[#1f1a1d]">
                {getWeekSwitcherText()}
              </span>

              <button
                onClick={handleNextWeek}
                className="p-1.5 rounded-lg border border-[#E5DFE2] hover:bg-[#fcf1f5] text-[#706065] hover:text-[#EFBCD5] transition-colors cursor-pointer"
                title="Next week"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Habit Table Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5DFE2]/60 font-mono text-xs font-bold text-[#706065] uppercase">
                    <th className="py-3 px-3 w-[240px]">Habit</th>
                    {weekDates.map((d, i) => (
                      <th key={i} className="py-3 px-2 text-center w-[60px]">
                        <div>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}</div>
                        <div className="text-[10px] opacity-60 font-normal mt-0.5">
                          {d.getDate()}
                        </div>
                      </th>
                    ))}
                    <th className="py-3 px-2 w-[40px]" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DFE2]/40 text-sm">
                  {habits.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[#706065]">
                        No habits created yet. Click "+ New Habit" above to start!
                      </td>
                    </tr>
                  ) : (
                    habits.map((habit) => (
                      <tr key={habit.id} className="hover:bg-[#FCFAF7]/80 transition-colors group">
                        <td className="py-4 px-3 font-medium text-[#1f1a1d]">
                          <div className="flex flex-col">
                            <span>{habit.name}</span>
                            {habit.description && (
                              <span className="text-xs text-[#706065] font-normal truncate max-w-[200px]">
                                {habit.description}
                              </span>
                            )}
                          </div>
                        </td>

                        {weekDates.map((d) => {
                          const dStr = formatYYYYMMDD(d)
                          const completed = isHabitCompleted(habit.id, dStr)
                          return (
                            <td key={dStr} className="py-4 px-2 text-center">
                              <button
                                onClick={() => handleToggleLog(habit.id, dStr, completed)}
                                className={`w-7 h-7 rounded-full border transition-all inline-flex items-center justify-center cursor-pointer ${
                                  completed
                                    ? "bg-[#EFBCD5] border-[#EFBCD5] text-white shadow-xs scale-105"
                                    : "border-[#E5DFE2] hover:border-[#EFBCD5] bg-white"
                                }`}
                              >
                                {completed && (
                                  <span className="w-2.5 h-2.5 rounded-full bg-white" />
                                )}
                              </button>
                            </td>
                          )
                        })}

                        <td className="py-4 px-2 text-right">
                          <button
                            onClick={() => handleDeleteHabit(habit.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#706065] hover:text-red-500 cursor-pointer"
                            title="Delete habit"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Heatmap Grid Card (3 Months Window) */}
          <div className="bg-white rounded-[24px] border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-sora font-bold text-lg text-[#1f1a1d]">
                  Consistency Heatmap
                </h3>
                <p className="text-xs text-[#706065]">
                  Daily completion volume over the last 3 months
                </p>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="overflow-x-auto">
              <div className="flex gap-2 min-w-max pt-2">
                {/* Day labels (Mon, Wed, Fri) */}
                <div className="flex flex-col justify-between py-1 text-[10px] font-mono text-[#706065] pr-2">
                  <span>Mon</span>
                  <span>Wed</span>
                  <span>Fri</span>
                </div>

                {/* Heatmap Columns (14 Weeks) */}
                <div className="flex gap-1.5">
                  {heatmapWeeks.map((week, wIndex) => (
                    <div key={wIndex} className="flex flex-col gap-1.5">
                      {week.map((date, dIndex) => {
                        const dStr = formatYYYYMMDD(date)
                        const count = heatmapCompletionMap[dStr] || 0
                        return (
                          <div
                            key={dIndex}
                            className={`w-3.5 h-3.5 rounded-xs transition-colors ${getHeatmapColorClass(
                              date
                            )}`}
                            title={`${date.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}: ${count} habit${count === 1 ? "" : "s"} completed`}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Heatmap Legend */}
              <div className="flex items-center justify-end gap-1.5 text-xs text-[#706065] mt-4 select-none">
                <span>Less</span>
                <span className="w-3.5 h-3.5 rounded-xs bg-[#E5DFE2]/40" />
                <span className="w-3.5 h-3.5 rounded-xs bg-[#EFBCD5]/35" />
                <span className="w-3.5 h-3.5 rounded-xs bg-[#EFBCD5]/70" />
                <span className="w-3.5 h-3.5 rounded-xs bg-[#EFBCD5]" />
                <span>More</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar (Month stats & Dynamic Streak history) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Monthly stats card */}
          <div className="bg-white rounded-[24px] border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] p-5 flex items-center gap-4 font-outfit">
            <div className="w-12 h-12 rounded-full bg-[#EFBCD5]/20 flex items-center justify-center text-[#7b5268] shrink-0">
              <Star className="h-6 w-6 fill-[#7b5268]/20" />
            </div>
            <div className="flex-grow min-w-0">
              <h4 className="font-sora font-bold text-base text-[#1f1a1d]">
                {currentMonthName} Progress
              </h4>
              <p className="text-xs text-[#706065] mt-0.5">
                Completed <strong>{stats.activeDays}</strong>/<strong>{stats.totalDays}</strong> days in {currentMonthName}
              </p>
              
              {/* Progress bar */}
              <div className="w-full bg-[#E5DFE2] h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-[#7b5268] h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      ((stats.activeDays || 0) / (stats.totalDays || 1)) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* DYNAMIC Streak History Line Chart Card */}
          <div className="bg-white rounded-[24px] border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] p-6 font-outfit relative">
            <h3 className="font-sora font-bold text-lg text-[#1f1a1d]">
              Streak History
            </h3>
            <p className="text-xs text-[#706065] mb-6">
              Last 3 months progress
            </p>

            {/* Dynamic SVG line chart */}
            <div className="relative h-[180px] w-full mt-4">
              <svg viewBox="0 0 300 150" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EFBCD5" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#EFBCD5" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                {/* Area path */}
                {streakChartData.areaD && (
                  <path d={streakChartData.areaD} fill="url(#chartGrad)" />
                )}
                
                {/* Line spline curve path */}
                {streakChartData.pathD && (
                  <path
                    d={streakChartData.pathD}
                    fill="none"
                    stroke="#7b5268"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                )}
                
                {/* Dynamic Milestone points */}
                {streakChartData.points.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r="4.5"
                    fill="white"
                    stroke="#7b5268"
                    strokeWidth="2.5"
                  />
                ))}

                {/* Highlight active last point */}
                {streakChartData.lastPoint && (
                  <circle
                    cx={streakChartData.lastPoint.x}
                    cy={streakChartData.lastPoint.y}
                    r="7"
                    fill="#7b5268"
                    opacity="0.2"
                  />
                )}
              </svg>

              {/* Dynamic Float tooltip over active streak milestone */}
              <div
                className="absolute z-30 bg-[#1f1a1d] text-white font-sora font-semibold text-xs px-2.5 py-1.5 rounded-lg shadow-md flex items-center gap-1 select-none transition-all duration-300 pointer-events-none"
                style={{
                  left: `${((streakChartData.lastPoint?.x || 272) / 300) * 100}%`,
                  top: `${Math.max(
                    ((streakChartData.lastPoint?.y || 35) / 150) * 100 - 25,
                    0
                  )}%`,
                  transform: "translateX(-75%)",
                }}
              >
                <span>
                  {streakChartData.currentStreak} day
                  {streakChartData.currentStreak === 1 ? "" : "s"} streak!
                </span>
                <div className="absolute bottom-[-4px] right-4 w-2 h-2 bg-[#1f1a1d] rotate-45" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Habit Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white rounded-[24px] p-6 border border-[#E5DFE2] shadow-[0_15px_35px_-5px_rgba(239,188,213,0.25)] w-full max-w-md animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#E5DFE2]">
              <h3 className="font-sora font-bold text-lg text-[#1f1a1d]">New Habit</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-[#706065] hover:text-[#EFBCD5] rounded-full hover:bg-zinc-50 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-4 font-outfit">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#706065] uppercase tracking-wider">
                  Habit Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  placeholder="e.g. Read 10 pages, Drink water..."
                  className="w-full bg-[#FCFAF7] border border-[#E5DFE2] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#EFBCD5] text-sm text-[#1f1a1d]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#706065] uppercase tracking-wider">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={habitDesc}
                  onChange={(e) => setHabitDesc(e.target.value)}
                  placeholder="e.g. Every morning at 7 AM"
                  className="w-full bg-[#FCFAF7] border border-[#E5DFE2] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#EFBCD5] text-sm text-[#1f1a1d]"
                />
              </div>

              <div className="pt-4 border-t border-[#E5DFE2] flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-[#E5DFE2] text-[#706065] rounded-xl font-sora font-semibold text-xs hover:bg-zinc-50 active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createHabitMutation.isPending}
                  className="flex-1 py-2.5 bg-[#EFBCD5] text-[#201B1E] rounded-xl font-sora font-bold text-xs hover:bg-[#ebb8d1] active:scale-95 transition-all shadow-sm border border-[#ffd8ea] cursor-pointer"
                >
                  {createHabitMutation.isPending ? "Adding..." : "Add Habit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
