export interface User {
  id: string
  username: string
  name: string
  avatar?: string
  initials: string
  status: "online" | "offline" | "away"
  role: "admin" | "user"
  lastSeen?: string
  created_at?: string
  daily_target: number
  current_streak: number
  last_reviewed_date?: string | null
  words_reviewed_today: number
  last_streak_increment_date?: string | null
}

export interface AuthState {
  token: string
  user: User
}

export interface VocabularyItem {
  id: string
  word: string
  pronunciation?: string | null
  meaning: string
  word_type?: string | null
  notes?: string | null
  context_sentence?: string | null
  created_at: string
  updated_at: string
  user_id: string
  box_number: number
  next_review_at: string
}

export interface WorkoutCategory {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface WorkoutExercise {
  id: string
  user_id: string
  category_id?: string | null
  name: string
  date: string
  sets: number
  reps: number
  weight?: number | null
  completed: boolean
  created_at: string
  category?: WorkoutCategory | null
}

export interface DailyVolume {
  date: string
  volume: number
  completed_count: number
  total_count: number
}

export interface ExerciseProgressPoint {
  date: string
  max_weight: number
  volume: number
}

export interface ExerciseProgress {
  exercise_name: string
  points: ExerciseProgressPoint[]
}

export interface GymStats {
  weekly_volume: DailyVolume[]
  exercise_progress: ExerciseProgress[]
}

/** The four cells of the Eisenhower time-management matrix. */
export type TodoQuadrant = "inbox" | "do" | "schedule" | "delegate" | "eliminate"

export interface TodoTask {
  id: string
  user_id: string
  title: string
  description?: string | null
  quadrant: TodoQuadrant
  /** ISO `YYYY-MM-DD`, or null for a task with no deadline. */
  due_date?: string | null
  /** ISO YYYY-MM-DD, date scheduled on planner. */
  scheduled_date?: string | null
  completed: boolean
  completed_at?: string | null
  /** Sort order inside its quadrant; dense 0..n-1, maintained by the server. */
  position: number
  created_at: string
  updated_at?: string | null
}





