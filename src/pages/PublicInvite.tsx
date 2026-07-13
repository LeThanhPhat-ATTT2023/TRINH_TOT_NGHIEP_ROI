// src/pages/PublicInvite.tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import { supabase } from '../lib/supabaseClient'
import type { EventSettings, GalleryPhoto } from '../types/database'
import { CountdownTimer } from '../components/CountdownTimer'
import { MapEmbed } from '../components/MapEmbed'
import { GalleryGrid } from '../components/GalleryGrid'
import { EnvelopeModal } from '../components/EnvelopeModal'
import {
  CalendarIcon,
  ClockIcon,
  CurlyArrowIcon,
  LocationPinIcon,
  SparkleIcon,
} from '../components/icons'
import { InviteFrame } from '../components/InviteFrame'
import { MusicPlayerWidget } from '../components/MusicPlayerWidget'
import { HOST_NAME } from '../lib/constants'
import '../styles/tokens.css'
import '../styles/public-shared.css'
import './PublicInvite.css'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function PublicInvite() {
  const { guestId } = useParams<{ guestId: string }>()
  const [settings, setSettings] = useState<EventSettings | null>(null)
  const [gallery, setGallery] = useState<GalleryPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    const [settingsRes, galleryRes] = await Promise.all([
      supabase.from('event_settings').select('*').eq('id', 1).single(),
      supabase.from('gallery_photos').select('*').order('sort_order', { ascending: true }),
    ])

    if (settingsRes.error) {
      setError('Không tải được thông tin sự kiện.')
    } else {
      setSettings(settingsRes.data as EventSettings)
    }
    if (!galleryRes.error && galleryRes.data) {
      setGallery(galleryRes.data as GalleryPhoto[])
    }
    setLoading(false)
  }

  if (loading) return <p className="page-loading">Đang tải...</p>

  if (error) {
    return (
      <div className="page-error">
        <p role="alert">{error}</p>
        <button className="retry-button" type="button" onClick={load}>
          Thử lại
        </button>
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="public-invite-page">
      <InviteFrame>
        <div className="public-invite-header">
          <p className="public-invite-eyebrow">Thương mời</p>
          <h1 className="public-invite-title">{settings.event_name}</h1>
        </div>

        {settings.event_datetime && (
          <div className="public-invite-section">
            <CountdownTimer eventDatetime={settings.event_datetime} />
          </div>
        )}

        {settings.cover_image_url && (
          <div className="public-invite-section">
            <div className="public-invite-photo">
              <SparkleIcon className="public-invite-photo-sparkle public-invite-photo-sparkle-1" />
              <SparkleIcon className="public-invite-photo-sparkle public-invite-photo-sparkle-2" />
              <SparkleIcon className="public-invite-photo-sparkle public-invite-photo-sparkle-3" />
              <div className="public-invite-photo-anchor">
                <div className="public-invite-photo-frame">
                  <img src={settings.cover_image_url} alt={`Ảnh tốt nghiệp của ${HOST_NAME}`} />
                </div>
                <CurlyArrowIcon className="public-invite-photo-arrow public-invite-photo-arrow-name" />
                <span className="public-invite-photo-tag public-invite-photo-tag-name">
                  {HOST_NAME}
                </span>
              </div>
            </div>
          </div>
        )}

        {gallery.length > 0 && (
          <div className="public-invite-section">
            <GalleryGrid photos={gallery} />
          </div>
        )}

        {(settings.venue_name || settings.event_datetime || settings.map_embed_url) && (
          <div className="public-invite-section public-invite-venue-map">
            {(settings.venue_name || settings.event_datetime) && (
              <div className="public-invite-venue-block">
                {settings.venue_name && (
                  <div className="public-invite-venue-line">
                    <LocationPinIcon className="public-invite-venue-icon" />
                    <div className="public-invite-venue-text">
                      <p className="public-invite-venue">{settings.venue_name}</p>
                    </div>
                  </div>
                )}
                {settings.event_datetime && (
                  <p className="public-invite-address public-invite-time">
                    <span className="public-invite-time-item">
                      <ClockIcon className="public-invite-time-icon" />
                      {formatTime(settings.event_datetime)}
                    </span>
                    <span className="public-invite-time-item">
                      <CalendarIcon className="public-invite-time-icon" />
                      {formatDate(settings.event_datetime)}
                    </span>
                  </p>
                )}
              </div>
            )}
            {settings.map_embed_url && <MapEmbed mapEmbedUrl={settings.map_embed_url} />}
          </div>
        )}

        {guestId && (
          <div className="public-invite-section public-invite-cta-section">
            <button type="button" className="public-invite-cta" onClick={() => setInviteOpen(true)}>
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
