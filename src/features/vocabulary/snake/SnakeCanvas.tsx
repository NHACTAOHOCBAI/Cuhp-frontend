import React, { useRef, useEffect } from "react"
import type { Position, Direction, FoodItem, GameStatus } from "./useSnakeGame"
import { Play, Pause } from "lucide-react"

interface SnakeCanvasProps {
  snake: Position[]
  direction: Direction
  foods: FoodItem[]
  status?: GameStatus
  onPause?: () => void
  gridSize?: number
}

export const SnakeCanvas: React.FC<SnakeCanvasProps> = ({
  snake,
  direction,
  foods,
  status,
  onPause,
  gridSize = 20,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const cellSize = width / gridSize

    // 1. Flat Light Background (No gradient)
    ctx.fillStyle = "#FFFBFD"
    ctx.fillRect(0, 0, width, height)

    // 2. Flat Grid Lines
    ctx.strokeStyle = "#F2E6EC"
    ctx.lineWidth = 1.2
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath()
      ctx.moveTo(i * cellSize, 0)
      ctx.lineTo(i * cellSize, height)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, i * cellSize)
      ctx.lineTo(width, i * cellSize)
      ctx.stroke()
    }

    // 3. Draw Foods (Uniform Neutral Indicator Dot + White Pill Label so player must read & guess)
    foods.forEach((food) => {
      const centerX = food.position.x * cellSize + cellSize / 2
      const centerY = food.position.y * cellSize + cellSize / 2

      ctx.save()
      // All food items use uniform neutral dot styling
      ctx.fillStyle = "#E2E8F0"
      ctx.beginPath()
      ctx.arc(centerX, centerY - cellSize * 0.25, cellSize * 0.22, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // Draw White Word Label Pill under food dot
      ctx.save()
      ctx.fillStyle = "#FFFFFF"
      ctx.strokeStyle = "#E5DFE2"
      ctx.lineWidth = 1

      const text = food.vocab.word
      ctx.font = `500 ${Math.max(10, Math.floor(cellSize * 0.32))}px Outfit, sans-serif`
      const textMetrics = ctx.measureText(text)
      const textWidth = textMetrics.width
      const pillWidth = Math.max(textWidth + 12, cellSize * 1.5)
      const pillHeight = cellSize * 0.55
      const pillX = centerX - pillWidth / 2
      const pillY = centerY + cellSize * 0.05

      ctx.beginPath()
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(pillX, pillY, pillWidth, pillHeight, pillHeight / 2)
      } else {
        ctx.rect(pillX, pillY, pillWidth, pillHeight)
      }
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = "#514347"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(text, centerX, pillY + pillHeight / 2 + 1)
      ctx.restore()
    })

    // 4. Draw Snake Body (Matching Image 3 Stitch Design: Rose Accent #EFBCD5 Rounded Pills)
    snake.forEach((seg, index) => {
      const isHead = index === 0
      const x = seg.x * cellSize
      const y = seg.y * cellSize
      const cornerRadius = cellSize * 0.45

      ctx.save()
      // Snake Body - Soft Pastel Rose `#EFBCD5`
      ctx.fillStyle = "#EFBCD5"

      // Draw rounded rectangle segment
      ctx.beginPath()
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(x + 1.5, y + 1.5, cellSize - 3, cellSize - 3, cornerRadius)
      } else {
        ctx.rect(x + 1.5, y + 1.5, cellSize - 3, cellSize - 3)
      }
      ctx.fill()
      ctx.restore()

      // Draw Head Eyes if Head segment
      if (isHead) {
        ctx.fillStyle = "#FFFFFF" // White eyes
        const eyeOffset = cellSize * 0.28
        const eyeRadius = cellSize * 0.1
        let eye1 = { x: x + eyeOffset, y: y + eyeOffset }
        let eye2 = { x: x + cellSize - eyeOffset, y: y + eyeOffset }

        if (direction === "DOWN") {
          eye1 = { x: x + eyeOffset, y: y + cellSize - eyeOffset }
          eye2 = { x: x + cellSize - eyeOffset, y: y + cellSize - eyeOffset }
        } else if (direction === "LEFT") {
          eye1 = { x: x + eyeOffset, y: y + eyeOffset }
          eye2 = { x: x + eyeOffset, y: y + cellSize - eyeOffset }
        } else if (direction === "RIGHT") {
          eye1 = { x: x + cellSize - eyeOffset, y: y + eyeOffset }
          eye2 = { x: x + cellSize - eyeOffset, y: y + cellSize - eyeOffset }
        }

        ctx.beginPath()
        ctx.arc(eye1.x, eye1.y, eyeRadius, 0, Math.PI * 2)
        ctx.arc(eye2.x, eye2.y, eyeRadius, 0, Math.PI * 2)
        ctx.fill()

        // Pupil dots inside eyes
        ctx.fillStyle = "#201B1E"
        ctx.beginPath()
        ctx.arc(eye1.x, eye1.y, eyeRadius * 0.5, 0, Math.PI * 2)
        ctx.arc(eye2.x, eye2.y, eyeRadius * 0.5, 0, Math.PI * 2)
        ctx.fill()
      }
    })
  }, [snake, direction, foods, gridSize])

  return (
    <div
      className="relative w-full aspect-square rounded-[28px] overflow-hidden border border-[#E5DFE2] bg-white p-2.5"
    >
      <canvas
        ref={canvasRef}
        width={560}
        height={560}
        className="w-full h-full block rounded-[22px] bg-[#FFFBFD]"
      />

      {/* PAUSED Overlay */}
      {status === "PAUSED" && (
        <div className="absolute inset-2.5 rounded-[22px] bg-[#FCFAF7]/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center gap-4 z-20">
          <div className="w-16 h-16 rounded-2xl bg-[#FCF1F5] border border-[#EFBCD5] flex items-center justify-center text-[#7B5268]">
            <Pause className="h-8 w-8 text-[#7B5268]" />
          </div>
          <div>
            <h3 className="font-sora font-extrabold text-2xl text-[#201B1E]">TẠM DỪNG TRÒ CHƠI</h3>
            <p className="font-outfit text-xs text-[#706065] mt-1">
              Nhấn phím <kbd className="px-1.5 py-0.5 bg-white border border-[#E5DFE2] rounded font-mono text-[#7B5268]">Space</kbd> hoặc nút bên dưới để tiếp tục
            </p>
          </div>
          {onPause && (
            <button
              onClick={onPause}
              className="mt-1 py-3 px-6 bg-[#EFBCD5] hover:bg-[#E8A5C7] text-[#4A2639] font-sora font-bold text-sm rounded-full flex items-center gap-2 border border-[#E5DFE2] transition-colors"
            >
              <Play className="h-4 w-4 fill-[#4A2639]" />
              <span>Tiếp tục chơi</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
