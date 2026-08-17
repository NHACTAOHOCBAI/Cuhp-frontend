/**
 * Bar chart for "Khối lượng tập luyện 7 ngày qua".
 *
 * Bespoke SVG (no charting lib used elsewhere in the project). Renders a
 * dashed grid, soft-tinted bars, hover highlights, day labels and volume
 * tooltips on each bar.
 */
import type { DailyVolume } from "@/types"
import { formatDateToDisplay, getDayShortName } from "../utils/dates"

const SVG_WIDTH = 500
const SVG_HEIGHT = 220
const PADDING_LEFT = 45
const PADDING_RIGHT = 15
const PADDING_TOP = 25
const PADDING_BOTTOM = 30

export function WeeklyVolumeChart({ data }: { data: DailyVolume[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground text-sm">
        Chưa có dữ liệu thống kê.
      </div>
    )
  }

  const maxVolume = Math.max(...data.map((d) => d.volume), 100)

  const chartWidth = SVG_WIDTH - PADDING_LEFT - PADDING_RIGHT
  const chartHeight = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM
  const colWidth = chartWidth / 7
  const barWidth = Math.min(colWidth * 0.6, 32)

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full min-w-[450px] overflow-visible"
      >
        {/* Grid lines + Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = chartHeight * (1 - ratio) + PADDING_TOP
          const labelValue = Math.round(maxVolume * ratio)
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
                {labelValue} kg
              </text>
            </g>
          )
        })}

        {/* Bars + X-axis labels */}
        {data.map((item, idx) => {
          const x = PADDING_LEFT + idx * colWidth + (colWidth - barWidth) / 2
          const barHeight = (item.volume / maxVolume) * chartHeight
          const y = chartHeight - barHeight + PADDING_TOP
          const dateObj = new Date(item.date)
          const dateStr = formatDateToDisplay(dateObj)
          const labelStr = getDayShortName(dateObj)

          return (
            <g key={idx} className="group cursor-pointer">
              {/* Hover highlight */}
              <rect
                x={PADDING_LEFT + idx * colWidth}
                y={PADDING_TOP}
                width={colWidth}
                height={chartHeight}
                className="fill-transparent group-hover:fill-primary/5 transition-colors duration-150"
                rx="6"
              />
              {/* Real bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 4)}
                className="fill-primary transition-all duration-300 group-hover:fill-primary/80"
                rx="4"
              />
              {/* Value tooltip above bar */}
              {item.volume > 0 ? (
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  className="text-[10px] font-bold fill-primary opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {item.volume}
                </text>
              ) : null}
              <text
                x={PADDING_LEFT + idx * colWidth + colWidth / 2}
                y={SVG_HEIGHT - 16}
                textAnchor="middle"
                className="text-[10px] fill-muted-foreground font-semibold"
              >
                {labelStr}
              </text>
              <text
                x={PADDING_LEFT + idx * colWidth + colWidth / 2}
                y={SVG_HEIGHT - 4}
                textAnchor="middle"
                className="text-[9px] fill-muted-foreground/60"
              >
                {dateStr}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
