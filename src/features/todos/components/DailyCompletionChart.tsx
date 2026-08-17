/**
 * Bar chart: tasks completed on each of the last 7 days.
 *
 * Single series, so no legend box — the card title names it. Bespoke SVG in
 * the same house style as `features/gym/components/WeeklyVolumeChart.tsx`:
 * dashed grid, soft bars, day labels, native `<title>` tooltips.
 *
 * The bar hue (#059669, emerald-600) clears 3:1 against both the light
 * (#ffffff) and dark (#193665) card surfaces, so one value serves both themes.
 */
import type { TodoStats } from "../types"
import { formatShortDate, getDayShortName } from "../utils/dates"

const SVG_WIDTH = 500
const SVG_HEIGHT = 200
const PADDING_LEFT = 32
const PADDING_RIGHT = 12
const PADDING_TOP = 20
const PADDING_BOTTOM = 28
const BAR_COLOR = "#059669"

export function DailyCompletionChart({
  data,
}: {
  data: TodoStats["daily_completion"]
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Chưa có dữ liệu thống kê.
      </div>
    )
  }

  // Keep at least 4 gridline steps so a quiet week does not render a single
  // giant bar for a value of 1.
  const maxCount = Math.max(...data.map((d) => d.completed_count), 4)
  const chartWidth = SVG_WIDTH - PADDING_LEFT - PADDING_RIGHT
  const chartHeight = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM
  const colWidth = chartWidth / data.length
  const barWidth = Math.min(colWidth * 0.5, 28)

  const gridSteps = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full min-w-[420px] overflow-visible"
        role="img"
        aria-label="Số công việc hoàn thành trong 7 ngày gần nhất"
      >
        {gridSteps.map((step) => {
          const y = PADDING_TOP + chartHeight * (1 - step)
          return (
            <g key={step}>
              <line
                x1={PADDING_LEFT}
                y1={y}
                x2={SVG_WIDTH - PADDING_RIGHT}
                y2={y}
                className="stroke-border"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <text
                x={PADDING_LEFT - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-muted-foreground text-[10px]"
              >
                {Math.round(maxCount * step)}
              </text>
            </g>
          )
        })}

        {data.map((point, index) => {
          const x = PADDING_LEFT + colWidth * index + (colWidth - barWidth) / 2
          const barHeight =
            point.completed_count > 0
              ? Math.max((point.completed_count / maxCount) * chartHeight, 3)
              : 0
          const y = PADDING_TOP + chartHeight - barHeight

          return (
            <g key={point.date}>
              {barHeight > 0 ? (
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={4}
                  fill={BAR_COLOR}
                >
                  <title>
                    {`${formatShortDate(point.date)} — hoàn thành ${point.completed_count}, tạo mới ${point.created_count}`}
                  </title>
                </rect>
              ) : null}

              {/* Selective direct label: only where there is something to say. */}
              {point.completed_count > 0 ? (
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  className="fill-foreground text-[10px] font-medium"
                >
                  {point.completed_count}
                </text>
              ) : null}

              <text
                x={x + barWidth / 2}
                y={SVG_HEIGHT - PADDING_BOTTOM + 15}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {getDayShortName(point.date)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
