/**
 * One cell of the Eisenhower matrix: a droppable container for task cards.
 *
 * The whole cell is a @dnd-kit drop target keyed by the quadrant name, so a
 * card dropped anywhere inside it moves to that quadrant.
 */
import { Plus } from "lucide-react"
import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { TodoTask } from "@/types"
import type { QuadrantMeta } from "../constants"
import { TaskCard } from "./TaskCard"

interface QuadrantCardProps {
  meta: QuadrantMeta
  tasks: TodoTask[]
  onAdd: (quadrant: QuadrantMeta["key"]) => void
  onToggle: (task: TodoTask) => void
  onEdit: (task: TodoTask) => void
  onDelete: (task: TodoTask) => void
}

export function QuadrantCard({
  meta,
  tasks,
  onAdd,
  onToggle,
  onEdit,
  onDelete,
}: QuadrantCardProps) {
  const { setNodeRef, isOver } = useDroppable({ id: meta.key })
  const Icon = meta.icon
  const openCount = tasks.filter((t) => !t.completed).length

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[260px] flex-col rounded-xl border-2 border-border bg-card shadow-none transition-colors",
        isOver && cn("border-dashed", meta.ring)
      )}
    >
      <div
        className={cn(
          "flex items-start justify-between gap-2 rounded-t-xl border-b border-border px-3 py-2.5",
          meta.header
        )}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("size-2 shrink-0 rounded-full", meta.dot)} />
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <h3 className="truncate text-sm font-semibold">{meta.label}</h3>
            <span
              className={cn(
                "shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium",
                meta.badge
              )}
            >
              {openCount}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {meta.rule}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={() => onAdd(meta.key)}
          aria-label={`Thêm công việc vào ô ${meta.label}`}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-2.5">
        {tasks.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border/60 p-4 text-center">
            <p className="text-xs text-muted-foreground">Chưa có công việc</p>
            <p className="text-[11px] text-muted-foreground/70">{meta.hint}</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}
