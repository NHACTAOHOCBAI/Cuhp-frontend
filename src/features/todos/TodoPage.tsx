/**
 * Todo list reorganised with a 3-column dashboard:
 * 1. Weekly Inbox: Quick add and unsorted tasks (quadrant = "inbox" and no due date).
 * 2. Eisenhower Matrix: The classic 2x2 grid for priority planning.
 * 3. Daily Planner: Date timeline and scheduled tasks (filtering/scheduling by due date).
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
  useDroppable,
} from "@dnd-kit/core"
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import {
  BarChart3,
  LayoutGrid,
  Plus,
  Inbox,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/PageHeader"
import { useConfirm } from "@/components/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TabsControl, type TabsControlItem } from "@/components/ui/tabs-control"
import { cn } from "@/lib/utils"
import type { TodoQuadrant, TodoTask } from "@/types"
import { QUADRANTS, ALL_QUADRANTS, getQuadrant, INBOX_META } from "./constants"
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
import type { TodoTaskCreate, TodoTaskUpdate } from "./types"
import { QuadrantCard } from "./components/QuadrantCard"
import { TaskCard } from "./components/TaskCard"
import { TaskEditDialog } from "./components/TaskEditDialog"
import { TodoStatsPanel } from "./components/TodoStatsPanel"

type TabKey = "matrix" | "stats"

const TAB_ITEMS: TabsControlItem<TabKey>[] = [
  { value: "matrix", label: "Kế hoạch tuần", icon: <LayoutGrid className="mr-1.5 size-4" /> },
  { value: "stats", label: "Thống kê & Báo cáo", icon: <BarChart3 className="mr-1.5 size-4" /> },
]

// Helper functions for date operations
function getMonday(d: Date) {
  const dateCopy = new Date(d)
  const day = dateCopy.getDay()
  const diff = dateCopy.getDate() - day + (day === 0 ? -6 : 1) // VN convention: Monday is first day of week
  const monday = new Date(dateCopy.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}

function formatDateLocal(d: Date) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const WEEKDAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
const formatDayName = (date: Date) => WEEKDAY_NAMES[date.getDay()]

function getMonthYearLabel(monday: Date) {
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  
  const startMonth = monday.getMonth() + 1
  const startYear = monday.getFullYear()
  const endMonth = sunday.getMonth() + 1
  const endYear = sunday.getFullYear()
  
  if (startYear !== endYear) {
    return `Th ${startMonth}/${startYear} - Th ${endMonth}/${endYear}`
  }
  if (startMonth !== endMonth) {
    return `Tháng ${startMonth} - ${endMonth}, ${startYear}`
  }
  return `Tháng ${startMonth}, ${startYear}`
}

// Droppable Wrapper Components
interface DroppableProps {
  id: string
  className?: string
  children: React.ReactNode
  activeClassName?: string
}

function DroppableContainer({ id, className, activeClassName, children }: DroppableProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={cn(className, isOver && activeClassName)}
    >
      {children}
    </div>
  )
}

export function TodoPage() {
  const confirm = useConfirm()

  const [activeTab, setActiveTab] = React.useState<TabKey>("matrix")

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingTask, setEditingTask] = React.useState<TodoTask | null>(null)
  const [draftQuadrant, setDraftQuadrant] = React.useState<TodoQuadrant>("inbox")
  const [activeDragId, setActiveDragId] = React.useState<string | null>(null)

  // Sidebar expanded/collapsed states
  const [isInboxExpanded, setIsInboxExpanded] = React.useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("todo_inbox_expanded")
      return saved !== "false"
    }
    return true
  })

  const [isPlannerExpanded, setIsPlannerExpanded] = React.useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("todo_planner_expanded")
      return saved !== "false"
    }
    return true
  })

  const toggleInbox = () => {
    setIsInboxExpanded((prev) => {
      const next = !prev
      localStorage.setItem("todo_inbox_expanded", String(next))
      return next
    })
  }

  const togglePlanner = () => {
    setIsPlannerExpanded((prev) => {
      const next = !prev
      localStorage.setItem("todo_planner_expanded", String(next))
      return next
    })
  }

  // Timeline & Planner States
  const [mondayDate, setMondayDate] = React.useState<Date>(() => getMonday(new Date()))
  const [selectedDate, setSelectedDate] = React.useState<string>(() => formatDateLocal(new Date()))
  const [newInboxTitle, setNewInboxTitle] = React.useState("")
  const [newPlannerTitle, setNewPlannerTitle] = React.useState("")

  const listParams = React.useMemo(
    () => ({
      scope: "all" as const,
      show_completed: false,
    }),
    []
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

  // Week days based on current monday Date
  const weekDays = React.useMemo(() => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(mondayDate)
      day.setDate(mondayDate.getDate() + i)
      days.push(day)
    }
    return days
  }, [mondayDate])

  // Tasks mapped into groups:
  // 1. Inbox tasks: quadrant is "inbox" and no due date.
  const inboxTasks = React.useMemo(() => {
    return tasks
      .filter((t) => t.quadrant === "inbox" && !t.scheduled_date)
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1
        return a.position - b.position
      })
  }, [tasks])

  // 2. Eisenhower Quadrants tasks (excluding inbox tasks from matrix view unless user explicitly wants to check them, 
  // but matrix renders the 4 classic boxes).
  const tasksByQuadrant = React.useMemo(() => {
    const buckets = new Map<TodoQuadrant, TodoTask[]>(
      ALL_QUADRANTS.map((q) => [q.key, [] as TodoTask[]])
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

  // 3. Planner tasks: tasks scheduled on the selected date
  const plannerTasks = React.useMemo(() => {
    return tasks
      .filter((t) => t.scheduled_date === selectedDate)
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1
        return a.position - b.position
      })
  }, [tasks, selectedDate])

  const activeDragTask = React.useMemo(
    () => tasks.find((t) => t.id === activeDragId) ?? null,
    [tasks, activeDragId]
  )

  const completedCount = tasks.filter((t) => t.completed).length

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragStart = (event: DragStartEvent) => {
    const fullId = String(event.active.id)
    const taskId = fullId.includes(":") ? fullId.split(":")[1] : fullId
    setActiveDragId(taskId)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null)
    const { active, over } = event
    if (!over) return

    const fullActiveId = String(active.id)
    const taskId = fullActiveId.includes(":") ? fullActiveId.split(":")[1] : fullActiveId
    const target = String(over.id)
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    // 1. Drop onto a specific date tag (e.g. "date:2026-08-18")
    if (target.startsWith("date:")) {
      const targetDate = target.split(":")[1]
      if (task.scheduled_date === targetDate) return
      
      updateMut.mutate(
        {
          id: taskId,
          payload: { scheduled_date: targetDate },
        },
        {
          onSuccess: () => {
            if (task.due_date && targetDate > task.due_date) {
              toast.warning(`Đã xếp lịch nhưng ngày làm việc (${targetDate}) vượt quá hạn chót (${task.due_date})!`);
            } else {
              toast.success(`Đã xếp lịch công việc vào ngày ${targetDate}`);
            }
          },
          onError: (err) =>
            toast.error(
              err instanceof Error ? err.message : "Cập nhật ngày hạn thất bại."
            ),
        }
      )
      return
    }

    // 2. Drop into Daily Planner list container
    if (target === "planner") {
      if (task.scheduled_date === selectedDate) return
      updateMut.mutate(
        {
          id: taskId,
          payload: { scheduled_date: selectedDate },
        },
        {
          onSuccess: () => {
            if (task.due_date && selectedDate > task.due_date) {
              toast.warning(`Đã xếp lịch nhưng ngày làm việc (${selectedDate}) vượt quá hạn chót (${task.due_date})!`);
            } else {
              toast.success(`Đã xếp lịch vào ngày ${selectedDate}`);
            }
          },
          onError: (err) =>
            toast.error(
              err instanceof Error ? err.message : "Cập nhật lịch trình thất bại."
            ),
        }
      )
      return
    }

    // 3. Drop into Weekly Inbox container
    if (target === "inbox") {
      if (task.quadrant === "inbox" && !task.scheduled_date) return
      updateMut.mutate(
        {
          id: taskId,
          payload: { quadrant: "inbox", scheduled_date: null },
        },
        {
          onSuccess: () => toast.success("Đã trả công việc về Hộp việc tuần."),
          onError: (err) =>
            toast.error(
              err instanceof Error ? err.message : "Chuyển về Inbox thất bại."
            ),
        }
      )
      return
    }

    // 4. Drop into one of the 4 Eisenhower Quadrants
    const validQuadrants: TodoQuadrant[] = ["do", "schedule", "delegate", "eliminate"]
    if (validQuadrants.includes(target as TodoQuadrant)) {
      const targetQuadrant = target as TodoQuadrant
      if (task.quadrant === targetQuadrant) return

      moveMut.mutate(
        {
          id: taskId,
          payload: { quadrant: targetQuadrant, position: tasksByQuadrant.get(targetQuadrant)?.length ?? 0 },
        },
        {
          onSuccess: () => {
            toast.success(`Đã xếp vào cột "${getQuadrant(targetQuadrant).label}"`)
          },
          onError: (err) =>
            toast.error(
              err instanceof Error ? err.message : "Chuyển công việc thất bại."
            ),
        }
      )
      return
    }
  }

  const handleAddInboxSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const title = newInboxTitle.trim()
    if (!title) return

    createMut.mutate(
      {
        title,
        quadrant: "inbox",
        due_date: null,
        scheduled_date: null,
      },
      {
        onSuccess: () => {
          setNewInboxTitle("")
          toast.success("Đã thêm công việc vào Hộp thư tuần.")
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Không thể thêm công việc."
          ),
      }
    )
  }

  const handleAddPlannerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const title = newPlannerTitle.trim()
    if (!title) return

    createMut.mutate(
      {
        title,
        quadrant: "inbox", // default quadrant is inbox for new tasks
        due_date: null,
        scheduled_date: selectedDate,
      },
      {
        onSuccess: () => {
          setNewPlannerTitle("")
          toast.success(`Đã thêm việc mới và xếp lịch vào ngày ${selectedDate}.`)
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Không thể tạo công việc."
          ),
      }
    )
  }

  const handleQuickAdd = (quadrant: TodoQuadrant, title: string) => {
    createMut.mutate(
      {
        title,
        quadrant,
        due_date: null,
        scheduled_date: null,
      },
      {
        onSuccess: () => {
          toast.success(`Đã thêm việc mới vào "${getQuadrant(quadrant).label}".`)
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Không thể tạo công việc."
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
              err instanceof Error ? err.message : "Cập nhật công việc thất bại."
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
        toast.error(
          err instanceof Error ? err.message : "Tạo công việc thất bại."
        ),
    })
  }

  const handleToggle = (task: TodoTask) => {
    toggleMut.mutate(task.id, {
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : "Cập nhật trạng thái thất bại."
        ),
    })
  }

  const handleDelete = async (task: TodoTask) => {
    const ok = await confirm({
      title: "Xoá công việc?",
      description: `"${task.title}" sẽ bị xoá vĩnh viễn.`,
      confirmText: "Xoá",
      cancelText: "Huỷ",
      variant: "destructive",
    })
    if (!ok) return

    try {
      await deleteMut.mutateAsync(task.id)
      toast.success(`Đã xoá công việc "${task.title}".`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xoá công việc thất bại.")
    }
  }

  const handleClearCompleted = async () => {
    const ok = await confirm({
      title: "Xoá các việc đã hoàn thành?",
      description: "Toàn bộ công việc đã đánh dấu hoàn thành sẽ bị xoá vĩnh viễn.",
      confirmText: "Xoá hết",
      cancelText: "Huỷ",
      variant: "destructive",
    })
    if (!ok) return

    try {
      const res = await clearDoneMut.mutateAsync()
      toast.success(res.message)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xoá hàng loạt thất bại.")
    }
  }

  // Navigation functions for Planner Timeline
  const handlePrevWeek = () => {
    const prev = new Date(mondayDate)
    prev.setDate(mondayDate.getDate() - 7)
    setMondayDate(prev)
  }

  const handleNextWeek = () => {
    const next = new Date(mondayDate)
    next.setDate(mondayDate.getDate() + 7)
    setMondayDate(next)
  }

  const handleGoToday = () => {
    const today = new Date()
    setMondayDate(getMonday(today))
    setSelectedDate(formatDateLocal(today))
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-background p-6 overflow-y-auto animate-in fade-in-0 duration-150">
      <div className="w-full space-y-6">
        {/* Title & Actions */}
        <PageHeader
          title="Bảng quản lý công việc"
          description="Lên kế hoạch tuần, phân loại theo ma trận Eisenhower và lập lịch công việc hằng ngày hiệu quả."
        >
          <div className="flex items-center gap-2">
            {completedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCompleted}
                disabled={clearDoneMut.isPending}
                className="text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                Dọn việc đã xong ({completedCount})
              </Button>
            )}
            <Button
              onClick={() => openCreate("inbox")}
              className="gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" />
              Thêm việc mới
            </Button>
          </div>
        </PageHeader>

        {/* View Tabs */}
        <TabsControl value={activeTab} onChange={(v) => setActiveTab(v)} items={TAB_ITEMS} />

        {activeTab === "matrix" ? (
          <>

            {isLoading ? (
              <div className="grid gap-6 lg:grid-cols-12 h-[600px] mt-4">
                <div className="lg:col-span-3 h-full animate-pulse rounded-xl border bg-muted/40" />
                <div className="lg:col-span-6 h-full animate-pulse rounded-xl border bg-muted/40" />
                <div className="lg:col-span-3 h-full animate-pulse rounded-xl border bg-muted/40" />
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveDragId(null)}
              >
                {/* 3-Column layout dashboard */}
                <div className="flex flex-col lg:flex-row gap-6 items-start mt-2 w-full">
                  {/* Column 1: Weekly Inbox (Inbox) */}
                  <DroppableContainer
                    id="inbox"
                    className={cn(
                      "transition-all duration-300 ease-in-out border border-border/70 rounded-2xl shadow-none backdrop-blur-sm h-[680px] flex flex-col shrink-0 overflow-hidden relative",
                      INBOX_META.bg,
                      isInboxExpanded 
                        ? "w-full lg:w-[280px]" 
                        : "w-full lg:w-[64px]"
                    )}
                    activeClassName="bg-slate-500/10 border-dashed border-slate-400"
                  >
                    {/* Collapsed View */}
                    <div className={cn(
                      "transition-all duration-300 ease-in-out flex flex-col items-center justify-between h-full w-[64px] py-4 px-2 shrink-0",
                      !isInboxExpanded 
                        ? "opacity-100 scale-100 pointer-events-auto" 
                        : "opacity-0 scale-95 pointer-events-none absolute inset-0 overflow-hidden invisible"
                    )}>
                      <div className="flex flex-col items-center gap-4 w-full">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={toggleInbox}
                          title="Mở rộng Hộp việc tuần"
                          className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground hover:bg-slate-500/10"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <div className="p-1.5 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400">
                          <Inbox className="size-4" />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground tracking-wider [writing-mode:vertical-lr] rotate-180 select-none whitespace-nowrap">
                          Hộp việc tuần
                        </span>
                      </div>
                      <span className="rounded-full bg-slate-500/15 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 font-semibold">
                        {inboxTasks.length}
                      </span>
                    </div>

                    {/* Expanded View */}
                    <div className={cn(
                      "transition-all duration-300 ease-in-out flex flex-col h-full gap-3 w-[280px] p-4 shrink-0",
                      isInboxExpanded 
                        ? "opacity-100 scale-100 pointer-events-auto" 
                        : "opacity-0 scale-95 pointer-events-none absolute inset-0 overflow-hidden invisible"
                    )}>
                      <div className="flex items-center justify-between pb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400">
                            <Inbox className="size-4" />
                          </div>
                          <div>
                            <h2 className="text-sm font-semibold text-foreground">Hộp việc tuần</h2>
                            <p className="text-[10px] text-muted-foreground">Các việc chưa phân loại</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-full bg-slate-500/15 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 font-semibold">
                            {inboxTasks.length}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleInbox}
                            title="Thu gọn"
                            className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-foreground hover:bg-slate-500/10"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Quick Add Form */}
                      <form onSubmit={handleAddInboxSubmit} className="flex gap-2">
                        <Input
                          value={newInboxTitle}
                          onChange={(e) => setNewInboxTitle(e.target.value)}
                          placeholder="Thêm việc nhanh... (Enter)"
                          className="h-9 text-xs focus-visible:ring-slate-400 shadow-none"
                        />
                        <Button type="submit" size="icon" className="h-9 w-9 shrink-0 bg-slate-600 hover:bg-slate-700 text-white cursor-pointer shadow-none">
                          <Plus className="size-4" />
                        </Button>
                      </form>

                      {/* Droppable Inbox List */}
                      <DroppableContainer
                        id="inbox"
                        className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1"
                        activeClassName="bg-slate-500/5 rounded-xl border border-dashed border-slate-400"
                      >
                        {inboxTasks.length === 0 ? (
                          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 p-6 text-center">
                            <Inbox className="size-8 text-muted-foreground/60 stroke-[1.5]" />
                            <div className="space-y-0.5">
                              <p className="text-xs font-medium text-muted-foreground">Hộp việc trống</p>
                              <p className="text-[10px] text-muted-foreground/70">
                                Nhập việc ở trên hoặc kéo thẻ từ nơi khác thả vào đây để cất.
                              </p>
                            </div>
                          </div>
                        ) : (
                          inboxTasks.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              dragId={`inbox:${task.id}`}
                              onToggle={handleToggle}
                              onEdit={openEdit}
                              onDelete={handleDelete}
                            />
                          ))
                        )}
                      </DroppableContainer>
                    </div>
                  </DroppableContainer>

                  {/* Column 2: Eisenhower Matrix 2x2 Grid */}
                  <div className="flex-1 min-w-0 w-full flex flex-col gap-3 h-[680px]">
                    <div className="flex items-center justify-between pb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
                          <LayoutGrid className="size-4" />
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold text-foreground">Ma trận độ ưu tiên</h2>
                          <p className="text-[10px] text-muted-foreground">Kéo thả để phân loại mức độ khẩn cấp & quan trọng</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 grid-cols-2 flex-1 min-h-0 overflow-y-auto pr-1">
                      {QUADRANTS.map((meta) => (
                        <QuadrantCard
                          key={meta.key}
                          meta={meta}
                          tasks={tasksByQuadrant.get(meta.key) ?? []}
                          onAdd={openCreate}
                          onQuickAdd={handleQuickAdd}
                          onToggle={handleToggle}
                          onEdit={openEdit}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Column 3: Daily Planner (Lịch hàng ngày) */}
                  <DroppableContainer
                    id="planner"
                    className={cn(
                      "transition-all duration-300 ease-in-out bg-card/40 border border-border/70 rounded-2xl shadow-none backdrop-blur-sm h-[680px] flex flex-col shrink-0 overflow-hidden relative",
                      isPlannerExpanded 
                        ? "w-full lg:w-[280px]" 
                        : "w-full lg:w-[64px]"
                    )}
                    activeClassName="bg-primary/10 border-dashed border-primary/50"
                  >
                    {/* Collapsed View */}
                    <div className={cn(
                      "transition-all duration-300 ease-in-out flex flex-col items-center justify-between h-full w-[64px] py-4 px-2 shrink-0",
                      !isPlannerExpanded 
                        ? "opacity-100 scale-100 pointer-events-auto" 
                        : "opacity-0 scale-95 pointer-events-none absolute inset-0 overflow-hidden invisible"
                    )}>
                      <div className="flex flex-col items-center gap-4 w-full">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={togglePlanner}
                          title="Mở rộng Lịch trình ngày"
                          className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground hover:bg-primary/10"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                          <CalendarDays className="size-4" />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground tracking-wider [writing-mode:vertical-lr] rotate-180 select-none whitespace-nowrap">
                          Lịch trình ngày
                        </span>
                      </div>
                      <span className="rounded-full bg-primary/15 text-primary text-xs px-2 py-0.5 font-semibold">
                        {plannerTasks.length}
                      </span>
                    </div>

                    {/* Expanded View */}
                    <div className={cn(
                      "transition-all duration-300 ease-in-out flex flex-col h-full gap-3 w-[280px] p-4 shrink-0",
                      isPlannerExpanded 
                        ? "opacity-100 scale-100 pointer-events-auto" 
                        : "opacity-0 scale-95 pointer-events-none absolute inset-0 overflow-hidden invisible"
                    )}>
                      {/* Header with Navigation */}
                      <div className="flex flex-col gap-2.5 pb-3">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-1">
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-sm font-semibold text-foreground leading-none">
                              Lịch trình ngày
                            </span>
                            <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                              {getMonthYearLabel(mondayDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="rounded-full bg-primary/15 text-primary text-xs px-2 py-0.5 font-semibold">
                              {plannerTasks.length}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={togglePlanner}
                              title="Thu gọn"
                              className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-foreground hover:bg-primary/10"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 mt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGoToday}
                            title="Quay về hôm nay"
                            className="gap-1 h-7 px-2 cursor-pointer shadow-none text-[11px] font-bold"
                          >
                            <CalendarDays className="h-3.5 w-3.5" />
                            Hôm nay
                          </Button>
                          <div className="flex items-center rounded-md border border-border bg-muted/40 p-0.5 ml-auto">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-sm shadow-none cursor-pointer text-muted-foreground hover:text-foreground"
                              onClick={handlePrevWeek}
                              title="Tuần trước"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            <span className="h-4 w-px bg-border" aria-hidden />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-sm shadow-none cursor-pointer text-muted-foreground hover:text-foreground"
                              onClick={handleNextWeek}
                              title="Tuần sau"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Day Selector Lineup - Gym style */}
                        <div className="grid grid-cols-7 gap-1.5 mt-0.5">
                          {weekDays.map((day) => {
                            const dateStr = formatDateLocal(day)
                            const isSelected = selectedDate === dateStr
                            const isToday = formatDateLocal(new Date()) === dateStr
                            const openCountOnDay = tasks.filter(t => t.scheduled_date === dateStr && !t.completed).length

                            return (
                              <DroppableContainer
                                key={dateStr}
                                id={`date:${dateStr}`}
                                className="relative"
                                activeClassName="ring-2 ring-primary ring-offset-2 rounded-lg"
                              >
                                <button
                                  type="button"
                                  onClick={() => setSelectedDate(dateStr)}
                                  className={cn(
                                    "group flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg border transition-all duration-150 cursor-pointer select-none w-full",
                                    isSelected
                                      ? "bg-primary text-primary-foreground border-primary shadow-none"
                                      : isToday
                                        ? "bg-primary/10 text-primary border-primary/50 hover:bg-primary/15 hover:border-primary"
                                        : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-muted/60"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "text-[10px] font-semibold leading-none uppercase tracking-wide",
                                      isSelected ? "text-primary-foreground/85" : isToday ? "text-primary" : "text-muted-foreground"
                                    )}
                                  >
                                    {formatDayName(day)}
                                  </span>
                                  <span className="text-sm font-bold leading-none tabular-nums">
                                    {day.getDate()}
                                  </span>
                                  {openCountOnDay > 0 && (
                                    <span className={cn(
                                      "absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full text-[8px] font-bold shadow-none",
                                      isSelected 
                                        ? "bg-background text-primary" 
                                        : "bg-primary text-primary-foreground"
                                    )}>
                                      {openCountOnDay}
                                    </span>
                                  )}
                                </button>
                              </DroppableContainer>
                            )
                          })}
                        </div>
                      </div>

                      {/* Quick Add Form for Planner */}
                      <form onSubmit={handleAddPlannerSubmit} className="flex gap-2">
                        <Input
                          value={newPlannerTitle}
                          onChange={(e) => setNewPlannerTitle(e.target.value)}
                          placeholder="Thêm nhanh việc cho ngày này..."
                          className="h-9 text-xs focus-visible:ring-primary shadow-none"
                        />
                        <Button type="submit" size="icon" className="h-9 w-9 shrink-0 bg-primary hover:bg-primary/95 text-primary-foreground cursor-pointer shadow-none">
                          <Plus className="size-4" />
                        </Button>
                      </form>

                      {/* Droppable Planner Container */}
                      <DroppableContainer
                        id="planner"
                        className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1"
                        activeClassName="bg-primary/5 rounded-xl border border-dashed border-primary/50"
                      >
                        {plannerTasks.length === 0 ? (
                          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 p-6 text-center">
                            <CalendarDays className="size-8 text-muted-foreground/60 stroke-[1.5]" />
                            <div className="space-y-0.5">
                              <p className="text-xs font-medium text-muted-foreground">Trống lịch trình</p>
                              <p className="text-[10px] text-muted-foreground/70">
                                Kéo thả công việc từ Inbox hoặc Ma trận vào đây để xếp lịch cho ngày này.
                              </p>
                            </div>
                          </div>
                        ) : (
                          plannerTasks.map((task) => {
                            const qMeta = getQuadrant(task.quadrant)
                            return (
                              <div key={task.id} className="relative group/planner-card">
                                <TaskCard
                                  task={task}
                                  dragId={`planner:${task.id}`}
                                  onToggle={handleToggle}
                                  onEdit={openEdit}
                                  onDelete={handleDelete}
                                />
                                {/* Quadrant Badge overlay for quick context */}
                                {task.quadrant !== "inbox" && (
                                  <span className={cn(
                                    "absolute bottom-1 right-2 pointer-events-none text-[8px] font-medium px-1 rounded shadow-none opacity-80",
                                    qMeta.badge
                                  )}>
                                    {qMeta.label}
                                  </span>
                                )}
                              </div>
                            )
                          })
                        )}
                      </DroppableContainer>
                    </div>
                  </DroppableContainer>
                </div>

                {/* Follows the cursor during dragging */}
                <DragOverlay>
                  {activeDragTask ? (
                    <div className={cn("w-72 rotate-1 cursor-grabbing shadow-2xl")}>
                      <TaskCard
                        task={activeDragTask}
                        dragId={`overlay:${activeDragTask.id}`}
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
      </div>

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
