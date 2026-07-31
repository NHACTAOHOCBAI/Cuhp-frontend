/**
 * Audio management page container.
 * - Coordinates upload form, filters, table, pagination, edit dialog.
 * - Holds selection state and drives bulk delete.
 */
import * as React from "react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { useConfirm } from "@/components/ConfirmDialog"
import { AudioUploadForm } from "./AudioUploadForm"
import { AudioFilters, type FilterValue } from "./AudioFilters"
import { AudioTable } from "./AudioTable"
import { AudioEditDialog } from "./AudioEditDialog"
import { Pagination } from "./Pagination"
import {
  useAudioPlayer,
  useAudiosQuery,
  useBulkDeleteAudio,
  useDeleteAudio,
} from "./hooks"
import type { AudioListItem } from "./types"

const PAGE_SIZE = 20

export function AudioPage() {
  const { user } = useAuth()
  const confirm = useConfirm()
  const player = useAudioPlayer()

  // Filter + page state (URL-synced would be a future enhancement)
  const [filters, setFilters] = React.useState<FilterValue>({
    q: "",
    level: "",
    category: "",
  })
  const [page, setPage] = React.useState(1)

  // Reset to page 1 when filters change
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

  const { data, isLoading } = useAudiosQuery(queryParams)
  const items = data?.items ?? []
  const total = data?.total ?? 0

  // Selection state
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  // Drop selection that no longer matches the visible page
  React.useEffect(() => {
    if (selectedIds.size === 0) return
    const visible = new Set(items.map((t) => t.id))
    const next = new Set(Array.from(selectedIds).filter((id) => visible.has(id)))
    if (next.size !== selectedIds.size) setSelectedIds(next)
  }, [items, selectedIds])

  // Edit dialog state
  const [editing, setEditing] = React.useState<AudioListItem | null>(null)

  // Delete mutations
  const deleteOne = useDeleteAudio()
  const deleteBulk = useBulkDeleteAudio()
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const currentUserId = user?.id
  const isAdmin = user?.role === "admin"

  const handleDelete = async (track: AudioListItem) => {
    const ok = await confirm({
      title: "Xoá bài nghe này?",
      description:
        "Hành động này sẽ xoá vĩnh viễn tệp âm thanh khỏi máy chủ Cloudflare R2 và bản ghi trong cơ sở dữ liệu. Bạn không thể hoàn tác.",
      confirmText: "Xoá vĩnh viễn",
      cancelText: "Huỷ bỏ",
      variant: "destructive",
    })
    if (!ok) return

    if (player.playingId === track.id) {
      player.toggle(track) // pause
    }

    setDeletingId(track.id)
    try {
      await deleteOne.mutateAsync(track.id)
      toast.success("Đã xoá bài nghe thành công.")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể xoá bài nghe."
      toast.error(msg)
    } finally {
      setDeletingId(null)
    }
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    const ok = await confirm({
      title: `Xoá ${ids.length} bài nghe đã chọn?`,
      description:
        "Tất cả các tệp âm thanh trong danh sách chọn sẽ bị xoá khỏi Cloudflare R2 và cơ sở dữ liệu. Không thể hoàn tác.",
      confirmText: `Xoá ${ids.length} mục`,
      cancelText: "Huỷ bỏ",
      variant: "destructive",
    })
    if (!ok) return

    try {
      const result = await deleteBulk.mutateAsync(ids)
      if (result.failed.length > 0) {
        toast.warning(
          `Đã xoá ${result.deleted} mục, ${result.failed.length} mục thất bại (có thể do không có quyền).`,
        )
      } else {
        toast.success(`Đã xoá ${result.deleted} bài nghe.`)
      }
      setSelectedIds(new Set())
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Xoá hàng loạt thất bại."
      toast.error(msg)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Quản lý bài nghe tiếng Anh</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tải file âm thanh lên hệ thống Cloudflare R2 để đồng bộ trực tiếp với ứng dụng di động Android.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List (left, takes most of the width) */}
        <div className="lg:col-span-8 order-1 space-y-4">
          <AudioFilters
            value={filters}
            onChange={setFilters}
            selectedCount={selectedIds.size}
            onBulkDelete={handleBulkDelete}
            onClearSelection={() => setSelectedIds(new Set())}
            isBulkDeleting={deleteBulk.isPending}
          />

          <AudioTable
            tracks={items}
            isLoading={isLoading}
            playingId={player.playingId}
            onTogglePlay={player.toggle}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onEdit={(t) => setEditing(t)}
            onDelete={handleDelete}
            isDeletingId={deletingId}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
          />

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </div>

        {/* Upload form (right) */}
        <div className="lg:col-span-4 order-2">
          <AudioUploadForm />
        </div>
      </div>

      <AudioEditDialog
        trackId={editing?.id ?? null}
        open={!!editing}
        onOpenChange={(v) => {
          if (!v) setEditing(null)
        }}
      />
    </div>
  )
}