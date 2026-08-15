import * as React from "react"
import { Bold, Italic, Underline, List, ListOrdered, RemoveFormatting } from "lucide-react"
import { Button } from "./button"

export interface RichTextEditorProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null)

  // Sync value from prop to DOM only if they differ
  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ""
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const execCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value)
    handleInput()
    editorRef.current?.focus()
  }

  return (
    <div className={`flex flex-col border border-input bg-background focus-within:ring-1 focus-within:ring-ring ${className || ""}`}>
      <style>{`
        .rich-text-editor-content[data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          opacity: 0.6;
          pointer-events: none;
        }
      `}</style>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-1 bg-muted/40 border-b border-input shrink-0 select-none">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={() => execCommand("bold")}
          title="In đậm (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={() => execCommand("italic")}
          title="In nghiêng (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={() => execCommand("underline")}
          title="Gạch chân (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <div className="w-[1px] h-4 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={() => execCommand("insertUnorderedList")}
          title="Danh sách không thứ tự"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={() => execCommand("insertOrderedList")}
          title="Danh sách có thứ tự"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={() => execCommand("removeFormat")}
          title="Xóa định dạng"
        >
          <RemoveFormatting className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="flex-1 min-h-[150px] p-3 outline-none overflow-y-auto prose dark:prose-invert max-w-none text-sm leading-relaxed select-text rich-text-editor-content"
        data-placeholder={placeholder}
      />
    </div>
  )
}
