/**
 * React Query hooks for the Gym feature.
 *
 * Mirrors the audio pattern: a stable query-key prefix plus mutations that
 * invalidate related keys on success. Consumers (GymPage, dialogs) compose
 * these hooks instead of touching `apiFetch` directly.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"
import {
  copyDayForward,
  createCategory,
  createExercise,
  deleteCategory,
  deleteExercise,
  fetchCategories,
  fetchExercisesByDate,
  fetchStats,
  updateCategory,
  updateExercise,
  updateExerciseCompletion,
} from "./api"
import type {
  CopyDayForwardPayload,
  CopyDayForwardResult,
  CategoryPayload,
  ExercisePayload,
} from "./api"

const KEY = ["gym"] as const

// --- Queries ------------------------------------------------------------

export function useGymCategoriesQuery() {
  const { token } = useAuth()
  return useQuery({
    queryKey: [...KEY, "categories"] as const,
    queryFn: () => fetchCategories(token),
    enabled: !!token,
  })
}

export function useGymExercisesQuery(date: string) {
  const { token } = useAuth()
  return useQuery({
    queryKey: [...KEY, "exercises", date] as const,
    queryFn: () => fetchExercisesByDate(date, token),
    enabled: !!token && !!date,
  })
}

export function useGymStatsQuery(enabled: boolean = true) {
  const { token } = useAuth()
  return useQuery({
    queryKey: [...KEY, "stats"] as const,
    queryFn: () => fetchStats(token),
    enabled: !!token && enabled,
  })
}

// --- Mutations: categories ----------------------------------------------

export function useCreateCategory() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CategoryPayload) => createCategory(payload, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...KEY, "categories"] })
      qc.invalidateQueries({ queryKey: [...KEY, "exercises"] })
    },
  })
}

export function useUpdateCategory() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CategoryPayload }) =>
      updateCategory(id, payload, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...KEY, "categories"] })
      qc.invalidateQueries({ queryKey: [...KEY, "exercises"] })
    },
  })
}

export function useDeleteCategory() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...KEY, "categories"] })
      qc.invalidateQueries({ queryKey: [...KEY, "exercises"] })
    },
  })
}

// --- Mutations: exercises -----------------------------------------------

export function useCreateExercise() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ExercisePayload) => createExercise(payload, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...KEY, "exercises"] })
      qc.invalidateQueries({ queryKey: [...KEY, "stats"] })
    },
  })
}

export function useUpdateExercise() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ExercisePayload }) =>
      updateExercise(id, payload, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...KEY, "exercises"] })
      qc.invalidateQueries({ queryKey: [...KEY, "categories"] })
      qc.invalidateQueries({ queryKey: [...KEY, "stats"] })
    },
  })
}

export function useToggleExerciseComplete() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      updateExerciseCompletion(id, completed, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...KEY, "exercises"] })
      qc.invalidateQueries({ queryKey: [...KEY, "stats"] })
    },
  })
}

export function useDeleteExercise() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteExercise(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...KEY, "exercises"] })
      qc.invalidateQueries({ queryKey: [...KEY, "stats"] })
    },
  })
}

/**
 * Copy all exercises on a single day forward to the same weekday in the next
 * N weeks. Used by the "Apply Forward" dropdown in the day detail header.
 */
export function useCopyDayForward() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation<CopyDayForwardResult, Error, CopyDayForwardPayload>({
    mutationFn: (payload) => copyDayForward(payload, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...KEY, "exercises"] })
      qc.invalidateQueries({ queryKey: [...KEY, "stats"] })
    },
  })
}
