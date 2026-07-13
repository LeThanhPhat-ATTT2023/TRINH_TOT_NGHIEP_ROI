// src/pages/HomePage.tsx
import { InviteFrame } from '../components/InviteFrame'
import { MusicPlayerWidget } from '../components/MusicPlayerWidget'
import { NameSearchBox } from '../components/NameSearchBox'
import { SparkleIcon } from '../components/icons'
import { HOST_NAME } from '../lib/constants'
import '../styles/tokens.css'
import '../styles/public-shared.css'
import './HomePage.css'

export function HomePage() {
  return (
    <div className="home-page">
      <InviteFrame>
        <div className="home-hero">
          <SparkleIcon className="home-hero-sparkle home-hero-sparkle-1" />
          <SparkleIcon className="home-hero-sparkle home-hero-sparkle-2" />
          <span className="home-hero-pill home-hero-pill-happy">Happy</span>
          <h1 className="home-hero-title">Graduation</h1>
          <span className="home-hero-pill home-hero-pill-name">{HOST_NAME}</span>
        </div>

        {/* Vùng co giãn phía trên khối tìm tên — lời nhắn luôn nổi chính giữa vùng này */}
        <div className="home-message-zone">
          <p className="home-message">
            Cảm ơn vì đã là một phần rực rỡ trong những năm tháng thanh xuân của mình.
            Nhập tên để cùng mở ra tấm vé đến ngày lễ tốt nghiệp nhé!
          </p>
          <MusicPlayerWidget />
        </div>

        <div className="home-search-section">
          <p className="home-search-label">Vui lòng nhập tên của bạn❤️</p>
          <NameSearchBox />
        </div>
      </InviteFrame>
    </div>
  )
}
