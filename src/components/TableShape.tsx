import { useState, useRef } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { Pencil, Trash2 } from 'lucide-react'
import { cn } from '../utils/cn'
import { useGuestStore } from '../store/guestStore'
import { useTableStore } from '../store/tableStore'
import type { EventTable } from '../types'

interface TableShapeProps {
  table: EventTable
  isOver: boolean
  isOverCapacity: boolean
  onEdit: (table: EventTable) => void
}

interface Colors {
  cloth: string
  clothInner: string
  edge: string
  chairEmpty: string
  chairFilled: string
  chairStroke: string
  text: string
  shadow: string
}

function getColors(isOver: boolean, isOverCapacity: boolean, isAtCapacity: boolean): Colors {
  if (isOverCapacity)
    return { cloth: '#FDE8E8', clothInner: '#F8D0D0', edge: '#C83030', chairEmpty: '#F4BEBE', chairFilled: '#C03030', chairStroke: '#901818', text: '#7A1010', shadow: 'rgba(180,30,30,0.18)' }
  if (isAtCapacity)
    return { cloth: '#FFF8E2', clothInner: '#FFEFC0', edge: '#C89020', chairEmpty: '#F0D888', chairFilled: '#C89020', chairStroke: '#906010', text: '#785010', shadow: 'rgba(150,100,0,0.18)' }
  if (isOver)
    return { cloth: '#EAF2FF', clothInner: '#D4E8FF', edge: '#3670D8', chairEmpty: '#A8C8F8', chairFilled: '#3670D8', chairStroke: '#1848A8', text: '#1A3880', shadow: 'rgba(40,90,210,0.22)' }
  return { cloth: '#F8F4EE', clothInner: '#EFE8DC', edge: '#A88860', chairEmpty: '#D8CEBA', chairFilled: '#E88060', chairStroke: '#B05838', text: '#5A3820', shadow: 'rgba(0,0,0,0.14)' }
}

function ChairCircle({ cx, cy, r, filled, c }: { cx: number; cy: number; r: number; filled: boolean; c: Colors }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={filled ? c.chairFilled : c.chairEmpty} stroke={filled ? c.chairStroke : '#907860'} strokeWidth="1" />
      {filled && <circle cx={cx} cy={cy} r={r * 0.45} fill="rgba(255,255,255,0.25)" />}
    </g>
  )
}

function distribute(total: number, buckets: number): number[] {
  const base = Math.floor(total / buckets)
  const rem = total % buckets
  return Array.from({ length: buckets }, (_, i) => base + (i < rem ? 1 : 0))
}

function spreadX(n: number, xStart: number, xEnd: number): number[] {
  if (n === 0) return []
  if (n === 1) return [(xStart + xEnd) / 2]
  return Array.from({ length: n }, (_, i) => xStart + ((xEnd - xStart) / (n - 1)) * i)
}

function spreadY(n: number, yStart: number, yEnd: number): number[] {
  if (n === 0) return []
  if (n === 1) return [(yStart + yEnd) / 2]
  return Array.from({ length: n }, (_, i) => yStart + ((yEnd - yStart) / (n - 1)) * i)
}

