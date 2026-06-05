import { create } from 'zustand'
import type { GuestRule } from '../types'

interface RulesStore {
  rules: Record<string, GuestRule>
  setRules: (rules: Record<string, GuestRule>) => void
  setRule: (rule: GuestRule) => void
  deleteRule: (guestId: string) => void
}

export const emptyRule = (guestId: string): GuestRule => ({
  guestId,
  parents: [],
  children: [],
  bestFriends: [],
  doNotSeatWith: [],
  workRelations: [],
  synagogue: '',
  buildingName: '',
  sameBuilding: [],
  isElderly: false,
  isYoung: false,
  notes: '',
  customQuestions: [],
})

export const useRulesStore = create<RulesStore>()((set) => ({
  rules: {},

  setRules: (rules) => set({ rules }),

  setRule: (rule) =>
    set((state) => ({ rules: { ...state.rules, [rule.guestId]: rule } })),

  deleteRule: (guestId) =>
    set((state) => {
      const next = { ...state.rules }
      delete next[guestId]
      return { rules: next }
    }),
}))
