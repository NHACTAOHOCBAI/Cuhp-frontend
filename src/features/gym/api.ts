/**
 * HTTP wrappers for the Gym feature.
 *
 * Mirrors the audio pattern: every call goes through the shared `apiFetch`
 * wrapper (which auto-injects the Bearer token and parses `detail` on errors).
 */
import { apiFetch } from "@/lib/api"
import type { WorkoutCategory, WorkoutExercise, GymStats } from "@/types"

const API_BASE = "/api/v1/gym"

// --- Categories ---------------------------------------------------------

export async function fetchCategories(token: string | null): Promise<WorkoutCategory[]> {
  return apiFetch<WorkoutCategory[]>(`${API_BASE}/categories`, { token })
}

export interface CategoryPayload {
  name: string
  color: string
}

export async function createCategory(
  payload: CategoryPayload,
  token: string | null,
): Promise<WorkoutCategory> {
  return apiFetch<WorkoutCategory>(`${API_BASE}/categories`, {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  })
}

export async function updateCategory(
  id: string,
  payload: CategoryPayload,
  token: string | null,
): Promise<WorkoutCategory> {
  return apiFetch<WorkoutCategory>(`${API_BASE}/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    token,
  })
}

export async function deleteCategory(
  id: string,
  token: string | null,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`${API_BASE}/categories/${id}`, {
    method: "DELETE",
    token,
  })
}

// --- Exercises ----------------------------------------------------------

export async function fetchExercisesByDate(
  date: string,
  token: string | null,
): Promise<WorkoutExercise[]> {
  const url = date ? `${API_BASE}/exercises?date=${encodeURIComponent(date)}` : `${API_BASE}/exercises`
  return apiFetch<WorkoutExercise[]>(url, { token })
}

export interface ExercisePayload {
  name: string
  date: string
  sets: number
  reps: number
  weight: number | null
  category_id: string | null
  completed: boolean
}

export async function createExercise(
  payload: ExercisePayload,
  token: string | null,
): Promise<WorkoutExercise> {
  return apiFetch<WorkoutExercise>(`${API_BASE}/exercises`, {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  })
}

export async function updateExercise(
  id: string,
  payload: ExercisePayload,
  token: string | null,
): Promise<WorkoutExercise> {
  return apiFetch<WorkoutExercise>(`${API_BASE}/exercises/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    token,
  })
}

export async function updateExerciseCompletion(
  id: string,
  completed: boolean,
  token: string | null,
): Promise<WorkoutExercise> {
  return apiFetch<WorkoutExercise>(`${API_BASE}/exercises/${id}`, {
    method: "PUT",
    body: JSON.stringify({ completed }),
    token,
  })
}

export async function deleteExercise(
  id: string,
  token: string | null,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`${API_BASE}/exercises/${id}`, {
    method: "DELETE",
    token,
  })
}

// --- Copy a single day forward N weeks ---------------------------------

export interface CopyDayForwardPayload {
  /** ISO date (YYYY-MM-DD) of the source day. */
  source_date: string
  /** Number of weeks ahead to copy the day into (1..12). */
  weeks_ahead: number
}

export interface CopyDayForwardResult {
  created: number
  skipped_days: number
}

export async function copyDayForward(
  payload: CopyDayForwardPayload,
  token: string | null,
): Promise<CopyDayForwardResult> {
  return apiFetch<CopyDayForwardResult>(`${API_BASE}/exercises/copy-day-forward`, {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  })
}

// --- Stats --------------------------------------------------------------

export async function fetchStats(token: string | null): Promise<GymStats> {
  return apiFetch<GymStats>(`${API_BASE}/stats`, { token })
}
