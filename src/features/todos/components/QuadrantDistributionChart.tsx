/**
 * Horizontal stacked bars: open vs completed tasks in each Eisenhower quadrant.
 *
 * Bespoke SVG, matching the hand-rolled house style of the Gym charts (no
 * charting library anywhere in this project). Each row is tinted with its
 * quadrant hue so the chart reads as the same object as the matrix above it;
 * the open/completed split is a two-step of that hue, and every segment
 * carries a direct numeric label so identity is never colour-alone.
 *
 * Palette note: the four quadrant hues in `../constants.ts` were validated
 * against both the light (#ffffff) and dark (#193665) card surfaces — the
 * lightness band, chroma floor, CVD separation and contrast all pass.
 */
import type { TodoStats } from "../types"
import { QUADRANTS } from "../constants"

const SVG_WIDTH = 500
const ROW_HEIGHT = 44
const BAR_HEIGHT = 14
const LABEL_WIDTH = 118
const PADDING_RIGHT = 40
const PADDING_TOP = 8
/** Surface-coloured gap between the two stacked segments. */
const SEGMENT_GAP = 2

export function QuadrantDistributionChart({
  stats,
}: {
  stats: TodoStats["quadrant_stats"]
}) {
  const byKey = new Map(stats.map((s) => [s.quadrant, s]))
  const rows = QUADRANTS.map((meta) => {
    const stat = byKey.get(meta.key)
    return {
      meta,
      open: stat?.open_count ?? 0,
      completed: stat?.completed ?? 0,
      total: (stat?.open_count ?? 0) + (stat?.completed ?? 0),
    }
  })

  const maxTotal = Math.max(...rows.map((r) => r.total), 1)
  const chartWidth = SVG_WIDTH - LABEL_WIDTH - PADDING_RIGHT
  const svgHeight = PADDING_TOP * 2 + rows.length * ROW_HEIGHT

  if (rows.every((r) => r.total === 0)) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Chưa có công việc nào để thống kê.
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${svgHeight}`}
          className="w-full min-w-[420px] overflow-visible"
          role="img"
          aria-label="Phân bổ công việc theo bốn góc phần tư Eisenhower"
        >
          {rows.map((row, index) => {
            const y = PADDING_TOP + index * ROW_HEIGHT
            const barY = y + (ROW_HEIGHT - BAR_HEIGHT) / 2
            const scale = chartWidth / maxTotal
            const openWidth = row.open * scale
            const completedWidth = row.completed * scale
            // Nudge the completed segment right so a 2px surface gap shows
            // between the two fills, but only when both are present.
            const completedX =
              LABEL_WIDTH +
              openWidth +
              (row.open > 0 && row.completed > 0 ? SEGMENT_GAP : 0)

            return (
              <g key={row.meta.key}>
                <circle
                  cx={6}
                  cy={barY + BAR_HEIGHT / 2}
                  r={3.5}
                  fill={row.meta.hex}
                />
                <text
                  x={18}
                  y={barY + BAR_HEIGHT / 2 + 4}
                  className="fill-foreground text-[11px] font-medium"
                >
                  {row.meta.label}
                </text>

                {/* Recessive track so an empty quadrant still reads as a row. */}
                <rect
                  x={LABEL_WIDTH}
                  y={barY}
                  width={chartWidth}
                  height={BAR_HEIGHT}
                  rx={4}
                  className="fill-muted"
                />

                {row.open > 0 ? (
                  <rect
                    x={LABEL_WIDTH}
                    y={barY}
                    width={Math.max(openWidth, 3)}
                    height={BAR_HEIGHT}
                    rx={4}
                    fill={row.meta.hex}
                  >
                    <title>{`${row.meta.label} — đang làm: ${row.open}`}</title>
                  </rect>
                ) : null}

                {row.completed > 0 ? (
                  <rect
                    x={completedX}
                    y={barY}
                    width={Math.max(completedWidth - SEGMENT_GAP, 3)}
                    height={BAR_HEIGHT}
                    rx={4}
                    fill={row.meta.hex}
                    opacity={0.35}
                  >
                    <title>{`${row.meta.label} — đã xong: ${row.completed}`}</title>
                  </rect>
                ) : null}

                {/* Direct label: the total for the row, in ink not hue. */}
                <text
                  x={LABEL_WIDTH + chartWidth + 8}
                  y={barY + BAR_HEIGHT / 2 + 4}
                  className="fill-muted-foreground text-[11px]"
                >
                  {row.completed}/{row.total}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="mt-2 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-foreground/70" />
          Đang làm
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-foreground/25" />
          Đã hoàn thành
        </span>
      </div>
    </div>
  )
}
