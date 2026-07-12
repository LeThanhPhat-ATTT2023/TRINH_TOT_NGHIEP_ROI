# Envelope Popup Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trên thiệp chung, nút "Xem lời mời riêng dành cho bạn" mở popup bao thư; khách chạm bao thư, nắp mở, thiệp riêng chui ra kèm nút RSVP hoạt động ngay trong popup.

**Architecture:** Tách logic guest+RSVP của `GuestInvite` thành hook `useGuestInvite` và component `GuestInviteCard` (tái sử dụng trong popup). Component mới `EnvelopeModal` dựng bao thư bằng CSS clip-path, điều phối chuỗi trạng thái `envelope → opening → card-out → revealed` bằng React state + timer (đồng bộ với thời lượng animation của Motion, không phụ thuộc callback animation nên test được trong jsdom).

**Tech Stack:** React 19, TypeScript, `motion` (tên phát hành hiện tại của Framer Motion, import từ `motion/react`), CSS thuần, Vitest + Testing Library, Supabase.

**Spec:** `docs/superpowers/specs/2026-07-12-envelope-popup-animation-design.md`

## Thứ tự thực hiện (wave song song)

- **Wave 1 — Task 1** (chạy một mình trước, nhanh): cài `motion` + polyfill `matchMedia`. Phải xong trước các wave sau vì mutate `node_modules`.
- **Wave 2 — Task 2 và Task 3 chạy SONG SONG** (2 sub-agent): file không giao nhau (Task 2: `icons.tsx`; Task 3: hook/card/GuestInvite).
- **Wave 3 — Task 4** (cần Task 1+2+3).
- **Wave 4 — Task 5** (cần Task 4).

## Bối cảnh cho engineer mới

- Test chạy bằng `npm test` (vitest run, jsdom). Chạy một file: `npm test -- src/pages/GuestInvite.test.tsx`. Lint: `npm run lint`. Build: `npm run build`.
- Supabase được mock trong test qua `vi.mock('../lib/supabaseClient', ...)` + helper `createQueryBuilderMock` (`src/test/supabaseMock.ts`) — builder thenable, `.single()` trả Promise.
- LƯU Ý: hai test hiện có trong `PublicInvite.test.tsx` tìm link tên `'Xem thiệp mời của bạn'` nhưng component render `'Xem lời mời riêng dành cho bạn'` — text test đã cũ; Task 5 thay chúng bằng test popup nên không cần sửa riêng.
- Commit message kết thúc bằng trailer:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`

---

### Task 1: Cài `motion` + polyfill `matchMedia` cho jsdom

**Files:**
- Modify: `package.json` (qua npm), `src/test/setup.ts`

- [ ] **Step 1: Cài dependency**

Run: `npm install motion`
Expected: `motion` xuất hiện trong `dependencies` của `package.json`, exit 0.

- [ ] **Step 2: Thêm polyfill matchMedia vào cuối `src/test/setup.ts`**

jsdom không có `window.matchMedia`; `useReducedMotion` của motion cần nó.

```ts
// jsdom không có window.matchMedia; motion (useReducedMotion) gọi nó khi
// component mount nên test sẽ crash nếu thiếu. Polyfill tối thiểu, luôn trả
// matches: false (tức là không bật reduced-motion trong test).
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    }) as unknown as MediaQueryList
}
```

- [ ] **Step 3: Chạy toàn bộ test để chắc không vỡ gì**

Run: `npm test`
Expected: PASS toàn bộ (trừ khi có test đỏ sẵn từ trước — ghi nhận lại nguyên trạng nếu có, không sửa trong task này).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/test/setup.ts
git commit -m "chore: add motion dependency and matchMedia polyfill for jsdom"
```

---

### Task 2: Thêm `GraduationCapIcon` vào icons.tsx

**Files:**
- Modify: `src/components/icons.tsx` (thêm cuối file)

Codebase không có test riêng cho icon (theo pattern hiện tại); icon này được phủ bởi test EnvelopeModal ở Task 4.

- [ ] **Step 1: Thêm component icon vào cuối `src/components/icons.tsx`**

