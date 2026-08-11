import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"
import {
  fetchReadingPassages,
  fetchReadingPassageById,
  createReadingPassage,
  updateReadingPassage,
  deleteReadingPassage,
  fetchTranslationPractice,
  saveTranslationPractice,
  fetchReadingComments,
  createReadingComment,
  deleteReadingComment,
  updateReadingComment,
} from "./api"
import type {
  ReadingPassageListParams,
  ReadingPassageCreate,
  ReadingPassageUpdate,
  TranslationPracticeCreate,
  ReadingCommentCreate,
} from "./types"

const QUERY_KEY = ["reading"] as const

export function useReadingPassagesQuery(params: ReadingPassageListParams) {
  const { token } = useAuth()
  return useQuery({
    queryKey: [...QUERY_KEY, "list", params] as const,
    queryFn: () => fetchReadingPassages(params, token),
    enabled: !!token,
    placeholderData: (prev) => prev,
  })
}

export function useReadingPassageById(id: string | undefined) {
  const { token } = useAuth()
  return useQuery({
    queryKey: [...QUERY_KEY, "detail", id] as const,
    queryFn: () => fetchReadingPassageById(id!, token),
    enabled: !!token && !!id,
    staleTime: 30_000,
  })
}

export function useCreateReadingPassage() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ReadingPassageCreate) => createReadingPassage(payload, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, "list"] })
    },
  })
}

export function useUpdateReadingPassage() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReadingPassageUpdate }) =>
      updateReadingPassage(id, payload, token),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, "list"] })
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, "detail", id] })
    },
  })
}

export function useDeleteReadingPassage() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteReadingPassage(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, "list"] })
    },
  })
}

export function useTranslationPracticeQuery(passageId: string | undefined) {
  const { token } = useAuth()
  return useQuery({
    queryKey: [...QUERY_KEY, "translation", passageId] as const,
    queryFn: () => fetchTranslationPractice(passageId!, token),
    enabled: !!token && !!passageId,
    staleTime: 60_000,
  })
}

export function useSaveTranslationPractice(passageId: string) {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: TranslationPracticeCreate) =>
      saveTranslationPractice(passageId, payload, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, "translation", passageId] })
    },
  })
}

export function useReadingCommentsQuery(passageId: string | undefined) {
  const { token } = useAuth()
  return useQuery({
    queryKey: [...QUERY_KEY, "comments", passageId] as const,
    queryFn: () => fetchReadingComments(passageId!, token),
    enabled: !!token && !!passageId,
  })
}

export function useCreateReadingComment(passageId: string) {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ReadingCommentCreate) => createReadingComment(passageId, payload, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, "comments", passageId] })
    },
  })
}

export function useDeleteReadingComment(passageId: string) {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) => deleteReadingComment(commentId, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, "comments", passageId] })
    },
  })
}

export function useUpdateReadingComment(passageId: string) {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ commentId, payload }: { commentId: string; payload: ReadingCommentCreate }) =>
      updateReadingComment(commentId, payload, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, "comments", passageId] })
    },
  })
}
