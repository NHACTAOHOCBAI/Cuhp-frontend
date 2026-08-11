import { apiFetch } from "@/lib/api"
import type {
  ReadingPassage,
  ReadingPassageListParams,
  ReadingPassageListResponse,
  ReadingPassageCreate,
  ReadingPassageUpdate,
  TranslationPractice,
  TranslationPracticeCreate,
  ReadingComment,
  ReadingCommentCreate,
} from "./types"

const API_BASE = "/reading"

export async function fetchReadingPassages(
  params: ReadingPassageListParams,
  token: string | null,
): Promise<ReadingPassageListResponse> {
  const search = new URLSearchParams()
  if (params.page) search.set("page", String(params.page))
  if (params.page_size) search.set("page_size", String(params.page_size))
  if (params.q) search.set("q", params.q)
  if (params.level) search.set("level", params.level)
  if (params.category) search.set("category", params.category)

  const qs = search.toString()
  const path = qs ? `${API_BASE}?${qs}` : API_BASE
  return apiFetch<ReadingPassageListResponse>(path, { token })
}

export async function fetchReadingPassageById(
  id: string,
  token: string | null,
): Promise<ReadingPassage> {
  return apiFetch<ReadingPassage>(`${API_BASE}/${id}`, { token })
}

export async function createReadingPassage(
  payload: ReadingPassageCreate,
  token: string | null,
): Promise<ReadingPassage> {
  return apiFetch<ReadingPassage>(API_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  })
}

export async function updateReadingPassage(
  id: string,
  payload: ReadingPassageUpdate,
  token: string | null,
): Promise<ReadingPassage> {
  return apiFetch<ReadingPassage>(`${API_BASE}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    token,
  })
}

export async function deleteReadingPassage(
  id: string,
  token: string | null,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`${API_BASE}/${id}`, {
    method: "DELETE",
    token,
  })
}

export async function fetchTranslationPractice(
  passageId: string,
  token: string | null,
): Promise<TranslationPractice | null> {
  return apiFetch<TranslationPractice | null>(`${API_BASE}/${passageId}/translation`, { token })
}

export async function saveTranslationPractice(
  passageId: string,
  payload: TranslationPracticeCreate,
  token: string | null,
): Promise<TranslationPractice> {
  return apiFetch<TranslationPractice>(`${API_BASE}/${passageId}/translation`, {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  })
}

export async function fetchReadingComments(
  passageId: string,
  token: string | null,
): Promise<ReadingComment[]> {
  return apiFetch<ReadingComment[]>(`${API_BASE}/${passageId}/comments`, { token })
}

export async function createReadingComment(
  passageId: string,
  payload: ReadingCommentCreate,
  token: string | null,
): Promise<ReadingComment> {
  return apiFetch<ReadingComment>(`${API_BASE}/${passageId}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  })
}

export async function deleteReadingComment(
  commentId: string,
  token: string | null,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`${API_BASE}/comments/${commentId}`, {
    method: "DELETE",
    token,
  })
}

export async function updateReadingComment(
  commentId: string,
  payload: ReadingCommentCreate,
  token: string | null,
): Promise<ReadingComment> {
  return apiFetch<ReadingComment>(`${API_BASE}/comments/${commentId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    token,
  })
}
