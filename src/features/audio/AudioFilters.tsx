/**
 * Filter bar: search input (debounced), level/category dropdowns, bulk action bar.
 */
import * as React from "react"
import { Search, Trash2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { CATEGORIES, LEVELS } from "./types"

export interface FilterValue {
  q: string
  level: string
  category: string
}

export function AudioFilters({
  value,
  onChange,
  selectedCount,
  onBulkDelete,
  onClearSelection,
  isBulkDeleting,
}: {
  value: FilterValue
  onChange: (v: FilterValue) => void
  selectedCount: number
  onBulkDelete: () => void
  onClearSelection: () => void
  isBulkDeleting: boolean
}) {
  // Local search state for immediate UI feedback; debounce upward.
  const [searchInput, setSearchInput] = React.useState(value.q)
  React.useEffect(() => {
    setSearchInput(value.q)
  }, [value.q])

  React.useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== value.q) onChange({ ...value, q: searchInput })
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  const hasFilter = value.q || value.level || value.category

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo tiêu đề, tên file, danh mục..."
            className="pl-9 pr-9"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Xoá tìm kiếm"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Level */}
        <Select
          value={value.level}
          onChange={(v) => onChange({ ...value, level: v })}
          options={[
            { value: "", label: "Tất cả level" },
            ...LEVELS.map((l) => ({ value: l.value, label: l.label })),
          ]}
          className="sm:w-44"
          ariaLabel="Lọc theo level"
        />

        {/* Category */}
        <Select
          value={value.category}
          onChange={(v) => onChange({ ...value, category: v })}
          options={[
            { value: "", label: "Tất cả danh mục" },
            ...CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
          ]}
          className="sm:w-44"
          ariaLabel="Lọc theo danh mục"
        />

        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({ q: "", level: "", category: "" })
            }
          >
            <X className="h-4 w-4 mr-1" /> Xoá lọc
          </Button>
        )}
      </div>

      {/* Bulk action bar — only visible when at least one row is selected */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <span className="font-medium">
            Đã chọn {selectedCount} mục
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
          >
            Bỏ chọn
          </Button>
          <div className="ml-auto">
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
              disabled={isBulkDeleting}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {isBulkDeleting ? "Đang xoá..." : `Xoá ${selectedCount} mục`}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}