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



