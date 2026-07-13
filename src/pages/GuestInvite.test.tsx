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

