import { apiFetch } from "@/lib/api"
import type {
  Habit,
  HabitCreate,
  HabitUpdate,
  HabitLog,
  HabitLogToggle,
} from "./types"

const API_BASE = "/habits"

export async function fetchHabits(token: string | null): Promise<Habit[]> {
  return apiFetch<Habit[]>(API_BASE, { token })
}

export async function createHabit(
  payload: HabitCreate,
  token: string | null
): Promise<Habit> {
  return apiFetch<Habit>(API_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  })
}

export async function updateHabit(
  id: string,
  payload: HabitUpdate,
  token: string | null
): Promise<Habit> {
  return apiFetch<Habit>(`${API_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    token,
  })
}

export async function deleteHabit(
  id: string,
  token: string | null
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`${API_BASE}/${id}`, {
    method: "DELETE",
    token,
  })
}

export async function fetchHabitLogs(
  startDate: string,
  endDate: string,
  token: string | null
): Promise<HabitLog[]> {
  const search = new URLSearchParams()
  search.set("start_date", startDate)
  search.set("end_date", endDate)
  return apiFetch<HabitLog[]>(`${API_BASE}/logs?${search.toString()}`, { token })
}

export async function toggleHabitLog(
  payload: HabitLogToggle,
  token: string | null
): Promise<HabitLog> {
  return apiFetch<HabitLog>(`${API_BASE}/logs/toggle`, {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  })
}
