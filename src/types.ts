// Bottom-nav tabs available in the authenticated app.
export type Tab = 'events' | 'staff' | 'me'

// Views layered on top of the tabs (full-screen forms).
export type Overlay =
  | { kind: 'none' }
  | { kind: 'event-form'; eventId: string | null }
