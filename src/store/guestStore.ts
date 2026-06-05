import { create } from 'zustand'
import type { Guest } from '../types'

interface GuestStore {
  guests: Guest[]
  setGuests: (guests: Guest[]) => void
  addGuest: (guest: Guest) => void
  updateGuest: (guest: Guest) => void
  deleteGuest: (id: string) => void
  assignGuest: (guestId: string, tableNo: string) => void
  unassignGuest: (guestId: string) => void
}

export const useGuestStore = create<GuestStore>()((set) => ({
  guests: [],

  setGuests: (guests) => set({ guests }),

  addGuest: (guest) =>
    set((state) => ({ guests: [...state.guests, guest] })),

  updateGuest: (guest) =>
    set((state) => ({
      guests: state.guests.map((g) => (g.id === guest.id ? guest : g)),
    })),

  deleteGuest: (id) =>
    set((state) => ({
      guests: state.guests.filter((g) => g.id !== id),
    })),

  assignGuest: (guestId, tableNo) =>
    set((state) => ({
      guests: state.guests.map((g) =>
        g.id === guestId ? { ...g, tableNo } : g
      ),
    })),

  unassignGuest: (guestId) =>
    set((state) => ({
      guests: state.guests.map((g) =>
        g.id === guestId ? { ...g, tableNo: null } : g
      ),
    })),
}))
