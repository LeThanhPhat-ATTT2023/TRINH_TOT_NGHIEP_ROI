// src/pages/admin/AdminGuestForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createQueryBuilderMock } from '../../test/supabaseMock'

vi.mock('../../lib/supabaseClient', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../../lib/supabaseClient'
import { AdminGuestForm } from './AdminGuestForm'

describe('AdminGuestForm', () => {
  const onClose = vi.fn()
  const onSaved = vi.fn()

  beforeEach(() => {
    onClose.mockReset()
    onSaved.mockReset()
  })

  it('creates a new guest and calls onSaved', async () => {
    const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>
    fromMock.mockReturnValue(createQueryBuilderMock({ data: null, error: null }))
    const user = userEvent.setup()

    render(<AdminGuestForm guestId={null} onClose={onClose} onSaved={onSaved} />)

    await user.type(screen.getByLabelText('TÃªn khÃ¡ch'), 'LÃª VÄƒn C')
    await user.click(screen.getByRole('button', { name: 'LÆ°u' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
    expect(fromMock).toHaveBeenCalledWith('guests')
  })

  it('loads an existing guest and populates the form', async () => {
    const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>
    fromMock.mockReturnValue(
      createQueryBuilderMock({
        data: {
          id: '1',
          full_name: 'Nguyá»…n VÄƒn A',
          salutation: 'Anh',
          greeting_message: 'ChÃºc má»«ng nhÃ©!',
  message_by_guest: null,
          rsvp_status: 'pending',
          rsvp_responded_at: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        error: null,
      })
    )

    render(<AdminGuestForm guestId="1" onClose={onClose} onSaved={onSaved} />)

    expect(await screen.findByDisplayValue('Nguyá»…n VÄƒn A')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ChÃºc má»«ng nhÃ©!')).toBeInTheDocument()
  })

  it('calls onClose when Huá»· is clicked', async () => {
    const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>
    fromMock.mockReturnValue(createQueryBuilderMock({ data: null, error: null }))
    const user = userEvent.setup()

    render(<AdminGuestForm guestId={null} onClose={onClose} onSaved={onSaved} />)
    await user.click(screen.getByRole('button', { name: 'Huá»·' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

