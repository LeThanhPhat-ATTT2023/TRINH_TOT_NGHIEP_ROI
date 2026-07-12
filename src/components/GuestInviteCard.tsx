// src/components/GuestInviteCard.tsx
import type { EventSettings, Guest } from '../types/database'
import { InviteFrame } from './InviteFrame'
import { RsvpButtons } from './RsvpButtons'
import '../pages/GuestInvite.css'

export interface GuestInviteCardProps {
  guest: Guest
  eventSettings: EventSettings | null
  submitting: boolean
  rsvpError: string | null
  onRespond: (status: 'attending' | 'not_attending') => void
}

export function GuestInviteCard({ guest, eventSettings, submitting, rsvpError, onRespond }: GuestInviteCardProps) {
  return (
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
      <RsvpButtons status={guest.rsvp_status} submitting={submitting} onRespond={onRespond} />
      {rsvpError && (
        <p className="guest-invite-rsvp-error" role="alert">
          {rsvpError}
        </p>
      )}
    </InviteFrame>
  )
}

