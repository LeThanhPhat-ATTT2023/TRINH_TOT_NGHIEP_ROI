// src/pages/GuestInvite.tsx
import { Link, useParams } from 'react-router-dom'
import { useGuestInvite } from '../hooks/useGuestInvite'
import { GuestInviteCard } from '../components/GuestInviteCard'
import { MusicPlayerWidget } from '../components/MusicPlayerWidget'
import '../styles/tokens.css'
import '../styles/public-shared.css'
import './GuestInvite.css'

export function GuestInvite() {
  const { guestId } = useParams<{ guestId: string }>()
  const { guest, eventSettings, loading, notFound, submitting, rsvpError, respond } =
    useGuestInvite({ guestId })

  if (loading) return <p className="page-loading">Đang tải...</p>

  if (notFound) {
    return (
      <div className="page-error">
        <p>Không tìm thấy thiệp mời này.</p>
        <Link to="/">Quay về trang chủ</Link>
      </div>
    )
  }

  if (!guest) return null

  return (
    <div className="guest-invite-page">
      <GuestInviteCard
        guest={guest}
        eventSettings={eventSettings}
        submitting={submitting}
        rsvpError={rsvpError}
        onRespond={respond}
      />
      <MusicPlayerWidget variant="floating" />
    </div>
  )
}
