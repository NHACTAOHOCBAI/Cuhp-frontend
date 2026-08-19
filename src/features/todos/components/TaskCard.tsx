/**
 * A single draggable task card inside a quadrant.
 *
 * Drag is wired with `useDraggable` from @dnd-kit/core and deliberately
 * activated from a dedicated grip handle rather than the whole card, so the
 * checkbox, edit and delete controls stay clickable.
 */
import { Check, Pencil, Trash2, Calendar, Clock, AlertTriangle, Hourglass } from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import type { TodoTask } from "@/types"
import { formatDueLabel, isDueToday, isOverdue } from "../utils/dates"

function formatEstimatedTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}p`
  }
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return remaining > 0 ? `${hours}h ${remaining}p` : `${hours}h`
}

interface TaskCardProps {
  task: TodoTask
  dragId?: string
  onToggle: (task: TodoTask) => void
  onEdit: (task: TodoTask) => void
  onDelete: (task: TodoTask) => void
}

export function TaskCard({ task, dragId, onToggle, onEdit, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: dragId || task.id,
    data: { quadrant: task.quadrant, taskId: task.id },
  })

  const overdue = !task.completed && isOverdue(task.due_date)
  const dueToday = !task.completed && isDueToday(task.due_date)
  const isScheduledOverdue = task.scheduled_date && task.due_date && task.scheduled_date > task.due_date
  const hasDeadlineWarning = !task.completed && (overdue || isScheduledOverdue)

  return (
    <div
      ref={setNodeRef}
      style={{
        // Lift the dragged card above its siblings while it is in flight,
        // and let @dnd-kit drive its translate so reordering feels smooth.
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
      }}
      className={cn(
        "group relative flex items-start gap-2.5 rounded-xl border p-3 shadow-none transition-all duration-150 cursor-grab active:cursor-grabbing",
        hasDeadlineWarning
          ? "border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 hover:border-rose-300"
          : "border-border bg-card hover:border-foreground/20",
        isDragging && "opacity-25 border-dashed border-primary/30 bg-primary/5 shadow-none ring-0 pointer-events-none",
        task.completed && "opacity-55"
      )}
      {...listeners}
      {...attributes}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onToggle(task)
        }}
        aria-label={task.completed ? "Đánh dấu chưa xong" : "Đánh dấu hoàn thành"}
        aria-pressed={task.completed}
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors cursor-pointer",
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

        {task.scheduled_date ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/50 px-2.5 py-0.5 text-[10px] font-medium leading-none">
              <Calendar className="size-3 shrink-0" />
              Làm: {formatDueLabel(task.scheduled_date)}
            </span>
            {task.due_date && (
              (() => {
                const isTaskOverdue = task.scheduled_date > task.due_date;
                return (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium leading-none border",
                      isTaskOverdue
                        ? "bg-rose-500 text-white border-rose-500 animate-pulse"
                        : "bg-amber-50/50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100/50 dark:border-amber-900/30"
                    )}
                  >
                    {isTaskOverdue ? (
                      <>
                        <AlertTriangle className="size-3 shrink-0" />
                        Trễ hạn: {formatDueLabel(task.due_date)}
                      </>
                    ) : (
                      <>
                        <Clock className="size-3 shrink-0 text-amber-500" />
                        Hạn: {formatDueLabel(task.due_date)}
                      </>
                    )}
                  </span>
                );
              })()
            )}
            {task.estimated_time && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 px-2.5 py-0.5 text-[10px] font-medium leading-none">
                <Hourglass className="size-2.5 shrink-0 opacity-80" />
                {formatEstimatedTime(task.estimated_time)}
              </span>
            )}
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 dark:bg-slate-900 text-slate-500 border border-slate-100 dark:border-slate-800 px-2.5 py-0.5 text-[10px] font-medium leading-none">
              <Calendar className="size-3 shrink-0 opacity-70" />
              Chờ xếp lịch
            </span>
            {task.due_date && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium leading-none border",
                  overdue
                    ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50"
                    : dueToday
                      ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30"
                      : "bg-slate-50 dark:bg-slate-900 text-slate-500 border border-slate-100 dark:border-slate-800"
                )}
              >
                {overdue ? (
                  <AlertTriangle className="size-3 shrink-0 text-rose-500" />
                ) : (
                  <Clock className="size-3 shrink-0 text-amber-500" />
                )}
                Hạn: {formatDueLabel(task.due_date)}
              </span>
            )}
            {task.estimated_time && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 px-2.5 py-0.5 text-[10px] font-medium leading-none">
                <Hourglass className="size-2.5 shrink-0 opacity-80" />
                {formatEstimatedTime(task.estimated_time)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action rail: hidden until hover/focus to keep the matrix uncluttered,
          but always reachable by keyboard via focus-within. */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(task)
          }}
          aria-label={`Sửa công việc: ${task.title}`}
          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(task)
          }}
          aria-label={`Xoá công việc: ${task.title}`}
          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
