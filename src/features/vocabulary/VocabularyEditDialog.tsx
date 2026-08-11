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
import { useCreateVocabulary, useUpdateVocabulary, useVocabularyById } from "./hooks"
import { WORD_TYPES } from "./types"
import { toast } from "sonner"

export function VocabularyEditDialog({
  vocabId,
  open,
  onOpenChange,
  defaultWord = "",
}: {
  vocabId: string | null
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultWord?: string
}) {
  const isEdit = !!vocabId
  const { data: vocab, isLoading } = useVocabularyById(vocabId ?? undefined)

  const createMut = useCreateVocabulary()
  const updateMut = useUpdateVocabulary()

  const [word, setWord] = React.useState("")
  const [pronunciation, setPronunciation] = React.useState("")
  const [meaning, setMeaning] = React.useState("")
  const [wordType, setWordType] = React.useState("")
  const [notes, setNotes] = React.useState("")

  // Sync state when editing an existing item
  React.useEffect(() => {
    if (!open) return
    if (!isEdit || !vocab) {
      setWord(defaultWord)
      setPronunciation("")
      setMeaning("")
      setWordType("")
      setNotes("")
      return
    }
    setWord(vocab.word)
    setPronunciation(vocab.pronunciation ?? "")
    setMeaning(vocab.meaning)
    setWordType(vocab.word_type ?? "")
    setNotes(vocab.notes ?? "")
  }, [vocab, isEdit, open])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!word.trim()) {
      toast.error("Từ vựng không được để trống.")
      return
    }
    if (!meaning.trim()) {
      toast.error("Nghĩa của từ không được để trống.")
      return
    }

    const payload = {
      word: word.trim(),
      pronunciation: pronunciation.trim() || null,
      meaning: meaning.trim(),
      word_type: wordType || null,
      notes: notes.trim() || null,
    }

    try {
      if (isEdit && vocabId) {
        await updateMut.mutateAsync({
          id: vocabId,
          payload,
        })
        toast.success("Đã cập nhật từ vựng thành công.")
      } else {
        await createMut.mutateAsync(payload)
        toast.success("Đã thêm từ vựng mới thành công.")
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Chỉnh sửa từ vựng" : "Thêm từ vựng mới"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cập nhật các thông tin của từ vựng này."
              : "Điền các thông tin để lưu trữ một từ vựng mới."}
          </DialogDescription>
        </DialogHeader>

        {isEdit && isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Word */}
            <div className="space-y-2">
              <label htmlFor="vocab-word" className="text-sm font-medium">
                Từ vựng <span className="text-destructive">*</span>
              </label>
              <Input
                id="vocab-word"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Ví dụ: Apple, Benevolent"
                maxLength={100}
                required
              />
            </div>

            {/* Pronunciation */}
            <div className="space-y-2">
              <label htmlFor="vocab-pronunciation" className="text-sm font-medium">
                Phiên âm
              </label>
              <Input
                id="vocab-pronunciation"
                value={pronunciation}
                onChange={(e) => setPronunciation(e.target.value)}
                placeholder="Ví dụ: /ˈæp.əl/"
                maxLength={100}
              />
            </div>

            {/* Meaning */}
            <div className="space-y-2">
              <label htmlFor="vocab-meaning" className="text-sm font-medium">
                Ý nghĩa <span className="text-destructive">*</span>
              </label>
              <Input
                id="vocab-meaning"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                placeholder="Nghĩa tiếng Việt của từ vựng"
                maxLength={500}
                required
              />
            </div>

            {/* Word Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Loại từ</label>
              <Select
                value={wordType}
                onChange={setWordType}
                options={[
                  { value: "", label: "-- Chọn loại từ --" },
                  ...WORD_TYPES.map((w) => ({ value: w.value, label: w.label })),
                ]}
                ariaLabel="Chọn loại từ"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label htmlFor="vocab-notes" className="text-sm font-medium">
                Ghi chú thêm
              </label>
              <textarea
                id="vocab-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Từ đồng nghĩa, trái nghĩa, cách dùng..."
                maxLength={2000}
                rows={4}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
