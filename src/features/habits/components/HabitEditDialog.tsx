import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import {
  Moon,
  Sun,
  Droplet,
  DollarSign,
  Dumbbell,
  GraduationCap,
  BookOpen,
  Volume2,
  Heart,
  CheckSquare,
} from "lucide-react"
import { useCreateHabit, useUpdateHabit } from "../hooks"
import type { Habit } from "../types"

interface HabitEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingHabit: Habit | null
  maxOrder: number
}

const ICON_OPTIONS = [
  { key: "Moon", Icon: Moon, label: "Đi ngủ" },
  { key: "Sun", Icon: Sun, label: "Thức dậy" },
  { key: "Droplet", Icon: Droplet, label: "Nước" },
  { key: "DollarSign", Icon: DollarSign, label: "Chi tiêu" },
  { key: "Dumbbell", Icon: Dumbbell, label: "Tập gym" },
  { key: "GraduationCap", Icon: GraduationCap, label: "Học tập" },
  { key: "BookOpen", Icon: BookOpen, label: "Đọc sách" },
  { key: "Volume2", Icon: Volume2, label: "Nghe/Nói" },
  { key: "Heart", Icon: Heart, label: "Sức khoẻ" },
  { key: "CheckSquare", Icon: CheckSquare, label: "Khác" },
]

export function HabitEditDialog({
  open,
  onOpenChange,
  editingHabit,
  maxOrder,
}: HabitEditDialogProps) {
  const createMut = useCreateHabit()
  const updateMut = useUpdateHabit()

  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [icon, setIcon] = React.useState("CheckSquare")
  const [isActive, setIsActive] = React.useState(true)
  const [order, setOrder] = React.useState(0)

  React.useEffect(() => {
    if (!open) return
    if (editingHabit) {
      setName(editingHabit.name)
      setDescription(editingHabit.description || "")
      setIcon(editingHabit.icon || "CheckSquare")
      setIsActive(editingHabit.is_active)
      setOrder(editingHabit.order)
    } else {
      setName("")
      setDescription("")
      setIcon("CheckSquare")
      setIsActive(true)
      setOrder(maxOrder + 1)
    }
  }, [editingHabit, open, maxOrder])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error("Tên thói quen không được để trống.")
      return
    }

    const payload = {
      name: trimmedName,
      description: description.trim() || null,
      icon,
      is_active: isActive,
      order,
    }

    if (editingHabit) {
      updateMut.mutate(
        { id: editingHabit.id, payload },
        {
          onSuccess: () => {
            toast.success("Đã cập nhật thói quen thành công.")
            onOpenChange(false)
          },
          onError: (err) => {
            toast.error(err instanceof Error ? err.message : "Cập nhật thất bại.")
          },
        }
      )
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success("Đã thêm thói quen mới thành công.")
          onOpenChange(false)
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Thêm mới thất bại.")
        },
      })
    }
  }

  const isPending = createMut.isPending || updateMut.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingHabit ? "Chỉnh sửa thói quen" : "Thêm thói quen mới"}</DialogTitle>
          <DialogDescription>
            {editingHabit
              ? "Cập nhật các thông tin cho thói quen này."
              : "Điền thông tin bên dưới để tạo một thói quen mới."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label htmlFor="habit-name" className="text-sm font-medium">
              Tên thói quen <span className="text-destructive">*</span>
            </label>
            <Input
              id="habit-name"
              placeholder="Ví dụ: Uống nước (2L), Tập gym..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="shadow-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="habit-desc" className="text-sm font-medium">
              Mô tả (tuỳ chọn)
            </label>
            <Input
              id="habit-desc"
              placeholder="Nhập ghi chú hoặc mục tiêu thói quen..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="shadow-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="habit-order" className="text-sm font-medium">
                Thứ tự hiển thị
              </label>
              <Input
                id="habit-order"
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                className="shadow-none"
              />
            </div>
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <span>Đang hoạt động</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Chọn biểu tượng (Icon)</label>
            <div className="flex flex-wrap gap-2 border border-border rounded-lg p-2.5 bg-muted/20 justify-start">
              {ICON_OPTIONS.map((opt) => {
                const OptIcon = opt.Icon
                const isSelected = icon === opt.key
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setIcon(opt.key)}
                    title={opt.label}
                    className={`size-10 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground scale-105 shadow-sm"
                        : "bg-background border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    <OptIcon className="size-4.5" />
                  </button>
                )
              })}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full mt-4 cursor-pointer font-semibold shadow-none"
            disabled={isPending}
          >
            {editingHabit ? "Lưu thay đổi" : "Tạo thói quen"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
