// src/components/MapEmbed.tsx
import { MapPlaceholderIcon } from './icons'
import './MapEmbed.css'

function isValidMapEmbedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('google.com')
  } catch {
    return false
  }
}

export function MapEmbed({ mapEmbedUrl }: { mapEmbedUrl: string | null }) {
  if (!mapEmbedUrl) return null

  if (!isValidMapEmbedUrl(mapEmbedUrl)) {
    return (
      <div className="map-embed-placeholder" role="note">
        <MapPlaceholderIcon className="map-embed-placeholder-icon" />
        <p>Bản đồ vị trí sẽ được cập nhật sớm.</p>
      </div>
    )
  }

  return (
    <iframe
      className="map-embed"
      src={mapEmbedUrl}
      title="Bản đồ vị trí sự kiện"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  )
}
