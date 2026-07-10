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
