import * as React from "react"
import { useParams, Link } from "react-router-dom"
import {
  useReadingPassageById,
  useTranslationPracticeQuery,
  useSaveTranslationPractice,
} from "@/features/reading/hooks"
import { useVocabulariesQuery } from "@/features/vocabulary/hooks"
import { VocabularyModal } from "@/features/vocabulary/components/VocabularyModal"
import { RichTextEditor } from "@/components/ui/RichTextEditor"
import { extractContextSentence } from "@/lib/contextSentence"
import type { VocabularyItem } from "@/types"
import {
  ArrowLeft,
  Languages,
  Save,
  Bookmark,
  MessageSquare,
  ExternalLink,
  StickyNote,
  Trash2,
  X,
  Highlighter,
  Copy,
} from "lucide-react"
import { toast } from "sonner"



interface PassageNote {
  id: string
  selectedText: string
  comment: string
  createdAt: string
}

export default function EnglishReadingDetail() {
  const { id } = useParams<{ id: string }>()

  // 1. Fetch reading passage details
  const { data: passage, isLoading: isPassageLoading } = useReadingPassageById(id)

  // 2. Fetch user's translation practice
  const { data: practice } = useTranslationPracticeQuery(id)

  // 4. Save translation practice mutation
  const saveTranslationMutation = useSaveTranslationPractice(id!)

  // 5. Fetch user's saved vocabulary list & filter words saved from this passage
  const { data: userVocab } = useVocabulariesQuery({ page_size: 1000 })

  const savedPassageWords = React.useMemo(() => {
    if (!userVocab?.items || !passage) return []
    const titleLower = passage.title.toLowerCase()
    const cleanContent = (passage.content || "").replace(/<[^>]*>/g, " ").toLowerCase()

    return userVocab.items.filter((item) => {
      const noteMatches = item.notes?.toLowerCase().includes(titleLower)
      const textMatches = cleanContent.length > 0 && cleanContent.includes(item.word.toLowerCase())
      return noteMatches || textMatches
    })
  }, [userVocab, passage])

  // Local state for translation text input
  const [translationText, setTranslationText] = React.useState("")

  // Passage Notes & Highlights state
  const [passageNotes, setPassageNotes] = React.useState<PassageNote[]>([])
  const [passageHighlights, setPassageHighlights] = React.useState<string[]>([])
  const [isCommentModalOpen, setIsCommentModalOpen] = React.useState(false)
  const [commentInput, setCommentInput] = React.useState("")

  // Floating Selection State
  const [selectedText, setSelectedText] = React.useState<string>("")
  const [selectedContainerText, setSelectedContainerText] = React.useState<string>("")
  const [selectionPos, setSelectionPos] = React.useState<{ x: number; y: number } | null>(null)

  // Vocabulary Modal State for Reading page
  const [isVocabModalOpen, setIsVocabModalOpen] = React.useState(false)
  const [prefilledVocabItem, setPrefilledVocabItem] = React.useState<Partial<VocabularyItem> | null>(null)

  // Load translation & passage notes on mount
  React.useEffect(() => {
    if (practice) {
      setTranslationText(practice.translation_content)
    }
  }, [practice])

  React.useEffect(() => {
    if (id) {
      localStorage.setItem(`read_passage_${id}`, "true")
      const currentProg = localStorage.getItem(`passage_progress_${id}`)
      if (!currentProg) {
        localStorage.setItem(`passage_progress_${id}`, "40")
      }
      const savedNotes = localStorage.getItem(`passage_notes_${id}`)
      if (savedNotes) {
        try {
          setPassageNotes(JSON.parse(savedNotes))
        } catch {
          setPassageNotes([])
        }
      }
      const savedHighlights = localStorage.getItem(`passage_highlights_${id}`)
      if (savedHighlights) {
        try {
          setPassageHighlights(JSON.parse(savedHighlights))
        } catch {
          setPassageHighlights([])
        }
      }
    }
  }, [id])

  // Save notes to localStorage
  const savePassageNotesToStorage = (updated: PassageNote[]) => {
    setPassageNotes(updated)
    if (id) {
      localStorage.setItem(`passage_notes_${id}`, JSON.stringify(updated))
    }
  }

  // Handle Text Selection Popup
  React.useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // Ignore if clicking inside toolbar or modal
      const target = e.target as HTMLElement
      if (target.closest(".selection-toolbar") || target.closest(".comment-modal")) {
        return
      }

      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        return
      }

      const text = selection.toString().trim()
      if (text.length > 0) {
        try {
          const range = selection.getRangeAt(0)
          const rect = range.getBoundingClientRect()
          const container = range.commonAncestorContainer
          const containerText =
            (container.nodeType === Node.TEXT_NODE
              ? container.parentElement?.textContent
              : container.textContent) || ""

          setSelectedText(text)
          setSelectedContainerText(containerText)
          setSelectionPos({
            x: rect.left + rect.width / 2,
            y: Math.max(10, rect.top - 8),
          })
        } catch {
          // ignore selection errors
        }
      }
    }

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest(".selection-toolbar") || target.closest(".comment-modal")) {
        return
      }
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        setSelectionPos(null)
      }
    }

    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("click", handleDocumentClick)
    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("click", handleDocumentClick)
    }
  }, [])



  // Action 0: Copy Selected Text to Clipboard
  const handleCopySelectedText = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedText) return
    navigator.clipboard
      .writeText(selectedText)
      .then(() => {
        toast.success("Copied to clipboard!")
      })
      .catch(() => {
        toast.error("Failed to copy text.")
      })
    setSelectionPos(null)
  }

  // Action 1: Highlight Selected Text
  const handleHighlightSelectedText = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedText) return
    const textToHighlight = selectedText.trim()
    if (!textToHighlight) return

    if (!passageHighlights.includes(textToHighlight)) {
      const updated = [...passageHighlights, textToHighlight]
      setPassageHighlights(updated)
      if (id) {
        localStorage.setItem(`passage_highlights_${id}`, JSON.stringify(updated))
      }
      toast.success("Text highlighted!")
    } else {
      toast.info("This text is already highlighted.")
    }
    setSelectionPos(null)
  }

  // Render highlighted passage HTML safely without breaking HTML tags/attributes
  const renderedPassageHtml = React.useMemo(() => {
    if (!passage?.content) return ""

    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(passage.content)
    let baseHtml = passage.content
    if (!hasHtmlTags) {
      baseHtml = passage.content
        .split(/\n\s*\n/)
        .map((p) => `<p class="mb-4">${p.replace(/\n/g, "<br/>")}</p>`)
        .join("")
    }

    const activeHighlights = [...(passageHighlights || [])]
    if (selectionPos && selectedText && selectedText.trim().length > 0) {
      const activeText = selectedText.trim()
      if (!activeHighlights.includes(activeText)) {
        activeHighlights.push(activeText)
      }
    }

    if (activeHighlights.length === 0) {
      return baseHtml
    }

    const escaped = activeHighlights
      .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .filter(Boolean)
      .join("|")
    if (!escaped) return baseHtml

    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(baseHtml, "text/html")
      const regex = new RegExp(`(${escaped})`, "gi")

      const walkTextNodes = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.nodeValue
          if (text && regex.test(text)) {
            const span = doc.createElement("span")
            span.innerHTML = text.replace(
              regex,
              '<mark class="bg-[#EFBCD5]/45 text-[#1f1a1d] px-1 py-0.5 rounded font-normal transition-all">$1</mark>'
            )
            node.parentNode?.replaceChild(span, node)
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element
          if (["SCRIPT", "STYLE", "MARK"].includes(el.tagName)) return
          const children = Array.from(el.childNodes)
          for (const child of children) {
            walkTextNodes(child)
          }
        }
      }

      walkTextNodes(doc.body)
      return doc.body.innerHTML
    } catch {
      return baseHtml
    }
  }, [passage?.content, passageHighlights, selectedText, selectionPos])

  // Action 1: Save Selection as Vocabulary via Modal
  const handleSaveSelectedVocab = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedText) return
    const cleanWord = selectedText.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, "").trim()
    const targetWord = cleanWord || selectedText.trim()
    if (!targetWord) return

    const fullSentence = extractContextSentence(
      targetWord,
      passage?.content,
      selectedContainerText
    )

    setPrefilledVocabItem({
      word: targetWord,
      context_sentence: fullSentence,
      notes: `Saved from reading: ${passage?.title || ""}`,
    })
    setIsVocabModalOpen(true)
    setSelectionPos(null)
  }

  // Action 2: Add Comment / Note for Selection
  const handleOpenAddComment = () => {
    setCommentInput("")
    setIsCommentModalOpen(true)
  }

  const handleSaveComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentInput.trim() || !selectedText) return

    const newNote: PassageNote = {
      id: `note-${Date.now()}`,
      selectedText,
      comment: commentInput.trim(),
      createdAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }

    const updated = [newNote, ...passageNotes]
    savePassageNotesToStorage(updated)
    toast.success("Note added successfully!")
    setIsCommentModalOpen(false)
    setSelectionPos(null)
  }

  const handleDeleteNote = (noteId: string) => {
    const updated = passageNotes.filter((n) => n.id !== noteId)
    savePassageNotesToStorage(updated)
    toast.success("Note deleted.")
  }

  // Action 3: Open YouGlish Pronunciation
  const handleOpenYouglish = () => {
    if (!selectedText) return
    const query = encodeURIComponent(selectedText.trim())
    const url = `https://youglish.com/pronounce/${query}/english`
    window.open(url, "_blank", "noopener,noreferrer")
    setSelectionPos(null)
  }



  // Handle saving translation practice
  const handleSaveTranslation = () => {
    if (!id) return

    saveTranslationMutation.mutate(
      { translation_content: translationText },
      {
        onSuccess: () => {
          toast.success("Your translation practice has been saved!")
          localStorage.setItem(`passage_progress_${id}`, "100")
        },
        onError: (err) => {
          toast.error(`Failed to save translation: ${err.message}`)
        },
      }
    )
  }



  if (isPassageLoading) {
    return (
      <div className="py-12 space-y-6 animate-pulse max-w-5xl mx-auto font-outfit">
        <div className="h-4 bg-zinc-100 rounded w-1/4"></div>
        <div className="h-10 bg-zinc-100 rounded w-3/4"></div>
        <div className="h-64 bg-zinc-50 rounded w-full"></div>
      </div>
    )
  }

  if (!passage) {
    return (
      <div className="text-center py-16 bg-white border border-[#E5DFE2] rounded-[24px] font-outfit">
        <p className="text-sm font-semibold text-[#706065]">This passage was not found.</p>
        <Link to="/english/reading" className="mt-4 text-xs font-bold text-[#EFBCD5] hover:underline inline-block">
          Back to reading library
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full relative font-outfit">
      {/* Page Header */}
      <header className="mb-[24px]">
        <Link
          to="/english/reading"
          className="text-sm text-[#706065] hover:text-[#EFBCD5] transition-colors flex items-center gap-1.5 mb-2 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Reading Library
        </Link>
        <h1 className="font-sora font-bold text-3xl text-[#201B1E] mb-1">{passage.title}</h1>
        {(() => {
          const words = passage.content ? passage.content.trim().split(/\s+/).length : 0
          const minRead = Math.max(1, Math.ceil(words / 150))
          const levelText = passage.level
            ? `${passage.level} LEVEL`
            : passage.category
            ? passage.category.toUpperCase()
            : "GENERAL ENGLISH"
          return (
            <div className="font-mono text-xs font-bold text-[#70495e] uppercase tracking-wider">
              {levelText} • {words} WORDS • {minRead} MIN READ
            </div>
          )
        })()}
      </header>

      {/* Main Split Grid (Reader & Worksheets) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left Column: English Reader */}
        <section className="bg-white rounded-[24px] p-6 border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] flex flex-col h-[calc(100vh-235px)] min-h-[500px] overflow-hidden">
          <h3 className="font-sora font-bold text-lg text-[#1f1a1d] mb-4 pb-3 border-b border-[#E5DFE2]/70 flex items-center justify-between">
            <span>English Text</span>
            <span className="text-xs font-normal text-[#706065] font-outfit">
              Highlight text to save vocab, add notes, or search YouGlish
            </span>
          </h3>
          <div
            className="overflow-y-auto flex-1 pr-2 space-y-4 text-zinc-800 text-base leading-[1.8] font-outfit select-text selection:bg-[#EFBCD5]/50 selection:text-[#1f1a1d] hide-scrollbar [&_p]:mb-4 [&_strong]:text-[#1f1a1d] [&_strong]:font-bold"
            dangerouslySetInnerHTML={{ __html: renderedPassageHtml }}
          />
        </section>

        {/* Right Column: Worksheets & Notes */}
        <section className="flex flex-col gap-6 h-[calc(100vh-235px)] min-h-[500px] overflow-y-auto pr-1">
          {/* Translation Practise Panel */}
          <div className="bg-white rounded-[24px] p-6 border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] flex flex-col min-h-[380px]">
            <div className="pb-4 border-b border-[#E5DFE2] flex justify-between items-center mb-4">
              <span className="font-sora font-bold text-sm text-[#706065] flex items-center gap-2">
                <Languages className="h-4.5 w-4.5 text-[#EFBCD5]" />
                Translation Practice
              </span>
              <button
                onClick={handleSaveTranslation}
                className="text-[#7b5268] hover:text-[#EFBCD5] p-1.5 rounded transition-colors flex items-center gap-1.5 text-xs font-bold font-mono"
                title="Save translation"
              >
                <Save className="h-4 w-4" /> Save Translation
              </button>
            </div>
            <RichTextEditor
              value={translationText}
              onChange={(val) => {
                setTranslationText(val)
                if (id && val.trim().length > 0) {
                  const currentProgress = Number(localStorage.getItem(`passage_progress_${id}`) || 0)
                  if (currentProgress < 100) {
                    localStorage.setItem(`passage_progress_${id}`, "75")
                  }
                }
              }}
              minHeight={260}
              maxHeight={440}
              placeholder="Type your translation here. Use formatting buttons for bold, italic, underline, or lists..."
            />
          </div>

          {/* Reading Notes & Comments Panel */}
          <div className="bg-white rounded-[24px] p-6 border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] flex-shrink-0">
            <h3 className="font-sora font-bold text-base text-[#201B1E] mb-3 flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-[#EFBCD5]" /> Passage Notes ({passageNotes.length})
            </h3>
            {passageNotes.length === 0 ? (
              <p className="text-xs text-[#706065] italic py-2">
                No notes added yet. Highlight text in the passage to add comments & notes!
              </p>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {passageNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 bg-[#FCFAF7] border border-[#E5DFE2] rounded-xl text-xs space-y-1.5 relative group"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-[#7b5268] italic border-l-2 border-[#EFBCD5] pl-2 block truncate max-w-[220px]">
                        "{note.selectedText}"
                      </span>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-zinc-400 hover:text-red-500 transition-colors p-0.5"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[#201B1E] font-medium leading-relaxed">{note.comment}</p>
                    <span className="text-[10px] text-[#706065]/70 block text-right font-mono">
                      {note.createdAt}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Saved Vocabulary in Passage Panel */}
          <div className="bg-white rounded-[24px] p-6 border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] flex-shrink-0 font-outfit">
            <h3 className="font-sora font-bold text-base text-[#201B1E] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EFBCD5]" />
              <span>Saved Vocabulary in Passage ({savedPassageWords.length})</span>
            </h3>
            {savedPassageWords.length === 0 ? (
              <p className="text-xs text-[#706065] italic py-2">
                No vocabulary saved from this passage yet. Highlight text in the passage and click "Save Vocab"!
              </p>
            ) : (
              <ul className="space-y-3 font-outfit max-h-64 overflow-y-auto pr-1">
                {savedPassageWords.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between items-center p-2.5 hover:bg-[#fcf1f5] rounded-xl cursor-pointer transition-colors border-b border-[#E5DFE2]/40 last:border-0 pb-3"
                  >
                    <div>
                      <span className="font-bold text-base text-[#1f1a1d]">{item.word}</span>
                      {item.pronunciation && (
                        <span className="font-mono text-xs text-[#706065] ml-2 font-semibold">
                          {item.pronunciation}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-[#7b5268] bg-[#fcf1f5] px-2.5 py-1 rounded-lg border border-[#eae0e4] max-w-[180px] truncate">
                      {item.meaning}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* FLOATING SELECTION TOOLBAR (POPUP WHEN HIGHLIGHTING TEXT) */}
      {selectionPos && selectedText && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="selection-toolbar fixed z-[99999] -translate-x-1/2 -translate-y-full bg-white/95 backdrop-blur-md text-[#201B1E] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.35)] rounded-2xl p-1.5 flex items-center gap-1 animate-in zoom-in-95 duration-150 font-outfit border border-[#E5DFE2]"
          style={{ left: `${selectionPos.x}px`, top: `${selectionPos.y}px` }}
        >
          {/* Action 0: Copy Selected Text */}
          <button
            onClick={handleCopySelectedText}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#fcf1f5] text-[#7b5268] transition-all text-xs font-bold"
            title="Copy selected text"
          >
            <Copy className="w-3.5 h-3.5 text-[#EFBCD5]" />
            <span>Copy</span>
          </button>

          <div className="w-[1px] h-4 bg-[#E5DFE2]" />

          {/* Action 1: Highlight Text */}
          <button
            onClick={handleHighlightSelectedText}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#fcf1f5] text-[#7b5268] transition-all text-xs font-bold"
            title="Highlight text"
          >
            <Highlighter className="w-3.5 h-3.5 text-[#EFBCD5]" />
            <span>Highlight</span>
          </button>

          <div className="w-[1px] h-4 bg-[#E5DFE2]" />

          {/* Action 1: Save Vocabulary */}
          <button
            onClick={handleSaveSelectedVocab}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#fcf1f5] text-[#7b5268] transition-all text-xs font-bold"
            title="Save as Vocabulary"
          >
            <Bookmark className="w-3.5 h-3.5 fill-[#EFBCD5] text-[#EFBCD5]" />
            <span>Save Vocab</span>
          </button>

          <div className="w-[1px] h-4 bg-[#E5DFE2]" />

          {/* Action 2: Comment / Note */}
          <button
            onClick={handleOpenAddComment}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#fcf1f5] text-[#706065] hover:text-[#201B1E] transition-all text-xs font-semibold"
            title="Add Note or Comment"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#EFBCD5]" />
            <span>Note</span>
          </button>

          <div className="w-[1px] h-4 bg-[#E5DFE2]" />

          {/* Action 3: YouGlish Lookup */}
          <button
            onClick={handleOpenYouglish}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#fcf1f5] text-[#706065] hover:text-[#7b5268] transition-all text-xs font-semibold"
            title="Search pronunciation on YouGlish"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#7b5268]" />
            <span>YouGlish</span>
          </button>
        </div>
      )}

      {/* COMMENT / NOTE INPUT MODAL */}
      {isCommentModalOpen && (
        <div className="comment-modal fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150 font-outfit">
          <div className="bg-white border border-[#E5DFE2] rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DFE2] bg-[#FCFAF7]">
              <h3 className="font-sora font-bold text-base text-[#201B1E] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#EFBCD5]" /> Add Passage Note
              </h3>
              <button
                type="button"
                onClick={() => setIsCommentModalOpen(false)}
                className="p-1 rounded-full hover:bg-[#F6EBEF] text-[#706065] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveComment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[#706065] mb-1.5">
                  Highlighted Snippet
                </label>
                <div className="p-3 bg-[#FCFAF7] border border-[#E5DFE2] rounded-xl text-xs italic text-[#7b5268] max-h-24 overflow-y-auto">
                  "{selectedText}"
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[#706065] mb-1.5">
                  Your Note / Comment <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Write your note or thoughts here..."
                  className="w-full p-3 rounded-xl border border-[#E5DFE2] bg-[#FCFAF7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EFBCD5] text-xs text-[#201B1E] leading-relaxed"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCommentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5DFE2] text-[#706065] font-semibold text-xs hover:bg-zinc-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#EFBCD5] text-[#201B1E] font-sora font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-sm"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* VOCABULARY ADD / EDIT MODAL */}
      <VocabularyModal
        isOpen={isVocabModalOpen}
        onClose={() => setIsVocabModalOpen(false)}
        initialData={prefilledVocabItem}
      />
    </div>
  )
}
