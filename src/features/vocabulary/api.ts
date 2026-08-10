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
