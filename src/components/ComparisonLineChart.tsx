"use client"

import { useState, useRef } from "react"

export interface ComparisonPoint {
  label: string
  tooltipLabel?: string  // shown in tooltip header; falls back to label
  current: number | null
  previous: number | null
}

interface Props {
  data: ComparisonPoint[]
  currentLabel: string
  previousLabel: string
  viewWidth?: number
  viewHeight?: number
  xInterval?: number  // overrides auto-detection; suppresses force-show-last
}

function buildPath(
  points: Array<{ x: number; y: number } | null>
): string {
  let d = ""
  let penDown = false
  for (const p of points) {
    if (p === null) { penDown = false; continue }
    if (!penDown) { d += `M ${p.x} ${p.y} `; penDown = true }
    else           { d += `L ${p.x} ${p.y} ` }
  }
  return d
}

interface HoverState {
  idx: number
  mouseX: number
  mouseY: number
}

const PAD = { top: 8, right: 12, bottom: 28, left: 52 }

export function ComparisonLineChart({ data, currentLabel, previousLabel, viewWidth = 560, viewHeight = 180, xInterval }: Props) {
  const [hover, setHover] = useState<HoverState | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const CW = viewWidth - PAD.left - PAD.right
  const CH = viewHeight - PAD.top - PAD.bottom

  const maxValue =
    data.reduce((m, d) => Math.max(m, d.current ?? 0, d.previous ?? 0), 0) || 10
  const maxY = maxValue * 1.1

  const xOf = (i: number) =>
    PAD.left + (data.length > 1 ? (i / (data.length - 1)) * CW : CW / 2)
  const yOf = (v: number) => PAD.top + CH - (v / maxY) * CH

  const currentPoints = data.map((d, i) =>
    d.current != null ? { x: xOf(i), y: yOf(d.current) } : null
  )
  const previousPoints = data.map((d, i) =>
    d.previous != null ? { x: xOf(i), y: yOf(d.previous) } : null
  )

  const yTicks = Array.from({ length: 5 }, (_, i) => (maxY / 4) * i)

  const resolvedXInterval = xInterval ?? (
    data.length <= 7  ? 1
    : data.length <= 16 ? 2
    : data.length <= 24 ? 3
    : 7
  )

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = e.clientX - rect.left
    const relY = e.clientY - rect.top
    const svgX = (relX / rect.width) * viewWidth

    if (svgX < PAD.left || svgX > viewWidth - PAD.right) {
      setHover(null)
      return
    }
    const fraction = (svgX - PAD.left) / CW
    const idx = Math.max(0, Math.min(data.length - 1, Math.round(fraction * (data.length - 1))))
    setHover({ idx, mouseX: relX, mouseY: relY })
  }

  const crosshairX = hover !== null ? xOf(hover.idx) : null
  const hoverPoint = hover !== null ? data[hover.idx] : null

  return (
    <div className="w-full relative" ref={containerRef}>
      {/* Legend */}
      <div className="flex gap-5 mb-2 text-xs">
        <div className="flex items-center gap-2">
          <svg width="20" height="10" viewBox="0 0 20 10">
            <line x1="0" y1="5" x2="20" y2="5" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="font-medium">{currentLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="20" height="10" viewBox="0 0 20 10">
            <line x1="0" y1="5" x2="20" y2="5" stroke="#888" strokeWidth="2" strokeDasharray="5 3" />
          </svg>
          <span className="text-muted-foreground">{previousLabel}</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        className="w-full overflow-visible cursor-crosshair"
        style={{ aspectRatio: `${viewWidth} / ${viewHeight}` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
        aria-label="Revenue comparison chart"
      >
        {/* Y gridlines + labels */}
        {yTicks.map((v) => {
          const y = yOf(v)
          const label = v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`
          return (
            <g key={v}>
              <line x1={PAD.left} y1={y} x2={viewWidth - PAD.right} y2={y}
                stroke="#888" strokeOpacity={0.15} strokeWidth={1} />
              <text x={PAD.left - 6} y={y} fontSize={9} fill="#888" textAnchor="end" dominantBaseline="middle">
                {label}
              </text>
            </g>
          )
        })}

        {/* X labels */}
        {data.map((d, i) => {
          const atInterval = i % resolvedXInterval === 0
          const isLast = i === data.length - 1
          if (!atInterval && !(xInterval === undefined && isLast)) return null
          if (!d.label) return null
          return (
            <text key={i} x={xOf(i)} y={viewHeight - PAD.bottom + 12}
              fontSize={9} fill="#888" textAnchor="middle">
              {d.label}
            </text>
          )
        })}

        {/* Crosshair */}
        {crosshairX !== null && (
          <line
            x1={crosshairX} y1={PAD.top}
            x2={crosshairX} y2={PAD.top + CH}
            stroke="#888" strokeOpacity={0.4} strokeWidth={1} strokeDasharray="3 3"
          />
        )}

        {/* Previous line (dashed gray) */}
        <path
          d={buildPath(previousPoints)}
          fill="none" stroke="#888" strokeWidth={2}
          strokeDasharray="6 4" strokeLinecap="round" strokeLinejoin="round"
        />

        {/* Current line (solid green) */}
        <path
          d={buildPath(currentPoints)}
          fill="none" stroke="#22c55e" strokeWidth={2.5}
          strokeLinecap="round" strokeLinejoin="round"
        />

        {/* Hover dots */}
        {hover !== null && hoverPoint !== null && (() => {
          const cx = xOf(hover.idx)
          return (
            <>
              {hoverPoint.current != null && (
                <circle cx={cx} cy={yOf(hoverPoint.current)} r={4}
                  fill="#22c55e" stroke="white" strokeWidth={1.5} />
              )}
              {hoverPoint.previous != null && (
                <circle cx={cx} cy={yOf(hoverPoint.previous)} r={4}
                  fill="#888" stroke="white" strokeWidth={1.5} />
              )}
            </>
          )
        })()}

        {/* Default endpoint dot (current line) when not hovering */}
        {hover === null && (() => {
          const last = [...currentPoints].reverse().find((p) => p !== null)
          return last ? (
            <circle cx={last.x} cy={last.y} r={4}
              fill="#22c55e" stroke="white" strokeWidth={2} />
          ) : null
        })()}
      </svg>

      {/* Tooltip */}
      {hover !== null && hoverPoint !== null && (() => {
        const containerWidth = containerRef.current?.offsetWidth ?? 500
        const tooltipWidth = 172
        const flipLeft = hover.mouseX + tooltipWidth + 16 > containerWidth
        const left = flipLeft ? hover.mouseX - tooltipWidth - 12 : hover.mouseX + 12
        const top = Math.max(0, hover.mouseY - 56)
        const hasAny = hoverPoint.current != null || hoverPoint.previous != null

        return hasAny ? (
          <div
            className="absolute z-10 pointer-events-none rounded-lg border bg-background shadow-lg px-3 py-2 text-xs"
            style={{ left, top, width: tooltipWidth }}
          >
            <p className="font-semibold mb-1.5 text-foreground">{data[hover.idx].tooltipLabel ?? data[hover.idx].label}</p>
            {hoverPoint.current != null && (
              <div className="flex items-center justify-between gap-3 py-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-0.5 bg-green-500 rounded-full" />
                  <span className="text-muted-foreground">{currentLabel}</span>
                </div>
                <span className="font-mono font-medium">${hoverPoint.current.toFixed(2)}</span>
              </div>
            )}
            {hoverPoint.previous != null && (
              <div className="flex items-center justify-between gap-3 py-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-0.5 bg-[#888] rounded-full" />
                  <span className="text-muted-foreground">{previousLabel}</span>
                </div>
                <span className="font-mono font-medium">${hoverPoint.previous.toFixed(2)}</span>
              </div>
            )}
          </div>
        ) : null
      })()}
    </div>
  )
}
