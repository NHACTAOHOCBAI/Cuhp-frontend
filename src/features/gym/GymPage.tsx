/**
 * Gym support page container ("Hỗ trợ tập gym").
 *
 * - Holds tab state (schedule | categories | stats) and selected date.
 * - Composes the Gym-specific sub-components and orchestrates data flow via
 *   React Query hooks from `./hooks`.
 * - Delegates toast/error handling to the local `utils/errors` helper so
 *   the fallback messages stay consistent.
 */
import * as React from "react"
import {
  Calendar,
  Dumbbell,
  FolderOpen,
  LineChart,
  Loader2,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { useConfirm } from "@/components/ConfirmDialog"
import { PageHeader } from "@/components/admin/PageHeader"

import {
  useCopyDayForward,
  useCreateCategory,
  useCreateExercise,
  useDeleteCategory,
  useDeleteExercise,
  useGymCategoriesQuery,
  useGymExercisesQuery,
  useGymStatsQuery,
  useToggleExerciseComplete,
  useUpdateCategory,
  useUpdateExercise,
} from "./hooks"
import type { CategoryPayload, ExercisePayload } from "./api"

import { TabsControl, type TabsControlItem } from "./components/TabsControl"
import { WeekScheduleCard } from "./components/WeekScheduleCard"
import { DailyProgressCircle } from "./components/DailyProgressCircle"
import { ExerciseList } from "./components/ExerciseList"
import { ExerciseEditDialog } from "./components/ExerciseEditDialog"
import { CategoryCardGrid } from "./components/CategoryCardGrid"
import { CategoryEditDialog } from "./components/CategoryEditDialog"
import { WeeklyVolumeChart } from "./components/WeeklyVolumeChart"
import { StrengthProgressChart } from "./components/StrengthProgressChart"

import type { WorkoutCategory, WorkoutExercise } from "@/types"
import { formatDateToISO, getMonday } from "./utils/dates"
import { toastError, toastSuccess } from "./utils/errors"

type TabKey = "schedule" | "categories" | "stats"

const TAB_ITEMS: TabsControlItem<TabKey>[] = [
  { value: "schedule", label: "Lịch tập", icon: <Calendar className="h-4 w-4 mr-1.5" /> },
  { value: "categories", label: "Nhóm cơ", icon: <FolderOpen className="h-4 w-4 mr-1.5" /> },
  { value: "stats", label: "Thống kê", icon: <TrendingUp className="h-4 w-4 mr-1.5" /> },
]

export function GymPage() {
  const confirm = useConfirm()

  // --- View state -------------------------------------------------------
  const [activeTab, setActiveTab] = React.useState<TabKey>("schedule")
  const [selectedDateStr, setSelectedDateStr] = React.useState<string>(
    formatDateToISO(new Date())
  )
  const [currentWeekMonday, setCurrentWeekMonday] = React.useState<Date>(
    getMonday(new Date())
  )

  // --- Data (queries) ---------------------------------------------------
  const { data: categories = [], isLoading: loadingCategories } =
    useGymCategoriesQuery()
  const { data: exercises = [], isLoading: loadingExercises } =
    useGymExercisesQuery(selectedDateStr)
  const { data: stats } = useGymStatsQuery(activeTab === "stats")

  // --- Mutations --------------------------------------------------------
  const createCategoryMut = useCreateCategory()
  const updateCategoryMut = useUpdateCategory()
  const deleteCategoryMut = useDeleteCategory()

  const createExerciseMut = useCreateExercise()
  const updateExerciseMut = useUpdateExercise()
  const toggleExerciseMut = useToggleExerciseComplete()
  const deleteExerciseMut = useDeleteExercise()
  const copyDayForwardMut = useCopyDayForward()

  // --- Dialog state -----------------------------------------------------
  const [editingExercise, setEditingExercise] = React.useState<WorkoutExercise | null>(
    null
  )
  const [exerciseDialogOpen, setExerciseDialogOpen] = React.useState(false)

  const [editingCategory, setEditingCategory] = React.useState<WorkoutCategory | null>(
    null
  )
  const [categoryDialogOpen, setCategoryDialogOpen] = React.useState(false)

  // --- Stats chart local state -----------------------------------------
  const [selectedChartExercise, setSelectedChartExercise] = React.useState("")
  React.useEffect(() => {
    if (
      stats &&
      stats.exercise_progress.length > 0 &&
      !stats.exercise_progress.some((p) => p.exercise_name === selectedChartExercise)
    ) {
      setSelectedChartExercise(stats.exercise_progress[0].exercise_name)
    }
  }, [stats, selectedChartExercise])

  const isLoading =
    (activeTab !== "stats" && (loadingCategories || loadingExercises)) ||
    (activeTab === "stats" && !stats)

  // --- Week navigation --------------------------------------------------
  const handlePrevWeek = () => {
    const prev = new Date(currentWeekMonday)
    prev.setDate(currentWeekMonday.getDate() - 7)
    setCurrentWeekMonday(prev)
  }
  const handleNextWeek = () => {
    const next = new Date(currentWeekMonday)
    next.setDate(currentWeekMonday.getDate() + 7)
    setCurrentWeekMonday(next)
  }
  const handleSelectDate = (iso: string) => {
    setSelectedDateStr(iso)
    // Snap the weekly navigator to whichever week the clicked day belongs to.
    const clicked = new Date(iso)
    const monday = getMonday(clicked)
    if (monday.getTime() !== currentWeekMonday.getTime()) {
      setCurrentWeekMonday(monday)
    }
  }
  const handleJumpToToday = (todayIso: string, todayMonday: Date) => {
    setSelectedDateStr(todayIso)
    if (todayMonday.getTime() !== currentWeekMonday.getTime()) {
      setCurrentWeekMonday(todayMonday)
    }
  }

  // --- Repeat schedule forward (manual) --------------------------------
  const handleCopyForward = async (weeksAhead: number) => {
    if (exercises.length === 0) {
      toastError(
        new Error("Chưa có bài tập ở ngày này để áp dụng."),
        "Chưa có bài tập ở ngày này để áp dụng.",
      )
      return
    }
    try {
      const result = await copyDayForwardMut.mutateAsync({
        source_date: selectedDateStr,
        weeks_ahead: weeksAhead,
      })
      const base = `Đã áp dụng ${result.created} bài tập cho ${weeksAhead} tuần tiếp theo`
      const skippedNote =
        result.skipped_days > 0
          ? `. Bỏ qua ${result.skipped_days} ngày đã có lịch.`
          : "."
      toastSuccess(base + skippedNote)
    } catch (err) {
      toastError(err, "Không thể áp dụng lịch cho các tuần tiếp theo.")
    }
  }

  // --- Exercise handlers -----------------------------------------------
  const openAddExercise = () => {
    setEditingExercise(null)
    setExerciseDialogOpen(true)
  }
  const openEditExercise = (ex: WorkoutExercise) => {
    setEditingExercise(ex)
    setExerciseDialogOpen(true)
  }
  const handleDeleteExercise = async (ex: WorkoutExercise) => {
    const ok = await confirm({
      title: "Xóa bài tập?",
      description: `Bạn có chắc muốn xóa bài tập "${ex.name}" không?`,
      variant: "destructive",
    })
    if (!ok) return
    try {
      await deleteExerciseMut.mutateAsync(ex.id)
      toastSuccess("Xóa bài tập thành công.")
    } catch (err) {
      toastError(err, "Không thể xóa bài tập.")
    }
  }
  const handleToggleExercise = async (ex: WorkoutExercise) => {
    try {
      await toggleExerciseMut.mutateAsync({ id: ex.id, completed: !ex.completed })
      toastSuccess(!ex.completed ? "Đã hoàn thành bài tập! 💪" : "Đã hủy hoàn thành.")
    } catch (err) {
      toastError(err, "Không thể cập nhật trạng thái.")
    }
  }
  const handleSubmitExercise = async (payload: ExercisePayload) => {
    if (editingExercise) {
      await updateExerciseMut.mutateAsync({ id: editingExercise.id, payload })
      toastSuccess("Cập nhật bài tập thành công.")
    } else {
      await createExerciseMut.mutateAsync(payload)
      toastSuccess("Thêm bài tập thành công.")
    }
  }

  // --- Category handlers ------------------------------------------------
  const openAddCategory = () => {
    setEditingCategory(null)
    setCategoryDialogOpen(true)
  }
  const openEditCategory = (cat: WorkoutCategory) => {
    setEditingCategory(cat)
    setCategoryDialogOpen(true)
  }
  const handleDeleteCategory = async (cat: WorkoutCategory) => {
    const ok = await confirm({
      title: `Xóa nhóm cơ "${cat.name}"?`,
      description:
        "Tất cả bài tập thuộc nhóm cơ này sẽ được chuyển thành Không phân loại. Bạn có chắc chắn?",
      variant: "destructive",
    })
    if (!ok) return
    try {
      await deleteCategoryMut.mutateAsync(cat.id)
      toastSuccess("Đã xóa nhóm cơ thành công.")
    } catch (err) {
      toastError(err, "Không thể xóa nhóm cơ.")
    }
  }
  const handleSubmitCategory = async (payload: CategoryPayload) => {
    if (editingCategory) {
      await updateCategoryMut.mutateAsync({ id: editingCategory.id, payload })
      toastSuccess("Cập nhật nhóm cơ thành công.")
    } else {
      await createCategoryMut.mutateAsync(payload)
      toastSuccess("Thêm nhóm cơ thành công.")
    }
  }

  // --- Derived UI values -----------------------------------------------
  const totalExc = exercises.length
  const completedExc = exercises.filter((e) => e.completed).length
  const completionPercentage =
    totalExc > 0 ? Math.round((completedExc / totalExc) * 100) : 0

  const exerciseProgressList = stats?.exercise_progress ?? []
  const selectedExerciseData = exerciseProgressList.find(
    (p) => p.exercise_name === selectedChartExercise
  )

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full">
      <PageHeader
        title="Hỗ trợ tập gym"
        description="Quản lý kế hoạch tập luyện hàng ngày, theo dõi chỉ số và trực quan hóa sức mạnh của bạn."
      >
        <TabsControl value={activeTab} onChange={setActiveTab} items={TAB_ITEMS} />
      </PageHeader>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {activeTab === "schedule" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-6">
                <WeekScheduleCard
                  currentWeekMonday={currentWeekMonday}
                  selectedDateStr={selectedDateStr}
                  onSelectDate={handleSelectDate}
                  onPrevWeek={handlePrevWeek}
                  onNextWeek={handleNextWeek}
                  onJumpToToday={handleJumpToToday}
                />
                <DailyProgressCircle
                  percentage={completionPercentage}
                  total={totalExc}
                  completed={completedExc}
                />
              </div>
              <ExerciseList
                exercises={exercises}
                selectedDateStr={selectedDateStr}
                onEdit={openEditExercise}
                onDelete={handleDeleteExercise}
                onToggleCompleted={handleToggleExercise}
                onAdd={openAddExercise}
                onCopyForward={handleCopyForward}
              />
            </div>
          ) : null}

          {activeTab === "categories" ? (
            <CategoryCardGrid
              categories={categories}
              onEdit={openEditCategory}
              onDelete={handleDeleteCategory}
              onAdd={openAddCategory}
            />
          ) : null}

          {activeTab === "stats" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border shadow-none">
                <CardHeader>
                  <CardTitle className="text-base font-extrabold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Khối lượng tập luyện 7 ngày qua
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <WeeklyVolumeChart data={stats?.weekly_volume ?? []} />
                  <p className="text-center text-xs text-muted-foreground mt-4 italic">
                    * Tổng khối lượng (Volume) = số hiệp × số lần × mức tạ (kg) của
                    các bài tập đã hoàn thành.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border shadow-none">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-4">
                  <CardTitle className="text-base font-extrabold flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-violet-500" />
                    Tiến trình nâng tạ tối đa (Max Weight)
                  </CardTitle>
                  {exerciseProgressList.length > 0 ? (
                    <div className="w-full sm:w-48">
                      <Select
                        value={selectedChartExercise}
                        onChange={setSelectedChartExercise}
                        options={exerciseProgressList.map((prog) => ({
                          value: prog.exercise_name,
                          label: prog.exercise_name,
                        }))}
                        placeholder="Chọn bài tập..."
                      />
                    </div>
                  ) : null}
                </CardHeader>
                <CardContent>
                  {selectedChartExercise ? (
                    <StrengthProgressChart
                      exerciseData={selectedExerciseData}
                      exerciseName={selectedChartExercise}
                    />
                  ) : (
                    <div className="flex h-48 flex-col items-center justify-center text-muted-foreground text-sm space-y-2 border border-dashed border-border rounded-xl">
                      <Dumbbell className="h-8 w-8 text-muted-foreground/30 animate-bounce" />
                      <span>Chưa có dữ liệu bài tập nào đã hoàn thành.</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </>
      )}

      <ExerciseEditDialog
        open={exerciseDialogOpen}
        onOpenChange={setExerciseDialogOpen}
        editingExercise={editingExercise}
        categories={categories}
        defaultDate={selectedDateStr}
        isSubmitting={createExerciseMut.isPending || updateExerciseMut.isPending}
        onSubmit={handleSubmitExercise}
      />

      <CategoryEditDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        editingCategory={editingCategory}
        isSubmitting={createCategoryMut.isPending || updateCategoryMut.isPending}
        onSubmit={handleSubmitCategory}
      />
    </div>
  )
}
