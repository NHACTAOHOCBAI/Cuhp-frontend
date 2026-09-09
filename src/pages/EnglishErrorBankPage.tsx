import { useState, useEffect } from "react"
import {
  BookmarkCheck,
  CheckCircle2,
  Trash2,
  Filter,
  Volume2,
  Sparkles,
} from "lucide-react"
import { translationReflexApi } from "@/services/translationReflexApi"
import type { ErrorLog } from "@/services/translationReflexApi"
import { speakWord } from "@/lib/tts"

export default function EnglishErrorBankPage() {
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [errorType, setErrorType] = useState<string>("all")
  const [masteredFilter, setMasteredFilter] = useState<string>("unmastered")

  // Flashcard review modal state
  const [isReviewing, setIsReviewing] = useState<boolean>(false)
  const [reviewIndex, setReviewIndex] = useState<number>(0)
  const [showAnswer, setShowAnswer] = useState<boolean>(false)

  const fetchErrors = async () => {
    try {
      setLoading(true)
      const typeParam = errorType === "all" ? undefined : errorType
      let masteredParam: boolean | undefined = undefined
      if (masteredFilter === "mastered") masteredParam = true
      if (masteredFilter === "unmastered") masteredParam = false

      const data = await translationReflexApi.getErrors(typeParam, masteredParam)
      setErrors(data)
    } catch (err: any) {
      console.error("Error fetching error bank:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchErrors()
  }, [errorType, masteredFilter])

  const handleToggleMastered = async (id: string, currentStatus: boolean) => {
    try {
      const updated = await translationReflexApi.toggleErrorMastered(id, !currentStatus)
      setErrors((prev) => prev.map((e) => (e.id === id ? updated : e)))
    } catch (err: any) {
      console.error("Failed to toggle error status:", err)
    }
  }

  const handleDeleteError = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa lỗi này khỏi Sổ Lỗi Sai?")) return
    try {
      await translationReflexApi.deleteError(id)
      setErrors((prev) => prev.filter((e) => e.id !== id))
    } catch (err: any) {
      console.error("Failed to delete error log:", err)
    }
  }

  // Flashcard handlers
  const unmasteredErrors = errors.filter((e) => !e.mastered)

  const startFlashcardReview = () => {
    if (unmasteredErrors.length === 0) {
      alert("Không có lỗi sai nào chưa thuộc để ôn tập!")
      return
    }
    setReviewIndex(0)
    setShowAnswer(false)
    setIsReviewing(true)
  }

  const handleNextFlashcard = async (markAsMastered = false) => {
    const current = unmasteredErrors[reviewIndex]
    if (markAsMastered && current) {
      await handleToggleMastered(current.id, false)
    }

    if (reviewIndex + 1 < unmasteredErrors.length) {
      setReviewIndex((prev) => prev + 1)
      setShowAnswer(false)
    } else {
      alert("Bạn đã hoàn thành xong vòng ôn tập Flashcard!")
      setIsReviewing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="bg-white rounded-2xl border border-[#E5DFE2] p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="font-sora text-2xl font-bold text-[#201B1E] flex items-center gap-2">
              <BookmarkCheck className="h-6 w-6 text-[#7b5268]" />
              Sổ Lỗi Sai (Error Bank)
            </h1>
            <p className="font-outfit text-sm text-[#706065] mt-1">
              Tự động tập hợp các lỗi sai Ngữ pháp, Từ vựng, Diễn đạt do Gemini AI phát hiện để bạn ôn tập.
            </p>
          </div>

          <button
            onClick={startFlashcardReview}
            disabled={unmasteredErrors.length === 0}
            className="px-5 py-2.5 bg-[#7b5268] hover:bg-[#633e52] disabled:opacity-50 text-white font-sora font-semibold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all self-stretch md:self-auto justify-center"
          >
            <Sparkles className="h-4 w-4 text-[#EFBCD5]" />
            <span>Ôn tập Flashcard ({unmasteredErrors.length})</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E5DFE2]">
          {/* Error Type Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold text-[#706065] mr-1 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> Lọc lỗi:
            </span>
            {[
              { id: "all", label: "Tất cả" },
              { id: "grammar", label: "Ngữ pháp" },
              { id: "vocabulary", label: "Từ vựng" },
              { id: "phrasing", label: "Diễn đạt" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setErrorType(t.id)}
                className={`px-3 py-1 rounded-lg text-xs font-outfit font-semibold transition-all ${
                  errorType === t.id
                    ? "bg-[#7b5268] text-white shadow-xs"
                    : "bg-[#FCF1F5] text-[#706065] hover:text-[#7b5268]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Mastery Filter */}
          <div className="flex items-center gap-2">
            <select
              value={masteredFilter}
              onChange={(e) => setMasteredFilter(e.target.value)}
              className="bg-[#FCF1F5] border border-[#E5DFE2] rounded-xl px-3 py-1.5 text-xs font-outfit font-semibold text-[#201B1E] focus:outline-none focus:ring-2 focus:ring-[#EFBCD5]"
            >
              <option value="unmastered">🎯 Cần ôn tập ({errors.filter((e) => !e.mastered).length})</option>
              <option value="mastered">✅ Đã thuộc ({errors.filter((e) => e.mastered).length})</option>
              <option value="all">📋 Tất cả ({errors.length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Error Cards List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-[#E5DFE2] animate-pulse" />
          ))}
        </div>
      ) : errors.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E5DFE2] p-12 text-center space-y-3">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
          <h3 className="font-sora text-lg font-bold text-[#201B1E]">Chưa có lỗi sai nào!</h3>
          <p className="font-outfit text-sm text-[#706065]">
            Tuyệt vời! Hãy tiếp tục sang phần Luyện Dịch Phản Xạ để luyện câu mới.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {errors.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-4 transition-all hover:shadow-sm ${
                item.mastered ? "border-emerald-200 bg-emerald-50/20" : "border-[#E5DFE2]"
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="space-y-2 flex-grow">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        item.error_type === "grammar"
                          ? "bg-purple-100 text-purple-700"
                          : item.error_type === "vocabulary"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {item.error_type}
                    </span>

                    {item.mastered && (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Đã thuộc
                      </span>
                    )}
                  </div>

                  {/* Correction Display */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="line-through text-rose-500 font-outfit text-sm font-medium">
                      {item.original_text}
                    </span>
                    <span className="text-gray-400 font-bold">➔</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-700 font-sora text-base font-bold">
                        {item.corrected_text}
                      </span>
                      <button
                        onClick={() => speakWord(item.corrected_text)}
                        className="p-1 text-[#7b5268] hover:bg-[#FCF1F5] rounded-md transition-colors"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* AI Explanation */}
                  <p className="font-outfit text-xs text-[#706065] leading-relaxed bg-[#FCF1F5]/50 p-2.5 rounded-xl">
                    💡 {item.explanation}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col items-center justify-between w-full md:w-auto gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-[#E5DFE2]">
                  <button
                    onClick={() => handleToggleMastered(item.id, item.mastered)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-outfit font-semibold flex items-center gap-1.5 transition-all ${
                      item.mastered
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        : "bg-[#FCF1F5] text-[#7b5268] hover:bg-[#EFBCD5]"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{item.mastered ? "Đã thuộc" : "Đánh dấu thuộc"}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteError(item.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Xóa lỗi sai"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Flashcard Review Modal */}
      {isReviewing && unmasteredErrors[reviewIndex] && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#706065] uppercase">
                Ôn tập Flashcard ({reviewIndex + 1}/{unmasteredErrors.length})
              </span>
              <button
                onClick={() => setIsReviewing(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕ Đóng
              </button>
            </div>

            {/* Flashcard Body */}
            <div className="min-h-[180px] bg-gradient-to-br from-[#FCF1F5] to-white p-6 rounded-2xl border-2 border-[#EFBCD5] flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 font-bold rounded text-[10px] uppercase">
                  {unmasteredErrors[reviewIndex].error_type}
                </span>
                <p className="text-xs text-[#706065] font-medium">Cụm từ bạn gõ/nói chưa đúng:</p>
                <p className="font-sora text-xl font-bold text-rose-600">
                  "{unmasteredErrors[reviewIndex].original_text}"
                </p>
              </div>

              {showAnswer ? (
                <div className="pt-4 border-t border-[#EFBCD5] space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600">Sửa lại chuẩn:</span>
                    <span className="font-sora text-lg font-bold text-emerald-700">
                      {unmasteredErrors[reviewIndex].corrected_text}
                    </span>
                    <button
                      onClick={() => speakWord(unmasteredErrors[reviewIndex].corrected_text)}
                      className="p-1 text-[#7b5268] hover:bg-[#FCF1F5] rounded-md"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="font-outfit text-xs text-[#706065]">
                    💡 {unmasteredErrors[reviewIndex].explanation}
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="w-full py-2.5 bg-white border border-[#EFBCD5] hover:bg-[#FCF1F5] text-[#7b5268] rounded-xl font-sora font-semibold text-xs shadow-xs transition-colors"
                >
                  👁️ Bấm để xem đáp án đúng
                </button>
              )}
            </div>

            {/* Flashcard Actions */}
            {showAnswer && (
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleNextFlashcard(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-sora font-semibold text-xs transition-colors"
                >
                  Chưa nhớ (Cần ôn lại)
                </button>
                <button
                  onClick={() => handleNextFlashcard(true)}
                  className="flex-1 py-3 bg-[#7b5268] hover:bg-[#633e52] text-white rounded-xl font-sora font-semibold text-xs shadow-md transition-colors"
                >
                  ✅ Đã thuộc!
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
