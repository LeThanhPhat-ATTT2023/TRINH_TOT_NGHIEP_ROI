// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RequireAuth } from './components/RequireAuth'
import { PublicInvite } from './pages/PublicInvite'
import { GuestInvite } from './pages/GuestInvite'
import { NotFound } from './pages/NotFound'
import { AdminLogin } from './pages/admin/AdminLogin'
import { AdminDashboard } from './pages/admin/AdminDashboard'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicInvite />} />
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
  )
}
