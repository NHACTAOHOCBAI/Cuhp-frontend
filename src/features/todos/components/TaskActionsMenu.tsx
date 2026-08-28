/**
 * Keyboard-accessible per-task action menu.
 *
 * Provides "move to quadrant" entries (so the matrix layout is reachable
 * without dragging) plus a destructive "Xoá" item with confirmation.
 *
 * `onPointerDown` is stopped so opening the menu doesn't start a drag
 * (the dnd-kit listener sits on the card itself).
 */
import { MoreHorizontal, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ALL_QUADRANTS } from "../constants"
import type { TodoQuadrant, TodoTask } from "@/types"

interface TaskActionsMenuProps {
  task: TodoTask
  onMoveToQuadrant: (task: TodoTask, quadrant: TodoQuadrant) => void
  onDelete: (task: TodoTask) => void
  /** Disables the move entries while a previous mutation is still in flight. */
  disabled?: boolean
}

export function TaskActionsMenu({
  task,
  onMoveToQuadrant,
  onDelete,
  disabled,
}: TaskActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
        )}
        // Prevent the dnd-kit drag listener on the card from swallowing the click.
        onPointerDown={(e) => e.stopPropagation()}
      >
        <MoreHorizontal
          className="size-3.5"
          aria-label={`Mở menu thao tác cho công việc: ${task.title}`}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[14rem]">
        <DropdownMenuLabel>Di chuyển tới</DropdownMenuLabel>
        {ALL_QUADRANTS.map((meta) => {
          const Icon = meta.icon
          const isCurrent = task.quadrant === meta.key
          return (
            <DropdownMenuItem
              key={meta.key}
              disabled={disabled || isCurrent}
              onClick={() => onMoveToQuadrant(task, meta.key)}
              className={cn(isCurrent && "opacity-60")}
            >
              <span className={cn("size-2 shrink-0 rounded-full", meta.dot)} aria-hidden />
              <Icon className="size-3.5 shrink-0" aria-hidden />
              <span className="flex-1 truncate">{meta.label}</span>
              {isCurrent && (
                <span className="text-[10px] text-muted-foreground">hiện tại</span>
              )}
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={disabled}
          onClick={() => onDelete(task)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="size-3.5 shrink-0" aria-hidden />
          <span>Xoá công việc</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}