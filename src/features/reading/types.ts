export interface ReadingCommentUser {
  id: string
  name: string
  initials: string
  role: string
}

export interface ReadingComment {
  id: string
  passage_id: string
  user_id: string
  content: string
  selected_text?: string | null
  created_at: string
  user: ReadingCommentUser
}

export interface TranslationPractice {
  id: string
  passage_id: string
  user_id: string
  translation_content: string
  created_at: string
  updated_at: string
}

export interface ReadingPassage {
  id: string
  title: string
  content: string
  level?: string | null
  category?: string | null
  user_id: string
  created_at: string
}

export interface ReadingPassageListItem {
  id: string
  title: string
  content: string
  level?: string | null
  category?: string | null
  user_id: string
  created_at: string
}

export interface ReadingPassageListParams {
  page?: number
  page_size?: number
  q?: string
  level?: string
  category?: string
}

export interface ReadingPassageListResponse {
  items: ReadingPassageListItem[]
  total: number
  page: number
  page_size: number
}

export interface ReadingPassageCreate {
  title: string
  content: string
  level?: string | null
  category?: string | null
}

export interface ReadingPassageUpdate {
  title?: string
  content?: string
  level?: string | null
  category?: string | null
}

export interface TranslationPracticeCreate {
  translation_content: string
}

export interface ReadingCommentCreate {
  content: string
  selected_text?: string | null
}

export const READING_LEVELS = [
  { value: "A1", label: "A1 - Beginner" },
  { value: "A2", label: "A2 - Elementary" },
  { value: "B1", label: "B1 - Intermediate" },
  { value: "B2", label: "B2 - Upper Intermediate" },
  { value: "C1", label: "C1 - Advanced" },
  { value: "C2", label: "C2 - Proficient" },
] as const

export const READING_CATEGORIES = [
  { value: "General", label: "Daily Life" },
  { value: "Business", label: "Business & Office" },
  { value: "Science", label: "Science & Life" },
  { value: "Literature", label: "Literature & Arts" },
  { value: "News", label: "News & Current Affairs" },
  { value: "Exam", label: "Exam Prep (IELTS, TOEFL...)" },
  { value: "Other", label: "Other" },
] as const
