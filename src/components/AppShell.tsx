import { useRef, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import { Toolbar } from './Toolbar'
import { GuestList } from './GuestList'
import { BlueprintCanvas } from './BlueprintCanvas'
import { GuestDialog } from '../dialogs/GuestDialog'
import { TableDialog } from '../dialogs/TableDialog'
import { useGuestStore } from '../store/guestStore'
import { useTableStore } from '../store/tableStore'
import { useToast } from './Toast'
import { cn } from '../utils/cn'
import type { Guest, EventTable } from '../types'

export function AppShell() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const guests = useGuestStore((s) => s.guests)
  const assignGuest = useGuestStore((s) => s.assignGuest)
  const tables = useTableStore((s) => s.tables)
  const moveTable = useTableStore((s) => s.moveTable)
  const showToast = useToast()

  const [editGuest, setEditGuest] = useState<Guest | undefined>(undefined)
  const [guestDialogOpen, setGuestDialogOpen] = useState(false)
  const [editTable, setEditTable] = useState<EventTable | undefined>(undefined)
  const [tableDialogOpen, setTableDialogOpen] = useState(false)

  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over ? String(event.over.id) : null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event
    setActiveId(null)
    setOverId(null)

    const activeIdStr = String(active.id)

    // Handle guest drop onto table
    if (activeIdStr.startsWith('guest-') && over) {
      const guestId = activeIdStr.replace('guest-', '')
      const tableId = String(over.id)

      const table = tables.find((t) => t.id === tableId)
      if (!table) return

      const guest = guests.find((g) => g.id === guestId)
      if (!guest) return

      // If already on this table, do nothing
      if (guest.tableNo === table.tableNo) return

      // Check capacity
      const currentOccupancy = guests
        .filter((g) => g.tableNo === table.tableNo)
        .reduce((sum, g) => sum + g.noOfGuests, 0)

      if (currentOccupancy + guest.noOfGuests > table.capacity) {
        showToast(
          `שולחן ${table.tableNo} מלא! (${currentOccupancy}/${table.capacity} מקומות תפוסים)`,
          'error'
        )
        return
      }

      assignGuest(guestId, table.tableNo)
      showToast(`${guest.name} שובץ לשולחן ${table.tableNo}`, 'success')
      return
    }

    // Handle table move
    if (activeIdStr.startsWith('move-table-')) {
      const tableId = activeIdStr.replace('move-table-', '')
      const table = tables.find((t) => t.id === tableId)
      if (!table || !canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const deltaXPct = (delta.x / rect.width) * 100
      const deltaYPct = (delta.y / rect.height) * 100

      const newX = Math.max(2, Math.min(98, table.x + deltaXPct))
      const newY = Math.max(2, Math.min(98, table.y + deltaYPct))

      moveTable(tableId, newX, newY)
    }
  }

  const handleEditGuest = (guest: Guest) => {
    setEditGuest(guest)
    setGuestDialogOpen(true)
  }

  const handleEditTable = (table: EventTable) => {
    setEditTable(table)
    setTableDialogOpen(true)
  }

  const handleAddGuest = () => {
    setEditGuest(undefined)
    setGuestDialogOpen(true)
  }

  // Dragging guest overlay
  const draggingGuest =
    activeId?.startsWith('guest-')
      ? guests.find((g) => g.id === activeId.replace('guest-', ''))
      : null

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Toolbar />
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 overflow-hidden">
          <div className="w-72 flex-shrink-0 overflow-hidden">
            <GuestList onEditGuest={handleEditGuest} onAddGuest={handleAddGuest} />
          </div>
          <div ref={canvasRef} className="flex-1 overflow-hidden">
            <BlueprintCanvas
              onEditTable={handleEditTable}
              activeId={activeId}
              overId={overId}
              onDragEndInternal={handleDragEnd}
              onDragOverInternal={handleDragOver}
            />
          </div>
        </div>

        <DragOverlay>
          {draggingGuest && (
            <div
              className={cn(
                'bg-card border border-primary rounded-lg px-3 py-2 shadow-2xl opacity-90',
                'text-sm font-semibold text-foreground'
              )}
            >
              {draggingGuest.name}
              <span className="ml-2 text-xs text-muted-foreground">
                ({draggingGuest.noOfGuests} {draggingGuest.noOfGuests === 1 ? 'person' : 'people'})
              </span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <GuestDialog
        open={guestDialogOpen}
        onClose={() => {
          setGuestDialogOpen(false)
          setEditGuest(undefined)
        }}
        guest={editGuest}
      />
      <TableDialog
        open={tableDialogOpen}
        onClose={() => {
          setTableDialogOpen(false)
          setEditTable(undefined)
        }}
        table={editTable}
      />
    </div>
  )
}
