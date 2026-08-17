import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"
import type { TodoTask } from "@/types"
import {
  createTodo,
  deleteCompletedTodos,
  deleteTodo,
  fetchTodoStats,
  fetchTodos,
  moveTodo,
  toggleTodo,
  updateTodo,
} from "./api"
import type {
  TodoListParams,
  TodoListResponse,
  TodoTaskCreate,
  TodoTaskMove,
  TodoTaskUpdate,
} from "./types"

/**
 * Root key for everything in this feature. Mutations invalidate this prefix,
 * which refreshes both the matrix list and the stats panel in one go.
 */
const QUERY_KEY = ["todos"] as const
const LIST_KEY = [...QUERY_KEY, "list"] as const
const STATS_KEY = [...QUERY_KEY, "stats"] as const

export function useTodosQuery(params: TodoListParams) {
  const { token } = useAuth()
  return useQuery({
    queryKey: [...LIST_KEY, params] as const,
    queryFn: () => fetchTodos(params, token),
    enabled: !!token,
    placeholderData: (prev) => prev,
  })
}

export function useTodoStatsQuery() {
  const { token } = useAuth()
  return useQuery({
    queryKey: STATS_KEY,
    queryFn: () => fetchTodoStats(token),
    enabled: !!token,
  })
}

export function useCreateTodo() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: TodoTaskCreate) => createTodo(payload, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateTodo() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TodoTaskUpdate }) =>
      updateTodo(id, payload, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteTodo() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTodo(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteCompletedTodos() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => deleteCompletedTodos(token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/**
 * Patch every cached list page in place, then hand back a rollback closure.
 *
 * Both optimistic mutations below need the same dance: freeze in-flight
 * refetches so they cannot overwrite the optimistic value, snapshot the
 * cache, apply the change locally, and be able to undo it if the request
 * fails. Sharing it keeps the two `onMutate` handlers honest with each other.
 */
function useOptimisticListPatch() {
  const qc = useQueryClient()
  return async (patch: (task: TodoTask) => TodoTask) => {
    await qc.cancelQueries({ queryKey: LIST_KEY })
    const snapshots = qc.getQueriesData<TodoListResponse>({ queryKey: LIST_KEY })

    for (const [key, data] of snapshots) {
      if (!data) continue
      qc.setQueryData<TodoListResponse>(key, {
        ...data,
        items: data.items.map(patch),
      })
    }

    return () => {
      for (const [key, data] of snapshots) {
        qc.setQueryData(key, data)
      }
    }
  }
}

/**
 * Toggle completion with an optimistic flip so the checkbox reacts instantly.
 */
export function useToggleTodo() {
  const { token } = useAuth()
  const qc = useQueryClient()
  const patchLists = useOptimisticListPatch()

  return useMutation({
    mutationFn: (id: string) => toggleTodo(id, token),
    onMutate: async (id: string) => {
      const rollback = await patchLists((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
      return { rollback }
    },
    onError: (_err, _id, context) => {
      context?.rollback()
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/**
 * Move a task between quadrants with an optimistic re-render.
 *
 * Without this the card would visibly snap back to its old quadrant until the
 * request resolves, which makes drag-and-drop feel broken on a slow network.
 * The server still owns the final ordering — `onSettled` re-syncs.
 */
export function useMoveTodo() {
  const { token } = useAuth()
  const qc = useQueryClient()
  const patchLists = useOptimisticListPatch()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TodoTaskMove }) =>
      moveTodo(id, payload, token),
    onMutate: async ({ id, payload }) => {
      const rollback = await patchLists((task) =>
        task.id === id
          ? { ...task, quadrant: payload.quadrant, position: payload.position }
          : task
      )
      return { rollback }
    },
    onError: (_err, _vars, context) => {
      context?.rollback()
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
