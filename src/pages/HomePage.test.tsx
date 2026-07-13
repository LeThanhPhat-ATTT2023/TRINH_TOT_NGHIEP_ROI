// src/pages/HomePage.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../components/NameSearchBox', () => ({
  NameSearchBox: () => <div>NameSearchBox stub</div>,
}))

import { MusicPlayerContext } from '../context/MusicPlayerContext'
import { HomePage } from './HomePage'

describe('HomePage', () => {
  it('shows the Happy Graduation heading with the host name', () => {
    render(<HomePage />)

    expect(screen.getByText('Happy')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Graduation' })).toBeInTheDocument()
    expect(screen.getByText('Ngọc Trinh')).toBeInTheDocument()
  })

  it('shows the guest name search below the heading', () => {
    render(<HomePage />)

    expect(
      screen.getByText('Vui lòng nhập tên của bạn❤️')
    ).toBeInTheDocument()
    expect(screen.getByText('NameSearchBox stub')).toBeInTheDocument()
  })

  it('shows the thank-you message inviting guests to enter their name', () => {
    render(<HomePage />)

    expect(
      screen.getByText(/Cảm ơn vì đã là một phần rực rỡ/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Nhập tên để cùng mở ra tấm vé/)
    ).toBeInTheDocument()
  })

  it('renders the music widget when the context has tracks', () => {
    render(
      <MusicPlayerContext.Provider
        value={{
          hasTracks: true,
          isPlaying: false,
          togglePlay: () => {},
          next: () => {},
          prev: () => {},
        }}
      >
        <HomePage />
      </MusicPlayerContext.Provider>
    )

    expect(screen.getByRole('button', { name: 'Phát nhạc' })).toBeInTheDocument()
  })
})
