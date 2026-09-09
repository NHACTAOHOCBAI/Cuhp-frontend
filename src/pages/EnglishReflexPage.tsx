import * as React from "react"
import { useState, useEffect, useRef } from "react"
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  MessageSquare,
  Zap,
  Bot,
  User,
  Flag,
  Trophy,
  Target,
  BookmarkCheck,
  Sliders,
  ChevronDown,
  ChevronUp,
  Pencil,
} from "lucide-react"
import { translationReflexApi } from "@/services/translationReflexApi"
import type { TranslationSession, SubmitTranslationResponse } from "@/services/translationReflexApi"
import { speakWord } from "@/lib/tts"

const TOPICS = [
  { id: "Daily Communication", name: "Daily Communication" },
  { id: "Dining & Coffee", name: "Dining & Coffee" },
  { id: "Work & Interview", name: "Work & Interview" },
  { id: "Travel & Airport", name: "Travel & Airport" },
  { id: "Casual Chat & Friends", name: "Casual Chat & Friends" },
]

const LEVELS = [
  { id: "beginner", name: "Beginner (A2-B1)", desc: "Short sentences & common vocabulary" },
  { id: "intermediate", name: "Intermediate (B2)", desc: "Natural communication & compound sentences" },
  { id: "advanced", name: "Advanced (C1)", desc: "Nuanced expression & complex structures" },
]

interface DialogueTurnItem {
  turn_index: number
  partner_english?: string
  user_vietnamese: string
  user_translation: string
  accuracy_score: number
  fluency_score: number
  natural_translation: string
  feedback: SubmitTranslationResponse
}

