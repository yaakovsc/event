import { create } from 'zustand'

interface LayoutStore {
  blueprintImageUrl: string | null
  setBlueprintImage: (url: string | null) => void
}

export const useLayoutStore = create<LayoutStore>()((set) => ({
  blueprintImageUrl: null,
  setBlueprintImage: (url) => set({ blueprintImageUrl: url }),
}))
