import { useGuestStore } from '../store/guestStore'
import { useTableStore } from '../store/tableStore'

export function TablesReportPanel() {
  const guests = useGuestStore((s) => s.guests)
  const tables = useTableStore((s) => s.tables)

  const guestsByTable = (tableNo: string) =>
    guests.filter((g) => g.tableNo === tableNo)

  return (
    <div
      id="tables-report-venue"
      className="relative w-full border border-border rounded bg-white dark:bg-gray-950"
      style={{
        aspectRatio: '297/210',
        backgroundImage: `
          linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)
        `,
        backgroundSize: '5% 5%',
      }}
    >
      {tables.map((table) => {
        const tableGuests = guestsByTable(table.tableNo)
        const total = tableGuests.reduce((s, g) => s + g.noOfGuests, 0)

        return (
          <div
            key={table.id}
            className="absolute bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-500 rounded shadow-sm overflow-hidden"
            style={{
              left: `${table.x}%`,
              top: `${table.y}%`,
              transform: 'translate(-50%, -50%)',
              width: '9%',
              minWidth: '72px',
            }}
          >
            <div
              className="bg-gray-800 dark:bg-gray-700 text-white text-center font-bold px-1 py-px leading-tight"
              style={{ fontSize: '8px' }}
            >
              {table.tableNo}
            </div>

            <div className="px-1 pt-0.5 pb-px" dir="rtl">
              {tableGuests.map((g) => (
                <div
                  key={g.id}
                  className="flex justify-between items-baseline gap-0.5 leading-tight"
                  style={{ fontSize: '7.5px' }}
                >
                  <span className="truncate text-gray-800 dark:text-gray-200">{g.name}</span>
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">({g.noOfGuests})</span>
                </div>
              ))}
              {tableGuests.length === 0 && (
                <div className="text-gray-400 italic text-center" style={{ fontSize: '7px' }}>
                  ריק
                </div>
              )}
            </div>

            <div
              className="bg-gray-100 dark:bg-gray-800 text-center border-t border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold leading-tight px-1"
              style={{ fontSize: '7.5px' }}
            >
              {total}/{table.capacity}
            </div>
          </div>
        )
      })}

      {tables.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
          אין שולחנות להצגה
        </div>
      )}
    </div>
  )
}
