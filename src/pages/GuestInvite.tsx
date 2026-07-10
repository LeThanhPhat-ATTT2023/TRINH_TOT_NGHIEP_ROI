// src/pages/GuestInvite.tsx
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import type { EventSettings, Guest } from '../types/database'
import { InviteFrame } from '../components/InviteFrame'
import { RsvpButtons } from '../components/RsvpButtons'
import '../styles/tokens.css'
import '../styles/public-shared.css'
import './GuestInvite.css'

export function GuestInvite() {
  const { guestId } = useParams<{ guestId: string }>()
  const [guest, setGuest] = useState<Guest | null>(null)
  const [eventSettings, setEventSettings] = useState<EventSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [rsvpError, setRsvpError] = useState<string | null>(null)

  useEffect(() => {
    if (!guestId) return
    load(guestId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestId])

  async function load(id: string) {
    setLoading(true)
    setNotFound(false)
    const [guestRes, eventRes] = await Promise.all([
      supabase.from('guests').select('*').eq('id', id).single(),
      supabase.from('event_settings').select('*').eq('id', 1).single(),
    ])

    if (guestRes.error || !guestRes.data) {
      setNotFound(true)
    } else {
      setGuest(guestRes.data as Guest)
    }
    if (!eventRes.error && eventRes.data) {
      setEventSettings(eventRes.data as EventSettings)
    }
    setLoading(false)
  }

  async function handleRespond(status: 'attending' | 'not_attending') {
    if (!guest) return
    const previous = guest
    setSubmitting(true)
    setRsvpError(null)
    setGuest({ ...guest, rsvp_status: status, rsvp_responded_at: new Date().toISOString() })

    const { error } = await supabase.rpc('submit_rsvp', { guest_id: guest.id, status })

    if (error) {
      setGuest(previous)
      setRsvpError('Gửi phản hồi thất bại, vui lòng thử lại.')
    }
    setSubmitting(false)
  }

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
      <InviteFrame>
        <p className="guest-invite-greeting">
          Kính mời {guest.salutation ? `${guest.salutation} ` : ''}
          {guest.full_name}
        </p>
        {guest.greeting_message && (
          <p className="guest-invite-message">{guest.greeting_message}</p>
        )}
        {eventSettings && (
          <div className="guest-invite-event-info">
            {eventSettings.event_name && <p>{eventSettings.event_name}</p>}
            {eventSettings.venue_name && <p>{eventSettings.venue_name}</p>}
            {eventSettings.venue_address && <p>{eventSettings.venue_address}</p>}
          </div>
        )}
        <RsvpButtons status={guest.rsvp_status} submitting={submitting} onRespond={handleRespond} />
        {rsvpError && (
          <p className="guest-invite-rsvp-error" role="alert">
            {rsvpError}
          </p>
        )}
      </InviteFrame>
    </div>
  )
}
