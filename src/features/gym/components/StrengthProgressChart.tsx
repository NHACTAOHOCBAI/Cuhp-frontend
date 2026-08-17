/**
 * Line chart for "Tiến trình nâng tạ tối đa (Max Weight)".
 *
 * Bespoke SVG. Highlights a single exercise's `max_weight` over time with
 * a glow-effect dot per data point and a small tooltip on hover.
 */
import { TrendingUp } from "lucide-react"
import type { ExerciseProgress } from "@/types"
import { formatDateToDisplay, getDayShortName } from "../utils/dates"

const SVG_WIDTH = 500
const SVG_HEIGHT = 220
const PADDING_LEFT = 45
const PADDING_RIGHT = 20
const PADDING_TOP = 25
const PADDING_BOTTOM = 30

interface StrengthProgressChartProps {
  exerciseData: ExerciseProgress | undefined
  exerciseName: string
}

export function StrengthProgressChart({
  exerciseData,
  exerciseName,
}: StrengthProgressChartProps) {
  if (!exerciseData || exerciseData.points.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center text-muted-foreground text-sm space-y-2 border border-dashed border-border rounded-xl">
        <TrendingUp className="h-8 w-8 text-muted-foreground/40" />
        <span>Chưa có dữ liệu bài tập &quot;{exerciseName}&quot; hoàn thành.</span>
      </div>
    )
  }

  const { points } = exerciseData
  const weights = points.map((p) => p.max_weight)
  const maxWeight = Math.max(...weights, 10)
  const minWeight = Math.min(...weights, 0)
  const weightRange = maxWeight - minWeight || 10

  const chartWidth = SVG_WIDTH - PADDING_LEFT - PADDING_RIGHT
  const chartHeight = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM
  const stepX = points.length > 1 ? chartWidth / (points.length - 1) : chartWidth

  const svgPoints = points.map((p, idx) => {
    const x = PADDING_LEFT + idx * stepX
    const normalizedY = ((p.max_weight - minWeight) / weightRange) * chartHeight
    const y = chartHeight - normalizedY + PADDING_TOP
    return { x, y, data: p }
  })

  const pathData = svgPoints.reduce(
    (acc, p, idx) =>
      acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`),
    ""
  )

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full min-w-[450px] overflow-visible"
      >
        <defs>
          <linearGradient id="gym-line-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary, #8b5cf6)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-primary, #8b5cf6)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines + Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = chartHeight * (1 - ratio) + PADDING_TOP
          const weightVal = Math.round(minWeight + weightRange * ratio)
          return (
            <g key={idx}>
              <line
                x1={PADDING_LEFT}
                y1={y}
                x2={SVG_WIDTH - PADDING_RIGHT}
                y2={y}
                className="stroke-border"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={PADDING_LEFT - 8}
                y={y + 4}
                className="text-[10px] fill-muted-foreground text-right"
                textAnchor="end"
              >
                {weightVal} kg
              </text>
            </g>
          )
        })}

        {/* Filled area under line */}
        {points.length > 1 ? (
          <path
            d={`${pathData} L ${svgPoints[svgPoints.length - 1].x} ${
              chartHeight + PADDING_TOP
            } L ${svgPoints[0].x} ${chartHeight + PADDING_TOP} Z`}
            fill="url(#gym-line-grad)"
          />
        ) : null}

        {/* Line path */}
        <path
          d={pathData || `M ${PADDING_LEFT} ${chartHeight + PADDING_TOP}`}
          fill="none"
          className="stroke-violet-500"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points + tooltips + X labels */}
        {svgPoints.map((pt, idx) => {
          const dateObj = new Date(pt.data.date)
          const dateStr = formatDateToDisplay(dateObj)
          return (
            <g key={idx} className="group cursor-pointer">
              {/* Glow on hover */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="8"
                className="fill-violet-500/0 group-hover:fill-violet-500/20 transition-all duration-150"
              />
              {/* Dot */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4"
                className="fill-background stroke-violet-500"
                strokeWidth="2.5"
              />
              {/* Tooltip */}
              <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <rect
                  x={pt.x - 35}
                  y={pt.y - 30}
                  width="70"
                  height="20"
                  rx="4"
                  className="fill-popover stroke-border shadow-sm"
                />
                <text
                  x={pt.x}
                  y={pt.y - 17}
                  textAnchor="middle"
                  className="text-[9px] font-bold fill-foreground"
                >
                  {pt.data.max_weight} kg
                </text>
              </g>
              {/* X labels - thinned out for long series */}
              {points.length <= 10 || idx % Math.ceil(points.length / 7) === 0 ? (
                <g>
                  <text
                    x={pt.x}
                    y={SVG_HEIGHT - 16}
                    textAnchor="middle"
                    className="text-[10px] fill-muted-foreground font-semibold"
                  >
                    {getDayShortName(dateObj)}
                  </text>
                  <text
                    x={pt.x}
                    y={SVG_HEIGHT - 4}
                    textAnchor="middle"
                    className="text-[9px] fill-muted-foreground/60"
                  >
                    {dateStr}
                  </text>
                </g>
              ) : null}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
