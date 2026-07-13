// src/context/MusicPlayerContext.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createQueryBuilderMock } from '../test/supabaseMock'

vi.mock('../lib/supabaseClient', () => ({
  supabase: { from: vi.fn() },
}))

// Self-contained mock: playVideo()/pauseVideo() synchronously fire onStateChange
// with the matching PlayerState, like the real player does. Deliberately does
// NOT close over any outer `const` — vi.mock factories run before top-level
// `const`s are initialized (Vitest hoists vi.mock calls above imports), so
// referencing an outer variable here would hit a temporal-dead-zone error.
vi.mock('react-youtube', async () => {
  const { useEffect, useRef } = await import('react')
  function MockYouTube(props: {
    videoId?: string
    opts?: { playerVars?: { autoplay?: number } }
    onReady?: (event: { target: unknown }) => void
    onStateChange?: (event: { data: number }) => void
  }) {
    // Fire onReady once per mount (via effect), matching the real player's
    // componentDidMount timing — NOT on every render, which would re-invoke
    // the ready handler after every state update (e.g. after a pause) and
    // mask bugs that only show up when ready fires exactly once.
    useEffect(() => {
      const player = {
        playVideo: () => props.onStateChange?.({ data: 1 }),
        pauseVideo: () => props.onStateChange?.({ data: 2 }),
      }
      props.onReady?.({ target: player })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    // Mirrors the real react-youtube's `updateVideo()`: whenever the videoId
    // prop changes (next/prev/onEnd), it calls loadVideoById (autoplay ->
    // fires PLAYING) if opts.playerVars.autoplay is 1, otherwise cueVideoById
    // (fires CUED, i.e. loaded but paused). Skipped on the initial mount,
    // which the `onReady` effect above already covers.
    const mountedRef = useRef(false)
    useEffect(() => {
      if (!mountedRef.current) {
        mountedRef.current = true
        return
      }
      const autoplay = props.opts?.playerVars?.autoplay === 1
      props.onStateChange?.({ data: autoplay ? 1 : 5 })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.videoId])
    return null
  }
  MockYouTube.PlayerState = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 }
  return { default: MockYouTube }
})

import { supabase } from '../lib/supabaseClient'
import { MusicPlayerProvider } from './MusicPlayerContext'
import { useMusicPlayer } from '../hooks/useMusicPlayer'

function Consumer() {
  const { hasTracks, isPlaying, togglePlay, next, prev } = useMusicPlayer()
  return (
    <div>
      <span>hasTracks:{String(hasTracks)}</span>
      <span>isPlaying:{String(isPlaying)}</span>
      <button onClick={togglePlay}>toggle</button>
      <button onClick={next}>next</button>
      <button onClick={prev}>prev</button>
    </div>
  )
}

const tracks = [
  { id: '1', youtube_url: 'https://youtu.be/aaaaaaaaaaa', sort_order: 0, created_at: '2026-01-01T00:00:00Z' },
  { id: '2', youtube_url: 'https://youtu.be/bbbbbbbbbbb', sort_order: 1, created_at: '2026-01-01T00:00:00Z' },
]

describe('MusicPlayerProvider', () => {
  it('starts with hasTracks false and flips to true once the playlist loads', async () => {
    const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>
    fromMock.mockImplementation(() => createQueryBuilderMock({ data: tracks, error: null }))

    render(
      <MusicPlayerProvider>
        <Consumer />
      </MusicPlayerProvider>
    )

    expect(await screen.findByText('hasTracks:true')).toBeInTheDocument()
  })

  it('starts playback on the first pointerdown anywhere on the document', async () => {
    const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>
    fromMock.mockImplementation(() => createQueryBuilderMock({ data: tracks, error: null }))
    const user = userEvent.setup()

    render(
      <MusicPlayerProvider>
        <Consumer />
      </MusicPlayerProvider>
    )
    await screen.findByText('hasTracks:true')

    expect(screen.getByText('isPlaying:false')).toBeInTheDocument()
    await user.click(document.body)

    expect(await screen.findByText('isPlaying:true')).toBeInTheDocument()
  })

  it('toggles isPlaying when togglePlay is clicked', async () => {
    const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>
    fromMock.mockImplementation(() => createQueryBuilderMock({ data: tracks, error: null }))
    const user = userEvent.setup()

    render(
      <MusicPlayerProvider>
        <Consumer />
      </MusicPlayerProvider>
    )
    await screen.findByText('hasTracks:true')

    await user.click(screen.getByText('toggle'))
    expect(await screen.findByText('isPlaying:true')).toBeInTheDocument()

    await user.click(screen.getByText('toggle'))
    expect(await screen.findByText('isPlaying:false')).toBeInTheDocument()
  })

  it('keeps playing the next track automatically when next is clicked while playing', async () => {
    const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>
    fromMock.mockImplementation(() => createQueryBuilderMock({ data: tracks, error: null }))
    const user = userEvent.setup()

    render(
      <MusicPlayerProvider>
        <Consumer />
      </MusicPlayerProvider>
    )
    await screen.findByText('hasTracks:true')

    await user.click(screen.getByText('toggle'))
    expect(await screen.findByText('isPlaying:true')).toBeInTheDocument()

    // onEnd (auto-advance when a track finishes) calls this same `next`
    // callback, so this also covers the "song ends -> next one auto-plays"
    // path without needing a separate onEnd simulation.
    await user.click(screen.getByText('next'))
    expect(await screen.findByText('isPlaying:true')).toBeInTheDocument()
  })

  it('does not force playback when next is clicked while paused', async () => {
    const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>
    fromMock.mockImplementation(() => createQueryBuilderMock({ data: tracks, error: null }))
    const user = userEvent.setup()

    render(
      <MusicPlayerProvider>
        <Consumer />
      </MusicPlayerProvider>
    )
    await screen.findByText('hasTracks:true')

    // Start, then explicitly pause, so this exercises a real "paused after
    // playing" state rather than the page's very first click (which is its
    // own autoplay-unlock gesture and would start playback regardless of
    // which button it lands on).
    await user.click(screen.getByText('toggle'))
    expect(await screen.findByText('isPlaying:true')).toBeInTheDocument()
    await user.click(screen.getByText('toggle'))
    expect(await screen.findByText('isPlaying:false')).toBeInTheDocument()

    await user.click(screen.getByText('next'))
    expect(screen.getByText('isPlaying:false')).toBeInTheDocument()
  })

  it('stays at hasTracks false when the playlist is empty', async () => {
    const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>
    fromMock.mockImplementation(() => createQueryBuilderMock({ data: [], error: null }))

    render(
      <MusicPlayerProvider>
        <Consumer />
      </MusicPlayerProvider>
    )

    await screen.findByText('hasTracks:false')
  })
})
