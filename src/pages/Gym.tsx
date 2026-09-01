import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"
import type { WorkoutExercise } from "@/types"
import {
  useGymCategoriesQuery,
  useGymExercisesQuery,
  useGymStatsQuery,
  useCreateExercise,
  useUpdateExercise,
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
  Pencil,
} from "lucide-react"
import { toast } from "sonner"
import { CustomSelect } from "@/components/ui/CustomSelect"

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
  const [editingExercise, setEditingExercise] = React.useState<WorkoutExercise | null>(null)

  // Add/Edit Exercise Form States
  const [exerciseName, setExerciseName] = React.useState("")
  const [selectedCategoryId, setSelectedCategoryId] = React.useState("")
  const [setsCount, setSetsCount] = React.useState(4)
  const [repsCount, setRepsCount] = React.useState(8)
  const [weightKg, setWeightKg] = React.useState(60)

  // 1. Fetch categories
  const { data: categories } = useGymCategoriesQuery()

  const categoryOptions = React.useMemo(() => {
    if (!categories) return []
    return categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
    }))
  }, [categories])

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
  const updateExerciseMutation = useUpdateExercise()
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
            `Copied ${res.created} exercises to next week! ${
              res.skipped_days ? `(Skipped ${res.skipped_days} days with existing data)` : ""
            }`
          )
        },
        onError: (err) => {
          toast.error(`Failed to copy workout: ${err.message}`)
        },
      }
    )
  }

  const handleOpenAddModal = () => {
    setEditingExercise(null)
    setExerciseName("")
    setSelectedCategoryId("")
    setSetsCount(4)
    setRepsCount(8)
    setWeightKg(60)
    setShowAddModal(true)
  }

  const handleOpenEditModal = (ex: WorkoutExercise) => {
    setEditingExercise(ex)
    setExerciseName(ex.name)
    setSelectedCategoryId(ex.category_id || ex.category?.id || "")
    setSetsCount(ex.sets)
    setRepsCount(ex.reps)
    setWeightKg(ex.weight ?? 0)
    setShowAddModal(true)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingExercise(null)
    setExerciseName("")
    setSelectedCategoryId("")
    setSetsCount(4)
    setRepsCount(8)
    setWeightKg(60)
  }

  // Create or update exercise submit handler
  const handleSaveExercise = (e: React.FormEvent) => {
    e.preventDefault()
    if (!exerciseName.trim()) {
      toast.error("Please enter an exercise name.")
      return
    }

    if (editingExercise) {
      updateExerciseMutation.mutate(
        {
          id: editingExercise.id,
          payload: {
            name: exerciseName.trim(),
            date: editingExercise.date,
            sets: setsCount,
            reps: repsCount,
            weight: weightKg,
            category_id: selectedCategoryId || null,
            completed: editingExercise.completed,
          },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["gym", "exercises"] })
            toast.success("Updated exercise!")
            handleCloseModal()
          },
          onError: (err) => {
            toast.error(`Error: ${err.message}`)
          },
        }
      )
    } else {
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
            toast.success("Added new exercise!")
            handleCloseModal()
          },
          onError: (err) => {
            toast.error(`Error: ${err.message}`)
          },
        }
      )
    }
  }

  const handleDeleteExercise = (id: string) => {
    if (confirm("Are you sure you want to delete this exercise?")) {
      deleteExerciseMutation.mutate(id, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["gym", "exercises"] })
          toast.success("Exercise deleted.")
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

  // Muscle Group Focus calculations (% of total sets per category/muscle group)
  const muscleGroupDistribution = React.useMemo(() => {
    const list = (allExercises && allExercises.length > 0) ? allExercises : (exercises || [])
    if (list.length === 0) return []

    const counts: Record<string, number> = {}
    let totalSets = 0

    list.forEach((ex) => {
      let groupName = "Khác"
      if (ex.category?.name) {
        groupName = ex.category.name
      } else {
        const lowerName = ex.name.toLowerCase()
        if (lowerName.includes("bench") || lowerName.includes("ngực") || lowerName.includes("chest")) groupName = "Ngực"
        else if (lowerName.includes("squat") || lowerName.includes("chân") || lowerName.includes("leg")) groupName = "Chân"
        else if (lowerName.includes("deadlift") || lowerName.includes("lưng") || lowerName.includes("back") || lowerName.includes("pull")) groupName = "Lưng"
        else if (lowerName.includes("press") || lowerName.includes("vai") || lowerName.includes("shoulder")) groupName = "Vai"
        else if (lowerName.includes("curl") || lowerName.includes("tay") || lowerName.includes("arm")) groupName = "Tay"
        else if (lowerName.includes("crunch") || lowerName.includes("bụng") || lowerName.includes("abs")) groupName = "Bụng"
        else if (lowerName.includes("cardio") || lowerName.includes("run") || lowerName.includes("chạy")) groupName = "Cardio"
      }

      const sets = ex.sets || 1
      counts[groupName] = (counts[groupName] || 0) + sets
      totalSets += sets
    })

    if (totalSets === 0) return []

    const colorMap: Record<string, string> = {
      "Ngực": "#EFBCD5",    // Signature Cuhp Pink
      "Chân": "#E39EC5",    // Soft Rose Pink
      "Lưng": "#D980B3",    // Deep Blush Pink
      "Vai": "#E8A2C3",     // Pastel Rose
      "Tay": "#F4C2D7",     // Soft Light Pink
      "Bụng": "#C86B98",    // Berry Plum Pink
      "Cardio": "#F2B4CE",  // Peach-Rose Pink
      "Khác": "#E0B6C7",    // Muted Rose Pink
    }

    return Object.entries(counts)
      .map(([name, sets]) => ({
        name,
        sets,
        percent: Math.round((sets / totalSets) * 100),
        color: colorMap[name] || "#EFBCD5",
      }))
      .sort((a, b) => b.sets - a.sets)
      .slice(0, 5)
  }, [allExercises, exercises])

  return (
    <div className="space-y-8">
      <header className="mt-4 mb-6">
        <h1 className="font-sora font-bold text-3xl mb-2 text-[#201B1E] tracking-tight">
          Training Log
        </h1>
        <p className="font-outfit font-normal text-base text-[#706065]">
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
                {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
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
            <div className="grid grid-cols-7 gap-2 mb-2 font-mono text-xs font-bold text-[#706065] uppercase tracking-wider text-center">
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
                const todayStr = new Date().toLocaleDateString("sv-SE")
                const isToday = cell.dateStr === todayStr
                const isSelected = cell.dateStr === selectedDateStr
                const hasWorkout = exerciseDates.has(cell.dateStr)

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`p-2 rounded-xl flex flex-col items-center justify-center min-h-[56px] border transition-all relative ${
                      isSelected
                        ? "bg-[#EFBCD5]/25 border-[#EFBCD5] text-[#1f1a1d] font-bold shadow-xs"
                        : isToday
                        ? "bg-[#fcf1f5] border-[#EFBCD5]/60 text-[#1f1a1d] font-bold"
                        : hasWorkout
                        ? "bg-[#fcf1f5]/50 border-[#E5DFE2] hover:border-[#EFBCD5] text-[#1f1a1d] font-semibold"
                        : "bg-white border-transparent hover:border-[#E5DFE2]/70 text-[#706065]"
                    } ${!cell.isCurrentMonth && "opacity-40"}`}
                  >
                    {/* Today Badge Dot */}
                    {isToday && (
                      <span
                        className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EFBCD5] ring-2 ring-white"
                        title="Today"
                      />
                    )}

                    <span
                      className={`flex items-center justify-center ${
                        isToday
                          ? "w-6 h-6 rounded-full bg-[#EFBCD5] text-[#201B1E] text-xs font-bold shadow-xs"
                          : ""
                      }`}
                    >
                      {cell.dayNum}
                    </span>

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
                    ? "Today"
                    : selectedDateStr}
                </h2>
                <p className="text-xs text-[#706065] font-semibold font-mono uppercase tracking-wider">
                  {dailyCategoryName}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyForward}
                  disabled={!exercises || exercises.length === 0}
                  className="bg-[#fcf1f5] text-[#7b5268] border border-[#d2c2c8] text-xs font-bold py-2 px-4 rounded-xl hover:bg-[#EFBCD5]/20 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  Apply Forward
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
                <p className="text-sm font-semibold">No exercises scheduled for this day.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-outfit">
                  <thead>
                    <tr className="border-b border-[#E5DFE2] text-[#706065] text-xs uppercase tracking-wider font-mono">
                      <th className="py-3 px-2 font-semibold w-8"></th>
                      <th className="py-3 px-2 font-semibold">Exercise</th>
                      <th className="py-3 px-2 font-semibold text-center">Sets</th>
                      <th className="py-3 px-2 font-semibold text-center">Reps</th>
                      <th className="py-3 px-2 font-semibold text-right">Weight</th>
                      <th className="py-3 px-2 font-semibold text-center w-12"></th>
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
                          className={`py-4 px-2 font-semibold ${
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
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(ex)}
                              className="text-zinc-400 hover:text-[#7b5268] transition-colors p-1"
                              title="Edit exercise"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteExercise(ex.id)}
                              className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                              title="Delete exercise"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1 text-sm font-sora font-semibold text-[#EFBCD5] hover:text-[#7b5268] transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Exercise</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (Consistency & Charts) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Consistency Card */}
          <div className="glass-card bg-white border border-[#E5DFE2] rounded-[24px] p-6 shadow-[0_10px_30px_-5px_rgba(239, 188, 213, 0.15)] flex flex-col items-center">
            <h3 className="font-sora font-bold text-xl text-[#201B1E] self-start mb-6">
              Consistency
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
                <span className="font-sora text-3xl font-bold text-[#201B1E]">
                  {consistencyPercent}%
                </span>
                <span className="font-mono text-xs text-[#706065] mt-0.5">
                  {completedDays} of {totalDays} days
                </span>
              </div>
            </div>
          </div>

          {/* Weekly Volume Card */}
          <div className="glass-card bg-white border border-[#E5DFE2] rounded-[24px] p-6 shadow-[0_10px_30px_-5px_rgba(239, 188, 213, 0.15)]">
            <h3 className="font-sora font-bold text-xl text-[#201B1E] mb-6">Weekly Volume</h3>
            <div className="flex items-end justify-between h-40 px-2 font-mono text-xs text-[#706065]">
              {stats?.weekly_volume.map((day, idx) => {
                const maxVol = Math.max(...stats.weekly_volume.map((d) => d.volume), 100)
                const heightPercent = Math.max(Math.round((day.volume / maxVol) * 100), 5)
                const [y, m, d] = day.date.split("-").map(Number)
                const dateObj = new Date(y, m - 1, d)
                const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" })

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 w-full">
                    <div className="relative group w-8 flex justify-center">
                      {/* Tooltip on hover */}
                      <span className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-[#201B1E] text-white text-xs px-1.5 py-0.5 rounded transition-opacity font-mono pointer-events-none z-10">
                        {Math.round(day.volume)}kg
                      </span>
                      <div
                        className={`w-5 rounded-t-lg transition-all duration-700 ${
                          day.volume > 0 ? "bg-[#EFBCD5]" : "bg-[#E5DFE2] opacity-35"
                        }`}
                        style={{ height: `${heightPercent}px` }}
                      ></div>
                    </div>
                    <span className="font-bold text-xs">{weekday[0].toUpperCase()}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Muscle Focus Card */}
          <div className="glass-card bg-white border border-[#E5DFE2] rounded-[24px] p-6 shadow-[0_10px_30px_-5px_rgba(239, 188, 213, 0.15)]">
            <h3 className="font-sora font-bold text-xl text-[#201B1E] mb-6">Muscle Focus</h3>
            {muscleGroupDistribution.length > 0 ? (
              <div className="space-y-4 font-outfit">
                {muscleGroupDistribution.map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between mb-1.5 text-sm font-semibold">
                      <span className="text-[#201B1E]">{item.name}</span>
                      <span className="font-mono text-xs font-bold text-[#7b5268]">
                        {item.percent}% ({item.sets} sets)
                      </span>
                    </div>
                    <div className="w-full bg-[#fcf1f5] h-2.5 rounded-full overflow-hidden border border-[#E5DFE2]/45">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${item.percent}%`,
                          backgroundColor: item.color,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-[#706065] font-outfit">
                <Dumbbell className="w-8 h-8 mx-auto mb-2 text-[#EFBCD5] opacity-60" />
                <p className="font-medium">Chưa có dữ liệu bài tập.</p>
                <p className="text-xs text-[#706065]/70 mt-1">Ghi nhật ký bài tập để xem phân bổ nhóm cơ.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gym Add Exercise Modal (overlay) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-6">
          <div className="bg-white border border-[#E5DFE2] rounded-[24px] w-full max-w-md p-6 shadow-[0_10px_40px_-5px_rgba(239,188,213,0.3)] animate-in zoom-in-95">
            <h3 className="font-sora font-bold text-xl text-[#201B1E] mb-6">
              {editingExercise ? "Edit Exercise" : "Add New Exercise"}
            </h3>

            <form onSubmit={handleSaveExercise} className="space-y-4 font-outfit">
              {/* Exercise Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#706065] uppercase font-mono tracking-wider">
                  Exercise Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bench Press, Squat, Lat Pulldown..."
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FCFAF7] border border-[#E5DFE2] rounded-xl text-sm focus:outline-none focus:border-[#EFBCD5] transition-all"
                />
              </div>

              {/* Category Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#706065] uppercase font-mono tracking-wider">
                  Muscle Group
                </label>
                <CustomSelect
                  value={selectedCategoryId}
                  onChange={(val) => setSelectedCategoryId(val)}
                  options={categoryOptions}
                  placeholder="-- Select muscle group --"
                />
              </div>

              {/* Sets & Reps Numeric Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#706065] uppercase font-mono tracking-wider">
                    Sets
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
                  <label className="text-xs font-bold text-[#706065] uppercase font-mono tracking-wider">
                    Reps / Set
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
                <label className="text-xs font-bold text-[#706065] uppercase font-mono tracking-wider">
                  Weight (kg)
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
                  onClick={handleCloseModal}
                  className="flex-1 py-3 border border-[#E5DFE2] text-[#706065] font-sora font-semibold text-sm rounded-xl hover:bg-zinc-50 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#EFBCD5] text-[#201B1E] font-sora font-semibold text-sm rounded-xl hover:opacity-90 active:scale-95 transition-all"
                >
                  {editingExercise ? "Save Changes" : "Add Exercise"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
