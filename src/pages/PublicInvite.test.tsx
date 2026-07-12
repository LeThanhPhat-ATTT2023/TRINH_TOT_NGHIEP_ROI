// src/pages/PublicInvite.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MotionGlobalConfig } from 'motion/react'
import { createQueryBuilderMock } from '../test/supabaseMock'

MotionGlobalConfig.skipAnimations = true

vi.mock('../lib/supabaseClient', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}))

import { supabase } from '../lib/supabaseClient'
import { PublicInvite } from './PublicInvite'

const guest = {
  id: '2',
  full_name: 'Nguyễn Văn A',
  salutation: 'Anh',
  greeting_message: null,
  message_by_guest: null,
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
  cover_image_url: 'https://res.cloudinary.com/demo/cover.jpg',
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

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/thiep-chung/:guestId?" element={<PublicInvite />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('PublicInvite', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  it('loads event settings and gallery, then shows them', async () => {
    mockLoadSuccess()

    renderAt('/thiep-chung')

    expect(await screen.findByText('Lễ tốt nghiệp')).toBeInTheDocument()
    expect(screen.getByText('Hội trường A')).toBeInTheDocument()
    expect(screen.getByAltText('Ảnh tốt nghiệp của Ngọc Trinh')).toHaveAttribute(
      'src',
      'https://res.cloudinary.com/demo/cover.jpg'
    )
  })

  it('does not show the guest name search (it moved to the homepage)', async () => {
    mockLoadSuccess()

    renderAt('/thiep-chung')

    await screen.findByText('Lễ tốt nghiệp')
    expect(
      screen.queryByText('Tìm tên của bạn trong danh sách khách mời')
    ).not.toBeInTheDocument()
  })

  it('opens the envelope popup when the personal invite button is clicked', async () => {
    mockLoadSuccess()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

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

  it('shows a retry button when loading fails, and reloads on click', async () => {
    const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>
    fromMock.mockImplementation((table: string) => {
      if (table === 'event_settings') {
        return createQueryBuilderMock({ data: null, error: { message: 'boom' } })
      }
      return createQueryBuilderMock({ data: [], error: null })
    })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    renderAt('/thiep-chung')

    await screen.findByText('Không tải được thông tin sự kiện.')

    mockLoadSuccess()
    await user.click(screen.getByRole('button', { name: 'Thử lại' }))

    await waitFor(() => expect(screen.getByText('Lễ tốt nghiệp')).toBeInTheDocument())
  })
})

