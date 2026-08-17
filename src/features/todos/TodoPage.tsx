/**
 * Todo list organised by the Eisenhower time-management matrix.
 *
 * Two tabs: the 2x2 matrix (drag a card between quadrants to re-prioritise)
 * and a stats/report view. Tasks are a rolling backlog — an unfinished task
 * stays put until it is completed, and the optional deadline drives the
 * "Hôm nay / Tuần này / Tất cả" scope filter.
 */
import * as React from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import { BarChart3, LayoutGrid, ListChecks, Plus, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/PageHeader"
import { useConfirm } from "@/components/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { TabsControl, type TabsControlItem } from "@/components/ui/tabs-control"
import { cn } from "@/lib/utils"
import type { TodoQuadrant, TodoTask } from "@/types"
import { QUADRANTS, SCOPE_OPTIONS } from "./constants"
import {
  useCreateTodo,
  useDeleteCompletedTodos,
  useDeleteTodo,
  useMoveTodo,
  useTodoStatsQuery,
  useTodosQuery,
  useToggleTodo,
  useUpdateTodo,
} from "./hooks"
import type { TodoScope, TodoTaskCreate, TodoTaskUpdate } from "./types"
import { QuadrantCard } from "./components/QuadrantCard"
import { TaskCard } from "./components/TaskCard"
import { TaskEditDialog } from "./components/TaskEditDialog"
import { TodoStatsPanel } from "./components/TodoStatsPanel"

type TabKey = "matrix" | "stats"

const TAB_ITEMS: TabsControlItem<TabKey>[] = [
  { value: "matrix", label: "Ma trận", icon: <LayoutGrid className="mr-1.5 size-4" /> },
  { value: "stats", label: "Thống kê", icon: <BarChart3 className="mr-1.5 size-4" /> },
]

export function TodoPage() {
  const confirm = useConfirm()

  const [activeTab, setActiveTab] = React.useState<TabKey>("matrix")
  const [scope, setScope] = React.useState<TodoScope>("all")
  const [search, setSearch] = React.useState("")
  const [showCompleted, setShowCompleted] = React.useState(false)

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingTask, setEditingTask] = React.useState<TodoTask | null>(null)
  const [draftQuadrant, setDraftQuadrant] = React.useState<TodoQuadrant>("do")
  const [activeDragId, setActiveDragId] = React.useState<string | null>(null)

  // Debounce the search box so typing does not fire a request per keystroke.
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const listParams = React.useMemo(
    () => ({
      scope,
      q: debouncedSearch || undefined,
      show_completed: showCompleted,
    }),
    [scope, debouncedSearch, showCompleted]
  )

  const { data, isLoading } = useTodosQuery(listParams)
  const { data: stats, isLoading: statsLoading } = useTodoStatsQuery()

  const createMut = useCreateTodo()
  const updateMut = useUpdateTodo()
  const deleteMut = useDeleteTodo()
  const toggleMut = useToggleTodo()
  const moveMut = useMoveTodo()
  const clearDoneMut = useDeleteCompletedTodos()

  const tasks = React.useMemo(() => data?.items ?? [], [data])

  /** Bucket tasks by quadrant once, so each cell is a cheap lookup. */
  const tasksByQuadrant = React.useMemo(() => {
    const buckets = new Map<TodoQuadrant, TodoTask[]>(
      QUADRANTS.map((q) => [q.key, [] as TodoTask[]])
    )
    for (const task of tasks) {
      buckets.get(task.quadrant)?.push(task)
    }
    for (const bucket of buckets.values()) {
      bucket.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1
        return a.position - b.position
      })
    }
    return buckets
  }, [tasks])

  const activeDragTask = React.useMemo(
    () => tasks.find((t) => t.id === activeDragId) ?? null,
    [tasks, activeDragId]
  )

  const completedCount = tasks.filter((t) => t.completed).length

  // Require a small drag distance before a pointer press counts as a drag, so
  // clicking the grip handle never accidentally starts one.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null)
    const { active, over } = event
    if (!over) return

    const taskId = String(active.id)
    const target = String(over.id) as TodoQuadrant
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.quadrant === target) return

    moveMut.mutate(
      {
        id: taskId,
        // Dropped cards land at the bottom of the target quadrant.
        payload: { quadrant: target, position: tasksByQuadrant.get(target)?.length ?? 0 },
      },
      {
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Không chuyển được công việc."
          ),
      }
    )
  }

  const openCreate = (quadrant: TodoQuadrant) => {
    setEditingTask(null)
    setDraftQuadrant(quadrant)
    setDialogOpen(true)
  }

  const openEdit = (task: TodoTask) => {
    setEditingTask(task)
    setDraftQuadrant(task.quadrant)
    setDialogOpen(true)
  }

  const handleSubmit = (payload: TodoTaskCreate | TodoTaskUpdate) => {
    if (editingTask) {
      updateMut.mutate(
        { id: editingTask.id, payload: payload as TodoTaskUpdate },
        {
          onSuccess: () => {
            toast.success("Đã cập nhật công việc.")
            setDialogOpen(false)
          },
          onError: (err) =>
            toast.error(
              err instanceof Error ? err.message : "Không lưu được công việc."
            ),
        }
      )
      return
    }

    createMut.mutate(payload as TodoTaskCreate, {
      onSuccess: () => {
        toast.success("Đã thêm công việc mới.")
        setDialogOpen(false)
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Không tạo được công việc."),
    })
  }

  const handleToggle = (task: TodoTask) => {
    toggleMut.mutate(task.id, {
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Không cập nhật được."),
    })
  }

  const handleDelete = async (task: TodoTask) => {
    const ok = await confirm({
      title: "Xoá công việc?",
      description: `"${task.title}" sẽ bị xoá vĩnh viễn.`,
      confirmText: "Xoá",
      variant: "destructive",
    })
    if (!ok) return

    deleteMut.mutate(task.id, {
      onSuccess: () => toast.success("Đã xoá công việc."),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Không xoá được công việc."),
    })
  }

  const handleClearCompleted = async () => {
    const ok = await confirm({
      title: "Xoá các việc đã hoàn thành?",
      description: "Toàn bộ công việc đã đánh dấu hoàn thành sẽ bị xoá vĩnh viễn.",
      confirmText: "Xoá hết",
      variant: "destructive",
    })
    if (!ok) return

    clearDoneMut.mutate(undefined, {
      onSuccess: (res) => toast.success(res.message),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Không xoá được."),
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Quản lý công việc"
        description="Sắp xếp việc theo ma trận Eisenhower — kéo thẻ giữa các ô để đổi mức ưu tiên."
        icon={<ListChecks className="size-6 text-primary" />}
      >
        <TabsControl value={activeTab} onChange={setActiveTab} items={TAB_ITEMS} />
        <Button onClick={() => openCreate("do")}>
          <Plus className="mr-1.5 size-4" />
          Thêm việc
        </Button>
      </PageHeader>

      {activeTab === "matrix" ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <TabsControl
                value={scope}
                onChange={(v) => setScope(v)}
                items={SCOPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              />
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm công việc..."
                  className="w-full pl-8 sm:w-56"
                  aria-label="Tìm công việc theo tên"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <Switch
                  checked={showCompleted}
                  onCheckedChange={setShowCompleted}
                />
                Hiện việc đã xong
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCompleted}
                disabled={completedCount === 0 || clearDoneMut.isPending}
              >
                <Trash2 className="mr-1.5 size-4" />
                Dọn việc đã xong
              </Button>
            </div>
          </div>

          {scope !== "all" ? (
            <p className="text-xs text-muted-foreground">
              Đang lọc theo hạn chót — việc chưa đặt hạn chỉ hiện ở mục “Tất cả”.
            </p>
          ) : null}

          {isLoading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {QUADRANTS.map((q) => (
                <div
                  key={q.key}
                  className="h-[260px] animate-pulse rounded-xl border-2 border-border bg-muted/40"
                />
              ))}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setActiveDragId(null)}
            >
              <div className="grid gap-4 lg:grid-cols-2">
                {QUADRANTS.map((meta) => (
                  <QuadrantCard
                    key={meta.key}
                    meta={meta}
                    tasks={tasksByQuadrant.get(meta.key) ?? []}
                    onAdd={openCreate}
                    onToggle={handleToggle}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>

              {/* Follows the cursor so the card stays visible outside its cell. */}
              <DragOverlay>
                {activeDragTask ? (
                  <div className={cn("w-72 rotate-1 cursor-grabbing")}>
                    <TaskCard
                      task={activeDragTask}
                      onToggle={() => {}}
                      onEdit={() => {}}
                      onDelete={() => {}}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </>
      ) : statsLoading ? (
        <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
      ) : stats ? (
        <TodoStatsPanel stats={stats} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Chưa tải được dữ liệu thống kê.
        </p>
      )}

      <TaskEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        defaultQuadrant={draftQuadrant}
        saving={createMut.isPending || updateMut.isPending}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
