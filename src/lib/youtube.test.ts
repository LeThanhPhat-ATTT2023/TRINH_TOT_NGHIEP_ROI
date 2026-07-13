// src/lib/youtube.test.ts
import { describe, expect, it } from 'vitest'
import { parseYoutubeId } from './youtube'

describe('parseYoutubeId', () => {
  it('extracts the id from a watch URL', () => {
    expect(parseYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts the id from a watch URL with extra query params', () => {
    expect(parseYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s')).toBe(
      'dQw4w9WgXcQ'
    )
  })

  it('extracts the id from a youtu.be short URL', () => {
    expect(parseYoutubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts the id from a youtu.be short URL with query params', () => {
    expect(parseYoutubeId('https://youtu.be/dQw4w9WgXcQ?si=abc123')).toBe('dQw4w9WgXcQ')
  })

  it('extracts the id from an embed URL', () => {
    expect(parseYoutubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts the id from a shorts URL', () => {
    expect(parseYoutubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('returns null for a non-YouTube URL', () => {
    expect(parseYoutubeId('https://example.com/watch?v=dQw4w9WgXcQ')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(parseYoutubeId('')).toBeNull()
  })
})
