import * as React from "react"
import {
  useTodosQuery,
  useCreateTodo,
  useDeleteTodo,
  useToggleTodo,
} from "@/features/todos/hooks"
import type { TodoQuadrant, TodoTask } from "@/types"
import {
  AlertCircle,
  Calendar,
  UserPlus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { CustomSelect } from "@/components/ui/CustomSelect"

export default function Tasks() {
  // 1. Fetch todos
  const { data: todosData } = useTodosQuery({ scope: "all" })

  // 2. Mutations
  const createTodoMutation = useCreateTodo()
  const toggleTodoMutation = useToggleTodo()
  const deleteTodoMutation = useDeleteTodo()

  // Local state for quadrant collapses
  const [collapsed, setCollapsed] = React.useState<Record<TodoQuadrant, boolean>>({
    inbox: true,
    do: false,
    schedule: false,
    delegate: true,
    eliminate: true,
  })

  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [newTitle, setNewTitle] = React.useState("")
  const [newDesc, setNewDesc] = React.useState("")
  const [newQuadrant, setNewQuadrant] = React.useState<TodoQuadrant>("do")

  // Local state for scheduling popover
  const [schedulingTaskId, setSchedulingTaskId] = React.useState<string | null>(null)

  const toggleCollapse = (quad: TodoQuadrant) => {
    setCollapsed((prev) => ({ ...prev, [quad]: !prev[quad] }))
  }

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

  // Hourly slots definition
  const hourlySlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"]

  // Get task assigned to a specific hour
  const getTaskForHour = (hour: string) => {
    if (!todosData?.items) return null
    return todosData.items.find((task) => {
      const scheduledHour = localStorage.getItem(`task_hour_${task.id}`)
      return scheduledHour === hour && !task.completed
    }) || null
  }

  // Handle scheduling a task to an hour
  const handleScheduleTask = (taskId: string, hour: string | null) => {
    if (hour) {
      // Clear previous task at this hour to avoid overlaps
      if (todosData?.items) {
        todosData.items.forEach((t) => {
          if (localStorage.getItem(`task_hour_${t.id}`) === hour) {
            localStorage.removeItem(`task_hour_${t.id}`)
          }
        })
      }
      localStorage.setItem(`task_hour_${taskId}`, hour)
      toast.success(`Scheduled task at ${hour}`)
    } else {
      localStorage.removeItem(`task_hour_${taskId}`)
      toast.info("Removed task from today's schedule")
    }
    setSchedulingTaskId(null)
  }

  // Create Task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) {
      toast.error("Please enter a task title.")
      return
    }

    createTodoMutation.mutate(
      {
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        quadrant: newQuadrant,
      },
      {
        onSuccess: () => {
          toast.success("Task added successfully!")
          setIsModalOpen(false)
          setNewTitle("")
          setNewDesc("")
        },
        onError: (err) => {
          toast.error(`Failed to create task: ${err.message}`)
        },
      }
    )
  }

  // Delete Task
  const handleDeleteTask = (id: string) => {
    deleteTodoMutation.mutate(id, {
      onSuccess: () => {
        localStorage.removeItem(`task_hour_${id}`)
        toast.success("Task deleted.")
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="mb-[24px] flex justify-between items-end">
        <div>
          <h1 className="font-sora text-3xl font-bold text-[#1f1a1d] mb-2 tracking-tight">
            Task Matrix
          </h1>
          <p className="font-outfit text-base text-[#706065] font-normal">
            Prioritize and manage your focus.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 bg-[#EFBCD5] text-[#201B1E] font-sora font-semibold text-base px-6 py-2.5 rounded-[24px] hover:shadow-[0_10px_30px_-5px_rgba(239,188,213,0.3)] transition-all active:scale-95 border border-[#ffd8ea]"
        >
          <Plus className="h-5 w-5" />
          <span>New Task</span>
        </button>
      </header>

      {/* Grid Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Eisenhower Matrix Quadrants */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Q1: Do First */}
          <div className="bg-white rounded-[24px] border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] overflow-hidden p-[24px]">
            <button
              className="w-full flex items-center justify-between text-left"
              onClick={() => toggleCollapse("do")}
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-[#EFBCD5]" />
                <span className="font-sora text-2xl text-[#1f1a1d] font-semibold">
                  Do First{" "}
                  <span className="text-[#706065] text-base font-normal ml-2">
                    (Urgent & Important)
                  </span>
                </span>
              </div>
              {collapsed.do ? (
                <ChevronDown className="h-5 w-5 text-[#706065]" />
              ) : (
                <ChevronUp className="h-5 w-5 text-[#706065]" />
              )}
            </button>

            {!collapsed.do && (
              <div className="pt-4 border-t border-[#E5DFE2] mt-4 space-y-2">
                {tasksByQuadrant.do.length === 0 ? (
                  <div className="text-[#706065] py-2 text-center text-sm font-outfit">
                    No tasks currently.
                  </div>
                ) : (
                  tasksByQuadrant.do.map((task) => (
                    <div
                      key={task.id}
                      className="group flex items-center gap-3 py-2.5 border-b border-[#E5DFE2]/60 last:border-0 hover:bg-zinc-50/50 rounded-lg px-2 -mx-2 transition-all duration-200"
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTodoMutation.mutate(task.id)}
                        className="w-5 h-5 rounded border-[#d2c2c8] text-[#EFBCD5] focus:ring-[#EFBCD5] bg-white cursor-pointer"
                      />
                      <span
                        className={`font-outfit text-base flex-1 ${
                          task.completed ? "line-through text-[#706065]/60" : "text-[#1f1a1d]"
                        }`}
                      >
                        {task.title}
                      </span>

                      {/* Schedule action icon */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setSchedulingTaskId(schedulingTaskId === task.id ? null : task.id)
                          }
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#706065] hover:text-[#EFBCD5]"
                          title="Schedule to Timeline"
                        >
                          <Calendar className="h-4.5 w-4.5" />
                        </button>
                        {schedulingTaskId === task.id && (
                          <div className="absolute right-0 top-8 z-50 bg-white border border-[#E5DFE2] rounded-xl p-2 shadow-lg w-40 flex flex-col gap-1 text-xs">
                            <span className="font-semibold text-zinc-500 px-2 py-1 block">
                              Schedule to:
                            </span>
                            {hourlySlots.map((h) => (
                              <button
                                key={h}
                                onClick={() => handleScheduleTask(task.id, h)}
                                className="w-full text-left px-2 py-1.5 hover:bg-zinc-50 rounded text-zinc-700 font-mono"
                              >
                                {h}
                              </button>
                            ))}
                            {localStorage.getItem(`task_hour_${task.id}`) && (
                              <button
                                onClick={() => handleScheduleTask(task.id, null)}
                                className="w-full text-left px-2 py-1.5 hover:bg-red-50 text-red-600 rounded font-semibold border-t border-zinc-100"
                              >
                                Remove from schedule
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#706065] hover:text-red-500"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Q2: Schedule */}
          <div className="bg-white rounded-[24px] border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] overflow-hidden p-[24px]">
            <button
              className="w-full flex items-center justify-between text-left"
              onClick={() => toggleCollapse("schedule")}
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-[#706065]" />
                <span className="font-sora text-2xl text-[#1f1a1d] font-semibold">
                  Schedule{" "}
                  <span className="text-[#706065] text-base font-normal ml-2">
                    (Important, Not Urgent)
                  </span>
                </span>
              </div>
              {collapsed.schedule ? (
                <ChevronDown className="h-5 w-5 text-[#706065]" />
              ) : (
                <ChevronUp className="h-5 w-5 text-[#706065]" />
              )}
            </button>

            {!collapsed.schedule && (
              <div className="pt-4 border-t border-[#E5DFE2] mt-4 space-y-2">
                {tasksByQuadrant.schedule.length === 0 ? (
                  <div className="text-[#706065] py-2 text-center text-sm font-outfit">
                    No tasks currently.
                  </div>
                ) : (
                  tasksByQuadrant.schedule.map((task) => (
                    <div
                      key={task.id}
                      className="group flex items-center gap-3 py-2.5 border-b border-[#E5DFE2]/60 last:border-0 hover:bg-zinc-50/50 rounded-lg px-2 -mx-2 transition-all duration-200"
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTodoMutation.mutate(task.id)}
                        className="w-5 h-5 rounded border-[#d2c2c8] text-[#EFBCD5] focus:ring-[#EFBCD5] bg-white cursor-pointer"
                      />
                      <span
                        className={`font-outfit text-base flex-1 ${
                          task.completed ? "line-through text-[#706065]/60" : "text-[#1f1a1d]"
                        }`}
                      >
                        {task.title}
                      </span>

                      {/* Schedule action icon */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setSchedulingTaskId(schedulingTaskId === task.id ? null : task.id)
                          }
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#706065] hover:text-[#EFBCD5]"
                          title="Schedule to Timeline"
                        >
                          <Calendar className="h-4.5 w-4.5" />
                        </button>
                        {schedulingTaskId === task.id && (
                          <div className="absolute right-0 top-8 z-50 bg-white border border-[#E5DFE2] rounded-xl p-2 shadow-lg w-40 flex flex-col gap-1 text-xs">
                            <span className="font-semibold text-zinc-500 px-2 py-1 block">
                              Schedule to:
                            </span>
                            {hourlySlots.map((h) => (
                              <button
                                key={h}
                                onClick={() => handleScheduleTask(task.id, h)}
                                className="w-full text-left px-2 py-1.5 hover:bg-zinc-50 rounded text-zinc-700 font-mono"
                              >
                                {h}
                              </button>
                            ))}
                            {localStorage.getItem(`task_hour_${task.id}`) && (
                              <button
                                onClick={() => handleScheduleTask(task.id, null)}
                                className="w-full text-left px-2 py-1.5 hover:bg-red-50 text-red-600 rounded font-semibold border-t border-zinc-100"
                              >
                                Remove from schedule
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#706065] hover:text-red-500"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Q3: Delegate */}
          <div className="bg-white rounded-[24px] border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] overflow-hidden p-[24px]">
            <button
              className="w-full flex items-center justify-between text-left"
              onClick={() => toggleCollapse("delegate")}
            >
              <div className="flex items-center gap-3">
                <UserPlus className="h-6 w-6 text-[#706065]" />
                <span className="font-sora text-2xl text-[#1f1a1d] font-semibold">
                  Delegate{" "}
                  <span className="text-[#706065] text-base font-normal ml-2">
                    (Urgent, Not Important)
                  </span>
                </span>
              </div>
              {collapsed.delegate ? (
                <ChevronDown className="h-5 w-5 text-[#706065]" />
              ) : (
                <ChevronUp className="h-5 w-5 text-[#706065]" />
              )}
            </button>

            {!collapsed.delegate && (
              <div className="pt-4 border-t border-[#E5DFE2] mt-4 space-y-2">
                {tasksByQuadrant.delegate.length === 0 ? (
                  <div className="text-[#706065] py-2 text-center text-sm font-outfit">
                    No tasks currently.
                  </div>
                ) : (
                  tasksByQuadrant.delegate.map((task) => (
                    <div
                      key={task.id}
                      className="group flex items-center gap-3 py-2.5 border-b border-[#E5DFE2]/60 last:border-0 hover:bg-zinc-50/50 rounded-lg px-2 -mx-2 transition-all duration-200"
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTodoMutation.mutate(task.id)}
                        className="w-5 h-5 rounded border-[#d2c2c8] text-[#EFBCD5] focus:ring-[#EFBCD5] bg-white cursor-pointer"
                      />
                      <span
                        className={`font-outfit text-base flex-1 ${
                          task.completed ? "line-through text-[#706065]/60" : "text-[#1f1a1d]"
                        }`}
                      >
                        {task.title}
                      </span>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#706065] hover:text-red-500"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Q4: Eliminate */}
          <div className="bg-white rounded-[24px] border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] overflow-hidden p-[24px]">
            <button
              className="w-full flex items-center justify-between text-left"
              onClick={() => toggleCollapse("eliminate")}
            >
              <div className="flex items-center gap-3">
                <Trash2 className="h-6 w-6 text-[#706065]" />
                <span className="font-sora text-2xl text-[#1f1a1d] font-semibold">
                  Eliminate{" "}
                  <span className="text-[#706065] text-base font-normal ml-2">
                    (Not Urgent, Not Important)
                  </span>
                </span>
              </div>
              {collapsed.eliminate ? (
                <ChevronDown className="h-5 w-5 text-[#706065]" />
              ) : (
                <ChevronUp className="h-5 w-5 text-[#706065]" />
              )}
            </button>

            {!collapsed.eliminate && (
              <div className="pt-4 border-t border-[#E5DFE2] mt-4 space-y-2">
                {tasksByQuadrant.eliminate.length === 0 ? (
                  <div className="text-[#706065] py-2 text-center text-sm font-outfit">
                    No tasks currently.
                  </div>
                ) : (
                  tasksByQuadrant.eliminate.map((task) => (
                    <div
                      key={task.id}
                      className="group flex items-center gap-3 py-2.5 border-b border-[#E5DFE2]/60 last:border-0 hover:bg-zinc-50/50 rounded-lg px-2 -mx-2 transition-all duration-200"
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTodoMutation.mutate(task.id)}
                        className="w-5 h-5 rounded border-[#d2c2c8] text-[#EFBCD5] focus:ring-[#EFBCD5] bg-white cursor-pointer"
                      />
                      <span
                        className={`font-outfit text-base flex-1 ${
                          task.completed ? "line-through text-[#706065]/60" : "text-[#1f1a1d]"
                        }`}
                      >
                        {task.title}
                      </span>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#706065] hover:text-red-500"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Daily Planner Timeline */}
        <div className="lg:col-span-5 relative">
          <div className="bg-white rounded-[24px] border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] p-[24px] sticky top-[120px] font-outfit">
            <h2 className="font-sora text-2xl font-bold text-[#1f1a1d] mb-[24px]">
              Daily Planner
            </h2>
            <div className="relative pl-[60px] flex flex-col gap-[36px] before:absolute before:left-[45px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#E5DFE2]">
              {hourlySlots.map((hour) => {
                const task = getTaskForHour(hour)
                return (
                  <div key={hour} className="relative">
                    <span className="absolute left-[-60px] top-0.5 font-mono text-xs text-[#706065] w-[40px] text-right">
                      {hour}
                    </span>
                    <div
                      className={`absolute left-[-19px] top-2 w-[10px] h-[10px] rounded-full border-2 border-white z-10 ${
                        task ? "bg-[#EFBCD5]" : "bg-[#E5DFE2]"
                      }`}
                    />

                    {task ? (
                      <div className="bg-[#fcf1f5]/70 text-[#201B1E] rounded-[12px] p-3.5 border border-[#E5DFE2] cursor-pointer hover:shadow-md transition-shadow relative -top-2 flex justify-between items-center">
                        <div>
                          <span className="font-sora text-base font-bold block">
                            {task.title}
                          </span>
                          {task.description && (
                            <span className="text-xs text-[#706065] block mt-0.5">
                              {task.description}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleScheduleTask(task.id, null)}
                          className="p-1 text-[#706065] hover:text-red-500 rounded-full hover:bg-zinc-100 transition-colors"
                          title="Remove from schedule"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-[#EFBCD5]/30 rounded-[12px] px-3.5 py-2.5 flex items-center justify-center bg-[#fcf1f5]/10 relative -top-2 h-[50px]">
                        <span className="text-xs font-mono text-[#EFBCD5] opacity-80">
                          Empty Slot
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* New Task Popup Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white rounded-[24px] p-6 border border-[#E5DFE2] shadow-[0_15px_35px_-5px_rgba(239,188,213,0.25)] w-full max-w-md animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#E5DFE2]">
              <h3 className="font-sora font-bold text-lg text-[#1f1a1d]">New Task</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-[#706065] hover:text-[#EFBCD5] rounded-full hover:bg-zinc-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 font-outfit">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#706065] uppercase tracking-wider">
                  Title
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
                  Eisenhower Matrix
                </label>
                <CustomSelect
                  value={newQuadrant}
                  onChange={(val) => setNewQuadrant(val as TodoQuadrant)}
                  options={[
                    { value: "do", label: "Do First (Urgent & Important)", color: "#EF4444" },
                    { value: "schedule", label: "Schedule (Not Urgent & Important)", color: "#3B82F6" },
                    { value: "delegate", label: "Delegate (Urgent & Not Important)", color: "#F59E0B" },
                    { value: "eliminate", label: "Eliminate (Not Urgent & Not Important)", color: "#10B981" },
                  ]}
                  placeholder="-- Select Quadrant --"
                />
              </div>

              <div className="pt-4 border-t border-[#E5DFE2] flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-[#E5DFE2] text-[#706065] rounded-xl font-sora font-semibold text-xs hover:bg-zinc-50 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTodoMutation.isPending}
                  className="flex-1 py-2.5 bg-[#EFBCD5] text-[#201B1E] rounded-xl font-sora font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-sm border border-[#ffd8ea]"
                >
                  {createTodoMutation.isPending ? "Saving..." : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
