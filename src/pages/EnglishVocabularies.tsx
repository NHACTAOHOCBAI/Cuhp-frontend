import * as React from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { useVocabulariesQuery, useReviewVocabulary } from "@/features/vocabulary/hooks"
import { Sparkles, X, Check } from "lucide-react"
import { toast } from "sonner"
import type { EnglishOutletContext } from "@/components/EnglishLayout"

export default function EnglishVocabularies() {
  const navigate = useNavigate()
  const { restartKey } = useOutletContext<EnglishOutletContext>()

  // Current flashcard index
  const [currentCardIndex, setCurrentCardIndex] = React.useState(0)
  // Reveal flashcard meaning
  const [revealMeaning, setRevealMeaning] = React.useState(false)

  // 1. Fetch due vocabularies for review
  const { data: dueVocab, isLoading: isDueLoading } = useVocabulariesQuery({
    due: true,
    page_size: 100,
  })

  // 2. Fetch all vocabularies to compute Box status counts
  const { data: allVocab, isLoading: isAllLoading } = useVocabulariesQuery({
    page_size: 1000,
  })

  // 3. Review mutation
  const reviewMutation = useReviewVocabulary()

  // Reset indices when restartKey triggers from Layout sidebar
  React.useEffect(() => {
    setCurrentCardIndex(0)
    setRevealMeaning(false)
  }, [restartKey])

  // Calculate box counts
  const boxCounts = React.useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    if (!allVocab?.items) return counts
    allVocab.items.forEach((item) => {
      const box = item.box_number || 1
      if (box >= 1 && box <= 5) {
        counts[box as 1 | 2 | 3 | 4 | 5]++
      }
    })
    return counts
  }, [allVocab])

  // Get current word
  const currentWord = React.useMemo(() => {
    if (!dueVocab?.items || dueVocab.items.length === 0) return null
    if (currentCardIndex >= dueVocab.items.length) return null
    return dueVocab.items[currentCardIndex]
  }, [dueVocab, currentCardIndex])

  // Total due words count
  const dueTotal = dueVocab?.total ?? 0

  // Handle flashcard review
  const handleReview = (known: boolean) => {
    if (!currentWord) return

    reviewMutation.mutate(
      {
        id: currentWord.id,
        payload: { known },
      },
      {
        onSuccess: () => {
          if (known) {
            toast.success(`Great! You knew "${currentWord.word}".`)
          } else {
            toast.info(`Saved. "${currentWord.word}" was moved back to Box 1 for review tomorrow.`)
          }

          // Reset reveal meaning state
          setRevealMeaning(false)
          // Move to next card
          setCurrentCardIndex((prev) => prev + 1)
        },
        onError: (err) => {
          toast.error(`Vocabulary review error: ${err.message}`)
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="mt-4 mb-6">
        <h1 className="font-sora font-bold text-3xl mb-2 text-[#201B1E] tracking-tight">
          Vocabulary Review
        </h1>
        <p className="font-outfit font-normal text-base text-[#706065]">
          Daily Leitner System Session
        </p>
      </header>

      <section className="flex flex-col lg:flex-row gap-[24px] items-start w-full">
        {/* SRS Sidebar Box Counts */}
        <div className="w-full lg:w-64 flex flex-col gap-[8px] flex-shrink-0">
          <div className="bg-white rounded-[24px] p-[24px] border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239, 188, 213, 0.15)] flex flex-col gap-[12px] w-full font-outfit">
            <h3 className="font-sora text-lg font-bold text-[#1f1a1d] mb-[12px]">
              SRS Status
            </h3>
            <div className="flex justify-between items-center pb-[12px] border-b border-[#E5DFE2]/70">
              <span className="text-sm text-[#706065] font-semibold">Box 1 (Daily)</span>
              <span className="text-sm font-bold text-[#EFBCD5]">
                {isAllLoading ? "..." : `${boxCounts[1]} words`}
              </span>
            </div>
            <div className="flex justify-between items-center pb-[12px] border-b border-[#E5DFE2]/70">
              <span className="text-sm text-[#706065] font-semibold">Box 2 (2 Days)</span>
              <span className="text-sm font-semibold text-[#1f1a1d]">
                {isAllLoading ? "..." : `${boxCounts[2]} words`}
              </span>
            </div>
            <div className="flex justify-between items-center pb-[12px] border-b border-[#E5DFE2]/70">
              <span className="text-sm text-[#706065] font-semibold">Box 3 (1 Week)</span>
              <span className="text-sm font-semibold text-[#1f1a1d]">
                {isAllLoading ? "..." : `${boxCounts[3]} words`}
              </span>
            </div>
            <div className="flex justify-between items-center pb-[12px] border-b border-[#E5DFE2]/70">
              <span className="text-sm text-[#706065] font-semibold">Box 4 (1 Month)</span>
              <span className="text-sm font-semibold text-[#1f1a1d]">
                {isAllLoading ? "..." : `${boxCounts[4]} words`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#706065] font-semibold">Box 5 (Mastered)</span>
              <span className="text-sm font-semibold text-[#1f1a1d]">
                {isAllLoading ? "..." : `${boxCounts[5]} words`}
              </span>
            </div>
          </div>
        </div>

        {/* Main Flashcard Card Area */}
        <div className="flex-grow w-full flex flex-col items-center">
          {isDueLoading ? (
            <div className="bg-white w-full max-w-xl rounded-[24px] border border-[#E5DFE2] p-[24px] shadow-[0_10px_30px_-5px_rgba(239, 188, 213, 0.15)] flex flex-col items-center justify-center min-h-[400px] animate-pulse">
              <div className="h-8 bg-zinc-100 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-zinc-50 rounded w-1/4 mb-12"></div>
              <div className="h-6 bg-zinc-100 rounded w-5/6"></div>
            </div>
          ) : !dueVocab?.items || dueVocab.items.length === 0 || currentCardIndex >= dueVocab.items.length ? (
            <div className="bg-white w-full max-w-xl rounded-[24px] border border-[#E5DFE2] p-[24px] shadow-[0_10px_30px_-5px_rgba(239, 188, 213, 0.15)] flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-[#fcf1f5] rounded-full flex items-center justify-center text-[#EFBCD5] border border-[#ffd8ea] animate-bounce">
                  <Sparkles className="h-8 w-8 fill-current" />
                </div>
              </div>
              <h3 className="font-sora font-bold text-2xl text-[#1f1a1d] mb-2">
                Excellent!
              </h3>
              <p className="font-outfit text-sm text-[#706065] max-w-sm mb-6">
                You've reviewed all due words for today. Keep your streak going!
              </p>
              <button
                onClick={() => navigate("/")}
                className="px-6 py-2.5 bg-[#EFBCD5] text-[#201B1E] rounded-xl font-sora font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-sm"
              >
                Back to Hub
              </button>
            </div>
          ) : (
            (() => {
              const wordItem = currentWord!;
              return (
                <div className="bg-white w-full max-w-xl rounded-[24px] p-[24px] border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239, 188, 213, 0.15)] flex flex-col items-center text-center relative min-h-[400px] justify-between transition-all duration-300">
                  {/* Top Progress bar */}
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-zinc-100 rounded-t-[24px] overflow-hidden">
                    <div
                      className="h-full bg-[#EFBCD5] rounded-r-full transition-all duration-300"
                      style={{
                        width: `${((currentCardIndex) / dueTotal) * 100}%`,
                      }}
                    ></div>
                  </div>

                  <div className="w-full flex-grow flex flex-col justify-center py-6">
                    {/* Word Card */}
                    <div className="mb-6">
                      <span className="font-mono text-xs font-bold text-[#706065] uppercase tracking-wider bg-[#fcf1f5] px-3 py-1 rounded-full border border-[#eae0e4]">
                        Box {wordItem.box_number || 1}
                      </span>
                      <h2 className="font-sora text-[44px] font-bold text-[#1f1a1d] mt-4 tracking-tight">
                        {wordItem.word}
                      </h2>
                      {wordItem.pronunciation && (
                        <p className="font-outfit text-sm text-[#EFBCD5] font-semibold tracking-wide mt-1.5 font-mono">
                          {wordItem.pronunciation}
                        </p>
                      )}
                      {wordItem.word_type && (
                        <span className="text-xs font-bold uppercase font-mono text-[#706065]/60 block mt-1">
                          ({wordItem.word_type})
                        </span>
                      )}
                    </div>

                    {/* Revealed Meaning Area */}
                    {revealMeaning ? (
                      <div className="space-y-4 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <p className="font-sora text-lg text-[#201B1E] font-semibold leading-relaxed">
                          {wordItem.meaning}
                        </p>
                        {wordItem.context_sentence && (
                          <p className="font-outfit text-sm text-[#706065] italic leading-relaxed bg-[#FCFAF7] p-3.5 rounded-xl border border-[#E5DFE2]/60">
                            "{wordItem.context_sentence}"
                          </p>
                        )}
                        {wordItem.notes && (
                          <p className="text-xs font-mono text-[#7b5268] bg-[#fcf1f5]/55 p-2 rounded-lg border border-[#ffd8ea]/50">
                            Notes: {wordItem.notes}
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setRevealMeaning(true)}
                        className="mx-auto mt-4 px-6 py-2.5 bg-[#fcf1f5] text-[#7b5268] border border-[#d2c2c8] rounded-xl font-sora font-semibold text-xs hover:bg-[#EFBCD5]/20 active:scale-95 transition-all"
                      >
                        Show meaning
                      </button>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-[24px] w-full justify-center mt-6">
                    <button
                      onClick={() => handleReview(false)}
                      className="flex-1 py-3 px-6 rounded-[24px] border border-[#E5DFE2] text-[#706065] font-sora text-base font-bold hover:bg-zinc-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <X className="h-4.5 w-4.5 text-red-500 stroke-[2.5px]" />
                      <span>Forgot</span>
                    </button>
                    <button
                      onClick={() => handleReview(true)}
                      className="flex-1 py-3 px-6 rounded-[24px] bg-[#EFBCD5] text-[#201B1E] font-sora text-base font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 border border-[#ffd8ea]"
                    >
                      <Check className="h-4.5 w-4.5 text-[#201B1E] stroke-[3px]" />
                      <span>Remembered</span>
                    </button>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </section>
    </div>
  )
}
