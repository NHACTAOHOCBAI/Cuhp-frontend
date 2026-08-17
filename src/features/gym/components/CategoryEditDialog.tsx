/**
 * Modal dialog for creating or editing a WorkoutCategory with a color picker.
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
import type { WorkoutCategory } from "@/types"
import type { CategoryPayload } from "../api"
import { toastError } from "../utils/errors"
import {
  AVAILABLE_COLORS,
  COLOR_LABELS,
  DEFAULT_COLOR,
  getColorClasses,
  type CategoryColor,
} from "../utils/colors"

interface CategoryEditDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  editingCategory: WorkoutCategory | null
  isSubmitting?: boolean
  onSubmit: (payload: CategoryPayload) => Promise<void> | void
}

export function CategoryEditDialog({
  open,
  onOpenChange,
  editingCategory,
  isSubmitting,
  onSubmit,
}: CategoryEditDialogProps) {
  const isEdit = !!editingCategory
  const [name, setName] = React.useState("")
  const [color, setColor] = React.useState<CategoryColor>(DEFAULT_COLOR)

  React.useEffect(() => {
    if (!open) return
    if (editingCategory) {
      setName(editingCategory.name)
      setColor(
        (AVAILABLE_COLORS as readonly string[]).includes(editingCategory.color)
          ? (editingCategory.color as CategoryColor)
          : DEFAULT_COLOR
      )
    } else {
      setName("")
      setColor(DEFAULT_COLOR)
    }
  }, [open, editingCategory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toastError(new Error("Vui lòng nhập tên nhóm cơ."), "Tên nhóm cơ là bắt buộc.")
      return
    }
    try {
      await onSubmit({ name: name.trim(), color })
      onOpenChange(false)
    } catch (err) {
      toastError(err, "Có lỗi xảy ra khi lưu nhóm cơ.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {isEdit ? "Cập nhật nhóm cơ" : "Thêm nhóm cơ tập luyện"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tạo nhãn nhóm cơ để gắn cho các bài tập.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Tên nhóm cơ</label>
              <Input
                placeholder="Ví dụ: Bắp tay, Lưng xô, Cánh tay..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground block">
                Màu sắc đại diện
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {AVAILABLE_COLORS.map((col) => {
                  const colorClasses = getColorClasses(col)
                  const isSelected = color === col
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setColor(col)}
                      className={`h-7 px-3 py-1 rounded-full text-xs font-bold border capitalize transition-all cursor-pointer ${
                        isSelected
                          ? `${colorClasses.badge} scale-105 border-transparent shadow-sm`
                          : `${colorClasses.bg} hover:scale-105`
                      }`}
                    >
                      {COLOR_LABELS[col as CategoryColor] ?? col}
                    </button>
                  )
                })}
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
