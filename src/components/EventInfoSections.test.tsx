// src/components/EventInfoSections.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EventInfoSections } from './EventInfoSections'

const fullSettings = {
  id: 1,
  event_name: 'Lễ tốt nghiệp',
  event_datetime: '2026-08-15T09:00:00Z',
  venue_name: 'Hội trường A',
  venue_address: '123 Đường ABC',
  map_embed_url: 'https://maps.google.com/embed',
  cover_image_url: 'https://res.cloudinary.com/demo/cover.jpg',
  public_invite_message: null,
}

const gallery = [
  {
    id: 'g1',
    image_url: 'https://res.cloudinary.com/demo/photo.jpg',
    caption: null,
    sort_order: 0,
    created_at: '2026-01-01T00:00:00Z',
  },
]

describe('EventInfoSections', () => {
  it('renders the event name, cover photo, and venue when all data is present', () => {
    render(<EventInfoSections settings={fullSettings} gallery={gallery} />)

    expect(screen.getByText('Lễ tốt nghiệp')).toBeInTheDocument()
    expect(screen.getByAltText('Ảnh tốt nghiệp của Ngọc Trinh')).toHaveAttribute(
      'src',
      'https://res.cloudinary.com/demo/cover.jpg'
    )
    expect(screen.getByText('Hội trường A')).toBeInTheDocument()
  })

  it('hides the cover photo and venue sections when their data is missing', () => {
    const minimalSettings = {
      ...fullSettings,
      cover_image_url: null,
      venue_name: null,
      event_datetime: null,
      map_embed_url: null,
    }

    render(<EventInfoSections settings={minimalSettings} gallery={[]} />)

    expect(screen.getByText('Lễ tốt nghiệp')).toBeInTheDocument()
    expect(screen.queryByAltText('Ảnh tốt nghiệp của Ngọc Trinh')).not.toBeInTheDocument()
    expect(screen.queryByText('Hội trường A')).not.toBeInTheDocument()
  })
})
