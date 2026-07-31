/**
 * Domain types for the Audio (listening lesson) feature.
 */

export const LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const

export const CATEGORIES = [
  { value: "toeic", label: "TOEIC" },
  { value: "ielts", label: "IELTS" },
  { value: "general", label: "General English" },
  { value: "conversation", label: "Conversation" },
  { value: "business", label: "Business English" },
] as const

export type Level = (typeof LEVELS)[number]["value"]
export type Category = (typeof CATEGORIES)[number]["value"]

export const MAX_TRANSCRIPT_LENGTH = 50_000

/** Lightweight shape used by list endpoints. Omits transcript text. */
export interface AudioListItem {
  id: string
  title: string
  filename: string
  url: string
  user_id: string
  created_at: string
  level?: string | null
  category?: string | null
  has_transcript: boolean
}

/** Full shape returned by the detail endpoint. */
export interface AudioTrack extends AudioListItem {
  r2_key: string
  transcript?: string | null
}

export interface AudioUpdate {
  title?: string
  level?: string | null
  category?: string | null
  transcript?: string | null
}

export interface AudioListParams {
  page?: number
  page_size?: number
  q?: string
  level?: string
  category?: string
}

export interface AudioListResponse<T = AudioListItem> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface BulkDeleteResponse {
  deleted: number
  failed: string[]
}

export interface UploadProgress {
  loaded: number
  total: number
  pct: number
}

export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const