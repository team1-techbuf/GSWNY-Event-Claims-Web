import { useMemo } from 'react'
import type { JoinedEvent } from '../api'
import { monthlyLeads, seasonSummary, type MonthlyLeadPoint } from '../lib/events'

export function SeasonSummary({ events }: { events: JoinedEvent[] }) {
  const stats = useMemo(() => seasonSummary(events), [events])
  const leads = useMemo(() => monthlyLeads(events), [events])
  const totalEvents = stats.completedCount + stats.remainingCount

  return (
    <section className="season-summary" aria-label="Season summary">
      <div className="season-stats">
        <StatTile
          value={stats.coveragePct === null ? '—' : `${stats.coveragePct}%`}
          label="Open visits covered"
          hint={
            stats.coveragePct === null
              ? 'No open visits yet'
              : `${stats.coveredCount} of ${stats.openCount} staffed`
          }
        />
        <StatTile
          value={String(stats.totalLeadCards)}
          label="Lead cards"
          hint="Collected this season"
        />
        <StatTile
          value={`${stats.completedCount}/${totalEvents}`}
          label="Completed"
          hint={`${stats.remainingCount} still to run`}
        />
      </div>
      <div className="season-chart">
        <p className="season-chart-title">Lead cards by month</p>
        <LeadsChart data={leads} />
      </div>
    </section>
  )
}

function StatTile({ value, label, hint }: { value: string; label: string; hint: string }) {
  return (
    <div className="stat-tile">
      <strong className="stat-value">{value}</strong>
      <span className="stat-label">{label}</span>
      <span className="stat-hint">{hint}</span>
    </div>
  )
}

// Round a value up to a clean axis maximum (1, 2, 2.5, 5, 10 × 10ⁿ) so the
// y-axis top is a tidy number.
function niceMax(value: number): number {
  if (value <= 0) {
    return 1
  }
  const pow = Math.pow(10, Math.floor(Math.log10(value)))
  for (const step of [1, 2, 2.5, 5, 10]) {
    const candidate = step * pow
    if (candidate >= value) {
      return candidate
    }
  }
  return 10 * pow
}

// Compact single-series line chart, drawn as inline SVG (no chart library).
// Months on the x-axis, lead cards on the y-axis. Values are labeled directly
// on each point since a season has only a handful of months, so no legend or
// hover layer is needed — the chart title names the single series.
function LeadsChart({ data }: { data: MonthlyLeadPoint[] }) {
  if (data.length === 0) {
    return (
      <p className="season-chart-empty">
        Lead cards will chart here once events are marked completed.
      </p>
    )
  }

  const W = 328
  const H = 176
  const padL = 26
  const padR = 16
  const padT = 22
  const padB = 28
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  const maxY = niceMax(Math.max(...data.map((point) => point.leads)))
  const baselineY = padT + plotH

  const x = (index: number) =>
    data.length === 1 ? padL + plotW / 2 : padL + (plotW * index) / (data.length - 1)
  const y = (value: number) => padT + plotH * (1 - value / maxY)

  const points = data.map((point, index) => ({
    ...point,
    cx: x(index),
    cy: y(point.leads),
  }))
  const linePath = points.map((point) => `${point.cx},${point.cy}`).join(' ')

  const total = data.reduce((sum, point) => sum + point.leads, 0)
  const trend =
    data.length > 1 && data[data.length - 1].leads > data[0].leads
      ? 'rising'
      : data.length > 1 && data[data.length - 1].leads < data[0].leads
        ? 'falling'
        : 'steady'

  return (
    <svg
      className="leads-chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Lead cards by month, ${total} total across ${data.length} month${
        data.length > 1 ? 's' : ''
      }, trend ${trend}.`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* top gridline + baseline, with y-axis labels */}
      <line className="leads-grid" x1={padL} y1={padT} x2={W - padR} y2={padT} />
      <line className="leads-axis" x1={padL} y1={baselineY} x2={W - padR} y2={baselineY} />
      <text className="leads-axis-label" x={padL - 6} y={padT + 4} textAnchor="end">
        {maxY}
      </text>
      <text className="leads-axis-label" x={padL - 6} y={baselineY + 4} textAnchor="end">
        0
      </text>

      {points.length > 1 && <polyline className="leads-line" points={linePath} />}

      {points.map((point) => (
        <g key={point.key}>
          <circle className="leads-dot" cx={point.cx} cy={point.cy} r={4} />
          <text className="leads-value" x={point.cx} y={point.cy - 10} textAnchor="middle">
            {point.leads}
          </text>
          <text className="leads-month" x={point.cx} y={H - 8} textAnchor="middle">
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