```tsx
export function GraduationCapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5Z" />
      <path d="M6.5 11.5v4.2c0 1.2 2.5 2.3 5.5 2.3s5.5-1.1 5.5-2.3v-4.2" />
      <path d="M22 9.5v5" />
    </svg>
  )
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: PASS, không lỗi mới.

- [ ] **Step 3: Commit**

```bash
git add src/components/icons.tsx
git commit -m "feat: add GraduationCapIcon for the envelope wax seal"
```

---

### Task 3: Tách `useGuestInvite` + `GuestInviteCard`, refactor GuestInvite

Refactor thuần — không đổi hành vi. 4 test hiện có trong `GuestInvite.test.tsx` là lưới an toàn: chúng phải pass NGUYÊN VẸN, không được sửa test trong task này.

**Files:**
- Create: `src/hooks/useGuestInvite.ts`
- Create: `src/components/GuestInviteCard.tsx`
- Create: `src/components/GuestInviteCard.css`
- Modify: `src/pages/GuestInvite.tsx` (viết lại toàn bộ)
- Modify: `src/pages/GuestInvite.css` (chỉ giữ style cấp trang)
- Test: `src/pages/GuestInvite.test.tsx` (đã có — không sửa)

- [ ] **Step 1: Tạo `src/hooks/useGuestInvite.ts`** (thư mục `src/hooks/` chưa tồn tại — tạo mới)

```ts
// src/hooks/useGuestInvite.ts
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Guest } from '../types/database'

export interface UseGuestInviteResult {
  guest: Guest | null
  loading: boolean
  notFound: boolean
  submitting: boolean
  rsvpError: string | null
  respond: (status: 'attending' | 'not_attending') => Promise<void>
  reload: () => void
}

// Gom fetch guest + gửi RSVP (optimistic update/rollback) — dùng chung giữa
// trang GuestInvite và popup EnvelopeModal.
export function useGuestInvite(guestId: string | undefined): UseGuestInviteResult {
  const [guest, setGuest] = useState<Guest | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [rsvpError, setRsvpError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!guestId) return
    setLoading(true)
    setNotFound(false)
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single()
    if (error || !data) {
      setNotFound(true)
    } else {
      setGuest(data as Guest)
    }
    setLoading(false)
  }, [guestId])

  useEffect(() => {
    load()
  }, [load])

  async function respond(status: 'attending' | 'not_attending') {
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

  return { guest, loading, notFound, submitting, rsvpError, respond, reload: load }
}
```

- [ ] **Step 2: Tạo `src/components/GuestInviteCard.css`** (style ruột thiệp, chuyển từ `GuestInvite.css` sang)

```css
/* src/components/GuestInviteCard.css */
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

- [ ] **Step 3: Tạo `src/components/GuestInviteCard.tsx`**

```tsx
// src/components/GuestInviteCard.tsx
import type { EventSettings, Guest } from '../types/database'
import { InviteFrame } from './InviteFrame'
import { RsvpButtons } from './RsvpButtons'
import './GuestInviteCard.css'

export interface GuestInviteCardProps {
  guest: Guest
  eventSettings: EventSettings | null
  submitting: boolean
  rsvpError: string | null
  onRespond: (status: 'attending' | 'not_attending') => void
}

// Tấm thiệp riêng hoàn chỉnh (khung InviteFrame + ruột thiệp) — dùng chung
// giữa trang GuestInvite và popup EnvelopeModal.
export function GuestInviteCard({
  guest,
  eventSettings,
  submitting,
  rsvpError,
  onRespond,
}: GuestInviteCardProps) {
  return (
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
      <RsvpButtons status={guest.rsvp_status} submitting={submitting} onRespond={onRespond} />
      {rsvpError && (
        <p className="guest-invite-rsvp-error" role="alert">
          {rsvpError}
        </p>
      )}
    </InviteFrame>
  )
}
```

- [ ] **Step 4: Viết lại `src/pages/GuestInvite.tsx`** (toàn bộ nội dung file mới)

