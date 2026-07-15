// src/components/EventInfoSections.tsx
import type { EventSettings, GalleryPhoto } from '../types/database'
import { CountdownTimer } from './CountdownTimer'
import { MapEmbed } from './MapEmbed'
import { GalleryGrid } from './GalleryGrid'
import {
  CalendarIcon,
  ClockIcon,
  CurlyArrowIcon,
  LocationPinIcon,
  SparkleIcon,
} from './icons'
import { HOST_NAME } from '../lib/constants'
import '../pages/PublicInvite.css'

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

export interface EventInfoSectionsProps {
  settings: EventSettings
  gallery: GalleryPhoto[]
}

export function EventInfoSections({ settings, gallery }: EventInfoSectionsProps) {
  return (
    <>
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
    </>
  )
}
