import React from "react"
import type { VocabularyItem } from "@/types"
import type { GameStatus } from "./useSnakeGame"
import { RefreshCw, BookOpen, CheckCircle2, RotateCcw } from "lucide-react"
import { Link } from "react-router-dom"

interface GameOverModalProps {
  status: GameStatus
  score: number
  highScore: number
  maxCombo: number
  correctCount: number
  totalCount: number
  wrongWordsList: VocabularyItem[]
  onRestart: () => void
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  status,
  score,
  highScore,
  maxCombo,
  correctCount,
  totalCount,
  wrongWordsList,
  onRestart,
}) => {
  if (status !== "VICTORY" && status !== "GAME_OVER") return null

  const isVictory = status === "VICTORY"
  const isNewHighScore = score > 0 && score >= highScore

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#201B1E]/30 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white border border-[#E5DFE2] rounded-[32px] p-6 md:p-8 text-[#201B1E] flex flex-col gap-6 relative">
        {/* Modal Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#FCF1F5] border border-[#EFBCD5] flex items-center justify-center text-[#7B5268]">
            {isVictory ? (
              <CheckCircle2 className="h-7 w-7 text-[#7B5268]" />
            ) : (
              <RotateCcw className="h-7 w-7 text-[#7B5268]" />
            )}
          </div>

          <div>
            <h2 className="text-2xl font-extrabold font-sora text-[#201B1E]">
              {isVictory ? "Hoàn thành màn chơi" : "Kết thúc lượt chơi"}
            </h2>
            <p className="text-sm font-outfit text-[#706065] mt-1">
              {isVictory
                ? `Bạn đã học thuộc toàn bộ ${totalCount} từ vựng trong lượt này.`
                : `Bạn đã ôn luyện được ${correctCount}/${totalCount} từ vựng.`}
            </p>
          </div>
        </div>

        {/* Stats Grid (Clean Minimal Cards) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#FCFAF7] p-4 rounded-2xl border border-[#E5DFE2] flex flex-col items-center">
            <span className="text-xs text-[#706065] font-outfit font-medium">Điểm số</span>
            <span className="text-2xl font-extrabold font-sora text-[#201B1E] mt-1">{score}</span>
            {isNewHighScore && (
              <span className="text-[10px] bg-[#FCF1F5] text-[#7B5268] px-2 py-0.5 rounded-full font-bold mt-1 border border-[#EFBCD5]">
                Kỷ lục mới
              </span>
            )}
          </div>

          <div className="bg-[#FCFAF7] p-4 rounded-2xl border border-[#E5DFE2] flex flex-col items-center">
            <span className="text-xs text-[#706065] font-outfit font-medium">Đã hoàn thành</span>
            <span className="text-2xl font-extrabold font-sora text-[#201B1E] mt-1">
              {correctCount}/{totalCount}
            </span>
          </div>

          {maxCombo > 1 && (
            <div className="bg-[#FCFAF7] p-3.5 rounded-2xl border border-[#E5DFE2] flex flex-col items-center col-span-2">
              <span className="text-xs text-[#706065] font-outfit font-medium">Combo cao nhất</span>
              <span className="text-lg font-bold font-sora text-[#7B5268] mt-0.5">
                x{maxCombo}
              </span>
            </div>
          )}
        </div>

        {/* Wrong Words Review List */}
        {wrongWordsList.length > 0 && (
          <div className="bg-[#FCF1F5]/60 p-4 rounded-2xl border border-[#E5DFE2] flex flex-col gap-2 max-h-36 overflow-y-auto">
            <span className="text-xs font-semibold text-[#7B5268] font-outfit">
              Từ vựng cần ôn lại ({wrongWordsList.length}):
            </span>
            <div className="flex flex-wrap gap-2">
              {wrongWordsList.map((item, i) => (
                <div key={i} className="bg-white border border-[#E5DFE2] px-2.5 py-1 rounded-xl text-xs">
                  <span className="font-bold text-[#201B1E]">{item.word}</span>: <span className="text-[#706065]">{item.meaning}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            onClick={onRestart}
            className="flex-1 py-3.5 px-4 bg-[#EFBCD5] hover:bg-[#E8A5C7] text-[#4A2639] font-sora font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Chơi lại</span>
          </button>
          <Link
            to="/english/vocabularies"
            className="py-3.5 px-4 bg-white hover:bg-[#FCF1F5] text-[#201B1E] font-sora font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 border border-[#E5DFE2] transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            <span>Kho từ vựng</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
