/**
 * Audio table with checkbox selection, level/category badges, and per-row actions.
 */
import * as React from "react"
import { Link } from "react-router-dom"
import { Eye, Loader2, Music, Pause, Pencil, Play, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge, badgeVariants } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CATEGORIES, LEVELS } from "./types"
import type { AudioListItem } from "./types"

const LEVEL_LABEL: Record<string, string> = Object.fromEntries(
  LEVELS.map((l) => [l.value, l.label]),
)
const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
)

const LEVEL_BADGE_CLASS: Record<string, string> = {
  beginner: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
  intermediate: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  advanced: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
}

const CATEGORY_BADGE_CLASS = "bg-secondary text-secondary-foreground"

export function AudioTable({
  tracks,
  isLoading,
  playingId,
  onTogglePlay,
  selectedIds,
  onSelectionChange,
  onEdit,
  onDelete,
  isDeletingId,
  currentUserId,
  isAdmin,
}: {
  tracks: AudioListItem[]
  isLoading: boolean
  playingId: string | null
  onTogglePlay: (track: AudioListItem) => void
  selectedIds: Set<string>
  onSelectionChange: (next: Set<string>) => void
  onEdit: (track: AudioListItem) => void
  onDelete: (track: AudioListItem) => void
  isDeletingId: string | null
  currentUserId?: string
  isAdmin: boolean
}) {
  const allSelected = tracks.length > 0 && tracks.every((t) => selectedIds.has(t.id))
  const someSelected = tracks.some((t) => selectedIds.has(t.id))

  const headerCheckboxRef = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = !allSelected && someSelected
    }
  }, [allSelected, someSelected])

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(tracks.map((t) => t.id)))
    }
  }

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectionChange(next)
  }

  const canModify = (t: AudioListItem) => isAdmin || t.user_id === currentUserId

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/50 text-muted-foreground text-sm font-medium">
            <tr>
              <th className="w-10 p-4">
                <input
                  type="checkbox"
                  aria-label="Chọn tất cả"
                  checked={allSelected}
                  ref={headerCheckboxRef}
                  onChange={toggleAll}
                  className="h-4 w-4 cursor-pointer accent-primary"
                />
              </th>
              <th className="p-4 text-left font-medium text-muted-foreground">
                Bài nghe
              </th>
              <th className="hidden md:table-cell p-4 text-left font-medium text-muted-foreground">
                Level
              </th>
              <th className="hidden lg:table-cell p-4 text-left font-medium text-muted-foreground">
                Danh mục
              </th>
              <th className="hidden lg:table-cell p-4 text-left font-medium text-muted-foreground">
                Ngày tải
              </th>
              <th className="w-32 p-4 text-right font-medium text-muted-foreground">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {isLoading && tracks.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={`sk-${i}`}>
                  <td colSpan={6} className="p-4">
                    <div className="h-10 bg-muted/40 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : tracks.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center py-12 text-muted-foreground">
                  <Music className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="font-medium">Không có bài nghe nào</p>
                  <p className="text-xs mt-1">
                    Thử thay đổi bộ lọc hoặc tải lên một bài nghe mới.
                  </p>
                </td>
              </tr>
            ) : (
              tracks.map((track) => {
                const isSelected = selectedIds.has(track.id)
                const modifiable = canModify(track)
                return (
                  <tr
                    key={track.id}
                    className={cn(
                      "hover:bg-muted/30 transition-colors",
                      isSelected && "bg-primary/5",
                    )}
                  >
                    <td className="p-4 align-middle">
                      <input
                        type="checkbox"
                        aria-label={`Chọn ${track.title}`}
                        checked={isSelected}
                        onChange={() => toggleOne(track.id)}
                        className="h-4 w-4 cursor-pointer accent-primary"
                      />
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <Music className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate" title={track.title}>
                            {track.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate" title={track.filename}>
                            {track.filename}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell p-4 align-middle">
                      {track.level ? (
                        <Badge
                          className={cn(
                            badgeVariants({ variant: "outline" }),
                            LEVEL_BADGE_CLASS[track.level] ?? "",
                          )}
                        >
                          {LEVEL_LABEL[track.level] ?? track.level}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="hidden lg:table-cell p-4 align-middle">
                      {track.category ? (
                        <Badge
                          className={cn(
                            badgeVariants({ variant: "outline" }),
                            CATEGORY_BADGE_CLASS,
                          )}
                        >
                          {CATEGORY_LABEL[track.category] ?? track.category}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="hidden lg:table-cell p-4 text-xs text-muted-foreground whitespace-nowrap align-middle">
                      {new Date(track.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/admin/audio/${track.id}`}
                          title="Mở trang chi tiết"
                          aria-label="Mở trang chi tiết"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onTogglePlay(track)}
                          title={playingId === track.id ? "Tạm dừng" : "Nghe thử"}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          {playingId === track.id ? (
                            <Pause className="h-4 w-4 text-emerald-500 fill-emerald-500" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        {modifiable && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(track)}
                            title="Chỉnh sửa"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {modifiable && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(track)}
                            title="Xoá bài nghe"
                            disabled={isDeletingId === track.id}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            {isDeletingId === track.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}