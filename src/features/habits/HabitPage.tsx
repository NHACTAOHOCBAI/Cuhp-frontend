import * as React from "react"
import { CalendarCheck, Plus, ListTodo, ClipboardList } from "lucide-react"
import { PageHeader } from "@/components/admin/PageHeader"
import { Button } from "@/components/ui/button"
import { TabsControl, type TabsControlItem } from "@/components/ui/tabs-control"
import { toast } from "sonner"
import { HabitTracker } from "./components/HabitTracker"
import { HabitListTable } from "./components/HabitListTable"
import { HabitEditDialog } from "./components/HabitEditDialog"
import { useHabitsQuery, useDeleteHabit } from "./hooks"
import type { Habit } from "./types"

type TabKey = "tracker" | "manage"

const TAB_ITEMS: TabsControlItem<TabKey>[] = [
  { value: "tracker", label: "Nhật ký thói quen", icon: <ClipboardList className="mr-1.5 size-4" /> },
  { value: "manage", label: "Quản lý thói quen", icon: <ListTodo className="mr-1.5 size-4" /> },
]

export function HabitPage() {
  const [activeTab, setActiveTab] = React.useState<TabKey>("tracker")
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [editingHabit, setEditingHabit] = React.useState<Habit | null>(null)

  const { data: habits = [], isLoading: habitsLoading } = useHabitsQuery()
  const deleteMut = useDeleteHabit()

  const maxOrder = React.useMemo(() => {
    return habits.reduce((max, h) => Math.max(max, h.order), 0)
  }, [habits])

  const handleAddNew = () => {
    setEditingHabit(null)
    setEditDialogOpen(true)
  }

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit)
    setEditDialogOpen(true)
  }

  const handleDelete = (habit: Habit) => {
    if (!confirm(`Bạn có chắc chắn muốn xoá thói quen "${habit.name}" và toàn bộ lịch sử ghi chép liên quan?`)) {
      return
    }

    deleteMut.mutate(habit.id, {
      onSuccess: () => {
        toast.success(`Đã xoá thói quen "${habit.name}".`)
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Xoá thói quen thất bại."
        )
      },
    })
  }

  const handleTrackerAddClick = () => {
    // Switch to manage tab and open add dialog
    setActiveTab("manage")
    handleAddNew()
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-background p-6 overflow-y-auto animate-in fade-in-0 duration-150">
      <div className="w-full space-y-6">
        <PageHeader
          title="Theo dõi thói quen"
          description="Quản lý và ghi chép việc thực hiện các thói quen hàng ngày để rèn luyện bản thân."
          icon={<CalendarCheck className="h-6 w-6 text-primary" />}
        >
          {activeTab === "manage" && (
            <Button onClick={handleAddNew} className="gap-1.5 cursor-pointer shrink-0">
              <Plus className="h-4 w-4" />
              Thêm thói quen
            </Button>
          )}
        </PageHeader>

        {/* View Tabs */}
        <TabsControl value={activeTab} onChange={(v) => setActiveTab(v)} items={TAB_ITEMS} />

        <div className="mt-2">
          {activeTab === "tracker" ? (
            <HabitTracker onAddHabit={handleTrackerAddClick} />
          ) : (
            <HabitListTable
              habits={habits}
              isLoading={habitsLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      <HabitEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editingHabit={editingHabit}
        maxOrder={maxOrder}
      />
    </div>
  )
}
