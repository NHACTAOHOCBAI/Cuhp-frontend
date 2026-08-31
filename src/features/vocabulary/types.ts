import type { VocabularyItem } from "@/types"

export const WORD_TYPES = [
  { value: "noun", label: "Noun" },
  { value: "verb", label: "Verb" },
  { value: "adjective", label: "Adjective" },
  { value: "adverb", label: "Adverb" },
  { value: "pronoun", label: "Pronoun" },
  { value: "preposition", label: "Preposition" },
  { value: "conjunction", label: "Conjunction" },
  { value: "interjection", label: "Interjection" },
  { value: "other", label: "Other" },
] as const

export type WordType = (typeof WORD_TYPES)[number]["value"]

export interface VocabularyUpdate {
  word?: string
  pronunciation?: string | null
  meaning?: string
  word_type?: string | null
  notes?: string | null
  context_sentence?: string | null
}

export interface VocabularyListParams {
  page?: number
  page_size?: number
  q?: string
  word_type?: string
  due?: boolean
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
