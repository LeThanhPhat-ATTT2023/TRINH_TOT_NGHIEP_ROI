// src/context/MusicPlayerContext.tsx
import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import YouTube from 'react-youtube'
import type { YouTubeEvent, YouTubePlayer } from 'react-youtube'
import { supabase } from '../lib/supabaseClient'
import { parseYoutubeId } from '../lib/youtube'
import type { MusicTrack } from '../types/database'

export interface MusicPlayerContextValue {
  hasTracks: boolean
  isPlaying: boolean
  togglePlay: () => void
  next: () => void
  prev: () => void
}

const defaultValue: MusicPlayerContextValue = {
  hasTracks: false,
  isPlaying: false,
  togglePlay: () => {},
  next: () => {},
  prev: () => {},
}

export const MusicPlayerContext = createContext<MusicPlayerContextValue>(defaultValue)

const hiddenPlayerStyle = {
  position: 'absolute' as const,
  width: 1,
  height: 1,
  opacity: 0,
  overflow: 'hidden' as const,
  pointerEvents: 'none' as const,
}

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [videoIds, setVideoIds] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('music_tracks')
      .select('*')
      .order('sort_order', { ascending: true })
      .then((result: { data: MusicTrack[] | null; error: { message: string } | null }) => {
        if (cancelled || result.error || !result.data) return
        const ids = result.data
          .map((track) => parseYoutubeId(track.youtube_url))
          .filter((id): id is string => id !== null)
        setVideoIds(ids)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function handleFirstInteraction() {
      startedRef.current = true
      playerRef.current?.playVideo()
    }
    // Listen for 'click' rather than 'pointerdown': browsers only treat a
    // limited set of events (click, keydown, touchend) as a legitimate user
    // gesture for autoplay-unlock purposes, and — since a click is a single
    // native event that traverses capture-then-bubble synchronously — this
    // capture-phase listener and React's bubble-phase onClick handlers (e.g.
    // a play/pause button that is itself the first click) resolve within the
    // same batched update instead of an intervening render reading stale state.
    document.addEventListener('click', handleFirstInteraction, {
      once: true,
      capture: true,
    })
    return () => document.removeEventListener('click', handleFirstInteraction, { capture: true })
  }, [])

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      playerRef.current?.pauseVideo()
    } else {
      startedRef.current = true
      playerRef.current?.playVideo()
    }
  }, [isPlaying])

  const next = useCallback(() => {
    setCurrentIndex((i) => (videoIds.length === 0 ? 0 : (i + 1) % videoIds.length))
  }, [videoIds.length])

  const prev = useCallback(() => {
    setCurrentIndex((i) =>
      videoIds.length === 0 ? 0 : (i - 1 + videoIds.length) % videoIds.length
    )
  }, [videoIds.length])

  function handleReady(event: YouTubeEvent) {
    playerRef.current = event.target
    if (startedRef.current) {
      event.target.playVideo()
    }
  }

  function handleStateChange(event: YouTubeEvent<number>) {
    setIsPlaying(event.data === YouTube.PlayerState.PLAYING)
  }

  const value: MusicPlayerContextValue = {
    hasTracks: videoIds.length > 0,
    isPlaying,
    togglePlay,
    next,
    prev,
  }

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
      {videoIds.length > 0 && (
        <div style={hiddenPlayerStyle} aria-hidden="true">
          <YouTube
            videoId={videoIds[currentIndex]}
            opts={{ playerVars: { autoplay: 0, controls: 0 } }}
            onReady={handleReady}
            onStateChange={handleStateChange}
            onEnd={next}
          />
        </div>
      )}
    </MusicPlayerContext.Provider>
  )
}
