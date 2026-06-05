import { useState } from 'react'
import { Heart } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const result = login(username.trim(), password)
    if (result === 'invalid') setError('שם משתמש או סיסמה שגויים')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-6">
          <Heart className="w-8 h-8 text-primary fill-primary mb-2" />
          <h1 className="text-2xl font-bold text-foreground">סידור הושבה</h1>
          <p className="text-sm text-muted-foreground mt-1">התחבר לחשבונך</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">שם משתמש</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              autoFocus
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            התחבר
          </button>
        </form>
      </div>
    </div>
  )
}
