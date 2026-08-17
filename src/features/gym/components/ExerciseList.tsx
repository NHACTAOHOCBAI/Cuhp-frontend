/**
 * Schedule list + section header + empty state for a given day.
 *
 * Pure presentation — receives exercise rows from `GymPage` and emits
 * edit/toggle/delete/add/copy-forward callbacks.
 */
import * as React from "react"
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Dumbbell,
  Edit,
  Plus,
  Repeat,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { WorkoutExercise } from "@/types"
import {
  formatDateToDisplay,
  getDayName,
} from "../utils/dates"
import { getColorClasses } from "../utils/colors"

interface ExerciseListProps {
  exercises: WorkoutExercise[]
  selectedDateStr: string
  onEdit: (ex: WorkoutExercise) => void
  onDelete: (ex: WorkoutExercise) => void
  onToggleCompleted: (ex: WorkoutExercise) => void
  onAdd: () => void
  onCopyForward: (weeksAhead: number) => void | Promise<void>
}

const REPEAT_OPTIONS = [1, 2, 3, 4] as const

export function ExerciseList({
  exercises,
  selectedDateStr,
  onEdit,
  onDelete,
  onToggleCompleted,
  onAdd,
  onCopyForward,
}: ExerciseListProps) {
  const hasExercises = exercises.length > 0
  const [repeatOpen, setRepeatOpen] = React.useState(false)
  const repeatRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!repeatOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (repeatRef.current && !repeatRef.current.contains(e.target as Node)) {
        setRepeatOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRepeatOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [repeatOpen])

  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-1.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            Chi tiết ngày {formatDateToDisplay(new Date(selectedDateStr))}
          </h3>
          <p className="text-xs text-muted-foreground">
            {getDayName(new Date(selectedDateStr))}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div ref={repeatRef} className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasExercises}
              title={
                hasExercises
                  ? "Sao chép lịch ngày này sang các tuần tiếp theo"
                  : "Chưa có bài tập ở ngày này để áp dụng"
              }
              aria-haspopup="menu"
              aria-expanded={repeatOpen}
              onClick={() => setRepeatOpen((v) => !v)}
              className="gap-1.5 cursor-pointer shadow-none text-xs font-bold"
            >
              <Repeat className="h-3.5 w-3.5" />
              Áp dụng tiếp
              <ChevronDown className="h-3 w-3 ml-0.5 opacity-60" />
            </Button>
            {repeatOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 min-w-[10rem] z-50 overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
              >
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Áp dụng cho
                </div>
                <div className="my-1 h-px bg-border" />
                {REPEAT_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="menuitem"
                    disabled={!hasExercises}
                    onClick={() => {
                      setRepeatOpen(false)
                      onCopyForward(n)
                    }}
                    className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 text-left"
                  >
                    {n} tuần tiếp theo
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <Button
            onClick={onAdd}
            className="gap-1.5 cursor-pointer shadow-none text-xs font-bold"
            size="sm"
          >
            <Plus className="h-3.5 w-3.5" /> Thêm bài tập
          </Button>
        </div>
      </div>

      {exercises.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-2xl bg-muted/20 text-center space-y-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <Dumbbell className="h-5 w-5 text-muted-foreground/75" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold">Chưa có bài tập nào</p>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              Không tìm thấy bài tập nào được lên lịch cho ngày này.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 text-xs font-bold shadow-none"
            onClick={onAdd}
          >
            Thêm ngay
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {exercises.map((ex) => {
            const colorInfo = ex.category
              ? getColorClasses(ex.category.color)
              : getColorClasses("gray")
            return (
              <div
                key={ex.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  ex.completed
                    ? "bg-muted/30 border-muted text-muted-foreground"
                    : "bg-card border-border hover:shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <button
                    onClick={() => onToggleCompleted(ex)}
                    aria-label={ex.completed ? "Hủy hoàn thành" : "Đánh dấu hoàn thành"}
                    className={`h-6 w-6 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                      ex.completed
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-border bg-background hover:border-primary"
                    }`}
                  >
                    {ex.completed && <Check className="h-4 w-4 stroke-[3]" />}
                  </button>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-bold truncate ${
                          ex.completed
                            ? "line-through text-muted-foreground/60"
                            : "text-foreground"
                        }`}
                      >
                        {ex.name}
                      </span>
                      {ex.category ? (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorInfo.bg}`}
                        >
                          {ex.category.name}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-muted text-muted-foreground">
                          Không phân loại
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground font-medium">
                      {ex.sets} hiệp × {ex.reps} lần
                      {ex.weight ? ` • ${ex.weight} kg` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 ml-3 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={() => onEdit(ex)}
                    title="Chỉnh sửa"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 cursor-pointer"
                    onClick={() => onDelete(ex)}
                    title="Xoá"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
