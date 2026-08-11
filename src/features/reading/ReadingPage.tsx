import * as React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useConfirm } from "@/components/ConfirmDialog"
import { toast } from "sonner"

import { useReadingPassagesQuery, useDeleteReadingPassage } from "./hooks"
import { ReadingFilters, type FilterValue } from "./ReadingFilters"
import { ReadingTable } from "./ReadingTable"
import { ReadingEditDialog } from "./ReadingEditDialog"
import { Pagination } from "../vocabulary/Pagination" // Reusing existing Pagination component
import type { ReadingPassageListItem } from "./types"

const PAGE_SIZE = 15

export function ReadingPage() {
  const { user } = useAuth()
  const confirm = useConfirm()

  const [page, setPage] = React.useState(1)
  const [filters, setFilters] = React.useState<FilterValue>({
    q: "",
    level: "",
    category: "",
  })

  // Dialog states
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingPassageId, setEditingPassageId] = React.useState<string | null>(null)

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1)
  }, [filters])

  const queryParams = React.useMemo(
    () => ({
      page,
      page_size: PAGE_SIZE,
      q: filters.q || undefined,
      level: filters.level || undefined,
      category: filters.category || undefined,
    }),
    [page, filters],
  )

  const { data, isLoading } = useReadingPassagesQuery(queryParams)
  const items = data?.items ?? []
  const total = data?.total ?? 0

  const deleteMut = useDeleteReadingPassage()
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const handleCreate = () => {
    setEditingPassageId(null)
    setDialogOpen(true)
  }

  const handleEdit = (item: ReadingPassageListItem) => {
    setEditingPassageId(item.id)
    setDialogOpen(true)
  }

  const handleDelete = async (item: ReadingPassageListItem) => {
    const ok = await confirm({
      title: "Xác nhận xóa bài đọc",
      description: `Bạn có chắc chắn muốn xóa bài đọc "${item.title}"? Hành động này sẽ xóa vĩnh viễn tất cả bản dịch và bình luận đi kèm.`,
      confirmText: "Xóa bài đọc",
      cancelText: "Hủy",
      variant: "destructive",
    })
    if (!ok) return

    setDeletingId(item.id)
    try {
      await deleteMut.mutateAsync(item.id)
      toast.success(`Đã xóa bài đọc "${item.title}" thành công.`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Xóa bài đọc thất bại."
      toast.error(msg)
    } finally {
      setDeletingId(null)
    }
  }

  const isAdmin = user?.role === "admin"
  const currentUserId = user?.id

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-background p-6 overflow-y-auto animate-in fade-in-0 duration-150">
      <div className="w-full space-y-6">
        {/* Title & Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Luyện dịch & Bài đọc</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Đọc các bài văn tiếng Anh, luyện tập dịch sang tiếng Việt và học nhanh từ mới bằng cách bôi đen văn bản.
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-1.5 cursor-pointer self-start sm:self-auto shrink-0">
            <Plus className="h-4 w-4" /> Tạo bài đọc mới
          </Button>
        </div>

        {/* Filters */}
        <ReadingFilters value={filters} onChange={setFilters} />

        {/* Table list */}
        <ReadingTable
          passages={items}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isDeletingId={deletingId}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />

        {/* Pagination */}
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
        />
      </div>

      {/* Create/Edit Dialog */}
      <ReadingEditDialog
        passageId={editingPassageId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
