import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"
import {
  bulkDeleteVocabularies,
  createVocabulary,
  deleteVocabulary,
  fetchVocabularies,
  updateVocabulary,
} from "./api"
import type {
  VocabularyListParams,
  VocabularyUpdate,
} from "./types"
import type { VocabularyItem } from "@/types"

const QUERY_KEY = ["vocabularies"] as const

export function useVocabulariesQuery(params: VocabularyListParams) {
  const { token } = useAuth()
  return useQuery({
    queryKey: [...QUERY_KEY, params] as const,
    queryFn: () => fetchVocabularies(params, token),
    enabled: !!token,
    placeholderData: (prev) => prev,
  })
}

export function useVocabularyById(id: string | undefined) {
  const { token } = useAuth()
  return useQuery({
    queryKey: [...QUERY_KEY, "detail", id] as const,
    queryFn: async () => {
      // Find within current queries or fetch individually
      // Let's implement fetch individually since we have GET /vocab_id
      const API_BASE = "/api/v1/vocabulary"
      const { apiFetch } = await import("@/lib/api")
      return apiFetch<VocabularyItem>(`${API_BASE}/${id}`, { token })
    },
    enabled: !!token && !!id,
    staleTime: 60_000,
  })
}

export function useCreateVocabulary() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Omit<VocabularyItem, "id" | "user_id" | "created_at" | "updated_at" | "box_number" | "next_review_at">) =>
      createVocabulary(payload, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateVocabulary() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: VocabularyUpdate }) =>
      updateVocabulary(id, payload, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteVocabulary() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteVocabulary(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useBulkDeleteVocabulary() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteVocabularies(ids, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