// ─── Round Table ──────────────────────────────────────────────────────────────
function RoundTableSVG({ table, occupancy, names, c }: { table: EventTable; occupancy: number; names: string[]; c: Colors }) {
  const cx = 90, cy = 90, tableR = 50, chairR = 9, chairDist = 67
  const maxChairs = Math.min(table.capacity, 14)
  const extraChairs = Math.max(0, table.capacity - 14)

  const chairs = Array.from({ length: maxChairs }, (_, i) => {
    const angle = (2 * Math.PI * i / maxChairs) - Math.PI / 2
    return { x: cx + chairDist * Math.cos(angle), y: cy + chairDist * Math.sin(angle), filled: i < occupancy }
  })

  const shownNames = names.slice(0, 3)
  const hasNames = shownNames.length > 0
  const numY = cy + (hasNames ? 4 : 8)
  const titleY = cy + (hasNames ? -10 : -4)

  return (
    <svg width="180" height="180" viewBox="0 0 180 180" style={{ overflow: 'visible', display: 'block' }}>
      {/* drop shadow */}
      <circle cx={cx + 3} cy={cy + 4} r={tableR + 1} fill={c.shadow} />
      {/* back-row chairs (lower half) */}
      {chairs.filter(ch => ch.y > cy).map((ch, i) => (
        <ChairCircle key={`b${i}`} cx={ch.x} cy={ch.y} r={chairR} filled={ch.filled} c={c} />
      ))}
      {/* table surface */}
      <circle cx={cx} cy={cy} r={tableR} fill={c.cloth} stroke={c.edge} strokeWidth="3" />
      {/* tablecloth inner ring */}
      <circle cx={cx} cy={cy} r={tableR - 7} fill={c.clothInner} stroke={c.edge} strokeWidth="0.5" opacity="0.6" />
      {/* front-row chairs (upper half) */}
      {chairs.filter(ch => ch.y <= cy).map((ch, i) => (
        <ChairCircle key={`f${i}`} cx={ch.x} cy={ch.y} r={chairR} filled={ch.filled} c={c} />
      ))}
      {/* table number */}
      <text x={cx} y={titleY} textAnchor="middle" fontSize="11" fontWeight="bold" fill={c.text} fontFamily="Arial, sans-serif">
        שולחן {table.tableNo}
      </text>
      {/* occupancy */}
      <text x={cx} y={numY} textAnchor="middle" fontSize="10" fill={c.text} opacity="0.85" fontFamily="Arial, sans-serif">
        {occupancy}/{table.capacity}
      </text>
      {/* guest names */}
      {shownNames.map((name, i) => (
        <text key={i} x={cx} y={cy + 17 + i * 11} textAnchor="middle" fontSize="8" fill={c.text} opacity="0.7" fontFamily="Arial, sans-serif">
          {name.length > 14 ? name.slice(0, 13) + '…' : name}
        </text>
      ))}
      {names.length > 3 && (
        <text x={cx} y={cy + 17 + 3 * 11} textAnchor="middle" fontSize="7.5" fill={c.text} opacity="0.55" fontFamily="Arial, sans-serif">
          +{names.length - 3} נוספות
        </text>
      )}
      {extraChairs > 0 && (
        <text x={cx + tableR - 5} y={cy - tableR + 12} textAnchor="middle" fontSize="7" fill={c.text} opacity="0.6" fontFamily="Arial, sans-serif">
          +{extraChairs}
        </text>
      )}
    </svg>
  )
}

// ─── Rectangle Table ──────────────────────────────────────────────────────────
function RectTableSVG({ table, occupancy, names, c }: { table: EventTable; occupancy: number; names: string[]; c: Colors }) {
  const tx = 30, ty = 38, tw = 180, th = 60
  const cx = tx + tw / 2, cy = ty + th / 2
  const chairR = 8, topY = ty - 16, bottomY = ty + th + 16
  const xStart = tx + 12, xEnd = tx + tw - 12

  const maxChairs = Math.min(table.capacity, 14)
  const nTop = Math.ceil(maxChairs / 2)
  const nBottom = maxChairs - nTop

  const topChairs = spreadX(nTop, xStart, xEnd).map((x, i) => ({ x, y: topY, filled: i < occupancy }))
  const bottomChairs = spreadX(nBottom, xStart, xEnd).map((x, i) => ({ x, y: bottomY, filled: nTop + i < occupancy }))

  const shownNames = names.slice(0, 2)

  return (
    <svg width="240" height="138" viewBox="0 0 240 138" style={{ overflow: 'visible', display: 'block' }}>
      {/* shadow */}
      <rect x={tx + 3} y={ty + 4} width={tw} height={th} rx="8" fill={c.shadow} />
      {/* bottom chairs */}
      {bottomChairs.map((ch, i) => (
        <ChairCircle key={`bot${i}`} cx={ch.x} cy={ch.y} r={chairR} filled={ch.filled} c={c} />
      ))}
      {/* table surface */}
      <rect x={tx} y={ty} width={tw} height={th} rx="8" fill={c.cloth} stroke={c.edge} strokeWidth="3" />
      {/* tablecloth inner */}
      <rect x={tx + 8} y={ty + 8} width={tw - 16} height={th - 16} rx="5" fill={c.clothInner} stroke={c.edge} strokeWidth="0.5" opacity="0.5" />
      {/* top chairs (drawn after table so they appear on top) */}
      {topChairs.map((ch, i) => (
        <ChairCircle key={`top${i}`} cx={ch.x} cy={ch.y} r={chairR} filled={ch.filled} c={c} />
      ))}
      {/* table number */}
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="11" fontWeight="bold" fill={c.text} fontFamily="Arial, sans-serif">
        שולחן {table.tableNo}
      </text>
      {/* occupancy */}
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize="10" fill={c.text} opacity="0.85" fontFamily="Arial, sans-serif">
        {occupancy}/{table.capacity}
      </text>
      {/* up to 2 names in center */}
      {shownNames.map((name, i) => (
        <text key={i} x={cx + (i === 0 ? -46 : 46)} y={cy + 1} textAnchor="middle" fontSize="7.5" fill={c.text} opacity="0.65" fontFamily="Arial, sans-serif">
          {name.length > 11 ? name.slice(0, 10) + '…' : name}
        </text>
      ))}
    </svg>
  )
}

