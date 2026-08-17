import { Link } from "react-router-dom"
import { Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { READING_LEVELS, READING_CATEGORIES } from "./types"
import type { ReadingPassageListItem } from "./types"

export function ReadingTable({
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
      <div className="w-full bg-card rounded-md border border-border overflow-hidden min-h-[300px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Đang tải danh sách bài đọc...</p>
        </div>
      </div>
    )
  }

  if (passages.length === 0) {
    return (
      <div className="w-full bg-card rounded-md border border-border p-10 text-center">
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
    <div className="w-full bg-card rounded-md border border-border overflow-hidden shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-sm font-medium text-muted-foreground">
              <th className="p-4">Tiêu đề bài đọc</th>
              <th className="p-4 w-[140px]">Cấp độ</th>
              <th className="p-4 w-[180px]">Danh mục</th>
              <th className="p-4 w-[160px]">Ngày tạo</th>
              <th className="p-4 w-[100px] text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {passages.map((p) => {
              const isOwner = p.user_id === currentUserId
              const canModify = isOwner || isAdmin
              const isDeleting = isDeletingId === p.id

              return (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="p-4 font-medium">
                    <Link
                      to={`/admin/reading/${p.id}`}
                      className="text-primary hover:underline font-semibold block truncate max-w-[400px]"
                    >
                      {p.title}
                    </Link>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className={getLevelColorClass(p.level)}>
                      {getLevelLabel(p.level)}
                    </Badge>
                  </td>
                  <td className="p-4 text-muted-foreground">{getCategoryLabel(p.category)}</td>
                  <td className="p-4 text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      {canModify && (
                        <>
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
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
