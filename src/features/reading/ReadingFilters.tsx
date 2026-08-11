import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { READING_LEVELS, READING_CATEGORIES } from "./types"

export interface FilterValue {
  q: string
  level: string
  category: string
}

export function ReadingFilters({
  value,
  onChange,
}: {
  value: FilterValue
  onChange: (val: FilterValue) => void
}) {
  const [q, setQ] = React.useState(value.q)

  // Debounce search input changes
  React.useEffect(() => {
    const t = setTimeout(() => {
      onChange({ ...value, q })
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  // Sync external filter changes to local query state
  React.useEffect(() => {
    setQ(value.q)
  }, [value.q])

  const handleLevelChange = (level: string) => {
    onChange({ ...value, level })
  }

  const handleCategoryChange = (category: string) => {
    onChange({ ...value, category })
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center w-full bg-card p-4 rounded-lg border border-border">
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm bài đọc (tiêu đề, nội dung)..."
          className="pl-9"
        />
      </div>

      {/* Level Select */}
      <div className="w-full sm:w-[160px]">
        <Select
          value={value.level}
          onChange={handleLevelChange}
          placeholder="-- Cấp độ --"
          options={[
            { value: "", label: "Tất cả cấp độ" },
            ...READING_LEVELS.map((item) => ({ value: item.value, label: item.label })),
          ]}
          ariaLabel="Chọn cấp độ bài đọc"
        />
      </div>

      {/* Category Select */}
      <div className="w-full sm:w-[200px]">
        <Select
          value={value.category}
          onChange={handleCategoryChange}
          placeholder="-- Danh mục --"
          options={[
            { value: "", label: "Tất cả danh mục" },
            ...READING_CATEGORIES.map((item) => ({ value: item.value, label: item.label })),
          ]}
          ariaLabel="Chọn danh mục bài đọc"
        />
      </div>
    </div>
  )
}