export default function EnglishReflexPage() {
  const [topic, setTopic] = useState("Daily Communication")
  const [level, setLevel] = useState("intermediate")
  const [mode, setMode] = useState<"writing" | "speaking">("writing")
  const [dialogueMode, setDialogueMode] = useState<"single" | "dialogue">("single")
  const [practiceSource, setPracticeSource] = useState<"random" | "error_review">("random")

  // Collapsible Accordion States for decluttered UI
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState<boolean>(false)
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState<boolean>(true)
  const [isFeedbackDetailsExpanded, setIsFeedbackDetailsExpanded] = useState<boolean>(false)

  const [unmasteredErrorCount, setUnmasteredErrorCount] = useState<number>(0)
  const [currentTargetedErrorHint, setCurrentTargetedErrorHint] = useState<string>("")
  const [currentTargetedErrorId, setCurrentTargetedErrorId] = useState<string>("")
  const [isErrorMarkedMastered, setIsErrorMarkedMastered] = useState<boolean>(false)

  const [session, setSession] = useState<TranslationSession | null>(null)
  const [currentVietnamese, setCurrentVietnamese] = useState<string>("")
  const [currentPartnerEnglish, setCurrentPartnerEnglish] = useState<string>("")
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(1)
  const [isFinalTurn, setIsFinalTurn] = useState<boolean>(false)
  const [userTranslation, setUserTranslation] = useState<string>("")

  const [dialogueHistory, setDialogueHistory] = useState<DialogueTurnItem[]>([])
  const [showDialogueSummary, setShowDialogueSummary] = useState<boolean>(false)

  const [loadingSentence, setLoadingSentence] = useState<boolean>(false)
  const [evaluating, setEvaluating] = useState<boolean>(false)

  const [feedback, setFeedback] = useState<SubmitTranslationResponse | null>(null)
  const [timerSeconds, setTimerSeconds] = useState<number>(0)
  const timerRef = useRef<any>(null)

  // Fetch unmastered error count from Error Bank
  const loadUnmasteredErrorCount = async () => {
    try {
      const errors = await translationReflexApi.getErrors(undefined, false)
      setUnmasteredErrorCount(errors.length)
    } catch (err) {
      console.error("Failed to load unmastered error count:", err)
    }
  }

  useEffect(() => {
    loadUnmasteredErrorCount()
  }, [])

  const handleToggleMastered = async () => {
    if (!currentTargetedErrorId) return
    try {
      await translationReflexApi.toggleErrorMastered(currentTargetedErrorId, true)
      setIsErrorMarkedMastered(true)
      loadUnmasteredErrorCount()
    } catch (err) {
      console.error("Failed to toggle error mastered:", err)
    }
  }

  // Speech Recognition state
  const [isListening, setIsListening] = useState<boolean>(false)
  const [speechSupported, setSpeechSupported] = useState<boolean>(true)
  const recognitionRef = useRef<any>(null)

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechSupported(false)
    } else {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "en-US"

      recognition.onresult = (event: any) => {
        let transcript = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        if (transcript) {
          setUserTranslation(transcript)
        }
      }

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  // Start new session and get first sentence
  const handleStartSession = async (
    selectedTopic = topic,
    selectedLevel = level,
    selectedMode = mode,
    selectedDialogueMode = dialogueMode,
    selectedPracticeSource = practiceSource
  ) => {
    try {
      setLoadingSentence(true)
      setFeedback(null)
      setUserTranslation("")
      setTimerSeconds(0)
      setDialogueHistory([])
      setShowDialogueSummary(false)
      setCurrentTurnIndex(1)
      setIsFinalTurn(false)
      setCurrentPartnerEnglish("")
      setCurrentTargetedErrorHint("")
      setCurrentTargetedErrorId("")
      setIsErrorMarkedMastered(false)
      setIsFeedbackDetailsExpanded(false)

      const sess = await translationReflexApi.createSession(
        selectedTopic,
        selectedLevel,
        selectedMode,
        selectedDialogueMode,
        selectedPracticeSource
      )
      setSession(sess)

      const sentenceRes = await translationReflexApi.getNextSentence(
        sess.id,
        selectedTopic,
        selectedLevel,
        selectedDialogueMode,
        selectedPracticeSource
      )
      setCurrentVietnamese(sentenceRes.vietnamese_text)
      if (sentenceRes.partner_english) {
        setCurrentPartnerEnglish(sentenceRes.partner_english)
      }
      if (sentenceRes.turn_index) {
        setCurrentTurnIndex(sentenceRes.turn_index)
      }
      if (sentenceRes.is_final_turn) {
        setIsFinalTurn(sentenceRes.is_final_turn)
      }
      if (sentenceRes.targeted_error_hint) {
        setCurrentTargetedErrorHint(sentenceRes.targeted_error_hint)
      }
      if (sentenceRes.targeted_error_id) {
        setCurrentTargetedErrorId(sentenceRes.targeted_error_id)
      }
      startTimer()
    } catch (err: any) {
      console.error("Failed to start session:", err)
    } finally {
      setLoadingSentence(false)
    }
  }

  // Timer helper
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimerSeconds(0)
    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => prev + 1)
    }, 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    handleStartSession()
    return () => stopTimer()
  }, [])

  // Toggle Mic Recording
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Your browser does not support Web Speech API. You can use Type mode instead!")
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setUserTranslation("")
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  // Next Sentence / Next Turn
  const fetchNextSentence = async () => {
    if (!session) return
    if (dialogueMode === "dialogue" && (isFinalTurn || currentTurnIndex >= 5)) {
      setShowDialogueSummary(true)
      return
    }
    try {
      setLoadingSentence(true)
      setFeedback(null)
      setUserTranslation("")
      setCurrentTargetedErrorHint("")
      setCurrentTargetedErrorId("")
      setIsErrorMarkedMastered(false)
      setIsFeedbackDetailsExpanded(false)
      stopTimer()

      const sentenceRes = await translationReflexApi.getNextSentence(
        session.id,
        topic,
        level,
        dialogueMode,
        practiceSource
      )
      setCurrentVietnamese(sentenceRes.vietnamese_text)
      if (sentenceRes.partner_english) {
        setCurrentPartnerEnglish(sentenceRes.partner_english)
      }
      if (sentenceRes.turn_index) {
        setCurrentTurnIndex(sentenceRes.turn_index)
      }
      if (sentenceRes.is_final_turn) {
        setIsFinalTurn(sentenceRes.is_final_turn)
      }
      if (sentenceRes.targeted_error_hint) {
        setCurrentTargetedErrorHint(sentenceRes.targeted_error_hint)
      }
      if (sentenceRes.targeted_error_id) {
        setCurrentTargetedErrorId(sentenceRes.targeted_error_id)
      }
      startTimer()
    } catch (err: any) {
      console.error("Error fetching next sentence:", err)
    } finally {
      setLoadingSentence(false)
    }
  }

  // Submit Answer
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!userTranslation.trim() || !session || evaluating) return

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }

    stopTimer()
    setEvaluating(true)

    try {
      const res = await translationReflexApi.submitAnswer(
        session.id,
        currentVietnamese,
        userTranslation,
        timerSeconds,
        level,
        dialogueMode === "dialogue" ? currentPartnerEnglish : undefined,
        currentTurnIndex,
        currentTargetedErrorId || undefined
      )
      setFeedback(res)
      loadUnmasteredErrorCount()

      if (dialogueMode === "dialogue") {
        setDialogueHistory((prev) => [
          ...prev,
          {
            turn_index: currentTurnIndex,
            partner_english: currentPartnerEnglish,
            user_vietnamese: currentVietnamese,
            user_translation: userTranslation,
            accuracy_score: res.accuracy_score,
            fluency_score: res.fluency_score,
            natural_translation: res.natural_translation,
            feedback: res,
          },
        ])
      }
    } catch (err: any) {
      console.error("Evaluation error:", err)
    } finally {
      setEvaluating(false)
    }
  }

  // Compute summary stats for completed dialogue
  const dialogueSummaryStats = React.useMemo(() => {
    if (dialogueHistory.length === 0) return { avgAccuracy: 0, avgFluency: 0, totalErrors: 0 }
    const totalAcc = dialogueHistory.reduce((acc, item) => acc + item.accuracy_score, 0)
    const totalFlu = dialogueHistory.reduce((acc, item) => acc + item.fluency_score, 0)
    const totalErr = dialogueHistory.reduce(
      (acc, item) => acc + (item.feedback.extracted_errors?.length || 0),
      0
    )
    return {
      avgAccuracy: Math.round(totalAcc / dialogueHistory.length),
      avgFluency: Math.round(totalFlu / dialogueHistory.length),
      totalErrors: totalErr,
    }
  }, [dialogueHistory])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="mt-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-sora font-bold text-3xl mb-2 text-[#201B1E] tracking-tight">
            AI Reflex Practice
          </h1>
          <p className="font-outfit font-normal text-base text-[#706065]">
            Master real-time translation through isolated prompts or interactive dialogue scenarios.
          </p>
        </div>

        {/* View Mode Toggle Tabs */}
        <div className="flex bg-[#fcf1f5] p-1 rounded-2xl border border-[#ffd8ea] self-start md:self-auto font-outfit">
          <button
            onClick={() => {
              setDialogueMode("single")
              handleStartSession(topic, level, mode, "single", practiceSource)
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dialogueMode === "single"
                ? "bg-white text-[#7b5268] shadow-xs"
                : "text-[#706065] hover:text-[#7b5268]"
            }`}
          >
            <Zap className="w-4 h-4 fill-current text-[#7b5268]" />
            <span>Single Sentence</span>
          </button>
          <button
            onClick={() => {
              setDialogueMode("dialogue")
              handleStartSession(topic, level, mode, "dialogue", practiceSource)
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dialogueMode === "dialogue"
                ? "bg-white text-[#7b5268] shadow-xs"
                : "text-[#706065] hover:text-[#7b5268]"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-[#7b5268]" />
            <span>Interactive Dialogue</span>
          </button>
        </div>
      </header>

      {/* Main Page Layout - Two Column Layout Matching EnglishVocabularies & Gym */}
      <section className="flex flex-col lg:flex-row gap-[24px] items-start w-full">
        {/* Left Sidebar Box: Session Controls & Settings (Collapsible) */}
        <div className="w-full lg:w-72 flex flex-col gap-[8px] flex-shrink-0">
          <div className="bg-white rounded-[24px] p-[20px] md:p-[24px] border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] flex flex-col gap-[16px] w-full font-outfit">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#7b5268]" />
                <h3 className="font-sora text-base font-bold text-[#1f1a1d]">
                  Session Settings
                </h3>
              </div>
              <button
                onClick={() => setIsSettingsCollapsed(!isSettingsCollapsed)}
                className="p-1 text-[#706065] hover:text-[#7b5268] rounded-lg transition-colors cursor-pointer"
                title={isSettingsCollapsed ? "Expand settings" : "Collapse settings"}
              >
                {isSettingsCollapsed ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Collapsible Panel Content */}
            {!isSettingsCollapsed && (
              <div className="space-y-4 animate-fadeIn">
                {/* Topic selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-[#706065] uppercase tracking-wider block">
                    Topic
                  </label>
                  <select
                    value={topic}
                    onChange={(e) => {
                      setTopic(e.target.value)
                      handleStartSession(e.target.value, level, mode, dialogueMode, practiceSource)
                    }}
                    className="w-full bg-[#fcf1f5] border border-[#ffd8ea] rounded-xl px-3 py-2 text-xs font-outfit font-semibold text-[#201B1E] focus:outline-none focus:ring-2 focus:ring-[#EFBCD5] cursor-pointer"
                  >
                    {TOPICS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-[#706065] uppercase tracking-wider block">
                    Proficiency Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) => {
                      setLevel(e.target.value)
                      handleStartSession(topic, e.target.value, mode, dialogueMode, practiceSource)
                    }}
                    className="w-full bg-[#fcf1f5] border border-[#ffd8ea] rounded-xl px-3 py-2 text-xs font-outfit font-semibold text-[#201B1E] focus:outline-none focus:ring-2 focus:ring-[#EFBCD5] cursor-pointer"
                  >
                    {LEVELS.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Practice Source Selector (Random vs Error Review) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-[#706065] uppercase tracking-wider block">
                    Practice Source
                  </label>
                  <div className="flex flex-col gap-1 bg-[#fcf1f5] p-1 rounded-xl border border-[#ffd8ea]">
                    <button
                      onClick={() => {
                        setPracticeSource("random")
                        handleStartSession(topic, level, mode, dialogueMode, "random")
                      }}
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        practiceSource === "random"
                          ? "bg-white text-[#7b5268] shadow-xs"
                          : "text-[#706065] hover:text-[#7b5268]"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 fill-current text-[#7b5268]" />
                        Random Prompts
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        if (unmasteredErrorCount === 0) {
                          alert("Your Error Bank is currently empty! AI will generate random prompts.")
                        }
                        setPracticeSource("error_review")
                        handleStartSession(topic, level, mode, dialogueMode, "error_review")
                      }}
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        practiceSource === "error_review"
                          ? "bg-[#201B1E] text-white shadow-xs"
                          : "text-[#706065] hover:text-[#7b5268]"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-[#EFBCD5]" />
                        Error Review
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                          practiceSource === "error_review" ? "bg-[#EFBCD5] text-[#201B1E]" : "bg-[#EFBCD5]/40 text-[#7b5268]"
                        }`}
                      >
                        {unmasteredErrorCount} Active
                      </span>
                    </button>
                  </div>
                </div>

                {/* Input Method Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-[#706065] uppercase tracking-wider block">
                    Input Method
                  </label>
                  <div className="flex bg-[#fcf1f5] p-1 rounded-xl border border-[#ffd8ea]">
                    <button
                      onClick={() => setMode("writing")}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        mode === "writing" ? "bg-white text-[#7b5268] shadow-xs" : "text-[#706065]"
                      }`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Type</span>
                    </button>
                    <button
                      onClick={() => setMode("speaking")}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        mode === "speaking" ? "bg-white text-[#7b5268] shadow-xs" : "text-[#706065]"
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Voice</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Session Stats & Quick Actions */}
            <div className="pt-3 border-t border-[#E5DFE2]/70 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#706065] font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#7b5268]" />
                  Reflex Speed
                </span>
                <span className="font-mono font-bold text-[#7b5268] bg-[#fcf1f5] px-2.5 py-1 rounded-full border border-[#ffd8ea]">
                  {timerSeconds}s
                </span>
              </div>

              {dialogueMode === "dialogue" && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#706065] font-semibold flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-[#7b5268]" />
                    Turn Progress
                  </span>
                  <span className="font-mono font-bold text-[#201B1E] bg-[#fcf1f5] px-2.5 py-1 rounded-full border border-[#ffd8ea]">
                    {currentTurnIndex} / 5
                  </span>
                </div>
              )}

              {/* Complete Scenario Early */}
              {dialogueMode === "dialogue" && dialogueHistory.length > 0 && !showDialogueSummary && (
                <button
                  onClick={() => setShowDialogueSummary(true)}
                  className="w-full mt-1 py-2 px-3 bg-[#201B1E] text-white rounded-xl font-sora font-bold text-xs hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5 text-[#EFBCD5]" />
                  <span>Complete Scenario</span>
                </button>
              )}

              {/* Restart Session Button */}
              <button
                onClick={() => handleStartSession()}
                className="w-full py-2 px-3 bg-white border border-[#E5DFE2] text-[#201B1E] rounded-xl font-sora font-bold text-xs hover:bg-[#fcf1f5] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#7b5268] ${loadingSentence ? "animate-spin" : ""}`} />
                <span>Restart Session</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Main Interactive Workspace Card */}
        <div className="flex-grow w-full flex flex-col items-center">
          {/* DIALOGUE SUMMARY VIEW */}
          {showDialogueSummary ? (
            <div className="bg-white w-full rounded-[24px] border border-[#E5DFE2] p-[24px] md:p-[32px] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] flex flex-col font-outfit items-center text-center space-y-6 animate-fadeIn">
              <div className="w-16 h-16 bg-[#fcf1f5] rounded-full flex items-center justify-center text-[#7b5268] border border-[#ffd8ea] shadow-xs">
                <Trophy className="h-8 w-8 text-[#7b5268]" />
              </div>

              <div>
                <h2 className="font-sora font-bold text-2xl md:text-3xl text-[#1f1a1d] mb-1">
                  Scenario Complete!
                </h2>
                <p className="font-outfit text-sm text-[#706065] max-w-md">
                  Great job completing all interactive turns in "{topic}".
                </p>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-3 gap-4 w-full max-w-lg py-2">
                <div className="bg-[#fcf1f5] p-4 rounded-2xl border border-[#ffd8ea]">
                  <span className="text-xs font-sora font-bold text-[#706065] block uppercase">Avg Accuracy</span>
                  <span className="font-sora text-2xl font-bold text-emerald-700">{dialogueSummaryStats.avgAccuracy}%</span>
                </div>
                <div className="bg-[#fcf1f5] p-4 rounded-2xl border border-[#ffd8ea]">
                  <span className="text-xs font-sora font-bold text-[#706065] block uppercase">Avg Fluency</span>
                  <span className="font-sora text-2xl font-bold text-amber-700">{dialogueSummaryStats.avgFluency}%</span>
                </div>
                <div className="bg-[#fcf1f5] p-4 rounded-2xl border border-[#ffd8ea]">
                  <span className="text-xs font-sora font-bold text-[#706065] block uppercase">Total Turns</span>
                  <span className="font-sora text-2xl font-bold text-[#7b5268]">{dialogueHistory.length}</span>
                </div>
              </div>

              {/* Dialogue Transcript Recap */}
              <div className="w-full text-left space-y-3 pt-4 border-t border-[#E5DFE2]/70">
                <span className="text-xs font-mono font-bold text-[#706065] uppercase tracking-wider block flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#7b5268]" />
                  Scenario Transcript:
                </span>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {dialogueHistory.map((item, idx) => (
                    <div key={idx} className="bg-[#FCFAF7] p-4 rounded-2xl border border-[#E5DFE2] space-y-2 text-xs">
                      {item.partner_english && (
                        <div className="flex items-start gap-2">
                          <Bot className="w-4 h-4 text-[#7b5268] mt-0.5 flex-shrink-0" />
                          <span className="font-sora font-bold text-[#1f1a1d]">AI Partner: {item.partner_english}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2 text-[#706065] pl-6">
                        <span className="italic">VN Cue: "{item.user_vietnamese}"</span>
                      </div>
                      <div className="flex items-start gap-2 pl-6">
                        <User className="w-3.5 h-3.5 text-[#201B1E] mt-0.5 flex-shrink-0" />
                        <span className="font-outfit font-semibold text-[#1f1a1d]">
                          You: {item.user_translation} (Accuracy: {item.accuracy_score}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => handleStartSession(topic, level, mode, dialogueMode, practiceSource)}
                  className="px-6 py-3 bg-[#EFBCD5] text-[#201B1E] rounded-xl font-sora font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-sm border border-[#ffd8ea] cursor-pointer"
                >
                  Start New Scenario
                </button>
              </div>
            </div>
          ) : (
            /* MAIN WORKSPACE CARD (Single Sentence or Dialogue) */
            <div className="bg-white w-full rounded-[24px] border border-[#E5DFE2] p-[24px] md:p-[32px] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] flex flex-col font-outfit space-y-6">
              {/* Top Card Info Row */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E5DFE2]/70">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#706065] uppercase tracking-wider bg-[#fcf1f5] px-3 py-1 rounded-full border border-[#eae0e4]">
                    {topic}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#7b5268] uppercase tracking-wider bg-[#EFBCD5]/25 px-3 py-1 rounded-full border border-[#EFBCD5]/40">
                    {level.toUpperCase()}
                  </span>
                  {dialogueMode === "dialogue" && (
                    <span className="font-mono text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      Turn {currentTurnIndex} / 5
                    </span>
                  )}
                  {practiceSource === "error_review" && (
                    <span className="font-mono text-xs font-bold text-[#201B1E] uppercase tracking-wider bg-[#201B1E] text-white px-3 py-1 rounded-full flex items-center gap-1">
                      <Target className="w-3 h-3 text-[#EFBCD5]" />
                      Error Review
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#706065] bg-[#fcf1f5] px-3 py-1 rounded-full border border-[#ffd8ea] flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#7b5268]" />
                    <span>{timerSeconds}s</span>
                  </span>
                </div>
              </div>

              {/* DIALOGUE MODE CHAT THREAD (Collapsible Accordion for completed turns) */}
              {dialogueMode === "dialogue" && dialogueHistory.length > 0 && (
                <div className="border border-[#E5DFE2] rounded-[18px] bg-[#FCFAF7] overflow-hidden">
                  <button
                    onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
                    className="w-full px-4 py-3 bg-[#fcf1f5] hover:bg-[#f8e7ee] transition-colors flex items-center justify-between text-xs font-sora font-bold text-[#7b5268] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#7b5268]" />
                      <span>Dialogue History ({dialogueHistory.length} turns)</span>
                    </span>
                    {isHistoryCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-[#7b5268]" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-[#7b5268]" />
                    )}
                  </button>

                  {!isHistoryCollapsed && (
                    <div className="p-4 space-y-3 max-h-60 overflow-y-auto border-t border-[#E5DFE2]/70">
                      {dialogueHistory.map((item, idx) => (
                        <div key={idx} className="space-y-2">
                          {/* AI Partner Bubble */}
                          {item.partner_english && (
                            <div className="flex items-start gap-2 max-w-[85%]">
                              <div className="w-7 h-7 rounded-full bg-[#fcf1f5] border border-[#ffd8ea] flex items-center justify-center text-[#7b5268] flex-shrink-0 mt-0.5">
                                <Bot className="w-4 h-4" />
                              </div>
                              <div className="bg-[#fcf1f5] p-3 rounded-2xl border border-[#ffd8ea] text-xs font-outfit text-[#1f1a1d]">
                                <p className="font-sora font-bold text-[#7b5268] mb-0.5">AI Partner:</p>
                                <p className="font-semibold">{item.partner_english}</p>
                              </div>
                            </div>
                          )}

                          {/* User Bubble */}
                          <div className="flex items-start gap-2 max-w-[85%] ml-auto justify-end">
                            <div className="bg-white p-3 rounded-2xl border border-[#E5DFE2] text-xs font-outfit text-[#1f1a1d] text-right">
                              <p className="font-sora font-bold text-[#201B1E] mb-0.5">You translated:</p>
                              <p className="font-medium">{item.user_translation}</p>
                              <span className="inline-block mt-1 font-mono text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                                Accuracy: {item.accuracy_score}%
                              </span>
                            </div>
                            <div className="w-7 h-7 rounded-full bg-[#201B1E] flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                              <User className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* CURRENT TURN PROMPT CARD */}
              <div className="space-y-4">
                {/* AI Partner Current English Statement (if dialogue mode) */}
                {dialogueMode === "dialogue" && currentPartnerEnglish && (
                  <div className="bg-[#fcf1f5] p-4.5 rounded-[20px] border border-[#ffd8ea] space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-sora font-bold text-[#7b5268] uppercase tracking-wider flex items-center gap-1.5">
                        <Bot className="h-4 w-4" />
                        AI Partner:
                      </span>
                      <button
                        onClick={() => speakWord(currentPartnerEnglish)}
                        className="p-1.5 text-[#7b5268] hover:bg-white rounded-xl transition-all border border-transparent hover:border-[#EFBCD5] cursor-pointer"
                        title="Listen to speech"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="font-sora text-base text-[#1f1a1d] font-bold leading-relaxed">
                      "{currentPartnerEnglish}"
                    </p>
                  </div>
                )}

                {/* Vietnamese Source Sentence Card */}
                <div className="space-y-2">
                  {/* Targeted Error Hint Badge if present */}
                  {currentTargetedErrorHint && (
                    <div className="bg-[#fcf1f5] border border-[#EFBCD5] px-4 py-2.5 rounded-[16px] text-xs font-sora font-bold text-[#7b5268] flex items-center gap-2 shadow-xs mb-2">
                      <Target className="w-4 h-4 text-[#7b5268] flex-shrink-0" />
                      <span>Targeted Focus: {currentTargetedErrorHint}</span>
                    </div>
                  )}

                  <span className="text-xs font-mono font-bold text-[#706065] uppercase tracking-wider block">
                    {dialogueMode === "dialogue"
                      ? "Translate your response into English:"
                      : "Translate into English:"}
                  </span>
                  {loadingSentence ? (
                    <div className="h-24 bg-[#fcf1f5]/60 rounded-[20px] animate-pulse flex items-center justify-center text-sm font-outfit text-[#706065] border border-[#ffd8ea]">
                      <RefreshCw className="h-4 w-4 animate-spin mr-2 text-[#7b5268]" />
                      Generating next prompt...
                    </div>
                  ) : (
                    <div className="p-6 bg-gradient-to-br from-[#FCFAF7] to-[#fcf1f5]/50 rounded-[20px] border border-[#EFBCD5]/70 text-lg md:text-xl font-sora font-bold text-[#1f1a1d] leading-relaxed shadow-xs">
                      "{currentVietnamese}"
                    </div>
                  )}
                </div>
              </div>

              {/* User Input Workspace (Writing or Speaking) */}
              {!feedback && (
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                  <span className="text-xs font-mono font-bold text-[#706065] uppercase tracking-wider block">
                    {mode === "writing" ? "Type your English translation:" : "Record your English translation:"}
                  </span>

                  {mode === "writing" ? (
                    <div className="relative">
                      <textarea
                        value={userTranslation}
                        onChange={(e) => setUserTranslation(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSubmit()
                          }
                        }}
                        placeholder="Type your English translation here... (Press Enter to submit)"
                        rows={3}
                        disabled={evaluating || loadingSentence}
                        className="w-full bg-[#FCFAF7] border border-[#E5DFE2] focus:border-[#EFBCD5] focus:bg-white rounded-2xl p-4 text-base font-outfit text-[#1f1a1d] placeholder:text-[#9A8A90] focus:outline-none transition-all resize-none shadow-xs"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 bg-[#FCFAF7] rounded-2xl border-2 border-dashed border-[#EFBCD5] space-y-4">
                      {/* Micro Record Button */}
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-sm transition-all transform hover:scale-105 cursor-pointer ${
                          isListening
                            ? "bg-[#EFBCD5] text-[#201B1E] ring-8 ring-[#EFBCD5]/40 animate-pulse font-bold"
                            : "bg-[#201B1E] text-white hover:bg-[#352e32]"
                        }`}
                      >
                        {isListening ? <MicOff className="h-8 w-8 text-[#201B1E]" /> : <Mic className="h-8 w-8 text-white" />}
                      </button>

                      <p className="text-xs font-sora font-semibold text-[#706065]">
                        {isListening
                          ? "Recording in progress... Speak your translation!"
                          : "Click microphone to start recording"}
                      </p>

                      {/* Live Transcript Display */}
                      <div className="w-full max-w-lg">
                        <input
                          type="text"
                          value={userTranslation}
                          onChange={(e) => setUserTranslation(e.target.value)}
                          placeholder="Recorded transcript will appear here..."
                          className="w-full bg-white border border-[#E5DFE2] focus:border-[#EFBCD5] rounded-xl px-4 py-2.5 text-sm font-outfit text-[#1f1a1d] focus:outline-none focus:ring-2 focus:ring-[#EFBCD5]/30 shadow-xs"
                        />
                      </div>

                      {!speechSupported && (
                        <p className="text-xs text-rose-500 font-outfit">
                          Web Speech API is not supported in your browser. Please use Type mode!
                        </p>
                      )}
                    </div>
                  )}

                  {/* Submit Action Button */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={!userTranslation.trim() || evaluating || loadingSentence}
                      className="px-6 py-3 bg-[#EFBCD5] text-[#201B1E] rounded-xl font-sora font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-sm border border-[#ffd8ea] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {evaluating ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin text-[#201B1E]" />
                          <span>Evaluating Translation...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 text-[#7b5268]" />
                          <span>Submit for Evaluation</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* AI Evaluation & Feedback Card */}
              {feedback && (
                <div className="space-y-6 pt-5 border-t border-[#E5DFE2]/70 animate-fadeIn font-outfit">
                  {/* Scores & General Feedback Header */}
                  <div className="bg-gradient-to-r from-[#fcf1f5] via-white to-[#fcf1f5] p-5 rounded-[20px] border border-[#EFBCD5]/70 space-y-3 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-full border border-emerald-200 text-xs font-bold font-sora shadow-xs">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>Accuracy: {feedback.accuracy_score}%</span>
                        </div>
                        <div className="flex items-center gap-2 bg-amber-50 text-amber-800 px-3.5 py-1.5 rounded-full border border-amber-200 text-xs font-bold font-sora shadow-xs">
                          <Award className="h-4 w-4 text-amber-600" />
                          <span>Fluency: {feedback.fluency_score}%</span>
                        </div>
                      </div>

                      <div className="text-xs font-mono font-semibold text-[#706065] bg-white px-3 py-1 rounded-full border border-[#E5DFE2]">
                        Reflex Speed: {timerSeconds}s
                      </div>
                    </div>

                    <p className="font-outfit text-sm text-[#1f1a1d] leading-relaxed pt-1">
                      <strong className="text-[#7b5268] font-sora">AI Coach Feedback:</strong> {feedback.general_feedback}
                    </p>
                  </div>

                  {/* Targeted Error Mastery Action Card */}
                  {currentTargetedErrorId && (
                    <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-[18px] flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <BookmarkCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <div>
                          <span className="font-sora font-bold text-emerald-900 block">
                            Targeted Error Practice Result
                          </span>
                          <span className="text-emerald-700 font-outfit">
                            {isErrorMarkedMastered
                              ? "Marked as Mastered! This error has been moved to your Mastered list."
                              : "If you feel confident with this expression, mark it as mastered."}
                          </span>
                        </div>
                      </div>
                      {!isErrorMarkedMastered && (
                        <button
                          onClick={handleToggleMastered}
                          className="px-4 py-2 bg-emerald-600 text-white font-sora font-bold text-xs rounded-xl hover:bg-emerald-700 active:scale-95 transition-all shadow-xs flex-shrink-0 cursor-pointer"
                        >
                          Mark as Mastered
                        </button>
                      )}
                    </div>
                  )}

                  {/* User Answer vs Natural Translation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#FCFAF7] p-4.5 rounded-[18px] border border-[#E5DFE2] space-y-1.5">
                      <span className="text-xs font-mono font-bold text-[#706065] uppercase tracking-wider block">
                        Your Translation:
                      </span>
                      <p className="font-outfit text-sm text-[#1f1a1d] font-medium leading-relaxed">{userTranslation}</p>
                    </div>

                    <div className="bg-[#fcf1f5] p-4.5 rounded-[18px] border border-[#EFBCD5]/70 space-y-1.5 relative shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#7b5268] uppercase tracking-wider block flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-[#7b5268]" />
                          Native Expression:
                        </span>
                        <button
                          onClick={() => speakWord(feedback.natural_translation)}
                          className="p-1.5 text-[#7b5268] hover:bg-white rounded-xl transition-all border border-transparent hover:border-[#EFBCD5]"
                          title="Listen to native pronunciation"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="font-outfit text-base text-[#1f1a1d] font-bold leading-relaxed">
                        {feedback.natural_translation}
                      </p>
                    </div>
                  </div>

                  {/* Collapsible Accordion: Detailed Analysis (Alternatives & Extracted Error Log) */}
                  {(feedback.alternative_translations.length > 0 || feedback.extracted_errors.length > 0) && (
                    <div className="border border-[#E5DFE2] rounded-[18px] bg-[#FCFAF7] overflow-hidden">
                      <button
                        onClick={() => setIsFeedbackDetailsExpanded(!isFeedbackDetailsExpanded)}
                        className="w-full px-4 py-3 bg-[#fcf1f5] hover:bg-[#f8e7ee] transition-colors flex items-center justify-between text-xs font-sora font-bold text-[#7b5268] cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-[#7b5268]" />
                          <span>Detailed Analysis & Alternative Phrasings</span>
                        </span>
                        {isFeedbackDetailsExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#7b5268]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#7b5268]" />
                        )}
                      </button>

                      {isFeedbackDetailsExpanded && (
                        <div className="p-4 space-y-4 border-t border-[#E5DFE2]/70 animate-fadeIn">
                          {/* Alternative Phrasings */}
                          {feedback.alternative_translations.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-xs font-mono font-bold text-[#706065] uppercase tracking-wider block">
                                Alternative Expressions:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {feedback.alternative_translations.map((alt, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => speakWord(alt)}
                                    className="px-3.5 py-1.5 bg-white border border-[#E5DFE2] hover:border-[#EFBCD5] hover:bg-[#fcf1f5] rounded-xl text-xs font-outfit text-[#1f1a1d] cursor-pointer flex items-center gap-2 transition-all shadow-xs"
                                  >
                                    <Volume2 className="h-3.5 w-3.5 text-[#7b5268]" />
                                    <span>{alt}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Extracted Errors List */}
                          {feedback.extracted_errors.length > 0 && (
                            <div className="space-y-3 pt-2 border-t border-[#E5DFE2]/60">
                              <span className="text-xs font-sora font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                                <AlertCircle className="h-4 w-4" />
                                Error Breakdown (Recorded to Error Bank):
                              </span>

                              <div className="space-y-2">
                                {feedback.extracted_errors.map((err, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3.5 bg-white border border-rose-200/80 rounded-xl text-xs space-y-1 shadow-xs"
                                  >
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 font-bold uppercase rounded-lg text-[10px] font-mono">
                                        {err.error_type}
                                      </span>
                                      <span className="line-through text-gray-500 font-medium">{err.original_text}</span>
                                      <span className="text-rose-400">➔</span>
                                      <span className="text-emerald-700 font-bold">{err.corrected_text}</span>
                                    </div>
                                    <p className="text-gray-700 font-outfit text-sm">{err.explanation}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Next Sentence / Next Turn Action Button */}
                  <div className="flex justify-end pt-4 border-t border-[#E5DFE2]/70">
                    <button
                      onClick={fetchNextSentence}
                      className="px-6 py-2.5 bg-[#201B1E] text-white rounded-xl font-sora font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      <span>
                        {dialogueMode === "dialogue"
                          ? isFinalTurn || currentTurnIndex >= 5
                            ? "View Scenario Summary"
                            : "Next Turn"
                          : "Next Prompt"}
                      </span>
                      <ArrowRight className="h-4 w-4 text-[#EFBCD5]" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
