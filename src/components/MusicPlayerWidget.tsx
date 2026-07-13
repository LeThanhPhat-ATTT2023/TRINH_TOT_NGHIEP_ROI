// src/components/MusicPlayerWidget.tsx
import { useMusicPlayer } from '../hooks/useMusicPlayer'
import { ChevronIcon, MusicNoteIcon } from './icons'
import './MusicPlayerWidget.css'

export interface MusicPlayerWidgetProps {
  variant?: 'inline' | 'floating'
}

export function MusicPlayerWidget({ variant = 'inline' }: MusicPlayerWidgetProps) {
  const { hasTracks, isPlaying, togglePlay, next, prev } = useMusicPlayer()

  if (!hasTracks) return null

  const className = variant === 'floating' ? 'music-widget music-widget-floating' : 'music-widget'

  return (
    <div className={className}>
      <button type="button" className="music-widget-side" onClick={prev} aria-label="Bài trước">
        <ChevronIcon className="music-widget-chevron music-widget-chevron-prev" />
      </button>
      <button
        type="button"
        className="music-widget-play"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Tạm dừng nhạc' : 'Phát nhạc'}
        aria-pressed={isPlaying}
      >
        <MusicNoteIcon className="music-widget-note" />
        {isPlaying && <span className="music-widget-dot" aria-hidden="true" />}
      </button>
      <button
        type="button"
        className="music-widget-side"
        onClick={next}
        aria-label="Bài tiếp theo"
      >
        <ChevronIcon className="music-widget-chevron music-widget-chevron-next" />
      </button>
    </div>
  )
}
