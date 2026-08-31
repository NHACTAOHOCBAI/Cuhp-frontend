import * as React from "react"
import { useParams, Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import {
  useReadingPassageById,
  useTranslationPracticeQuery,
  useSaveTranslationPractice,
} from "@/features/reading/hooks"
import { useCreateVocabulary } from "@/features/vocabulary/hooks"
import { lookupVocabularyWord } from "@/features/vocabulary/api"
import { ArrowLeft, Languages, Check, Save } from "lucide-react"
import { toast } from "sonner"

interface LookupData {
  word: string
  pronunciation?: string | null
  meaning?: string | null
  word_type?: string | null
}

export default function EnglishReadingDetail() {
  const { id } = useParams<{ id: string }>()
  const { token } = useAuth()

  // 1. Fetch reading passage details
  const { data: passage, isLoading: isPassageLoading } = useReadingPassageById(id)

  // 2. Fetch user's translation practice
  const { data: practice } = useTranslationPracticeQuery(id)

  // 3. Save translation practice mutation
  const saveTranslationMutation = useSaveTranslationPractice(id!)

  // 4. Save word to Leitner mutation
  const createVocabMutation = useCreateVocabulary()

  // Local state for translation text input
  const [translationText, setTranslationText] = React.useState("")

  // Set translation text when loaded from server
  React.useEffect(() => {
    if (practice) {
      setTranslationText(practice.translation_content)
    }
  }, [practice])

  // Mark passage as read in localStorage when first opening
  React.useEffect(() => {
    if (id) {
      localStorage.setItem(`read_passage_${id}`, "true")
    }
  }, [id])

  // Local state for word click-to-lookup feature
  const [lookupWord, setLookupWord] = React.useState<string | null>(null)
  const [lookupData, setLookupData] = React.useState<LookupData | null>(null)
  const [lookupLoading, setLookupLoading] = React.useState(false)
  const [popupPos, setPopupPos] = React.useState<{ x: number; y: number } | null>(null)

  // Dictionary lookup when clicking on a word
  const handleWordClick = async (e: React.MouseEvent, word: string) => {
    e.stopPropagation()
    setLookupWord(word)
    setLookupLoading(true)
    setLookupData(null)

    // Position popup next to clicked word coordinates
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setPopupPos({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 8,
    })

    try {
      const data = await lookupVocabularyWord(word, token)
      setLookupData(data)
    } catch (err) {
      toast.error("Không thể tra cứu từ điển lúc này.")
    } finally {
      setLookupLoading(false)
    }
  }

  // Handle saving looked up word to Leitner Box 1
  const handleSaveWord = () => {
    if (!lookupData) return

    createVocabMutation.mutate(
      {
        word: lookupData.word,
        meaning: lookupData.meaning || "Nghĩa chưa xác định",
        pronunciation: lookupData.pronunciation || null,
        word_type: lookupData.word_type || null,
        notes: "Được lưu từ bài đọc: " + (passage?.title || ""),
        context_sentence: null,
      },
      {
        onSuccess: () => {
          toast.success(`Đã lưu từ "${lookupData.word}" vào Hộp 1 (SRS)!`)
          setLookupWord(null)
          setLookupData(null)
          setPopupPos(null)
        },
        onError: (err) => {
          toast.error(`Lỗi lưu từ vựng: ${err.message}`)
        },
      }
    )
  }

  // Close lookup popup when clicking elsewhere
  React.useEffect(() => {
    const handleClose = () => {
      setLookupWord(null)
      setLookupData(null)
      setPopupPos(null)
    }
    window.addEventListener("click", handleClose)
    return () => window.removeEventListener("click", handleClose)
  }, [])

  // Handle saving translation practice
  const handleSaveTranslation = () => {
    if (!id) return

    saveTranslationMutation.mutate(
      { translation_content: translationText },
      {
        onSuccess: () => {
          toast.success("Đã lưu bản thực hành dịch bài của bạn!")
          localStorage.setItem(`passage_progress_${id}`, "100")
        },
        onError: (err) => {
          toast.error(`Lỗi lưu bản dịch: ${err.message}`)
        },
      }
    )
  }

  const handleTranslationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setTranslationText(val)
    if (id && val.trim().length > 0) {
      const currentProgress = localStorage.getItem(`passage_progress_${id}`)
      if (currentProgress !== "100") {
        localStorage.setItem(`passage_progress_${id}`, "40")
      }
    }
  }

  // Render a paragraph text splitting into clickable word spans
  const renderInteractiveText = (text: string) => {
    const words = text.split(/(\s+)/)
    return words.map((chunk, idx) => {
      if (/^\s+$/.test(chunk)) {
        return chunk
      }
      // Clean word to query
      const cleanWord = chunk.replace(/[^a-zA-Z]/g, "")
      if (!cleanWord) return chunk

      return (
        <span
          key={idx}
          onClick={(e) => handleWordClick(e, cleanWord)}
          className="hover:bg-[#EFBCD5]/35 hover:text-[#7b5268] cursor-pointer px-0.5 rounded transition-all inline-block font-medium"
        >
          {chunk}
        </span>
      )
    })
  }

  // Vocabulary highlight in sidebar
  const highlightWords = [
    { word: "Serendipity", ipa: "/ˌserənˈdipədē/", meaning: "Sự tình cờ may mắn" },
    { word: "Mindfulness", ipa: "/ˈmīn(d)fəlnəs/", meaning: "Sự chánh niệm" },
    { word: "Tranquility", ipa: "/traNGˈkwilədē/", meaning: "Sự tĩnh lặng" },
  ]

  if (isPassageLoading) {
    return (
      <div className="py-12 space-y-6 animate-pulse max-w-5xl mx-auto">
        <div className="h-4 bg-zinc-100 rounded w-1/4"></div>
        <div className="h-10 bg-zinc-100 rounded w-3/4"></div>
        <div className="h-64 bg-zinc-50 rounded w-full"></div>
      </div>
    )
  }

  if (!passage) {
    return (
      <div className="text-center py-16 bg-white border border-[#E5DFE2] rounded-[24px]">
        <p className="font-outfit text-sm font-medium text-[#706065]">Không tìm thấy bài viết này.</p>
        <Link to="/english/reading" className="mt-4 text-xs font-bold text-[#EFBCD5] hover:underline">
          Quay lại thư viện bài đọc
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto w-full relative">
      {/* Page Header */}
      <header className="mb-[24px]">
        <Link
          to="/english/reading"
          className="font-outfit text-sm text-[#706065] hover:text-[#EFBCD5] transition-colors flex items-center gap-1.5 mb-2 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Thư viện bài đọc
        </Link>
        <h1 className="font-sora font-bold text-[32px] text-[#201B1E] mb-1">{passage.title}</h1>
        <div className="font-mono text-xs font-bold text-[#70495e] uppercase tracking-wider">
          {passage.level ? `${passage.level} Level` : "General English"} • 5 min read
        </div>
      </header>

      {/* Main Split Grid (Reader & Worksheets) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left Column: English Reader */}
        <section className="bg-white rounded-[24px] p-6 border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] flex flex-col h-[600px] overflow-hidden">
          <h3 className="font-sora font-bold text-lg text-[#1f1a1d] mb-4 pb-3 border-b border-[#E5DFE2]/70">
            Văn bản tiếng Anh (Click vào từ để dịch)
          </h3>
          <div className="overflow-y-auto flex-1 pr-2 space-y-5 text-zinc-800 text-[16px] leading-[1.7] font-outfit select-text hide-scrollbar">
            {passage.content.split("\n\n").map((para, idx) => (
              <p key={idx}>{renderInteractiveText(para)}</p>
            ))}
          </div>
        </section>

        {/* Right Column: Worksheets */}
        <section className="flex flex-col gap-6 h-[600px]">
          {/* Translation Practise Panel */}
          <div className="flex-1 bg-white rounded-[24px] p-6 border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] flex flex-col overflow-hidden">
            <div className="pb-4 border-b border-[#E5DFE2] flex justify-between items-center mb-4">
              <span className="font-sora font-bold text-sm text-[#706065] flex items-center gap-2">
                <Languages className="h-4.5 w-4.5 text-[#EFBCD5]" />
                Thực hành dịch bài
              </span>
              <button
                onClick={handleSaveTranslation}
                className="text-[#7b5268] hover:text-[#EFBCD5] p-1.5 rounded transition-colors flex items-center gap-1.5 text-xs font-bold font-mono"
                title="Lưu bản dịch"
              >
                <Save className="h-4 w-4" /> Lưu bản dịch
              </button>
            </div>
            <textarea
              value={translationText}
              onChange={handleTranslationChange}
              placeholder="Nhập bản dịch tiếng Việt của bạn tại đây để đối chiếu và lưu tiến trình học..."
              className="w-full flex-grow p-4 bg-[#FCFAF7] border border-[#E5DFE2] rounded-xl text-sm focus:outline-none focus:border-[#EFBCD5] transition-all resize-none font-outfit leading-relaxed"
            />
          </div>

          {/* Key Vocabulary Highlights Panel */}
          <div className="bg-white rounded-[24px] p-6 border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] flex-shrink-0">
            <h3 className="font-sora font-bold text-[16px] text-[#201B1E] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EFBCD5]" /> Từ vựng cốt lõi trong bài
            </h3>
            <ul className="space-y-3 font-outfit">
              {highlightWords.map((item, idx) => (
                <li
                  key={idx}
                  onClick={(e) => handleWordClick(e, item.word)}
                  className="flex justify-between items-center p-2.5 hover:bg-[#fcf1f5] rounded-xl cursor-pointer transition-colors border-b border-[#E5DFE2]/40 last:border-0 pb-3"
                >
                  <div>
                    <span className="font-bold text-[15px] text-[#1f1a1d]">{item.word}</span>
                    <span className="font-mono text-xs text-[#706065] ml-2 font-medium">
                      {item.ipa}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-[#7b5268] bg-[#fcf1f5] px-2.5 py-1 rounded-lg border border-[#eae0e4]">
                    {item.meaning}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* Floating Word Dictionary Popup */}
      {popupPos && lookupWord && (
        <div
          className="absolute z-[999] w-72 bg-white/95 backdrop-blur-md border border-[#E5DFE2] shadow-[0_15px_35px_-5px_rgba(239,188,213,0.25)] rounded-[20px] p-4 flex flex-col gap-3 pointer-events-auto animate-in zoom-in-95 font-outfit text-left"
          style={{ left: `${popupPos.x - 140}px`, top: `${popupPos.y}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          {lookupLoading ? (
            <div className="flex items-center justify-center py-4 text-xs font-mono text-[#706065] animate-pulse">
              Đang tra cứu từ điển...
            </div>
          ) : lookupData ? (
            <div className="space-y-3">
              <div>
                <h4 className="font-sora font-bold text-[18px] text-[#1f1a1d]">
                  {lookupData.word}
                </h4>
                {lookupData.pronunciation && (
                  <p className="font-mono text-xs text-[#EFBCD5] font-bold mt-0.5">
                    {lookupData.pronunciation}
                  </p>
                )}
                {lookupData.word_type && (
                  <span className="text-[10px] font-bold uppercase font-mono text-[#706065]/50 mt-0.5 block">
                    ({lookupData.word_type})
                  </span>
                )}
              </div>
              <p className="font-sora text-sm font-semibold text-[#201B1E] leading-relaxed">
                {lookupData.meaning || "Không tìm thấy nghĩa tiếng Việt"}
              </p>
              <button
                onClick={handleSaveWord}
                className="w-full bg-[#EFBCD5] text-[#201B1E] font-sora font-bold text-xs py-2 rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm border border-[#ffd8ea]"
              >
                <Check className="h-3.5 w-3.5 stroke-[3px]" /> Lưu vào SRS
              </button>
            </div>
          ) : (
            <div className="text-xs font-medium text-red-500 py-2">Không tìm thấy định nghĩa.</div>
          )}
        </div>
      )}
    </div>
  )
}
