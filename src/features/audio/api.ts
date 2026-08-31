/**
 * HTTP wrappers for the Audio feature.
 *
 * - CRUD operations use the shared `apiFetch` wrapper (auto-injects Bearer token
 *   and parses the `detail` field on errors).
 * - The upload endpoint uses a dedicated `XMLHttpRequest` because the standard
 *   `fetch` API does not surface upload progress events.
 */
import { apiFetch } from "@/lib/api"
import type {
  AudioListItem,
  AudioListParams,
  AudioListResponse,
  AudioTrack,
  AudioUpdate,
  BulkDeleteResponse,
  UploadProgress,
  AudioComment,
} from "./types"

const API_BASE = "/api/v1/audio"

export async function fetchAudios(
  params: AudioListParams,
  token: string | null,
): Promise<AudioListResponse<AudioListItem>> {
  const search = new URLSearchParams()
  if (params.page) search.set("page", String(params.page))
  if (params.page_size) search.set("page_size", String(params.page_size))
  if (params.q) search.set("q", params.q)
  if (params.level) search.set("level", params.level)
  if (params.category) search.set("category", params.category)

  const qs = search.toString()
  const path = qs ? `${API_BASE}?${qs}` : API_BASE
  return apiFetch<AudioListResponse<AudioListItem>>(path, { token })
}

export async function fetchAudioById(
  id: string,
  token: string | null,
): Promise<AudioTrack> {
  return apiFetch<AudioTrack>(`${API_BASE}/${id}`, { token })
}

export async function updateAudio(
  id: string,
  payload: AudioUpdate,
  token: string | null,
): Promise<AudioTrack> {
  return apiFetch<AudioTrack>(`${API_BASE}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    token,
  })
}

export async function deleteAudio(
  id: string,
  token: string | null,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`${API_BASE}/${id}`, {
    method: "DELETE",
    token,
  })
}

export async function bulkDeleteAudios(
  ids: string[],
  token: string | null,
): Promise<BulkDeleteResponse> {
  return apiFetch<BulkDeleteResponse>(`${API_BASE}/bulk-delete`, {
    method: "POST",
    body: JSON.stringify({ ids }),
    token,
  })
}

/**
 * Upload a file with progress reporting via XHR.
 * The shared `apiFetch` cannot do this because `fetch` does not emit
 * upload progress events.
 */
export function uploadAudioWithProgress(
  formData: FormData,
  token: string | null,
  onProgress: (p: UploadProgress) => void,
): Promise<AudioTrack> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        onProgress({
          loaded: e.loaded,
          total: e.total,
          pct: Math.round((e.loaded / e.total) * 100),
        })
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as AudioTrack)
        } catch {
          reject(new Error("Invalid response from server."))
        }
      } else {
        let detail = `Upload failed: ${xhr.status}`
        try {
          const data = JSON.parse(xhr.responseText)
          if (data && typeof data === "object" && "detail" in data) {
            detail = (data as { detail: string }).detail ?? detail
          }
        } catch {
          /* ignore */
        }
        reject(new Error(detail))
      }
    }
    xhr.onerror = () => reject(new Error("Network error. Please try again."))
    xhr.onabort = () => reject(new Error("Upload was canceled."))

    xhr.open("POST", `${API_BASE}/upload`)
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`)
    xhr.send(formData)
  })
}

export async function fetchAudioComments(
  audioId: string,
  token: string | null,
): Promise<AudioComment[]> {
  return apiFetch<AudioComment[]>(`${API_BASE}/${audioId}/comments`, { token })
}

export async function createAudioComment(
  audioId: string,
  content: string,
  selectedText: string | null,
  token: string | null,
): Promise<AudioComment> {
  return apiFetch<AudioComment>(`${API_BASE}/${audioId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content, selected_text: selectedText }),
    token,
  })
}

export async function updateAudioComment(
  commentId: string,
  content: string,
  token: string | null,
): Promise<AudioComment> {
  return apiFetch<AudioComment>(`${API_BASE}/comments/${commentId}`, {
    method: "PATCH",
    body: JSON.stringify({ content }),
    token,
  })
}

export async function deleteAudioComment(
  commentId: string,
  token: string | null,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`${API_BASE}/comments/${commentId}`, {
    method: "DELETE",
    token,
  })
}