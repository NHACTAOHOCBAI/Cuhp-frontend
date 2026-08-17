/**
 * SVG circular progress indicator + supportive copy.
 *
 * Renders a track + filled ring whose `strokeDashoffset` is computed from
 * the completion percentage, then a percent label, optional emphatic copy,
 * and a small flame accent in the top-right.
 */
import { Flame } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DailyProgressCircleProps {
  percentage: number
  total: number
  completed: number
}

export function DailyProgressCircle({
  percentage,
  total,
  completed,
}: DailyProgressCircleProps) {
  const safePercentage = Math.max(0, Math.min(100, percentage))
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const offset = ((100 - safePercentage) / 100) * circumference

  const headline =
    total === 0
      ? "Hôm nay trống lịch"
      : `${completed}/${total} bài tập đã xong`

  const caption =
    safePercentage === 100 && total > 0
      ? "Tuyệt vời! Bạn đã hoàn thành 100% mục tiêu tập luyện hôm nay! 🌟"
      : total > 0
      ? "Hãy kiên trì hoàn thành nốt các bài tập còn lại nhé!"
      : "Lên kế hoạch tập luyện bằng cách thêm bài tập mới nào."

  return (
    <Card className="border-border shadow-none overflow-hidden relative">
      <div className="absolute top-0 right-0 h-16 w-16 bg-primary/5 rounded-bl-full pointer-events-none flex items-center justify-center">
        <Flame className="h-6 w-6 text-primary/30 mr-[-8px] mt-[-8px]" />
      </div>
      <CardHeader>
        <CardTitle className="text-base font-extrabold flex items-center gap-2">
          Tiến trình tập luyện
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center py-4">
        <div className="relative h-28 w-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r={radius}
              className="stroke-muted"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="56"
              cy="56"
              r={radius}
              className="stroke-primary transition-all duration-500 ease-out"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-black">{safePercentage}%</span>
            <span className="text-[10px] text-muted-foreground font-bold">Hoàn thành</span>
          </div>
        </div>

        <div className="text-center mt-5 space-y-1">
          <p className="text-sm font-extrabold">{headline}</p>
          <p className="text-xs text-muted-foreground px-4">{caption}</p>
        </div>
      </CardContent>
    </Card>
  )
}
