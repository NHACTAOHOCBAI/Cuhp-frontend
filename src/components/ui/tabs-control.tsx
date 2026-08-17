/**
 * Pill-style tab control.
 *
 * Renders an inline-flex group with a soft `bg-muted` background and one
 * active pill. Shared by the Gym and Todo pages for their header tabs.
 */
import * as React from "react"
import { cn } from "@/lib/utils"

export interface TabsControlItem<T extends string> {
  value: T
  label: string
  icon?: React.ReactNode
}

interface TabsControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  items: TabsControlItem<T>[]
  className?: string
}

export function TabsControl<T extends string>({
  value,
  onChange,
  items,
  className,
}: TabsControlProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg bg-muted p-1 text-muted-foreground",
        className
      )}
      role="tablist"
    >
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-semibold transition-all cursor-pointer",
              active
                ? "bg-background text-foreground shadow-sm"
                : "hover:text-foreground"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
