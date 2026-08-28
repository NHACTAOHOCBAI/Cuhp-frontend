import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"
import {
  fetchHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  fetchHabitLogs,
  toggleHabitLog,
} from "./api"
import type { HabitCreate, HabitUpdate, HabitLogToggle } from "./types"

const QUERY_KEY = ["habits"] as const
const LIST_KEY = [...QUERY_KEY, "list"] as const
const LOGS_KEY = [...QUERY_KEY, "logs"] as const

export function useHabitsQuery() {
  const { token } = useAuth()
  return useQuery({
    queryKey: LIST_KEY,
    queryFn: () => fetchHabits(token),
    enabled: !!token,
  })
}

export function useHabitLogsQuery(startDate: string, endDate: string) {
  const { token } = useAuth()
  return useQuery({
    queryKey: [...LOGS_KEY, startDate, endDate] as const,
    queryFn: () => fetchHabitLogs(startDate, endDate, token),
    enabled: !!token && !!startDate && !!endDate,
  })
}

export function useCreateHabit() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: HabitCreate) => createHabit(payload, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateHabit() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: HabitUpdate }) =>
      updateHabit(id, payload, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteHabit() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteHabit(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useToggleHabitLog() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: HabitLogToggle) => toggleHabitLog(payload, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LOGS_KEY })
      // Also invalidate list query because it returns streaks which might have updated!
      qc.invalidateQueries({ queryKey: LIST_KEY })
    },
  })
}
