import * as React from "react"
import { X, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { useUploadAudio, useUpdateAudio } from "../hooks"
import { CustomSelect } from "@/components/ui/CustomSelect"
import { RichTextEditor } from "@/components/ui/RichTextEditor"
import type { AudioListItem, AudioTrack } from "../types"

interface AudioTrackModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: Partial<AudioTrack> | Partial<AudioListItem> | null
}

const LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner (Easy)" },
  { value: "intermediate", label: "Intermediate (Medium)" },
  { value: "advanced", label: "Advanced (Hard)" },
]

const CATEGORY_OPTIONS = [
  { value: "general", label: "General English" },
  { value: "conversation", label: "Conversation" },
  { value: "business", label: "Business & Work" },
  { value: "podcast", label: "Podcast & News" },
]

export function AudioTrackModal({
  isOpen,
  onClose,
  initialData,
}: AudioTrackModalProps) {
  const uploadMutation = useUploadAudio()
  const updateMutation = useUpdateAudio()

  const [title, setTitle] = React.useState("")
  const [level, setLevel] = React.useState("intermediate")
  const [category, setCategory] = React.useState("general")
  const [transcript, setTranscript] = React.useState("")
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)

  const isEditing = !!(initialData && initialData.id)

  React.useEffect(() => {
    if (isOpen && initialData) {
      setTitle(initialData.title || "")
      setLevel(initialData.level || "intermediate")
      setCategory(initialData.category || "general")
      setTranscript((initialData as AudioTrack).transcript || "")
      setSelectedFile(null)
    } else if (isOpen) {
      setTitle("")
      setLevel("intermediate")
      setCategory("general")
      setTranscript("")
      setSelectedFile(null)
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  const isSubmitting = uploadMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Track title is required.")
      return
    }

    if (isEditing && initialData?.id) {
      updateMutation.mutate(
        {
          id: initialData.id,
          payload: {
            title: title.trim(),
            level: level || "intermediate",
            category: category || "general",
            transcript: transcript.trim() || null,
          },
        },
        {
          onSuccess: () => {
            toast.success("Audio track updated successfully!")
            onClose()
          },
          onError: (err) => {
            toast.error(`Failed to update audio track: ${err.message}`)
          },
        }
      )
    } else {
      if (!selectedFile) {
        toast.error("Please select an MP3/WAV audio file to upload.")
        return
      }

      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("title", title.trim())
      formData.append("level", level || "intermediate")
      formData.append("category", category || "general")
      if (transcript.trim()) {
        formData.append("transcript", transcript.trim())
      }

      uploadMutation.mutate(
        { formData },
        {
          onSuccess: () => {
            toast.success("Audio track created successfully!")
            onClose()
          },
          onError: (err) => {
            toast.error(`Failed to upload audio track: ${err.message}`)
          },
        }
      )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-outfit animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 max-w-xl w-full border border-[#E5DFE2] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-3 border-b border-[#E5DFE2]">
          <h2 className="font-sora font-bold text-lg text-[#1f1a1d]">
            {isEditing ? "Edit Listening Track" : "Add New Listening Track"}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 p-1.5 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#706065] mb-1.5">
              Track Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Slow Living Dialogue - Morning Routine"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DFE2] bg-[#FCFAF7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EFBCD5] text-sm text-[#201B1E]"
              required
            />
          </div>

          {/* Audio File Selection (New Track) */}
          {!isEditing && (
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#706065] mb-1.5">
                Audio File (.mp3, .wav, .m4a) <span className="text-red-500">*</span>
              </label>
              <div className="relative border-2 border-dashed border-[#E5DFE2] rounded-xl p-4 bg-[#FCFAF7] text-center hover:border-[#EFBCD5] transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center gap-1.5">
                  <Upload className="w-6 h-6 text-[#EFBCD5]" />
                  <span className="text-xs font-semibold text-[#1f1a1d]">
                    {selectedFile ? selectedFile.name : "Click or drag audio file here to upload"}
                  </span>
                  {selectedFile && (
                    <span className="text-[10px] text-emerald-600 font-mono font-bold">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB selected
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

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
                Category
              </label>
              <CustomSelect
                options={CATEGORY_OPTIONS}
                value={category}
                onChange={(val) => setCategory(val)}
                placeholder="Select category..."
              />
            </div>
          </div>

          {/* Transcript Rich Text Editor */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#706065] mb-1.5">
              Listening Transcript (English Dialogue)
            </label>
            <RichTextEditor
              rows={6}
              value={transcript}
              onChange={setTranscript}
              placeholder="Paste or type transcript sentences here. Formatting tags like bold, italic, or underline are supported..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t border-[#E5DFE2]/70">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#706065] hover:bg-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#EFBCD5] text-[#201B1E] hover:opacity-90 transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? "Save Changes" : "Create Track"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
