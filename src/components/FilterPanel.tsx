import {
  STATUS_OPTIONS,
  TIME_BLOCKS,
  activeFilterCount,
  emptyFilters,
  type EventFilters,
} from '../lib/events'

interface FilterPanelProps {
  filters: EventFilters
  onChange: (filters: EventFilters) => void
  onClose: () => void
}

export function FilterPanel({ filters, onChange, onClose }: FilterPanelProps) {
  function update<K extends keyof EventFilters>(key: K, value: EventFilters[K]) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="filter-panel" role="dialog" aria-label="Filter events">
      <div className="filter-panel-head">
        <h2>Filters</h2>
        <button type="button" className="text-link" onClick={() => onChange(emptyFilters)}>
          Clear all
        </button>
      </div>

      <label className="filter-field">
        <span>Status</span>
        <select value={filters.status} onChange={(event) => update('status', event.target.value)}>
          <option value="">Any status</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </label>

      <label className="filter-field">
        <span>Zip Code</span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="e.g. 14770"
          value={filters.zipCode}
          onChange={(event) => update('zipCode', event.target.value)}
        />
      </label>

      <label className="filter-field">
        <span>Service Unit</span>
        <input
          type="text"
          placeholder="e.g. 101"
          value={filters.serviceUnit}
          onChange={(event) => update('serviceUnit', event.target.value)}
        />
      </label>

      <label className="filter-field">
        <span>Date</span>
        <input
          type="date"
          value={filters.date}
          onChange={(event) => update('date', event.target.value)}
        />
      </label>

      <div className="filter-field">
        <span>Time of Day</span>
        <div className="chip-row">
          <button
            type="button"
            className={filters.timeBlock === '' ? 'chip active' : 'chip'}
            onClick={() => update('timeBlock', '')}
          >
            Any
          </button>
          {TIME_BLOCKS.map((block) => (
            <button
              key={block.id}
              type="button"
              className={filters.timeBlock === block.id ? 'chip active' : 'chip'}
              onClick={() => update('timeBlock', block.id)}
            >
              {block.label}
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="primary-button full-button" onClick={onClose}>
        Show results{activeFilterCount(filters) ? ` (${activeFilterCount(filters)} filters)` : ''}
      </button>
    </div>
  )
}
