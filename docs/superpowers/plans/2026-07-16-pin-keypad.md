# Bàn phím số cho cổng mật khẩu /chung-vui Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the text `<input>` + "Mở thiệp" button on the `/chung-vui` password gate with a phone-unlock-style PIN keypad (4 dots + numeric grid), auto-checking as soon as 4 digits are entered.

**Architecture:** New presentational `PinKeypad` component (dots + digit grid + physical-keyboard capture, no password knowledge) consumed by `SharedInvite.tsx`, which owns the domain logic (comparing to `'2307'`, error/retry timing).

**Tech Stack:** React 19, Vitest + Testing Library (`user-event`, fake timers).

**Spec:** `docs/superpowers/specs/2026-07-16-pin-keypad-design.md`

---

## Task 1: `PinKeypad` component

**Files:**
- Create: `src/components/PinKeypad.tsx`
- Create: `src/components/PinKeypad.css`
- Test: `src/components/PinKeypad.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/PinKeypad.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PinKeypad } from './PinKeypad'

function renderKeypad(value = '') {
  const onChange = vi.fn()
  render(<PinKeypad value={value} maxLength={4} onChange={onChange} />)
  return onChange
}

describe('PinKeypad', () => {
  it('renders filled dots matching the current value length', () => {
    const { container } = render(<PinKeypad value="23" maxLength={4} onChange={vi.fn()} />)
    expect(container.querySelectorAll('.pin-keypad-dot-filled')).toHaveLength(2)
  })

  it('calls onChange with the digit appended when a number key is clicked', async () => {
    const user = userEvent.setup()
    const onChange = renderKeypad('23')

    await user.click(screen.getByRole('button', { name: '0' }))

    expect(onChange).toHaveBeenCalledWith('230')
  })

  it('calls onChange with the last digit removed when the backspace key is clicked', async () => {
    const user = userEvent.setup()
    const onChange = renderKeypad('230')

    await user.click(screen.getByRole('button', { name: 'Xoá' }))

    expect(onChange).toHaveBeenCalledWith('23')
  })

  it('does not call onChange when a digit is clicked at maxLength', async () => {
    const user = userEvent.setup()
    const onChange = renderKeypad('2307')

    await user.click(screen.getByRole('button', { name: '1' }))

    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not call onChange when backspace is clicked on an empty value', async () => {
    const user = userEvent.setup()
    const onChange = renderKeypad('')

    await user.click(screen.getByRole('button', { name: 'Xoá' }))

    expect(onChange).not.toHaveBeenCalled()
  })

  it('appends a digit when the matching physical keyboard key is pressed', async () => {
    const user = userEvent.setup()
    const onChange = renderKeypad('2')

    await user.keyboard('3')

    expect(onChange).toHaveBeenCalledWith('23')
  })

  it('removes the last digit when the physical Backspace key is pressed', async () => {
    const user = userEvent.setup()
    const onChange = renderKeypad('23')

    await user.keyboard('{Backspace}')

    expect(onChange).toHaveBeenCalledWith('2')
  })

  it('ignores digit keys held with Ctrl', async () => {
    const user = userEvent.setup()
    const onChange = renderKeypad('2')

    await user.keyboard('{Control>}3{/Control}')

    expect(onChange).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/PinKeypad.test.tsx`
Expected: FAIL — `Cannot find module './PinKeypad'`

- [ ] **Step 3: Write the CSS**

