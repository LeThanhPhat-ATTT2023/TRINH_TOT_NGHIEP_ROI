// src/components/CountdownTimer.tsx
import { useEffect, useState } from 'react'
import './CountdownTimer.css'

export interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function getTimeRemaining(target: Date, now: Date): TimeRemaining | null {
  const diffMs = target.getTime() - now.getTime()
  if (diffMs <= 0) return null

  const totalSeconds = Math.floor(diffMs / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

export function CountdownTimer({ eventDatetime }: { eventDatetime: string | null }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!eventDatetime) return null

  const remaining = getTimeRemaining(new Date(eventDatetime), now)

  if (!remaining) {
    return <p className="countdown-ended">Sự kiện đã diễn ra</p>
  }

  const units: Array<[number, string]> = [
    [remaining.days, 'Ngày'],
    [remaining.hours, 'Giờ'],
    [remaining.minutes, 'Phút'],
    [remaining.seconds, 'Giây'],
  ]

  return (
    <div className="countdown-timer">
      {units.map(([value, label]) => (
        <div className="countdown-unit" key={label}>
          <span className="countdown-value">{value}</span>
          <span className="countdown-label">{label}</span>
        </div>
      ))}
    </div>
  )
}
