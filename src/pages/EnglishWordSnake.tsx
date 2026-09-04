import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { apiFetch } from "@/lib/api"
import type { VocabularyItem } from "@/types"
import { useSnakeGame } from "@/features/vocabulary/snake/useSnakeGame"
import { SnakeCanvas } from "@/features/vocabulary/snake/SnakeCanvas"
import { SnakeHUD } from "@/features/vocabulary/snake/SnakeHUD"
import { GameOverModal } from "@/features/vocabulary/snake/GameOverModal"
import { soundManager } from "@/features/vocabulary/snake/soundEffects"
import { Play, Pause, BookPlus, Gamepad2, RefreshCw, Trophy, Volume2, VolumeX, GraduationCap } from "lucide-react"
import { Link } from "react-router-dom"

export default function EnglishWordSnake() {
  const { token } = useAuth()
  const [vocabularies, setVocabularies] = useState<VocabularyItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)

  // Fetch vocabulary list from API
  useEffect(() => {
    async function fetchVocab() {
      try {
        const data = await apiFetch<{ items: VocabularyItem[] }>("/vocabulary?page_size=1000", { token })
        setVocabularies(data?.items || [])
      } catch (err) {
        console.error("Failed to load vocabularies for Snake:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchVocab()
  }, [token])

  const {
    status,
    snake,
    direction,
    lives,
    score,
    combo,
    maxCombo,
    highScore,
    currentPrompt,
    foods,
    remainingCount,
    totalCount,
    correctWordsCount,
    wrongWordsList,
    startGame,
    pauseGame,
    changeDirection,
  } = useSnakeGame(vocabularies, token || undefined)

  const handleToggleSound = () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    soundManager.enabled = next
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-[#706065] gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-[#EFBCD5]" />
        <span className="font-outfit text-sm font-medium">Đang nạp từ vựng cho trò chơi...</span>
      </div>
    )
  }

  if (vocabularies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] p-8 text-center bg-white rounded-3xl border border-[#E5DFE2] shadow-sm max-w-lg mx-auto gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#FCF1F5] border border-[#EFBCD5] flex items-center justify-center text-[#7B5268]">
          <BookPlus className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-extrabold font-sora text-[#1F1A1D]">Chưa có từ vựng nào!</h2>
        <p className="text-sm font-outfit text-[#706065]">
          Word Snake cần ít nhất từ vựng trong kho dữ liệu cá nhân của bạn để tạo màn chơi. Hãy thêm từ vựng mới để trải nghiệm game nhé.
        </p>
        <Link
          to="/english/vocabularies"
          className="mt-2 px-6 py-3.5 bg-[#EFBCD5] hover:bg-[#E8A5C7] text-[#4A2639] font-sora font-bold text-sm rounded-2xl flex items-center gap-2 shadow-sm transition-colors"
        >
          <BookPlus className="h-5 w-5" />
          <span>Thêm từ vựng ngay</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto pb-12">
      {/* 1. Page Title Header & Subtitle (Matching Image 3 Stitch Design) */}
      <header className="flex flex-col gap-2">
        <h1 className="font-sora font-extrabold text-4xl md:text-5xl text-[#201B1E] tracking-tight">
          Word Snake Game
        </h1>
        <p className="font-outfit font-normal text-base md:text-lg text-[#706065] max-w-2xl leading-relaxed">
          Eat the correct English vocabulary matching the prompt to grow longer and master your database.
        </p>

        {/* Horizontal Stats Ribbon Bar with Pause/Resume Button */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <div className="bg-white border border-[#E5DFE2] px-5 py-2.5 rounded-full text-sm font-sora font-semibold text-[#201B1E] flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-600" />
            <span>High Score: <strong className="font-extrabold">{highScore || 1450} pts</strong></span>
          </div>

          <div className="bg-white border border-[#E5DFE2] px-5 py-2.5 rounded-full text-sm font-sora font-semibold text-[#201B1E] flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#7B5268]" />
            <span>Mastered: <strong className="font-extrabold">{totalCount - remainingCount}/{totalCount} Words</strong></span>
          </div>

          {/* Pause / Resume Button */}
          <button
            onClick={pauseGame}
            disabled={status !== "PLAYING" && status !== "PAUSED"}
            className="px-4 py-2.5 rounded-full bg-white hover:bg-[#FCF1F5] border border-[#E5DFE2] flex items-center gap-2 text-sm font-sora font-semibold text-[#514347] transition-colors disabled:opacity-40"
            title={status === "PAUSED" ? "Resume game" : "Pause game"}
          >
            {status === "PAUSED" ? (
              <>
                <Play className="h-4 w-4 fill-emerald-600 text-emerald-600" />
                <span>Tiếp tục</span>
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 text-[#7B5268]" />
                <span>Tạm dừng</span>
              </>
            )}
          </button>

          {/* Mute / Unmute Button */}
          <button
            onClick={handleToggleSound}
            className="w-10 h-10 rounded-full bg-white hover:bg-[#FCF1F5] border border-[#E5DFE2] flex items-center justify-center text-[#514347] transition-colors ml-auto sm:ml-0"
            title={soundEnabled ? "Mute audio" : "Unmute audio"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-rose-500" />}
          </button>
        </div>
      </header>

      {/* 2. Main Game Section Wrapped in One Single White Container Card Split (Matching Image 3 Stitch Design) */}
      <section className="w-full bg-white border border-[#E5DFE2] rounded-[32px] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
        {/* Left Column: Question Prompt + HUD Controls (col-span-5) */}
        <div className="lg:col-span-5 p-6 md:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#E5DFE2]">
          {status === "IDLE" ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-5 my-auto">
              <div className="w-16 h-16 rounded-2xl bg-[#FCF1F5] border border-[#EFBCD5] flex items-center justify-center text-[#7B5268]">
                <Gamepad2 className="h-8 w-8 text-[#7B5268]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-sora text-[#201B1E]">Bắt đầu lượt chơi</h2>
                <p className="text-sm text-[#706065] font-outfit mt-2 max-w-xs leading-relaxed">
                  Sử dụng phím mũi tên hoặc <kbd className="px-2 py-0.5 bg-[#FCF1F5] border border-[#E5DFE2] rounded-lg text-xs font-mono text-[#7B5268]">W A S D</kbd> để điều khiển rắn ăn đúng từ vựng.
                </p>
              </div>
              <button
                onClick={startGame}
                className="w-full max-w-xs py-3.5 px-6 bg-[#EFBCD5] hover:bg-[#E8A5C7] text-[#4A2639] font-sora font-bold text-base rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-98 cursor-pointer"
              >
                <Play className="h-5 w-5 fill-[#4A2639]" />
                <span>Bắt đầu lượt chơi</span>
              </button>
            </div>
          ) : (
            <SnakeHUD
              status={status}
              lives={lives}
              score={score}
              combo={combo}
              highScore={highScore}
              currentPrompt={currentPrompt}
              remainingCount={remainingCount}
              totalCount={totalCount}
              soundEnabled={soundEnabled}
              onToggleSound={handleToggleSound}
              onPause={pauseGame}
              onDirectionChange={changeDirection}
            />
          )}
        </div>

        {/* Right Column: Canvas Game Board with Cream Grid Background (col-span-7) */}
        <div className="lg:col-span-7 p-6 md:p-8 bg-[#FCFAF7] flex items-center justify-center relative min-h-[460px]">
          <SnakeCanvas
            snake={snake}
            direction={direction}
            foods={foods}
            status={status}
            onPause={pauseGame}
          />
        </div>
      </section>

      {/* Game Over / Victory Modal */}
      <GameOverModal
        status={status}
        score={score}
        highScore={highScore}
        maxCombo={maxCombo}
        correctCount={correctWordsCount}
        totalCount={totalCount}
        wrongWordsList={wrongWordsList}
        onRestart={startGame}
      />
    </div>
  )
}
