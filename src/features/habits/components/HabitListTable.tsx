import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import * as LucideIcons from "lucide-react"
import type { Habit } from "../types"

export function HabitListTable({
  habits,
  isLoading,
  onEdit,
  onDelete,
}: {
  habits: Habit[]
  isLoading: boolean
  onEdit: (habit: Habit) => void
  onDelete: (habit: Habit) => void
}) {
  const renderIcon = (iconName: string | null, className?: string) => {
    const IconComponent = (iconName && (LucideIcons as any)[iconName]) || LucideIcons.CheckSquare
    return <IconComponent className={className} />
  }

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden shadow-none">
      <div className="overflow-x-auto animate-in fade-in-0 duration-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-muted-foreground text-sm font-medium">
              <th className="p-4 w-16">Icon</th>
              <th className="p-4">Tên thói quen</th>
              <th className="p-4">Mô tả</th>
              <th className="p-4 w-24">Thứ tự</th>
              <th className="p-4 w-32">Trạng thái</th>
              <th className="w-28 p-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Đang tải danh sách...
                </td>
              </tr>
            ) : habits.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Chưa có thói quen nào.
                </td>
              </tr>
            ) : (
              habits.map((h) => (
                <tr key={h.id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-background border border-border shadow-sm">
                      {renderIcon(h.icon, "size-4.5 text-primary")}
                    </div>
                  </td>
                  <td className="p-4 font-semibold text-foreground">{h.name}</td>
                  <td className="p-4 text-muted-foreground max-w-[250px] truncate">{h.description || "-"}</td>
                  <td className="p-4 font-medium text-muted-foreground">{h.order}</td>
                  <td className="p-4">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold border",
                        h.is_active
                          ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border"
                      )}
                    >
                      {h.is_active ? "Hoạt động" : "Tạm ẩn"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={() => onEdit(h)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 cursor-pointer text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(h)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
