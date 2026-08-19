import type { TodoQuadrant, TodoTask } from "@/types"

/** Scope of the "Hôm nay / Tuần này / Tất cả" filter. */
export type TodoScope = "today" | "week" | "all"

export interface TodoListParams {
  scope?: TodoScope
  quadrant?: TodoQuadrant
  q?: string
  show_completed?: boolean
}

export interface TodoListResponse {
  items: TodoTask[]
  total: number
}

/** Payload for creating a task; the server owns id/position/timestamps. */
export interface TodoTaskCreate {
  title: string
  description?: string | null
  quadrant: TodoQuadrant
  due_date?: string | null
  scheduled_date?: string | null
  completed?: boolean
  estimated_time?: number | null
}

/**
 * Partial update. Omitted keys are left untouched; an explicit `null` on
 * `due_date` / `description` clears the field (the server distinguishes the
 * two via Pydantic's `model_fields_set`).
 */
export interface TodoTaskUpdate {
  title?: string
  description?: string | null
  quadrant?: TodoQuadrant
  due_date?: string | null
  scheduled_date?: string | null
  completed?: boolean
  position?: number
  estimated_time?: number | null
}

export interface TodoTaskMove {
  quadrant: TodoQuadrant
  position: number
}

export interface QuadrantStat {
  quadrant: TodoQuadrant
  label: string
  total: number
  completed: number
  open_count: number
  overdue: number
}

export interface DailyCompletion {
  date: string
  completed_count: number
  created_count: number
}

export interface TodoStats {
  quadrant_stats: QuadrantStat[]
  daily_completion: DailyCompletion[]
  total_open: number
  total_completed: number
  overdue_count: number
  due_today_count: number
  completed_today: number
  completion_rate: number
  focus_rate: number
}
