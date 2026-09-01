import * as React from "react"
import { useParams, Link } from "react-router-dom"
import { useAudioById } from "@/features/audio/hooks"
import { useVocabulariesQuery } from "@/features/vocabulary/hooks"
import { VocabularyModal } from "@/features/vocabulary/components/VocabularyModal"
import type { VocabularyItem } from "@/types"
import {
  Play,
  Pause,
  Highlighter,
  Bookmark,
  StickyNote,
  Volume2,
  X,
  Trash2,
  ArrowLeft,
} from "lucide-react"
import { toast } from "sonner"

interface TrackNote {
  id: string
  selectedText: string
  comment: string
  createdAt: string
}

export default function EnglishShadowingDetail() {
  const { id } = useParams<{ id: string }>()

  // 1. Fetch audio track details
  const { data: track, isLoading: isTrackLoading } = useAudioById(id)

  // 2. Fetch saved vocabulary
  const { data: userVocab } = useVocabulariesQuery({ page_size: 1000 })

  // Audio player state
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(270) // Default fallback 04:30

  // Notes & Highlights state
  const [trackNotes, setTrackNotes] = React.useState<TrackNote[]>([])
  const [trackHighlights, setTrackHighlights] = React.useState<string[]>([])
  const [isCommentModalOpen, setIsCommentModalOpen] = React.useState(false)
  const [commentInput, setCommentInput] = React.useState("")

  // Floating Selection State
  const [selectedText, setSelectedText] = React.useState<string>("")
  const [selectionPos, setSelectionPos] = React.useState<{ x: number; y: number } | null>(null)

  // Vocabulary Modal State
  const [isVocabModalOpen, setIsVocabModalOpen] = React.useState(false)
  const [prefilledVocabItem, setPrefilledVocabItem] = React.useState<Partial<VocabularyItem> | null>(null)

  // Filter saved vocab for this audio track
  const savedTrackWords = React.useMemo(() => {
    if (!userVocab?.items || !track) return []
    const titleLower = track.title.toLowerCase()
    const transcriptLower = (track.transcript || "").toLowerCase()

    return userVocab.items.filter((item) => {
      const noteMatches = item.notes?.toLowerCase().includes(titleLower)
      const textMatches = transcriptLower.length > 0 && transcriptLower.includes(item.word.toLowerCase())
      return noteMatches || textMatches
    })
  }, [userVocab, track])

  // HTML5 Audio event handlers & simulation fallback
  React.useEffect(() => {
    let interval: any
    if (isPlaying && !track?.url) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false)
            return 0
          }
          return prev + 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, duration, track])

  // Sync progress & load notes/highlights
  React.useEffect(() => {
    if (!id) return
    localStorage.setItem(`audio_progress_${id}`, "50")

    const savedNotes = localStorage.getItem(`audio_notes_${id}`)
    if (savedNotes) {
      try {
        setTrackNotes(JSON.parse(savedNotes))
      } catch {
        setTrackNotes([])
      }
    }

    const savedHighlights = localStorage.getItem(`audio_highlights_${id}`)
    if (savedHighlights) {
      try {
        setTrackHighlights(JSON.parse(savedHighlights))
      } catch {
        setTrackHighlights([])
      }
    }
  }, [id])

  // Handle Text Selection Popup
  React.useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
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
          setSelectedText(text)
          setSelectionPos({
            x: rect.left + rect.width / 2,
            y: Math.max(10, rect.top - 8),
          })
        } catch {
          // ignore
        }
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest(".selection-toolbar") && !target.closest(".comment-modal")) {
        setSelectionPos(null)
      }
    }

    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("mousedown", handleMouseDown)
    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("mousedown", handleMouseDown)
    }
  }, [])

  // Action 0: Highlight Selected Text
  const handleHighlightSelectedText = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedText) return
    const textToHighlight = selectedText.trim()
    if (!textToHighlight) return

    if (!trackHighlights.includes(textToHighlight)) {
      const updated = [...trackHighlights, textToHighlight]
      setTrackHighlights(updated)
      if (id) {
        localStorage.setItem(`audio_highlights_${id}`, JSON.stringify(updated))
      }
      toast.success("Text highlighted!")
    } else {
      toast.info("This text is already highlighted.")
    }
    setSelectionPos(null)
  }

  // Action 1: Save Selection as Vocabulary
  const handleSaveSelectedVocab = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedText) return

    const cleanWord = selectedText.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, "").trim()
    const targetWord = cleanWord || selectedText.trim()
    if (!targetWord) return

    setPrefilledVocabItem({
      word: targetWord,
      context_sentence: selectedText,
      notes: `Saved from listening: ${track?.title || ""}`,
    })
    setIsVocabModalOpen(true)
    setSelectionPos(null)
  }

  // Action 2: Add Comment / Note
  const handleOpenAddComment = () => {
    setCommentInput("")
    setIsCommentModalOpen(true)
  }

  const handleSaveComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentInput.trim() || !selectedText) return

    const newNote: TrackNote = {
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

    const updated = [newNote, ...trackNotes]
    setTrackNotes(updated)
    if (id) {
      localStorage.setItem(`audio_notes_${id}`, JSON.stringify(updated))
    }
    toast.success("Note added successfully!")
    setIsCommentModalOpen(false)
    setSelectionPos(null)
  }

  const handleDeleteNote = (noteId: string) => {
    const updated = trackNotes.filter((n) => n.id !== noteId)
    setTrackNotes(updated)
    if (id) {
      localStorage.setItem(`audio_notes_${id}`, JSON.stringify(updated))
    }
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

  // Render text content with highlighted marks
  const renderTextWithHighlights = (text: string) => {
    if (!trackHighlights || trackHighlights.length === 0) {
      return text
    }

    const escaped = trackHighlights
      .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .filter(Boolean)
      .join("|")
    if (!escaped) return text

    try {
      const regex = new RegExp(`(${escaped})`, "gi")
      const parts = text.split(regex)

      return parts.map((part, idx) => {
        const isHighlighted = trackHighlights.some(
          (h) => h.toLowerCase() === part.toLowerCase()
        )
        if (isHighlighted) {
          return (
            <mark
              key={idx}
              className="bg-[#EFBCD5]/45 text-[#1f1a1d] px-1 py-0.5 rounded font-semibold transition-all"
              title="Highlighted text"
            >
              {part}
            </mark>
          )
        }
        return part
      })
    } catch {
      return text
    }
  }

  // Format time display (mm:ss)
  const formatTime = (timeInSecs: number) => {
    const mins = Math.floor(timeInSecs / 60)
    const secs = Math.floor(timeInSecs % 60)
    return `${mins < 10 ? "0" + mins : mins}:${secs < 10 ? "0" + secs : secs}`
  }

  // Handle Play/Pause
  const handleTogglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
    }
    setIsPlaying(!isPlaying)
  }

  // Handle skip
  const handleSkip = (seconds: number) => {
    const target = Math.max(0, Math.min(currentTime + seconds, duration))
    setCurrentTime(target)
    if (audioRef.current) {
      audioRef.current.currentTime = target
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const target = Math.floor(percent * duration)
    setCurrentTime(target)
    if (audioRef.current) {
      audioRef.current.currentTime = target
    }
  }

  if (isTrackLoading) {
    return (
      <div className="py-12 space-y-6 animate-pulse max-w-5xl mx-auto font-outfit">
        <div className="h-4 bg-zinc-100 rounded w-1/4" />
        <div className="h-10 bg-zinc-100 rounded w-3/4" />
        <div className="h-64 bg-zinc-50 rounded w-full" />
      </div>
    )
  }

  const trackTitle = track?.title || "Listening Track"
  const transcriptText =
    track?.transcript ||
    "It's easy to get caught up in the constant hustle of modern life.\n\nWe are always rushing from one task to another, never really pausing.\n\nWe need to embrace slow living in this fast-paced world.\n\nFinding time for a quiet morning coffee can change your whole day.\n\nIt is about intentional choices rather than passive reactions.\n\nWhen we slow down, we actually notice the details around us more clearly.\n\nThis practice isn't about doing less, but doing things with more presence."

  return (
    <div className="space-y-6 w-full relative font-outfit">
      {/* HTML5 Audio Element */}
      {track?.url && (
        <audio
          ref={audioRef}
          src={track.url}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuration(audioRef.current.duration || 270)
            }
          }}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime)
            }
          }}
          onEnded={() => {
            setIsPlaying(false)
            if (id) {
              localStorage.setItem(`audio_progress_${id}`, "100")
            }
          }}
        />
      )}

      {/* FLOATING TEXT SELECTION TOOLBAR */}
      {selectionPos && (
        <div
          className="fixed z-50 transform -translate-x-1/2 -translate-y-full mb-2 bg-white/95 backdrop-blur-md shadow-[0_10px_30px_-5px_rgba(239,188,213,0.35)] rounded-2xl border border-[#E5DFE2] px-2 py-1.5 flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150 selection-toolbar font-outfit"
          style={{
            left: `${selectionPos.x}px`,
            top: `${selectionPos.y}px`,
          }}
        >
          <button
            onClick={handleHighlightSelectedText}
            className="px-2.5 py-1.5 rounded-xl hover:bg-[#FCFAF7] text-xs font-semibold text-[#1f1a1d] flex items-center gap-1.5 transition-colors"
            title="Highlight text"
          >
            <Highlighter className="w-3.5 h-3.5 text-[#EFBCD5]" />
            <span>Highlight</span>
          </button>
          <div className="w-[1px] h-4 bg-[#E5DFE2]" />
          <button
            onClick={handleSaveSelectedVocab}
            className="px-2.5 py-1.5 rounded-xl hover:bg-[#FCFAF7] text-xs font-semibold text-[#1f1a1d] flex items-center gap-1.5 transition-colors"
            title="Save vocabulary"
          >
            <Bookmark className="w-3.5 h-3.5 text-[#EFBCD5]" />
            <span>Save Vocab</span>
          </button>
          <div className="w-[1px] h-4 bg-[#E5DFE2]" />
          <button
            onClick={handleOpenAddComment}
            className="px-2.5 py-1.5 rounded-xl hover:bg-[#FCFAF7] text-xs font-semibold text-[#1f1a1d] flex items-center gap-1.5 transition-colors"
            title="Add note"
          >
            <StickyNote className="w-3.5 h-3.5 text-[#EFBCD5]" />
            <span>Note</span>
          </button>
          <div className="w-[1px] h-4 bg-[#E5DFE2]" />
          <button
            onClick={handleOpenYouglish}
            className="px-2.5 py-1.5 rounded-xl hover:bg-[#FCFAF7] text-xs font-semibold text-[#1f1a1d] flex items-center gap-1.5 transition-colors"
            title="Search pronunciation on YouGlish"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#EFBCD5]" />
            <span>YouGlish</span>
          </button>
        </div>
      )}

      {/* Page Header */}
      <header className="mb-4">
        <Link
          to="/english/listening"
          className="font-outfit text-sm text-[#706065] hover:text-[#EFBCD5] transition-colors inline-flex items-center gap-1.5 mb-2 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Listening Library
        </Link>
        <h1 className="font-sora font-bold text-3xl text-[#201B1E] mb-1">{trackTitle}</h1>
        <div className="font-mono text-xs font-bold text-[#70495e] uppercase tracking-wider">
          {track?.level ? `${track.level} LEVEL` : "INTERMEDIATE"} • {track?.category ? track.category.toUpperCase() : "GENERAL ENGLISH"} • {formatTime(duration)}
        </div>
      </header>

      {/* Main Split Grid (Left: Audio Player & Sidebar Panels, Right: Transcript Card) */}
      <main className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Left Column: Audio Player & Sidebar Panels */}
        <div className="w-full lg:w-[45%] flex flex-col gap-6">
          {/* Audio Player Card (matching screenshot) */}
          <div className="bg-white rounded-[24px] p-6 border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] flex flex-col gap-6">
            {/* Waveform graphic visualization box */}
            <div className="flex items-center justify-center bg-[#fcf1f5]/30 rounded-2xl border border-[#E5DFE2] relative overflow-hidden h-36">
              <img
                alt="Waveform"
                className="absolute inset-0 w-full h-full object-cover opacity-75"
                src="https://lh3.googleusercontent.com/aida/AEtjO1WwJl1c6hmPxfcELA89b7qTddRYPIQVHVLTq6lcWuKXOyxGWwvneVKpSJrQmDJ_fm14EyZhDEQlmn_hLd3NUPkmTMDkbkiykK39HzfmtZg9Y6WLt7YqaCzJc0IuCSd6WxkYz30OJtyPMfag8zaawrvl_pXGUJ11cT-f5yNI9hkfFDAxrSaYm0ZmMWGJj-M62yqgSFDWozZy00tWfeuTwZvKWCiGAK1dsIq157yye7DJHr6gbwEIzdBptJA"
              />
            </div>

            {/* Seek bar track & Time labels */}
            <div className="flex flex-col gap-2 font-outfit">
              <div
                onClick={handleSeek}
                className="w-full h-2.5 bg-[#E5DFE2] rounded-full overflow-hidden relative cursor-pointer"
              >
                <div
                  className="absolute top-0 left-0 h-full bg-[#EFBCD5] rounded-full transition-all duration-150"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-sm font-semibold text-[#201B1E] font-mono pt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Centered Playback controls matching screenshot */}
            <div className="flex justify-center items-center gap-8 pt-1 relative">
              {/* Rewind 10s */}
              <button
                onClick={() => handleSkip(-10)}
                className="text-[#201B1E] hover:text-[#EFBCD5] transition-all p-2 flex items-center justify-center active:scale-95 cursor-pointer"
                title="Rewind 10 seconds"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <text x="12" y="14.5" fontSize="6.5" fontWeight="bold" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="monospace">10</text>
                </svg>
              </button>

              {/* Center Play/Pause Circle */}
              <button
                onClick={handleTogglePlay}
                className="w-16 h-16 rounded-full bg-[#EFBCD5] text-[#201B1E] flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-sm border border-[#ffd8ea] cursor-pointer flex-shrink-0"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="h-7 w-7 stroke-[2.5]" />
                ) : (
                  <Play className="h-7 w-7 stroke-[2.5] fill-current ml-1" />
                )}
              </button>

              {/* Forward 10s */}
              <button
                onClick={() => handleSkip(10)}
                className="text-[#201B1E] hover:text-[#EFBCD5] transition-all p-2 flex items-center justify-center active:scale-95 cursor-pointer"
                title="Forward 10 seconds"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <text x="12" y="14.5" fontSize="6.5" fontWeight="bold" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="monospace">10</text>
                </svg>
              </button>
            </div>
          </div>

          {/* Listening Notes & Comments Panel */}
          <div className="bg-white rounded-[24px] p-6 border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] flex-shrink-0">
            <h3 className="font-sora font-bold text-base text-[#201B1E] mb-3 flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-[#EFBCD5]" /> Listening Notes ({trackNotes.length})
            </h3>
            {trackNotes.length === 0 ? (
              <p className="text-xs text-[#706065] italic py-2">
                No notes added yet. Highlight text in the transcript to add notes & comments!
              </p>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {trackNotes.map((note) => (
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
                    <span className="text-[10px] text-zinc-400 font-mono block text-right">
                      {note.createdAt}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Saved Vocabulary in Track Panel */}
          <div className="bg-white rounded-[24px] p-6 border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] flex-shrink-0 font-outfit">
            <h3 className="font-sora font-bold text-base text-[#201B1E] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EFBCD5]" />
              <span>Saved Vocabulary in Track ({savedTrackWords.length})</span>
            </h3>
            {savedTrackWords.length === 0 ? (
              <p className="text-xs text-[#706065] italic py-2">
                No vocabulary saved from this track yet. Highlight transcript text and click "Save Vocab"!
              </p>
            ) : (
              <ul className="space-y-3 font-outfit max-h-64 overflow-y-auto pr-1">
                {savedTrackWords.map((item) => (
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
        </div>

        {/* Right Column: English Transcript Card */}
        <div className="w-full lg:w-[55%] flex flex-col gap-6">
          <div className="bg-white rounded-[24px] p-6 border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] flex-grow flex flex-col h-[650px] overflow-hidden">
            {/* Card Header */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#E5DFE2]/70">
              <h2 className="font-sora text-lg font-bold text-[#1f1a1d]">
                Transcript
              </h2>
              <span className="text-xs font-normal text-[#706065] font-outfit">
                Highlight text to save vocab, add notes, or search YouGlish
              </span>
            </div>

            {/* Sentences Transcript Scroller */}
            <div className="flex-grow overflow-y-auto pr-2 space-y-4 text-base font-outfit text-zinc-800 leading-[1.7] select-text hide-scrollbar">
              {transcriptText.split("\n\n").map((para, idx) => (
                <p key={idx} className="whitespace-pre-wrap">
                  {renderTextWithHighlights(para)}
                </p>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* COMMENT / NOTE MODAL */}
      {isCommentModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-outfit animate-in fade-in duration-200 comment-modal">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#E5DFE2] shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#E5DFE2]">
              <h3 className="font-sora font-bold text-base text-[#1f1a1d] flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-[#EFBCD5]" /> Add Note for Selection
              </h3>
              <button
                onClick={() => setIsCommentModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#FCFAF7] border border-[#E5DFE2] rounded-xl text-xs italic text-[#7b5268] border-l-4 border-l-[#EFBCD5]">
              "{selectedText}"
            </div>

            <form onSubmit={handleSaveComment} className="space-y-4">
              <textarea
                rows={3}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Type your notes or comments here..."
                className="w-full p-3 rounded-xl border border-[#E5DFE2] bg-[#FCFAF7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EFBCD5] text-sm text-[#201B1E] whitespace-pre-wrap"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCommentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#706065] hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#EFBCD5] text-[#201B1E] hover:opacity-90"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOCABULARY MODAL */}
      <VocabularyModal
        isOpen={isVocabModalOpen}
        onClose={() => {
          setIsVocabModalOpen(false)
          setPrefilledVocabItem(null)
        }}
        initialData={prefilledVocabItem}
      />
    </div>
  )
}
