import * as React from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: React.ReactNode
  icon?: React.ReactNode
  titleClassName?: string
  descriptionClassName?: string
  children?: React.ReactNode
  className?: string
}

/**
 * Shared header block for admin pages.
 *
 * Standardizes the title row + right-slot pattern used by Audio, Reading,
 * Vocabulary, Dashboard, and Gym so all admin pages share the same look.
 */
export function PageHeader({
  title,
  description,
  icon,
  titleClassName,
  descriptionClassName,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
        className
      )}
    >
      <div className="space-y-1 min-w-0">
        <h2
          className={cn(
            "text-2xl font-bold tracking-tight text-foreground flex items-center gap-2",
            titleClassName
          )}
        >
          {icon}
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "text-sm text-muted-foreground",
              descriptionClassName
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {children ? (
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {children}
        </div>
      ) : null}
    </div>
  )
}
