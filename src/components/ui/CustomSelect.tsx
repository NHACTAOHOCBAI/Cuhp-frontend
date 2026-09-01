import * as React from "react"
import { ChevronDown, Check } from "lucide-react"

export interface SelectOption {
  value: string
  label: string
  color?: string
}

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "-- Select muscle group --",
  className = "",
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Find currently selected option
  const selectedOption = options.find((opt) => opt.value === value)

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Close dropdown on Escape key
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between px-4 py-3 bg-[#FCFAF7] border rounded-xl text-sm font-outfit transition-all duration-200 text-left outline-none ${
          isOpen
            ? "border-[#EFBCD5] ring-2 ring-[#EFBCD5]/30 shadow-sm"
            : "border-[#E5DFE2] hover:border-[#EFBCD5]/60"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`truncate ${
            selectedOption ? "text-[#201B1E] font-semibold" : "text-[#706065]/70 font-normal"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#706065] transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? "rotate-180 text-[#7b5268]" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Overlay */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 py-1.5 bg-white/95 backdrop-blur-md border border-[#E5DFE2] rounded-xl shadow-[0_10px_30px_-5px_rgba(32,27,30,0.15)] animate-in fade-in-50 zoom-in-95 duration-150 max-h-60 overflow-y-auto">
          {/* Default/Placeholder Option */}
          {placeholder && (
            <div
              onClick={() => handleSelect("")}
              className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-[#706065] cursor-pointer hover:bg-[#fcf1f5]/60 transition-colors flex items-center justify-between ${
                !value ? "bg-[#fcf1f5] text-[#7b5268] font-bold" : ""
              }`}
            >
              <span>{placeholder}</span>
              {!value && <Check className="w-3.5 h-3.5 text-[#7b5268]" />}
            </div>
          )}

          {/* Options List */}
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`px-4 py-2.5 text-sm font-outfit cursor-pointer flex items-center justify-between transition-colors ${
                  isSelected
                    ? "bg-[#fcf1f5] text-[#7b5268] font-bold"
                    : "text-[#201B1E] hover:bg-[#fcf1f5]/60 hover:text-[#7b5268]"
                }`}
              >
                <div className="flex items-center gap-2">
                  {option.color && (
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  <span>{option.label}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#7b5268] stroke-[2.5px]" />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
