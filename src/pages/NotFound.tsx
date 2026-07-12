// src/pages/NotFound.tsx
import { Link } from 'react-router-dom'
import '../styles/tokens.css'
import './NotFound.css'

export function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <h1>404</h1>
        <p>Không tìm thấy trang bạn yêu cầu.</p>
        <Link to="/" className="not-found-link">
          Quay về trang chủ
        </Link>
      </div>
    </div>
  )
}
