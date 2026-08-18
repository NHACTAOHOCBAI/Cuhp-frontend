/**
 * Create / edit dialog for a single task.
 *
 * Mirrors the dialog pattern used by the vocabulary and gym features: local
 * draft state seeded from the `task` prop, a single `onSubmit` callback, and
 * the parent owning the mutation + toasts.
 */
import * as React from "react"
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
import type { TodoQuadrant, TodoTask } from "@/types"
import { QUADRANT_OPTIONS } from "../constants"
import { todayISO } from "../utils/dates"
import type { TodoTaskCreate, TodoTaskUpdate } from "../types"

interface TaskEditDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** Task being edited, or null when creating a new one. */
  task: TodoTask | null
  /** Quadrant to pre-select when creating. */
  defaultQuadrant: TodoQuadrant
  saving: boolean
  onSubmit: (payload: TodoTaskCreate | TodoTaskUpdate) => void
}

export function TaskEditDialog({
  open,
  onOpenChange,
  task,
  defaultQuadrant,
  saving,
  onSubmit,
}: TaskEditDialogProps) {
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [quadrant, setQuadrant] = React.useState<TodoQuadrant>(defaultQuadrant)
  const [dueDate, setDueDate] = React.useState("")
  const [scheduledDate, setScheduledDate] = React.useState("")

  // Reseed the draft every time the dialog opens so a cancelled edit never
  // leaks into the next one.
  React.useEffect(() => {
    if (!open) return
    setTitle(task?.title ?? "")
    setDescription(task?.description ?? "")
    setQuadrant(task?.quadrant ?? defaultQuadrant)
    setDueDate(task?.due_date ?? "")
    setScheduledDate(task?.scheduled_date ?? "")
  }, [open, task, defaultQuadrant])

  const trimmedTitle = title.trim()
  const canSubmit = trimmedTitle.length > 0 && !saving

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({
      title: trimmedTitle,
      // Empty strings become null so the server clears the column instead of
      // storing a blank value.
      description: description.trim() || null,
      quadrant,
      due_date: dueDate || null,
      scheduled_date: scheduledDate || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {task ? "Sửa công việc" : "Thêm công việc mới"}
            </DialogTitle>
            <DialogDescription>
              Chọn góc phần tư theo mức độ khẩn cấp và quan trọng của việc.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label htmlFor="todo-title" className="text-sm font-medium">
                Tên công việc <span className="text-destructive">*</span>
              </label>
              <Input
                id="todo-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Hoàn thành báo cáo quý"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="todo-desc" className="text-sm font-medium">
                Mô tả chi tiết
              </label>
              <textarea
                id="todo-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Ghi chú thêm (không bắt buộc)"
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-sm font-medium">Góc phần tư</span>
              <Select
                value={quadrant}
                onChange={(v) => setQuadrant(v as TodoQuadrant)}
                options={[...QUADRANT_OPTIONS]}
                ariaLabel="Chọn góc phần tư Eisenhower"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="todo-due" className="text-sm font-medium">
                Hạn chót (Deadline)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="todo-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setDueDate(todayISO())}
                >
                  Hôm nay
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setDueDate("")}
                  disabled={!dueDate}
                >
                  Xoá hạn
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="todo-scheduled" className="text-sm font-medium">
                Ngày lập lịch làm việc
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="todo-scheduled"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setScheduledDate(todayISO())}
                >
                  Hôm nay
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setScheduledDate("")}
                  disabled={!scheduledDate}
                >
                  Xoá lịch
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {saving ? "Đang lưu..." : task ? "Lưu thay đổi" : "Thêm công việc"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