```css
/* src/components/PinKeypad.css */
.pin-keypad {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.pin-keypad-dots {
  display: flex;
  gap: var(--space-3);
}

.pin-keypad-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  background: transparent;
  transition:
    background-color 150ms ease,
    border-color 150ms ease;
}

.pin-keypad-dot-filled {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.pin-keypad-dots-shake {
  animation: pin-shake 400ms ease;
}

.pin-keypad-dots-shake .pin-keypad-dot-filled {
  background: var(--color-destructive);
  border-color: var(--color-destructive);
}

@keyframes pin-shake {
  10%,
  90% {
    transform: translateX(-2px);
  }
  20%,
  80% {
    transform: translateX(4px);
  }
  30%,
  50%,
  70% {
    transform: translateX(-8px);
  }
  40%,
  60% {
    transform: translateX(8px);
  }
}

.pin-keypad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}

.pin-keypad-key {
  width: 60px;
  height: 60px;
  min-width: 44px;
  min-height: 44px;
  border-radius: 50%;
  border: none;
  background: var(--color-muted);
  color: var(--color-foreground);
  font-family: var(--font-body);
  font-size: 1.3rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pin-keypad-key:hover {
  background: var(--color-border);
}

.pin-keypad-key-spacer {
  background: none;
  cursor: default;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .pin-keypad-dots-shake {
    animation: none;
  }
}
```

- [ ] **Step 4: Write the component**

```tsx
// src/components/PinKeypad.tsx
import { useEffect } from 'react'
import './PinKeypad.css'

export interface PinKeypadProps {
  value: string
  maxLength: number
  onChange: (value: string) => void
  shake?: boolean
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

export function PinKeypad({ value, maxLength, onChange, shake = false }: PinKeypadProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key >= '0' && e.key <= '9') {
        if (value.length < maxLength) onChange(value + e.key)
      } else if (e.key === 'Backspace') {
        if (value.length > 0) onChange(value.slice(0, -1))
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [value, maxLength, onChange])

  function pressDigit(digit: string) {
    if (value.length < maxLength) onChange(value + digit)
  }

  function pressBackspace() {
    if (value.length === 0) return
    onChange(value.slice(0, -1))
  }

  return (
    <div className="pin-keypad">
      <div className={`pin-keypad-dots${shake ? ' pin-keypad-dots-shake' : ''}`}>
        {Array.from({ length: maxLength }).map((_, i) => (
          <span
            key={i}
            className={`pin-keypad-dot${i < value.length ? ' pin-keypad-dot-filled' : ''}`}
          />
        ))}
      </div>
      <div className="pin-keypad-grid">
        {KEYS.map((digit) => (
          <button
            key={digit}
            type="button"
            className="pin-keypad-key"
            onClick={() => pressDigit(digit)}
          >
            {digit}
          </button>
        ))}
        <span className="pin-keypad-key pin-keypad-key-spacer" aria-hidden="true" />
        <button type="button" className="pin-keypad-key" onClick={() => pressDigit('0')}>
          0
        </button>
        <button
          type="button"
          className="pin-keypad-key"
          onClick={pressBackspace}
          aria-label="Xoá"
        >
          ⌫
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/PinKeypad.test.tsx`
Expected: PASS (8 tests)

- [ ] **Step 6: Commit**

```bash
git add src/components/PinKeypad.tsx src/components/PinKeypad.css src/components/PinKeypad.test.tsx
git commit -m "feat: add PinKeypad component"
```

---

## Task 2: Wire `PinKeypad` into `SharedInvite.tsx`

**Files:**
- Modify: `src/pages/SharedInvite.tsx`
- Modify: `src/pages/SharedInvite.css`
- Modify: `src/pages/SharedInvite.test.tsx` (rewrite the gate-related tests)

- [ ] **Step 1: Rewrite the test file's gate-related tests (failing first)**

Replace the full contents of `src/pages/SharedInvite.test.tsx` with:

