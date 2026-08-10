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
}




