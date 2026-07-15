// src/pages/PublicInvite.tsx
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import { useEventInfo } from '../hooks/useEventInfo'
import { EventInfoSections } from '../components/EventInfoSections'
import { EnvelopeModal } from '../components/EnvelopeModal'
import { InviteFrame } from '../components/InviteFrame'
import { MusicPlayerWidget } from '../components/MusicPlayerWidget'
import '../styles/tokens.css'
import '../styles/public-shared.css'
import './PublicInvite.css'

export function PublicInvite() {
  const { guestId } = useParams<{ guestId: string }>()
  const { settings, gallery, loading, error, reload } = useEventInfo()
  const [inviteOpen, setInviteOpen] = useState(false)

  if (loading) return <p className="page-loading">Đang tải...</p>

  if (error) {
    return (
      <div className="page-error">
        <p role="alert">{error}</p>
        <button className="retry-button" type="button" onClick={reload}>
          Thử lại
        </button>
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="public-invite-page">
      <InviteFrame>
        <EventInfoSections settings={settings} gallery={gallery} />

        {guestId && (
          <div className="public-invite-section public-invite-cta-section">
            <button
              type="button"
              className="public-invite-cta"
              onClick={() => setInviteOpen(true)}
            >
              Xem lời mời riêng dành cho bạn
            </button>
          </div>
        )}
      </InviteFrame>

      <MusicPlayerWidget variant="floating" />

      <AnimatePresence>
        {guestId && inviteOpen && (
          <EnvelopeModal
            guestId={guestId}
            eventSettings={settings}
            onClose={() => setInviteOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