```tsx
// src/pages/SharedInvite.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MotionGlobalConfig } from 'motion/react'
import { createQueryBuilderMock } from '../test/supabaseMock'

MotionGlobalConfig.skipAnimations = true

vi.mock('../lib/supabaseClient', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabaseClient'
import { SharedInvite } from './SharedInvite'

const eventSettings = {
  id: 1,
  event_name: 'Lễ tốt nghiệp',
  event_datetime: '2026-08-15T09:00:00Z',
  venue_name: 'Hội trường A',
  venue_address: '123 Đường ABC',
  map_embed_url: '',
  cover_image_url: 'https://res.cloudinary.com/demo/cover.jpg',
  public_invite_message: 'Kính mời các bạn đến chung vui cùng mình nhé!',
}

function mockLoadSuccess() {
  const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>
  fromMock.mockImplementation((table: string) => {
    if (table === 'event_settings') {
      return createQueryBuilderMock({ data: eventSettings, error: null })
    }
    return createQueryBuilderMock({ data: [], error: null })
  })
  return fromMock
}

async function enterPin(user: ReturnType<typeof userEvent.setup>, digits: string) {
  for (const digit of digits) {
    await user.click(screen.getByRole('button', { name: digit }))
  }
}

describe('SharedInvite', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  it('shows the password gate keypad by default', () => {
    mockLoadSuccess()
    render(<SharedInvite />)

    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
    expect(screen.queryByText('Lễ tốt nghiệp')).not.toBeInTheDocument()
  })

  it('shows an error, clears the pin after a wrong attempt, and unlocks on a correct retry', async () => {
    mockLoadSuccess()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<SharedInvite />)

    await enterPin(user, '0000')
    expect(await screen.findByText('Sai mật khẩu, vui lòng thử lại.')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(600)
    expect(screen.queryByText('Sai mật khẩu, vui lòng thử lại.')).not.toBeInTheDocument()

    await enterPin(user, '2307')
    expect(await screen.findByText('Lễ tốt nghiệp')).toBeInTheDocument()
  })

  it('unlocks the shared invite when the correct 4 digits are entered', async () => {
    mockLoadSuccess()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<SharedInvite />)

    await enterPin(user, '2307')

    expect(await screen.findByText('Lễ tốt nghiệp')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Xem lời mời riêng dành cho bạn' })
    ).toBeInTheDocument()
  })

  it('unlocks when the correct digits are typed on a physical keyboard', async () => {
    mockLoadSuccess()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<SharedInvite />)

    await user.keyboard('2307')

    expect(await screen.findByText('Lễ tốt nghiệp')).toBeInTheDocument()
  })

  it('opens the generic PublicEnvelopeModal from the CTA and shows the real fetched message', async () => {
    mockLoadSuccess()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<SharedInvite />)

    await enterPin(user, '2307')
    await user.click(
      await screen.findByRole('button', { name: 'Xem lời mời riêng dành cho bạn' })
    )

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    const envelopeButton = screen.getByRole('button', { name: 'Chạm để mở thư' })
    expect(envelopeButton).toBeInTheDocument()

    await user.click(envelopeButton)
    await vi.advanceTimersByTimeAsync(2200)

    expect(await screen.findByText(eventSettings.public_invite_message)).toBeInTheDocument()
  })

  it('resets to the gate on a fresh mount (no persistence across reloads)', () => {
    mockLoadSuccess()
    const { unmount } = render(<SharedInvite />)
    unmount()

    render(<SharedInvite />)

    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/SharedInvite.test.tsx`
