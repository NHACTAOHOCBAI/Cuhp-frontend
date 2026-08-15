/**
 * React Query hooks for the Audio feature.
 */
import { useCallback, useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"
import {
  bulkDeleteAudios,
  deleteAudio,
  fetchAudioById,
  fetchAudios,
  updateAudio,
  uploadAudioWithProgress,
  fetchAudioComments,
  createAudioComment,
  updateAudioComment,
  deleteAudioComment,
} from "./api"
import type {
  AudioListItem,
  AudioListParams,
  AudioTrack,
  AudioUpdate,
  UploadProgress,
} from "./types"

const QUERY_KEY = ["audios"] as const

export function useAudiosQuery(params: AudioListParams) {
  const { token } = useAuth()
  return useQuery({
    queryKey: [...QUERY_KEY, params] as const,
    queryFn: () => fetchAudios(params, token),
    enabled: !!token,
    placeholderData: (prev) => prev, // keep previous data while fetching next page
  })
}

export function useAudioById(id: string | undefined) {
  const { token } = useAuth()
  return useQuery({
    queryKey: [...QUERY_KEY, "detail", id] as const,
    queryFn: () => fetchAudioById(id!, token),
    enabled: !!token && !!id,
    staleTime: 60_000,
  })
}

type UploadVars = {
  formData: FormData
  onProgress?: (p: UploadProgress) => void
}

export function useUploadAudio() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation<AudioTrack, Error, UploadVars>({
    mutationFn: ({ formData, onProgress }) =>
      uploadAudioWithProgress(formData, token, onProgress ?? (() => {})),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateAudio() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AudioUpdate }) =>
      updateAudio(id, payload, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteAudio() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAudio(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useBulkDeleteAudio() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteAudios(ids, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/**
 * Hook that holds a single `<audio>` element reference and exposes
 * `play(url) / pause()` so only one track is playing at a time.
 * Fixes the stale-closure bug present in the original implementation.
 */
export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  const toggle = useCallback(
    (track: AudioListItem) => {
      if (playingId === track.id) {
        audioRef.current?.pause()
        setPlayingId(null)
        return
      }
      audioRef.current?.pause()
      const audio = new Audio(track.url)
      audioRef.current = audio
      audio.onended = () => setPlayingId(null)
      audio.onerror = () => setPlayingId(null)
      audio
        .play()
        .then(() => setPlayingId(track.id))
        .catch(() => setPlayingId(null))
    },
    [playingId],
  )

  return { playingId, toggle }
}

export function useAudioCommentsQuery(audioId: string | undefined) {
  const { token } = useAuth()
  return useQuery({
    queryKey: [...QUERY_KEY, "detail", audioId, "comments"] as const,
    queryFn: () => fetchAudioComments(audioId!, token),
    enabled: !!token && !!audioId,
  })
}

export function useCreateAudioComment(audioId: string) {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      content,
      selected_text,
    }: {
      content: string
      selected_text: string | null
    }) => createAudioComment(audioId, content, selected_text, token),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: [...QUERY_KEY, "detail", audioId, "comments"],
      })
    },
  })
}

export function useUpdateAudioComment(audioId: string) {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      commentId,
      content,
    }: {
      commentId: string
      content: string
    }) => updateAudioComment(commentId, content, token),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: [...QUERY_KEY, "detail", audioId, "comments"],
      })
    },
  })
}

export function useDeleteAudioComment(audioId: string) {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) => deleteAudioComment(commentId, token),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: [...QUERY_KEY, "detail", audioId, "comments"],
      })
    },
  })
}