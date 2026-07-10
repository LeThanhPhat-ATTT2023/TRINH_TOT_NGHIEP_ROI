// src/components/InviteFrame.tsx
import type { ReactNode } from 'react'
import './InviteFrame.css'

function ScallopEdge({ position }: { position: 'top' | 'bottom' }) {
  return (
    <svg
      className={`invite-frame-scallop invite-frame-scallop-${position}`}
      viewBox="0 0 200 20"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0,20 L0,10 Q10,0 20,10 Q30,20 40,10 Q50,0 60,10 Q70,20 80,10 Q90,0 100,10 Q110,20 120,10 Q130,0 140,10 Q150,20 160,10 Q170,0 180,10 Q190,20 200,10 L200,20 Z"
        fill="#faf6e8"
        stroke="#c0447a"
        strokeWidth="2"
      />
    </svg>
  )
}

function Sparkle({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="#f2a93b" />
    </svg>
  )
}

export function InviteFrame({ children }: { children: ReactNode }) {
  return (
    <div className="invite-frame">
      <ScallopEdge position="top" />
      <Sparkle className="invite-frame-sparkle invite-frame-sparkle-top-left" />
      <div className="invite-frame-body">{children}</div>
      <Sparkle className="invite-frame-sparkle invite-frame-sparkle-bottom-right" />
      <ScallopEdge position="bottom" />
    </div>
  )
}
