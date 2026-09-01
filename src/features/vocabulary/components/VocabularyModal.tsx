import * as React from "react"
import { X, Search, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { useCreateVocabulary, useUpdateVocabulary } from "../hooks"
import { lookupVocabularyWord } from "../api"
import { WORD_TYPES } from "../types"
import { CustomSelect } from "@/components/ui/CustomSelect"
import type { VocabularyItem } from "@/types"

interface VocabularyModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: VocabularyItem | null
}

export function VocabularyModal({ isOpen, onClose, initialData }: VocabularyModalProps) {
  const { token } = useAuth()
  const createMutation = useCreateVocabulary()
  const updateMutation = useUpdateVocabulary()

  const [word, setWord] = React.useState("")
  const [pronunciation, setPronunciation] = React.useState("")
  const [meaning, setMeaning] = React.useState("")
  const [wordType, setWordType] = React.useState<string>("")
  const [contextSentence, setContextSentence] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [isLookingUp, setIsLookingUp] = React.useState(false)

  const isEditing = !!initialData

  // Populate form fields on open or initialData change
  React.useEffect(() => {
    if (initialData) {
      setWord(initialData.word || "")
      setPronunciation(initialData.pronunciation || "")
      setMeaning(initialData.meaning || "")
      setWordType(initialData.word_type || "")
      setContextSentence(initialData.context_sentence || "")
      setNotes(initialData.notes || "")
    } else {
      setWord("")
      setPronunciation("")
      setMeaning("")
      setWordType("")
      setContextSentence("")
      setNotes("")
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  // Auto lookup dictionary for word
  const handleAutoLookup = async () => {
    const trimmed = word.trim()
    if (!trimmed) {
      toast.error("Please enter a word to lookup.")
      return
    }

    setIsLookingUp(true)
    try {
      const res = await lookupVocabularyWord(trimmed, token)
      if (res.pronunciation) setPronunciation(res.pronunciation)
      if (res.meaning) setMeaning(res.meaning)
      if (res.word_type) setWordType(res.word_type.toLowerCase())
      toast.success(`Found details for "${trimmed}"!`)
    } catch (err: any) {
      toast.error("Could not fetch dictionary info.")
    } finally {
      setIsLookingUp(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!word.trim() || !meaning.trim()) {
      toast.error("Word and Meaning are required.")
      return
    }

    if (isEditing && initialData) {
      updateMutation.mutate(
        {
          id: initialData.id,
          payload: {
            word: word.trim(),
            pronunciation: pronunciation.trim() || null,
            meaning: meaning.trim(),
            word_type: wordType || null,
            context_sentence: contextSentence.trim() || null,
            notes: notes.trim() || null,
          },
        },
        {
          onSuccess: () => {
            toast.success("Vocabulary updated successfully!")
            onClose()
          },
          onError: (err: any) => {
            toast.error(`Failed to update vocabulary: ${err.message}`)
          },
        }
      )
    } else {
      createMutation.mutate(
        {
          word: word.trim(),
          pronunciation: pronunciation.trim() || null,
          meaning: meaning.trim(),
          word_type: wordType || null,
          context_sentence: contextSentence.trim() || null,
          notes: notes.trim() || null,
        },
        {
          onSuccess: () => {
            toast.success("New vocabulary added to SRS Box 1!")
            onClose()
          },
          onError: (err: any) => {
            toast.error(`Failed to add vocabulary: ${err.message}`)
          },
        }
      )
    }
  }

  const wordTypeOptions = [
    { value: "", label: "-- Select Part of Speech --" },
    ...WORD_TYPES.map((wt) => ({ value: wt.value, label: wt.label })),
  ]

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5DFE2] rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden font-outfit">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DFE2]/70 bg-[#FCFAF7]">
          <h2 className="font-sora font-bold text-lg text-[#201B1E]">
            {isEditing ? "Edit Vocabulary" : "Add New Vocabulary"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#F6EBEF] text-[#706065] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Word Input & Auto Lookup */}
          <div>
            <label className="block text-xs font-bold text-[#706065] uppercase tracking-wider mb-1.5">
              Word <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="e.g. Serendipity"
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5DFE2] bg-[#FCFAF7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EFBCD5] text-sm text-[#201B1E]"
                required
              />
              <button
                type="button"
                onClick={handleAutoLookup}
                disabled={isLookingUp || !word.trim()}
                className="px-3.5 py-2.5 bg-[#fcf1f5] text-[#7b5268] border border-[#ffd8ea] rounded-xl hover:bg-[#EFBCD5]/30 active:scale-95 transition-all text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                {isLookingUp ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#7b5268]" />
                ) : (
                  <Search className="w-4 h-4 text-[#7b5268]" />
                )}
                <span>Auto Lookup</span>
              </button>
            </div>
          </div>

          {/* Pronunciation & Word Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#706065] uppercase tracking-wider mb-1.5">
                Pronunciation (IPA)
              </label>
              <input
                type="text"
                value={pronunciation}
                onChange={(e) => setPronunciation(e.target.value)}
                placeholder="e.g. /ˌserənˈdipədē/"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5DFE2] bg-[#FCFAF7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EFBCD5] text-sm text-[#201B1E] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#706065] uppercase tracking-wider mb-1.5">
                Word Type
              </label>
              <CustomSelect
                options={wordTypeOptions}
                value={wordType}
                onChange={setWordType}
                placeholder="-- Select Type --"
              />
            </div>
          </div>

          {/* Meaning Input */}
          <div>
            <label className="block text-xs font-bold text-[#706065] uppercase tracking-wider mb-1.5">
              Meaning (Vietnamese) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="e.g. Sự tình cờ may mắn"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5DFE2] bg-[#FCFAF7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EFBCD5] text-sm text-[#201B1E]"
              required
            />
          </div>

          {/* Context Sentence */}
          <div>
            <label className="block text-xs font-bold text-[#706065] uppercase tracking-wider mb-1.5">
              Context Sentence (Optional)
            </label>
            <textarea
              rows={2}
              value={contextSentence}
              onChange={(e) => setContextSentence(e.target.value)}
              placeholder="e.g. Finding this book was pure serendipity."
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5DFE2] bg-[#FCFAF7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EFBCD5] text-sm text-[#201B1E]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-[#706065] uppercase tracking-wider mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Synonyms: chance, luck"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5DFE2] bg-[#FCFAF7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EFBCD5] text-sm text-[#201B1E]"
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-[#E5DFE2]/70">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#E5DFE2] text-[#706065] font-semibold text-xs hover:bg-zinc-50 active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#EFBCD5] text-[#201B1E] font-sora font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isEditing ? "Save Changes" : "Add Vocabulary"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
