import * as React from "react"
import {
  useTodosQuery,
  useCreateTodo,
  useUpdateTodo,
  useDeleteTodo,
  useToggleTodo,
} from "@/features/todos/hooks"
import type { TodoQuadrant, TodoTask } from "@/types"
import {
  Zap,
  Calendar,
  Send,
  Ban,
  Plus,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  GripVertical,
  Pencil,
  Clock,
  Check,
} from "lucide-react"
import { toast } from "sonner"
import { CustomSelect } from "@/components/ui/CustomSelect"

export default function Tasks() {
  // 1. Fetch todos
  const { data: todosData } = useTodosQuery({ scope: "all" })

  // 2. Mutations
  const createTodoMutation = useCreateTodo()
  const updateTodoMutation = useUpdateTodo()
  const toggleTodoMutation = useToggleTodo()
  const deleteTodoMutation = useDeleteTodo()

  // Modal state for Create / Edit
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingTask, setEditingTask] = React.useState<TodoTask | null>(null)
  const [newTitle, setNewTitle] = React.useState("")
  const [newDesc, setNewDesc] = React.useState("")
  const [newQuadrant, setNewQuadrant] = React.useState<TodoQuadrant>("do")
  const [newDueDate, setNewDueDate] = React.useState("")
  const [newEstTime, setNewEstTime] = React.useState("")

  // Quick Add Input State per Quadrant
  const [quickInputs, setQuickInputs] = React.useState<Record<TodoQuadrant, string>>({
    inbox: "",
    do: "",
    schedule: "",
    delegate: "",
    eliminate: "",
  })

  // Quick Add Input State for Selected Schedule Date
  const [scheduleQuickInput, setScheduleQuickInput] = React.useState("")

  // Reactive state for task scheduled dates map (taskId -> "YYYY-MM-DD")
  const [scheduledDates, setScheduledDates] = React.useState<Record<string, string>>(() => {
    const initialMap: Record<string, string> = {}
    if (typeof window !== "undefined") {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith("task_date_")) {
          const taskId = key.replace("task_date_", "")
          const val = localStorage.getItem(key)
          if (val) initialMap[taskId] = val
        }
      }
    }
    return initialMap
  })

  // Helper to set or clear a task's scheduled date with instant state re-render
  const setTaskScheduledDate = (taskId: string, dateKey: string | null) => {
    setScheduledDates((prev) => {
      const next = { ...prev }
      if (dateKey) {
        next[taskId] = dateKey
        localStorage.setItem(`task_date_${taskId}`, dateKey)
      } else {
        delete next[taskId]
        localStorage.removeItem(`task_date_${taskId}`)
      }
      return next
    })
  }

  // Date Picker State for Daily Schedule
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date())
  const [weekOffset, setWeekOffset] = React.useState<number>(0)

  // Format date key YYYY-MM-DD
  const formatDateKey = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  // Get 7 days of current week offset
  const weekDays = React.useMemo(() => {
    const today = new Date()
    const baseDate = new Date(today)
    baseDate.setDate(today.getDate() + weekOffset * 7)

    const dayOfWeek = baseDate.getDay() // 0 = Sun, 1 = Mon, ...
    const distanceToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(baseDate)
    monday.setDate(baseDate.getDate() + distanceToMon)

    const days = []
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      days.push({
        name: dayNames[i],
        dateNum: d.getDate(),
        fullDate: d,
        key: formatDateKey(d),
      })
    }
    return days
  }, [weekOffset])

  const selectedDateKey = formatDateKey(selectedDate)

  // Current month-year string display (e.g. "August - September 2026")
  const monthYearLabel = React.useMemo(() => {
    if (weekDays.length === 0) return ""
    const firstMonth = weekDays[0].fullDate.toLocaleString("en-US", { month: "short" })
    const lastMonth = weekDays[6].fullDate.toLocaleString("en-US", { month: "short" })
    const year = weekDays[0].fullDate.getFullYear()
    if (firstMonth === lastMonth) {
      return `${firstMonth} ${year}`
    }
    return `${firstMonth} - ${lastMonth} ${year}`
  }, [weekDays])

  // Filter tasks by quadrant
  const tasksByQuadrant = React.useMemo(() => {
    const map: Record<TodoQuadrant, TodoTask[]> = {
      inbox: [],
      do: [],
      schedule: [],
      delegate: [],
      eliminate: [],
    }
    if (todosData?.items) {
      todosData.items.forEach((task) => {
        if (map[task.quadrant]) {
          map[task.quadrant].push(task)
        }
      })
    }
    return map
  }, [todosData])

  // Scheduled tasks for the currently selected date - re-calculates instantly on scheduledDates state change
  const scheduledTasksForSelectedDate = React.useMemo(() => {
    if (!todosData?.items) return []
    return todosData.items.filter((task) => {
      const assignedDate = scheduledDates[task.id] || task.scheduled_date
      return assignedDate === selectedDateKey
    })
  }, [todosData, selectedDateKey, scheduledDates])

  // Handlers for Modal
  const handleOpenCreateModal = () => {
    setEditingTask(null)
    setNewTitle("")
    setNewDesc("")
    setNewQuadrant("do")
    setNewDueDate("")
    setNewEstTime("")
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (task: TodoTask) => {
    setEditingTask(task)
    setNewTitle(task.title)
    setNewDesc(task.description || "")
    setNewQuadrant(task.quadrant)
    setNewDueDate(task.due_date || "")
    setNewEstTime(task.estimated_time ? String(task.estimated_time) : "")
    setIsModalOpen(true)
  }

  const handleSaveTaskModal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) {
      toast.error("Please enter a task title.")
      return
    }

    const estTimeMinutes = newEstTime.trim() ? parseInt(newEstTime.trim(), 10) : null

    if (editingTask) {
      updateTodoMutation.mutate(
        {
          id: editingTask.id,
          payload: {
            title: newTitle.trim(),
            description: newDesc.trim() || null,
            quadrant: newQuadrant,
            due_date: newDueDate || null,
            estimated_time: estTimeMinutes,
          },
        },
        {
          onSuccess: () => {
            toast.success("Task updated successfully!")
            setIsModalOpen(false)
            setEditingTask(null)
            setNewTitle("")
            setNewDesc("")
            setNewDueDate("")
            setNewEstTime("")
          },
          onError: (err) => {
            toast.error(`Failed to update task: ${err.message}`)
          },
        }
      )
    } else {
      createTodoMutation.mutate(
        {
          title: newTitle.trim(),
          description: newDesc.trim() || null,
          quadrant: newQuadrant,
          due_date: newDueDate || null,
          estimated_time: estTimeMinutes,
        },
        {
          onSuccess: () => {
            toast.success("Task created successfully!")
            setIsModalOpen(false)
            setNewTitle("")
            setNewDesc("")
            setNewDueDate("")
            setNewEstTime("")
          },
          onError: (err) => {
            toast.error(`Failed to create task: ${err.message}`)
          },
        }
      )
    }
  }

  // Quick Add for a specific Quadrant
  const handleQuickAddQuadrant = (quadrant: TodoQuadrant) => {
    const title = quickInputs[quadrant]?.trim()
    if (!title) return

    createTodoMutation.mutate(
      { title, quadrant },
      {
        onSuccess: () => {
          setQuickInputs((prev) => ({ ...prev, [quadrant]: "" }))
          toast.success(`Task added to ${quadrant.toUpperCase()}!`)
        },
        onError: (err) => {
          toast.error(`Failed to add task: ${err.message}`)
        },
      }
    )
  }

  // Quick Add for Currently Selected Date Schedule
  const handleQuickAddSchedule = (e: React.FormEvent) => {
    e.preventDefault()
    const title = scheduleQuickInput.trim()
    if (!title) return

    createTodoMutation.mutate(
      { title, quadrant: "schedule", scheduled_date: selectedDateKey },
      {
        onSuccess: (data) => {
          if (data?.id) {
            setTaskScheduledDate(data.id, selectedDateKey)
          }
          setScheduleQuickInput("")
          toast.success("Task scheduled for selected date!")
        },
        onError: (err) => {
          toast.error(`Failed to schedule task: ${err.message}`)
        },
      }
    )
  }

  // Delete Task
  const handleDeleteTask = (id: string) => {
    deleteTodoMutation.mutate(id, {
      onSuccess: () => {
        setTaskScheduledDate(id, null)
        toast.success("Task deleted.")
      },
    })
  }

  // Remove Task from Schedule
  const handleRemoveFromSchedule = (id: string) => {
    setTaskScheduledDate(id, null)
    updateTodoMutation.mutate({ id, payload: { scheduled_date: null } })
    toast.info("Removed from daily schedule.")
  }

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDropQuadrant = (e: React.DragEvent, targetQuadrant: TodoQuadrant) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData("text/plain")
    if (!taskId) return

    const task = todosData?.items?.find((t) => t.id === taskId)
    if (task) {
      if (task.quadrant !== targetQuadrant) {
        createTodoMutation.mutate(
          { title: task.title, description: task.description, quadrant: targetQuadrant },
          {
            onSuccess: () => {
              deleteTodoMutation.mutate(taskId)
              toast.success(`Moved to ${targetQuadrant.toUpperCase()}!`)
            },
          }
        )
      }
    }
  }

  const handleDropSchedule = (e: React.DragEvent) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData("text/plain")
    if (!taskId) return

    setTaskScheduledDate(taskId, selectedDateKey)
    updateTodoMutation.mutate({ id: taskId, payload: { scheduled_date: selectedDateKey } })
    toast.success(`Scheduled for ${selectedDateKey}`)
  }

  // Quadrants configuration
  const quadrantConfigs: Array<{
    id: TodoQuadrant
    title: string
    subtitle: string
    dotColor: string
    icon: React.ElementType
    emptyTitle: string
    emptySub: string
  }> = [
    {
      id: "do",
      title: "Do First",
      subtitle: "Urgent + Important",
      dotColor: "#EF4444",
      icon: Zap,
      emptyTitle: "No tasks here",
      emptySub: "Handle these today, don't delay.",
    },
    {
      id: "schedule",
      title: "Schedule",
      subtitle: "Important, Not Urgent",
      dotColor: "#3B82F6",
      icon: Calendar,
      emptyTitle: "No tasks here",
      emptySub: "Set a specific date — create long-term value.",
    },
    {
      id: "delegate",
      title: "Delegate",
      subtitle: "Urgent, Not Important",
      dotColor: "#F59E0B",
      icon: Send,
      emptyTitle: "No tasks here",
      emptySub: "Delegate to others or minimize time spent.",
    },
    {
      id: "eliminate",
      title: "Eliminate",
      subtitle: "Not Urgent, Not Important",
      dotColor: "#8B5CF6",
      icon: Ban,
      emptyTitle: "No tasks here",
      emptySub: "Consider eliminating to reclaim your time.",
    },
  ]

  return (
    <div className="space-y-8 font-outfit">
      {/* Top Header - Aligned with Gym page design */}
      <header className="mt-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-sora font-bold text-3xl mb-2 text-[#201B1E] tracking-tight">
            Priority Matrix
          </h1>
          <p className="font-outfit font-normal text-base text-[#706065]">
            Drag & drop to organize urgency & importance.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-[#EFBCD5] text-[#201B1E] font-sora font-bold text-sm px-6 py-2.5 rounded-2xl hover:bg-[#ebb8d1] active:scale-95 transition-all border border-[#ffd8ea] shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </button>
      </header>

      {/* Main Split-Screen Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 2x2 Priority Matrix (8 cols) */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {quadrantConfigs.map((quad) => {
            const Icon = quad.icon
            const tasks = tasksByQuadrant[quad.id] || []

            return (
              <div
                key={quad.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropQuadrant(e, quad.id)}
                className="glass-card bg-white border border-[#E5DFE2] rounded-[24px] p-6 shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] flex flex-col h-[380px] overflow-hidden transition-all hover:border-[#EFBCD5]/60"
              >
                {/* Quadrant Header */}
                <div className="flex items-center justify-between mb-1 pb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: quad.dotColor }}
                    />
                    <Icon className="w-4 h-4 text-[#706065]" />
                    <h2 className="font-sora font-bold text-lg text-[#201B1E]">
                      {quad.title}
                    </h2>
                    <span className="text-xs font-mono font-bold text-[#706065] bg-[#FCFAF7] border border-[#E5DFE2] px-2.5 py-0.5 rounded-full">
                      {tasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const inputEl = document.getElementById(`quick-input-${quad.id}`)
                      inputEl?.focus()
                    }}
                    className="p-1 rounded-lg border border-[#E5DFE2] hover:bg-[#fcf1f5] text-[#706065] hover:text-[#EFBCD5] transition-colors"
                    title="Focus quick add"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-[#706065] mb-3 font-normal">
                  {quad.subtitle}
                </p>

                {/* Quick Add Input */}
                <div className="mb-3">
                  <input
                    id={`quick-input-${quad.id}`}
                    type="text"
                    value={quickInputs[quad.id]}
                    onChange={(e) =>
                      setQuickInputs((prev) => ({ ...prev, [quad.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleQuickAddQuadrant(quad.id)
                      }
                    }}
                    placeholder="Quick add task... (Enter)"
                    className="w-full bg-[#FCFAF7] border border-[#E5DFE2] rounded-xl px-3.5 py-2 text-xs text-[#1f1a1d] focus:outline-none focus:border-[#EFBCD5] focus:bg-white transition-all placeholder:text-[#706065]/60"
                  />
                </div>

                {/* Task List / Empty State */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 hide-scrollbar">
                  {tasks.length === 0 ? (
                    <div className="h-full border-2 border-dashed border-[#E5DFE2]/70 rounded-2xl flex flex-col items-center justify-center p-4 text-center">
                      <span className="font-sora font-bold text-sm text-[#1f1a1d] mb-1">
                        {quad.emptyTitle}
                      </span>
                      <span className="text-xs text-[#706065] max-w-[200px] leading-relaxed">
                        {quad.emptySub}
                      </span>
                    </div>
                  ) : (
                    tasks.map((task) => {
                      const assignedDate = scheduledDates[task.id] || task.scheduled_date

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          className="group flex items-center justify-between p-3 bg-[#FCFAF7] border border-[#E5DFE2] hover:border-[#EFBCD5]/60 rounded-xl text-xs transition-all cursor-grab active:cursor-grabbing hover:bg-white"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <GripVertical className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-400 flex-shrink-0" />
                            {/* Cuhp signature pink checkmark button */}
                            <button
                              type="button"
                              onClick={() => toggleTodoMutation.mutate(task.id)}
                              className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                                task.completed
                                  ? "bg-[#EFBCD5] border-[#EFBCD5] text-white shadow-xs"
                                  : "bg-white border-[#d2c2c8] hover:border-[#EFBCD5]"
                              }`}
                              title={task.completed ? "Mark as incomplete" : "Mark as completed"}
                            >
                              {task.completed && <Check className="h-3 w-3 stroke-[3px]" />}
                            </button>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`font-medium ${
                                    task.completed
                                      ? "line-through text-[#706065]/60"
                                      : "text-[#1f1a1d]"
                                  }`}
                                >
                                  {task.title}
                                </span>
                                {task.estimated_time && (
                                  <span
                                    className="text-[10px] font-mono text-[#7b5268] bg-[#fcf1f5] px-1.5 py-0.2 rounded border border-[#EFBCD5]/40 flex items-center gap-0.5 flex-shrink-0"
                                    title={`Estimated time: ${task.estimated_time} minutes`}
                                  >
                                    <Clock className="w-2.5 h-2.5 text-[#7b5268]" />
                                    {task.estimated_time}m
                                  </span>
                                )}
                                {task.due_date && (
                                  <span
                                    className="text-[10px] font-mono text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/80 flex items-center gap-0.5 flex-shrink-0"
                                    title={`Due date: ${task.due_date}`}
                                  >
                                    <Calendar className="w-2.5 h-2.5 text-amber-600" />
                                    {task.due_date}
                                  </span>
                                )}
                                {assignedDate && (
                                  <span
                                    className="text-[10px] font-mono text-[#7b5268] bg-[#fcf1f5] px-1.5 py-0.2 rounded border border-[#EFBCD5]/40 flex items-center gap-0.5 flex-shrink-0"
                                    title={`Scheduled for ${assignedDate}`}
                                  >
                                    <CalendarDays className="w-2.5 h-2.5 text-[#EFBCD5]" />
                                    {assignedDate}
                                  </span>
                                )}
                              </div>
                              {task.description && (
                                <p className="text-[11px] text-[#706065] truncate mt-0.5">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
                            {/* Edit button */}
                            <button
                              onClick={() => handleOpenEditModal(task)}
                              className="p-1 text-zinc-400 hover:text-[#EFBCD5] transition-colors cursor-pointer"
                              title="Edit task"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                              title="Delete task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* RIGHT COLUMN: Daily Schedule Panel (4 cols) */}
        <div className="lg:col-span-4">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDropSchedule}
            className="glass-card bg-white border border-[#E5DFE2] rounded-[24px] p-6 shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] flex flex-col h-[780px] overflow-hidden font-outfit"
          >
            {/* Schedule Header */}
            <div className="flex items-center justify-between mb-1 pb-2 border-b border-[#E5DFE2]/70">
              <h2 className="font-sora font-bold text-xl text-[#201B1E] flex items-center gap-2">
                <span>Daily Schedule</span>
              </h2>
              <span className="text-xs font-mono font-bold text-[#7b5268] bg-[#fcf1f5] px-2.5 py-1 rounded-lg border border-[#eae0e4]">
                {scheduledTasksForSelectedDate.length} tasks
              </span>
            </div>

            <p className="text-xs text-[#706065] mb-4">{monthYearLabel}</p>

            {/* Navigation Bar (Today + Chevrons) */}
            <div className="flex items-center justify-between mb-4 gap-2">
              <button
                onClick={() => {
                  setSelectedDate(new Date())
                  setWeekOffset(0)
                }}
                className="px-3 py-1.5 rounded-lg border border-[#E5DFE2] hover:bg-[#fcf1f5] text-xs font-semibold text-[#706065] hover:text-[#EFBCD5] transition-colors cursor-pointer"
              >
                Today
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWeekOffset((prev) => prev - 1)}
                  className="p-1.5 rounded-lg border border-[#E5DFE2] hover:bg-[#fcf1f5] text-[#706065] hover:text-[#EFBCD5] transition-colors cursor-pointer"
                  title="Previous week"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setWeekOffset((prev) => prev + 1)}
                  className="p-1.5 rounded-lg border border-[#E5DFE2] hover:bg-[#fcf1f5] text-[#706065] hover:text-[#EFBCD5] transition-colors cursor-pointer"
                  title="Next week"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Horizontal Day Picker Strip */}
            <div className="grid grid-cols-7 gap-1.5 mb-4 pb-3 border-b border-[#E5DFE2]/60 text-center">
              {weekDays.map((day) => {
                const isSelected = day.key === selectedDateKey
                return (
                  <button
                    key={day.key}
                    onClick={() => setSelectedDate(day.fullDate)}
                    className={`p-2 rounded-xl flex flex-col items-center justify-center min-h-[54px] border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#EFBCD5]/25 border-[#EFBCD5] text-[#1f1a1d] font-bold shadow-xs"
                        : "bg-white border-[#E5DFE2]/60 hover:border-[#EFBCD5] text-[#706065]"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-mono mb-0.5">{day.name}</span>
                    <span className="text-sm font-bold">{day.dateNum}</span>
                  </button>
                )
              })}
            </div>

            {/* Quick Add Task for Selected Date */}
            <form onSubmit={handleQuickAddSchedule} className="flex gap-2 mb-4">
              <input
                type="text"
                value={scheduleQuickInput}
                onChange={(e) => setScheduleQuickInput(e.target.value)}
                placeholder="Quick add task for this day..."
                className="flex-1 bg-[#FCFAF7] border border-[#E5DFE2] rounded-xl px-3.5 py-2 text-xs text-[#1f1a1d] focus:outline-none focus:border-[#EFBCD5] focus:bg-white transition-all placeholder:text-[#706065]/60"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-[#EFBCD5] hover:bg-[#ebb8d1] text-[#201B1E] rounded-xl font-bold transition-all shadow-xs border border-[#ffd8ea] flex items-center justify-center cursor-pointer"
                title="Add task to schedule"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            {/* Scheduled Tasks Content / Empty State */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 hide-scrollbar">
              {scheduledTasksForSelectedDate.length === 0 ? (
                <div className="h-full border-2 border-dashed border-[#E5DFE2]/70 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#fcf1f5] border border-[#EFBCD5]/40 flex items-center justify-center text-[#7b5268] mb-3">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <span className="font-sora font-bold text-base text-[#1f1a1d] mb-1.5">
                    Empty Schedule
                  </span>
                  <span className="text-xs text-[#706065] max-w-[220px] leading-relaxed">
                    Drag & drop tasks from the Matrix here to plan your day.
                  </span>
                </div>
              ) : (
                scheduledTasksForSelectedDate.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-[#FCFAF7] border border-[#E5DFE2] hover:border-[#EFBCD5]/60 rounded-xl text-xs flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Cuhp signature pink checkmark button */}
                      <button
                        type="button"
                        onClick={() => toggleTodoMutation.mutate(task.id)}
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                          task.completed
                            ? "bg-[#EFBCD5] border-[#EFBCD5] text-white shadow-xs"
                            : "bg-white border-[#d2c2c8] hover:border-[#EFBCD5]"
                        }`}
                        title={task.completed ? "Mark as incomplete" : "Mark as completed"}
                      >
                        {task.completed && <Check className="h-3 w-3 stroke-[3px]" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`font-medium ${
                              task.completed ? "line-through text-[#706065]/60" : "text-[#1f1a1d]"
                            }`}
                          >
                            {task.title}
                          </span>
                          {task.estimated_time && (
                            <span
                              className="text-[10px] font-mono text-[#7b5268] bg-[#fcf1f5] px-1.5 py-0.2 rounded border border-[#EFBCD5]/40 flex items-center gap-0.5"
                              title={`Estimated time: ${task.estimated_time} minutes`}
                            >
                              <Clock className="w-2.5 h-2.5 text-[#7b5268]" />
                              {task.estimated_time}m
                            </span>
                          )}
                          {task.due_date && (
                            <span
                              className="text-[10px] font-mono text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/80 flex items-center gap-0.5"
                              title={`Due date: ${task.due_date}`}
                            >
                              <Calendar className="w-2.5 h-2.5 text-amber-600" />
                              {task.due_date}
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <span className="block text-[11px] text-[#706065] truncate mt-0.5">
                            {task.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity ml-2">
                      <button
                        onClick={() => handleOpenEditModal(task)}
                        className="p-1 text-zinc-400 hover:text-[#EFBCD5] transition-colors cursor-pointer"
                        title="Edit task"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveFromSchedule(task.id)}
                        className="p-1 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Remove from schedule"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New / Edit Task Popup Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200 font-outfit">
          <div
            className="bg-white rounded-[24px] p-6 border border-[#E5DFE2] shadow-[0_15px_35px_-5px_rgba(239,188,213,0.25)] w-full max-w-md animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#E5DFE2]">
              <h3 className="font-sora font-bold text-lg text-[#1f1a1d]">
                {editingTask ? "Edit Task" : "New Task"}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingTask(null)
                }}
                className="p-1.5 text-[#706065] hover:text-[#EFBCD5] rounded-full hover:bg-zinc-50 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTaskModal} className="space-y-4 font-outfit">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#706065] uppercase tracking-wider">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter task title..."
                  className="w-full bg-[#FCFAF7] border border-[#E5DFE2] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#EFBCD5] text-sm text-[#1f1a1d]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#706065] uppercase tracking-wider">
                  Description (Optional)
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Enter task details..."
                  className="w-full bg-[#FCFAF7] border border-[#E5DFE2] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#EFBCD5] text-sm text-[#1f1a1d] resize-none h-20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#706065] uppercase tracking-wider">
                  Priority Quadrant
                </label>
                <CustomSelect
                  value={newQuadrant}
                  onChange={(val) => setNewQuadrant(val as TodoQuadrant)}
                  options={[
                    { value: "do", label: "Do First (Urgent & Important)", color: "#EF4444" },
                    { value: "schedule", label: "Schedule (Important, Not Urgent)", color: "#3B82F6" },
                    { value: "delegate", label: "Delegate (Urgent, Not Important)", color: "#F59E0B" },
                    { value: "eliminate", label: "Eliminate (Not Urgent, Not Important)", color: "#8B5CF6" },
                  ]}
                  placeholder="-- Select Quadrant --"
                />
              </div>

              {/* Due Date & Estimated Time Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#706065] uppercase tracking-wider">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-[#FCFAF7] border border-[#E5DFE2] rounded-xl px-3 py-2 focus:outline-none focus:border-[#EFBCD5] text-xs text-[#1f1a1d]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#706065] uppercase tracking-wider">
                    Est. Time (Mins)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newEstTime}
                    onChange={(e) => setNewEstTime(e.target.value)}
                    placeholder="e.g. 30"
                    className="w-full bg-[#FCFAF7] border border-[#E5DFE2] rounded-xl px-3 py-2 focus:outline-none focus:border-[#EFBCD5] text-xs text-[#1f1a1d]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5DFE2] flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    setEditingTask(null)
                  }}
                  className="flex-1 py-2.5 border border-[#E5DFE2] text-[#706065] rounded-xl font-sora font-semibold text-xs hover:bg-zinc-50 active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTodoMutation.isPending || updateTodoMutation.isPending}
                  className="flex-1 py-2.5 bg-[#EFBCD5] text-[#201B1E] rounded-xl font-sora font-bold text-xs hover:bg-[#ebb8d1] active:scale-95 transition-all shadow-sm border border-[#ffd8ea] cursor-pointer"
                >
                  {editingTask
                    ? updateTodoMutation.isPending
                      ? "Saving..."
                      : "Save Changes"
                    : createTodoMutation.isPending
                    ? "Saving..."
                    : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
