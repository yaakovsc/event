import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export const ADMIN_ID = 'admin'

function hashPw(pw: string): string {
  let h = 5381
  for (let i = 0; i < pw.length; i++) {
    h = Math.imul(h, 31) ^ pw.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h).toString(36)
}

export interface AppUser {
  id: string
  username: string
  passwordHash: string
  mustChangePassword: boolean
  isAdmin: boolean
}

interface AuthStore {
  users: AppUser[]
  currentUserId: string | null
  login: (username: string, password: string) => 'ok' | 'invalid'
  logout: () => void
  changePassword: (userId: string, newPassword: string) => void
  addUser: (username: string, initialPassword: string) => AppUser | 'exists'
  resetPassword: (userId: string, newPassword: string) => void
  deleteUser: (userId: string) => void
}

const defaultAdmin: AppUser = {
  id: ADMIN_ID,
  username: 'admin',
  passwordHash: hashPw('admin'),
  mustChangePassword: false,
  isAdmin: true,
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      users: [defaultAdmin],
      currentUserId: null,

      login: (username, password) => {
        const user = get().users.find(
          (u) =>
            u.username.toLowerCase() === username.toLowerCase() &&
            u.passwordHash === hashPw(password)
        )
        if (!user) return 'invalid'
        set({ currentUserId: user.id })
        return 'ok'
      },

      logout: () => set({ currentUserId: null }),

      changePassword: (userId, newPassword) =>
        set((state) => ({
          users: state.users.map((u) =>
            u.id === userId
              ? { ...u, passwordHash: hashPw(newPassword), mustChangePassword: false }
              : u
          ),
        })),

      addUser: (username, initialPassword) => {
        const exists = get().users.some(
          (u) => u.username.toLowerCase() === username.toLowerCase()
        )
        if (exists) return 'exists'
        const newUser: AppUser = {
          id: uuidv4(),
          username,
          passwordHash: hashPw(initialPassword),
          mustChangePassword: true,
          isAdmin: false,
        }
        set((state) => ({ users: [...state.users, newUser] }))
        return newUser
      },

      resetPassword: (userId, newPassword) =>
        set((state) => ({
          users: state.users.map((u) =>
            u.id === userId
              ? { ...u, passwordHash: hashPw(newPassword), mustChangePassword: true }
              : u
          ),
        })),

      deleteUser: (userId) =>
        set((state) => ({
          users: state.users.filter((u) => u.id !== userId),
        })),
    }),
    { name: 'seating-auth' }
  )
)
