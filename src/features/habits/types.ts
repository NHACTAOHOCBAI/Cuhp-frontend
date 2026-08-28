export interface Habit {
  id: string
  user_id: string
  name: string
  icon: string | null
  description: string | null
  is_active: boolean
  order: number
  created_at: string
  updated_at: string
  streak: number
}

export interface HabitCreate {
  name: string
  icon?: string | null
  description?: string | null
  is_active?: boolean
  order?: number
}

export interface HabitUpdate {
  name?: string
  icon?: string | null
  description?: string | null
  is_active?: boolean
  order?: number
}

export interface HabitLog {
  id: string
  habit_id: string
  date: string // YYYY-MM-DD
  completed: boolean
  created_at: string
}

export interface HabitLogToggle {
  habit_id: string
  date: string // YYYY-MM-DD
  completed: boolean
}
