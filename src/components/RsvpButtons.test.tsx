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

    await user.click(screen.getByRole('button', { name: 'Để sau' }))
    expect(onRespond).toHaveBeenCalledWith('maybe')
  })

  it('disables all three buttons while submitting', () => {
    render(<RsvpButtons status="pending" submitting onRespond={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Tôi sẽ tham dự' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Xin phép vắng mặt' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Để sau' })).toBeDisabled()
  })

  it('marks the current status as active', () => {
    render(<RsvpButtons status="attending" submitting={false} onRespond={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Tôi sẽ tham dự' })).toHaveClass(
      'rsvp-button-active'
    )
  })

  it('marks "Để sau" as active when status is maybe', () => {
    render(<RsvpButtons status="maybe" submitting={false} onRespond={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Để sau' })).toHaveClass('rsvp-button-active')
  })
})
