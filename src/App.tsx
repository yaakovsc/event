import { useEffect, useRef } from 'react'
import { AppShell } from './components/AppShell'
import { ToastProvider } from './components/Toast'
import { TenantSync } from './components/TenantSync'
import { LoginPage } from './components/LoginPage'
import { SetPasswordPage } from './components/SetPasswordPage'
import { useAuthStore } from './store/authStore'

const IDLE_TIMEOUT = 5 * 60 * 1000 // 5 minutes
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const

function SessionGuard() {
  const logout = useAuthStore((s) => s.logout)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const reset = () => {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(logout, IDLE_TIMEOUT)
    }

    ACTIVITY_EVENTS.forEach((e) => document.addEventListener(e, reset, { passive: true }))
    reset()

    return () => {
      clearTimeout(timerRef.current)
      ACTIVITY_EVENTS.forEach((e) => document.removeEventListener(e, reset))
    }
  }, [logout])

  return null
}

function App() {
  const currentUserId = useAuthStore((s) => s.currentUserId)
  const users = useAuthStore((s) => s.users)
  const currentUser = users.find((u) => u.id === currentUserId) ?? null

  if (!currentUserId || !currentUser) return <LoginPage />

  if (currentUser.mustChangePassword)
    return (
      <>
        <SessionGuard />
        <SetPasswordPage />
      </>
    )

  return (
    <ToastProvider>
      <SessionGuard />
      <TenantSync />
      <AppShell />
    </ToastProvider>
  )
}

export default App
