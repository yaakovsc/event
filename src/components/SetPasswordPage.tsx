import { useState } from 'react'
import { Heart } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export function SetPasswordPage() {
  const currentUserId = useAuthStore((s) => s.currentUserId)
  const changePassword = useAuthStore((s) => s.changePassword)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword.length < 4) {
      setError('הסיסמה חייבת להכיל לפחות 4 תווים')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('הסיסמאות אינן תואמות')
      return
    }
    changePassword(currentUserId!, newPassword)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-6">
          <Heart className="w-8 h-8 text-primary fill-primary mb-2" />
          <h2 className="text-xl font-bold text-foreground">הגדרת סיסמה</h2>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            זוהי כניסתך הראשונה. אנא הגדר סיסמה חדשה.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">סיסמה חדשה</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              autoFocus
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">אימות סיסמה</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              autoComplete="new-password"
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            className="w-full py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            שמור סיסמה
          </button>
        </form>
      </div>
    </div>
  )
}
