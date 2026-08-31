import { useAuth } from "@/hooks/useAuth"
import { useVocabulariesQuery } from "@/features/vocabulary/hooks"
import { BookMarked } from "lucide-react"

export default function EnglishAnalytics() {
  const { user } = useAuth()

  // Fetch all vocabularies to count total words
  const { data: allVocab } = useVocabulariesQuery({
    page_size: 1,
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-sora font-bold text-[32px] text-[#1f1a1d] tracking-tight">
          English Hub Analytics
        </h1>
        <p className="font-outfit text-[16px] text-[#706065] mt-1">
          Your learning progress statistics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-outfit">
        <div className="glass-card bg-white border border-[#E5DFE2] rounded-[24px] p-6 shadow-[0_10px_30px_-5px_rgba(239, 188, 213, 0.15)] space-y-4">
          <h3 className="font-sora font-bold text-lg text-[#201B1E]">Review Progress</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm font-semibold">
              <span>Total words in library</span>
              <span className="font-mono">{allVocab?.total ?? 0} words</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span>Reviewed today</span>
              <span className="font-mono">{user?.words_reviewed_today ?? 0} words</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span>Daily goal reached</span>
              <span className="font-mono">
                {Math.round(((user?.words_reviewed_today ?? 0) / (user?.daily_target ?? 1)) * 100)}%
              </span>
            </div>
          </div>
        </div>

        <div className="glass-card bg-white border border-[#E5DFE2] rounded-[24px] p-6 shadow-[0_10px_30px_-5px_rgba(239, 188, 213, 0.15)] flex flex-col justify-center items-center text-center">
          <BookMarked className="h-12 w-12 text-[#EFBCD5] stroke-[1.25] mb-3 animate-pulse" />
          <p className="text-sm font-medium text-[#706065]">
            Your Leitner system is running smoothly to strengthen long-term memory.
          </p>
        </div>
      </div>
    </div>
  )
}
