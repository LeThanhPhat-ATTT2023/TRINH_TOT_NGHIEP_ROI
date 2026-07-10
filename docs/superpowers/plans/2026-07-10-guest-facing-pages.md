# Guest-Facing Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the two public-facing routes from the design spec — `/` (`PublicInvite`, event info + name search) and `/thiep/:guestId` (`GuestInvite`, personalized invite + RSVP) — completing the guest-facing half of the graduation invitation site. The Admin section (login, guest CRUD, event settings) is already implemented and fully tested.

**Architecture:** Same single Vite + React + TypeScript SPA, calling `supabase-js` directly from the frontend. `submit_rsvp` RPC and the `guests` / `event_settings` / `gallery_photos` tables already exist in `supabase/migrations/0001_init.sql` with public-read RLS policies, so no schema changes are needed. Fuzzy name search runs client-side with Fuse.js over a lightweight guest list (id/name/salutation only), normalized to be diacritic-insensitive so Vietnamese names match without accents.

**Tech Stack:** React 18 (already React 19 in this project), Vite, TypeScript, React Router, `@supabase/supabase-js`, Fuse.js (new dependency), Vitest + React Testing Library.

---

## Spec reference

This plan implements the "Luồng trang mời chung (`/`)" and "Luồng trang thiệp riêng (`/thiep/:guestId`)" sections of `docs/superpowers/specs/2026-07-10-graduation-invitation-website-design.md`. It replaces `src/pages/PlaceholderHome.tsx` and wires the two new routes into `src/App.tsx` alongside the existing `/admin/*` routes. A generic 404 page is added per the spec's "Route lạ → trang 404 chung" requirement.

## File Structure

```
src/
  lib/
    textSearch.ts                  # normalizeVietnamese() — new
    textSearch.test.ts             # new
  hooks/
    useGuestSearch.ts              # new — loads guest list, fuzzy search
    useGuestSearch.test.ts         # new
  components/
    CountdownTimer.tsx             # new
    CountdownTimer.css             # new
    CountdownTimer.test.tsx        # new
    MapEmbed.tsx                   # new
    MapEmbed.test.tsx              # new
    GalleryGrid.tsx                # new
    GalleryGrid.css                # new
    GalleryGrid.test.tsx           # new
    NameSearchBox.tsx              # new
    NameSearchBox.css              # new
    NameSearchBox.test.tsx         # new
    InviteFrame.tsx                # new — SVG/CSS scalloped border frame
    InviteFrame.css                # new
    InviteFrame.test.tsx           # new
    RsvpButtons.tsx                # new
    RsvpButtons.css                # new
    RsvpButtons.test.tsx           # new
  pages/
    PublicInvite.tsx               # new — replaces PlaceholderHome.tsx
    PublicInvite.css               # new
    PublicInvite.test.tsx          # new
    GuestInvite.tsx                # new
    GuestInvite.css                # new
    GuestInvite.test.tsx           # new
    NotFound.tsx                   # new
    NotFound.test.tsx              # new
    PlaceholderHome.tsx            # deleted
  styles/
    public-shared.css              # new — shared loading/error/retry styles
  App.tsx                          # modified — new routes
```

---

### Task 1: Install Fuse.js dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
npm install fuse.js
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add fuse.js for fuzzy guest name search"
```

---

### Task 2: Vietnamese text normalization helper (TDD)

**Files:**
- Create: `src/lib/textSearch.ts`
- Test: `src/lib/textSearch.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/textSearch.test.ts
import { describe, expect, it } from 'vitest'
import { normalizeVietnamese } from './textSearch'

