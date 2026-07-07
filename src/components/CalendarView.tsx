import { useMemo, useRef, useState } from 'react'
import type { JoinedEvent, SlotType, UserRole } from '../api'
import {
  WEEKDAY_LABELS,
  addDaysISO,
  addMonths,
  dayNumber,
  formatLongDate,
  formatMonthYear,
  formatWeekRange,
  isInMonth,
  monthGrid,
  monthOf,
  parseTimeDecimal,
  partsToISO,
  startOfWeekISO,
  todayISO,
  weekDays,
} from '../lib/calendar'
import { coverageColor, coverageUrgency } from '../lib/events'
import { EventCard } from './EventCard'
import { ArrowRightIcon, PlusIcon } from './Icons'

type Mode = 'month' | 'week'

interface CalendarViewProps {
  events: JoinedEvent[]
  role: UserRole
  email: string
  busy: boolean
  canManage: boolean
  onClaim: (eventId: string, slot: SlotType) => void
  onDrop: (eventId: string, slot: SlotType) => void
  onEditEvent: (eventId: string) => void
  onAddEventOnDate: (dateISO: string) => void
}

// Week grid vertical span.
const DAY_START = 7 // 7am
const DAY_END = 21 // 9pm
const HOUR_H = 46 // px per hour

export function CalendarView({
  events,
  role,
  email,
  busy,
  canManage,
  onClaim,
  onDrop,
  onEditEvent,
  onAddEventOnDate,
}: CalendarViewProps) {
  const [mode, setMode] = useState<Mode>('month')
  const [anchor, setAnchor] = useState<string>(() => todayISO())
  const [selected, setSelected] = useState<{ dateISO: string; eventId: string | null } | null>(null)

  const byDate = useMemo(() => {
    const map = new Map<string, JoinedEvent[]>()
    for (const event of events) {
      const list = map.get(event.eventDate) ?? []
      list.push(event)
      map.set(event.eventDate, list)
    }
    // Order each day's events by start time for consistent stacking.
    for (const list of map.values()) {
      list.sort((a, b) => (parseTimeDecimal(a.startTime) ?? 0) - (parseTimeDecimal(b.startTime) ?? 0))
    }
    return map
  }, [events])

  const { year, month } = monthOf(anchor)
  const weekStart = startOfWeekISO(anchor)
  const today = todayISO()

  function step(direction: number) {
    setSelected(null)
    if (mode === 'month') {
      const next = addMonths(year, month, direction)
      setAnchor(partsToISO(next.year, next.month, 1))
    } else {
      setAnchor(addDaysISO(weekStart, direction * 7))
    }
  }

  const touch = useRef<{ x: number; y: number } | null>(null)
  function onTouchStart(event: React.TouchEvent) {
    const point = event.touches[0]
    touch.current = { x: point.clientX, y: point.clientY }
  }
  function onTouchEnd(event: React.TouchEvent) {
    if (!touch.current) {
      return
    }
    const point = event.changedTouches[0]
    const dx = point.clientX - touch.current.x
    const dy = point.clientY - touch.current.y
    touch.current = null
    // Horizontal swipe (ignore mostly-vertical gestures / scrolls).
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      step(dx < 0 ? 1 : -1)
    }
  }

  return (
    <div className="calendar-view">
      <div className="cal-header">
        <div className="cal-mode-switch" role="tablist" aria-label="Calendar mode">
          <button
            type="button"
            className={mode === 'month' ? 'view-seg active' : 'view-seg'}
            onClick={() => {
              setMode('month')
              setSelected(null)
            }}
          >
            Month
          </button>
          <button
            type="button"
            className={mode === 'week' ? 'view-seg active' : 'view-seg'}
            onClick={() => {
              setMode('week')
              setSelected(null)
            }}
          >
            Week
          </button>
        </div>
        <div className="cal-nav">
          <button type="button" className="cal-arrow" onClick={() => step(-1)} aria-label="Previous">
            <ArrowRightIcon />
          </button>
          <span className="cal-title">
            {mode === 'month' ? formatMonthYear(year, month) : formatWeekRange(weekStart)}
          </span>
          <button type="button" className="cal-arrow next" onClick={() => step(1)} aria-label="Next">
            <ArrowRightIcon />
          </button>
        </div>
      </div>

      <div className="cal-body" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {mode === 'month' ? (
          <MonthGrid
            year={year}
            month={month}
            today={today}
            byDate={byDate}
            selectedDate={selected?.dateISO ?? null}
            onSelectDay={(dateISO) => setSelected({ dateISO, eventId: null })}
          />
        ) : (
          <WeekGrid
            weekStart={weekStart}
            today={today}
            byDate={byDate}
            onSelectEvent={(event) => setSelected({ dateISO: event.eventDate, eventId: event.eventId })}
          />
        )}
      </div>

      {selected && (
        <DetailSheet
          dateISO={selected.dateISO}
          events={
            selected.eventId
              ? events.filter((event) => event.eventId === selected.eventId)
              : byDate.get(selected.dateISO) ?? []
          }
          role={role}
          email={email}
          busy={busy}
          canManage={canManage}
          onClaim={onClaim}
          onDrop={onDrop}
          onEditEvent={onEditEvent}
          onAddEventOnDate={onAddEventOnDate}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

interface MonthGridProps {
  year: number
  month: number
  today: string
  byDate: Map<string, JoinedEvent[]>
  selectedDate: string | null
  onSelectDay: (dateISO: string) => void
}

function MonthGrid({ year, month, today, byDate, selectedDate, onSelectDay }: MonthGridProps) {
  const cells = monthGrid(year, month)
  return (
    <div className="cal-month">
      <div className="cal-weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="cal-month-grid">
        {cells.map((iso) => {
          const dayEvents = byDate.get(iso) ?? []
          const inMonth = isInMonth(iso, year, month)
          const dotColor =
            dayEvents.length > 0
              ? coverageColor(
                  dayEvents.reduce((a, b) =>
                    coverageUrgency(b.availability.coverageStatus) > coverageUrgency(a.availability.coverageStatus)
                      ? b
                      : a,
                  ).availability.coverageStatus,
                )
              : null
          const classes = [
            'cal-cell',
            inMonth ? '' : 'muted',
            iso === today ? 'today' : '',
            iso === selectedDate ? 'selected' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <button key={iso} type="button" className={classes} onClick={() => onSelectDay(iso)}>
              <span className="cal-daynum">{dayNumber(iso)}</span>
              {dotColor && (
                <span
                  className={dayEvents.length > 1 ? 'cal-dot multi' : 'cal-dot'}
                  style={{ backgroundColor: dotColor }}
                  aria-hidden="true"
                >
                  {dayEvents.length > 1 && <span className="cal-dot-count">{dayEvents.length}</span>}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface WeekGridProps {
  weekStart: string
  today: string
  byDate: Map<string, JoinedEvent[]>
  onSelectEvent: (event: JoinedEvent) => void
}

function WeekGrid({ weekStart, today, byDate, onSelectEvent }: WeekGridProps) {
  const days = weekDays(weekStart)
  const hours = Array.from({ length: DAY_END - DAY_START + 1 }, (_, index) => DAY_START + index)
  const canvasHeight = (DAY_END - DAY_START) * HOUR_H

  return (
    <div className="week-grid">
      <div className="week-head">
        <span className="week-gutter-head" />
        {days.map((iso, index) => (
          <span key={iso} className={iso === today ? 'week-day-head today' : 'week-day-head'}>
            <em>{WEEKDAY_LABELS[index]}</em>
            <strong>{dayNumber(iso)}</strong>
          </span>
        ))}
      </div>
      <div className="week-body">
        <div
          className="week-canvas"
          style={{ height: canvasHeight, ['--hour-h' as string]: `${HOUR_H}px` }}
        >
          <div className="week-times">
            {hours.map((hour) => (
              <span key={hour} className="week-time" style={{ top: (hour - DAY_START) * HOUR_H }}>
                {formatHour(hour)}
              </span>
            ))}
          </div>
          {days.map((iso) => {
            const dayEvents = byDate.get(iso) ?? []
            const lanes = dayEvents.length
            return (
              <div key={iso} className="week-col">
                {dayEvents.map((event, index) => {
                  const box = eventBox(event)
                  const width = 100 / lanes
                  return (
                    <button
                      key={event.eventId}
                      type="button"
                      className="week-event"
                      style={{
                        top: box.top,
                        height: box.height,
                        left: `${index * width}%`,
                        width: `calc(${width}% - 2px)`,
                        backgroundColor: coverageColor(event.availability.coverageStatus),
                      }}
                      onClick={() => onSelectEvent(event)}
                    >
                      <span className="week-event-title">
                        {event.school?.schoolName ?? event.eventType}
                      </span>
                      <span className="week-event-loc">
                        {event.school?.cityTown ?? event.eventType}
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface DetailSheetProps {
  dateISO: string
  events: JoinedEvent[]
  role: UserRole
  email: string
  busy: boolean
  canManage: boolean
  onClaim: (eventId: string, slot: SlotType) => void
  onDrop: (eventId: string, slot: SlotType) => void
  onEditEvent: (eventId: string) => void
  onAddEventOnDate: (dateISO: string) => void
  onClose: () => void
}

function DetailSheet({
  dateISO,
  events,
  role,
  email,
  busy,
  canManage,
  onClaim,
  onDrop,
  onEditEvent,
  onAddEventOnDate,
  onClose,
}: DetailSheetProps) {
  return (
    <>
      <div className="cal-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="cal-sheet" role="dialog" aria-label={`Events on ${formatLongDate(dateISO)}`}>
        <div className="cal-sheet-head">
          <h2>{formatLongDate(dateISO)}</h2>
          <button type="button" className="cal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="cal-sheet-body">
          {events.length === 0 ? (
            <p className="empty-state">No events on this day.</p>
          ) : (
            events.map((event) => (
              <EventCard
                key={event.eventId}
                event={event}
                role={role}
                email={email}
                busy={busy}
                onClaim={(slot) => onClaim(event.eventId, slot)}
                onDrop={(slot) => onDrop(event.eventId, slot)}
                onEdit={canManage ? () => onEditEvent(event.eventId) : undefined}
              />
            ))
          )}
        </div>
        {canManage && (
          <button
            type="button"
            className="primary-button full-button cal-add"
            onClick={() => {
              onAddEventOnDate(dateISO)
              onClose()
            }}
          >
            <PlusIcon /> Add event on this day
          </button>
        )}
      </div>
    </>
  )
}

function eventBox(event: JoinedEvent): { top: number; height: number } {
  const rawStart = parseTimeDecimal(event.startTime) ?? DAY_START
  const rawEnd = parseTimeDecimal(event.endTime) ?? rawStart + 1
  const start = Math.min(Math.max(rawStart, DAY_START), DAY_END)
  const end = Math.min(Math.max(rawEnd, start + 0.5), DAY_END)
  return {
    top: (start - DAY_START) * HOUR_H,
    height: Math.max((end - start) * HOUR_H, 24),
  }
}

function formatHour(hour: number): string {
  const meridiem = hour >= 12 ? 'p' : 'a'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}${meridiem}`
}
