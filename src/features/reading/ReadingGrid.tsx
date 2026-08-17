import { Link } from "react-router-dom"
import { Edit2, Trash2, Calendar, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { READING_LEVELS, READING_CATEGORIES } from "./types"
import type { ReadingPassageListItem } from "./types"

export function ReadingGrid({
  passages,
  isLoading,
  onEdit,
  onDelete,
  isDeletingId,
  currentUserId,
  isAdmin,
}: {
  passages: ReadingPassageListItem[]
  isLoading: boolean
  onEdit: (item: ReadingPassageListItem) => void
  onDelete: (item: ReadingPassageListItem) => void
  isDeletingId: string | null
  currentUserId: string | undefined
  isAdmin: boolean
}) {
  const getLevelLabel = (val: string | null | undefined) => {
    if (!val) return "Không xác định"
    return READING_LEVELS.find((l) => l.value === val)?.label ?? val
  }

  const getCategoryLabel = (val: string | null | undefined) => {
    if (!val) return "Khác"
    return READING_CATEGORIES.find((c) => c.value === val)?.label ?? val
  }

  const getLevelColorClass = (val: string | null | undefined) => {
    switch (val) {
      case "A1":
      case "A2":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "B1":
      case "B2":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      case "C1":
      case "C2":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[300px]">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card rounded-md border border-border p-5 space-y-4 animate-pulse">
            <div className="h-5 bg-muted rounded w-2/3" />
            <div className="flex gap-2">
              <div className="h-5 bg-muted rounded w-1/4" />
              <div className="h-5 bg-muted rounded w-1/3" />
            </div>
            <div className="h-4 bg-muted rounded w-1/2 mt-2" />
            <div className="flex justify-between items-center pt-4 border-t border-border/50">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-8 bg-muted rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (passages.length === 0) {
    return (
      <div className="w-full bg-card rounded-md border border-border p-10 text-center shadow-none">
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-lg font-bold text-foreground">Chưa có bài đọc nào</h3>
          <p className="text-sm text-muted-foreground">
            Hãy tạo bài đọc đầu tiên của bạn để bắt đầu ôn luyện dịch và học tập từ vựng!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {passages.map((p) => {
        const isOwner = p.user_id === currentUserId
        const canModify = isOwner || isAdmin
        const isDeleting = isDeletingId === p.id

        return (
          <div
            key={p.id}
            className="bg-card rounded-md border border-border p-5 flex flex-col justify-between hover:border-primary/40 hover:shadow-sm transition-all duration-200 group h-[180px] shadow-none"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Link
                  to={`/admin/reading/${p.id}`}
                  className="font-bold text-foreground hover:text-primary hover:underline line-clamp-1 text-base flex-1"
                  title={p.title}
                >
                  {p.title}
                </Link>
              </div>

              <div className="flex flex-wrap gap-1.5 items-center">
                <Badge variant="outline" className={getLevelColorClass(p.level)}>
                  {getLevelLabel(p.level)}
                </Badge>
                <Badge variant="secondary" className="text-[10px] py-0.5 shadow-none">
                  {getCategoryLabel(p.category)}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 select-none">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {new Date(p.created_at).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-3 select-none">
              <Link to={`/admin/reading/${p.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-primary font-semibold hover:bg-primary/5 hover:text-primary flex items-center gap-1 cursor-pointer"
                >
                  Luyện dịch <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>

              {canModify && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 cursor-pointer"
                    onClick={() => onEdit(p)}
                    title="Sửa bài đọc"
                  >
                    <Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive cursor-pointer hover:bg-destructive/10"
                    onClick={() => onDelete(p)}
                    disabled={isDeleting}
                    title="Xóa bài đọc"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
