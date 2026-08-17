import { Link } from "react-router-dom"
import { Edit2, Trash2, Calendar, ArrowRight, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LEVELS, CATEGORIES } from "./types"
import type { AudioListItem } from "./types"
import { cn } from "@/lib/utils"

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

export function AudioGrid({
  tracks,
  isLoading,
  playingId,
  onTogglePlay,
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
  onEdit: (track: AudioListItem) => void
  onDelete: (track: AudioListItem) => void
  isDeletingId: string | null
  currentUserId?: string
  isAdmin: boolean
}) {
  const canModify = (t: AudioListItem) => isAdmin || t.user_id === currentUserId

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

  if (tracks.length === 0) {
    return (
      <div className="w-full bg-card rounded-md border border-border p-10 text-center shadow-none">
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-lg font-bold text-foreground">Chưa có bài nghe nào</h3>
          <p className="text-sm text-muted-foreground">
            Hãy tải lên bài nghe đầu tiên của bạn để bắt đầu ôn luyện.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tracks.map((track) => {
        const modifiable = canModify(track)
        const isDeleting = isDeletingId === track.id
        const isPlaying = playingId === track.id

        return (
          <div
            key={track.id}
            className="bg-card rounded-md border border-border p-4 flex flex-col justify-between hover:border-primary/40 hover:shadow-sm transition-all duration-200 group h-[170px] shadow-none"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div 
                    onClick={() => onTogglePlay(track)}
                    className={cn(
                      "h-9 w-9 rounded-md flex items-center justify-center shrink-0 cursor-pointer transition-colors",
                      isPlaying ? "bg-emerald-500/10" : "bg-primary/10 hover:bg-primary/20"
                    )}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4 text-emerald-500 fill-emerald-500 animate-pulse" />
                    ) : (
                      <Play className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link
                      to={`/admin/audio/${track.id}`}
                      className="font-bold text-foreground hover:text-primary hover:underline line-clamp-1 text-sm sm:text-base block"
                      title={track.title}
                    >
                      {track.title}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate" title={track.filename}>
                      {track.filename}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 items-center">
                {track.level && (
                  <Badge variant="outline" className={cn("text-[10px] py-0.5 shadow-none", LEVEL_BADGE_CLASS[track.level] ?? "")}>
                    {LEVEL_LABEL[track.level] ?? track.level}
                  </Badge>
                )}
                {track.category && (
                  <Badge variant="secondary" className="text-[10px] py-0.5 shadow-none">
                    {CATEGORY_LABEL[track.category] ?? track.category}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-2 select-none">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{new Date(track.created_at).toLocaleDateString("vi-VN")}</span>
              </div>

              <div className="flex items-center gap-1">
                <Link to={`/admin/audio/${track.id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-primary font-semibold hover:bg-primary/5 hover:text-primary flex items-center gap-1 cursor-pointer"
                  >
                    Chi tiết <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>

                {modifiable && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => onEdit(track)}
                      title="Sửa"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive cursor-pointer hover:bg-destructive/10"
                      onClick={() => onDelete(track)}
                      disabled={isDeleting}
                      title="Xóa"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
