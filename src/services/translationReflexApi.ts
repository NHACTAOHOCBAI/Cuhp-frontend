import { apiFetch } from "@/lib/api"

export interface TranslationSession {
  id: string
  user_id: string
  topic: string
  level: string
  mode: string
  dialogue_mode?: string
  practice_source?: string
  is_completed?: boolean
  created_at: string
}

export interface NextSentenceResponse {
  vietnamese_text: string
  partner_english?: string
  turn_index?: number
  is_final_turn?: boolean
  targeted_error_hint?: string
  targeted_error_id?: string
}

export interface ExtractedError {
  error_type: "grammar" | "vocabulary" | "phrasing"
  original_text: string
  corrected_text: string
  explanation: string
}

export interface SubmitTranslationResponse {
  sentence_log_id: string
  accuracy_score: number
  fluency_score: number
  is_correct: boolean
  natural_translation: string
  alternative_translations: string[]
  general_feedback: string
  extracted_errors: ExtractedError[]
}

export interface ErrorLog {
  id: string
  user_id: string
  sentence_log_id?: string
  error_type: "grammar" | "vocabulary" | "phrasing"
  original_text: string
  corrected_text: string
  explanation: string
  mastered: boolean
  review_count: number
  next_review_at: string
  created_at: string
}

export const translationReflexApi = {
  createSession: async (
    topic: string,
    level: string,
    mode: string,
    dialogueMode: string = "single",
    practiceSource: string = "random"
  ) => {
    return apiFetch<TranslationSession>("/translation-reflex/session", {
      method: "POST",
      body: JSON.stringify({ topic, level, mode, dialogue_mode: dialogueMode, practice_source: practiceSource }),
    })
  },

  getNextSentence: async (
    sessionId: string,
    topic: string,
    level: string,
    dialogueMode: string = "single",
    practiceSource: string = "random"
  ) => {
    return apiFetch<NextSentenceResponse>("/translation-reflex/next-sentence", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, topic, level, dialogue_mode: dialogueMode, practice_source: practiceSource }),
    })
  },

  submitAnswer: async (
    sessionId: string,
    vietnameseText: string,
    userTranslation: string,
    timeTakenSeconds: number,
    level: string,
    partnerEnglish?: string,
    turnIndex?: number,
    targetedErrorId?: string
  ) => {
    return apiFetch<SubmitTranslationResponse>("/translation-reflex/submit-answer", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        vietnamese_text: vietnameseText,
        user_translation: userTranslation,
        partner_english: partnerEnglish,
        turn_index: turnIndex || 1,
        targeted_error_id: targetedErrorId,
        time_taken_seconds: timeTakenSeconds,
        level: level,
      }),
    })
  },

  getErrors: async (errorType?: string, mastered?: boolean) => {
    const params = new URLSearchParams()
    if (errorType) params.append("error_type", errorType)
    if (mastered !== undefined) params.append("mastered", String(mastered))

    const query = params.toString() ? `?${params.toString()}` : ""
    return apiFetch<ErrorLog[]>(`/translation-reflex/errors${query}`)
  },

  toggleErrorMastered: async (errorId: string, mastered: boolean) => {
    return apiFetch<ErrorLog>(`/translation-reflex/errors/${errorId}/toggle-mastered`, {
      method: "PATCH",
      body: JSON.stringify({ mastered }),
    })
  },

  deleteError: async (errorId: string) => {
    return apiFetch<void>(`/translation-reflex/errors/${errorId}`, {
      method: "DELETE",
    })
  },
}
