import * as React from "react"
import { useParams, Link } from "react-router-dom"
import { useAudioById } from "@/features/audio/hooks"
import { Play, Pause, Mic, CheckCircle } from "lucide-react"
import { toast } from "sonner"

export default function EnglishShadowingDetail() {
  const { id } = useParams<{ id: string }>()

  // 1. Fetch audio track details
  const { data: track, isLoading: isTrackLoading } = useAudioById(id)

  // Audio player state
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(84) // Default 01:24
  const duration = 270 // Default 04:30
  const [activeSentenceIndex, setActiveSentenceIndex] = React.useState(2) // Default index 2 highlighted as in Stitch mockup

  // Recording simulation state
  const [isRecording, setIsRecording] = React.useState(false)
  const [accuracyScore, setAccuracyScore] = React.useState(94)

  // Timer for seekbar simulation
  React.useEffect(() => {
    let interval: any
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false)
            return 0
          }
          return prev + 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, duration])

  // Sync simulated progress to localStorage
  React.useEffect(() => {
    if (!id) return
    // Default mock setup: if index > 0, progress is at least 40%
    const currentProgress = localStorage.getItem(`audio_progress_${id}`)
    if (currentProgress !== "100") {
      if (activeSentenceIndex > 0) {
        localStorage.setItem(`audio_progress_${id}`, "40")
      }
    }
  }, [id, activeSentenceIndex])

  // Parse sentences or fallback to standard sentences matching Stitch designs
  const sentences = React.useMemo(() => {
    if (track?.transcript) {
      return track.transcript
        .split(/[.!?]\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    }
    // Fallback standard dialogue from Stitch mockup
    return [
      "It's easy to get caught up in the constant hustle of modern life.",
      "We are always rushing from one task to another, never really pausing.",
      "We need to embrace slow living in this fast-paced world.",
      "Finding time for a quiet morning coffee can change your whole day.",
      "It is about intentional choices rather than passive reactions.",
      "When we slow down, we actually notice the details around us more clearly.",
      "This practice isn't about doing less, but doing things with more presence.",
    ]
  }, [track])

  // Format time display (mm:ss)
  const formatTime = (timeInSecs: number) => {
    const mins = Math.floor(timeInSecs / 60)
    const secs = timeInSecs % 60
    return `0${mins}:${secs < 10 ? "0" + secs : secs}`
  }

  // Handle Play/Pause
  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  // Handle skip forward/backward
  const handleSkip = (seconds: number) => {
    setCurrentTime((prev) => {
      const target = prev + seconds
      if (target < 0) return 0
      if (target > duration) return duration
      return target
    })
  }

  // Handle Mic Recording toggle simulation
  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop recording, generate mock score
      setIsRecording(false)
      const score = Math.floor(88 + Math.random() * 11) // score between 88 and 98
      setAccuracyScore(score)
      toast.success(`Ghi âm hoàn tất! Độ chính xác đạt ${score}%`)

      // Move to next sentence if available
      if (activeSentenceIndex < sentences.length - 1) {
        setActiveSentenceIndex((prev) => prev + 1)
      } else {
        // Complete the shadowing session!
        if (id) {
          localStorage.setItem(`audio_progress_${id}`, "100")
        }
        toast.success("Chúc mừng! Bạn đã hoàn thành bài luyện tập Shadowing hôm nay.")
      }
    } else {
      // Start recording
      setIsRecording(true)
      toast.info("Đang ghi âm... Hãy nói theo giọng điệu người bản xứ.")
    }
  }

  if (isTrackLoading) {
    return (
      <div className="py-12 space-y-6 animate-pulse max-w-5xl mx-auto">
        <div className="h-4 bg-zinc-100 rounded w-1/4" />
        <div className="h-10 bg-zinc-100 rounded w-3/4" />
        <div className="h-64 bg-zinc-50 rounded w-full" />
      </div>
    )
  }

  const trackTitle = track?.title || "Shadowing: Slow Living Dialogue"

  return (
    <div className="space-y-6 w-full relative">
      {/* Page Header */}
      <header className="mb-6">
        <Link
          to="/english/listening"
          className="font-outfit text-sm text-[#706065] hover:text-[#EFBCD5] transition-colors inline-block mb-2 font-semibold"
        >
          ← Thư viện bài nghe
        </Link>
        <h1 className="font-sora text-[32px] font-bold text-[#1f1a1d] leading-tight mb-1">
          {trackTitle}
        </h1>
        <p className="font-outfit text-[16px] text-[#7b5268] font-medium">
          Track {track?.id ? track.id.slice(-2) : "04"} • Intermediate • {formatTime(duration)}
        </p>
      </header>

      {/* Main Grid Wrapper */}
      <main className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Left Column: Audio Player */}
        <div className="w-full lg:w-[45%] flex flex-col gap-6">
          {/* Audio Player Card */}
          <div className="bg-white rounded-[24px] p-6 border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] flex flex-col gap-6">
            {/* Waveform graphic visualization box */}
            <div className="flex items-center justify-center bg-[#fcf1f5]/30 rounded-xl border border-[#E5DFE2] relative overflow-hidden h-32">
              <img
                alt="Waveform"
                className="absolute inset-0 w-full h-full object-cover opacity-60"
                src="https://lh3.googleusercontent.com/aida/AEtjO1WwJl1c6hmPxfcELA89b7qTddRYPIQVHVLTq6lcWuKXOyxGWwvneVKpSJrQmDJ_fm14EyZhDEQlmn_hLd3NUPkmTMDkbkiykK39HzfmtZg9Y6WLt7YqaCzJc0IuCSd6WxkYz30OJtyPMfag8zaawrvl_pXGUJ11cT-f5yNI9hkfFDAxrSaYm0ZmMWGJj-M62yqgSFDWozZy00tWfeuTwZvKWCiGAK1dsIq157yye7DJHr6gbwEIzdBptJA"
              />
            </div>

            {/* Seek bar track */}
            <div className="flex flex-col gap-2 font-outfit">
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const percent = (e.clientX - rect.left) / rect.width
                  setCurrentTime(Math.floor(percent * duration))
                }}
                className="w-full h-2 bg-[#E5DFE2] rounded-full overflow-hidden relative cursor-pointer"
              >
                <div
                  className="absolute top-0 left-0 h-full bg-[#EFBCD5] rounded-full"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[14px] text-[#706065] font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Play controls */}
            <div className="flex justify-center items-center gap-8">
              <button
                onClick={() => handleSkip(-10)}
                className="text-[#706065] hover:text-[#EFBCD5] transition-colors active:scale-95 text-lg p-2 font-bold font-mono"
              >
                -10s
              </button>
              <button
                onClick={handleTogglePlay}
                className="w-16 h-16 rounded-full bg-[#EFBCD5] text-[#201B1E] flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-sm border border-[#ffd8ea]"
              >
                {isPlaying ? (
                  <Pause className="h-7 w-7 stroke-[2.5]" />
                ) : (
                  <Play className="h-7 w-7 stroke-[2.5] fill-current ml-1" />
                )}
              </button>
              <button
                onClick={() => handleSkip(10)}
                className="text-[#706065] hover:text-[#EFBCD5] transition-colors active:scale-95 text-lg p-2 font-bold font-mono"
              >
                +10s
              </button>
            </div>
          </div>

          {/* Mascot encouraging Tip box matching Stitch designs */}
          <div className="bg-white rounded-[24px] p-6 border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] flex items-center gap-4 mt-auto font-outfit">
            <div className="w-16 h-16 rounded-xl bg-[#fcf1f5]/30 border border-[#E5DFE2] flex-shrink-0 overflow-hidden flex items-center justify-center p-1">
              <img
                alt="Robot Blob Mascot"
                className="w-12 h-12 object-contain"
                src="https://lh3.googleusercontent.com/aida/AEtjO1WWI-4Bez9fReOhkSCuzDtHUG7lv8VKTf8TGY2IKLCIm-FGkyiSxSgNE2Njbwwr0jbra9wkrwTVQuk_MAJJkM_6ZrGHlbtRhPMMYjmPZQ50_zvfpgtkoxkWm9DY2-M93kymnKeqoQmnwHB5FFef0XeWLefcH6i4tdOUmjST5LsaF94YW1rJVQpo_n28A2_Vx7FCVSreph-NFjaSFNXeOm5bEEw6nMoNBCJtcFsWpPEFaE-EApbe713Qm19s"
              />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[12px] text-[#EFBCD5] uppercase tracking-wider mb-1 font-bold">
                Focus Tip
              </span>
              <p className="text-sm font-medium text-[#1f1a1d]">
                "Take a deep breath and match the speaker's rhythm."
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Transcription Card */}
        <div className="w-full lg:w-[55%] flex flex-col gap-6">
          <div className="bg-white rounded-[24px] p-6 border border-[#E5DFE2] shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] flex-grow flex flex-col h-[550px] overflow-hidden">
            {/* Card Header with Score */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#E5DFE2]">
              <h2 className="font-sora text-sm font-bold text-[#706065] uppercase tracking-wider">
                Transcript
              </h2>
              <div className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs flex items-center gap-1 font-bold font-mono">
                <CheckCircle className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>{accuracyScore}% Accuracy Score</span>
              </div>
            </div>

            {/* Sentences Transcript Scroller */}
            <div className="flex-grow overflow-y-auto pr-2 space-y-4 text-[18px] font-outfit text-[#4f4449] leading-relaxed select-text hide-scrollbar pb-16">
              {sentences.map((sentence, idx) => {
                const isActive = idx === activeSentenceIndex
                return (
                  <p
                    key={idx}
                    onClick={() => setActiveSentenceIndex(idx)}
                    className={`cursor-pointer transition-all duration-300 rounded-xl p-3 ${
                      isActive
                        ? "bg-[#EFBCD5]/20 border-l-4 border-[#EFBCD5] text-[#1f1a1d] font-semibold translate-x-1"
                        : "opacity-60 hover:opacity-85"
                    }`}
                  >
                    {sentence}
                  </p>
                )
              })}
            </div>

            {/* Floating mic recording bar layout */}
            <div className="mt-auto pt-6 flex flex-col items-center gap-3 relative z-10 border-t border-[#E5DFE2] bg-white/95 backdrop-blur-sm -mx-6 px-6 pb-2 rounded-b-[24px] font-outfit">
              <div className="flex items-center gap-1.5 h-6 mb-2">
                {isRecording ? (
                  <>
                    <div className="w-1 bg-[#ba1a1a] rounded-full h-[60%] animate-pulse" />
                    <div className="w-1 bg-[#ba1a1a] rounded-full h-[100%] animate-pulse delay-75" />
                    <div className="w-1 bg-[#ba1a1a] rounded-full h-[80%] animate-pulse delay-150" />
                    <div className="w-1 bg-[#ba1a1a] rounded-full h-[40%] animate-pulse delay-75" />
                    <div className="w-1 bg-[#ba1a1a] rounded-full h-[20%] animate-pulse" />
                  </>
                ) : (
                  <div className="text-zinc-300 text-xs font-mono">Microphone ready</div>
                )}
              </div>
              <button
                onClick={handleToggleRecording}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 border cursor-pointer ${
                  isRecording
                    ? "bg-[#ba1a1a] text-white border-red-500 scale-[1.03] animate-pulse"
                    : "bg-[#EFBCD5] text-[#201B1E] hover:opacity-90 border-[#ffd8ea]"
                }`}
              >
                <Mic className="h-7 w-7 stroke-[2.25]" />
              </button>
              <span className="text-[12px] text-[#706065] font-semibold">
                {isRecording ? "Tap to stop recording" : "Tap to start shadowing"}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
