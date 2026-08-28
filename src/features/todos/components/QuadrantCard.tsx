/**
 * One cell of the Eisenhower matrix: a droppable container for task cards.
 *
 * The whole cell is a @dnd-kit drop target keyed by the quadrant name, so a
 * card dropped anywhere inside it moves to that quadrant.
 */
import { Plus } from "lucide-react"
import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { TodoQuadrant, TodoTask } from "@/types"
import type { QuadrantMeta } from "../constants"
import { TaskCard } from "./TaskCard"

interface QuadrantCardProps {
  meta: QuadrantMeta
  tasks: TodoTask[]
  onAdd: (quadrant: QuadrantMeta["key"]) => void
  onQuickAdd?: (quadrant: QuadrantMeta["key"], title: string) => void
  onToggle: (task: TodoTask) => void
  onEdit: (task: TodoTask) => void
  onDelete: (task: TodoTask) => void
  onMoveToQuadrant: (task: TodoTask, quadrant: TodoQuadrant) => void
}

export function QuadrantCard({
  meta,
  tasks,
  onAdd,
  onQuickAdd,
  onToggle,
  onEdit,
  onDelete,
  onMoveToQuadrant,
}: QuadrantCardProps) {
  const { setNodeRef, isOver } = useDroppable({ id: meta.key })
  const Icon = meta.icon
  const openCount = tasks.filter((t) => !t.completed).length
  const completedCount = tasks.length - openCount
  const progressPercent =
    tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100)

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-xl border border-border/70 shadow-none transition-colors overflow-hidden",
        meta.bg,
        isOver && cn("border-dashed", meta.ring)
      )}
    >
      <div
        className={cn(
          "flex items-start justify-between gap-2 rounded-t-xl px-3 py-2.5",
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
                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
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
          className="size-8 shrink-0 cursor-pointer"
          onClick={() => onAdd(meta.key)}
          aria-label={`Thêm công việc vào ô ${meta.label}`}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-2 p-2.5">
        {/* Quick Add Inline Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const form = e.currentTarget
            const input = form.elements.namedItem("title") as HTMLInputElement
            const title = input.value.trim()
            if (title) {
              onQuickAdd?.(meta.key, title)
              input.value = ""
            }
          }}
          className="flex gap-1.5"
        >
          <input
            name="title"
            placeholder="Thêm việc nhanh... (Enter)"
            aria-label={`Thêm nhanh công việc vào ô ${meta.label}`}
            className="flex h-7 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-xs shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </form>

        {tasks.length === 0 ? (
          <div className="flex min-h-[120px] flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border/80 p-4 text-center mt-1">
            <p className="text-xs text-muted-foreground">Chưa có công việc</p>
            <p className="text-[11px] text-muted-foreground/70">{meta.hint}</p>
          </div>
        ) : (
          <SortableContext
            items={tasks.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  dragId={task.id}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onMoveToQuadrant={onMoveToQuadrant}
                />
              ))}
            </div>
          </SortableContext>
        )}

        {/* Per-column progress footer */}
        <QuadrantProgressBar
          quadrantKey={meta.key}
          completed={completedCount}
          total={tasks.length}
          percent={progressPercent}
        />
      </div>
    </div>
  )
}

/**
 * Thin progress strip at the bottom of each quadrant. Shows "Hoàn thành N/M"
 * with a coloured bar so users can scan the matrix and see at a glance which
 * lanes are lagging. Hidden entirely when there are no tasks.
 *
 * Color comes from the quadrant key so the bar matches the lane's existing
 * badge colour (rose / blue / amber / violet).
 */
function QuadrantProgressBar({
  quadrantKey,
  completed,
  total,
  percent,
}: {
  quadrantKey: TodoQuadrant
  completed: number
  total: number
  percent: number
}) {
  if (total === 0) return null

  const barColor = {
    do: "bg-rose-500",
    schedule: "bg-blue-500",
    delegate: "bg-amber-500",
    eliminate: "bg-violet-500",
    inbox: "bg-slate-500",
  }[quadrantKey]

  return (
    <div
      className="mt-1 flex items-center gap-2 border-t border-border/40 pt-1.5"
      aria-label={`Tiến độ hoàn thành: ${completed}/${total} việc (${percent}%)`}
    >
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/60">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            barColor
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="shrink-0 text-[10px] font-semibold tabular-nums text-muted-foreground">
        {completed}/{total}
      </span>
    </div>
  )
}
