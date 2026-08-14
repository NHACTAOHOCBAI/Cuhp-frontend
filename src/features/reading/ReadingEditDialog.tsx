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
import { useCreateReadingPassage, useUpdateReadingPassage, useReadingPassageById } from "./hooks"
import { READING_LEVELS, READING_CATEGORIES } from "./types"
import { toast } from "sonner"

export function ReadingEditDialog({
  passageId,
  open,
  onOpenChange,
}: {
  passageId: string | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const isEdit = !!passageId
  const { data: passage, isLoading } = useReadingPassageById(passageId ?? undefined)

  const createMut = useCreateReadingPassage()
  const updateMut = useUpdateReadingPassage()

  const [title, setTitle] = React.useState("")
  const [content, setContent] = React.useState("")
  const [level, setLevel] = React.useState("")
  const [category, setCategory] = React.useState("")

  // Sync state when editing
  React.useEffect(() => {
    if (!open) return
    if (!isEdit || !passage) {
      setTitle("")
      setContent("")
      setLevel("")
      setCategory("")
      return
    }
    setTitle(passage.title)
    setContent(passage.content)
    setLevel(passage.level ?? "")
    setCategory(passage.category ?? "")
  }, [passage, isEdit, open])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Tiêu đề không được để trống.")
      return
    }
    if (!content.trim()) {
      toast.error("Nội dung bài đọc không được để trống.")
      return
    }

    const payload = {
      title: title.trim(),
      content: content.trim(),
      level: level || null,
      category: category || null,
    }

    try {
      if (isEdit && passageId) {
        await updateMut.mutateAsync({
          id: passageId,
          payload,
        })
        toast.success("Đã cập nhật bài đọc thành công.")
      } else {
        await createMut.mutateAsync(payload)
        toast.success("Đã thêm bài đọc mới thành công.")
      }
      onOpenChange(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Thao tác thất bại."
      toast.error(msg)
    }
  }

  const isPending = createMut.isPending || updateMut.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Chỉnh sửa bài đọc" : "Thêm bài đọc mới"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cập nhật tiêu đề, nội dung và các phân loại của bài đọc này."
              : "Điền tiêu đề và nội dung bài học để bắt đầu luyện tập dịch."}
          </DialogDescription>
        </DialogHeader>

        {isEdit && isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="passage-title" className="text-sm font-medium">
                Tiêu đề <span className="text-destructive">*</span>
              </label>
              <Input
                id="passage-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: The History of the Internet"
                maxLength={200}
                className="shadow-none"
                required
              />
            </div>

            {/* Level and Category selects side-by-side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cấp độ</label>
                <Select
                  value={level}
                  onChange={setLevel}
                  placeholder="-- Chọn cấp độ --"
                  options={[
                    { value: "", label: "Không chọn" },
                    ...READING_LEVELS.map((w) => ({ value: w.value, label: w.label })),
                  ]}
                  className="[&_button]:shadow-none"
                  ariaLabel="Chọn cấp độ bài đọc"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Danh mục</label>
                <Select
                  value={category}
                  onChange={setCategory}
                  placeholder="-- Chọn danh mục --"
                  options={[
                    { value: "", label: "Không chọn" },
                    ...READING_CATEGORIES.map((w) => ({ value: w.value, label: w.label })),
                  ]}
                  className="[&_button]:shadow-none"
                  ariaLabel="Chọn danh mục bài đọc"
                />
              </div>
            </div>

            {/* Content Textarea */}
            <div className="space-y-2">
              <label htmlFor="passage-content" className="text-sm font-medium">
                Nội dung bài đọc gốc (Tiếng Anh...) <span className="text-destructive">*</span>
              </label>
              <textarea
                id="passage-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nhập nội dung văn bản gốc ở đây..."
                required
                rows={12}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-sans leading-relaxed resize-y"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Huỷ
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : isEdit ? (
                  "Lưu thay đổi"
                ) : (
                  "Thêm mới"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
