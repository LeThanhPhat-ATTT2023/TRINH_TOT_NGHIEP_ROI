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
})
