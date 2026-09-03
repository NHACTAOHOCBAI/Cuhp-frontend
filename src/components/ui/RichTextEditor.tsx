import * as React from "react"
import { Bold, Italic, Underline, List, ListOrdered, RemoveFormatting } from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  className?: string
  minHeight?: number | string
  maxHeight?: number | string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your text here...",
  rows = 6,
  className = "",
  minHeight,
  maxHeight,
}: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null)
  const isInternalUpdate = React.useRef(false)
  const [isFocused, setIsFocused] = React.useState(false)

  // Helper to normalize empty HTML
  const checkIsEmpty = (html: string) => {
    if (!html) return true
    const stripped = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()
    return stripped.length === 0
  }

  const [isEmpty, setIsEmpty] = React.useState(() => checkIsEmpty(value))

  // Sync external value to contentEditable innerHTML
  React.useEffect(() => {
    if (editorRef.current) {
      if (isInternalUpdate.current) {
        isInternalUpdate.current = false
        return
      }

      const currentHtml = editorRef.current.innerHTML
      if (value !== currentHtml) {
        if (!value) {
          editorRef.current.innerHTML = ""
          setIsEmpty(true)
          return
        }

        // If value has no HTML tags, convert newlines to paragraphs
        const hasHtmlTags = /<[a-z][\s\S]*>/i.test(value)
        if (!hasHtmlTags) {
          const formatted = value
            .split(/\n\s*\n/)
            .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
            .join("")
          editorRef.current.innerHTML = formatted
        } else {
          editorRef.current.innerHTML = value
        }
        setIsEmpty(checkIsEmpty(editorRef.current.innerHTML))
      }
    }
  }, [value])

  const handleInput = () => {
    if (!editorRef.current) return
    const html = editorRef.current.innerHTML
    const empty = checkIsEmpty(html)
    setIsEmpty(empty)

    isInternalUpdate.current = true
    onChange(empty ? "" : html)
  }

  const executeCommand = (command: string, valueArg: string | undefined = undefined) => {
    editorRef.current?.focus()
    document.execCommand(command, false, valueArg)
    handleInput()
  }

  const clearFormatting = () => {
    editorRef.current?.focus()
    document.execCommand("removeFormat", false)
    handleInput()
  }

  // Handle Clean Paste (Google Docs / Word / Browser)
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const clipboardData = e.clipboardData
    const html = clipboardData.getData("text/html")
    const text = clipboardData.getData("text/plain")

    if (html) {
      try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, "text/html")
        // Remove style, script, meta, link tags
        doc.querySelectorAll("script, style, meta, link, xml").forEach((el) => el.remove())
        // Remove Google Docs id attributes
        doc.querySelectorAll('[id^="docs-internal-guid"]').forEach((el) => {
          el.removeAttribute("id")
        })
        const clean = doc.body.innerHTML
        document.execCommand("insertHTML", false, clean)
        handleInput()
        return
      } catch {
        // fallback
      }
    }

    const formattedText = text.replace(/\r\n/g, "\n")
    document.execCommand("insertText", false, formattedText)
    handleInput()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "b" || e.key === "B") {
        e.preventDefault()
        executeCommand("bold")
      } else if (e.key === "i" || e.key === "I") {
        e.preventDefault()
        executeCommand("italic")
      } else if (e.key === "u" || e.key === "U") {
        e.preventDefault()
        executeCommand("underline")
      }
    }
  }

  const computedMinHeight =
    minHeight !== undefined
      ? typeof minHeight === "number"
        ? `${minHeight}px`
        : minHeight
      : `${Math.max(rows * 24, 110)}px`
  const computedMaxHeight =
    maxHeight !== undefined
      ? typeof maxHeight === "number"
        ? `${maxHeight}px`
        : maxHeight
      : `${Math.max(rows * 40, 360)}px`

  return (
    <div
      className={`border rounded-xl overflow-hidden font-outfit transition-colors ${
        isFocused ? "border-[#EFBCD5] ring-2 ring-[#EFBCD5]/30 bg-white" : "border-[#E5DFE2] bg-[#FCFAF7]"
      } ${className}`}
    >
      {/* Rich Text Toolbar Bar */}
      <div className="bg-[#FCFAF7] border-b border-[#E5DFE2] px-3 py-1.5 flex items-center gap-1 text-xs text-[#706065] flex-wrap select-none">
        {/* Bold */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            executeCommand("bold")
          }}
          className="p-1.5 rounded-lg hover:bg-[#F6EBEF] hover:text-[#201B1E] transition-all flex items-center justify-center font-bold active:scale-95"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            executeCommand("italic")
          }}
          className="p-1.5 rounded-lg hover:bg-[#F6EBEF] hover:text-[#201B1E] transition-all flex items-center justify-center italic active:scale-95"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>

        {/* Underline */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            executeCommand("underline")
          }}
          className="p-1.5 rounded-lg hover:bg-[#F6EBEF] hover:text-[#201B1E] transition-all flex items-center justify-center underline active:scale-95"
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-[#E5DFE2] mx-1" />

        {/* Bullet List */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            executeCommand("insertUnorderedList")
          }}
          className="p-1.5 rounded-lg hover:bg-[#F6EBEF] hover:text-[#201B1E] transition-all flex items-center justify-center active:scale-95"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        {/* Numbered List */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            executeCommand("insertOrderedList")
          }}
          className="p-1.5 rounded-lg hover:bg-[#F6EBEF] hover:text-[#201B1E] transition-all flex items-center justify-center active:scale-95"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-[#E5DFE2] mx-1" />

        {/* Clear Formatting (Tx) */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            clearFormatting()
          }}
          className="p-1.5 rounded-lg hover:bg-[#F6EBEF] hover:text-[#201B1E] transition-all flex items-center justify-center active:scale-95"
          title="Clear Formatting"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>
      </div>

      {/* WYSIWYG Editable Area */}
      <div
        className="relative cursor-text p-4"
        onClick={() => editorRef.current?.focus()}
      >
        {/* Placeholder overlay */}
        {isEmpty && !isFocused && (
          <span className="absolute top-4 left-4 text-sm text-[#817479] pointer-events-none select-none italic">
            {placeholder}
          </span>
        )}

        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false)
            handleInput()
          }}
          className="w-full bg-transparent focus:outline-none text-sm text-[#201B1E] leading-relaxed font-outfit overflow-y-auto [&_p]:mb-2.5 [&_h3]:font-bold [&_h3]:text-base [&_h3]:mb-2 [&_h2]:font-bold [&_h2]:text-lg [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2"
          style={{
            minHeight: computedMinHeight,
            maxHeight: computedMaxHeight,
          }}
        />
      </div>
    </div>
  )
}
