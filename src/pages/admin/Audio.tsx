import * as React from "react"
import { Headphones, UploadCloud, Play, Pause, Trash2, Loader2, Music } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { useConfirm } from "@/components/ConfirmDialog"

interface AudioTrack {
  id: string
  title: string
  filename: string
  url: string
  r2_key: string
  user_id: string
  created_at: string
}

export default function AudioPage() {
  const { token } = useAuth()
  const confirm = useConfirm()
  const [tracks, setTracks] = React.useState<AudioTrack[]>([])
  const [loading, setLoading] = React.useState(true)
  
  // Upload States
  const [title, setTitle] = React.useState("")
  const [file, setFile] = React.useState<File | null>(null)
  const [uploading, setUploading] = React.useState(false)
  
  // Audio Player Preview States
  const [playingId, setPlayingId] = React.useState<string | null>(null)
  const [audioElement, setAudioElement] = React.useState<HTMLAudioElement | null>(null)

  // Fetch all audio tracks
  const fetchTracks = React.useCallback(() => {
    if (!token) return
    setLoading(true)
    apiFetch<AudioTrack[]>("/audio", { token })
      .then((data) => {
        setTracks(data)
      })
      .catch((err) => {
        console.error(err)
        toast.error("Không thể tải danh sách bài nghe.")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [token])

  React.useEffect(() => {
    fetchTracks()
    return () => {
      if (audioElement) {
        audioElement.pause()
      }
    }
  }, [fetchTracks])

  // Handle Playback Preview
  const handleTogglePlay = (track: AudioTrack) => {
    if (playingId === track.id) {
      // Pause
      audioElement?.pause()
      setPlayingId(null)
    } else {
      // Stop current
      if (audioElement) {
        audioElement.pause()
      }
      
      const newAudio = new Audio(track.url)
      newAudio.play()
        .then(() => {
          setPlayingId(track.id)
          setAudioElement(newAudio)
        })
        .catch((err) => {
          console.error(err)
          toast.error("Không thể phát thử âm thanh này.")
        })

      newAudio.onended = () => {
        setPlayingId(null)
      }
    }
  }

  // Handle Upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error("Vui lòng chọn một file âm thanh.")
      return
    }
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề cho bài nghe.")
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("title", title)
    formData.append("file", file)

    try {
      await apiFetch<AudioTrack>("/audio/upload", {
        method: "POST",
        body: formData,
        token,
      })
      toast.success("Tải bài nghe lên Cloudflare R2 thành công!")
      setTitle("")
      setFile(null)
      // Reset input file element
      const fileInput = document.getElementById("audio-file-input") as HTMLInputElement
      if (fileInput) fileInput.value = ""
      fetchTracks()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Tải lên thất bại. Vui lòng thử lại.")
    } finally {
      setUploading(false)
    }
  }

  // Handle Delete
  const handleDelete = async (trackId: string) => {
    const isConfirmed = await confirm({
      title: "Xóa bài nghe này?",
      description: "Hành động này sẽ xóa vĩnh viễn tệp âm thanh này khỏi máy chủ Cloudflare R2 và bản ghi trong cơ sở dữ liệu. Bạn không thể hoàn tác hành động này.",
      confirmText: "Xóa vĩnh viễn",
      cancelText: "Hủy bỏ",
      variant: "destructive"
    })
    
    if (!isConfirmed) return
    
    // Stop playback if deleting playing track
    if (playingId === trackId) {
      audioElement?.pause()
      setPlayingId(null)
    }

    try {
      await apiFetch(`/audio/${trackId}`, {
        method: "DELETE",
        token,
      })
      toast.success("Đã xóa bài nghe thành công.")
      fetchTracks()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Không thể xóa bài nghe này.")
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Quản lý bài nghe tiếng Anh</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tải file âm thanh lên hệ thống Cloudflare R2 để đồng bộ trực tiếp với ứng dụng di động Android.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Upload Form Card */}
        <div className="md:col-span-4">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Tải bài nghe mới lên</CardTitle>
              <CardDescription>Chọn file audio (.mp3, .wav, .m4a) từ máy của bạn.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">Tiêu đề bài nghe</label>
                  <Input
                    id="title"
                    placeholder="Ví dụ: Listening Unit 1 - Introduction"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={uploading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tập tin âm thanh</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors relative">
                    <Input
                      id="audio-file-input"
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      disabled={uploading}
                      required
                    />
                    <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                    {file ? (
                      <div className="text-sm">
                        <p className="font-semibold text-primary truncate max-w-[200px]">{file.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        <p className="font-medium text-foreground">Nhấp để chọn file</p>
                        <p className="mt-1">Hỗ trợ MP3, WAV, M4A, AAC</p>
                      </div>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang upload lên R2...
                    </>
                  ) : (
                    <>Tải lên ngay</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Audio List Card */}
        <div className="md:col-span-8">
          <Card className="min-h-[400px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Danh sách bài nghe ({tracks.length})</CardTitle>
                <CardDescription>Các bài học đã được tải lên và sẵn sàng phát trên Android.</CardDescription>
              </div>
              {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              {loading && tracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Loader2 className="h-10 w-10 animate-spin mb-4" />
                  <p>Đang tải danh sách...</p>
                </div>
              ) : tracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed rounded-lg border-border">
                  <Headphones className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="font-medium">Chưa có bài nghe nào</p>
                  <p className="text-xs text-muted-foreground mt-1">Hãy bắt đầu bằng cách tải một file lên ở bảng bên trái.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {tracks.map((track) => (
                    <div key={track.id} className="py-3 flex items-center justify-between gap-4 group">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Music className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-sm truncate">{track.title}</h4>
                          <p className="text-xs text-muted-foreground truncate">{track.filename}</p>
                          <span className="text-[10px] text-muted-foreground/80 mt-1 block">
                            Tải lên ngày: {new Date(track.created_at).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Play/Pause preview */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTogglePlay(track)}
                          title={playingId === track.id ? "Tạm dừng" : "Nghe thử"}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                        >
                          {playingId === track.id ? (
                            <Pause className="h-4 w-4 text-emerald-500 fill-emerald-500" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>

                        {/* Delete track */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(track.id)}
                          title="Xóa bài nghe"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
