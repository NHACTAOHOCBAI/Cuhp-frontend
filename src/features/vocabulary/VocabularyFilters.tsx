import * as React from "react"
import { Search, Trash2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { WORD_TYPES } from "./types"

export interface FilterValue {
  q: string
  word_type: string
}

export function VocabularyFilters({
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

  const hasFilter = value.q || value.word_type

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo từ vựng, nghĩa, ghi chú..."
            className="pl-9 pr-9 shadow-none"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Xoá tìm kiếm"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Word Type */}
        <Select
          value={value.word_type}
          onChange={(v) => onChange({ ...value, word_type: v })}
          options={[
            { value: "", label: "Tất cả loại từ" },
            ...WORD_TYPES.map((w) => ({ value: w.value, label: w.label })),
          ]}
          className="sm:w-56 [&_button]:shadow-none"
          ariaLabel="Lọc theo loại từ"
        />

        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({ q: "", word_type: "" })
            }
          >
            <X className="h-4 w-4 mr-1" /> Xoá lọc
          </Button>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm animate-in fade-in-0 slide-in-from-top duration-200">
          <span className="font-medium text-foreground">
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