```tsx
// src/pages/GuestInvite.tsx
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import type { EventSettings } from '../types/database'
import { GuestInviteCard } from '../components/GuestInviteCard'
import { useGuestInvite } from '../hooks/useGuestInvite'
import '../styles/tokens.css'
import '../styles/public-shared.css'
import './GuestInvite.css'

export function GuestInvite() {
  const { guestId } = useParams<{ guestId: string }>()
  const { guest, loading, notFound, submitting, rsvpError, respond } = useGuestInvite(guestId)
  const [eventSettings, setEventSettings] = useState<EventSettings | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadSettings() {
      const { data, error } = await supabase
        .from('event_settings')
        .select('*')
        .eq('id', 1)
        .single()
      if (cancelled) return
      if (!error && data) setEventSettings(data as EventSettings)
      setSettingsLoading(false)
    }
    loadSettings()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading || settingsLoading) return <p className="page-loading">Đang tải...</p>

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
      <GuestInviteCard
        guest={guest}
        eventSettings={eventSettings}
        submitting={submitting}
        rsvpError={rsvpError}
        onRespond={respond}
      />
    </div>
  )
}
```

- [ ] **Step 5: Thu gọn `src/pages/GuestInvite.css`** (toàn bộ nội dung file mới — các class ruột thiệp đã chuyển sang `GuestInviteCard.css`)

```css
/* src/pages/GuestInvite.css */
.guest-invite-page {
  min-height: 100dvh;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background: var(--color-background);
  overflow-x: clip;
}

@media (max-width: 480px) {
  .guest-invite-page {
    padding: var(--space-3);
  }
}
```

- [ ] **Step 6: Chạy test GuestInvite (lưới an toàn refactor)**

Run: `npm test -- src/pages/GuestInvite.test.tsx`
Expected: PASS cả 4 test, không sửa test.

- [ ] **Step 7: Lint + toàn bộ test**

Run: `npm run lint` rồi `npm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/hooks/useGuestInvite.ts src/components/GuestInviteCard.tsx src/components/GuestInviteCard.css src/pages/GuestInvite.tsx src/pages/GuestInvite.css
git commit -m "refactor: extract useGuestInvite hook and GuestInviteCard for reuse in envelope popup"
```

---

### Task 4: Component `EnvelopeModal` (TDD)

**Files:**
- Create: `src/components/EnvelopeModal.test.tsx`
- Create: `src/components/EnvelopeModal.css`
- Create: `src/components/EnvelopeModal.tsx`

Phụ thuộc: Task 1 (motion, matchMedia), Task 2 (GraduationCapIcon), Task 3 (hook + card).

- [ ] **Step 1: Viết test trước — `src/components/EnvelopeModal.test.tsx`**

