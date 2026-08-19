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
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  BarChart3,
  LayoutGrid,
  Plus,
  Inbox,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Hourglass,
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
import { ResizeDivider } from "./components/ResizeDivider"
import { useResizeHandle } from "@/hooks/useResizeHandle"

type TabKey = "matrix" | "stats"

// Resizable column bounds (px)
const INBOX_MIN = 200
const INBOX_MAX = 500
const INBOX_DEFAULT = 280
const PLANNER_MIN = 200
const PLANNER_MAX = 500
const PLANNER_DEFAULT = 280
const MATRIX_MIN = 280

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


function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}p`
  }
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return remaining > 0 ? `${hours}h ${remaining}p` : `${hours}h`
}

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

  // Resizable column widths (persisted to localStorage)
  const [inboxWidth, setInboxWidth] = React.useState<number>(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("todo_inbox_width")
      const n = raw ? Number(raw) : NaN
      if (Number.isFinite(n)) return Math.min(INBOX_MAX, Math.max(INBOX_MIN, n))
    }
    return INBOX_DEFAULT
  })

  const [plannerWidth, setPlannerWidth] = React.useState<number>(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("todo_planner_width")
      const n = raw ? Number(raw) : NaN
      if (Number.isFinite(n)) return Math.min(PLANNER_MAX, Math.max(PLANNER_MIN, n))
    }
    return PLANNER_DEFAULT
  })

  const updateInboxWidth = (w: number) => {
    const c = Math.min(INBOX_MAX, Math.max(INBOX_MIN, w))
    setInboxWidth(c)
    localStorage.setItem("todo_inbox_width", String(c))
  }

  const updatePlannerWidth = (w: number) => {
    const c = Math.min(PLANNER_MAX, Math.max(PLANNER_MIN, w))
    setPlannerWidth(c)
    localStorage.setItem("todo_planner_width", String(c))
  }

  // Re-clamp persisted widths when the viewport gets too small for our minimums.
  React.useEffect(() => {
    if (typeof window === "undefined") return
    const onResize = () => {
      const minTotal = INBOX_MIN + PLANNER_MIN + MATRIX_MIN
      const available = window.innerWidth - 64 // reserve scrollbar + buffer
      if (available < minTotal) return // let flex-1 absorb; CSS handles stacking
      // Ensure each persisted value still fits when the other side is at its min.
      const maxInbox = Math.min(INBOX_MAX, available - PLANNER_MIN - MATRIX_MIN)
      const maxPlanner = Math.min(PLANNER_MAX, available - INBOX_MIN - MATRIX_MIN)
      if (inboxWidth > maxInbox) updateInboxWidth(maxInbox)
      if (plannerWidth > maxPlanner) updatePlannerWidth(maxPlanner)
    }
    window.addEventListener("resize", onResize)
    onResize()
    return () => window.removeEventListener("resize", onResize)
    // We intentionally only react to viewport changes; width values are read at call-time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refs for the resize hooks
  const inboxColRef = React.useRef<HTMLDivElement>(null)
  const plannerColRef = React.useRef<HTMLDivElement>(null)
  const inboxDividerRef = React.useRef<HTMLDivElement>(null)
  const plannerDividerRef = React.useRef<HTMLDivElement>(null)

  const inboxResize = useResizeHandle({
    handleRef: inboxDividerRef,
    targetRef: inboxColRef,
    width: inboxWidth,
    onResize: updateInboxWidth,
    min: INBOX_MIN,
    max: INBOX_MAX,
    direction: "right",
    disabled: !isInboxExpanded || activeDragId !== null,
  })

  const plannerResize = useResizeHandle({
    handleRef: plannerDividerRef,
    targetRef: plannerColRef,
    width: plannerWidth,
    onResize: updatePlannerWidth,
    min: PLANNER_MIN,
    max: PLANNER_MAX,
    direction: "left",
    disabled: !isPlannerExpanded || activeDragId !== null,
  })

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

  const plannerTotalTime = React.useMemo(() => {
    return plannerTasks.reduce((sum, task) => sum + (task.estimated_time ?? 0), 0)
  }, [plannerTasks])

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
    const taskId = String(event.active.id)
    setActiveDragId(taskId)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null)
    const { active, over } = event
    if (!over) return

    const taskId = String(active.id)
    const target = String(over.id)
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    // 0. Drop over another task card → reorder within / across containers.
    // `over.data.current.taskId` is set by useSortable in TaskCard; if present,
    // we know `over` is a task card and not an empty droppable container.
    const overTaskId = (over.data.current?.taskId as string | undefined) ?? null
    if (overTaskId && overTaskId !== taskId) {
      handleTaskOverTask(task, overTaskId)
      return
    }

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

  /**
   * Reorder logic when the user drops a task on top of another task card.
   *
   * The three "list identities" we care about are:
   *   1. The weekly inbox (quadrant === "inbox").
   *   2. An Eisenhower quadrant (do / schedule / delegate / eliminate),
   *      which may or may not also be visible in today's planner view.
   *   3. Today's planner list, a denormalised view keyed by `scheduled_date`.
   *
   * We resolve the dragged task to its *source list* — the same UI list the
   * user picked it up from — and the dropped-on task to its *target list*,
   * then map the resulting pair to the simplest backend call.
   */
  const handleTaskOverTask = (task: TodoTask, overTaskId: string) => {
    const overTask = tasks.find((t) => t.id === overTaskId)
    if (!overTask) return

    // Source list: prefer the planner view when the dragged task is scheduled
    // on the currently selected date, otherwise fall back to its quadrant list.
    const sourceList =
      task.scheduled_date === selectedDate
        ? plannerTasks
        : task.quadrant === "inbox"
          ? inboxTasks
          : tasksByQuadrant.get(task.quadrant) ?? []
    const targetList =
      overTask.scheduled_date === selectedDate
        ? plannerTasks
        : overTask.quadrant === "inbox"
          ? inboxTasks
          : tasksByQuadrant.get(overTask.quadrant) ?? []

    const oldIndex = sourceList.findIndex((t) => t.id === task.id)
    const overIndex = targetList.findIndex((t) => t.id === overTaskId)
    if (oldIndex === -1 || overIndex === -1) return

    const sameList = sourceList === targetList
    const sameSlot = sameList && oldIndex === overIndex
    if (sameSlot) return

    // Same-list reorder: figure out the final slot in the array, mirroring
    // @dnd-kit's arrayMove semantics — moving down past N items is a shift
    // of N-1, moving up is just `overIndex`.
    let newIndex = overIndex
    if (sameList && overIndex > oldIndex) {
      const after = arrayMove(sourceList, oldIndex, overIndex)
      newIndex = after.findIndex((t) => t.id === task.id)
    }
    if (sameList && newIndex === oldIndex) return

    // Inbox reorders: clear scheduled_date if the task was scheduled, then
    // assign a position via the move endpoint. Otherwise call updateMut to
    // move the task into the inbox container.
    const movingIntoInbox = overTask.quadrant === "inbox"
    const movingIntoPlanner = overTask.scheduled_date === selectedDate

    if (movingIntoInbox) {
      updateMut.mutate({
        id: task.id,
        payload: { quadrant: "inbox", scheduled_date: null },
      })
      return
    }

    if (movingIntoPlanner) {
      // The task now lives both in its quadrant and in today's planner.
      // Keep the original quadrant if it's already a real one, otherwise
      // land in the default "do" column so the move endpoint accepts it.
      const targetQuadrant: TodoQuadrant =
        task.quadrant === "inbox" ? "do" : task.quadrant
      const insertIndex = sameList
        ? newIndex
        : Math.max(0, overIndex)
      updateMut.mutate({
        id: task.id,
        payload: {
          quadrant: targetQuadrant,
          scheduled_date: selectedDate,
        },
      })
      // Also send a position patch so the planner order matches `insertIndex`.
      moveMut.mutate({
        id: task.id,
        payload: { quadrant: targetQuadrant, position: insertIndex },
      })
      return
    }

    // Default: cross-quadrant or same-quadrant reorder — the move endpoint
    // handles renumbering for both quadrants server-side.
    moveMut.mutate({
      id: task.id,
      payload: { quadrant: overTask.quadrant, position: newIndex },
    })
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
                <div className="flex flex-col lg:flex-row gap-0 items-start mt-2 w-full">
                  {/* Column 1: Weekly Inbox (Inbox) */}
                  <div
                    ref={inboxColRef}
                    style={{
                      width: isInboxExpanded ? inboxWidth : 64,
                      minWidth: isInboxExpanded ? INBOX_MIN : 64,
                      maxWidth: isInboxExpanded ? INBOX_MAX : 64,
                      transitionProperty: inboxResize.isDragging ? "none" : "width, min-width, max-width",
                    }}
                    className={cn(
                      "shrink-0 transition-[width,min-width,max-width] duration-300 ease-in-out",
                      isInboxExpanded ? "lg:block" : "lg:block"
                    )}
                  >
                  <DroppableContainer
                    id="inbox"
                    className={cn(
                      "transition-all duration-300 ease-in-out border border-border/70 rounded-2xl shadow-none backdrop-blur-sm h-[680px] w-full flex flex-col shrink-0 overflow-hidden relative",
                      INBOX_META.bg
                    )}
                    activeClassName="bg-slate-500/10 border-dashed border-slate-400"
                  >
                    {/* Collapsed View */}
                    <div className={cn(
                      "transition-all duration-300 ease-in-out flex flex-col items-center justify-between h-full w-full py-4 px-2 shrink-0",
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
                      "transition-all duration-300 ease-in-out flex flex-col h-full gap-3 w-full p-4 shrink-0",
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
                          <SortableContext
                            items={inboxTasks.map((task) => task.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {inboxTasks.map((task) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                dragId={task.id}
                                onToggle={handleToggle}
                                onEdit={openEdit}
                                onDelete={handleDelete}
                              />
                            ))}
                          </SortableContext>
                        )}
                      </DroppableContainer>
                    </div>
                  </DroppableContainer>
                  </div>

                  <ResizeDivider
                    handleRef={inboxDividerRef}
                    handleProps={inboxResize.handleProps}
                    isDragging={inboxResize.isDragging}
                    isHovering={inboxResize.isHovering}
                    currentWidth={inboxWidth}
                    min={INBOX_MIN}
                    max={INBOX_MAX}
                    label="Thay đổi độ rộng Hộp việc tuần"
                    hidden={!isInboxExpanded}
                  />

                  {/* Column 2: Eisenhower Matrix 2x2 Grid */}
                  <div className="flex-1 min-w-0 w-full flex flex-col gap-3">
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

                    <div className="grid gap-3 grid-cols-2">
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

                  <ResizeDivider
                    handleRef={plannerDividerRef}
                    handleProps={plannerResize.handleProps}
                    isDragging={plannerResize.isDragging}
                    isHovering={plannerResize.isHovering}
                    currentWidth={plannerWidth}
                    min={PLANNER_MIN}
                    max={PLANNER_MAX}
                    label="Thay đổi độ rộng Lịch trình ngày"
                    hidden={!isPlannerExpanded}
                  />

                  {/* Column 3: Daily Planner (Lịch hàng ngày) */}
                  <div
                    ref={plannerColRef}
                    style={{
                      width: isPlannerExpanded ? plannerWidth : 64,
                      minWidth: isPlannerExpanded ? PLANNER_MIN : 64,
                      maxWidth: isPlannerExpanded ? PLANNER_MAX : 64,
                      transitionProperty: plannerResize.isDragging ? "none" : "width, min-width, max-width",
                    }}
                    className="shrink-0 transition-[width,min-width,max-width] duration-300 ease-in-out"
                  >
                  <DroppableContainer
                    id="planner"
                    className={cn(
                      "transition-all duration-300 ease-in-out bg-card/40 border border-border/70 rounded-2xl shadow-none backdrop-blur-sm h-[680px] w-full flex flex-col shrink-0 overflow-hidden relative"
                    )}
                    activeClassName="bg-primary/10 border-dashed border-primary/50"
                  >
                    {/* Collapsed View */}
                    <div className={cn(
                      "transition-all duration-300 ease-in-out flex flex-col items-center justify-between h-full w-full py-4 px-2 shrink-0",
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
                      "transition-all duration-300 ease-in-out flex flex-col h-full gap-3 w-full p-4 shrink-0",
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
                            {plannerTotalTime > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 px-2 py-0.5 text-[10px] font-medium leading-none">
                                <Hourglass className="size-2.5 shrink-0" />
                                {formatDuration(plannerTotalTime)}
                              </span>
                            )}
                            <span className="rounded-full bg-primary/15 text-primary text-xs px-2 py-0.5 font-semibold">
                              {plannerTasks.length} việc
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
                          <SortableContext
                            items={plannerTasks.map((task) => task.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {plannerTasks.map((task) => {
                              const qMeta = getQuadrant(task.quadrant)
                              return (
                                <div key={task.id} className="relative group/planner-card">
                                  <TaskCard
                                    task={task}
                                    dragId={task.id}
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
                            })}
                          </SortableContext>
                        )}
                      </DroppableContainer>
                    </div>
                  </DroppableContainer>
                  </div>
                </div>

                {/* Follows the cursor during dragging */}
                <DragOverlay>
                  {activeDragTask ? (
                    <div className={cn("w-72 rotate-1 cursor-grabbing shadow-2xl")}>
                      <TaskCard
                        task={activeDragTask}
                        dragId={`overlay-${activeDragTask.id}`}
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
