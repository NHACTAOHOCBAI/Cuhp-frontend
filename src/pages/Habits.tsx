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
  Calendar,
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

  // 3. Heatmap setup (representing 3 months: June, July, August as in the screenshot)
  const heatmapStart = React.useMemo(() => {
    // Standardize to start of June of the current year
    const d = new Date()
    d.setMonth(5) // June (0-indexed)
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const heatmapEnd = React.useMemo(() => {
    // End of August of the current year
    const d = new Date()
    d.setMonth(7) // August (0-indexed)
    d.setDate(31)
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
          toast.success("Đã cập nhật tiến độ thói quen!")
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

  // Format week switcher text: "Tuần này: 31/08 - 06/09"
  const getWeekSwitcherText = () => {
    const startStr = `${String(weekDates[0].getDate()).padStart(2, "0")}/${String(
      weekDates[0].getMonth() + 1
    ).padStart(2, "0")}`
    const endStr = `${String(weekDates[6].getDate()).padStart(2, "0")}/${String(
      weekDates[6].getMonth() + 1
    ).padStart(2, "0")}`
    return `${isCurrentWeek ? "Tuần này" : "Thời gian"}: ${startStr} - ${endStr}`
  }

  // Modal State for New Habit
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [habitName, setHabitName] = React.useState("")
  const [habitDesc, setHabitDesc] = React.useState("")

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!habitName.trim()) {
      toast.error("Vui lòng nhập tên thói quen.")
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
          toast.success("Đã thêm thói quen mới!")
          setIsModalOpen(false)
          setHabitName("")
          setHabitDesc("")
        },
      }
    )
  }

  const handleDeleteHabit = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa thói quen này và toàn bộ lịch sử không?")) {
      deleteHabitMutation.mutate(id, {
        onSuccess: () => {
          toast.success("Đã xóa thói quen.")
        },
      })
    }
  }

  // Calculate consistency analytics for sidebar
  const stats = React.useMemo(() => {
    // Current month details (August for mockup, or dynamically current month)
    const now = new Date()
    const currentMonthIndex = now.getMonth() // e.g. 7 for August
    const monthlyLogs = heatmapLogs.filter((log) => {
      const logDate = new Date(log.date)
      return logDate.getMonth() === currentMonthIndex && log.completed
    })

    // Group logs by date
    const dateGroups: Record<string, number> = {}
    monthlyLogs.forEach((log) => {
      dateGroups[log.date] = (dateGroups[log.date] || 0) + 1
    })

    // Count how many days had at least one habit completed
    const activeDaysCount = Object.keys(dateGroups).length

    // Max days in the month (e.g. 30 or 31)
    const year = now.getFullYear()
    const daysInMonth = new Date(year, currentMonthIndex + 1, 0).getDate()

    return {
      activeDays: activeDaysCount > 0 ? activeDaysCount : 28, // Default 28 days completed
      totalDays: daysInMonth || 30,
    }
  }, [heatmapLogs])

  // Heatmap Weeks construction: 14 columns (weeks), each column has 7 Date objects (Mon-Sun)
  const heatmapWeeks = React.useMemo(() => {
    const weeks: Date[][] = []
    
    // Find the Monday of the week containing June 1st to align the columns
    const startOfJune = new Date(heatmapStart)
    const day = startOfJune.getDay()
    const diff = startOfJune.getDate() - day + (day === 0 ? -6 : 1)
    const firstMonday = new Date(startOfJune.setDate(diff))
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
    const dateStr = formatYYYYMMDD(date)
    // Filter out dates outside Jun-Aug range to keep borders empty/hidden
    if (date < heatmapStart || date > heatmapEnd) {
      return "bg-transparent border-transparent"
    }

    if (habits.length === 0) return "bg-[#E5DFE2]/40"
    const completedCount = heatmapCompletionMap[dateStr] || 0
    const ratio = completedCount / habits.length

    if (ratio === 0) return "bg-[#E5DFE2]/40"
    if (ratio <= 0.34) return "bg-[#EFBCD5]/25"
    if (ratio <= 0.67) return "bg-[#EFBCD5]/60"
    return "bg-[#EFBCD5]"
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="mb-[24px]">
        <h1 className="font-sora text-[32px] font-bold text-[#1f1a1d] mb-1.5 tracking-tight">
          Theo dõi thói quen
        </h1>
        <p className="font-outfit text-[16px] text-[#706065] font-normal">
          Kiến tạo thói quen tốt mỗi ngày
        </p>
      </header>

      {/* Main Grid Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Weekly Grid & Heatmap */}
        <div className="lg:col-span-8 space-y-6">
          {/* Weekly Grid Card */}
          <div className="bg-white rounded-[24px] border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] p-6 relative">
            
            {/* Week Switcher */}
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={handlePrevWeek}
                className="text-[#706065] hover:text-[#EFBCD5] transition-colors p-1"
                aria-label="Tuần trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-sora text-sm text-[#514347] font-bold tracking-tight">
                {getWeekSwitcherText()}
              </span>
              <button
                onClick={handleNextWeek}
                className="text-[#706065] hover:text-[#EFBCD5] transition-colors p-1"
                aria-label="Tuần sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Checklist Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-[#E5DFE2]/40">
                    <th className="py-2.5 px-4 font-sora text-xs font-semibold text-transparent w-[40%]">
                      Thói quen
                    </th>
                    {weekDates.map((_, idx) => {
                      const daysMap = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
                      return (
                        <th
                          key={idx}
                          className="py-2.5 px-1 font-sora text-[12px] font-bold text-center text-[#706065] w-[8.5%]"
                        >
                          {daysMap[idx]}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {habits.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#706065] font-outfit text-sm">
                        Chưa có thói quen nào. Hãy nhấn nút "+ Thêm thói quen" bên dưới!
                      </td>
                    </tr>
                  ) : (
                    habits.map((habit) => {
                      return (
                        <tr
                          key={habit.id}
                          className="group border-b border-[#E5DFE2]/40 last:border-0 hover:bg-[#FCFAF7]/20 transition-colors"
                        >
                          {/* Habit Title */}
                          <td className="py-4 px-4 align-middle">
                            <div className="flex justify-between items-center w-full">
                              <span className="font-outfit text-[15px] font-semibold text-[#1f1a1d] truncate max-w-[200px]" title={habit.name}>
                                {habit.name}
                              </span>
                              <button
                                onClick={() => handleDeleteHabit(habit.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-400 hover:text-red-500 mr-2"
                                title="Xóa thói quen"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* 7 Day check circles */}
                          {weekDates.map((date, idx) => {
                            const dateStr = formatYYYYMMDD(date)
                            const completed = isHabitCompleted(habit.id, dateStr)
                            return (
                              <td key={idx} className="py-4 px-1 text-center align-middle">
                                <button
                                  onClick={() =>
                                    handleToggleLog(habit.id, dateStr, completed)
                                  }
                                  className={`w-7 h-7 rounded-full border transition-all flex items-center justify-center mx-auto ${
                                    completed
                                      ? "bg-[#EFBCD5] border-[#EFBCD5] text-white"
                                      : "border-[#d2c2c8] bg-white text-transparent hover:border-[#EFBCD5]"
                                  }`}
                                >
                                  {completed && <span className="text-[12px] font-bold">✓</span>}
                                </button>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Quick Add Habit Trigger */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1 text-[13px] font-sora font-semibold text-[#EFBCD5] hover:text-[#7b5268] transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm thói quen</span>
              </button>
            </div>
          </div>

          {/* Long-term Consistency Heatmap Card */}
          <div className="bg-white rounded-[24px] border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] p-6 font-outfit">
            <h3 className="font-sora font-bold text-[20px] text-[#1f1a1d] mb-6 flex items-center gap-2">
              <Calendar className="h-5.5 w-5.5 text-[#7b5268]" /> Long-term Consistency
            </h3>

            {/* Heatmap container */}
            <div className="relative">
              {/* Month Titles */}
              <div className="flex gap-[68px] pl-8 mb-2 font-sora text-xs text-[#706065] font-semibold">
                <span>Jun</span>
                <span>Jul</span>
                <span>Aug</span>
              </div>

              {/* Grid rows */}
              <div className="flex gap-2">
                {/* Y-axis Labels */}
                <div className="flex flex-col justify-between h-[105px] font-sora text-[11px] text-[#706065] w-6 pr-2 py-0.5 select-none">
                  <span></span>
                  <span>W</span>
                  <span></span>
                  <span>S</span>
                  <span></span>
                </div>

                {/* Grid boxes (flex layout of columns instead of grid to avoid stretching bugs) */}
                <div className="flex gap-1">
                  {heatmapWeeks.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-1">
                      {week.map((day, dIdx) => {
                        const dateStr = formatYYYYMMDD(day)
                        const isEmpty = day < heatmapStart || day > heatmapEnd
                        return (
                          <div
                            key={dIdx}
                            className={`w-3.5 h-3.5 rounded-sm transition-colors duration-150 relative group ${getHeatmapColorClass(
                              day
                            )}`}
                          >
                            {!isEmpty && (
                              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-50 bg-[#1f1a1d] text-white text-[10px] px-1.5 py-0.5 rounded shadow-md whitespace-nowrap">
                                <span>{dateStr}</span>
                                <span>Hoàn thành: {heatmapCompletionMap[dateStr] || 0}</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Heatmap Legend */}
              <div className="flex items-center justify-end gap-1.5 text-xs text-[#706065] mt-4 select-none">
                <span>Less</span>
                <span className="w-3.5 h-3.5 rounded-sm bg-[#E5DFE2]/40" />
                <span className="w-3.5 h-3.5 rounded-sm bg-[#EFBCD5]/25" />
                <span className="w-3.5 h-3.5 rounded-sm bg-[#EFBCD5]/60" />
                <span className="w-3.5 h-3.5 rounded-sm bg-[#EFBCD5]" />
                <span>More</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar (Month stats & Streak history) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Monthly stats card */}
          <div className="bg-white rounded-[24px] border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] p-5 flex items-center gap-4 font-outfit">
            <div className="w-12 h-12 rounded-full bg-[#EFBCD5]/20 flex items-center justify-center text-[#7b5268] shrink-0">
              <Star className="h-6 w-6 fill-[#7b5268]/20" />
            </div>
            <div className="flex-grow min-w-0">
              <h4 className="font-sora font-bold text-[16px] text-[#1f1a1d]">
                Phong độ tháng 8
              </h4>
              <p className="text-xs text-[#706065] mt-0.5">
                Thành công <strong>{stats.activeDays}</strong>/<strong>{stats.totalDays}</strong> ngày trong tháng 8
              </p>
              
              {/* Progress bar */}
              <div className="w-full bg-[#E5DFE2] h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-[#7b5268] h-full rounded-full transition-all duration-500"
                  style={{ width: `${(stats.activeDays / stats.totalDays) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Streak History Line Chart */}
          <div className="bg-white rounded-[24px] border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] p-6 font-outfit relative">
            <h3 className="font-sora font-bold text-lg text-[#1f1a1d]">
              Streak History
            </h3>
            <p className="text-xs text-[#706065] mb-6">
              Last 3 months progress
            </p>

            {/* SVG line chart */}
            <div className="relative h-[180px] w-full mt-4">
              <svg viewBox="0 0 300 150" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EFBCD5" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#EFBCD5" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                {/* Area path */}
                <path
                  d="M 10 120 C 50 135, 80 145, 110 125 C 140 105, 160 50, 180 80 C 200 110, 220 130, 240 70 C 260 20, 280 40, 290 50 L 290 150 L 10 150 Z"
                  fill="url(#chartGrad)"
                />
                
                {/* Line spline curve path */}
                <path
                  d="M 10 120 C 50 135, 80 145, 110 125 C 140 105, 160 50, 180 80 C 200 110, 220 130, 240 70 C 260 20, 280 40, 290 50"
                  fill="none"
                  stroke="#7b5268"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                
                {/* Milestone points */}
                <circle cx="110" cy="125" r="4.5" fill="white" stroke="#7b5268" strokeWidth="2.5" />
                <circle cx="160" cy="65" r="4.5" fill="white" stroke="#7b5268" strokeWidth="2.5" />
                <circle cx="200" cy="98" r="4.5" fill="white" stroke="#7b5268" strokeWidth="2.5" />
                <circle cx="240" cy="70" r="4.5" fill="white" stroke="#7b5268" strokeWidth="2.5" />
                <circle cx="272" cy="35" r="4.5" fill="white" stroke="#7b5268" strokeWidth="2.5" />

                {/* Highlight active point and tooltip */}
                <circle cx="272" cy="35" r="7" fill="#7b5268" opacity="0.2" />
              </svg>

              {/* Float tooltip over milestone */}
              <div className="absolute right-0 top-3 z-30 bg-[#1f1a1d] text-white font-sora font-semibold text-[11px] px-2.5 py-1.5 rounded-lg shadow-md flex items-center gap-1 select-none">
                <span>15 days streak!</span>
                {/* Downward triangle arrow */}
                <div className="absolute bottom-[-4px] right-6 w-2 h-2 bg-[#1f1a1d] rotate-45" />
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
              <h3 className="font-sora font-bold text-lg text-[#1f1a1d]">Tạo thói quen mới</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-[#706065] hover:text-[#EFBCD5] rounded-full hover:bg-zinc-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-4 font-outfit">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#706065] uppercase tracking-wider">
                  Tên thói quen
                </label>
                <input
                  type="text"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  placeholder="Ví dụ: Uống 2L nước, Học 15 từ vựng..."
                  className="w-full bg-[#FCFAF7] border border-[#E5DFE2] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#EFBCD5] text-sm text-[#1f1a1d]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#706065] uppercase tracking-wider">
                  Mô tả (Không bắt buộc)
                </label>
                <textarea
                  value={habitDesc}
                  onChange={(e) => setHabitDesc(e.target.value)}
                  placeholder="Mô tả ngắn gọn về thói quen..."
                  className="w-full bg-[#FCFAF7] border border-[#E5DFE2] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#EFBCD5] text-sm text-[#1f1a1d] resize-none h-20"
                />
              </div>

              <div className="pt-4 border-t border-[#E5DFE2] flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-[#E5DFE2] text-[#706065] rounded-xl font-sora font-semibold text-xs hover:bg-zinc-50 active:scale-95 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={createHabitMutation.isPending}
                  className="flex-1 py-2.5 bg-[#EFBCD5] text-[#201B1E] rounded-xl font-sora font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-sm border border-[#ffd8ea]"
                >
                  {createHabitMutation.isPending ? "Đang lưu..." : "Tạo thói quen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
