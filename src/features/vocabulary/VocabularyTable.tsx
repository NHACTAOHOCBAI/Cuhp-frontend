import * as React from "react"
import { BookOpen, Loader2, Pencil, Trash2, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { WORD_TYPES } from "./types"
import type { VocabularyItem } from "@/types"
import { speakWord } from "@/lib/tts"

const WORD_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  WORD_TYPES.map((w) => [w.value, w.label.split(" (")[0]]),
)

const WORD_TYPE_BADGE_CLASS: Record<string, string> = {
  noun: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  verb: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  adjective: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  adverb: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
  pronoun: "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20",
  preposition: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
  conjunction: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
  interjection: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
}

const DEFAULT_BADGE_CLASS = "bg-secondary text-secondary-foreground"

export function VocabularyTable({
  vocabularies,
  isLoading,
  selectedIds,
  onSelectionChange,
  onEdit,
  onDelete,
  isDeletingId,
  currentUserId,
  isAdmin,
}: {
  vocabularies: VocabularyItem[]
  isLoading: boolean
  selectedIds: Set<string>
  onSelectionChange: (next: Set<string>) => void
  onEdit: (vocab: VocabularyItem) => void
  onDelete: (vocab: VocabularyItem) => void
  isDeletingId: string | null
  currentUserId?: string
  isAdmin: boolean
}) {
  const allSelected = vocabularies.length > 0 && vocabularies.every((v) => selectedIds.has(v.id))
  const someSelected = vocabularies.some((v) => selectedIds.has(v.id))

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
      onSelectionChange(new Set(vocabularies.map((v) => v.id)))
    }
  }

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectionChange(next)
  }

  const canModify = (v: VocabularyItem) => isAdmin || v.user_id === currentUserId

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden shadow-none">
      <div className="overflow-x-auto animate-in fade-in-0 duration-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-muted-foreground text-sm font-medium">
              <th className="w-10 p-4">
                <input
                  type="checkbox"
                  aria-label="Chọn tất cả"
                  checked={allSelected}
                  ref={headerCheckboxRef}
                  onChange={toggleAll}
                  className="h-4 w-4 cursor-pointer accent-primary rounded"
                />
              </th>
              <th className="p-4">Từ vựng / Phiên âm</th>
              <th className="p-4">Loại từ</th>
              <th className="p-4">Ý nghĩa</th>
              <th className="p-4">Hộp nhớ</th>
              <th className="p-4">Ôn tập tiếp theo</th>
              <th className="hidden md:table-cell p-4">Ngữ cảnh</th>
              <th className="hidden lg:table-cell p-4">Ghi chú</th>
              <th className="w-28 p-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {isLoading && vocabularies.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={`sk-${i}`} className="hover:bg-transparent">
                  <td colSpan={9} className="p-4">
                    <div className="h-10 bg-muted/40 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : vocabularies.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-4 text-center py-10 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-40 text-muted-foreground" />
                  <p className="font-semibold text-base">Không có từ vựng nào</p>
                  <p className="text-xs mt-1 text-muted-foreground">
                    Thử thay đổi bộ lọc hoặc thêm một từ vựng mới vào danh sách.
                  </p>
                </td>
              </tr>
            ) : (
              vocabularies.map((vocab) => {
                const isSelected = selectedIds.has(vocab.id)
                const modifiable = canModify(vocab)
                return (
                  <tr
                    key={vocab.id}
                    className={cn(
                      "hover:bg-secondary/10 transition-colors",
                      isSelected && "bg-primary/5",
                    )}
                  >
                    {/* Checkbox */}
                    <td className="p-4 align-middle">
                      <input
                        type="checkbox"
                        aria-label={`Chọn ${vocab.word}`}
                        checked={isSelected}
                        onChange={() => toggleOne(vocab.id)}
                        className="h-4 w-4 cursor-pointer accent-primary rounded"
                      />
                    </td>

                    {/* Word & Pronunciation */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground text-base tracking-tight">
                            {vocab.word}
                          </span>
                          {vocab.pronunciation && (
                            <span className="text-xs font-mono text-muted-foreground mt-0.5">
                              {vocab.pronunciation}
                            </span>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => speakWord(vocab.word)}
                          className="h-7 w-7 text-muted-foreground hover:text-primary rounded-full shrink-0 cursor-pointer"
                          title={`Nghe phát âm từ "${vocab.word}"`}
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>

                    {/* Word Type Badge */}
                    <td className="p-4 align-middle">
                      {vocab.word_type ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs px-2 py-0.5",
                            WORD_TYPE_BADGE_CLASS[vocab.word_type] || DEFAULT_BADGE_CLASS
                          )}
                        >
                          {WORD_TYPE_LABEL[vocab.word_type] || vocab.word_type}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/60 italic">—</span>
                      )}
                    </td>

                    {/* Meaning */}
                    <td className="p-4 align-middle text-foreground font-medium max-w-xs truncate">
                      {vocab.meaning}
                    </td>

                    {/* Leitner Box */}
                    <td className="p-4 align-middle">
                      <Badge variant="outline" className="text-xs bg-secondary/50 font-medium">
                        Hộp {vocab.box_number}
                      </Badge>
                    </td>

                    {/* Next Review Time */}
                    <td className="p-4 align-middle text-xs">
                      {(() => {
                        const d = new Date(vocab.next_review_at)
                        const isDue = d.getTime() <= Date.now()
                        return (
                          <span className={cn(isDue ? "text-destructive font-semibold" : "text-muted-foreground")}>
                            {d.toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {isDue && " (Đến hạn)"}
                          </span>
                        )
                      })()}
                    </td>

                    {/* Ngữ cảnh */}
                    <td className="hidden md:table-cell p-4 align-middle max-w-xs">
                      {vocab.context_sentence ? (
                        <span className="text-sm text-muted-foreground truncate block max-w-xs italic" title={vocab.context_sentence}>
                          "{vocab.context_sentence}"
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/60 italic">—</span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="hidden lg:table-cell p-4 align-middle max-w-sm">
                      {vocab.notes ? (
                        <span className="text-sm text-muted-foreground truncate block max-w-xs">
                          {vocab.notes}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/60 italic">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 align-middle text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(vocab)}
                          disabled={!modifiable}
                          title={modifiable ? "Sửa" : "Bạn không có quyền sửa"}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(vocab)}
                          disabled={!modifiable || isDeletingId === vocab.id}
                          title={modifiable ? "Xóa" : "Bạn không có quyền xóa"}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
                        >
                          {isDeletingId === vocab.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
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
