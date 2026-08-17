import * as React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/admin/PageHeader"
import { useAuth } from "@/hooks/useAuth"
import { useConfirm } from "@/components/ConfirmDialog"
import { toast } from "sonner"

import {
  useBulkDeleteVocabulary,
  useDeleteVocabulary,
  useVocabulariesQuery,
} from "./hooks"
import { VocabularyFilters } from "./VocabularyFilters"
import type { FilterValue } from "./VocabularyFilters"
import { VocabularyTable } from "./VocabularyTable"
import { VocabularyEditDialog } from "./VocabularyEditDialog"
import { Pagination } from "./Pagination"
import type { VocabularyItem } from "@/types"

export function VocabularyPage() {
  const { user } = useAuth()
  const confirm = useConfirm()

  // Pagination & Filtering state
  const [page, setPage] = React.useState(1)
  const [filters, setFilters] = React.useState<FilterValue>({
    q: "",
    word_type: "",
  })

  // Selected checkboxes
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingVocabId, setEditingVocabId] = React.useState<string | null>(null)

  // Query vocabulary list
  const pageSize = 15
  const { data, isLoading } = useVocabulariesQuery({
    page,
    page_size: pageSize,
    q: filters.q || undefined,
    word_type: filters.word_type || undefined,
  })

  // Mutations
  const deleteMut = useDeleteVocabulary()
  const bulkDeleteMut = useBulkDeleteVocabulary()

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1)
    setSelectedIds(new Set())
  }, [filters])

  // Reset selection when data changes (e.g., page change)
  React.useEffect(() => {
    setSelectedIds(new Set())
  }, [data])

  // Handle Edit Action
  const handleEdit = (vocab: VocabularyItem) => {
    setEditingVocabId(vocab.id)
    setDialogOpen(true)
  }

  // Handle Create Action
  const handleCreate = () => {
    setEditingVocabId(null)
    setDialogOpen(true)
  }

  // Handle Delete Action
  const handleDelete = async (vocab: VocabularyItem) => {
    const ok = await confirm({
      title: "Xác nhận xóa từ vựng",
      description: `Bạn có chắc chắn muốn xóa từ vựng "${vocab.word}" khỏi hệ thống? Hành động này không thể hoàn tác.`,
      confirmText: "Xóa",
      cancelText: "Hủy",
      variant: "destructive",
    })
    if (!ok) return

    try {
      await deleteMut.mutateAsync(vocab.id)
      toast.success(`Đã xóa từ vựng "${vocab.word}" thành công.`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Xóa từ vựng thất bại."
      toast.error(msg)
    }
  }

  // Handle Bulk Delete
  const handleBulkDelete = async () => {
    const count = selectedIds.size
    const ok = await confirm({
      title: `Xác nhận xóa ${count} từ vựng`,
      description: `Bạn có chắc chắn muốn xóa ${count} từ vựng đã chọn? Hành động này sẽ xóa vĩnh viễn các mục này.`,
      confirmText: "Xóa tất cả",
      cancelText: "Hủy",
      variant: "destructive",
    })
    if (!ok) return

    try {
      const result = await bulkDeleteMut.mutateAsync(Array.from(selectedIds))
      if (result.failed.length > 0) {
        toast.warning(
          `Đã xóa ${result.deleted} mục. Thất bại ${result.failed.length} mục (có thể do không có quyền).`
        )
      } else {
        toast.success(`Đã xóa thành công ${result.deleted} từ vựng.`)
      }
      setSelectedIds(new Set())
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Xóa hàng loạt thất bại."
      toast.error(msg)
    }
  }

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const isAdmin = user?.role === "admin"

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-background p-6 overflow-y-auto animate-in fade-in-0 duration-150">
      <div className="w-full space-y-6">
        {/* Title & Actions Row */}
        <PageHeader
          title="Quản lý từ vựng"
          description="Lưu trữ, tra cứu và chuẩn bị danh mục từ vựng học tập cho hệ thống."
        >
          <Button onClick={handleCreate} className="gap-1.5 cursor-pointer shrink-0">
            <Plus className="h-4 w-4" /> Thêm từ mới
          </Button>
        </PageHeader>

        {/* Filters */}
        <VocabularyFilters
          value={filters}
          onChange={setFilters}
          selectedCount={selectedIds.size}
          onBulkDelete={handleBulkDelete}
          onClearSelection={() => setSelectedIds(new Set())}
          isBulkDeleting={bulkDeleteMut.isPending}
        />

        {/* Table */}
        <VocabularyTable
          vocabularies={items}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isDeletingId={deleteMut.isPending ? deleteMut.variables : null}
          currentUserId={user?.id}
          isAdmin={isAdmin}
        />

        {/* Pagination */}
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
        />
      </div>

      {/* Edit/Create Dialog */}
      <VocabularyEditDialog
        vocabId={editingVocabId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
