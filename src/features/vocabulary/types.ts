import type { VocabularyItem } from "@/types"

export const WORD_TYPES = [
  { value: "noun", label: "Danh từ (Noun)" },
  { value: "verb", label: "Động từ (Verb)" },
  { value: "adjective", label: "Tính từ (Adjective)" },
  { value: "adverb", label: "Trạng từ (Adverb)" },
  { value: "pronoun", label: "Đại từ (Pronoun)" },
  { value: "preposition", label: "Giới từ (Preposition)" },
  { value: "conjunction", label: "Liên từ (Conjunction)" },
  { value: "interjection", label: "Thán từ (Interjection)" },
] as const

export type WordType = (typeof WORD_TYPES)[number]["value"]

export interface VocabularyUpdate {
  word?: string
  pronunciation?: string | null
  meaning?: string
  word_type?: string | null
  notes?: string | null
}

export interface VocabularyListParams {
  page?: number
  page_size?: number
  q?: string
  word_type?: string
}

export interface VocabularyListResponse {
  items: VocabularyItem[]
  total: number
  page: number
  page_size: number
}

export interface VocabularyBulkDeleteResponse {
  deleted: number
  failed: string[]
}
