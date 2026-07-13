// src/lib/youtube.ts
const YOUTUBE_ID_PATTERN =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/

export function parseYoutubeId(url: string): string | null {
  const match = url.match(YOUTUBE_ID_PATTERN)
  return match ? match[1] : null
}
