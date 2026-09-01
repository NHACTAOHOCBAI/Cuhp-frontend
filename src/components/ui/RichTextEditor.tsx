import * as React from "react"
import { Bold, Italic, Underline, List, ListOrdered, RemoveFormatting } from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  className?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your text here...",
  rows = 8,
  className = "",
}: RichTextEditorProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Helper to wrap or prepend formatting tag around text selection
  const applyFormat = (openTag: string, closeTag: string = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)

    let replacement = ""
    if (closeTag) {
      // Inline formatting like <b>sel</b>, <i>sel</i>, <u>sel</u>
      if (selectedText.startsWith(openTag) && selectedText.endsWith(closeTag)) {
        // Toggle off if already wrapped
        replacement = selectedText.slice(openTag.length, -closeTag.length)
      } else {
        replacement = `${openTag}${selectedText || "text"}${closeTag}`
      }
    } else {
      // Block/Prefix formatting like line lists
      replacement = `${openTag}${selectedText}`
    }

    const newValue = value.substring(0, start) + replacement + value.substring(end)
    onChange(newValue)

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + openTag.length,
        start + replacement.length - closeTag.length
      )
    }, 10)
  }

  // Clear formatting tags from selected text
  const clearFormatting = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    if (!selectedText) return

    // Strip HTML tags from selected text
    const stripped = selectedText.replace(/<\/?[^>]+(>|$)/g, "")
    const newValue = value.substring(0, start) + stripped + value.substring(end)
    onChange(newValue)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start, start + stripped.length)
    }, 10)
  }

  return (
    <div className={`border border-[#E5DFE2] rounded-xl overflow-hidden font-outfit ${className}`}>
      {/* Rich Text Toolbar Bar (matching screenshot) */}
      <div className="bg-[#FCFAF7] border-b border-[#E5DFE2] px-3 py-1.5 flex items-center gap-1 text-xs text-[#706065] flex-wrap">
        {/* Bold */}
        <button
          type="button"
          onClick={() => applyFormat("<b>", "</b>")}
          className="p-1.5 rounded-lg hover:bg-[#F6EBEF] hover:text-[#201B1E] transition-all flex items-center justify-center font-bold"
          title="Bold (<b>)"
        >
          <Bold className="w-4 h-4" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => applyFormat("<i>", "</i>")}
          className="p-1.5 rounded-lg hover:bg-[#F6EBEF] hover:text-[#201B1E] transition-all flex items-center justify-center italic"
          title="Italic (<i>)"
        >
          <Italic className="w-4 h-4" />
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => applyFormat("<u>", "</u>")}
          className="p-1.5 rounded-lg hover:bg-[#F6EBEF] hover:text-[#201B1E] transition-all flex items-center justify-center underline"
          title="Underline (<u>)"
        >
          <Underline className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-[#E5DFE2] mx-1" />

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => applyFormat("\n• ")}
          className="p-1.5 rounded-lg hover:bg-[#F6EBEF] hover:text-[#201B1E] transition-all flex items-center justify-center"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        {/* Numbered List */}
        <button
          type="button"
          onClick={() => applyFormat("\n1. ")}
          className="p-1.5 rounded-lg hover:bg-[#F6EBEF] hover:text-[#201B1E] transition-all flex items-center justify-center"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-[#E5DFE2] mx-1" />

        {/* Clear Formatting (Tx) */}
        <button
          type="button"
          onClick={clearFormatting}
          className="p-1.5 rounded-lg hover:bg-[#F6EBEF] hover:text-[#201B1E] transition-all flex items-center justify-center"
          title="Clear Formatting (Tx)"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>
      </div>

      {/* Textarea Input */}
      <textarea
        ref={textareaRef}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-4 bg-[#FCFAF7] focus:bg-white focus:outline-none text-sm text-[#201B1E] leading-relaxed font-outfit whitespace-pre-wrap border-0"
      />
    </div>
  )
}
