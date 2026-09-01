import * as React from "react"
import { useOutletContext } from "react-router-dom"
import {
  useVocabulariesQuery,
  useReviewVocabulary,
  useDeleteVocabulary,
  useBulkDeleteVocabulary,
} from "@/features/vocabulary/hooks"
import { VocabularyModal } from "@/features/vocabulary/components/VocabularyModal"
import {
  Sparkles,
  X,
  Check,
  Pencil,
  Trash2,
  Layers,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import type { EnglishOutletContext } from "@/components/EnglishLayout"
import type { VocabularyItem } from "@/types"

export default function EnglishVocabularies() {
  const { restartKey } = useOutletContext<EnglishOutletContext>()

  // View Mode: "review" (Flashcards) or "library" (Manage All Words)
  const [viewMode, setViewMode] = React.useState<"review" | "library">("review")

  // --- REVIEW TAB STATE ---
  const [currentCardIndex, setCurrentCardIndex] = React.useState(0)
  const [revealMeaning, setRevealMeaning] = React.useState(false)

  // --- LIBRARY TAB STATE ---
  const [page, setPage] = React.useState(1)
  const pageSize = 15

  // Selected item IDs for bulk delete
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])

  // Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<VocabularyItem | null>(null)

  // 1. Fetch due vocabularies for review
  const { data: dueVocab, isLoading: isDueLoading } = useVocabulariesQuery({
    due: true,
    page_size: 100,
  })

  // 2. Fetch all vocabularies to compute Box status counts
  const { data: allVocab, isLoading: isAllLoading } = useVocabulariesQuery({
    page_size: 1000,
  })

  // 3. Fetch library vocabularies with pagination
  const { data: libraryVocab, isLoading: isLibraryLoading } = useVocabulariesQuery({
    page,
    page_size: pageSize,
  })

  // Mutations
  const reviewMutation = useReviewVocabulary()
  const deleteMutation = useDeleteVocabulary()
  const bulkDeleteMutation = useBulkDeleteVocabulary()

  // Reset indices when restartKey triggers from Layout sidebar
  React.useEffect(() => {
    setCurrentCardIndex(0)
    setRevealMeaning(false)
  }, [restartKey])

  // Calculate box counts for sidebar
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

  // Filtered items in library
  const filteredLibraryItems = React.useMemo(() => {
    return libraryVocab?.items || []
  }, [libraryVocab])

  // Current flashcard word
  const currentWord = React.useMemo(() => {
    if (!dueVocab?.items || dueVocab.items.length === 0) return null
    if (currentCardIndex >= dueVocab.items.length) return null
    return dueVocab.items[currentCardIndex]
  }, [dueVocab, currentCardIndex])

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
          setRevealMeaning(false)
          setCurrentCardIndex((prev) => prev + 1)
        },
        onError: (err) => {
          toast.error(`Vocabulary review error: ${err.message}`)
        },
      }
    )
  }

  // Handle single item delete
  const handleDeleteSingle = (item: VocabularyItem) => {
    if (confirm(`Are you sure you want to delete "${item.word}"?`)) {
      deleteMutation.mutate(item.id, {
        onSuccess: () => {
          toast.success(`Deleted "${item.word}"!`)
          setSelectedIds((prev) => prev.filter((id) => id !== item.id))
        },
        onError: (err) => {
          toast.error(`Failed to delete: ${err.message}`)
        },
      })
    }
  }

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    if (confirm(`Are you sure you want to delete ${selectedIds.length} selected vocabulary items?`)) {
      bulkDeleteMutation.mutate(selectedIds, {
        onSuccess: (res) => {
          toast.success(`Successfully deleted ${res.deleted} items.`)
          setSelectedIds([])
        },
        onError: (err) => {
          toast.error(`Failed to bulk delete: ${err.message}`)
        },
      })
    }
  }

  // Toggle selection for individual item
  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  // Toggle select all visible items
  const toggleSelectAll = () => {
    if (filteredLibraryItems.length === 0) return
    const visibleIds = filteredLibraryItems.map((i) => i.id)
    const isAllSelected = visibleIds.every((id) => selectedIds.includes(id))

    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])))
    }
  }

  const handleOpenAddModal = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item: VocabularyItem) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const totalPages = Math.ceil((libraryVocab?.total ?? 0) / pageSize)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="mt-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-sora font-bold text-3xl mb-2 text-[#201B1E] tracking-tight">
            Vocabulary Hub
          </h1>
          <p className="font-outfit font-normal text-base text-[#706065]">
            Daily Leitner Review & Comprehensive Word Library
          </p>
        </div>

        {/* View Mode Toggle Tabs */}
        <div className="flex bg-[#fcf1f5] p-1 rounded-2xl border border-[#ffd8ea] self-start md:self-auto font-outfit">
          <button
            onClick={() => setViewMode("review")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === "review"
                ? "bg-white text-[#7b5268] shadow-sm"
                : "text-[#706065] hover:text-[#7b5268]"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Daily Review</span>
          </button>
          <button
            onClick={() => setViewMode("library")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === "library"
                ? "bg-white text-[#7b5268] shadow-sm"
                : "text-[#706065] hover:text-[#7b5268]"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Word Library ({allVocab?.total ?? 0})</span>
          </button>
        </div>
      </header>

      {/* ================= MODE 1: DAILY REVIEW ================= */}
      {viewMode === "review" && (
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

          {/* Main Flashcard Area */}
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
                  onClick={() => setViewMode("library")}
                  className="px-6 py-2.5 bg-[#EFBCD5] text-[#201B1E] rounded-xl font-sora font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-sm"
                >
                  Manage Word Library
                </button>
              </div>
            ) : (
              (() => {
                const wordItem = currentWord!
                return (
                  <div className="w-full max-w-xl flex flex-col items-center gap-5">
                    {/* 3D Flip Card Container */}
                    <div
                      className="w-full min-h-[380px] cursor-pointer [perspective:1000px] select-none"
                      onClick={() => setRevealMeaning((prev) => !prev)}
                    >
                      <div
                        className={`relative w-full h-full min-h-[380px] transition-transform duration-500 [transform-style:preserve-3d] ${
                          revealMeaning ? "[transform:rotateY(180deg)]" : ""
                        }`}
                      >
                        {/* Front Face (Word) */}
                        <div className="absolute inset-0 w-full h-full bg-white rounded-[24px] p-[24px] border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] flex flex-col items-center text-center justify-center [backface-visibility:hidden]">
                          <div className="w-full flex flex-col items-center justify-center py-4">
                            <span className="font-mono text-xs font-bold text-[#706065] uppercase tracking-wider bg-[#fcf1f5] px-3 py-1 rounded-full border border-[#eae0e4] mb-4">
                              Box {wordItem.box_number || 1}
                            </span>
                            <h2 className="font-sora text-[44px] font-bold text-[#1f1a1d] tracking-tight">
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
                        </div>

                        {/* Back Face (Meaning) */}
                        <div className="absolute inset-0 w-full h-full bg-[#FCFAF7] rounded-[24px] p-[24px] border border-[#EFBCD5]/70 shadow-[0_10px_30px_-5px_rgba(239,188,213,0.2)] flex flex-col items-center text-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
                          <div className="w-full flex flex-col items-center justify-center py-4 space-y-4 max-w-md mx-auto">
                            <span className="font-mono text-xs font-bold text-[#7b5268] uppercase tracking-wider bg-[#EFBCD5]/25 px-3 py-1 rounded-full border border-[#EFBCD5]/40 mb-2">
                              Meaning
                            </span>
                            <p className="font-sora text-2xl text-[#201B1E] font-bold leading-relaxed">
                              {wordItem.meaning}
                            </p>
                            {wordItem.context_sentence && (
                              <p className="font-outfit text-sm text-[#706065] italic leading-relaxed bg-white p-3.5 rounded-xl border border-[#E5DFE2]/70 w-full">
                                "{wordItem.context_sentence}"
                              </p>
                            )}
                            {wordItem.notes && (
                              <p className="text-xs font-mono text-[#7b5268] bg-[#fcf1f5] p-2 rounded-lg border border-[#ffd8ea]">
                                Notes: {wordItem.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons (Forgot / Remembered) */}
                    <div className="flex gap-[24px] w-full justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReview(false)
                        }}
                        className="flex-1 py-3 px-6 rounded-[24px] border border-[#E5DFE2] bg-white text-[#706065] font-sora text-base font-bold hover:bg-zinc-50 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xs"
                      >
                        <X className="h-4.5 w-4.5 text-[#706065] stroke-[2.5px]" />
                        <span>Forgot</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReview(true)
                        }}
                        className="flex-1 py-3 px-6 rounded-[24px] bg-[#EFBCD5] text-[#201B1E] font-sora text-base font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 border border-[#ffd8ea]"
                      >
                        <Check className="h-4.5 w-4.5 text-[#201B1E] stroke-[3px]" />
                        <span>Remembered</span>
                      </button>
                    </div>

                    {/* Bottom Progress Bar (~20px below card) */}
                    <div className="w-full font-outfit">
                      <div className="flex justify-between items-center text-xs font-mono font-semibold text-[#706065] mb-1.5 px-1">
                        <span>Progress</span>
                        <span>{currentCardIndex} / {dueTotal} words</span>
                      </div>
                      <div className="w-full h-2.5 bg-[#fcf1f5] rounded-full overflow-hidden border border-[#E5DFE2]/60 shadow-xs">
                        <div
                          className="h-full bg-[#EFBCD5] rounded-full transition-all duration-300"
                          style={{
                            width: `${(currentCardIndex / dueTotal) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )
              })()
            )}
          </div>
        </section>
      )}

      {/* ================= MODE 2: WORD LIBRARY MANAGEMENT ================= */}
      {viewMode === "library" && (
        <section className="space-y-4 font-outfit">
          {/* Main Table Card */}
          <div className="glass-card bg-white border border-[#E5DFE2] rounded-[24px] p-6 shadow-[0_10px_30px_-5px_rgba(239, 188, 213, 0.15)]">

            {/* Bulk Selection Banner */}
            {selectedIds.length > 0 && (
              <div className="bg-[#fcf1f5] px-4 py-2.5 rounded-xl border border-[#ffd8ea] flex items-center justify-between mb-4 animate-in fade-in duration-200">
                <span className="text-xs font-bold text-[#7b5268]">
                  {selectedIds.length} word(s) selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 rounded-lg bg-red-500 text-white font-semibold text-xs hover:bg-red-600 active:scale-95 transition-all flex items-center gap-1 shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected</span>
                </button>
              </div>
            )}

            {/* Table Content */}
            {isLibraryLoading ? (
              <div className="py-8 space-y-3 animate-pulse">
                <div className="h-10 bg-zinc-50 rounded-lg w-full"></div>
                <div className="h-10 bg-zinc-50 rounded-lg w-full"></div>
                <div className="h-10 bg-zinc-50 rounded-lg w-full"></div>
              </div>
            ) : filteredLibraryItems.length === 0 ? (
              <div className="text-center py-12 text-[#706065] flex flex-col items-center justify-center">
                <BookOpen className="h-12 w-12 text-zinc-300 stroke-[1.25px] mb-3" />
                <p className="text-sm font-semibold">No vocabulary words found.</p>
                <p className="text-xs text-[#706065]/70 mt-1">Try adjusting your search query or filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-outfit">
                  <thead>
                    <tr className="border-b border-[#E5DFE2] text-[#706065] text-xs uppercase tracking-wider font-mono">
                      <th className="py-3 px-2 font-semibold w-8 text-center">
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all mx-auto ${
                            filteredLibraryItems.length > 0 &&
                            filteredLibraryItems.every((i) => selectedIds.includes(i.id))
                              ? "bg-[#EFBCD5] border-[#EFBCD5] text-white"
                              : "border-[#d2c2c8] bg-white hover:border-[#EFBCD5]"
                          }`}
                        >
                          {filteredLibraryItems.length > 0 &&
                            filteredLibraryItems.every((i) => selectedIds.includes(i.id)) && (
                              <Check className="h-3.5 w-3.5 stroke-[3px]" />
                            )}
                        </button>
                      </th>
                      <th className="py-3 px-2 font-semibold">WORD</th>
                      <th className="py-3 px-2 font-semibold">PRONUNCIATION</th>
                      <th className="py-3 px-2 font-semibold">MEANING</th>
                      <th className="py-3 px-2 font-semibold text-center">TYPE</th>
                      <th className="py-3 px-2 font-semibold text-center">BOX</th>
                      <th className="py-3 px-2 font-semibold text-center w-16">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLibraryItems.map((item) => {
                      const isSelected = selectedIds.includes(item.id)
                      return (
                        <tr
                          key={item.id}
                          className="border-b border-[#E5DFE2]/70 hover:bg-zinc-50/50 transition-colors group"
                        >
                          <td className="py-4 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => toggleSelectItem(item.id)}
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all mx-auto ${
                                isSelected
                                  ? "bg-[#EFBCD5] border-[#EFBCD5] text-white"
                                  : "border-[#d2c2c8] bg-white hover:border-[#EFBCD5]"
                              }`}
                            >
                              {isSelected && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                            </button>
                          </td>
                          <td className="py-4 px-2 font-semibold text-[#201B1E]">
                            {item.word}
                          </td>
                          <td className="py-4 px-2 text-sm font-mono text-[#EFBCD5] font-semibold">
                            {item.pronunciation || "—"}
                          </td>
                          <td className="py-4 px-2 text-sm text-[#706065] font-semibold">
                            {item.meaning}
                            {item.context_sentence && (
                              <div className="text-xs text-[#706065]/70 italic truncate max-w-xs font-normal">
                                "{item.context_sentence}"
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-2 text-center text-xs font-mono font-bold uppercase text-[#706065]">
                            {item.word_type || "—"}
                          </td>
                          <td className="py-4 px-2 text-center text-xs font-mono font-bold text-[#706065]">
                            Box {item.box_number || 1}
                          </td>
                          <td className="py-4 px-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="text-zinc-400 hover:text-[#7b5268] transition-colors p-1"
                                title="Edit word"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSingle(item)}
                                className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                                title="Delete word"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="pt-4 mt-2 border-t border-[#E5DFE2]/70 flex items-center justify-between text-xs text-[#706065]">
                <span>
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    className="p-1 rounded-lg border border-[#E5DFE2] bg-white hover:bg-zinc-50 disabled:opacity-40 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    className="p-1 rounded-lg border border-[#E5DFE2] bg-white hover:bg-zinc-50 disabled:opacity-40 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Right + Add Word Link (Matching Gym + Add Exercise style) */}
            <div className="flex justify-end mt-4">
              <button
                onClick={handleOpenAddModal}
                className="font-outfit font-bold text-xs text-[#EFBCD5] hover:underline flex items-center gap-1 cursor-pointer"
              >
                + Add Word
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Vocabulary Create / Edit Modal */}
      <VocabularyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingItem}
      />
    </div>
  )
}
