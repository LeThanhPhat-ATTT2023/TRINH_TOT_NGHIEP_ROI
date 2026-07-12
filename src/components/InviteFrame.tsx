// src/components/InviteFrame.tsx
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import './InviteFrame.css'

const WAVE_INSET = 12 // centerline distance from card edge
const CORNER_RADIUS = 26
const WAVE_AMPLITUDE = 5
const HALF_WAVE_TARGET = 30 // target length of one hump, px

/**
 * Builds one continuous wavy rounded-rectangle path sized exactly to the
 * card, so the border never has seams regardless of the card's dimensions.
 * Humps are distributed evenly per edge and joined by quarter-circle corners.
 */
function buildWavyPath(w: number, h: number): string {
  const c = WAVE_INSET
  const R = CORNER_RADIUS
  const bulge = 2 * WAVE_AMPLITUDE // quadratic control offset -> amp deviation

  const horiz = w - 2 * (c + R)
  const vert = h - 2 * (c + R)
  const nTop = Math.max(2, Math.round(horiz / HALF_WAVE_TARGET))
  const nSide = Math.max(2, Math.round(vert / HALF_WAVE_TARGET))
  const segH = horiz / nTop
  const segV = vert / nSide

  let d = `M ${c + R} ${c}`
  // top edge, left -> right
  for (let i = 0; i < nTop; i++) {
    const sign = i % 2 === 0 ? -1 : 1
    const x0 = c + R + i * segH
    d += ` Q ${x0 + segH / 2} ${c + sign * bulge} ${x0 + segH} ${c}`
  }
  d += ` A ${R} ${R} 0 0 1 ${w - c} ${c + R}`
  // right edge, top -> bottom
  for (let i = 0; i < nSide; i++) {
    const sign = i % 2 === 0 ? 1 : -1
    const y0 = c + R + i * segV
    d += ` Q ${w - c + sign * bulge} ${y0 + segV / 2} ${w - c} ${y0 + segV}`
  }
  d += ` A ${R} ${R} 0 0 1 ${w - c - R} ${h - c}`
  // bottom edge, right -> left
  for (let i = 0; i < nTop; i++) {
    const sign = i % 2 === 0 ? 1 : -1
    const x0 = w - c - R - i * segH
    d += ` Q ${x0 - segH / 2} ${h - c + sign * bulge} ${x0 - segH} ${h - c}`
  }
  d += ` A ${R} ${R} 0 0 1 ${c} ${h - c - R}`
  // left edge, bottom -> top
  for (let i = 0; i < nSide; i++) {
    const sign = i % 2 === 0 ? -1 : 1
    const y0 = h - c - R - i * segV
    d += ` Q ${c + sign * bulge} ${y0 - segV / 2} ${c} ${y0 - segV}`
  }
  d += ` A ${R} ${R} 0 0 1 ${c + R} ${c}`
  return d + ' Z'
}

function Sparkle({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="#f2a93b" />
    </svg>
  )
}

export function InviteFrame({ children }: { children: ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)

  useLayoutEffect(() => {
    const el = cardRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const update = () => {
      const w = el.offsetWidth
      const h = el.offsetHeight
      setSize((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const hasWave = size !== null && size.w > 100 && size.h > 100

  return (
    <div className="invite-frame">
      <div ref={cardRef} className={`invite-frame-card${hasWave ? ' invite-frame-card-wave' : ''}`}>
        {hasWave && (
          <svg
            className="invite-frame-wave"
            width={size.w}
            height={size.h}
            viewBox={`0 0 ${size.w} ${size.h}`}
            aria-hidden="true"
          >
            <path
              d={buildWavyPath(size.w, size.h)}
              fill="#faf6e8"
              stroke="#c0447a"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
        )}
        <Sparkle className="invite-frame-sparkle invite-frame-sparkle-top-left" />
        <div className="invite-frame-body">{children}</div>
        <Sparkle className="invite-frame-sparkle invite-frame-sparkle-bottom-right" />
      </div>
    </div>
  )
}