// ─── Square Table ─────────────────────────────────────────────────────────────
function SquareTableSVG({ table, occupancy, names, c }: { table: EventTable; occupancy: number; names: string[]; c: Colors }) {
  const tx = 46, ty = 46, ts = 88
  const cx = tx + ts / 2, cy = ty + ts / 2
  const chairR = 8
  const topY = ty - 16, bottomY = ty + ts + 16
  const leftX = tx - 16, rightX = tx + ts + 16
  const sideStart = ty + 12, sideEnd = ty + ts - 12

  const maxChairs = Math.min(table.capacity, 16)
  const [nTop, nRight, nBottom, nLeft] = distribute(maxChairs, 4)

  let filled = 0
  const buildRow = (positions: number[], isX: boolean, fixed: number) => {
    return positions.map(pos => {
      const f = filled < occupancy
      filled++
      return isX ? { x: pos, y: fixed, filled: f } : { x: fixed, y: pos, filled: f }
    })
  }

  const topChairs = buildRow(spreadX(nTop, tx + 12, tx + ts - 12), true, topY)
  const rightChairs = buildRow(spreadY(nRight, sideStart, sideEnd), false, rightX)
  const bottomChairs = buildRow(spreadX(nBottom, tx + 12, tx + ts - 12), true, bottomY)
  const leftChairs = buildRow(spreadY(nLeft, sideStart, sideEnd), false, leftX)

  const shownNames = names.slice(0, 3)

  return (
    <svg width="180" height="180" viewBox="0 0 180 180" style={{ overflow: 'visible', display: 'block' }}>
      {/* shadow */}
      <rect x={tx + 3} y={ty + 4} width={ts} height={ts} rx="5" fill={c.shadow} />
      {/* bottom + right chairs (behind table visually) */}
      {[...bottomChairs, ...rightChairs].map((ch, i) => (
        <ChairCircle key={`br${i}`} cx={ch.x} cy={ch.y} r={chairR} filled={ch.filled} c={c} />
      ))}
      {/* table */}
      <rect x={tx} y={ty} width={ts} height={ts} rx="5" fill={c.cloth} stroke={c.edge} strokeWidth="3" />
      <rect x={tx + 8} y={ty + 8} width={ts - 16} height={ts - 16} rx="3" fill={c.clothInner} stroke={c.edge} strokeWidth="0.5" opacity="0.5" />
      {/* top + left chairs (in front) */}
      {[...topChairs, ...leftChairs].map((ch, i) => (
        <ChairCircle key={`tl${i}`} cx={ch.x} cy={ch.y} r={chairR} filled={ch.filled} c={c} />
      ))}
      {/* table number */}
      <text x={cx} y={cy - 7} textAnchor="middle" fontSize="11" fontWeight="bold" fill={c.text} fontFamily="Arial, sans-serif">
        שולחן {table.tableNo}
      </text>
      {/* occupancy */}
      <text x={cx} y={cy + 7} textAnchor="middle" fontSize="10" fill={c.text} opacity="0.85" fontFamily="Arial, sans-serif">
        {occupancy}/{table.capacity}
      </text>
      {shownNames.map((name, i) => (
        <text key={i} x={cx} y={cy + 19 + i * 10} textAnchor="middle" fontSize="7.5" fill={c.text} opacity="0.65" fontFamily="Arial, sans-serif">
          {name.length > 12 ? name.slice(0, 11) + '…' : name}
        </text>
      ))}
    </svg>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function TableShape({ table, isOver, isOverCapacity, onEdit }: TableShapeProps) {
  const guests = useGuestStore((s) => s.guests)
  const unassignGuest = useGuestStore((s) => s.unassignGuest)
  const deleteTable = useTableStore((s) => s.deleteTable)
  const [showActions, setShowActions] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout>>()

  const handleMouseEnter = () => {
    clearTimeout(hideTimer.current)
    setShowActions(true)
  }
  const handleMouseLeave = () => {
    hideTimer.current = setTimeout(() => setShowActions(false), 200)
  }

  const assignedGuests = guests.filter((g) => g.tableNo === table.tableNo)
  const occupancy = assignedGuests.reduce((sum, g) => sum + g.noOfGuests, 0)
  const isAtCapacity = occupancy >= table.capacity
  const assignedNames = assignedGuests.map((g) => g.name)

  const { setNodeRef: setDropRef } = useDroppable({
    id: table.id,
    data: { tableId: table.id, tableNo: table.tableNo },
  })

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `move-table-${table.id}`,
    data: { tableId: table.id, isTableMove: true },
  })

  const colors = getColors(isOver, isOverCapacity, isAtCapacity)

  const combinedRef = (node: HTMLDivElement | null) => {
    setDropRef(node)
    setDragRef(node)
  }

  return (
    <div
      className="absolute"
      style={{
        left: `${table.x}%`,
        top: `${table.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isDragging ? 50 : showActions ? 20 : 10,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={combinedRef}
        {...attributes}
        {...listeners}
        className={cn('cursor-grab active:cursor-grabbing touch-none select-none', isDragging && 'opacity-60 scale-95')}
      >
        {table.shape === 'round' && (
          <RoundTableSVG table={table} occupancy={occupancy} names={assignedNames} c={colors} />
        )}
        {table.shape === 'rectangle' && (
          <RectTableSVG table={table} occupancy={occupancy} names={assignedNames} c={colors} />
        )}
        {table.shape === 'square' && (
          <SquareTableSVG table={table} occupancy={occupancy} names={assignedNames} c={colors} />
        )}
      </div>

      {showActions && assignedGuests.length > 0 && (
        <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="absolute top-0 left-full ml-3 z-40 bg-white dark:bg-gray-800 border border-border rounded-lg shadow-xl p-3 min-w-[160px] max-w-[220px]">
          <p className="text-xs font-semibold text-foreground mb-2 pb-1 border-b border-border">
            שולחן {table.tableNo} &nbsp;·&nbsp; {occupancy}/{table.capacity}
          </p>
          <ul className="space-y-1">
            {assignedGuests.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="truncate">{g.name}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="font-medium text-foreground">×{g.noOfGuests}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); unassignGuest(g.id) }}
                    className="text-muted-foreground hover:text-destructive transition-colors leading-none"
                    title="הסר מהשולחן"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showActions && (
        <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1 z-30">
          <button
            onClick={() => onEdit(table)}
            className="p-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-border"
            title="ערוך שולחן"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={() => deleteTable(table.id)}
            className="p-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md shadow-md transition-colors border border-border"
            title="מחק שולחן"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {(isAtCapacity || isOverCapacity) && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
          <span className="text-[10px] font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded shadow-sm border border-red-200 dark:border-red-800">
            {isOverCapacity ? 'חריגה מקיבולת!' : 'מלא'}
          </span>
        </div>
      )}
    </div>
  )
}
