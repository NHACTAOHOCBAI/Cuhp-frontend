/**
 * Filter bar for the todo matrix view.
 *
 * Mirrors the structure of `features/vocabulary/VocabularyFilters.tsx`:
 *   - self-managed search input with a debounced commit
 *   - inline clear (`X`) button on the search field
 *   - left-side filters, right-side actions, bulk-style action button
 */
import * as React from "react"
import { Search, Trash2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { TabsControl, type TabsControlItem } from "@/components/ui/tabs-control"
import { SCOPE_OPTIONS } from "../constants"
import type { TodoScope } from "../types"

export interface TodoFiltersValue {
  scope: TodoScope
  q: string
  showCompleted: boolean
}

interface TodoFiltersProps {
  value: TodoFiltersValue
  onChange: (next: TodoFiltersValue) => void
  /** Number of completed tasks currently visible. */
  completedCount: number
  onClearCompleted: () => void
  isClearing: boolean
}

export function TodoFilters({
  value,
  onChange,
  completedCount,
  onClearCompleted,
  isClearing,
}: TodoFiltersProps) {
  // Local echo so the input updates instantly while the page only sees the
  // committed (debounced) value.
  const [searchInput, setSearchInput] = React.useState(value.q)

  React.useEffect(() => {
    setSearchInput(value.q)
  }, [value.q])

  React.useEffect(() => {
    const t = window.setTimeout(() => {
      const next = searchInput.trim()
      if (next !== value.q) onChange({ ...value, q: next })
    }, 300)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  const scopeItems: TabsControlItem<TodoScope>[] = SCOPE_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
  }))

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Scope */}
        <TabsControl
          value={value.scope}
          onChange={(v) => onChange({ ...value, scope: v })}
          items={scopeItems}
          className="[&_button]:shadow-none"
        />

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm công việc..."
            className="pl-9 pr-9 shadow-none"
            aria-label="Tìm công việc theo tên"
          />
          {searchInput ? (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Xoá tìm kiếm"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {/* Show completed toggle + clear action */}
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-muted-foreground">
          <Switch
            checked={value.showCompleted}
            onCheckedChange={(checked) =>
              onChange({ ...value, showCompleted: !!checked })
            }
          />
          Hiện việc đã xong
        </label>

        <Button
          variant="outline"
          size="sm"
          onClick={onClearCompleted}
          disabled={completedCount === 0 || isClearing}
          className="shrink-0"
        >
          <Trash2 className="mr-1.5 size-4" />
          Dọn việc đã xong
        </Button>
      </div>
    </div>
  )
}
