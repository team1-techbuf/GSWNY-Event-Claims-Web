interface IconProps {
  className?: string
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 54" aria-hidden="true">
      <rect x="3" y="7" width="48" height="42" rx="6" fill="#f6fff2" />
      <path d="M3 14a7 7 0 0 1 7-7h34a7 7 0 0 1 7 7v10H3z" fill="#00b455" />
      <g fill="#657265">
        <rect x="13" y="0" width="5" height="16" rx="2.5" />
        <rect x="27" y="0" width="5" height="16" rx="2.5" />
        <rect x="41" y="0" width="5" height="16" rx="2.5" />
      </g>
      <g fill="#b8eaa6">
        <rect x="13" y="29" width="9" height="8" rx="1.5" />
        <rect x="28" y="29" width="9" height="8" rx="1.5" />
        <rect x="13" y="40" width="9" height="8" rx="1.5" />
        <rect x="28" y="40" width="9" height="8" rx="1.5" />
      </g>
      <circle cx="48" cy="39" r="11" fill="#00b455" />
      <path
        d="m41.5 38.6 5.2 5.3 9.6-13.1"
        fill="none"
        stroke="#00773a"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="6"
      />
    </svg>
  )
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden="true">
      <path
        d="M4 14h18M14 6l8 8-8 8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </svg>
  )
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden="true">
      <path
        d="M14 3.2c3.3 2.4 6.1 2.5 9 2.5v7c0 5.6-3.6 9.4-9 12.1-5.4-2.7-9-6.5-9-12.1v-7c2.9 0 5.7-.1 9-2.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

export function CalendarLineIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden="true">
      <rect x="4" y="6" width="20" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M4 11h20M9 3v6M19 3v6" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  )
}

export function PersonIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="8.5" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M5.5 25v-3.2c0-5 3.8-8.4 8.5-8.4s8.5 3.4 8.5 8.4V25" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  )
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="12.5" cy="12.5" r="8.5" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="m19 19 5 5" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
    </svg>
  )
}

export function LocationIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 22s7-7.1 7-13A7 7 0 0 0 5 9c0 5.9 7 13 7 13Z"
        fill="currentColor"
      />
      <circle cx="12" cy="9" r="2.8" fill="#fffaf0" />
    </svg>
  )
}

export function ListIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 36 28" aria-hidden="true">
      <g fill="currentColor">
        <circle cx="5" cy="6" r="2" />
        <circle cx="5" cy="14" r="2" />
        <circle cx="5" cy="22" r="2" />
      </g>
      <path d="M12 6h20M12 14h20M12 22h20" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  )
}
