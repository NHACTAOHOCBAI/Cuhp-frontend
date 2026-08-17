import { apiFetch } from "@/lib/api"
import type { TodoTask } from "@/types"
import type {
  TodoListParams,
  TodoListResponse,
  TodoStats,
  TodoTaskCreate,
  TodoTaskMove,
  TodoTaskUpdate,
} from "./types"

const API_BASE = "/api/v1/todo"

export async function fetchTodos(
  params: TodoListParams,
  token: string | null,
): Promise<TodoListResponse> {
  const search = new URLSearchParams()
  if (params.scope) search.set("scope", params.scope)
  if (params.quadrant) search.set("quadrant", params.quadrant)
  if (params.q) search.set("q", params.q)
  if (params.show_completed) search.set("show_completed", "true")

  const qs = search.toString()
  const path = qs ? `${API_BASE}/tasks?${qs}` : `${API_BASE}/tasks`
  return apiFetch<TodoListResponse>(path, { token })
}

export async function createTodo(
  payload: TodoTaskCreate,
  token: string | null,
): Promise<TodoTask> {
  return apiFetch<TodoTask>(`${API_BASE}/tasks`, {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  })
}

export async function updateTodo(
  id: string,
  payload: TodoTaskUpdate,
  token: string | null,
): Promise<TodoTask> {
  return apiFetch<TodoTask>(`${API_BASE}/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    token,
  })
}

/** Flip completed state server-side so `completed_at` stays authoritative. */
export async function toggleTodo(
  id: string,
  token: string | null,
): Promise<TodoTask> {
  return apiFetch<TodoTask>(`${API_BASE}/tasks/${id}/toggle`, {
    method: "POST",
    token,
  })
}

/** Drag-and-drop: drop a task into `quadrant` at index `position`. */
export async function moveTodo(
  id: string,
  payload: TodoTaskMove,
  token: string | null,
): Promise<TodoTask> {
  return apiFetch<TodoTask>(`${API_BASE}/tasks/${id}/move`, {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  })
}

export async function deleteTodo(
  id: string,
  token: string | null,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`${API_BASE}/tasks/${id}`, {
    method: "DELETE",
    token,
  })
}

export async function deleteCompletedTodos(
  token: string | null,
): Promise<{ message: string; deleted: number }> {
  return apiFetch<{ message: string; deleted: number }>(
    `${API_BASE}/tasks/completed`,
    { method: "DELETE", token },
  )
}

export async function fetchTodoStats(
  token: string | null,
): Promise<TodoStats> {
  return apiFetch<TodoStats>(`${API_BASE}/stats`, { token })
}
