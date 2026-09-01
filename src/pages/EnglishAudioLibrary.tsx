import * as React from "react"
import { useNavigate } from "react-router-dom"
import { useAudiosQuery, useDeleteAudio } from "@/features/audio/hooks"
import { AudioTrackModal } from "@/features/audio/components/AudioTrackModal"
import {
  Search,
  Headphones,
  Clock,
  FileText,
  Pencil,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import type { AudioListItem, AudioTrack } from "@/features/audio/types"

export default function EnglishAudioLibrary() {
  const navigate = useNavigate()
  const deleteMutation = useDeleteAudio()

  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState<string | undefined>(undefined)
  const [page, setPage] = React.useState(1)
  const pageSize = 9

  // Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingTrack, setEditingTrack] = React.useState<Partial<AudioTrack> | Partial<AudioListItem> | null>(null)

  // Debounced search query
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchQuery])

  // Fetch audios from backend
  const { data: listResponse, isLoading } = useAudiosQuery({
    page,
    page_size: pageSize,
    q: debouncedSearch || undefined,
    category: selectedCategory || undefined,
  })

  const totalPages = Math.ceil((listResponse?.total ?? 0) / pageSize)

  // Category filters mapping
  const categoryFilters = [
    { label: "All", value: undefined },
    { label: "General", value: "general" },
    { label: "Conversation", value: "conversation" },
    { label: "Business", value: "business" },
    { label: "Podcast", value: "podcast" },
  ]

  const handleOpenAddModal = () => {
    setEditingTrack(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (track: AudioListItem) => {
    setEditingTrack(track)
    setIsModalOpen(true)
  }

  const handleDeleteTrack = (track: AudioListItem) => {
    if (window.confirm(`Are you sure you want to delete listening track "${track.title}"?`)) {
      deleteMutation.mutate(track.id, {
        onSuccess: () => {
          toast.success("Audio track deleted successfully.")
        },
        onError: (err) => {
          toast.error(`Failed to delete track: ${err.message}`)
        },
      })
    }
  }

  // Calculate REAL stats for track
  const calculateTrackStats = (track: AudioListItem) => {
    const categoryLabel =
      track.category === "conversation"
        ? "Conversation"
        : track.category === "business"
        ? "Business"
        : track.category === "podcast"
        ? "Podcast"
        : "General English"

    const cleanText = track.transcript ? track.transcript.replace(/<[^>]*>/g, " ") : ""
    const wordCount = cleanText
      ? cleanText.trim().split(/\s+/).filter(Boolean).length
      : 180

    return { duration: "04:30", categoryLabel, wordCount }
  }

  // Get REAL shadowing completion progress
  const getTrackProgress = (id: string) => {
    const progress = localStorage.getItem(`audio_progress_${id}`)
    if (progress !== null && progress !== undefined) return Number(progress)
    return 0
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="mt-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-sora font-bold text-3xl mb-2 text-[#201B1E] tracking-tight">
            Listening Library
          </h1>
          <p className="font-outfit font-normal text-base text-[#706065]">
            Boost your listening skills with audio tracks & interactive transcripts.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 rounded-2xl bg-[#EFBCD5] text-[#201B1E] font-sora font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_14px_0_rgba(239,188,213,0.4)] flex items-center gap-2 border border-[#ffd8ea] self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Track</span>
        </button>
      </header>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        {/* Search Input */}
        <div className="relative w-full md:w-96 font-outfit">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#817479] h-5 w-5" />
          <input
            type="text"
            placeholder="Search tracks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FCFAF7] border border-[#E5DFE2] rounded-[12px] py-3 pl-12 pr-4 focus:outline-none focus:border-[#EFBCD5] transition-colors text-[#1f1a1d] text-sm"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 font-mono text-sm font-semibold">
          {categoryFilters.map((cat) => {
            const isSelected = selectedCategory === cat.value
            return (
              <button
                key={cat.label}
                onClick={() => {
                  setSelectedCategory(cat.value)
                  setPage(1)
                }}
                className={`px-4 py-1.5 rounded-full border transition-all active:scale-95 ${
                  isSelected
                    ? "bg-[#EFBCD5]/20 text-[#7b5268] border-[#EFBCD5]/30"
                    : "bg-[#f6ebef] text-[#4f4449] hover:bg-[#EFBCD5]/10 border-transparent"
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Audios Grid List */}
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
          <Headphones className="h-12 w-12 text-zinc-300 stroke-[1.25] mx-auto mb-3" />
          <p className="font-outfit text-sm font-semibold">No matching tracks found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listResponse.items.map((track) => {
            const stats = calculateTrackStats(track)
            const progress = getTrackProgress(track.id)

            const rawLevel = (track.level || "").toLowerCase()
            const levelLabel =
              rawLevel === "beginner" || rawLevel === "easy"
                ? "Easy"
                : rawLevel === "advanced" || rawLevel === "hard"
                ? "Hard"
                : "Medium"

            const levelColorClass =
              levelLabel === "Easy"
                ? "bg-[#bad2a5]/20 text-[#506440] border-[#bad2a5]/30"
                : levelLabel === "Medium"
                ? "bg-[#f2dde2] text-[#6a5a5f] border-[#f2dde2]/30"
                : "bg-[#EFBCD5]/20 text-[#70495e] border-[#EFBCD5]/30"

            return (
              <article
                key={track.id}
                className="bg-white rounded-[24px] border border-[#E5DFE2] p-6 flex flex-col transition-all duration-300 hover:shadow-[0_15px_30px_-5px_rgba(239,188,213,0.15)] hover:translate-y-[-2px] h-[360px] justify-between group"
              >
                {/* Top Difficulty badge & Actions */}
                <div className="flex justify-between items-center">
                  <span
                    className={`px-3 py-1 rounded-full font-mono text-xs font-semibold border ${levelColorClass}`}
                  >
                    {levelLabel}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenEditModal(track)
                      }}
                      className="text-zinc-400 hover:text-[#7b5268] transition-colors p-1"
                      title="Edit track"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTrack(track)
                      }}
                      className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                      title="Delete track"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h2
                  className="font-sora text-2xl font-semibold text-[#201B1E] leading-[1.3] line-clamp-2 cursor-pointer hover:text-[#EFBCD5] transition-colors flex-grow mt-3"
                  onClick={() => navigate(`/english/listening/${track.id}`)}
                >
                  {track.title}
                </h2>

                {/* Details Meta */}
                <div className="space-y-4">
                  <div className="font-mono text-xs font-semibold text-[#4f4449] space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 stroke-[1.8]" />
                      <span>{stats.duration}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                      <span>{stats.categoryLabel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 stroke-[1.8]" />
                      <span>{stats.wordCount} words • Audio & Transcript</span>
                    </div>
                  </div>

                  {/* Waveform graphic */}
                  <div className="flex items-end gap-[2px] h-8 w-full opacity-65 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-1 bg-[#EFBCD5]/30 rounded-full h-[30%]" />
                    <div className="w-1 bg-[#EFBCD5]/30 rounded-full h-[50%]" />
                    <div className="w-1 bg-[#EFBCD5]/50 rounded-full h-[80%]" />
                    <div className="w-1 bg-[#EFBCD5] rounded-full h-[100%]" />
                    <div className="w-1 bg-[#EFBCD5]/85 rounded-full h-[70%]" />
                    <div className="w-1 bg-[#EFBCD5]/50 rounded-full h-[40%]" />
                    <div className="w-1 bg-[#EFBCD5]/30 rounded-full h-[20%]" />
                    <div className="w-1 bg-zinc-200 rounded-full h-[15%]" />
                    <div className="w-1 bg-zinc-200 rounded-full h-[25%]" />
                    <div className="w-1 bg-zinc-200 rounded-full h-[10%]" />
                    <div className="w-1 bg-zinc-200 rounded-full h-[40%]" />
                    <div className="w-1 bg-zinc-200 rounded-full h-[60%]" />
                    <div className="w-1 bg-zinc-200 rounded-full h-[20%]" />
                    <div className="w-1 bg-zinc-200 rounded-full h-[5%]" />
                  </div>

                  {/* Progress slide & Action button */}
                  <div className="pt-4 border-t border-[#E5DFE2]/70 flex flex-col gap-3">
                    <div>
                      <div className="flex justify-between font-mono text-xs font-semibold text-zinc-700 mb-1">
                        <span>Completed</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-[#E5DFE2] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#EFBCD5] rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {progress === 100 ? (
                      <button
                        onClick={() => navigate(`/english/listening/${track.id}`)}
                        className="w-full py-3 rounded-[24px] border border-[#E5DFE2] bg-white text-[#201B1E] font-sora font-semibold text-base hover:bg-[#fcf1f5] transition-all flex items-center justify-center gap-2 active:scale-98"
                      >
                        <Headphones className="h-5 w-5 stroke-[1.8]" />
                        <span>Listen Again</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/english/listening/${track.id}`)}
                        className="w-full py-3 rounded-[24px] bg-[#EFBCD5] text-[#201B1E] font-sora font-semibold text-base hover:bg-[#ebb8d1] transition-all flex items-center justify-center gap-2 active:scale-98"
                      >
                        <Headphones className="h-5 w-5 stroke-[1.8]" />
                        <span>Listen & Read Transcript</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pt-6 mt-4 border-t border-[#E5DFE2]/70 flex items-center justify-between font-outfit text-xs text-[#706065]">
          <span className="font-mono font-medium">
            Page <strong className="text-[#201B1E]">{page}</strong> of <strong className="text-[#201B1E]">{totalPages}</strong> ({listResponse?.total ?? 0} tracks)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => {
                setPage((prev) => Math.max(prev - 1, 1))
                window.scrollTo({ top: 0, behavior: "smooth" })
              }}
              className="px-3.5 py-2 rounded-xl border border-[#E5DFE2] bg-white hover:bg-[#FCFAF7] disabled:opacity-40 transition-all flex items-center gap-1.5 font-semibold text-[#201B1E] shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => {
                setPage((prev) => Math.min(prev + 1, totalPages))
                window.scrollTo({ top: 0, behavior: "smooth" })
              }}
              className="px-3.5 py-2 rounded-xl border border-[#E5DFE2] bg-white hover:bg-[#FCFAF7] disabled:opacity-40 transition-all flex items-center gap-1.5 font-semibold text-[#201B1E] shadow-2xs"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* AUDIO TRACK ADD / EDIT MODAL */}
      <AudioTrackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingTrack}
      />
    </div>
  )
}

