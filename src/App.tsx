// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RequireAuth } from './components/RequireAuth'
import { MusicPlayerProvider } from './context/MusicPlayerContext'
import { HomePage } from './pages/HomePage'
import { PublicInvite } from './pages/PublicInvite'
import { SharedInvite } from './pages/SharedInvite'
import { GuestInvite } from './pages/GuestInvite'
import { NotFound } from './pages/NotFound'
import { AdminLogin } from './pages/admin/AdminLogin'
import { AdminDashboard } from './pages/admin/AdminDashboard'

export function App() {
  return (
    <MusicPlayerProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/thiep-chung/:guestId?" element={<PublicInvite />} />
          <Route path="/chung-vui" element={<SharedInvite />} />
          <Route path="/thiep/:guestId" element={<GuestInvite />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminDashboard />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </MusicPlayerProvider>
  )
}