Expected: FAIL (old `SharedInvite.tsx` still renders the text input, so `getByRole('button', { name: '1' })` etc. won't be found)

- [ ] **Step 3: Rewrite `SharedInvite.tsx`**

Replace the full file contents with:

```tsx
// src/pages/SharedInvite.tsx
import { useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { useEventInfo } from '../hooks/useEventInfo'
import { EventInfoSections } from '../components/EventInfoSections'
import { PublicEnvelopeModal } from '../components/PublicEnvelopeModal'
import { PinKeypad } from '../components/PinKeypad'
import { InviteFrame } from '../components/InviteFrame'
import { MusicPlayerWidget } from '../components/MusicPlayerWidget'
import { SparkleIcon } from '../components/icons'
import { HOST_NAME } from '../lib/constants'
import '../styles/tokens.css'
import '../styles/public-shared.css'
import './PublicInvite.css'
import './HomePage.css'
import './SharedInvite.css'

const SHARED_INVITE_PASSWORD = '2307'
const PIN_ERROR_RESET_MS = 600

type GateState = 'gate' | 'unlocked'

export function SharedInvite() {
  const [gateState, setGateState] = useState<GateState>('gate')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const { settings, gallery, loading, error, reload } = useEventInfo()

  function handlePinChange(next: string) {
    setPin(next)
    setPinError(false)
    if (next.length === 4) {
      if (next === SHARED_INVITE_PASSWORD) {
        setGateState('unlocked')
      } else {
        setPinError(true)
        setTimeout(() => {
          setPin('')
          setPinError(false)
        }, PIN_ERROR_RESET_MS)
      }
    }
  }

  if (gateState === 'gate') {
    return (
      <div className="home-page">
        <InviteFrame>
          <div className="home-hero">
            <SparkleIcon className="home-hero-sparkle home-hero-sparkle-1" />
            <SparkleIcon className="home-hero-sparkle home-hero-sparkle-2" />
            <span className="home-hero-pill home-hero-pill-happy">Happy</span>
            <h1 className="home-hero-title">Graduation</h1>
            <span className="home-hero-pill home-hero-pill-name">{HOST_NAME}</span>
          </div>

          <div className="home-message-zone">
            <p className="home-message">
              Cảm ơn vì đã là một phần rực rỡ trong những năm tháng thanh xuân của mình.
              Nhập mật khẩu để cùng mở ra tấm vé đến ngày lễ tốt nghiệp nhé!
            </p>
            <MusicPlayerWidget />
          </div>

          <div className="home-search-section">
            <p className="home-search-label">Vui lòng nhập mật khẩu❤️</p>
            <PinKeypad value={pin} maxLength={4} onChange={handlePinChange} shake={pinError} />
            {pinError && (
              <p className="shared-invite-gate-error" role="alert">
                Sai mật khẩu, vui lòng thử lại.
              </p>
            )}
          </div>
        </InviteFrame>
      </div>
    )
  }

  if (loading) return <p className="page-loading">Đang tải...</p>

  if (error) {
    return (
      <div className="page-error">
        <p role="alert">{error}</p>
        <button className="retry-button" type="button" onClick={reload}>
          Thử lại
        </button>
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="public-invite-page">
      <InviteFrame>
        <EventInfoSections settings={settings} gallery={gallery} />

        <div className="public-invite-section public-invite-cta-section">
          <button
            type="button"
            className="public-invite-cta"
            onClick={() => setInviteOpen(true)}
          >
            Xem lời mời riêng dành cho bạn
          </button>
        </div>
      </InviteFrame>

      <MusicPlayerWidget variant="floating" />

      <AnimatePresence>
        {inviteOpen && (
          <PublicEnvelopeModal
            message={settings.public_invite_message}
            onClose={() => setInviteOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 4: Replace `SharedInvite.css`**

```css
/* src/pages/SharedInvite.css */
.shared-invite-gate-error {
  margin: var(--space-2) 0 0;
  font-size: 0.85rem;
  color: var(--color-destructive);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/pages/SharedInvite.test.tsx`
Expected: PASS (6 tests)

- [ ] **Step 6: Commit**

```bash
git add src/pages/SharedInvite.tsx src/pages/SharedInvite.css src/pages/SharedInvite.test.tsx
git commit -m "feat: replace password input with PinKeypad on /chung-vui gate"
```

---

## Task 3: Full regression pass

**Files:** none (verification only)

- [ ] **Step 1: Run the entire test suite**

Run: `npx vitest run`
Expected: PASS — every suite green.

- [ ] **Step 2: Type-check and build**

Run: `npm run build`
Expected: succeeds (`tsc -b` reports no errors, `vite build` completes).

- [ ] **Step 3: Manual smoke check (dev server)**

Run: `npm run dev`, then in a browser visit `/chung-vui`:
1. See 4 empty dots + numeric keypad, no text input.
2. Tap 4 wrong digits → dots flash red/shake, error text shows, then clears after ~0.6s.
3. Tap the correct 4 digits (2-3-0-7) → unlocks into the shared invite.
4. On a computer, refresh and try typing `2307` on the physical keyboard → also unlocks.
5. Refresh again → back to the empty keypad (no persistence).

