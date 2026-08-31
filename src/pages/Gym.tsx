import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"
import {
  useGymCategoriesQuery,
  useGymExercisesQuery,
  useGymStatsQuery,
  useCreateExercise,
  useToggleExerciseComplete,
  useDeleteExercise,
  useCopyDayForward,
} from "@/features/gym/hooks"
import { fetchExercisesByDate } from "@/features/gym/api"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Dumbbell,
  Check,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

export default function Gym() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  // SVG circular progress layout constants
  const radius = 60
  const strokeWidth = 12
  const circumference = 2 * Math.PI * radius

  // Selected date state (defaults to today)
  const [selectedDateStr, setSelectedDateStr] = React.useState<string>(() => {
    return new Date().toLocaleDateString("sv-SE")
  })

  // Calendar month/year navigation state
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => new Date())

  // Modal open states
  const [showAddModal, setShowAddModal] = React.useState(false)

  // Add Exercise Form States
  const [exerciseName, setExerciseName] = React.useState("")
  const [selectedCategoryId, setSelectedCategoryId] = React.useState("")
  const [setsCount, setSetsCount] = React.useState(4)
  const [repsCount, setRepsCount] = React.useState(8)
  const [weightKg, setWeightKg] = React.useState(60)

  // 1. Fetch categories
  const { data: categories } = useGymCategoriesQuery()

  // 2. Fetch exercises for currently selected date
  const { data: exercises, isLoading: isExercisesLoading } = useGymExercisesQuery(selectedDateStr)

  // 3. Fetch stats
  const { data: stats } = useGymStatsQuery()

  // 4. Fetch all exercises to highlight calendar dates
  const { data: allExercises } = useQuery({
    queryKey: ["gym", "exercises", "all"] as const,
    queryFn: () => fetchExercisesByDate("", token),
    enabled: !!token,
  })

  // Mutations
  const createExerciseMutation = useCreateExercise()
  const toggleCompleteMutation = useToggleExerciseComplete()
  const deleteExerciseMutation = useDeleteExercise()
  const copyForwardMutation = useCopyDayForward()

  // Find all unique dates that contain exercises
  const exerciseDates = React.useMemo(() => {
    if (!allExercises) return new Set<string>()
    return new Set<string>(allExercises.map((e) => e.date))
  }, [allExercises])

  // Get active workout category for the selected day
  const dailyCategoryName = React.useMemo(() => {
    if (!exercises || exercises.length === 0) return "Workout Log"
    const counts: Record<string, number> = {}
    exercises.forEach((ex) => {
      if (ex.category?.name) {
        counts[ex.category.name] = (counts[ex.category.name] || 0) + 1
      }
    })
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    return sorted.length > 0 ? sorted[0][0] : "Workout Log"
  }, [exercises])

  // Generate calendar days for the currentMonth view
  const calendarDays = React.useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // First day of current month
    const firstDay = new Date(year, month, 1)
    // Starting day of the week (0 = Sun, 1 = Mon, ... 6 = Sat)
    // We want Monday as index 0, so: (firstDay.getDay() + 6) % 7
    const startDayOfWeek = (firstDay.getDay() + 6) % 7

    // Total days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    // Days from previous month to fill the first row
    const prevMonthDays = new Date(year, month, 0).getDate()
    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = []

    // Add days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthDays - i)
      days.push({
        dateStr: prevDate.toLocaleDateString("sv-SE"),
        dayNum: prevMonthDays - i,
        isCurrentMonth: false,
      })
    }

    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i)
      days.push({
        dateStr: currentDate.toLocaleDateString("sv-SE"),
        dayNum: i,
        isCurrentMonth: true,
      })
    }

    // Add days of next month to complete the grid (usually 42 cells)
    const totalCells = 42
    const nextMonthDaysToAdd = totalCells - days.length
    for (let i = 1; i <= nextMonthDaysToAdd; i++) {
      const nextDate = new Date(year, month + 1, i)
      days.push({
        dateStr: nextDate.toLocaleDateString("sv-SE"),
        dayNum: i,
        isCurrentMonth: false,
      })
    }

    return days;
  }, [currentMonth])

  // Change month handler
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  // Copy workouts forward to next week
  const handleCopyForward = () => {
    copyForwardMutation.mutate(
      {
        source_date: selectedDateStr,
        weeks_ahead: 1,
      },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: ["gym", "exercises"] })
          toast.success(
            `Đã sao chép ${res.created} bài tập sang tuần sau! ${
              res.skipped_days ? `(Bỏ qua ${res.skipped_days} ngày đã có dữ liệu)` : ""
            }`
          )
        },
        onError: (err) => {
          toast.error(`Lỗi sao chép lịch tập: ${err.message}`)
        },
      }
    )
  }

  // Create exercise submit handler
  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault()
    if (!exerciseName.trim()) {
      toast.error("Vui lòng nhập tên bài tập.")
      return
    }

    createExerciseMutation.mutate(
      {
        name: exerciseName.trim(),
        date: selectedDateStr,
        sets: setsCount,
        reps: repsCount,
        weight: weightKg,
        category_id: selectedCategoryId || null,
        completed: false,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["gym", "exercises"] })
          toast.success("Đã thêm bài tập mới!")
          setShowAddModal(false)
          setExerciseName("")
          // Reset default values
          setSetsCount(4)
          setRepsCount(8)
          setWeightKg(60)
        },
        onError: (err) => {
          toast.error(`Lỗi: ${err.message}`)
        },
      }
    )
  }

  const handleDeleteExercise = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa bài tập này?")) {
      deleteExerciseMutation.mutate(id, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["gym", "exercises"] })
          toast.success("Đã xóa bài tập.")
        },
      })
    }
  }

  // Calculate consistency percentage & details
  const { consistencyPercent, completedDays, totalDays } = React.useMemo(() => {
    if (!stats?.weekly_volume || stats.weekly_volume.length === 0) {
      return { consistencyPercent: 80, completedDays: 4, totalDays: 5 }
    }
    const daysWithWorkouts = stats.weekly_volume.filter((d) => d.total_count > 0)
    const total = daysWithWorkouts.length
    if (total === 0) return { consistencyPercent: 100, completedDays: 0, totalDays: 0 }

    const completed = daysWithWorkouts.filter((d) => d.completed_count === d.total_count).length
    const percent = Math.round((completed / total) * 100)
    return { consistencyPercent: percent, completedDays: completed, totalDays: total }
  }, [stats])

  // Estimated 1RM calculations (Max weight lifted for Bench, Squat, Deadlift)
  const personalRecords = React.useMemo(() => {
    const records = { squat: 120, bench: 90, deadlift: 140 }
    if (!stats?.exercise_progress) return records

    stats.exercise_progress.forEach((prog) => {
      const name = prog.exercise_name.toLowerCase()
      const maxWeight = prog.points.reduce((max, pt) => Math.max(max, pt.max_weight), 0)

      if (maxWeight > 0) {
        if (name.includes("squat")) records.squat = maxWeight
        if (name.includes("bench")) records.bench = maxWeight
        if (name.includes("deadlift")) records.deadlift = maxWeight
      }
    })

    return records
  }, [stats])

  return (
    <div className="space-y-8">
      <header className="mt-4 mb-6">
        <h1 className="font-sora font-bold text-[32px] mb-2 text-[#201B1E] tracking-tight">
          Training Log
        </h1>
        <p className="font-outfit font-normal text-[16px] text-[#706065]">
          Stay consistent. Track your progress.
        </p>
      </header>

      {/* Main Split-Screen Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Calendar & Workout Log) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Interactive Monthly Calendar Card */}
          <div className="glass-card bg-white border border-[#E5DFE2] rounded-[24px] p-6 shadow-[0_10px_30px_-5px_rgba(239, 188, 213, 0.15)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-sora text-xl font-bold text-[#201B1E] capitalize">
                {currentMonth.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg border border-[#E5DFE2] hover:bg-[#fcf1f5] text-[#706065] hover:text-[#EFBCD5] transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg border border-[#E5DFE2] hover:bg-[#fcf1f5] text-[#706065] hover:text-[#EFBCD5] transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Calendar Grid Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2 font-mono text-[11px] font-bold text-[#706065] uppercase tracking-wider text-center">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div>

            {/* Calendar Grid Cells */}
            <div className="grid grid-cols-7 gap-2 text-center text-sm font-outfit">
              {calendarDays.map((cell, index) => {
                const isSelected = cell.dateStr === selectedDateStr
                const hasWorkout = exerciseDates.has(cell.dateStr)

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`p-2 rounded-xl flex flex-col items-center justify-center min-h-[56px] border transition-all relative ${
                      isSelected
                        ? "bg-[#EFBCD5]/20 border-[#EFBCD5] text-[#1f1a1d] font-bold"
                        : hasWorkout
                        ? "bg-[#fcf1f5] border-[#E5DFE2] hover:border-[#EFBCD5] text-[#1f1a1d] font-semibold"
                        : "bg-white border-transparent hover:border-[#E5DFE2]/70 text-[#706065]"
                    } ${!cell.isCurrentMonth && "opacity-40"}`}
                  >
                    <span>{cell.dayNum}</span>
                    {hasWorkout && (
                      <Dumbbell className="h-3.5 w-3.5 text-[#EFBCD5] stroke-[2.5px] mt-0.5" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Workout Log Table Card */}
          <div className="glass-card bg-white border border-[#E5DFE2] rounded-[24px] p-6 shadow-[0_10px_30px_-5px_rgba(239, 188, 213, 0.15)]">
            <div className="flex justify-between items-center mb-6">
              <div className="space-y-1">
                <h2 className="font-sora text-xl font-bold text-[#201B1E]">
                  {selectedDateStr === new Date().toLocaleDateString("sv-SE")
                    ? "Hôm nay"
                    : selectedDateStr}
                </h2>
                <p className="text-xs text-[#706065] font-medium font-mono uppercase tracking-wider">
                  {dailyCategoryName}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyForward}
                  disabled={!exercises || exercises.length === 0}
                  className="bg-[#fcf1f5] text-[#7b5268] border border-[#d2c2c8] text-xs font-bold py-2 px-4 rounded-xl hover:bg-[#EFBCD5]/20 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  Áp dụng tiếp
                </button>
              </div>
            </div>

            {isExercisesLoading ? (
              <div className="py-8 space-y-3 animate-pulse">
                <div className="h-10 bg-zinc-50 rounded-lg w-full"></div>
                <div className="h-10 bg-zinc-50 rounded-lg w-full"></div>
                <div className="h-10 bg-zinc-50 rounded-lg w-full"></div>
              </div>
            ) : !exercises || exercises.length === 0 ? (
              <div className="text-center py-12 text-[#706065] flex flex-col items-center justify-center">
                <Dumbbell className="h-12 w-12 text-zinc-300 stroke-[1.25px] mb-3" />
                <p className="text-sm font-medium">Chưa có bài tập nào được lên lịch cho ngày này.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-outfit">
                  <thead>
                    <tr className="border-b border-[#E5DFE2] text-[#706065] text-xs uppercase tracking-wider font-mono">
                      <th className="py-3 px-2 font-medium w-8"></th>
                      <th className="py-3 px-2 font-medium">Bài tập</th>
                      <th className="py-3 px-2 font-medium text-center">Sets</th>
                      <th className="py-3 px-2 font-medium text-center">Reps</th>
                      <th className="py-3 px-2 font-medium text-right">Khối lượng</th>
                      <th className="py-3 px-2 font-medium text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {exercises.map((ex) => (
                      <tr
                        key={ex.id}
                        className="border-b border-[#E5DFE2]/70 hover:bg-zinc-50/50 transition-colors group"
                      >
                        <td className="py-4 px-2">
                          <button
                            onClick={() =>
                              toggleCompleteMutation.mutate({ id: ex.id, completed: !ex.completed })
                            }
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              ex.completed
                                ? "bg-[#EFBCD5] border-[#EFBCD5] text-white"
                                : "border-[#d2c2c8] hover:border-[#EFBCD5]"
                            }`}
                          >
                            {ex.completed && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                          </button>
                        </td>
                        <td
                          className={`py-4 px-2 font-medium ${
                            ex.completed ? "text-[#706065] line-through" : "text-[#201B1E]"
                          }`}
                        >
                          {ex.name}
                        </td>
                        <td className="py-4 px-2 text-center text-sm font-mono text-[#706065]">
                          {ex.sets}
                        </td>
                        <td className="py-4 px-2 text-center text-sm font-mono text-[#706065]">
                          {ex.reps}
                        </td>
                        <td className="py-4 px-2 text-right text-sm font-mono text-[#706065]">
                          {ex.weight ? `${ex.weight} kg` : "Bodyweight"}
                        </td>
                        <td className="py-4 px-2 text-center">
                          <button
                            onClick={() => handleDeleteExercise(ex.id)}
                            className="text-zinc-300 hover:text-red-500 transition-colors p-1"
                            title="Xóa bài tập"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#EFBCD5] text-[#201B1E] text-sm font-sora font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm"
              >
                <Plus className="h-4 w-4 stroke-[3px]" /> Thêm bài tập
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (Consistency & Charts) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Consistency Card */}
          <div className="glass-card bg-white border border-[#E5DFE2] rounded-[24px] p-6 shadow-[0_10px_30px_-5px_rgba(239, 188, 213, 0.15)] flex flex-col items-center">
            <h3 className="font-sora font-bold text-xl text-[#201B1E] self-start mb-6">
              Sự đều đặn
            </h3>
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  className="stroke-[#eae0e4]"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  className="stroke-[#EFBCD5] transition-all duration-1000 ease-out"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (consistencyPercent / 100) * circumference}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="font-sora text-[36px] font-bold text-[#201B1E]">
                  {consistencyPercent}%
                </span>
                <span className="font-mono text-[11px] text-[#706065] mt-0.5">
                  {completedDays} trên {totalDays} ngày
                </span>
              </div>
            </div>
          </div>

          {/* Weekly Volume Card */}
          <div className="glass-card bg-white border border-[#E5DFE2] rounded-[24px] p-6 shadow-[0_10px_30px_-5px_rgba(239, 188, 213, 0.15)]">
            <h3 className="font-sora font-bold text-xl text-[#201B1E] mb-6">Thể tích tuần</h3>
            <div className="flex items-end justify-between h-40 px-2 font-mono text-[11px] text-[#706065]">
              {stats?.weekly_volume.map((day, idx) => {
                const maxVol = Math.max(...stats.weekly_volume.map((d) => d.volume), 100)
                const heightPercent = Math.max(Math.round((day.volume / maxVol) * 100), 5)
                const weekday = new Date(day.date).toLocaleDateString("vi-VN", { weekday: "short" })

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 w-full">
                    <div className="relative group w-8 flex justify-center">
                      {/* Tooltip on hover */}
                      <span className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-[#201B1E] text-white text-[10px] px-1.5 py-0.5 rounded transition-opacity font-mono pointer-events-none z-10">
                        {Math.round(day.volume)}kg
                      </span>
                      <div
                        className={`w-5 rounded-t-lg transition-all duration-700 ${
                          day.volume > 0 ? "bg-[#EFBCD5]" : "bg-[#E5DFE2] opacity-35"
                        }`}
                        style={{ height: `${heightPercent}px` }}
                      ></div>
                    </div>
                    <span className="font-bold text-[10px]">{weekday[0].toUpperCase()}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Estimated 1RM Card */}
          <div className="glass-card bg-white border border-[#E5DFE2] rounded-[24px] p-6 shadow-[0_10px_30px_-5px_rgba(239, 188, 213, 0.15)]">
            <h3 className="font-sora font-bold text-xl text-[#201B1E] mb-6">Ước tính 1RM</h3>
            <div className="space-y-5 font-outfit">
              <div>
                <div className="flex justify-between mb-2 text-sm font-semibold">
                  <span className="text-[#201B1E]">Gánh đùi (Squat)</span>
                  <span className="font-mono text-sm font-bold text-[#7b5268]">
                    {personalRecords.squat} kg
                  </span>
                </div>
                <div className="w-full bg-[#fcf1f5] h-2.5 rounded-full overflow-hidden border border-[#E5DFE2]/45">
                  <div
                    className="bg-[#EFBCD5] h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min((personalRecords.squat / 200) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2 text-sm font-semibold">
                  <span className="text-[#201B1E]">Đẩy ngực (Bench Press)</span>
                  <span className="font-mono text-sm font-bold text-[#7b5268]">
                    {personalRecords.bench} kg
                  </span>
                </div>
                <div className="w-full bg-[#fcf1f5] h-2.5 rounded-full overflow-hidden border border-[#E5DFE2]/45">
                  <div
                    className="bg-[#EFBCD5] h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min((personalRecords.bench / 150) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2 text-sm font-semibold">
                  <span className="text-[#201B1E]">Kéo lưng (Deadlift)</span>
                  <span className="font-mono text-sm font-bold text-[#7b5268]">
                    {personalRecords.deadlift} kg
                  </span>
                </div>
                <div className="w-full bg-[#fcf1f5] h-2.5 rounded-full overflow-hidden border border-[#E5DFE2]/45">
                  <div
                    className="bg-[#EFBCD5] h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min((personalRecords.deadlift / 250) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gym Add Exercise Modal (overlay) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-6">
          <div className="bg-white border border-[#E5DFE2] rounded-[24px] w-full max-w-md p-6 shadow-[0_10px_40px_-5px_rgba(239,188,213,0.3)] animate-in zoom-in-95">
            <h3 className="font-sora font-bold text-[20px] text-[#201B1E] mb-6">
              Thêm bài tập mới
            </h3>

            <form onSubmit={handleAddExercise} className="space-y-4 font-outfit">
              {/* Exercise Name Input */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-[#706065] uppercase font-mono tracking-wider">
                  Tên bài tập
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bench Press, Squat, Lat Pulldown..."
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FCFAF7] border border-[#E5DFE2] rounded-xl text-sm focus:outline-none focus:border-[#EFBCD5] transition-all"
                />
              </div>

              {/* Category Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-[#706065] uppercase font-mono tracking-wider">
                  Nhóm cơ tập luyện
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FCFAF7] border border-[#E5DFE2] rounded-xl text-sm focus:outline-none focus:border-[#EFBCD5] transition-all"
                >
                  <option value="">-- Chọn phân loại nhóm cơ --</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sets & Reps Numeric Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#706065] uppercase font-mono tracking-wider">
                    Số Sets
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={20}
                    value={setsCount}
                    onChange={(e) => setSetsCount(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-[#FCFAF7] border border-[#E5DFE2] rounded-xl text-sm focus:outline-none focus:border-[#EFBCD5] transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#706065] uppercase font-mono tracking-wider">
                    Số Reps / Set
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={repsCount}
                    onChange={(e) => setRepsCount(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-[#FCFAF7] border border-[#E5DFE2] rounded-xl text-sm focus:outline-none focus:border-[#EFBCD5] transition-all font-mono"
                  />
                </div>
              </div>

              {/* Weight input */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-[#706065] uppercase font-mono tracking-wider">
                  Khối lượng (kg)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={500}
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#FCFAF7] border border-[#E5DFE2] rounded-xl text-sm focus:outline-none focus:border-[#EFBCD5] transition-all font-mono"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-[#E5DFE2] text-[#706065] font-sora font-semibold text-sm rounded-xl hover:bg-zinc-50 active:scale-95 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#EFBCD5] text-[#201B1E] font-sora font-semibold text-sm rounded-xl hover:opacity-90 active:scale-95 transition-all"
                >
                  Thêm bài tập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
