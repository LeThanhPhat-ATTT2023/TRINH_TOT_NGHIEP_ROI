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

describe('SharedInvite', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  it('shows the password gate by default', () => {
    mockLoadSuccess()
    render(<SharedInvite />)

    expect(screen.getByPlaceholderText('Nhập mật khẩu...')).toBeInTheDocument()
    expect(screen.queryByText('Lễ tốt nghiệp')).not.toBeInTheDocument()
  })

  it('shows an error and stays on the gate when the password is wrong', async () => {
    mockLoadSuccess()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<SharedInvite />)

    await user.type(screen.getByPlaceholderText('Nhập mật khẩu...'), '0000')
    await user.click(screen.getByRole('button', { name: 'Mở thiệp' }))

    expect(await screen.findByText('Sai mật khẩu, vui lòng thử lại.')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Nhập mật khẩu...')).toBeInTheDocument()
  })

  it('unlocks the shared invite when the correct password is entered', async () => {
    mockLoadSuccess()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<SharedInvite />)

    await user.type(screen.getByPlaceholderText('Nhập mật khẩu...'), '2307')
    await user.click(screen.getByRole('button', { name: 'Mở thiệp' }))

    expect(await screen.findByText('Lễ tốt nghiệp')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Xem lời mời riêng dành cho bạn' })
    ).toBeInTheDocument()
  })

  it('opens the generic PublicEnvelopeModal from the CTA and shows the real fetched message', async () => {
    mockLoadSuccess()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<SharedInvite />)

    await user.type(screen.getByPlaceholderText('Nhập mật khẩu...'), '2307')
    await user.click(screen.getByRole('button', { name: 'Mở thiệp' }))
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

    expect(screen.getByPlaceholderText('Nhập mật khẩu...')).toBeInTheDocument()
  })
})
