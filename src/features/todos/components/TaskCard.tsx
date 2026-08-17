/**
 * A single draggable task card inside a quadrant.
 *
 * Drag is wired with `useDraggable` from @dnd-kit/core and deliberately
 * activated from a dedicated grip handle rather than the whole card, so the
 * checkbox, edit and delete controls stay clickable.
 */
import { Check, GripVertical, Pencil, Trash2 } from "lucide-react"
import { useDraggable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import type { TodoTask } from "@/types"
import { formatDueLabel, isDueToday, isOverdue } from "../utils/dates"

interface TaskCardProps {
  task: TodoTask
  onToggle: (task: TodoTask) => void
  onEdit: (task: TodoTask) => void
  onDelete: (task: TodoTask) => void
}

export function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id, data: { quadrant: task.quadrant } })

  const overdue = !task.completed && isOverdue(task.due_date)
  const dueToday = !task.completed && isDueToday(task.due_date)

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        // Lift the dragged card above its siblings while it is in flight.
        zIndex: isDragging ? 50 : undefined,
      }}
      className={cn(
        "group relative flex items-start gap-2 rounded-lg border border-border bg-card p-2.5 shadow-sm transition-colors",
        "hover:border-foreground/20",
        isDragging && "opacity-80 shadow-lg ring-2 ring-primary/40",
        task.completed && "opacity-60"
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(task)}
        aria-label={task.completed ? "Đánh dấu chưa xong" : "Đánh dấu hoàn thành"}
        aria-pressed={task.completed}
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
          task.completed
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-input hover:border-emerald-500 hover:bg-emerald-500/10"
        )}
      >
        {task.completed ? <Check className="size-3.5" /> : null}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium leading-snug break-words",
            task.completed && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>

        {task.description ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground break-words">
            {task.description}
          </p>
        ) : null}

        {task.due_date ? (
          <span
            className={cn(
              "mt-1.5 inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium",
              overdue
                ? "bg-rose-500/10 text-rose-500"
                : dueToday
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {formatDueLabel(task.due_date)}
          </span>
        ) : null}
      </div>

      {/* Action rail: hidden until hover/focus to keep the matrix uncluttered,
          but always reachable by keyboard via focus-within. */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(task)}
          aria-label={`Sửa công việc: ${task.title}`}
          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(task)}
          aria-label={`Xoá công việc: ${task.title}`}
          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label={`Kéo để chuyển công việc: ${task.title}`}
          className="cursor-grab rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing touch-none"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