```tsx
// src/components/EnvelopeModal.test.tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MotionGlobalConfig } from 'motion/react'
import { createQueryBuilderMock } from '../test/supabaseMock'

vi.mock('../lib/supabaseClient', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}))

import { supabase } from '../lib/supabaseClient'
import { EnvelopeModal } from './EnvelopeModal'

// Tắt animation của motion trong jsdom; chuỗi trạng thái của modal chạy bằng
// timer thật (~1.2s) nên các findBy* bên dưới nới timeout lên 3s.
MotionGlobalConfig.skipAnimations = true

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

function mockGuestSuccess() {
  const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>
  fromMock.mockImplementation(() => createQueryBuilderMock({ data: guest, error: null }))
}

// Chạm bao thư rồi chờ thiệp đầy đủ hiện ra (hết chuỗi nắp mở + thiệp trượt)
async function openEnvelope(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Chạm để mở thư' }))
  await screen.findByText('Kính mời Anh Nguyễn Văn A', undefined, { timeout: 3000 })
}

describe('EnvelopeModal', () => {
  it('shows the closed envelope with a tap hint', async () => {
    mockGuestSuccess()
    render(<EnvelopeModal guestId="1" eventSettings={eventSettings} onClose={() => {}} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chạm để mở thư' })).toBeInTheDocument()
    expect(screen.getByText('✨ Chạm để mở thư')).toBeInTheDocument()
  })

  it('reveals the personal card with RSVP after tapping the envelope', async () => {
    mockGuestSuccess()
    const user = userEvent.setup()
    render(<EnvelopeModal guestId="1" eventSettings={eventSettings} onClose={() => {}} />)

    await openEnvelope(user)

    expect(screen.getByText('Chúc mừng nhé!')).toBeInTheDocument()
    expect(screen.getByText('Lễ tốt nghiệp')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tôi sẽ tham dự' })).toBeInTheDocument()
  })

  it('submits an RSVP from inside the popup', async () => {
    mockGuestSuccess()
    const rpcMock = supabase.rpc as unknown as ReturnType<typeof vi.fn>
    rpcMock.mockResolvedValue({ data: null, error: null })
    const user = userEvent.setup()
    render(<EnvelopeModal guestId="1" eventSettings={eventSettings} onClose={() => {}} />)

    await openEnvelope(user)
    await user.click(screen.getByRole('button', { name: 'Tôi sẽ tham dự' }))

    await waitFor(() =>
      expect(rpcMock).toHaveBeenCalledWith('submit_rsvp', { guest_id: '1', status: 'attending' })
    )
  })

  it('shows an error with retry when the guest cannot be loaded', async () => {
    const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>
    fromMock.mockImplementation(() =>
      createQueryBuilderMock({ data: null, error: { message: 'not found' } })
    )
    render(<EnvelopeModal guestId="missing" eventSettings={eventSettings} onClose={() => {}} />)

    expect(await screen.findByText('Không tìm thấy thiệp mời này.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
  })

  it('closes via the close button, Escape key, and backdrop click', async () => {
    mockGuestSuccess()
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<EnvelopeModal guestId="1" eventSettings={eventSettings} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Đóng' }))
    await user.keyboard('{Escape}')
    // fireEvent để target đúng là backdrop (user.click nhắm tâm element,
    // tâm backdrop đang bị bao thư che nên target sẽ là con, không phải backdrop)
    fireEvent.click(screen.getByRole('dialog'))

    expect(onClose).toHaveBeenCalledTimes(3)
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận fail đúng lý do**

Run: `npm test -- src/components/EnvelopeModal.test.tsx`
Expected: FAIL — `Cannot find module './EnvelopeModal'` (hoặc tương đương).

- [ ] **Step 3: Tạo `src/components/EnvelopeModal.css`**

```css
/* src/components/EnvelopeModal.css */

.envelope-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(80, 22, 47, 0.55);
  padding: var(--space-4);
}

.envelope-close {
  position: absolute;
  top: 14px;
  right: 16px;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-foreground);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  z-index: 60;
}

.envelope-scene {
  display: flex;
  flex-direction: column;
  align-items: center;
  perspective: 900px;
}

.envelope {
  position: relative;
  width: min(340px, 90vw);
  aspect-ratio: 3 / 2;
  border: none;
  padding: 0;
  background: #fbcfe8;
  border-radius: 10px;
  cursor: pointer;
  transform-style: preserve-3d;
}

/* Thiệp thu nhỏ nằm trong bao thư, trượt lên khi mở */
.envelope-card-preview {
  position: absolute;
  left: 8%;
  right: 8%;
  top: 6%;
  height: 84%;
  background: #faf6e8;
  border: 2px solid #c0447a;
  border-radius: 8px;
  z-index: 1;
  display: flex;
  justify-content: center;
  padding: 12px 10px 0;
}

.envelope-card-preview-text {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--color-foreground);
  font-size: 0.95rem;
  text-align: center;
}

/* Hai nếp gấp hông + nếp đáy tạo mặt trước bao thư, che phần dưới thiệp */
.envelope-fold {
  position: absolute;
  z-index: 2;
  pointer-events: none;
}

.envelope-fold-left {
  left: 0;
  top: 0;
  width: 53%;
  height: 100%;
  background: #f9bedf;
  clip-path: polygon(0 0, 100% 50%, 0 100%);
  border-radius: 10px 0 0 10px;
}

.envelope-fold-right {
  right: 0;
  top: 0;
  width: 53%;
  height: 100%;
  background: #f9bedf;
  clip-path: polygon(100% 0, 0 50%, 100% 100%);
  border-radius: 0 10px 10px 0;
}

.envelope-fold-bottom {
  left: 0;
  bottom: 0;
  width: 100%;
  height: 58%;
  background: #fbcfe8;
  clip-path: polygon(0 100%, 50% 0, 100% 100%);
  border-radius: 0 0 10px 10px;
}

