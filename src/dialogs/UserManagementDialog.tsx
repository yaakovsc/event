import { useState } from 'react'
import { X, UserPlus, KeyRound, Trash2, ShieldCheck } from 'lucide-react'
import { useAuthStore, ADMIN_ID } from '../store/authStore'
import { cn } from '../utils/cn'

interface UserManagementDialogProps {
  open: boolean
  onClose: () => void
}

export function UserManagementDialog({ open, onClose }: UserManagementDialogProps) {
  const users = useAuthStore((s) => s.users)
  const addUser = useAuthStore((s) => s.addUser)
  const resetPassword = useAuthStore((s) => s.resetPassword)
  const deleteUser = useAuthStore((s) => s.deleteUser)

  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [addError, setAddError] = useState('')

  const [resetingId, setResetingId] = useState<string | null>(null)
  const [resetPw, setResetPw] = useState('')
  const [resetError, setResetError] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    if (!newUsername.trim()) { setAddError('שם משתמש חובה'); return }
    if (newPassword.length < 4) { setAddError('סיסמה חייבת להכיל לפחות 4 תווים'); return }
    const result = addUser(newUsername.trim(), newPassword)
    if (result === 'exists') { setAddError('שם משתמש כבר קיים'); return }
    setNewUsername('')
    setNewPassword('')
  }

  const handleReset = (userId: string) => {
    setResetError('')
    if (resetPw.length < 4) { setResetError('סיסמה חייבת להכיל לפחות 4 תווים'); return }
    resetPassword(userId, resetPw)
    setResetingId(null)
    setResetPw('')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground">ניהול משתמשים</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-col gap-2 p-3 bg-background border border-border rounded-lg"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">{user.username}</span>
                  {user.isAdmin && (
                    <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" />
                      מנהל
                    </span>
                  )}
                  {user.mustChangePassword && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-1.5 py-0.5 rounded-full">
                      נדרש שינוי סיסמה
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setResetingId(resetingId === user.id ? null : user.id)
                      setResetPw('')
                      setResetError('')
                    }}
                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded"
                    title="איפוס סיסמה"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    disabled={user.id === ADMIN_ID}
                    className={cn(
                      'p-1.5 transition-colors rounded',
                      user.id === ADMIN_ID
                        ? 'text-muted-foreground/30 cursor-not-allowed'
                        : 'text-muted-foreground hover:text-destructive'
                    )}
                    title="מחק משתמש"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {resetingId === user.id && (
                <div className="flex gap-2 items-center">
                  <input
                    type="password"
                    placeholder="סיסמה חדשה"
                    value={resetPw}
                    onChange={(e) => setResetPw(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                    autoFocus
                  />
                  <button
                    onClick={() => handleReset(user.id)}
                    className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    שמור
                  </button>
                  {resetError && <p className="text-xs text-destructive">{resetError}</p>}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add user form */}
        <div className="border-t border-border pt-4">
          <p className="text-sm font-medium text-foreground mb-3">הוסף משתמש חדש</p>
          <form onSubmit={handleAdd} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="שם משתמש"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              />
              <input
                type="password"
                placeholder="סיסמה זמנית"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex-shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                הוסף
              </button>
            </div>
            {addError && <p className="text-xs text-destructive">{addError}</p>}
            <p className="text-xs text-muted-foreground">המשתמש יתבקש להחליף סיסמה בכניסה הראשונה.</p>
          </form>
        </div>
      </div>
    </div>
  )
}
