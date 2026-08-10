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
  created_at: string
  updated_at: string
  user_id: string
  box_number: number
  next_review_at: string
}




