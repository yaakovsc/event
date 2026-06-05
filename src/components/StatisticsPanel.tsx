import { useGuestStore } from '../store/guestStore'
import { useTableStore } from '../store/tableStore'

export function StatisticsPanel() {
  const guests = useGuestStore((s) => s.guests)
  const tables = useTableStore((s) => s.tables)

  const totalGuests = guests.reduce((sum, g) => sum + g.noOfGuests, 0)
  const totalParties = guests.length
  const totalTables = tables.length
  const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0)

  const assignedGuests = guests.filter((g) => g.tableNo !== null)
  const occupiedSeats = assignedGuests.reduce((sum, g) => sum + g.noOfGuests, 0)
  const availableSeats = totalCapacity - occupiedSeats

  const unassignedParties = guests.filter((g) => g.tableNo === null).length
  const unassignedGuests = guests.filter((g) => g.tableNo === null).reduce((sum, g) => sum + g.noOfGuests, 0)

  const occupancyPct = totalCapacity > 0 ? ((occupiedSeats / totalCapacity) * 100).toFixed(1) : '0.0'

  const stats = [
    { label: 'סה״כ אורחים', value: totalGuests, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'סה״כ קבוצות', value: totalParties, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'סה״כ שולחנות', value: totalTables, color: 'text-purple-600 dark:text-purple-400' },
    { label: 'קיבולת כוללת', value: totalCapacity, color: 'text-purple-600 dark:text-purple-400' },
    { label: 'מושבים תפוסים', value: occupiedSeats, color: 'text-green-600 dark:text-green-400' },
    { label: 'מושבים פנויים', value: availableSeats, color: 'text-green-600 dark:text-green-400' },
    { label: 'קבוצות לא משובצות', value: unassignedParties, color: 'text-orange-600 dark:text-orange-400' },
    { label: 'אורחים לא משובצים', value: unassignedGuests, color: 'text-orange-600 dark:text-orange-400' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-muted rounded-lg p-4 flex flex-col items-center"
          >
            <span className={`text-3xl font-bold ${stat.color}`}>{stat.value}</span>
            <span className="text-sm text-muted-foreground mt-1 text-center">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-muted rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-foreground">תפוסה</span>
          <span className="text-lg font-bold text-primary">{occupancyPct}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-3">
          <div
            className="bg-primary h-3 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, parseFloat(occupancyPct))}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-right">
          {occupiedSeats} / {totalCapacity} מקומות
        </p>
      </div>
    </div>
  )
}
