import { create } from 'zustand'
import type { EventTable } from '../types'

interface TableStore {
  tables: EventTable[]
  setTables: (tables: EventTable[]) => void
  addTable: (table: EventTable) => void
  updateTable: (table: EventTable) => void
  deleteTable: (id: string) => void
  moveTable: (id: string, x: number, y: number) => void
}

export const useTableStore = create<TableStore>()((set) => ({
  tables: [],

  setTables: (tables) => set({ tables }),

  addTable: (table) =>
    set((state) => ({ tables: [...state.tables, table] })),

  updateTable: (table) =>
    set((state) => ({
      tables: state.tables.map((t) => (t.id === table.id ? table : t)),
    })),

  deleteTable: (id) =>
    set((state) => ({
      tables: state.tables.filter((t) => t.id !== id),
    })),

  moveTable: (id, x, y) =>
    set((state) => ({
      tables: state.tables.map((t) =>
        t.id === id ? { ...t, x, y } : t
      ),
    })),
}))
