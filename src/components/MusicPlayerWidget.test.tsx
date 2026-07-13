// src/components/MusicPlayerWidget.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../hooks/useMusicPlayer', () => ({
  useMusicPlayer: vi.fn(),
}))

import { useMusicPlayer } from '../hooks/useMusicPlayer'
import { MusicPlayerWidget } from './MusicPlayerWidget'

describe('MusicPlayerWidget', () => {
  it('renders nothing when there are no tracks', () => {
    vi.mocked(useMusicPlayer).mockReturnValue({
      hasTracks: false,
      isPlaying: false,
      togglePlay: vi.fn(),
      next: vi.fn(),
      prev: vi.fn(),
    })

    const { container } = render(<MusicPlayerWidget />)
    expect(container).toBeEmptyDOMElement()
  })

  it('toggles play/pause when the center button is clicked', async () => {
    const togglePlay = vi.fn()
    vi.mocked(useMusicPlayer).mockReturnValue({
      hasTracks: true,
      isPlaying: false,
      togglePlay,
      next: vi.fn(),
      prev: vi.fn(),
    })
    const user = userEvent.setup()

    render(<MusicPlayerWidget />)
    await user.click(screen.getByRole('button', { name: 'Phát nhạc' }))

    expect(togglePlay).toHaveBeenCalledTimes(1)
  })

  it('calls next and prev when the side buttons are clicked', async () => {
    const next = vi.fn()
    const prev = vi.fn()
    vi.mocked(useMusicPlayer).mockReturnValue({
      hasTracks: true,
      isPlaying: true,
      togglePlay: vi.fn(),
      next,
      prev,
    })
    const user = userEvent.setup()

    render(<MusicPlayerWidget />)
    await user.click(screen.getByRole('button', { name: 'Bài tiếp theo' }))
    await user.click(screen.getByRole('button', { name: 'Bài trước' }))

    expect(next).toHaveBeenCalledTimes(1)
    expect(prev).toHaveBeenCalledTimes(1)
  })

  it('shows the pause label and pulsing dot while playing', () => {
    vi.mocked(useMusicPlayer).mockReturnValue({
      hasTracks: true,
      isPlaying: true,
      togglePlay: vi.fn(),
      next: vi.fn(),
      prev: vi.fn(),
    })

    render(<MusicPlayerWidget />)

    expect(screen.getByRole('button', { name: 'Tạm dừng nhạc' })).toBeInTheDocument()
  })
})