describe('normalizeVietnamese', () => {
  it('strips diacritics and lowercases', () => {
    expect(normalizeVietnamese('Nguyễn Văn A')).toBe('nguyen van a')
  })

  it('handles đ/Đ specially since Unicode NFD does not decompose it', () => {
    expect(normalizeVietnamese('Đặng Thị Đào')).toBe('dang thi dao')
  })

  it('trims surrounding whitespace', () => {
    expect(normalizeVietnamese('  Trần Thị B  ')).toBe('tran thi b')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/lib/textSearch.test.ts
```

Expected: FAIL — `Cannot find module './textSearch'`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/textSearch.ts
export function normalizeVietnamese(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/lib/textSearch.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/textSearch.ts src/lib/textSearch.test.ts
git commit -m "feat: add Vietnamese diacritic-insensitive text normalization"
```

---

### Task 3: `CountdownTimer` component (TDD)

**Files:**
- Create: `src/components/CountdownTimer.tsx`
- Create: `src/components/CountdownTimer.css`
- Test: `src/components/CountdownTimer.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/CountdownTimer.test.tsx
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CountdownTimer, getTimeRemaining } from './CountdownTimer'

describe('getTimeRemaining', () => {
  it('returns days/hours/minutes/seconds remaining until the target', () => {
    const now = new Date('2026-08-10T00:00:00Z')
    const target = new Date('2026-08-12T03:04:05Z')
    expect(getTimeRemaining(target, now)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 })
  })

  it('returns null when the target is in the past', () => {
    const now = new Date('2026-08-12T00:00:00Z')
    const target = new Date('2026-08-10T00:00:00Z')
    expect(getTimeRemaining(target, now)).toBeNull()
  })
})

describe('CountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-10T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the remaining time units', () => {
    render(<CountdownTimer eventDatetime="2026-08-12T03:04:05Z" />)
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Ngày')).toBeInTheDocument()
  })

  it('shows an ended message when the event has passed', () => {
    render(<CountdownTimer eventDatetime="2026-08-01T00:00:00Z" />)
    expect(screen.getByText('Sự kiện đã diễn ra')).toBeInTheDocument()
  })

  it('renders nothing when there is no event date', () => {
    const { container } = render(<CountdownTimer eventDatetime={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/components/CountdownTimer.test.tsx
```

Expected: FAIL — `Cannot find module './CountdownTimer'`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/components/CountdownTimer.tsx
import { useEffect, useState } from 'react'
import './CountdownTimer.css'

export interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function getTimeRemaining(target: Date, now: Date): TimeRemaining | null {
  const diffMs = target.getTime() - now.getTime()
  if (diffMs <= 0) return null

  const totalSeconds = Math.floor(diffMs / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

export function CountdownTimer({ eventDatetime }: { eventDatetime: string | null }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!eventDatetime) return null

  const remaining = getTimeRemaining(new Date(eventDatetime), now)

  if (!remaining) {
    return <p className="countdown-ended">Sự kiện đã diễn ra</p>
  }

  const units: Array<[number, string]> = [
    [remaining.days, 'Ngày'],
    [remaining.hours, 'Giờ'],
    [remaining.minutes, 'Phút'],
    [remaining.seconds, 'Giây'],
  ]

  return (
    <div className="countdown-timer">
      {units.map(([value, label]) => (
        <div className="countdown-unit" key={label}>
          <span className="countdown-value">{value}</span>
          <span className="countdown-label">{label}</span>
        </div>
      ))}
    </div>
  )
}
```

```css
/* src/components/CountdownTimer.css */
.countdown-timer {
  display: flex;
  gap: var(--space-6);
  justify-content: center;
  margin: var(--space-6) 0;
}

.countdown-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 3.5rem;
}

.countdown-value {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1;
}

.countdown-label {
  font-size: 0.75rem;
  color: var(--color-foreground);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: var(--space-2);
}

.countdown-ended {
  text-align: center;
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: var(--color-accent);
  margin: var(--space-6) 0;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/components/CountdownTimer.test.tsx
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/CountdownTimer.tsx src/components/CountdownTimer.css src/components/CountdownTimer.test.tsx
git commit -m "feat: add CountdownTimer component"
```

---

### Task 4: `MapEmbed` component (TDD)

**Files:**
- Create: `src/components/MapEmbed.tsx`
- Test: `src/components/MapEmbed.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/MapEmbed.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MapEmbed } from './MapEmbed'

describe('MapEmbed', () => {
  it('renders an iframe with the given url', () => {
    render(<MapEmbed mapEmbedUrl="https://maps.google.com/embed" />)
    expect(screen.getByTitle('Bản đồ vị trí sự kiện')).toHaveAttribute(
      'src',
      'https://maps.google.com/embed'
    )
  })

  it('renders nothing when there is no url', () => {
    const { container } = render(<MapEmbed mapEmbedUrl={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/components/MapEmbed.test.tsx
```

Expected: FAIL — `Cannot find module './MapEmbed'`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/components/MapEmbed.tsx
export function MapEmbed({ mapEmbedUrl }: { mapEmbedUrl: string | null }) {
  if (!mapEmbedUrl) return null

  return (
    <iframe
      className="map-embed"
      src={mapEmbedUrl}
      title="Bản đồ vị trí sự kiện"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/components/MapEmbed.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/MapEmbed.tsx src/components/MapEmbed.test.tsx
git commit -m "feat: add MapEmbed component"
```

---

### Task 5: `GalleryGrid` component (TDD)

**Files:**
- Create: `src/components/GalleryGrid.tsx`
- Create: `src/components/GalleryGrid.css`
- Test: `src/components/GalleryGrid.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/GalleryGrid.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GalleryGrid } from './GalleryGrid'
import type { GalleryPhoto } from '../types/database'

const photos: GalleryPhoto[] = [
  {
    id: '1',
    image_url: 'https://example.com/a.jpg',
    caption: 'Ảnh 1',
    sort_order: 0,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    image_url: 'https://example.com/b.jpg',
    caption: null,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
  },
]

describe('GalleryGrid', () => {
  it('renders an image per photo', () => {
    render(<GalleryGrid photos={photos} />)
    expect(screen.getByAltText('Ảnh 1')).toHaveAttribute('src', 'https://example.com/a.jpg')
    expect(screen.getAllByRole('img')).toHaveLength(2)
  })

  it('renders nothing when there are no photos', () => {
    const { container } = render(<GalleryGrid photos={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/components/GalleryGrid.test.tsx
```

Expected: FAIL — `Cannot find module './GalleryGrid'`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/components/GalleryGrid.tsx
import type { GalleryPhoto } from '../types/database'
import './GalleryGrid.css'

export function GalleryGrid({ photos }: { photos: GalleryPhoto[] }) {
  if (photos.length === 0) return null

  return (
    <div className="gallery-grid">
      {photos.map((photo) => (
        <img key={photo.id} src={photo.image_url} alt={photo.caption ?? ''} loading="lazy" />
      ))}
    </div>
  )
}
```

```css
/* src/components/GalleryGrid.css */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  margin: var(--space-6) 0;
}

.gallery-grid img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: var(--radius-md);
}

@media (max-width: 640px) {
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/components/GalleryGrid.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/GalleryGrid.tsx src/components/GalleryGrid.css src/components/GalleryGrid.test.tsx
git commit -m "feat: add GalleryGrid component"
```

---

### Task 6: `useGuestSearch` hook (TDD)

**Files:**
- Create: `src/hooks/useGuestSearch.ts`
- Test: `src/hooks/useGuestSearch.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/hooks/useGuestSearch.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createQueryBuilderMock } from '../test/supabaseMock'

vi.mock('../lib/supabaseClient', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabaseClient'
import { useGuestSearch } from './useGuestSearch'

const guests = [
  { id: '1', full_name: 'Nguyễn Văn A', salutation: 'Anh' },
  { id: '2', full_name: 'Trần Thị B', salutation: 'Chị' },
]

describe('useGuestSearch', () => {
  it('loads guests and returns diacritic-insensitive fuzzy matches for a query', async () => {
    const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>
    fromMock.mockReturnValue(createQueryBuilderMock({ data: guests, error: null }))

    const { result } = renderHook(() => useGuestSearch())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.search('Nguyen')).toEqual([guests[0]])
  })

  it('returns an empty array for a blank query', async () => {
    const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>
    fromMock.mockReturnValue(createQueryBuilderMock({ data: guests, error: null }))

    const { result } = renderHook(() => useGuestSearch())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.search('   ')).toEqual([])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/hooks/useGuestSearch.test.ts
```

Expected: FAIL — `Cannot find module './useGuestSearch'`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/hooks/useGuestSearch.ts
import { useEffect, useMemo, useState } from 'react'
import Fuse from 'fuse.js'
import { supabase } from '../lib/supabaseClient'
import { normalizeVietnamese } from '../lib/textSearch'

export interface GuestSummary {
  id: string
  full_name: string
  salutation: string | null
}

interface SearchableGuest extends GuestSummary {
  normalized: string
}

export function useGuestSearch() {
  const [guests, setGuests] = useState<GuestSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('guests').select('id, full_name, salutation')
    if (!error && data) {
      setGuests(data as GuestSummary[])
    }
    setLoading(false)
  }

  const searchable: SearchableGuest[] = useMemo(
    () => guests.map((guest) => ({ ...guest, normalized: normalizeVietnamese(guest.full_name) })),
    [guests]
  )

  const fuse = useMemo(() => new Fuse(searchable, { keys: ['normalized'], threshold: 0.4 }), [searchable])

  function search(query: string): GuestSummary[] {
    if (!query.trim()) return []
    return fuse
      .search(normalizeVietnamese(query))
      .slice(0, 5)
      .map(({ item }) => ({ id: item.id, full_name: item.full_name, salutation: item.salutation }))
  }

  return { search, loading }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/hooks/useGuestSearch.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useGuestSearch.ts src/hooks/useGuestSearch.test.ts
git commit -m "feat: add useGuestSearch hook with fuzzy name matching"
```

---

### Task 7: `NameSearchBox` component (TDD)

**Files:**
- Create: `src/components/NameSearchBox.tsx`
- Create: `src/components/NameSearchBox.css`
- Test: `src/components/NameSearchBox.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/NameSearchBox.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

const navigateMock = vi.fn()

vi.mock('../hooks/useGuestSearch')

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

import { useGuestSearch } from '../hooks/useGuestSearch'
import { NameSearchBox } from './NameSearchBox'

const mockedUseGuestSearch = useGuestSearch as unknown as ReturnType<typeof vi.fn>

describe('NameSearchBox', () => {
  it('shows matching suggestions and navigates to the invite page on click', async () => {
    mockedUseGuestSearch.mockReturnValue({
      search: (query: string) =>
        query === 'Trần' ? [{ id: '2', full_name: 'Trần Thị B', salutation: 'Chị' }] : [],
      loading: false,
    })
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <NameSearchBox />
      </MemoryRouter>
    )

    await user.type(screen.getByPlaceholderText('Nhập tên của bạn...'), 'Trần')
    await user.click(screen.getByRole('button', { name: 'Chị Trần Thị B' }))

    expect(navigateMock).toHaveBeenCalledWith('/thiep/2')
  })

  it('shows a not-found message when nothing matches', async () => {
    mockedUseGuestSearch.mockReturnValue({ search: () => [], loading: false })
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <NameSearchBox />
      </MemoryRouter>
    )

    await user.type(screen.getByPlaceholderText('Nhập tên của bạn...'), 'Không Tồn Tại')

    expect(
      screen.getByText('Không tìm thấy tên, vui lòng kiểm tra lại chính tả.')
    ).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/components/NameSearchBox.test.tsx
```

Expected: FAIL — `Cannot find module './NameSearchBox'`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/components/NameSearchBox.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSearch } from '../hooks/useGuestSearch'
import './NameSearchBox.css'

export function NameSearchBox() {
  const { search } = useGuestSearch()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const results = search(query)
  const showEmptyMessage = query.trim().length > 0 && results.length === 0

  return (
    <div className="name-search-box">
      <input
        className="name-search-input"
        type="text"
        placeholder="Nhập tên của bạn..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {results.length > 0 && (
        <ul className="name-search-results">
          {results.map((guest) => (
            <li key={guest.id}>
              <button type="button" onClick={() => navigate(`/thiep/${guest.id}`)}>
                {guest.salutation ? `${guest.salutation} ` : ''}
                {guest.full_name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {showEmptyMessage && (
        <p className="name-search-empty">Không tìm thấy tên, vui lòng kiểm tra lại chính tả.</p>
      )}
    </div>
  )
}
```

```css
/* src/components/NameSearchBox.css */
.name-search-box {
  max-width: 360px;
  margin: var(--space-6) auto;
  position: relative;
}

.name-search-input {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-family: var(--font-body);
  color: var(--color-foreground);
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-sizing: border-box;
}

.name-search-input:focus-visible {
  outline: none;
  border-color: var(--color-ring);
  box-shadow: 0 0 0 3px rgba(219, 39, 119, 0.25);
}

.name-search-results {
  list-style: none;
  margin: var(--space-2) 0 0;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: #ffffff;
}

.name-search-results button {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.6rem 1rem;
  font-size: 0.95rem;
  font-family: var(--font-body);
  color: var(--color-foreground);
  background: none;
  border: none;
  cursor: pointer;
}

.name-search-results button:hover {
  background: var(--color-muted);
}

.name-search-empty {
  margin-top: var(--space-2);
  font-size: 0.85rem;
  color: var(--color-foreground);
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/components/NameSearchBox.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/NameSearchBox.tsx src/components/NameSearchBox.css src/components/NameSearchBox.test.tsx
git commit -m "feat: add NameSearchBox component"
```

---

### Task 8: `PublicInvite` page (TDD), replacing `PlaceholderHome`

**Files:**
- Create: `src/pages/PublicInvite.tsx`
- Create: `src/pages/PublicInvite.css`
- Create: `src/styles/public-shared.css`
- Test: `src/pages/PublicInvite.test.tsx`
- Delete: `src/pages/PlaceholderHome.tsx`

- [ ] **Step 1: Write the shared public/guest page stylesheet**

```css
/* src/styles/public-shared.css */
.page-loading {
  padding: var(--space-8);
  text-align: center;
  color: var(--color-foreground);
  font-family: var(--font-body);
}

.page-error {
  padding: var(--space-8);
  text-align: center;
  font-family: var(--font-body);
}

.page-error p[role='alert'] {
  color: var(--color-destructive);
  margin-bottom: var(--space-4);
}

.retry-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 1.1rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
}

.retry-button:hover {
  background: #be185d;
}
```

- [ ] **Step 2: Write the failing test**

```typescript
// src/pages/PublicInvite.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createQueryBuilderMock } from '../test/supabaseMock'

vi.mock('../lib/supabaseClient', () => ({
  supabase: { from: vi.fn() },
}))

vi.mock('../components/NameSearchBox', () => ({
  NameSearchBox: () => <div>NameSearchBox stub</div>,
}))

import { supabase } from '../lib/supabaseClient'
import { PublicInvite } from './PublicInvite'

const eventSettings = {
  id: 1,
  event_name: 'Lễ tốt nghiệp',
  event_datetime: '2026-08-15T09:00:00Z',
  venue_name: 'Hội trường A',
  venue_address: '123 Đường ABC',
  map_embed_url: '',
  cover_image_url: 'https://res.cloudinary.com/demo/cover.jpg',
}

describe('PublicInvite', () => {
  it('loads event settings and gallery, then shows them', async () => {
    const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>
    fromMock.mockImplementation((table: string) => {
      if (table === 'event_settings') {
        return createQueryBuilderMock({ data: eventSettings, error: null })
      }
      return createQueryBuilderMock({ data: [], error: null })
    })

    render(<PublicInvite />)

    expect(await screen.findByText('Lễ tốt nghiệp')).toBeInTheDocument()
    expect(screen.getByText('Hội trường A')).toBeInTheDocument()
    expect(screen.getByAltText('Ảnh bìa lễ tốt nghiệp')).toHaveAttribute(
      'src',
      'https://res.cloudinary.com/demo/cover.jpg'
    )
  })

  it('shows a retry button when loading fails, and reloads on click', async () => {
    const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>
    fromMock.mockImplementation((table: string) => {
      if (table === 'event_settings') {
        return createQueryBuilderMock({ data: null, error: { message: 'boom' } })
      }
      return createQueryBuilderMock({ data: [], error: null })
    })
    const user = userEvent.setup()

    render(<PublicInvite />)

    await screen.findByText('Không tải được thông tin sự kiện.')

    fromMock.mockImplementation((table: string) => {
      if (table === 'event_settings') {
        return createQueryBuilderMock({ data: eventSettings, error: null })
      }
      return createQueryBuilderMock({ data: [], error: null })
    })
    await user.click(screen.getByRole('button', { name: 'Thử lại' }))

    await waitFor(() => expect(screen.getByText('Lễ tốt nghiệp')).toBeInTheDocument())
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
npx vitest run src/pages/PublicInvite.test.tsx
```

Expected: FAIL — `Cannot find module './PublicInvite'`.

- [ ] **Step 4: Write the implementation**

```typescript
// src/pages/PublicInvite.tsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { EventSettings, GalleryPhoto } from '../types/database'
import { CountdownTimer } from '../components/CountdownTimer'
import { MapEmbed } from '../components/MapEmbed'
import { GalleryGrid } from '../components/GalleryGrid'
import { NameSearchBox } from '../components/NameSearchBox'
import '../styles/tokens.css'
import '../styles/public-shared.css'
import './PublicInvite.css'

export function PublicInvite() {
  const [settings, setSettings] = useState<EventSettings | null>(null)
  const [gallery, setGallery] = useState<GalleryPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    const [settingsRes, galleryRes] = await Promise.all([
      supabase.from('event_settings').select('*').eq('id', 1).single(),
      supabase.from('gallery_photos').select('*').order('sort_order', { ascending: true }),
    ])

    if (settingsRes.error) {
      setError('Không tải được thông tin sự kiện.')
    } else {
      setSettings(settingsRes.data as EventSettings)
    }
    if (!galleryRes.error && galleryRes.data) {
      setGallery(galleryRes.data as GalleryPhoto[])
    }
    setLoading(false)
  }

  if (loading) return <p className="page-loading">Đang tải...</p>

  if (error) {
    return (
      <div className="page-error">
        <p role="alert">{error}</p>
        <button className="retry-button" type="button" onClick={load}>
          Thử lại
        </button>
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="public-invite-page">
      {settings.cover_image_url && (
        <img
          className="public-invite-cover"
          src={settings.cover_image_url}
          alt="Ảnh bìa lễ tốt nghiệp"
        />
      )}
      <h1 className="public-invite-title">{settings.event_name}</h1>
      <CountdownTimer eventDatetime={settings.event_datetime} />
      <p className="public-invite-venue">{settings.venue_name}</p>
      <p className="public-invite-address">{settings.venue_address}</p>
      <MapEmbed mapEmbedUrl={settings.map_embed_url} />
      <GalleryGrid photos={gallery} />
      <NameSearchBox />
    </div>
  )
}
```

```css
/* src/pages/PublicInvite.css */
.public-invite-page {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);
  text-align: center;
  font-family: var(--font-body);
}

.public-invite-cover {
  width: 100%;
  max-height: 320px;
  object-fit: cover;
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-6);
}

.public-invite-title {
  font-family: var(--font-display);
  font-size: 2.25rem;
  color: var(--color-foreground);
  margin: 0 0 var(--space-2);
}

.public-invite-venue {
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0;
}

.public-invite-address {
  color: var(--color-foreground);
  margin: 0 0 var(--space-4);
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx vitest run src/pages/PublicInvite.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 6: Delete the placeholder page**

```bash
git rm src/pages/PlaceholderHome.tsx
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/PublicInvite.tsx src/pages/PublicInvite.css src/pages/PublicInvite.test.tsx src/styles/public-shared.css
git commit -m "feat: implement PublicInvite page, replacing placeholder home"
```

---

### Task 9: `InviteFrame` component — scalloped border frame

**Files:**
- Create: `src/components/InviteFrame.tsx`
- Create: `src/components/InviteFrame.css`
- Test: `src/components/InviteFrame.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/InviteFrame.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InviteFrame } from './InviteFrame'

describe('InviteFrame', () => {
  it('renders its children inside the decorative frame', () => {
    render(
      <InviteFrame>
        <p>Nội dung thiệp</p>
      </InviteFrame>
    )
    expect(screen.getByText('Nội dung thiệp')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/components/InviteFrame.test.tsx
```

Expected: FAIL — `Cannot find module './InviteFrame'`.

- [ ] **Step 3: Write the implementation**

Per the spec, this does not need to be pixel-perfect — it's a re-creation in SVG/CSS, not the original raster artwork. The frame uses a repeating pink/cream vertical-stripe background, a scalloped (wavy) top and bottom edge drawn with an SVG `<path>`, solid pink side borders, and two small sparkle icons in opposite corners.

```typescript
// src/components/InviteFrame.tsx
import type { ReactNode } from 'react'
import './InviteFrame.css'

function ScallopEdge({ position }: { position: 'top' | 'bottom' }) {
  return (
    <svg
      className={`invite-frame-scallop invite-frame-scallop-${position}`}
      viewBox="0 0 200 20"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0,20 L0,10 Q10,0 20,10 Q30,20 40,10 Q50,0 60,10 Q70,20 80,10 Q90,0 100,10 Q110,20 120,10 Q130,0 140,10 Q150,20 160,10 Q170,0 180,10 Q190,20 200,10 L200,20 Z"
        fill="#faf6e8"
        stroke="#c0447a"
        strokeWidth="2"
      />
    </svg>
  )
}

function Sparkle({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="#f2a93b" />
    </svg>
  )
}

export function InviteFrame({ children }: { children: ReactNode }) {
  return (
    <div className="invite-frame">
      <ScallopEdge position="top" />
      <Sparkle className="invite-frame-sparkle invite-frame-sparkle-top-left" />
      <div className="invite-frame-body">{children}</div>
      <Sparkle className="invite-frame-sparkle invite-frame-sparkle-bottom-right" />
      <ScallopEdge position="bottom" />
    </div>
  )
}
```

```css
/* src/components/InviteFrame.css */
.invite-frame {
  position: relative;
  max-width: 480px;
  margin: var(--space-6) auto;
  background: repeating-linear-gradient(
    90deg,
    #fdf0f5 0px,
    #fdf0f5 20px,
    #fdf6e3 20px,
    #fdf6e3 40px
  );
  border-left: 2px solid #c0447a;
  border-right: 2px solid #c0447a;
}

.invite-frame-scallop {
  display: block;
  width: 100%;
  height: 20px;
}

.invite-frame-scallop-bottom {
  transform: rotate(180deg);
}

.invite-frame-body {
  position: relative;
  z-index: 1;
  background: #faf6e8;
  padding: var(--space-8) var(--space-6);
  text-align: center;
}

.invite-frame-sparkle {
  position: absolute;
  width: 28px;
  height: 28px;
  z-index: 2;
}

.invite-frame-sparkle-top-left {
  top: 28px;
  left: 12px;
}

.invite-frame-sparkle-bottom-right {
  bottom: 28px;
  right: 12px;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/components/InviteFrame.test.tsx
```

Expected: PASS (1 test).

- [ ] **Step 5: Visually check it in the browser**

```bash
npm run dev
```

Temporarily render `<InviteFrame><p>Test</p></InviteFrame>` from any route (or wait until Task 11 wires it into `GuestInvite`) and confirm the scalloped edges, stripe background, and sparkles look reasonable. Adjust colors/spacing in `InviteFrame.css` directly if something looks off — this is expected iteration, not a plan deviation.

- [ ] **Step 6: Commit**

```bash
git add src/components/InviteFrame.tsx src/components/InviteFrame.css src/components/InviteFrame.test.tsx
git commit -m "feat: add InviteFrame decorative border component"
```

---

### Task 10: `RsvpButtons` component (TDD)

**Files:**
- Create: `src/components/RsvpButtons.tsx`
- Create: `src/components/RsvpButtons.css`
- Test: `src/components/RsvpButtons.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/RsvpButtons.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RsvpButtons } from './RsvpButtons'

describe('RsvpButtons', () => {
  it('calls onRespond with the chosen status', async () => {
    const onRespond = vi.fn()
    const user = userEvent.setup()

    render(<RsvpButtons status="pending" submitting={false} onRespond={onRespond} />)

    await user.click(screen.getByRole('button', { name: 'Tôi sẽ tham dự' }))
    expect(onRespond).toHaveBeenCalledWith('attending')

    await user.click(screen.getByRole('button', { name: 'Xin phép vắng mặt' }))
    expect(onRespond).toHaveBeenCalledWith('not_attending')
  })

  it('disables both buttons while submitting', () => {
    render(<RsvpButtons status="pending" submitting onRespond={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Tôi sẽ tham dự' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Xin phép vắng mặt' })).toBeDisabled()
  })

  it('marks the current status as active', () => {
    render(<RsvpButtons status="attending" submitting={false} onRespond={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Tôi sẽ tham dự' })).toHaveClass(
      'rsvp-button-active'
    )
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/components/RsvpButtons.test.tsx
```

Expected: FAIL — `Cannot find module './RsvpButtons'`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/components/RsvpButtons.tsx
import type { RsvpStatus } from '../types/database'
import './RsvpButtons.css'

export interface RsvpButtonsProps {
  status: RsvpStatus
  submitting: boolean
  onRespond: (status: 'attending' | 'not_attending') => void
}

export function RsvpButtons({ status, submitting, onRespond }: RsvpButtonsProps) {
  return (
    <div className="rsvp-buttons">
      <button
        type="button"
        className={`rsvp-button rsvp-button-attending${
          status === 'attending' ? ' rsvp-button-active' : ''
        }`}
        onClick={() => onRespond('attending')}
        disabled={submitting}
      >
        Tôi sẽ tham dự
      </button>
      <button
        type="button"
        className={`rsvp-button rsvp-button-declined${
          status === 'not_attending' ? ' rsvp-button-active' : ''
        }`}
        onClick={() => onRespond('not_attending')}
        disabled={submitting}
      >
        Xin phép vắng mặt
      </button>
    </div>
  )
}
```

```css
/* src/components/RsvpButtons.css */
.rsvp-buttons {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
  margin-top: var(--space-4);
}

.rsvp-button {
  padding: 0.65rem 1.25rem;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: #ffffff;
  color: var(--color-foreground);
  cursor: pointer;
  transition: background-color 200ms ease, color 200ms ease, opacity 200ms ease;
}

.rsvp-button-attending.rsvp-button-active {
  background: var(--color-primary);
  color: var(--color-on-primary);
  border-color: var(--color-primary);
}

.rsvp-button-declined.rsvp-button-active {
  background: var(--color-muted);
  color: var(--color-foreground);
  border-color: var(--color-foreground);
}

.rsvp-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/components/RsvpButtons.test.tsx
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/RsvpButtons.tsx src/components/RsvpButtons.css src/components/RsvpButtons.test.tsx
git commit -m "feat: add RsvpButtons component"
```

---

### Task 11: `GuestInvite` page (TDD)

**Files:**
- Create: `src/pages/GuestInvite.tsx`
- Create: `src/pages/GuestInvite.css`
- Test: `src/pages/GuestInvite.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/pages/GuestInvite.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { createQueryBuilderMock } from '../test/supabaseMock'

vi.mock('../lib/supabaseClient', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}))

import { supabase } from '../lib/supabaseClient'
import { GuestInvite } from './GuestInvite'

const guest = {
  id: '1',
  full_name: 'Nguyễn Văn A',
  salutation: 'Anh',
  greeting_message: 'Chúc mừng nhé!',
  rsvp_status: 'pending' as const,
  rsvp_responded_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const eventSettings = {
  id: 1,
  event_name: 'Lễ tốt nghiệp',
  event_datetime: '2026-08-15T09:00:00Z',
  venue_name: 'Hội trường A',
  venue_address: '123 Đường ABC',
  map_embed_url: '',
  cover_image_url: null,
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/thiep/:guestId" element={<GuestInvite />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('GuestInvite', () => {
  it('shows the personalized greeting and event info once loaded', async () => {
    const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>
    fromMock.mockImplementation((table: string) => {
      if (table === 'guests') return createQueryBuilderMock({ data: guest, error: null })
      return createQueryBuilderMock({ data: eventSettings, error: null })
    })

    renderAt('/thiep/1')

    expect(await screen.findByText('Kính mời Anh Nguyễn Văn A')).toBeInTheDocument()
    expect(screen.getByText('Chúc mừng nhé!')).toBeInTheDocument()
    expect(screen.getByText('Lễ tốt nghiệp')).toBeInTheDocument()
  })

  it('shows a not-found message when the guest does not exist', async () => {
    const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>
    fromMock.mockImplementation((table: string) => {
      if (table === 'guests') {
        return createQueryBuilderMock({ data: null, error: { message: 'not found' } })
      }
      return createQueryBuilderMock({ data: eventSettings, error: null })
    })

    renderAt('/thiep/missing')

    expect(await screen.findByText('Không tìm thấy thiệp mời này.')).toBeInTheDocument()
  })

  it('submits an RSVP response and updates the displayed status', async () => {
    const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>
    fromMock.mockImplementation((table: string) => {
      if (table === 'guests') return createQueryBuilderMock({ data: guest, error: null })
      return createQueryBuilderMock({ data: eventSettings, error: null })
    })
    const rpcMock = supabase.rpc as unknown as ReturnType<typeof vi.fn>
    rpcMock.mockResolvedValue({ data: null, error: null })
    const user = userEvent.setup()

    renderAt('/thiep/1')
    await screen.findByText('Kính mời Anh Nguyễn Văn A')

    await user.click(screen.getByRole('button', { name: 'Tôi sẽ tham dự' }))

    await waitFor(() =>
      expect(rpcMock).toHaveBeenCalledWith('submit_rsvp', { guest_id: '1', status: 'attending' })
    )
  })

  it('reverts the optimistic update and shows an error when the RSVP call fails', async () => {
    const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>
    fromMock.mockImplementation((table: string) => {
      if (table === 'guests') return createQueryBuilderMock({ data: guest, error: null })
      return createQueryBuilderMock({ data: eventSettings, error: null })
    })
    const rpcMock = supabase.rpc as unknown as ReturnType<typeof vi.fn>
    rpcMock.mockResolvedValue({ data: null, error: { message: 'boom' } })
    const user = userEvent.setup()

    renderAt('/thiep/1')
    await screen.findByText('Kính mời Anh Nguyễn Văn A')

    await user.click(screen.getByRole('button', { name: 'Tôi sẽ tham dự' }))

    expect(
      await screen.findByText('Gửi phản hồi thất bại, vui lòng thử lại.')
    ).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/pages/GuestInvite.test.tsx
```

Expected: FAIL — `Cannot find module './GuestInvite'`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/pages/GuestInvite.tsx
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import type { EventSettings, Guest } from '../types/database'
import { InviteFrame } from '../components/InviteFrame'
import { RsvpButtons } from '../components/RsvpButtons'
import '../styles/tokens.css'
import '../styles/public-shared.css'
import './GuestInvite.css'

export function GuestInvite() {
  const { guestId } = useParams<{ guestId: string }>()
  const [guest, setGuest] = useState<Guest | null>(null)
  const [eventSettings, setEventSettings] = useState<EventSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [rsvpError, setRsvpError] = useState<string | null>(null)

  useEffect(() => {
    if (!guestId) return
    load(guestId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestId])

  async function load(id: string) {
    setLoading(true)
    setNotFound(false)
    const [guestRes, eventRes] = await Promise.all([
      supabase.from('guests').select('*').eq('id', id).single(),
      supabase.from('event_settings').select('*').eq('id', 1).single(),
    ])

    if (guestRes.error || !guestRes.data) {
      setNotFound(true)
    } else {
      setGuest(guestRes.data as Guest)
    }
    if (!eventRes.error && eventRes.data) {
      setEventSettings(eventRes.data as EventSettings)
    }
    setLoading(false)
  }

  async function handleRespond(status: 'attending' | 'not_attending') {
    if (!guest) return
    const previous = guest
    setSubmitting(true)
    setRsvpError(null)
    setGuest({ ...guest, rsvp_status: status, rsvp_responded_at: new Date().toISOString() })

    const { error } = await supabase.rpc('submit_rsvp', { guest_id: guest.id, status })

    if (error) {
      setGuest(previous)
      setRsvpError('Gửi phản hồi thất bại, vui lòng thử lại.')
    }
    setSubmitting(false)
  }

  if (loading) return <p className="page-loading">Đang tải...</p>

  if (notFound) {
    return (
      <div className="page-error">
        <p>Không tìm thấy thiệp mời này.</p>
        <Link to="/">Quay về trang chủ</Link>
      </div>
    )
  }

  if (!guest) return null

  return (
    <div className="guest-invite-page">
      <InviteFrame>
        <p className="guest-invite-greeting">
          Kính mời {guest.salutation ? `${guest.salutation} ` : ''}
          {guest.full_name}
        </p>
        {guest.greeting_message && (
          <p className="guest-invite-message">{guest.greeting_message}</p>
        )}
        {eventSettings && (
          <div className="guest-invite-event-info">
            {eventSettings.event_name && <p>{eventSettings.event_name}</p>}
            {eventSettings.venue_name && <p>{eventSettings.venue_name}</p>}
            {eventSettings.venue_address && <p>{eventSettings.venue_address}</p>}
          </div>
        )}
        <RsvpButtons status={guest.rsvp_status} submitting={submitting} onRespond={handleRespond} />
        {rsvpError && (
          <p className="guest-invite-rsvp-error" role="alert">
            {rsvpError}
          </p>
        )}
      </InviteFrame>
    </div>
  )
}
```

```css
/* src/pages/GuestInvite.css */
.guest-invite-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background: radial-gradient(circle at top, var(--color-secondary) 0%, var(--color-background) 60%);
}

.guest-invite-greeting {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-foreground);
  margin: 0 0 var(--space-4);
}

.guest-invite-message {
  font-family: var(--font-body);
  color: var(--color-foreground);
  margin: 0 0 var(--space-4);
}

.guest-invite-event-info p {
  margin: 0 0 var(--space-2);
  color: var(--color-foreground);
}

.guest-invite-rsvp-error {
  margin-top: var(--space-3);
  color: var(--color-destructive);
  font-size: 0.85rem;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/pages/GuestInvite.test.tsx
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/GuestInvite.tsx src/pages/GuestInvite.css src/pages/GuestInvite.test.tsx
git commit -m "feat: implement GuestInvite page with RSVP"
```

---

### Task 12: `NotFound` page (TDD)

**Files:**
- Create: `src/pages/NotFound.tsx`
- Create: `src/pages/NotFound.css`
- Test: `src/pages/NotFound.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/pages/NotFound.test.tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { NotFound } from './NotFound'

describe('NotFound', () => {
  it('shows a 404 message with a link back home', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    )
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Quay về trang chủ' })).toHaveAttribute('href', '/')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/pages/NotFound.test.tsx
```

Expected: FAIL — `Cannot find module './NotFound'`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/pages/NotFound.tsx
import { Link } from 'react-router-dom'
import '../styles/tokens.css'
import './NotFound.css'

export function NotFound() {
  return (
    <div className="not-found-page">
      <h1>404</h1>
      <p>Không tìm thấy trang bạn yêu cầu.</p>
      <Link to="/">Quay về trang chủ</Link>
    </div>
  )
}
```

```css
/* src/pages/NotFound.css */
.not-found-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  font-family: var(--font-body);
  color: var(--color-foreground);
  text-align: center;
}

.not-found-page h1 {
  font-family: var(--font-display);
  font-size: 4rem;
  margin: 0;
  color: var(--color-primary);
}

.not-found-page a {
  color: var(--color-primary);
  font-weight: 600;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/pages/NotFound.test.tsx
```

Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/pages/NotFound.tsx src/pages/NotFound.css src/pages/NotFound.test.tsx
git commit -m "feat: add generic 404 page"
```

---

### Task 13: Wire the new routes into `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace the route table**

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RequireAuth } from './components/RequireAuth'
import { PublicInvite } from './pages/PublicInvite'
import { GuestInvite } from './pages/GuestInvite'
import { NotFound } from './pages/NotFound'
import { AdminLogin } from './pages/admin/AdminLogin'
import { AdminDashboard } from './pages/admin/AdminDashboard'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicInvite />} />
        <Route path="/thiep/:guestId" element={<GuestInvite />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminDashboard />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire PublicInvite, GuestInvite, and NotFound routes"
```

---

### Task 14: Full test suite, type-check, and manual verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full automated test suite**

```bash
npm run test
```

Expected: all test files pass, including the 7 admin/foundation suites plus the new textSearch, useGuestSearch, CountdownTimer, MapEmbed, GalleryGrid, NameSearchBox, InviteFrame, RsvpButtons, PublicInvite, GuestInvite, and NotFound suites.

- [ ] **Step 2: Type-check the whole project**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Manual QA checklist against the running app**

Requires a real `.env` (see `docs/superpowers/plans/2026-07-10-admin-foundation.md` Task 16 for how to obtain Supabase/Cloudinary credentials) and at least one guest row with `rsvp_status: 'pending'` and one `event_settings` row with a future `event_datetime`.

```bash
npm run dev
```

- [ ] Visit `/` → event name, countdown, venue, map (if `map_embed_url` set), and gallery (if any photos) all render.
- [ ] Type a guest's name (with or without diacritics) into the search box → matching suggestion(s) appear; click one → navigates to `/thiep/:guestId`.
- [ ] Type a name that matches nobody → "Không tìm thấy tên..." message appears.
- [ ] On the guest page, confirm the personalized greeting, greeting message (if set), and event info render inside the scalloped `InviteFrame`.
- [ ] Click "Tôi sẽ tham dự" → button highlights as active immediately; reload the page → status persisted.
- [ ] Click "Xin phép vắng mặt" → status switches; reload → persisted (confirms changing your mind works).
- [ ] Visit `/thiep/does-not-exist` → "Không tìm thấy thiệp mời này." with a link back to `/`.
- [ ] Visit a nonsense path like `/foo/bar` → generic 404 page with a link back to `/`.
- [ ] Temporarily break `VITE_SUPABASE_URL` (or turn off wifi) and reload `/` → error message + "Thử lại" button appear instead of a crash.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: complete guest-facing pages verification"
```

---

## Out of scope (next plan)

- Deployment to Vercel.
- Any additional admin polish (pagination, CSV import/export, gallery photo reordering) — the admin CRUD delivered in `docs/superpowers/plans/2026-07-10-admin-foundation.md` already covers add/edit/delete/search/RSVP-summary and was explicitly deferred by the user in favor of this plan.
