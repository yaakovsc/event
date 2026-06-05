import { DragOverEvent, DragEndEvent } from '@dnd-kit/core'
import { ImageIcon } from 'lucide-react'
import { useGuestStore } from '../store/guestStore'
import { useTableStore } from '../store/tableStore'
import { useLayoutStore } from '../store/layoutStore'
import { TableShape } from './TableShape'
import type { EventTable } from '../types'

interface BlueprintCanvasProps {
  onEditTable: (table: EventTable) => void
  activeId: string | null
  overId: string | null
  onDragEndInternal: (event: DragEndEvent) => void
  onDragOverInternal: (event: DragOverEvent) => void
}

export function BlueprintCanvas({
  onEditTable,
  activeId,
  overId,
}: BlueprintCanvasProps) {
  const tables = useTableStore((s) => s.tables)
  const guests = useGuestStore((s) => s.guests)
  const blueprintImageUrl = useLayoutStore((s) => s.blueprintImageUrl)

  // Determine which table is being dragged over for highlighting
  const isDraggingGuest = activeId?.startsWith('guest-') ?? false

  return (
    <div
      className="relative flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900 h-full w-full"
      style={{
        backgroundImage: blueprintImageUrl ? `url(${blueprintImageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {!blueprintImageUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 pointer-events-none">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `
                linear-gradient(to right, currentColor 1px, transparent 1px),
                linear-gradient(to bottom, currentColor 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />
          <ImageIcon className="w-16 h-16 mb-3" />
          <p className="text-sm font-medium">תשריט האולם</p>
          <p className="text-xs mt-1">העלה תשריט או גרור שולחנות לסידור</p>
        </div>
      )}

      {tables.map((table) => {
        const assignedGuests = guests.filter((g) => g.tableNo === table.tableNo)
        const occupancy = assignedGuests.reduce((sum, g) => sum + g.noOfGuests, 0)

        // Check if we're dragging a guest and hovering over this table
        const isHovered = isDraggingGuest && overId === table.id

        // Calculate if the dragged guest would exceed capacity
        let wouldExceedCapacity = false
        if (isDraggingGuest && isHovered && activeId) {
          const guestId = activeId.replace('guest-', '')
          const draggingGuest = guests.find((g) => g.id === guestId)
          if (draggingGuest && draggingGuest.tableNo !== table.tableNo) {
            wouldExceedCapacity = occupancy + draggingGuest.noOfGuests > table.capacity
          }
        }

        return (
          <TableShape
            key={table.id}
            table={table}
            isOver={isHovered}
            isOverCapacity={wouldExceedCapacity}
            onEdit={onEditTable}
          />
        )
      })}

      {tables.length === 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-sm text-gray-600 dark:text-gray-300 px-4 py-2 rounded-full shadow">
          אין שולחנות עדיין — הוסף שולחנות מהסרגל
        </div>
      )}

      <div className="absolute top-2 right-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-md px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 shadow">
        <span className="font-medium">{tables.length}</span> שולחנות &middot;{' '}
        <span className="font-medium">{guests.filter((g) => g.tableNo !== null).length}</span> קבוצות מושבות
      </div>
    </div>
  )
}
