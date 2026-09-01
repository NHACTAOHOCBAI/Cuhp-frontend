import { apiFetch } from "@/lib/api"
import type { VocabularyItem } from "@/types"
import type {
  VocabularyListParams,
  VocabularyListResponse,
  VocabularyUpdate,
  VocabularyBulkDeleteResponse,
} from "./types"

const API_BASE = "/api/v1/vocabulary"

export async function fetchVocabularies(
  params: VocabularyListParams,
  token: string | null,
): Promise<VocabularyListResponse> {
  const search = new URLSearchParams()
  if (params.page) search.set("page", String(params.page))
  if (params.page_size) search.set("page_size", String(params.page_size))
  if (params.q) search.set("q", params.q)
  if (params.word_type) search.set("word_type", params.word_type)
  if (params.due !== undefined && params.due !== null) search.set("due", String(params.due))

  const qs = search.toString()
  const path = qs ? `${API_BASE}?${qs}` : API_BASE
  return apiFetch<VocabularyListResponse>(path, { token })
}

export async function createVocabulary(
  payload: Omit<VocabularyItem, "id" | "user_id" | "created_at" | "updated_at" | "box_number" | "next_review_at">,
  token: string | null,
): Promise<VocabularyItem> {
  return apiFetch<VocabularyItem>(API_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  })
}

export async function updateVocabulary(
  id: string,
  payload: VocabularyUpdate,
  token: string | null,
): Promise<VocabularyItem> {
  return apiFetch<VocabularyItem>(`${API_BASE}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    token,
  })
}

export async function deleteVocabulary(
  id: string,
  token: string | null,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`${API_BASE}/${id}`, {
    method: "DELETE",
    token,
  })
}

export async function bulkDeleteVocabularies(
  ids: string[],
  token: string | null,
): Promise<VocabularyBulkDeleteResponse> {
  return apiFetch<VocabularyBulkDeleteResponse>(`${API_BASE}/bulk-delete`, {
    method: "POST",
    body: JSON.stringify({ ids }),
    token,
  })
}

export interface VocabularyLookupResult {
  word: string
  pronunciation?: string | null
  meaning?: string | null
  word_type?: string | null
}

export async function lookupVocabularyWord(
  word: string,
  token: string | null,
): Promise<VocabularyLookupResult> {
  const qs = new URLSearchParams({ word }).toString()
  return apiFetch<VocabularyLookupResult>(`${API_BASE}/lookup/word?${qs}`, { token })
}

export interface VocabularyReviewRequest {
  known: boolean
}

export interface VocabularyReviewResponse {
  vocabulary: VocabularyItem
  daily_target: number
  current_streak: number
  words_reviewed_today: number
  streak_incremented_today: boolean
}

export async function reviewVocabulary(
  id: string,
  payload: VocabularyReviewRequest,
  token: string | null,
): Promise<VocabularyReviewResponse> {
  return apiFetch<VocabularyReviewResponse>(`${API_BASE}/${id}/review`, {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  })
}
