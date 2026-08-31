import * as React from "react"
import { useNavigate } from "react-router-dom"
import { useAudiosQuery } from "@/features/audio/hooks"
import { Search, Headphones, Clock, Mic, Bookmark, RotateCcw } from "lucide-react"

export default function EnglishAudioLibrary() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState<string | undefined>(undefined)

  // Debounced search query
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchQuery])

  // Fetch audios from backend
  const { data: listResponse, isLoading } = useAudiosQuery({
    q: debouncedSearch || undefined,
    category: selectedCategory || undefined,
  })

  // Category filters mapping (matching Stitch design labels)
  const categoryFilters = [
    { label: "All", value: undefined },
    { label: "Podcast", value: "general" },
    { label: "Conversation", value: "conversation" },
    { label: "News", value: "business" },
  ]

  // Estimate audio track stats
  const estimateTrackStats = (title: string, id: string) => {
    const seed = title.length + id.length
    if (title.toLowerCase().includes("slow living")) {
      return { duration: "04:30", categoryLabel: "Conversation", questionsCount: 6 }
    }
    if (title.toLowerCase().includes("routine")) {
      return { duration: "06:15", categoryLabel: "Podcast", questionsCount: 8 }
    }
    const mins = 3 + (seed % 4)
    const secs = 10 + (seed % 50)
    const duration = `0${mins}:${secs < 10 ? "0" + secs : secs}`
    const categoryLabel = seed % 2 === 0 ? "Podcast" : "Conversation"
    const questionsCount = 4 + (seed % 6)
    return { duration, categoryLabel, questionsCount }
  }

  // Get shadowing completion progress
  const getTrackProgress = (id: string) => {
    const progress = localStorage.getItem(`audio_progress_${id}`)
    if (progress) return Number(progress)
    // Generate deterministic mock progress values for aesthetic visual completeness
    if (id.includes("aud-")) {
      const idx = id.charCodeAt(id.length - 1) % 3
      if (idx === 0) return 0
      if (idx === 1) return 40
      return 100
    }
    return 0
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="mt-4 mb-6">
        <h1 className="font-sora font-bold text-[32px] mb-2 text-[#201B1E] tracking-tight">
          Listening Library
        </h1>
        <p className="font-outfit font-normal text-[16px] text-[#706065]">
          Boost your listening skills with carefully designed shadowing exercises.
        </p>
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

        {/* Category Filters (Stitch style pills) */}
        <div className="flex flex-wrap gap-3 font-mono text-[14px] font-medium">
          {categoryFilters.map((cat) => {
            const isSelected = selectedCategory === cat.value
            return (
              <button
                key={cat.label}
                onClick={() => setSelectedCategory(cat.value)}
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
          <p className="font-outfit text-sm font-medium">No matching tracks found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listResponse.items.map((track) => {
            const stats = estimateTrackStats(track.title, track.id)
            const progress = getTrackProgress(track.id)

            // Setup level badge style matching Stitch
            const levelLabel =
              track.level === "beginner"
                ? "Easy"
                : track.level === "intermediate"
                ? "Medium"
                : "Hard"

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
                {/* Top Difficulty badge & Bookmark button */}
                <div className="flex justify-between items-start">
                  <span
                    className={`px-3 py-1 rounded-full font-mono text-[12px] font-medium border ${levelColorClass}`}
                  >
                    {levelLabel}
                  </span>
                  <button className="text-[#817479] hover:text-[#EFBCD5] transition-colors p-1">
                    <Bookmark className="h-5 w-5 stroke-[1.8]" />
                  </button>
                </div>

                {/* Title */}
                <h2 className="font-sora text-[24px] font-semibold text-[#201B1E] leading-[1.3] line-clamp-2 cursor-pointer hover:text-[#EFBCD5] transition-colors flex-grow mt-3" onClick={() => navigate(`/english/listening/${track.id}`)}>
                  {track.title}
                </h2>

                {/* Details Meta */}
                <div className="space-y-4">
                  <div className="font-mono text-[12px] font-medium text-[#4f4449] space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 stroke-[1.8]" />
                      <span>{stats.duration}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                      <span>{stats.categoryLabel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4 stroke-[1.8]" />
                      <span>{stats.questionsCount} shadowing sentences</span>
                    </div>
                  </div>

                  {/* Simulated Waveform Visualization */}
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
                      <div className="flex justify-between font-mono text-[12px] font-medium text-zinc-700 mb-1">
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
                        className="w-full py-3 rounded-[24px] border border-[#E5DFE2] bg-white text-[#201B1E] font-sora font-semibold text-[16px] hover:bg-[#fcf1f5] transition-all flex items-center justify-center gap-2 active:scale-98"
                      >
                        <RotateCcw className="h-5 w-5 stroke-[1.8]" />
                        <span>Practice Shadowing</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/english/listening/${track.id}`)}
                        className="w-full py-3 rounded-[24px] bg-[#EFBCD5] text-[#201B1E] font-sora font-semibold text-[16px] hover:bg-[#ebb8d1] transition-all flex items-center justify-center gap-2 active:scale-98"
                      >
                        <Mic className="h-5 w-5 stroke-[1.8]" />
                        <span>Practice Shadowing</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
