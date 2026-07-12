// src/components/AvatarCropModal.tsx
import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import './AvatarCropModal.css'

const OUTPUT_SIZE = 800 // px, kích thước ảnh vuông xuất ra
const VIEWPORT = 260 // px, đường kính khung tròn xem trước

interface AvatarCropModalProps {
  file: File
  onCancel: () => void
  onConfirm: (file: File) => void
}

export function AvatarCropModal({ file, onCancel, onConfirm }: AvatarCropModalProps) {
  const [src, setSrc] = useState<string | null>(null)
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null)
  const [previewFailed, setPreviewFailed] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const imgRef = useRef<HTMLImageElement>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; baseX: number; baseY: number } | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null
    try {
      objectUrl = URL.createObjectURL(file)
      setSrc(objectUrl)
    } catch {
      // Môi trường không hỗ trợ createObjectURL: đọc bằng FileReader
      const reader = new FileReader()
      reader.onload = () => setSrc(typeof reader.result === 'string' ? reader.result : null)
      reader.readAsDataURL(file)
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  // Tỉ lệ hiển thị tối thiểu để ảnh luôn phủ kín khung tròn
  const coverScale = imgSize ? VIEWPORT / Math.min(imgSize.w, imgSize.h) : 1
  const scale = coverScale * zoom
  const displayW = imgSize ? imgSize.w * scale : 0
  const displayH = imgSize ? imgSize.h * scale : 0

  function clampOffset(x: number, y: number, currentScale: number) {
    if (!imgSize) return { x, y }
    const maxX = Math.max(0, (imgSize.w * currentScale - VIEWPORT) / 2)
    const maxY = Math.max(0, (imgSize.h * currentScale - VIEWPORT) / 2)
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    }
  }

  function handleZoomChange(nextZoom: number) {
    setZoom(nextZoom)
    setOffset((prev) => clampOffset(prev.x, prev.y, coverScale * nextZoom))
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseX: offset.x,
      baseY: offset.y,
    }
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    setOffset(
      clampOffset(drag.baseX + (e.clientX - drag.startX), drag.baseY + (e.clientY - drag.startY), scale)
    )
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null
  }

  function handleConfirm() {
    const img = imgRef.current
    try {
      if (!img || !imgSize) throw new Error('image not ready')
      const canvas = document.createElement('canvas')
      canvas.width = OUTPUT_SIZE
      canvas.height = OUTPUT_SIZE
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('canvas unsupported')

      // Tâm khung tròn ứng với điểm nào trên ảnh gốc
      const cx = imgSize.w / 2 - offset.x / scale
      const cy = imgSize.h / 2 - offset.y / scale
      const srcSize = VIEWPORT / scale
      ctx.drawImage(
        img,
        cx - srcSize / 2,
        cy - srcSize / 2,
        srcSize,
        srcSize,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE
      )
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            onConfirm(file)
            return
          }
          onConfirm(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }))
        },
        'image/jpeg',
        0.92
      )
    } catch {
      // Không cắt được (trình duyệt thiếu canvas...): dùng ảnh gốc
      onConfirm(file)
    }
  }

  return (
    <div className="avatar-crop-overlay" role="dialog" aria-modal="true" aria-label="Cắt ảnh đại diện">
      <div className="avatar-crop-panel">
        <h3 className="avatar-crop-title">Căn chỉnh ảnh đại diện</h3>
        {previewFailed ? (
          <p className="avatar-crop-hint" role="alert">
            Trình duyệt không xem trước được định dạng ảnh này (ví dụ HEIC từ iPhone). Bạn vẫn có
            thể tải lên — ảnh sẽ được tự động chuyển đổi, phần cắt sẽ lấy theo mặc định.
          </p>
        ) : (
          <p className="avatar-crop-hint">Kéo ảnh để căn vị trí trong khung vuông.</p>
        )}
        <div
          className="avatar-crop-viewport"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {src && !previewFailed && (
            <img
              ref={imgRef}
              src={src}
              alt=""
              draggable={false}
              style={{
                width: displayW || undefined,
                height: displayH || undefined,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
              onLoad={(e) => {
                const el = e.currentTarget
                setImgSize({ w: el.naturalWidth, h: el.naturalHeight })
                setZoom(1)
                setOffset({ x: 0, y: 0 })
              }}
              onError={() => setPreviewFailed(true)}
            />
          )}
        </div>
        {!previewFailed && (
          <label className="avatar-crop-zoom">
            Phóng to
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => handleZoomChange(Number(e.target.value))}
            />
          </label>
        )}
        <div className="avatar-crop-actions">
          <button className="admin-button admin-button-secondary" type="button" onClick={onCancel}>
            Huỷ
          </button>
          <button className="admin-button admin-button-primary" type="button" onClick={handleConfirm}>
            Dùng ảnh này
          </button>
        </div>
      </div>
    </div>
  )
}
