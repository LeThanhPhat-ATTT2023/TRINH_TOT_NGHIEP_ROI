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
  full_name: 'Nguyá»…n VÄƒn A',
  salutation: 'Anh',
  greeting_message: 'ChÃºc má»«ng nhÃ©!',
  message_by_guest: null,
  rsvp_status: 'pending' as const,
  rsvp_responded_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const eventSettings = {
  id: 1,
  event_name: 'Lá»… tá»‘t nghiá»‡p',
  event_datetime: '2026-08-15T09:00:00Z',
  venue_name: 'Há»™i trÆ°á»ng A',
  venue_address: '123 ÄÆ°á»ng ABC',
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

    expect(await screen.findByText('KÃ­nh má»i Anh Nguyá»…n VÄƒn A')).toBeInTheDocument()
    expect(screen.getByText('ChÃºc má»«ng nhÃ©!')).toBeInTheDocument()
    expect(screen.getByText('Lá»… tá»‘t nghiá»‡p')).toBeInTheDocument()
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

    expect(await screen.findByText('KhÃ´ng tÃ¬m tháº¥y thiá»‡p má»i nÃ y.')).toBeInTheDocument()
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
    await screen.findByText('KÃ­nh má»i Anh Nguyá»…n VÄƒn A')

    await user.click(screen.getByRole('button', { name: 'TÃ´i sáº½ tham dá»±' }))

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
    await screen.findByText('KÃ­nh má»i Anh Nguyá»…n VÄƒn A')

    await user.click(screen.getByRole('button', { name: 'TÃ´i sáº½ tham dá»±' }))

    expect(
      await screen.findByText('Gá»­i pháº£n há»“i tháº¥t báº¡i, vui lÃ²ng thá»­ láº¡i.')
    ).toBeInTheDocument()
  })
})

