import React from "react"
import type { VocabularyItem } from "@/types"
import type { Direction, GameStatus } from "./useSnakeGame"
import { Heart, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"

interface SnakeHUDProps {
  status: GameStatus
  lives: number
  score: number
  combo: number
  highScore: number
  currentPrompt: VocabularyItem | null
  remainingCount: number
  totalCount: number
  soundEnabled: boolean
  onToggleSound: () => void
  onPause: () => void
  onDirectionChange: (dir: Direction) => void
}

export const SnakeHUD: React.FC<SnakeHUDProps> = ({
  lives,
  score,
  combo,
  currentPrompt,
  onDirectionChange,
}) => {
  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Header Row: Hearts + Live Score Counter */}
      <div className="flex items-start justify-between px-2">
        {/* Lives (3 Delicate Pink Outline Hearts matching Stitch) */}
        <div className="flex items-center gap-2 pt-1">
          {[1, 2, 3].map((heartIndex) => (
            <Heart
              key={heartIndex}
              className={`h-6 w-6 transition-all ${
                heartIndex <= lives
                  ? "text-[#F48FB1] stroke-[#F48FB1] stroke-[2.2] fill-none"
                  : "text-[#E5DFE2] stroke-[#E5DFE2] stroke-[1.8] fill-none"
              }`}
            />
          ))}
        </div>

        {/* Score & Combo */}
        <div className="flex flex-col items-end">
          <div className="font-sora font-extrabold text-3xl text-[#201B1E] tracking-tight">
            {score} PTS
          </div>
          {combo > 1 ? (
            <div className="font-sora font-bold text-xs text-[#F48FB1] uppercase tracking-wider">
              X{combo} COMBO
            </div>
          ) : (
            <div className="font-outfit text-xs text-[#F48FB1]">
              X3 COMBO
            </div>
          )}
        </div>
      </div>

      {/* Target Word Card */}
      <div className="bg-[#F6EBEF]/90 border border-[#E5DFE2] rounded-[28px] p-6 text-center flex flex-col items-center gap-3">
        <span className="font-outfit text-xs text-[#706065] font-medium">
          Target Word (Vietnamese)
        </span>

        <h3 className="font-sora font-extrabold text-2xl md:text-3xl text-[#201B1E] leading-tight">
          {currentPrompt ? currentPrompt.meaning : "Sự kiên trì, bền bỉ"}
          <span className="block text-lg font-bold text-[#201B1E] font-sora mt-0.5">
            ({currentPrompt?.word_type || "n"})
          </span>
        </h3>
      </div>

      {/* Diamond D-Pad Controls */}
      <div className="flex flex-col items-center gap-2 pt-2">
        <button
          onClick={() => onDirectionChange("UP")}
          className="w-12 h-12 rounded-full bg-[#F4ECEF] hover:bg-[#EFBCD5]/30 active:bg-[#EFBCD5]/60 text-[#514347] border border-[#E5DFE2] flex items-center justify-center transition-all active:scale-95"
          title="Up (W / ↑)"
        >
          <ChevronUp className="h-6 w-6" />
        </button>
        <div className="flex gap-4">
          <button
            onClick={() => onDirectionChange("LEFT")}
            className="w-12 h-12 rounded-full bg-[#F4ECEF] hover:bg-[#EFBCD5]/30 active:bg-[#EFBCD5]/60 text-[#514347] border border-[#E5DFE2] flex items-center justify-center transition-all active:scale-95"
            title="Left (A / ←)"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => onDirectionChange("DOWN")}
            className="w-12 h-12 rounded-full bg-[#F4ECEF] hover:bg-[#EFBCD5]/30 active:bg-[#EFBCD5]/60 text-[#514347] border border-[#E5DFE2] flex items-center justify-center transition-all active:scale-95"
            title="Down (S / ↓)"
          >
            <ChevronDown className="h-6 w-6" />
          </button>
          <button
            onClick={() => onDirectionChange("RIGHT")}
            className="w-12 h-12 rounded-full bg-[#F4ECEF] hover:bg-[#EFBCD5]/30 active:bg-[#EFBCD5]/60 text-[#514347] border border-[#E5DFE2] flex items-center justify-center transition-all active:scale-95"
            title="Right (D / →)"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  )
}
