/**
 * Detail page for a single audio track.
 */
import * as React from "react"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Eye,
  EyeOff,
  FileAudio,
  Mic,
  Search,
  Copy,
  Check,
  Send,
  Trash2,
  Edit2,
  X,
  Volume2,
  Sparkles,
  ExternalLink,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { speakWord } from "@/lib/tts"
import { VocabularyEditDialog } from "../vocabulary/VocabularyEditDialog"
import {
  useAudioById,
  useAudioCommentsQuery,
  useCreateAudioComment,
  useDeleteAudioComment,
  useUpdateAudioComment,
} from "./hooks"
import { AudioPlayer } from "./AudioPlayer"
import { CATEGORIES, LEVELS } from "./types"

const LEVEL_LABEL = Object.fromEntries(LEVELS.map((l) => [l.value, l.label]))
const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]))

const SCRIPT_PREF_KEY = "audio:showScript"

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

export function AudioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  // Queries
  const { data, isLoading, isError, error } = useAudioById(id)
  const { data: comments = [] } = useAudioCommentsQuery(id)

  // Mutations
  const createCommentMut = useCreateAudioComment(id!)
  const deleteCommentMut = useDeleteAudioComment(id!)
  const updateCommentMut = useUpdateAudioComment(id!)

  // Script visibility preference — persisted across reloads
  const [showScript, setShowScript] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return true
    try {
      return window.localStorage.getItem(SCRIPT_PREF_KEY) !== "0"
    } catch {
      return true
    }
  })

  const [copied, setCopied] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Edit comment states
  const [editingCommentId, setEditingCommentId] = React.useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = React.useState("")

  // Floating word selection states
  const [selectedWord, setSelectedWord] = React.useState("")
  const [selectedSentence, setSelectedSentence] = React.useState("")
  const [selectedWordParaIdx, setSelectedWordParaIdx] = React.useState<number | null>(null)
  const [selectedWordOccIdx, setSelectedWordOccIdx] = React.useState<number | null>(null)
  const [showTooltip, setShowTooltip] = React.useState(false)
  const [tooltipPosition, setTooltipPosition] = React.useState({ top: 0, left: 0 })

  // Vocabulary Dialog state
  const [vocabDialogOpen, setVocabDialogOpen] = React.useState(false)

  // Notion-like tooltip commenting states
  const [tooltipMode, setTooltipMode] = React.useState<"menu" | "comment">("menu")
  const [miniComment, setMiniComment] = React.useState("")

  // Notion-style inline comments popover states
  const [activeCommentWord, setActiveCommentWord] = React.useState<string | null>(null)
  const [activeCommentPIdx, setActiveCommentPIdx] = React.useState<number | null>(null)
  const [activeCommentOccIdx, setActiveCommentOccIdx] = React.useState<number | null>(null)
  const [commentPopupPosition, setCommentPopupPosition] = React.useState<{ top: number; left: number } | null>(null)
  const [replyCommentContent, setReplyCommentContent] = React.useState("")

  // Copy handler
  const handleCopy = async () => {
    if (!data?.transcript) return
    try {
      await navigator.clipboard.writeText(data.transcript)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

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
      setSelectedWordParaIdx(null)
      setSelectedWordOccIdx(null)
    }
  }, [showTooltip])

  // Click outside inline comment popup to close it
  React.useEffect(() => {
    const handleOutsideClickPopup = (e: MouseEvent) => {
      if (activeCommentWord && !(e.target as HTMLElement).closest(".inline-comment-popup")) {
        setActiveCommentWord(null)
        setCommentPopupPosition(null)
        setActiveCommentPIdx(null)
        setActiveCommentOccIdx(null)
        setReplyCommentContent("")
      }
    }
    document.addEventListener("mousedown", handleOutsideClickPopup)
    return () => document.removeEventListener("mousedown", handleOutsideClickPopup)
  }, [activeCommentWord])

  React.useEffect(() => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(SCRIPT_PREF_KEY, showScript ? "1" : "0")
    } catch {
      // ignore
    }
  }, [showScript])

  const handleTextSelection = (e: React.MouseEvent, targetElement?: HTMLElement) => {
    const selection = window.getSelection()
    if (!selection) return
    const text = selection.toString().trim()

    // Ensure selection is inside the container
    const container = targetElement || (e.currentTarget as HTMLElement)
    if (!container || !selection.anchorNode || !container.contains(selection.anchorNode)) {
      setShowTooltip(false)
      return
    }

    // Limit selection to valid lengths
    if (text.length >= 2 && text.length <= 1000) {
      setSelectedWord(text)
      setSelectedSentence(text)

      let paraIndex = 0
      let occurrenceIndex = 0
      let hasSelectionDetails = false

      let anchorParent = selection.anchorNode?.parentElement
      while (anchorParent && anchorParent.tagName !== "P" && anchorParent.parentElement) {
        anchorParent = anchorParent.parentElement
      }
      if (anchorParent && anchorParent.tagName === "P") {
        const pElements = Array.from(container.getElementsByTagName("p"))
        const pIdx = pElements.indexOf(anchorParent as HTMLParagraphElement)
        if (pIdx !== -1) {
          try {
            const range = selection.getRangeAt(0)
            const preSelectionRange = range.cloneRange()
            preSelectionRange.selectNodeContents(anchorParent)
            preSelectionRange.setEnd(range.startContainer, range.startOffset)
            const startOffset = preSelectionRange.toString().length

            const paraText = anchorParent.textContent || ""
            const occurrences = []
            let pos = paraText.toLowerCase().indexOf(text.toLowerCase())
            while (pos !== -1) {
              occurrences.push(pos)
              pos = paraText.toLowerCase().indexOf(text.toLowerCase(), pos + 1)
            }

            const occIdx = occurrences.findIndex((pos) => Math.abs(pos - startOffset) < 3)
            if (occIdx !== -1) {
              paraIndex = pIdx
              occurrenceIndex = occIdx
              hasSelectionDetails = true
            }

            let sentenceStart = 0
            for (let i = startOffset - 1; i >= 0; i--) {
              const char = paraText[i]
              if ((char === "." || char === "?" || char === "!") && (i === paraText.length - 1 || /\s/.test(paraText[i + 1]))) {
                sentenceStart = i + 1
                break
              }
              if (char === "\n") {
                sentenceStart = i + 1
                break
              }
            }

            let sentenceEnd = paraText.length
            const endOffset = startOffset + text.length
            for (let i = endOffset; i < paraText.length; i++) {
              const char = paraText[i]
              if (char === "." || char === "?" || char === "!") {
                sentenceEnd = i + 1
                break
              }
              if (char === "\n") {
                sentenceEnd = i
                break
              }
            }

            const sentence = paraText.substring(sentenceStart, sentenceEnd).trim()
            setSelectedSentence(sentence)
          } catch (err) {
            console.error(err)
          }
        }
      }

      if (hasSelectionDetails) {
        setSelectedWordParaIdx(paraIndex)
        setSelectedWordOccIdx(occurrenceIndex)
      } else {
        setSelectedWordParaIdx(null)
        setSelectedWordOccIdx(null)
      }

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
      setSelectedSentence("")
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement
    setTimeout(() => handleTextSelection(e, target), 50)
  }

  const handleOpenVocabDialog = () => {
    setVocabDialogOpen(true)
    setShowTooltip(false)
  }

  const handleSendMiniComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!miniComment.trim()) return

    try {
      const hasSelectionDetails = selectedWordParaIdx !== null && selectedWordOccIdx !== null
      const selectedTextValue = hasSelectionDetails
        ? `${selectedWord}|||${selectedWordParaIdx}|||${selectedWordOccIdx}`
        : selectedWord

      await createCommentMut.mutateAsync({
        content: miniComment.trim(),
        selected_text: selectedTextValue,
      })
      setMiniComment("")
      setSelectedWord("")
      setSelectedWordParaIdx(null)
      setSelectedWordOccIdx(null)
      setShowTooltip(false)
      window.getSelection()?.removeAllRanges()
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

  const handleDeleteAllComments = async () => {
    if (comments.length === 0) return
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa toàn bộ ${comments.length} thảo luận của bài nghe này? Hành động này không thể hoàn tác.`
    )
    if (!confirmDelete) return

    try {
      await Promise.all(
        comments.map((cmt) => deleteCommentMut.mutateAsync(cmt.id))
      )
      toast.success("Đã xóa toàn bộ thảo luận thành công.")
    } catch (err) {
      toast.error("Có lỗi xảy ra khi xóa toàn bộ thảo luận.")
    }
  }

  const handleUpdateComment = async (commentId: string) => {
    if (!editingCommentText.trim()) return

    try {
      await updateCommentMut.mutateAsync({
        commentId,
        content: editingCommentText.trim(),
      })
      setEditingCommentId(null)
      setEditingCommentText("")
      toast.success("Đã cập nhật bình luận.")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Cập nhật bình luận thất bại."
      toast.error(msg)
    }
  }

  const handleSendReplyComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyCommentContent.trim() || !activeCommentWord) return

    try {
      const selectedTextValue = activeCommentPIdx !== null && activeCommentOccIdx !== null
        ? `${activeCommentWord}|||${activeCommentPIdx}|||${activeCommentOccIdx}`
        : activeCommentWord

      await createCommentMut.mutateAsync({
        content: replyCommentContent.trim(),
        selected_text: selectedTextValue,
      })
      setReplyCommentContent("")
      toast.success("Đã đăng phản hồi thành công.")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Đăng phản hồi thất bại."
      toast.error(msg)
    }
  }

  const handleHighlightedWordClick = (
    e: React.MouseEvent,
    word: string,
    pIdx: number,
    occIdx: number
  ) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setCommentPopupPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + rect.width / 2 + window.scrollX,
    })
    setActiveCommentWord(word)
    setActiveCommentPIdx(pIdx)
    setActiveCommentOccIdx(occIdx)
  }

  const renderHighlightedContent = (rawContent: string) => {
    const isHtml = /<[a-z][\s\S]*>/i.test(rawContent)
    
    const parsedComments = comments.map((c) => {
      const selected = c.selected_text || ""
      if (selected.includes("|||")) {
        const [word, pIdxStr, occIdxStr] = selected.split("|||")
        return {
          id: c.id,
          word,
          pIdx: parseInt(pIdxStr, 10),
          occIdx: parseInt(occIdxStr, 10),
          isSpecific: true,
          originalComment: c
        }
      } else {
        return {
          id: c.id,
          word: selected,
          pIdx: -1,
          occIdx: -1,
          isSpecific: false,
          originalComment: c
        }
      }
    }).filter((item) => item.word.trim().length > 0)

    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    }

    const highlightSearchQuery = (text: string, search: string) => {
      if (!search.trim()) return [text]
      const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
      const parts = text.split(new RegExp(`(${escapedSearch})`, "gi"))
      return parts.map((part, i) =>
        part.toLowerCase() === search.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/60 rounded px-0.5 text-foreground font-medium">
            {part}
          </mark>
        ) : (
          part
        )
      )
    }

    const parseNode = (node: Node, pIdx: number, state: { offset: number; wordMatchCounts: Record<string, number> }): React.ReactNode => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || ""
        const paraText = node.parentElement?.textContent || ""
        
        const paraComments = parsedComments.filter(
          (c) => (c.isSpecific && c.pIdx === pIdx) || !c.isSpecific
        )

        if (paraComments.length === 0) {
          const result = highlightSearchQuery(text, searchQuery)
          state.offset += text.length
          return <React.Fragment key={state.offset}>{result}</React.Fragment>
        }

        const matchWords = Array.from(
          new Set(paraComments.map((c) => c.word))
        ).sort((a, b) => b.length - a.length)

        const regexParts = matchWords.map((word) => {
          const escaped = escapeRegExp(word)
          let part = escaped.replace(/\s+/g, '\\s+')
          part = part.replace(/['’]/g, "['’]")
          part = part.replace(/["“”]/g, '["“”]')

          const startsWithWordChar = /^\w/.test(word)
          const endsWithWordChar = /\w$/.test(word)

          if (startsWithWordChar) {
            part = '\\b' + part
          }
          if (endsWithWordChar) {
            part = part + '\\b'
          }
          return `(${part})`
        })

        const pattern = regexParts.join("|")
        const regex = new RegExp(pattern, "gi")

        const parts: React.ReactNode[] = []
        let lastIndex = 0
        let match

        regex.lastIndex = 0

        while ((match = regex.exec(text)) !== null) {
          const matchIndex = match.index
          const matchText = match[0]

          const absoluteStartOffset = state.offset + matchIndex
          const normText = matchText.toLowerCase().replace(/\s+/g, " ").replace(/[’]/g, "'").replace(/[“”]/g, '"')
          
          const occurrences = []
          let pos = paraText.toLowerCase().indexOf(normText)
          while (pos !== -1) {
            occurrences.push(pos)
            pos = paraText.toLowerCase().indexOf(normText, pos + 1)
          }
          
          const currentOccCount = occurrences.findIndex((pos) => Math.abs(pos - absoluteStartOffset) < 5)

          const hasMatchingComment = paraComments.some((c) => {
            const cNorm = c.word.toLowerCase().replace(/\s+/g, " ").replace(/[’]/g, "'").replace(/[“”]/g, '"')
            if (cNorm !== normText) return false
            return !c.isSpecific || c.occIdx === currentOccCount
          })

          if (matchIndex > lastIndex) {
            parts.push(...highlightSearchQuery(text.substring(lastIndex, matchIndex), searchQuery))
          }

          if (hasMatchingComment && currentOccCount !== -1) {
            parts.push(
              <span
                key={`${pIdx}-${absoluteStartOffset}`}
                onClick={(e) => handleHighlightedWordClick(e, matchText, pIdx, currentOccCount)}
                className="bg-amber-150 dark:bg-amber-500/25 border-b-2 border-dashed border-amber-400 cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-500/45 transition-colors px-0.5 rounded select-text"
                title={`Nhấp để xem thảo luận về "${matchText}"`}
              >
                {highlightSearchQuery(matchText, searchQuery)}
              </span>
            )
          } else {
            parts.push(...highlightSearchQuery(matchText, searchQuery))
          }

          lastIndex = regex.lastIndex
        }

        if (lastIndex < text.length) {
          parts.push(...highlightSearchQuery(text.substring(lastIndex), searchQuery))
        }

        state.offset += text.length
        return <React.Fragment key={state.offset}>{parts}</React.Fragment>
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        const tagName = el.tagName.toLowerCase()
        const children: React.ReactNode[] = []
        
        for (let i = 0; i < el.childNodes.length; i++) {
          children.push(parseNode(el.childNodes[i], pIdx, state))
        }

        const key = `${tagName}-${pIdx}-${state.offset}`
        switch (tagName) {
          case "strong":
          case "b":
            return <strong key={key}>{children}</strong>
          case "em":
          case "i":
            return <em key={key}>{children}</em>
          case "u":
            return <u key={key}>{children}</u>
          case "span":
            return <span key={key} className={el.className}>{children}</span>
          case "p":
            return <p key={key} className="mb-4">{children}</p>
          case "div":
            return <div key={key} className="mb-2">{children}</div>
          case "ul":
            return <ul key={key} className="list-disc pl-5 mb-4">{children}</ul>
          case "ol":
            return <ol key={key} className="list-decimal pl-5 mb-4">{children}</ol>
          case "li":
            return <li key={key}>{children}</li>
          case "br":
            return <br key={key} />
          default:
            return <React.Fragment key={key}>{children}</React.Fragment>
        }
      }

      return null
    }

    if (isHtml) {
      const parser = new DOMParser()
      const doc = parser.parseFromString(rawContent, "text/html")
      const resultElements: React.ReactNode[] = []

      let pCounter = 0
      const bodyChildren = Array.from(doc.body.childNodes)

      bodyChildren.forEach((child) => {
        const tagName = child.nodeType === Node.ELEMENT_NODE ? (child as HTMLElement).tagName.toLowerCase() : ""
        const isBlock = ["p", "li", "ul", "ol", "div"].includes(tagName)
        
        const state = { offset: 0, wordMatchCounts: {} }
        const parsed = parseNode(child, pCounter, state)
        if (parsed) {
          resultElements.push(parsed)
        }
        if (isBlock || tagName === "p") {
          pCounter++
        }
      })

      return resultElements
    } else {
      return rawContent.replace(/\r\n/g, "\n").split("\n\n").map((para, pIdx) => {
        const state = { offset: 0, wordMatchCounts: {} }
        const parser = new DOMParser()
        const doc = parser.parseFromString(para, "text/html")
        return (
          <p key={pIdx} className="mb-4">
            {parseNode(doc.body, pIdx, state)}
          </p>
        )
      })
    }
  }

  const getLevelLabel = (val: string | null | undefined) => {
    if (!val) return "Không xác định"
    return LEVEL_LABEL[val] ?? val
  }

  const getCategoryLabel = (val: string | null | undefined) => {
    if (!val) return "Khác"
    return CATEGORY_LABEL[val] ?? val
  }

  const getLevelColorClass = (val: string | null | undefined) => {
    switch (val) {
      case "beginner":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "intermediate":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      case "advanced":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Đang tải bài nghe...</p>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-background min-h-screen">
        <FileAudio className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-bold">Không tìm thấy bài nghe</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          {error?.message ?? "Bài nghe có thể đã bị xóa hoặc không tồn tại."}
        </p>
        <Link to="/admin/audio" className="text-primary hover:underline">
          Quay lại danh sách bài nghe
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 lg:h-full h-auto bg-background p-4 sm:p-6 lg:overflow-hidden overflow-y-auto animate-in fade-in-0 duration-150 relative">
      {/* Top Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 shrink-0">
        <Link to="/admin/audio" className="hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Bài nghe
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[200px]">{data.title}</span>
      </div>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-2 shrink-0">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{data.title}</h1>
          <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground mt-1">
            {data.level && (
              <Badge variant="outline" className={getLevelColorClass(data.level)}>
                {getLevelLabel(data.level)}
              </Badge>
            )}
            {data.category && (
              <Badge variant="secondary">{getCategoryLabel(data.category)}</Badge>
            )}
            <span>•</span>
            <span>Người tạo: {data.user_id}</span>
            <span>•</span>
            <span>Tạo vào: {formatDate(data.created_at)}</span>
            {data.filename && (
              <>
                <span>•</span>
                <span>Tệp: {data.filename}</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        {user?.role === "admin" && comments.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteAllComments}
            className="text-destructive hover:bg-destructive/10 border-destructive/20 hover:border-destructive/30 flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
          >
            <Trash2 className="h-4 w-4" /> Xóa tất cả thảo luận
          </Button>
        )}
      </div>

      {/* Split screen content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-2 lg:flex-1 lg:min-h-0 min-h-[400px] h-[550px] lg:h-auto items-start">
        {/* Left Side: Player */}
        <Card className="flex flex-col h-fit border border-border bg-card shadow-none rounded-md">
          <CardHeader className="py-3 px-4 border-b border-border bg-muted/20">
            <CardTitle className="text-base font-semibold flex items-center gap-1.5">
              <Mic className="h-4 w-4 text-primary" /> Trình phát
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <AudioPlayer src={data.url} />
          </CardContent>
          <div className="p-3 bg-muted/10 border-t border-border text-xs text-muted-foreground select-none shrink-0">
            💡 <span className="font-semibold text-primary">Mẹo học nhanh:</span> Nghe kỹ audio và đối chiếu với transcript bên phải để rèn luyện kỹ năng nghe chép chính tả (dictation) hoặc shadowing.
          </div>
        </Card>

        {/* Right Side: Script / Transcript */}
        <Card className="flex flex-col h-full border border-border bg-card shadow-none rounded-md overflow-hidden">
          <CardHeader className="py-3 px-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
              <CardTitle className="text-base font-semibold flex items-center gap-1.5 shrink-0">
                <FileAudio className="h-4 w-4 text-primary" /> Script / Transcript
              </CardTitle>
              {showScript && data.transcript && (
                <div className="relative w-full sm:max-w-[200px] md:max-w-[240px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Tìm từ khóa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 text-xs bg-muted/40 hover:bg-muted/60 focus:bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {showScript && data.transcript && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  title="Sao chép toàn bộ Script"
                  className="h-8 text-xs hover:bg-muted"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400 animate-in fade-in-0 zoom-in-95" />
                      Đã sao chép
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Sao chép
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowScript((v) => !v)}
                aria-pressed={!showScript}
                aria-label={showScript ? "Ẩn script" : "Hiện script"}
                className="h-8 text-xs hover:bg-muted"
              >
                {showScript ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                    Ẩn
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    Hiện
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 sm:p-5 flex flex-col min-h-0">
            {showScript ? (
              data.transcript ? (
                <div
                  className="flex-1 overflow-y-auto rounded-md border border-input bg-muted/10 p-5 font-serif leading-relaxed text-lg tracking-wide space-y-4 select-text whitespace-pre-wrap animate-in fade-in duration-200"
                  onMouseUp={(e) => handleTextSelection(e)}
                  onDoubleClick={handleDoubleClick}
                  style={{ WebkitUserSelect: "text", userSelect: "text" }}
                >
                  {renderHighlightedContent(data.transcript)}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Bài nghe này chưa có script. Bạn có thể thêm script bằng cách vào trang quản lý và chỉnh sửa.
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Script đang ẩn — bấm nút <span className="font-medium not-italic">Hiện</span> phía trên để xem nội dung transcript.
              </p>
            )}
          </CardContent>
          <div className="p-3 bg-muted/10 border-t border-border text-xs text-muted-foreground select-none shrink-0">
            💡 <span className="font-semibold text-primary">Mẹo học nhanh:</span> Bôi đen hoặc nhấp đúp vào bất kỳ từ tiếng Anh nào để kích hoạt bong bóng thêm từ vựng và thảo luận.
          </div>
        </Card>
      </div>

      {/* Floating tooltip popover for quick vocabulary addition or commenting */}
      {showTooltip && (
        <div
          className="fixed z-50 bg-popover text-popover-foreground border border-border shadow-lg p-2 rounded-lg translation-tooltip animate-in fade-in-0 duration-100 w-max max-w-[460px]"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: "translate(-50%, -100%)",
            marginTop: "-8px",
          }}
          onMouseDown={(e) => {
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
                    className="h-7 px-1.5 text-xs text-primary font-medium flex items-center gap-1 hover:bg-primary/10 hover:text-primary cursor-pointer animate-in slide-in-from-left-1 duration-150"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Thêm từ vựng
                  </Button>

                  <Separator orientation="vertical" className="h-4" />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const url = `https://youglish.com/pronounce/${encodeURIComponent(selectedWord)}/english`
                      window.open(url, "_blank", "noopener,noreferrer")
                    }}
                    className="h-7 px-1.5 text-xs text-primary font-medium flex items-center gap-1 hover:bg-primary/10 hover:text-primary cursor-pointer animate-in slide-in-from-left-1 duration-150"
                    title={`Tra cách phát âm từ "${selectedWord}" trên YouGlish`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> YouGlish
                  </Button>
                </>
              )}

              <Separator orientation="vertical" className="h-4" />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setTooltipMode("comment")}
                className="h-7 px-1.5 text-xs text-primary font-medium flex items-center gap-1 hover:bg-primary/10 hover:text-primary cursor-pointer animate-in slide-in-from-left-2 duration-150"
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
                  className="flex-1 rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
        defaultSentence={selectedSentence}
        open={vocabDialogOpen}
        onOpenChange={setVocabDialogOpen}
      />

      {/* Notion-style Inline Comments Popover */}
      {activeCommentWord && commentPopupPosition && (() => {
        const sActive = activeCommentWord.toLowerCase()
        const relevantComments = comments.filter((c) => {
          if (!c.selected_text) return false
          const selected = c.selected_text
          if (selected.includes("|||")) {
            const [word, pIdxStr, occIdxStr] = selected.split("|||")
            const p = parseInt(pIdxStr, 10)
            const occ = parseInt(occIdxStr, 10)
            return (
              word.toLowerCase() === sActive &&
              p === activeCommentPIdx &&
              occ === activeCommentOccIdx
            )
          } else {
            return selected.toLowerCase() === sActive
          }
        })

        return (
          <div
            className="fixed z-50 bg-popover text-popover-foreground border border-border shadow-xl rounded-lg p-3 w-[290px] inline-comment-popup animate-in fade-in-0 zoom-in-95 duration-150"
            style={{
              top: `${commentPopupPosition.top}px`,
              left: `${commentPopupPosition.left}px`,
              transform: "translate(-50%, 8px)",
            }}
            onMouseDown={(e) => {
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
                  setActiveCommentPIdx(null)
                  setActiveCommentOccIdx(null)
                  setReplyCommentContent("")
                }}
                className="text-muted-foreground hover:text-foreground text-xs cursor-pointer px-1"
              >
                ✕
              </button>
            </div>

            {/* List of comments for this word */}
            <div className="max-h-[180px] overflow-y-auto space-y-2 mb-2 pr-1 scrollbar-thin">
              {relevantComments.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-4">
                  Chưa có thảo luận nào cho từ này. Hãy đặt câu hỏi đầu tiên!
                </p>
              ) : (
                relevantComments.map((cmt) => {
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
        )
      })()}
    </div>
  )
}