/**
 * Section header + 3-col grid of WorkoutCategory cards with edit/delete.
 */
import { Edit, FolderOpen, FolderPlus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { WorkoutCategory } from "@/types"
import { getColorClasses } from "../utils/colors"

interface CategoryCardGridProps {
  categories: WorkoutCategory[]
  onEdit: (cat: WorkoutCategory) => void
  onDelete: (cat: WorkoutCategory) => void
  onAdd: () => void
}

export function CategoryCardGrid({
  categories,
  onEdit,
  onDelete,
  onAdd,
}: CategoryCardGridProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            Phân loại nhóm cơ tập luyện
          </h3>
          <p className="text-xs text-muted-foreground">
            Tùy biến các nhóm cơ để dễ dàng quản lý và theo dõi các bài tập.
          </p>
        </div>
        <Button
          onClick={onAdd}
          size="sm"
          className="gap-1.5 cursor-pointer text-xs font-bold shadow-none"
        >
          <FolderPlus className="h-3.5 w-3.5" /> Thêm nhóm cơ
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-2xl bg-muted/20 text-center space-y-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <FolderOpen className="h-5 w-5 text-muted-foreground/75" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold">Chưa có nhóm cơ nào</p>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              Tạo nhóm cơ để gắn nhãn cho các bài tập của bạn.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 text-xs font-bold shadow-none"
            onClick={onAdd}
          >
            Tạo ngay
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const colorInfo = getColorClasses(cat.color)
            return (
              <Card
                key={cat.id}
                className="border-border shadow-none bg-card hover:shadow-sm transition-all duration-200"
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`h-3 w-3 rounded-full shrink-0 ${colorInfo.dot}`} />
                    <span className="text-sm font-bold text-foreground truncate">
                      {cat.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                      onClick={() => onEdit(cat)}
                      title="Chỉnh sửa"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 cursor-pointer"
                      onClick={() => onDelete(cat)}
                      title="Xoá"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
