import * as React from "react"
import { X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useCreateReadingPassage, useUpdateReadingPassage } from "../hooks"
import { CustomSelect } from "@/components/ui/CustomSelect"
import { RichTextEditor } from "@/components/ui/RichTextEditor"
import type { ReadingPassage } from "../types"

interface ReadingPassageModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: Partial<ReadingPassage> | null
}

const LEVEL_OPTIONS = [
  { value: "A1", label: "A1 - Beginner" },
  { value: "A2", label: "A2 - Elementary" },
  { value: "B1", label: "B1 - Intermediate" },
  { value: "B2", label: "B2 - Upper Intermediate" },
  { value: "C1", label: "C1 - Advanced" },
  { value: "C2", label: "C2 - Mastery" },
]

export function ReadingPassageModal({
  isOpen,
  onClose,
  initialData,
}: ReadingPassageModalProps) {
  const createMutation = useCreateReadingPassage()
  const updateMutation = useUpdateReadingPassage()

  const [title, setTitle] = React.useState("")
  const [level, setLevel] = React.useState("B1")
  const [category, setCategory] = React.useState("")
  const [content, setContent] = React.useState("")

  const isEditing = !!(initialData && initialData.id)

  React.useEffect(() => {
    if (isOpen && initialData) {
      setTitle(initialData.title || "")
      setLevel(initialData.level || "B1")
      setCategory(initialData.category || "")
      setContent(initialData.content || "")
    } else if (isOpen) {
      setTitle("")
      setLevel("B1")
      setCategory("")
      setContent("")
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      toast.error("Title and Content are required.")
      return
    }

    const payload = {
      title: title.trim(),
      level: level || "B1",
      category: category.trim() || null,
      content: content.trim(),
    }

    if (isEditing && initialData?.id) {
      updateMutation.mutate(
        { id: initialData.id, payload },
        {
          onSuccess: () => {
            toast.success("Reading passage updated successfully!")
            onClose()
          },
          onError: (err) => {
            toast.error(`Failed to update passage: ${err.message}`)
          },
        }
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("New reading passage created!")
          onClose()
        },
        onError: (err) => {
          toast.error(`Failed to create passage: ${err.message}`)
        },
      })
    }
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150 font-outfit">
      <div className="bg-white border border-[#E5DFE2] rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DFE2] bg-[#FCFAF7] flex-shrink-0">
          <h2 className="font-sora font-bold text-lg text-[#201B1E]">
            {isEditing ? "Edit Reading Passage" : "Add New Reading Passage"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#F6EBEF] text-[#706065] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#706065] mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Power of Daily Habits"
              className="w-full px-3 py-2 rounded-xl border border-[#E5DFE2] bg-[#FCFAF7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EFBCD5] text-sm text-[#201B1E]"
              required
            />
          </div>

          {/* Level & Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#706065] mb-1.5">
                Difficulty Level
              </label>
              <CustomSelect
                options={LEVEL_OPTIONS}
                value={level}
                onChange={(val) => setLevel(val)}
                placeholder="Select level..."
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#706065] mb-1.5">
                Category / Tag (Optional)
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Science, Lifestyle, Business"
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5DFE2] bg-[#FCFAF7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EFBCD5] text-sm text-[#201B1E]"
              />
            </div>
          </div>

          {/* Passage Content with Rich Text Editor */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#706065] mb-1.5">
              Reading Content (English Text) <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              rows={8}
              value={content}
              onChange={setContent}
              placeholder="Paste or type the full English reading text here. Use formatting buttons for bold, italic, underline, or lists..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t border-[#E5DFE2]/70">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E5DFE2] text-[#706065] font-semibold text-xs hover:bg-zinc-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#EFBCD5] text-[#201B1E] font-sora font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditing ? "Save Changes" : "Create Passage"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
