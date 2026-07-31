/**
 * Modal dialog for editing audio metadata (title, level, category, transcript).
 * File URL cannot be changed — re-upload to replace audio.
 */
import * as React from "react"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useAudioById, useUpdateAudio } from "./hooks"
import { CATEGORIES, LEVELS, MAX_TRANSCRIPT_LENGTH } from "./types"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function AudioEditDialog({
  trackId,
  open,
  onOpenChange,
}: {
  trackId: string | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { data: track, isLoading } = useAudioById(trackId ?? undefined)
  const update = useUpdateAudio()

  const [title, setTitle] = React.useState("")
  const [level, setLevel] = React.useState("")
  const [category, setCategory] = React.useState("")
  const [transcript, setTranscript] = React.useState("")

  // Sync local state when target track changes
  React.useEffect(() => {
    if (!track) {
      setTitle("")
      setLevel("")
      setCategory("")
      setTranscript("")
      return
    }
    setTitle(track.title)
    setLevel(track.level ?? "")
    setCategory(track.category ?? "")
    setTranscript(track.transcript ?? "")
  }, [track])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!track) return
    if (!title.trim()) {
      toast.error("Tiêu đề không được để trống.")
      return
    }
    try {
      await update.mutateAsync({
        id: track.id,
        payload: {
          title: title.trim(),
          level: level || null,
          category: category || null,
          transcript: transcript.trim() || null,
        },
      })
      toast.success("Đã cập nhật bài nghe.")
      onOpenChange(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Cập nhật thất bại."
      toast.error(msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa bài nghe</DialogTitle>
          <DialogDescription>
            Cập nhật tiêu đề và metadata. Không thể thay file âm thanh — nếu cần, hãy xoá rồi tải lại.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="edit-title" className="text-sm font-medium">
              Tiêu đề <span className="text-destructive">*</span>
            </label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Level</label>
              <Select
                value={level}
                onChange={setLevel}
                options={[
                  { value: "", label: "-- Chọn --" },
                  ...LEVELS.map((l) => ({ value: l.value, label: l.label })),
                ]}
                ariaLabel="Chọn level"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Danh mục</label>
              <Select
                value={category}
                onChange={setCategory}
                options={[
                  { value: "", label: "-- Chọn --" },
                  ...CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
                ]}
                ariaLabel="Chọn danh mục"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="edit-transcript" className="text-sm font-medium">
                Script / Transcript
              </label>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  transcript.length > MAX_TRANSCRIPT_LENGTH * 0.9
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {transcript.length.toLocaleString("vi-VN")} / {MAX_TRANSCRIPT_LENGTH.toLocaleString("vi-VN")}
              </span>
            </div>
            <textarea
              id="edit-transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              maxLength={MAX_TRANSCRIPT_LENGTH}
              rows={6}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={update.isPending}
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}