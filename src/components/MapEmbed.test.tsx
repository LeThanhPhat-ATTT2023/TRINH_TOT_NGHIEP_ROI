// src/components/MapEmbed.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MapEmbed } from './MapEmbed'

describe('MapEmbed', () => {
  it('renders an iframe with the given url', () => {
    render(<MapEmbed mapEmbedUrl="https://maps.google.com/embed" />)
    expect(screen.getByTitle('Bản đồ vị trí sự kiện')).toHaveAttribute(
      'src',
      'https://maps.google.com/embed'
    )
  })

  it('renders nothing when there is no url', () => {
    const { container } = render(<MapEmbed mapEmbedUrl={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a placeholder instead of an iframe when the url is not a valid Google Maps embed link', () => {
    render(<MapEmbed mapEmbedUrl="/not-a-real-map" />)
    expect(screen.queryByTitle('Bản đồ vị trí sự kiện')).not.toBeInTheDocument()
    expect(screen.getByText('Bản đồ vị trí sẽ được cập nhật sớm.')).toBeInTheDocument()
  })
})