/* Nắp bao thư — xoay quanh mép trên khi mở, mặt sau ẩn */
.envelope-flap {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 53%;
  background: #f472b6;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  transform-origin: top center;
  backface-visibility: hidden;
  z-index: 3;
  border-radius: 10px 10px 0 0;
}

/* Sau khi mở, nắp chìm xuống dưới để thiệp trượt qua mặt nó */
.envelope-open .envelope-flap {
  z-index: 0;
}

/* Dấu sáp kem + icon mũ tốt nghiệp maroon (quyết định trong spec) */
.envelope-seal {
  position: absolute;
  left: 50%;
  top: 46%;
  transform: translate(-50%, -50%);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #faf6e8;
  border: 2px solid #f0e3c0;
  box-shadow: 0 3px 10px rgba(131, 24, 67, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4;
  pointer-events: none;
}

.envelope-seal-icon {
  width: 30px;
  height: 30px;
  color: #c0447a;
}

.envelope-sparkle {
  position: absolute;
  width: 18px;
  height: 18px;
  color: #f2a93b;
  z-index: 4;
  pointer-events: none;
}

.envelope-sparkle-1 {
  left: 10px;
  bottom: 10px;
}

.envelope-sparkle-2 {
  right: 10px;
  top: 55%;
}

.envelope-hint {
  margin: var(--space-4) 0 0;
  color: var(--color-background);
  font-family: var(--font-body);
  font-style: italic;
  font-size: 0.9rem;
}

/* Thiệp đầy đủ sau khi chui ra */
.envelope-card-full {
  width: min(560px, 94vw);
  max-height: 85dvh;
  overflow-y: auto;
  border-radius: var(--radius-lg);
}

.envelope-loading {
  color: var(--color-background);
  font-family: var(--font-body);
}

/* Lỗi tải guest trong popup */
.envelope-error {
  background: #faf6e8;
  border-radius: var(--radius-md);
  padding: var(--space-6);
  text-align: center;
  color: var(--color-foreground);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: center;
}

.envelope-retry {
  border: none;
  border-radius: 999px;
  padding: 0.55rem 1.4rem;
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-weight: 600;
  cursor: pointer;
}
```

- [ ] **Step 4: Tạo `src/components/EnvelopeModal.tsx`**

```tsx
// src/components/EnvelopeModal.tsx
import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { EventSettings } from '../types/database'
import { useGuestInvite } from '../hooks/useGuestInvite'
import { GuestInviteCard } from './GuestInviteCard'
import { GraduationCapIcon, SparkleIcon } from './icons'
import './EnvelopeModal.css'

// Trình tự mở thư: chờ chạm -> nắp mở -> thiệp trượt lên -> thiệp đầy đủ
type Phase = 'envelope' | 'opening' | 'card-out' | 'revealed'

const FLAP_OPEN_MS = 450
const CARD_OUT_MS = 700

export interface EnvelopeModalProps {
  guestId: string
  eventSettings: EventSettings | null
  onClose: () => void
}

export function EnvelopeModal({ guestId, eventSettings, onClose }: EnvelopeModalProps) {
  const { guest, notFound, submitting, rsvpError, respond, reload } = useGuestInvite(guestId)
  const reducedMotion = useReducedMotion()
  const [phase, setPhase] = useState<Phase>('envelope')
  const envelopeRef = useRef<HTMLButtonElement>(null)

  // Esc đóng popup
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  // Khoá cuộn trang nền + quản lý focus khi mở/đóng
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    envelopeRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [])

  // Chuỗi trạng thái chạy bằng timer khớp thời lượng animation — độc lập với
  // motion nên hành vi giữ nguyên cả khi animation bị tắt (vd trong test)
  useEffect(() => {
    if (phase === 'opening') {
      const t = setTimeout(() => setPhase('card-out'), FLAP_OPEN_MS)
      return () => clearTimeout(t)
    }
    if (phase === 'card-out') {
      const t = setTimeout(() => setPhase('revealed'), CARD_OUT_MS)
      return () => clearTimeout(t)
    }
  }, [phase])

  function handleEnvelopeTap() {
    if (phase !== 'envelope') return
    setPhase(reducedMotion ? 'revealed' : 'opening')
  }

  const salutation = guest?.salutation ? `${guest.salutation} ` : ''

  return (
    <motion.div
      className="envelope-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Lời mời riêng dành cho bạn"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <button type="button" className="envelope-close" aria-label="Đóng" onClick={onClose}>
        ×
      </button>

      {notFound ? (
        <div className="envelope-error">
          <p role="alert">Không tìm thấy thiệp mời này.</p>
          <button type="button" className="envelope-retry" onClick={reload}>
            Thử lại
          </button>
        </div>
      ) : phase !== 'revealed' ? (
        <div className="envelope-scene">
          <motion.button
            ref={envelopeRef}
            type="button"
            aria-label="Chạm để mở thư"
            className={`envelope${phase !== 'envelope' ? ' envelope-open' : ''}`}
            onClick={handleEnvelopeTap}
            initial={reducedMotion ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            {/* Thiệp thu nhỏ trượt lên từ trong bao thư */}
            <motion.span
              className="envelope-card-preview"
              initial={false}
              animate={{ y: phase === 'card-out' ? -170 : 0 }}
              transition={{ duration: CARD_OUT_MS / 1000, ease: 'easeOut' }}
            >
              <span className="envelope-card-preview-text">
                {guest ? `Kính mời ${salutation}${guest.full_name}` : 'Đang tải...'}
              </span>
            </motion.span>
            <span className="envelope-fold envelope-fold-left" />
            <span className="envelope-fold envelope-fold-right" />
            <span className="envelope-fold envelope-fold-bottom" />
            <motion.span
              className="envelope-flap"
              initial={false}
              animate={{ rotateX: phase === 'envelope' ? 0 : 180 }}
              transition={{ duration: FLAP_OPEN_MS / 1000, ease: 'easeInOut' }}
            />
            <motion.span
              className="envelope-seal"
              initial={false}
              animate={phase === 'envelope' ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.25 }}
            >
              <GraduationCapIcon className="envelope-seal-icon" />
            </motion.span>
            <SparkleIcon className="envelope-sparkle envelope-sparkle-1" />
            <SparkleIcon className="envelope-sparkle envelope-sparkle-2" />
          </motion.button>
          <p className="envelope-hint">✨ Chạm để mở thư</p>
        </div>
      ) : (
        <motion.div
          className="envelope-card-full"
          initial={reducedMotion ? false : { y: 40, scale: 0.85, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {guest ? (
            <GuestInviteCard
              guest={guest}
              eventSettings={eventSettings}
              submitting={submitting}
              rsvpError={rsvpError}
              onRespond={respond}
            />
          ) : (
            <p className="envelope-loading">Đang tải...</p>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
```

- [ ] **Step 5: Chạy test, xác nhận pass**

Run: `npm test -- src/components/EnvelopeModal.test.tsx`
Expected: PASS cả 5 test.

- [ ] **Step 6: Lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/EnvelopeModal.tsx src/components/EnvelopeModal.css src/components/EnvelopeModal.test.tsx
git commit -m "feat: add EnvelopeModal with tap-to-open envelope animation"
```

---

### Task 5: Nối EnvelopeModal vào PublicInvite (TDD)

**Files:**
- Modify: `src/pages/PublicInvite.test.tsx`
- Modify: `src/pages/PublicInvite.tsx`
- Modify: `src/pages/PublicInvite.css` (rule `.public-invite-cta`, dòng ~200)

Phụ thuộc: Task 4.

- [ ] **Step 1: Cập nhật test — `src/pages/PublicInvite.test.tsx`**

Ba thay đổi trong file test:

(1) Thêm import + tắt animation, ngay sau các import hiện có (trước `describe`):

```tsx
import { MotionGlobalConfig } from 'motion/react'

MotionGlobalConfig.skipAnimations = true
```

(2) Thêm fixture `guest` và nhánh `guests` trong `mockLoadSuccess` (thay toàn bộ hàm hiện tại), và bổ sung `rpc: vi.fn()` vào `vi.mock('../lib/supabaseClient', ...)`:

```tsx
vi.mock('../lib/supabaseClient', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}))
```

```tsx
const guest = {
  id: '2',
  full_name: 'Nguyễn Văn A',
  salutation: 'Anh',
  greeting_message: null,
  rsvp_status: 'pending' as const,
  rsvp_responded_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

function mockLoadSuccess() {
  const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>
  fromMock.mockImplementation((table: string) => {
    if (table === 'event_settings') {
      return createQueryBuilderMock({ data: eventSettings, error: null })
    }
    if (table === 'guests') {
      return createQueryBuilderMock({ data: guest, error: null })
    }
    return createQueryBuilderMock({ data: [], error: null })
  })
  return fromMock
}
```

(3) Thay 2 test `'shows a link to the personal invite when opened with a guest id'` và `'hides the personal invite link when opened without a guest id'` (chúng đang tìm link `'Xem thiệp mời của bạn'` — text đã cũ so với component) bằng:

```tsx
it('opens the envelope popup when the personal invite button is clicked', async () => {
  mockLoadSuccess()
  const user = userEvent.setup()

  renderAt('/thiep-chung/2')

  await user.click(
    await screen.findByRole('button', { name: 'Xem lời mời riêng dành cho bạn' })
  )

  expect(await screen.findByRole('dialog')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Chạm để mở thư' })).toBeInTheDocument()
})

it('hides the personal invite button when opened without a guest id', async () => {
  mockLoadSuccess()

  renderAt('/thiep-chung')

  await screen.findByText('Lễ tốt nghiệp')
  expect(
    screen.queryByRole('button', { name: 'Xem lời mời riêng dành cho bạn' })
  ).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Chạy test, xác nhận 2 test mới fail**

Run: `npm test -- src/pages/PublicInvite.test.tsx`
Expected: FAIL — không tìm thấy button `'Xem lời mời riêng dành cho bạn'` mở popup (CTA hiện là Link, chưa có modal).

- [ ] **Step 3: Sửa `src/pages/PublicInvite.tsx`**

(1) Import: bỏ `Link` khỏi import react-router-dom (không còn dùng), thêm modal + AnimatePresence:

```tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import { EnvelopeModal } from '../components/EnvelopeModal'
```

(các import khác giữ nguyên)

(2) Thêm state trong component, cạnh các state hiện có:

```tsx
const [inviteOpen, setInviteOpen] = useState(false)
```

(3) Thay block CTA hiện tại (Link `Xem lời mời riêng dành cho bạn`) bằng:

```tsx
{guestId && (
  <div className="public-invite-section public-invite-cta-section">
    <button type="button" className="public-invite-cta" onClick={() => setInviteOpen(true)}>
      Xem lời mời riêng dành cho bạn
    </button>
  </div>
)}
```

(4) Ngay sau thẻ đóng `</InviteFrame>` (vẫn trong `<div className="public-invite-page">`), thêm:

```tsx
<AnimatePresence>
  {guestId && inviteOpen && (
    <EnvelopeModal
      guestId={guestId}
      eventSettings={settings}
      onClose={() => setInviteOpen(false)}
    />
  )}
</AnimatePresence>
```

- [ ] **Step 4: Cập nhật rule `.public-invite-cta` trong `src/pages/PublicInvite.css`** (CTA giờ là button — thêm 3 dòng reset vào rule hiện có, giữ nguyên phần còn lại)

```css
.public-invite-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.7rem 1.6rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-radius: 999px;
  box-shadow: 0 10px 20px -12px rgba(146, 46, 92, 0.7);
  text-decoration: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-body);
}
```

- [ ] **Step 5: Chạy test PublicInvite**

Run: `npm test -- src/pages/PublicInvite.test.tsx`
Expected: PASS cả 5 test.

- [ ] **Step 6: Toàn bộ test + lint + build**

Run: `npm test` rồi `npm run lint` rồi `npm run build`
Expected: PASS tất cả; build không lỗi TypeScript.

- [ ] **Step 7: Commit**

```bash
git add src/pages/PublicInvite.tsx src/pages/PublicInvite.css src/pages/PublicInvite.test.tsx
git commit -m "feat: open personal invite via envelope popup on the shared invite page"
```
