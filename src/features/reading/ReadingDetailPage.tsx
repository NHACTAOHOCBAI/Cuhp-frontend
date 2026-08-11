import * as React from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, BookOpen, Send, Trash2, Save, Sparkles, Languages, Edit2, Check, X, Volume2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { VocabularyEditDialog } from "../vocabulary/VocabularyEditDialog" // Tích hợp dialog thêm từ vựng hiện có
import { READING_LEVELS, READING_CATEGORIES } from "./types"
import {
  useReadingPassageById,
  useTranslationPracticeQuery,
  useSaveTranslationPractice,
  useReadingCommentsQuery,
  useCreateReadingComment,
  useDeleteReadingComment,
  useUpdateReadingComment,
} from "./hooks"
import { toast } from "sonner"
import { speakWord } from "@/lib/tts"

export function ReadingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  // Queries
  const { data: passage, isLoading: loadingPassage } = useReadingPassageById(id)
  const { data: translationPractice, isLoading: loadingTranslation } = useTranslationPracticeQuery(id)
  const { data: comments = [], isLoading: loadingComments } = useReadingCommentsQuery(id)

  // Mutations
  const saveTranslationMut = useSaveTranslationPractice(id!)
  const createCommentMut = useCreateReadingComment(id!)
  const deleteCommentMut = useDeleteReadingComment(id!)
  const updateCommentMut = useUpdateReadingComment(id!)

  // Draft state
  const [translationDraft, setTranslationDraft] = React.useState("")
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)

  // Comment input state
  const [commentContent, setCommentContent] = React.useState("")

  // Edit comment states
  const [editingCommentId, setEditingCommentId] = React.useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = React.useState("")

  // Floating word selection states
  const [selectedWord, setSelectedWord] = React.useState("")
  const [showTooltip, setShowTooltip] = React.useState(false)
  const [tooltipPosition, setTooltipPosition] = React.useState({ top: 0, left: 0 })

  // Vocabulary Dialog state
  const [vocabDialogOpen, setVocabDialogOpen] = React.useState(false)

  // Notion-like tooltip commenting states
  const [tooltipMode, setTooltipMode] = React.useState<"menu" | "comment">("menu")
  const [miniComment, setMiniComment] = React.useState("")

  // Notion-style inline comments popover states
  const [activeCommentWord, setActiveCommentWord] = React.useState<string | null>(null)
  const [commentPopupPosition, setCommentPopupPosition] = React.useState<{ top: number; left: number } | null>(null)
  const [replyCommentContent, setReplyCommentContent] = React.useState("")

  // Sync draft state from backend once loaded
  React.useEffect(() => {
    if (translationPractice) {
      setTranslationDraft(translationPractice.translation_content)
      setHasUnsavedChanges(false)
    }
  }, [translationPractice])

  // Click outside tooltip listener to hide it
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (showTooltip && !(e.target as HTMLElement).closest(".translation-tooltip")) {
        setShowTooltip(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [showTooltip])

  // Reset tooltip mode and mini-comment when tooltip is closed
  React.useEffect(() => {
    if (!showTooltip) {
      setTooltipMode("menu")
      setMiniComment("")
    }
  }, [showTooltip])

  // Click outside inline comment popup to close it
  React.useEffect(() => {
    const handleOutsideClickPopup = (e: MouseEvent) => {
      if (activeCommentWord && !(e.target as HTMLElement).closest(".inline-comment-popup")) {
        setActiveCommentWord(null)
        setCommentPopupPosition(null)
        setReplyCommentContent("")
      }
    }
    document.addEventListener("mousedown", handleOutsideClickPopup)
    return () => document.removeEventListener("mousedown", handleOutsideClickPopup)
  }, [activeCommentWord])

  const handleTextSelection = (e: React.MouseEvent) => {
    const selection = window.getSelection()
    if (!selection) return
    const text = selection.toString().trim()

    // Ensure selection is inside the container
    const container = e.currentTarget
    if (!selection.anchorNode || !container.contains(selection.anchorNode)) {
      setShowTooltip(false)
      return
    }

    // Limit selection to valid lengths (between 2 and 1000 characters)
    if (text.length >= 2 && text.length <= 1000) {
      setSelectedWord(text)
      try {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()

        setTooltipPosition({
          top: rect.top - 45 + window.scrollY,
          left: rect.left + rect.width / 2 + window.scrollX,
        })
        setShowTooltip(true)
      } catch {
        setShowTooltip(false)
      }
    } else {
      setShowTooltip(false)
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    setTimeout(() => handleTextSelection(e), 50)
  }

  const handleOpenVocabDialog = () => {
    setVocabDialogOpen(true)
    setShowTooltip(false)
  }

  const handleSaveTranslation = async () => {
    if (!translationDraft.trim()) {
      toast.error("Vui lòng nhập nội dung bản dịch trước khi lưu.")
      return
    }

    try {
      await saveTranslationMut.mutateAsync({
        translation_content: translationDraft.trim(),
      })
      setHasUnsavedChanges(false)
      toast.success("Bản dịch nháp đã được lưu thành công!")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lưu bản dịch thất bại."
      toast.error(msg)
    }
  }

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentContent.trim()) return

    try {
      await createCommentMut.mutateAsync({
        content: commentContent.trim(),
      })
      setCommentContent("")
      toast.success("Đã đăng bình luận thành công.")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Đăng bình luận thất bại."
      toast.error(msg)
    }
  }

  const handleSendMiniComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!miniComment.trim()) return

    try {
      await createCommentMut.mutateAsync({
        content: miniComment.trim(),
        selected_text: selectedWord,
      })
      setMiniComment("")
      setShowTooltip(false)
      toast.success("Đã đăng bình luận về từ vựng thành công.")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Đăng bình luận thất bại."
      toast.error(msg)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteCommentMut.mutateAsync(commentId)
      toast.success("Đã xóa bình luận.")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Xóa bình luận thất bại."
      toast.error(msg)
    }
  }

  const handleUpdateComment = async (commentId: string) => {
    if (!editingCommentText.trim()) return

    try {
      await updateCommentMut.mutateAsync({
        commentId,
        payload: { content: editingCommentText.trim() },
      })
      setEditingCommentId(null)
      setEditingCommentText("")
      toast.success("Đã cập nhật bình luận thành công.")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Cập nhật bình luận thất bại."
      toast.error(msg)
    }
  }

  const handleHighlightedWordClick = (e: React.MouseEvent<HTMLSpanElement>, word: string) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setCommentPopupPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + rect.width / 2 + window.scrollX,
    })
    setActiveCommentWord(word)
    setReplyCommentContent("")
  }

  const handleSendReplyComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyCommentContent.trim() || !activeCommentWord) return

    try {
      await createCommentMut.mutateAsync({
        content: replyCommentContent.trim(),
        selected_text: activeCommentWord,
      })
      setReplyCommentContent("")
      toast.success("Đã gửi phản hồi thành công.")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gửi phản hồi thất bại."
      toast.error(msg)
    }
  }

  const renderHighlightedContent = (rawContent: string) => {
    const commentedWords = Array.from(
      new Set(
        comments
          .map((c) => c.selected_text)
          .filter((t): t is string => !!t && t.trim().length > 0)
      )
    ).sort((a, b) => b.length - a.length)

    if (commentedWords.length === 0) {
      return rawContent.split("\n\n").map((para, i) => (
        <p key={i} className="mb-4">
          {para}
        </p>
      ))
    }

    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    }

    const pattern = commentedWords.map((w) => escapeRegExp(w)).join("|")
    const regex = new RegExp(`\\b(${pattern})\\b`, "gi")

    return rawContent.split("\n\n").map((para, pIdx) => {
      const parts = []
      let lastIndex = 0
      let match

      regex.lastIndex = 0

      while ((match = regex.exec(para)) !== null) {
        const matchIndex = match.index
        const matchText = match[0]

        if (matchIndex > lastIndex) {
          parts.push(para.substring(lastIndex, matchIndex))
        }

        parts.push(
          <span
            key={`${pIdx}-${matchIndex}`}
            onClick={(e) => handleHighlightedWordClick(e, matchText)}
            className="bg-amber-150 dark:bg-amber-500/25 border-b-2 border-dashed border-amber-400 cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-500/45 transition-colors px-0.5 rounded select-text"
            title={`Nhấp để xem thảo luận về "${matchText}"`}
          >
            {matchText}
          </span>
        )

        lastIndex = regex.lastIndex
      }

      if (lastIndex < para.length) {
        parts.push(para.substring(lastIndex))
      }

      return (
        <p key={pIdx} className="mb-4">
          {parts.length > 0 ? parts : para}
        </p>
      )
    })
  }

  const getLevelLabel = (val: string | null | undefined) => {
    if (!val) return "Không xác định"
    return READING_LEVELS.find((l) => l.value === val)?.label ?? val
  }

  const getCategoryLabel = (val: string | null | undefined) => {
    if (!val) return "Khác"
    return READING_CATEGORIES.find((c) => c.value === val)?.label ?? val
  }

  const getLevelColorClass = (val: string | null | undefined) => {
    switch (val) {
      case "A1":
      case "A2":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "B1":
      case "B2":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      case "C1":
      case "C2":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  if (loadingPassage) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Đang tải bài đọc...</p>
        </div>
      </div>
    )
  }

  if (!passage) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-background min-h-screen">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-bold">Không tìm thấy bài đọc</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Bài đọc có thể đã bị xóa hoặc không tồn tại.
        </p>
        <Link to="/admin/reading" className="text-primary hover:underline">
          Quay lại danh sách bài đọc
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-background p-4 sm:p-6 overflow-y-auto animate-in fade-in-0 duration-150 relative">
      {/* Top Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/admin/reading" className="hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Bài đọc
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[200px]">{passage.title}</span>
      </div>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-border">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{passage.title}</h1>
          <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground mt-1">
            <Badge variant="outline" className={getLevelColorClass(passage.level)}>
              {getLevelLabel(passage.level)}
            </Badge>
            <Badge variant="secondary">{getCategoryLabel(passage.category)}</Badge>
            <span>•</span>
            <span>
              Tạo vào:{" "}
              {new Date(passage.created_at).toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Split screen content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 h-[550px] min-h-[400px]">
        {/* Left Side: Original reading text */}
        <Card className="flex flex-col h-full border border-border bg-card shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-border bg-muted/20">
            <CardTitle className="text-base font-semibold flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-primary" /> Văn bản gốc
            </CardTitle>
          </CardHeader>
          <CardContent
            className="flex-1 overflow-y-auto p-5 select-text font-serif leading-relaxed text-lg tracking-wide space-y-4"
            onMouseUp={handleTextSelection}
            onDoubleClick={handleDoubleClick}
            style={{ WebkitUserSelect: "text", userSelect: "text" }}
          >
            {renderHighlightedContent(passage.content)}
          </CardContent>
          <div className="p-3 bg-muted/10 border-t border-border text-xs text-muted-foreground">
            💡 <span className="font-semibold text-primary">Mẹo học nhanh:</span> Bôi đen hoặc nhấp đúp vào bất kỳ từ tiếng Anh nào để kích hoạt bong bóng thêm từ vựng.
          </div>
        </Card>

        {/* Right Side: Translation Editor */}
        <Card className="flex flex-col h-full border border-border bg-card shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-1.5">
              <Languages className="h-4 w-4 text-primary" /> Bản dịch của bạn
            </CardTitle>
            <Button
              size="sm"
              onClick={handleSaveTranslation}
              disabled={saveTranslationMut.isPending || loadingTranslation}
              className="gap-1.5 cursor-pointer text-xs h-8"
            >
              <Save className="h-3.5 w-3.5" />
              {saveTranslationMut.isPending ? "Đang lưu..." : "Lưu bản dịch"}
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-4 flex flex-col min-h-0">
            {loadingTranslation ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="flex-1 flex flex-col space-y-2 h-full">
                <textarea
                  value={translationDraft}
                  onChange={(e) => {
                    setTranslationDraft(e.target.value)
                    setHasUnsavedChanges(true)
                  }}
                  placeholder="Nhập bản dịch tiếng Việt của bạn ở đây. Nội dung dịch sẽ được lưu lại để đối chiếu..."
                  className="flex-1 w-full bg-transparent border-0 resize-none outline-none focus:ring-0 text-base leading-relaxed font-sans placeholder:text-muted-foreground/60 focus-visible:outline-none"
                />
                {hasUnsavedChanges && (
                  <p className="text-xs text-amber-500 animate-pulse">
                    ⚠️ Có thay đổi chưa được lưu nháp.
                  </p>
                )}
              </div>
            )}
          </CardContent>
          <div className="p-3 bg-muted/10 border-t border-border text-xs text-muted-foreground flex justify-between items-center">
            <span>
              Cập nhật cuối:{" "}
              {translationPractice
                ? new Date(translationPractice.updated_at).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Chưa lưu lần nào"}
            </span>
          </div>
        </Card>
      </div>

      {/* Comment Section below split screens */}
      <Card className="border border-border bg-card shadow-sm mb-8">
        <CardHeader className="py-4 px-6 border-b border-border">
          <CardTitle className="text-lg font-bold">Thảo luận & Bình luận ({comments.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* List of comments */}
          {loadingComments ? (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Chưa có thảo luận nào. Hãy là người đầu tiên đưa ra câu hỏi hoặc ý kiến nhé!
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((cmt) => {
                const isAuthor = cmt.user_id === user?.id
                const canDelete = isAuthor || user?.role === "admin"

                return (
                  <div key={cmt.id} className="flex items-start gap-3 group/comment">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0 select-none">
                      {cmt.user.initials}
                    </div>
                    <div className="flex-1 bg-muted/40 p-3 rounded-lg border border-border/50 text-sm space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-foreground">{cmt.user.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(cmt.created_at).toLocaleString("vi-VN", {
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isAuthor && editingCommentId !== cmt.id && (
                            <button
                              onClick={() => {
                                setEditingCommentId(cmt.id)
                                setEditingCommentText(cmt.content)
                              }}
                              className="text-muted-foreground opacity-0 group-hover/comment:opacity-100 focus:opacity-100 transition-opacity hover:text-foreground cursor-pointer flex items-center"
                              title="Sửa bình luận"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {canDelete && editingCommentId !== cmt.id && (
                            <button
                              onClick={() => handleDeleteComment(cmt.id)}
                              disabled={deleteCommentMut.isPending}
                              className="text-destructive opacity-0 group-hover/comment:opacity-100 focus:opacity-100 transition-opacity hover:underline cursor-pointer flex items-center gap-0.5"
                              title="Xóa bình luận"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      {cmt.selected_text && (
                        <div className="mb-1">
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px] font-semibold py-0.5 px-1.5 select-none inline-flex items-center gap-1">
                            <Languages className="h-3 w-3" /> Hỏi về: "{cmt.selected_text}"
                          </Badge>
                        </div>
                      )}
                      {editingCommentId === cmt.id ? (
                        <div className="flex gap-2 items-center mt-1 animate-in fade-in duration-200">
                          <input
                            type="text"
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            required
                            className="flex-1 rounded border border-input bg-transparent px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUpdateComment(cmt.id)}
                            disabled={updateCommentMut.isPending || !editingCommentText.trim()}
                            className="h-8 px-2.5 cursor-pointer flex items-center gap-1"
                          >
                            <Check className="h-3.5 w-3.5" /> Lưu
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingCommentId(null)
                              setEditingCommentText("")
                            }}
                            className="h-8 px-2.5 cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-1"
                          >
                            <X className="h-3.5 w-3.5" /> Hủy
                          </Button>
                        </div>
                      ) : (
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{cmt.content}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <Separator />

          {/* Comment submission form */}
          <form onSubmit={handlePostComment} className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0 select-none">
              {user?.initials ?? "ME"}
            </div>
            <div className="flex-1 relative">
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Viết thắc mắc hoặc thảo luận tại đây..."
                rows={2}
                required
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pr-12 resize-none"
              />
              <Button
                type="submit"
                size="icon"
                disabled={createCommentMut.isPending || !commentContent.trim()}
                className="absolute right-2 bottom-2 h-7 w-7 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Floating tooltip popover for quick vocabulary addition or commenting */}
      {showTooltip && (
        <div
          className="fixed z-50 bg-popover text-popover-foreground border border-border shadow-lg p-2 rounded-lg translation-tooltip animate-in fade-in-0 duration-100 max-w-[280px]"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: "translate(-50%, -100%)",
            marginTop: "-8px",
          }}
          onMouseDown={(e) => {
            // Prevent selection from disappearing when clicking inside tooltip
            e.stopPropagation()
            e.preventDefault()
          }}
        >
          {tooltipMode === "menu" ? (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5">
                <span className="text-xs max-w-[10ch] truncate font-semibold block text-primary px-1 select-none">
                  {selectedWord}
                </span>
                {selectedWord.length <= 80 && !selectedWord.includes("\n") && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => speakWord(selectedWord)}
                    className="h-6 w-6 text-muted-foreground hover:text-primary rounded-full shrink-0 cursor-pointer"
                    title={`Nghe phát âm từ "${selectedWord}"`}
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {selectedWord.length <= 80 && !selectedWord.includes("\n") && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleOpenVocabDialog}
                    className="h-7 px-1.5 text-xs text-primary font-medium flex items-center gap-1 hover:bg-primary/10 cursor-pointer animate-in slide-in-from-left-1 duration-150"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Thêm từ vựng
                  </Button>
                </>
              )}

              <Separator orientation="vertical" className="h-4" />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setTooltipMode("comment")}
                className="h-7 px-1.5 text-xs text-primary font-medium flex items-center gap-1 hover:bg-primary/10 cursor-pointer animate-in slide-in-from-left-2 duration-150"
              >
                <Send className="h-3.5 w-3.5 rotate-45" /> Bình luận
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSendMiniComment} className="flex flex-col gap-1.5 p-1 w-[240px]">
              <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 select-none">
                <Sparkles className="h-2.5 w-2.5 text-primary" /> Hỏi về: <span className="text-primary truncate max-w-[120px] font-bold">"{selectedWord}"</span>
              </div>
              <div className="flex gap-1 items-center">
                <input
                  type="text"
                  value={miniComment}
                  onChange={(e) => setMiniComment(e.target.value)}
                  placeholder="Nhập câu hỏi/bình luận..."
                  autoFocus
                  required
                  className="flex-1 rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-7 w-7 shrink-0 cursor-pointer"
                  disabled={createCommentMut.isPending || !miniComment.trim()}
                >
                  <Send className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground text-xs"
                  onClick={() => setTooltipMode("menu")}
                >
                  ✕
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Vocabulary Dialog Integration */}
      <VocabularyEditDialog
        vocabId={null}
        defaultWord={selectedWord}
        open={vocabDialogOpen}
        onOpenChange={setVocabDialogOpen}
      />

      {/* Notion-style Inline Comments Popover */}
      {activeCommentWord && commentPopupPosition && (
        <div
          className="fixed z-50 bg-popover text-popover-foreground border border-border shadow-xl rounded-lg p-3 w-[290px] inline-comment-popup animate-in fade-in-0 zoom-in-95 duration-150"
          style={{
            top: `${commentPopupPosition.top}px`,
            left: `${commentPopupPosition.left}px`,
            transform: "translate(-50%, 8px)",
          }}
          onMouseDown={(e) => {
            // Prevent selection from disappearing when clicking inside comments popup
            e.stopPropagation()
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-2 border-b border-border mb-2 select-none">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
              💬 Thảo luận từ: <span className="text-primary font-extrabold max-w-[120px] truncate">"{activeCommentWord}"</span>
            </span>
            <button
              onClick={() => {
                setActiveCommentWord(null)
                setCommentPopupPosition(null)
              }}
              className="text-muted-foreground hover:text-foreground text-xs cursor-pointer px-1"
            >
              ✕
            </button>
          </div>

          {/* List of comments for this word */}
          <div className="max-h-[180px] overflow-y-auto space-y-2 mb-2 pr-1 scrollbar-thin">
            {comments.filter((c) => c.selected_text?.toLowerCase() === activeCommentWord.toLowerCase()).length === 0 ? (
              <p className="text-[11px] text-muted-foreground text-center py-4">
                Chưa có thảo luận nào cho từ này. Hãy đặt câu hỏi đầu tiên!
              </p>
            ) : (
              comments
                .filter((c) => c.selected_text?.toLowerCase() === activeCommentWord.toLowerCase())
                .map((cmt) => {
                  const isAuthor = cmt.user_id === user?.id
                  const canDelete = isAuthor || user?.role === "admin"
                  return (
                    <div key={cmt.id} className="flex gap-2 items-start text-xs animate-in fade-in duration-200 group/inline-comment">
                      <div className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px] shrink-0 select-none">
                        {cmt.user.initials}
                      </div>
                      <div className="flex-1 bg-muted/40 p-2 rounded border border-border/40 space-y-0.5 min-w-0">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-semibold text-foreground truncate max-w-[80px]">{cmt.user.name}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-muted-foreground text-[9px]">
                              {new Date(cmt.created_at).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isAuthor && editingCommentId !== cmt.id && (
                              <button
                                onClick={() => {
                                  setEditingCommentId(cmt.id)
                                  setEditingCommentText(cmt.content)
                                }}
                                className="text-muted-foreground opacity-0 group-hover/inline-comment:opacity-100 focus:opacity-100 transition-opacity hover:text-foreground cursor-pointer flex items-center"
                                title="Sửa"
                              >
                                <Edit2 className="h-2.5 w-2.5" />
                              </button>
                            )}
                            {canDelete && editingCommentId !== cmt.id && (
                              <button
                                onClick={() => handleDeleteComment(cmt.id)}
                                disabled={deleteCommentMut.isPending}
                                className="text-destructive opacity-0 group-hover/inline-comment:opacity-100 focus:opacity-100 transition-opacity hover:underline cursor-pointer flex items-center"
                                title="Xóa"
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        {editingCommentId === cmt.id ? (
                          <div className="flex gap-1 items-center mt-1 animate-in fade-in duration-200">
                            <input
                              type="text"
                              value={editingCommentText}
                              onChange={(e) => setEditingCommentText(e.target.value)}
                              required
                              className="flex-1 rounded border border-input bg-transparent px-1.5 py-0.5 text-[10px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                            <button
                              onClick={() => handleUpdateComment(cmt.id)}
                              disabled={updateCommentMut.isPending || !editingCommentText.trim()}
                              className="h-5 px-1 bg-primary text-primary-foreground rounded text-[9px] cursor-pointer flex items-center"
                            >
                              <Check className="h-2.5 w-2.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingCommentId(null)
                                setEditingCommentText("")
                              }}
                              className="h-5 px-1 bg-muted text-muted-foreground rounded text-[9px] cursor-pointer flex items-center"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-muted-foreground break-words whitespace-pre-wrap text-[11px] leading-relaxed select-text">
                            {cmt.content}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })
            )}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleSendReplyComment} className="flex gap-1.5 pt-2 border-t border-border">
            <input
              type="text"
              value={replyCommentContent}
              onChange={(e) => setReplyCommentContent(e.target.value)}
              placeholder="Nhập phản hồi..."
              required
              className="flex-1 rounded border border-input bg-transparent px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <Button
              type="submit"
              size="sm"
              className="h-7 px-2.5 text-xs shrink-0 cursor-pointer"
              disabled={createCommentMut.isPending || !replyCommentContent.trim()}
            >
              Gửi
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
