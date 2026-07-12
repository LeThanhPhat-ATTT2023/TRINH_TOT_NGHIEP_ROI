// src/components/EnvelopeModal.tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { EventSettings } from '../types/database'
import { useGuestInvite } from '../hooks/useGuestInvite'
import { GuestInviteCard } from './GuestInviteCard'
import { MessageModal } from './MessageModal'
import { GraduationCapIcon, SparkleIcon } from './icons'
import { supabase } from '../lib/supabaseClient'
import './EnvelopeModal.css'

type EnvelopeState = 'envelope' | 'opening' | 'sliding' | 'revealed'
type ViewState = 'card' | 'message' | 'complete'

export interface EnvelopeModalProps {
  guestId: string
  eventSettings: EventSettings | null
  onClose: () => void
}

export function EnvelopeModal({ guestId, eventSettings, onClose }: EnvelopeModalProps) {
  const reducedMotion = useReducedMotion()
  const [envelopeState, setEnvelopeState] = useState<EnvelopeState>(
    reducedMotion ? 'revealed' : 'envelope'
  )
  const [viewState, setViewState] = useState<ViewState>('card')
  const overlayRef = useRef<HTMLDivElement>(null)
  const envelopeRef = useRef<HTMLButtonElement>(null)

  const { guest, loading, notFound, submitting, rsvpError, respond } = useGuestInvite({
    guestId,
    eventSettings,
  })

  const handleOpen = useCallback(() => {
    if (envelopeState !== 'envelope') return
    setEnvelopeState('opening')
    setTimeout(() => setEnvelopeState('sliding'), 800)
    setTimeout(() => setEnvelopeState('revealed'), 2100)
  }, [envelopeState])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (envelopeState === 'envelope' && envelopeRef.current) {
      envelopeRef.current.focus()
    }
  }, [envelopeState])

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose()
  }

  async function handleRsvpRespond(status: 'attending' | 'not_attending') {
    await respond(status)
    // After successful RSVP, show message modal
    if (!rsvpError) {
      setViewState('message')
    }
  }

  async function handleMessageSubmit(message: string) {
    if (!guest) return
    const { error } = await supabase
      .from('guests')
      .update({ message_by_guest: message })
      .eq('id', guest.id)

    if (!error) {
      setViewState('complete')
      // Auto close after 2 seconds
      setTimeout(() => onClose(), 2000)
    }
  }

  function handleMessageSkip() {
    setViewState('complete')
    setTimeout(() => onClose(), 1500)
  }

  return (
    <motion.div
      ref={overlayRef}
      className="envelope-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Thiệp mời riêng"
      onClick={handleBackdropClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <button type="button" className="envelope-close" onClick={onClose} aria-label="Đóng">
        ✕
      </button>

      {envelopeState !== 'revealed' ? (
        <motion.div
          className="envelope-scene"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 22, mass: 1 }}
        >
          <button
            ref={envelopeRef}
            type="button"
            className="envelope-container"
            data-state={envelopeState}
            onClick={handleOpen}
            aria-label="Chạm để mở thư"
          >
            <div className="envelope-card-inside">
              <div className="envelope-card-preview" />
            </div>

            <div className="envelope-body">
              <div className="envelope-back" />
              <div className="envelope-fold" />
              <SparkleIcon className="envelope-sparkle envelope-sparkle-1" />
              <SparkleIcon className="envelope-sparkle envelope-sparkle-2" />
            </div>

            <div className="envelope-flap-wrapper">
              <div className="envelope-flap" />
            </div>

            <div className="envelope-seal">
              <div className="envelope-seal-circle">
                <GraduationCapIcon className="envelope-seal-icon" />
              </div>
            </div>
          </button>

          {envelopeState === 'envelope' && <p className="envelope-hint">✨ Chạm để mở thư</p>}
        </motion.div>
      ) : (
        <motion.div
          className="envelope-card-wrapper"
          initial={{ y: -40, scale: 0.85, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 160, damping: 20, mass: 1 }}
        >
          {loading && <p className="envelope-loading">Đang tải...</p>}
          {notFound && (
            <div className="envelope-error">
              <p>Không tìm thấy thiệp mời này.</p>
              <button type="button" className="envelope-retry" onClick={onClose}>
                Đóng
              </button>
            </div>
          )}
          {guest && viewState === 'card' && (
            <GuestInviteCard
              guest={guest}
              eventSettings={eventSettings}
              submitting={submitting}
              rsvpError={rsvpError}
              onRespond={handleRsvpRespond}
            />
          )}
          {guest && viewState === 'message' && (
            <MessageModal
              guestName={guest.full_name}
              onSubmit={handleMessageSubmit}
              onSkip={handleMessageSkip}
            />
          )}
          {viewState === 'complete' && (
            <div className="envelope-complete">
              <p className="envelope-complete-text">✓ Cảm ơn bạn!</p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}


