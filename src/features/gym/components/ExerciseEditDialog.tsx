/**
 * Modal dialog for creating or editing a WorkoutExercise.
 *
 * Owns local form state; the parent supplies `editingExercise` (or null
 * for create), `categories`, and an `onSubmit` callback fired with a
 * normalised payload. The parent is responsible for closing the dialog.
 */
import * as React from "react"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import type { WorkoutCategory, WorkoutExercise } from "@/types"
import type { ExercisePayload } from "../api"
import { toastError } from "../utils/errors"

interface ExerciseEditDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  editingExercise: WorkoutExercise | null
  categories: WorkoutCategory[]
  defaultDate: string
  isSubmitting?: boolean
  onSubmit: (payload: ExercisePayload) => Promise<void> | void
}

export function ExerciseEditDialog({
  open,
  onOpenChange,
  editingExercise,
  categories,
  defaultDate,
  isSubmitting,
  onSubmit,
}: ExerciseEditDialogProps) {
  const isEdit = !!editingExercise
  const [name, setName] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("")
  const [sets, setSets] = React.useState(3)
  const [reps, setReps] = React.useState(10)
  const [weight, setWeight] = React.useState("")
  const [date, setDate] = React.useState(defaultDate)

  // Reset form whenever the dialog opens or the target changes.
  React.useEffect(() => {
    if (!open) return
    if (editingExercise) {
      setName(editingExercise.name)
      setCategoryId(editingExercise.category_id ?? "")
      setSets(editingExercise.sets)
      setReps(editingExercise.reps)
      setWeight(editingExercise.weight ? String(editingExercise.weight) : "")
      setDate(editingExercise.date)
    } else {
      setName("")
      setCategoryId(categories[0]?.id ?? "")
      setSets(3)
      setReps(10)
      setWeight("")
      setDate(defaultDate)
    }
  }, [open, editingExercise, categories, defaultDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toastError(new Error("Vui lòng nhập tên bài tập."), "Tên bài tập là bắt buộc.")
      return
    }
    const payload: ExercisePayload = {
      name: name.trim(),
      date,
      sets: Number(sets),
      reps: Number(reps),
      weight: weight ? Number(weight) : null,
      category_id: categoryId || null,
      completed: editingExercise ? editingExercise.completed : false,
    }
    try {
      await onSubmit(payload)
      onOpenChange(false)
    } catch (err) {
      toastError(err, "Có lỗi xảy ra khi lưu bài tập.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {isEdit ? "Cập nhật bài tập" : "Lên lịch bài tập mới"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thiết lập thông tin buổi tập của bạn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Tên bài tập</label>
              <Input
                placeholder="Ví dụ: Đẩy ngực ngang tạ đòn, Squat..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Nhóm cơ</label>
                <Select
                  value={categoryId}
                  onChange={setCategoryId}
                  options={[
                    { value: "", label: "Không phân loại" },
                    ...categories.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                  placeholder="Không phân loại"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Ngày tập</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Số hiệp (Sets)</label>
                <Input
                  type="number"
                  min="1"
                  value={sets}
                  onChange={(e) => setSets(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Số lần (Reps)</label>
                <Input
                  type="number"
                  min="1"
                  value={reps}
                  onChange={(e) => setReps(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Mức tạ (kg)</label>
                <Input
                  placeholder="Bodyweight"
                  type="number"
                  step="any"
                  min="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" className="cursor-pointer shadow-none" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : isEdit ? (
                "Cập nhật"
              ) : (
                "Lưu lại"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
