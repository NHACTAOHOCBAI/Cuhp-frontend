/**
 * Upload form for new audio tracks.
 * - True drag-and-drop zone (not just CSS)
 * - XHR-based upload to surface real progress
 * - Validates title and file client-side before submit
 */
import * as React from "react"
import { Loader2, Music, UploadCloud, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useUploadAudio } from "./hooks"
import { CATEGORIES, LEVELS, MAX_TRANSCRIPT_LENGTH } from "./types"
import type { UploadProgress } from "./types"

const MAX_FILE_SIZE_MB = 100
const ACCEPT_MIME = "audio/*"
const ACCEPT_EXTS = ".mp3,.wav,.m4a,.aac,.ogg"

function isAudioFile(file: File): boolean {
  if (file.type.startsWith("audio/")) return true
  const lower = file.name.toLowerCase()
  return ACCEPT_EXTS.split(",").some((ext) => lower.endsWith(ext))
}

export function AudioUploadForm() {
  const upload = useUploadAudio()

  const [title, setTitle] = React.useState("")
  const [level, setLevel] = React.useState<string>("")
  const [category, setCategory] = React.useState<string>("")
  const [transcript, setTranscript] = React.useState("")
  const [file, setFile] = React.useState<File | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [progress, setProgress] = React.useState<UploadProgress | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const reset = () => {
    setTitle("")
    setLevel("")
    setCategory("")
    setTranscript("")
    setFile(null)
    setProgress(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const f = files[0]
    if (!isAudioFile(f)) {
      toast.error("Định dạng không hỗ trợ. Chỉ chấp nhận file âm thanh (mp3, wav, m4a, aac, ogg).")
      return
    }
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File quá lớn. Giới hạn tối đa ${MAX_FILE_SIZE_MB} MB.`)
      return
    }
    setFile(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error("Vui lòng chọn một file âm thanh.")
      return
    }
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề cho bài nghe.")
      return
    }

    const formData = new FormData()
    formData.append("title", title.trim())
    formData.append("file", file)
    if (level) formData.append("level", level)
    if (category) formData.append("category", category)
    if (transcript.trim()) formData.append("transcript", transcript.trim())

    try {
      await upload.mutateAsync({
        formData,
        onProgress: setProgress,
      })
      toast.success("Tải bài nghe lên Cloudflare R2 thành công!")
      reset()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Tải lên thất bại. Vui lòng thử lại."
      toast.error(msg)
      setProgress(null)
    }
  }

  const isUploading = upload.isPending
  const pct = progress?.pct ?? 0

  return (
    <Card className="h-fit shadow-none rounded-md">
      <CardHeader>
        <CardTitle className="text-lg">Tải bài nghe mới lên</CardTitle>
        <CardDescription>
          Kéo thả file âm thanh hoặc nhấp để chọn. Hỗ trợ MP3, WAV, M4A, AAC, OGG (tối đa {MAX_FILE_SIZE_MB} MB).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="audio-title" className="text-sm font-medium">
              Tiêu đề bài nghe <span className="text-destructive">*</span>
            </label>
            <Input
              id="audio-title"
              placeholder="Ví dụ: Listening Unit 1 - Introduction"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              disabled={isUploading}
              className="shadow-none"
              required
            />
          </div>

          {/* Level + Category */}
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
                className="[&_button]:shadow-none"
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
                className="[&_button]:shadow-none"
                ariaLabel="Chọn danh mục"
              />
            </div>
          </div>

          {/* Transcript */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="audio-transcript" className="text-sm font-medium">
                Script / Transcript <span className="text-xs text-muted-foreground">(tuỳ chọn)</span>
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
              id="audio-transcript"
              placeholder="Dán toàn bộ lời thoại của bài nghe vào đây..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              disabled={isUploading}
              maxLength={MAX_TRANSCRIPT_LENGTH}
              rows={6}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* File dropzone */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Tập tin âm thanh <span className="text-destructive">*</span>
            </label>
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
              onDragEnter={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsDragging(true)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsDragging(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsDragging(false)
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsDragging(false)
                handleFiles(e.dataTransfer.files)
              }}
              className={cn(
                "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50",
                isUploading && "pointer-events-none opacity-60",
              )}
            >
              <Input
                ref={fileInputRef}
                id="audio-file-input"
                type="file"
                accept={`${ACCEPT_MIME},${ACCEPT_EXTS}`}
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
                disabled={isUploading}
              />
              {file ? (
                <div className="flex items-center gap-3 w-full">
                  <Music className="h-8 w-8 text-primary shrink-0" />
                  <div className="min-w-0 flex-1 text-left">
                    <p className="font-semibold text-sm truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  {!isUploading && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                        if (fileInputRef.current) fileInputRef.current.value = ""
                      }}
                      className="h-8 w-8 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    {isDragging ? "Thả file vào đây..." : "Kéo thả file hoặc nhấp để chọn"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    MP3, WAV, M4A, AAC, OGG • tối đa {MAX_FILE_SIZE_MB} MB
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {isUploading && (
            <div className="space-y-1" aria-live="polite">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Đang upload lên R2...</span>
                <span>{pct}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-200"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang upload {pct > 0 ? `(${pct}%)` : ""}...
              </>
            ) : (
              <>Tải lên ngay</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}