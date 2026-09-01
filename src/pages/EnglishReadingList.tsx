import * as React from "react"
import { useNavigate } from "react-router-dom"
import { useReadingPassagesQuery, useDeleteReadingPassage } from "@/features/reading/hooks"
import { useVocabulariesQuery } from "@/features/vocabulary/hooks"
import { ReadingPassageModal } from "@/features/reading/components/ReadingPassageModal"
import { Search, BookOpen, Clock, Languages, Pencil, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import type { ReadingPassage, ReadingPassageListItem } from "@/features/reading/types"

export default function EnglishReadingList() {
  const navigate = useNavigate()
  const deleteMutation = useDeleteReadingPassage()

  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedLevel, setSelectedLevel] = React.useState<string | undefined>(undefined)

  // Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingPassage, setEditingPassage] = React.useState<Partial<ReadingPassage> | null>(null)

  // Debounced search query
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchQuery])

  // Fetch passages based on search and level
  const { data: listResponse, isLoading } = useReadingPassagesQuery({
    q: debouncedSearch || undefined,
    level: selectedLevel || undefined,
  })

  const levelFilters = [
    { label: "All", value: undefined },
    { label: "Easy", value: "A1" },
    { label: "Medium", value: "B1" },
    { label: "Hard", value: "C1" },
  ]

  const handleOpenAddModal = () => {
    setEditingPassage(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (passage: ReadingPassageListItem) => {
    setEditingPassage(passage)
    setIsModalOpen(true)
  }

  const handleDeletePassage = (passage: ReadingPassageListItem) => {
    if (window.confirm(`Are you sure you want to delete "${passage.title}"?`)) {
      deleteMutation.mutate(passage.id, {
        onSuccess: () => {
          toast.success(`Deleted passage "${passage.title}"`)
        },
        onError: (err) => {
          toast.error(`Failed to delete passage: ${err.message}`)
        },
      })
    }
  }

  // Fetch user vocabulary list to count real saved words per passage
  const { data: userVocab } = useVocabulariesQuery({ page_size: 1000 })

  // Calculate REAL stats for passage
  const calculatePassageStats = (passage: ReadingPassageListItem) => {
    let words = 500
    if (passage.content && passage.content.trim().length > 0) {
      words = passage.content.trim().split(/\s+/).length
    }
    const minutes = Math.max(1, Math.ceil(words / 150))

    // Count real saved words for this passage
    let newWordsCount = 0
    if (userVocab?.items) {
      const titleLower = passage.title.toLowerCase()
      const contentLower = (passage.content || "").toLowerCase()
      newWordsCount = userVocab.items.filter((item) => {
        const noteMatches = item.notes?.toLowerCase().includes(titleLower)
        const textMatches = contentLower.length > 0 && contentLower.includes(item.word.toLowerCase())
        return noteMatches || textMatches
      }).length
    }

    return { words, minutes, newWords: newWordsCount }
  }

  // Calculate REAL progress for passage
  const getPassageProgress = (id: string) => {
    const progress = localStorage.getItem(`passage_progress_${id}`)
    if (progress !== null && progress !== undefined) return Number(progress)
    const read = localStorage.getItem(`read_passage_${id}`)
    if (read === "true") return 100
    return 0
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="mt-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-sora font-bold text-3xl mb-2 text-[#201B1E] tracking-tight">
            Reading Library
          </h1>
          <p className="font-outfit font-normal text-base text-[#706065]">
            Explore and practice your reading comprehension
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 rounded-2xl bg-[#EFBCD5] text-[#201B1E] font-sora font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_14px_0_rgba(239,188,213,0.4)] flex items-center gap-2 border border-[#ffd8ea] self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Passage</span>
        </button>
      </header>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        {/* Search Input */}
        <div className="relative w-full md:w-96 font-outfit">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#817479] h-5 w-5" />
          <input
            type="text"
            placeholder="Search passages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FCFAF7] border border-[#E5DFE2] rounded-[12px] py-3 pl-12 pr-4 focus:outline-none focus:border-[#EFBCD5] transition-colors text-[#1f1a1d] text-sm"
          />
        </div>

        {/* Level Filters */}
        <div className="flex flex-wrap gap-3 font-mono text-sm font-semibold">
          {levelFilters.map((lvl) => {
            const isSelected = selectedLevel === lvl.value
            return (
              <button
                key={lvl.value ?? "all"}
                onClick={() => setSelectedLevel(lvl.value)}
                className={`px-4 py-1.5 rounded-full border transition-all active:scale-95 ${
                  isSelected
                    ? "bg-[#EFBCD5]/20 text-[#7b5268] border-[#EFBCD5]/30"
                    : "bg-[#f6ebef] text-[#4f4449] hover:bg-[#EFBCD5]/10 border-transparent"
                }`}
              >
                {lvl.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Passages Grid List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-[24px] border border-[#E5DFE2] p-6 flex flex-col min-h-[250px] animate-pulse space-y-4"
            >
              <div className="h-5 bg-zinc-100 rounded w-1/4"></div>
              <div className="h-8 bg-zinc-100 rounded w-3/4"></div>
              <div className="h-4 bg-zinc-50 rounded w-1/2 mt-auto"></div>
            </div>
          ))}
        </div>
      ) : !listResponse?.items || listResponse.items.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#E5DFE2] rounded-[24px] text-[#706065]">
          <BookOpen className="h-12 w-12 text-zinc-300 stroke-[1.25] mx-auto mb-3" />
          <p className="font-outfit text-sm font-semibold">No matching passages found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listResponse.items.map((passage) => {
            const stats = calculatePassageStats(passage)
            const progress = getPassageProgress(passage.id)

            const rawLevel = (passage.level || "").toUpperCase()
            const levelLabel =
              rawLevel === "A1" || rawLevel === "A2" || rawLevel === "EASY"
                ? "Easy"
                : rawLevel === "C1" || rawLevel === "C2" || rawLevel === "HARD"
                ? "Hard"
                : "Medium"

            const levelColorClass =
              levelLabel === "Easy"
                ? "bg-[#bad2a5]/20 text-[#506440]"
                : levelLabel === "Medium"
                ? "bg-[#f2dde2] text-[#6a5a5f]"
                : "bg-[#EFBCD5]/20 text-[#70495e]"

            const progressText =
              progress === 100 ? "Completed" : progress > 0 ? "Reading" : "Not started"
            
            const progressTextColorClass =
              progress === 100 ? "text-[#EFBCD5]" : "text-[#4f4449]"

            return (
              <article
                key={passage.id}
                className="bg-white rounded-[24px] border border-[#E5DFE2] p-6 flex flex-col transition-all duration-300 hover:shadow-[0_15px_30px_-5px_rgba(239,188,213,0.15)] hover:translate-y-[-2px] h-[340px] justify-between group"
              >
                {/* Top Difficulty badge & Actions */}
                <div className="flex justify-between items-center">
                  <span
                    className={`px-3 py-1 rounded-full font-mono text-xs font-semibold ${levelColorClass}`}
                  >
                    {levelLabel}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenEditModal(passage)
                      }}
                      className="text-zinc-400 hover:text-[#7b5268] transition-colors p-1"
                      title="Edit passage"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeletePassage(passage)
                      }}
                      className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                      title="Delete passage"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h2
                  className="font-sora text-2xl font-semibold text-[#201B1E] leading-[1.3] line-clamp-2 cursor-pointer hover:text-[#EFBCD5] transition-colors flex-grow mt-3"
                  onClick={() => navigate(`/english/reading/${passage.id}`)}
                >
                  {passage.title}
                </h2>

                {/* Stats and actions column aligned at bottom */}
                <div className="space-y-4 mt-auto">
                  {/* Mono text stats block */}
                  <div className="font-mono text-xs font-semibold text-[#4f4449] flex items-center gap-2 flex-wrap">
                    <BookOpen className="h-4.5 w-4.5 stroke-[1.8]" />
                    <span>{stats.words} words</span>
                    <span className="text-zinc-300">•</span>
                    <Clock className="h-4.5 w-4.5 stroke-[1.8]" />
                    <span>{stats.minutes} min read</span>
                    <span className="text-zinc-300">•</span>
                    <Languages className="h-4.5 w-4.5 stroke-[1.8]" />
                    <span>{stats.newWords} new words</span>
                  </div>

                  {/* Horizontal progress bar */}
                  <div>
                    <div className={`flex justify-between font-mono text-xs font-semibold mb-1 ${progressTextColorClass}`}>
                      <span>{progressText}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-[#E5DFE2] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#EFBCD5] rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Primary interactive button */}
                  <button
                    onClick={() => navigate(`/english/reading/${passage.id}`)}
                    className={`w-full py-3 rounded-[24px] font-sora font-semibold text-base transition-colors flex items-center justify-center gap-2 ${
                      progress === 100
                        ? "border border-[#E5DFE2] bg-white text-[#201B1E] hover:bg-[#fcf1f5]"
                        : "bg-[#EFBCD5] text-[#201B1E] hover:bg-[#ebb8d1]"
                    }`}
                  >
                    <Languages className="h-5 w-5 stroke-[1.8]" />
                    <span>{progress === 100 ? "Read Bilingual" : progress > 0 ? "Continue Reading" : "Read Bilingual"}</span>
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* READING PASSAGE ADD / EDIT MODAL */}
      <ReadingPassageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingPassage}
      />
    </div>
  )
}
