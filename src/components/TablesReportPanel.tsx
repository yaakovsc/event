import { useGuestStore } from '../store/guestStore'
import { useTableStore } from '../store/tableStore'

export function TablesReportPanel() {
  const guests = useGuestStore((s) => s.guests)
  const tables = useTableStore((s) => s.tables)

  const sortedTables = [...tables].sort((a, b) => {
    const na = parseFloat(a.tableNo) || 0
    const nb = parseFloat(b.tableNo) || 0
    return na !== nb ? na - nb : a.tableNo.localeCompare(b.tableNo)
  })

  const guestsByTable = (tableNo: string) =>
    guests.filter((g) => g.tableNo === tableNo)

  const unassigned = guests.filter((g) => g.tableNo === null)

  return (
    <div className="space-y-4" dir="rtl">
      {sortedTables.map((table) => {
        const tableGuests = guestsByTable(table.tableNo)
        const totalSeated = tableGuests.reduce((s, g) => s + g.noOfGuests, 0)

        return (
          <div key={table.id} className="border border-border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-2 flex items-center justify-between">
              <span className="font-semibold text-foreground">שולחן {table.tableNo}</span>
              <span className="text-sm text-muted-foreground">
                קיבולת: {table.capacity} | משובצים: {totalSeated}
              </span>
            </div>

            {tableGuests.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">אין אורחים משובצים</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">שם</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">קבוצה</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">צד</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">מספר</th>
                  </tr>
                </thead>
                <tbody>
                  {tableGuests.map((guest) => (
                    <tr key={guest.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2 text-foreground">{guest.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{guest.group}</td>
                      <td className="px-3 py-2 text-muted-foreground">{guest.side}</td>
                      <td className="px-3 py-2 font-medium text-foreground">{guest.noOfGuests}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50 border-t border-border">
                    <td colSpan={3} className="px-4 py-2 text-sm font-semibold text-foreground">סה״כ</td>
                    <td className="px-3 py-2 font-bold text-primary">
                      {totalSeated} / {table.capacity}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        )
      })}

      {unassigned.length > 0 && (
        <div className="border border-orange-300 dark:border-orange-700 rounded-lg overflow-hidden">
          <div className="bg-orange-50 dark:bg-orange-950/40 px-4 py-2 flex items-center justify-between">
            <span className="font-semibold text-orange-700 dark:text-orange-400">לא משובצים</span>
            <span className="text-sm text-orange-600 dark:text-orange-500">
              {unassigned.reduce((s, g) => s + g.noOfGuests, 0)} אורחים
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">שם</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">קבוצה</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">צד</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">מספר</th>
              </tr>
            </thead>
            <tbody>
              {unassigned.map((guest) => (
                <tr key={guest.id} className="border-b border-orange-100 dark:border-orange-900/50 last:border-0">
                  <td className="px-4 py-2 text-foreground">{guest.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{guest.group}</td>
                  <td className="px-3 py-2 text-muted-foreground">{guest.side}</td>
                  <td className="px-3 py-2 font-medium text-foreground">{guest.noOfGuests}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-orange-50/50 dark:bg-orange-950/20 border-t border-orange-200 dark:border-orange-800">
                <td colSpan={3} className="px-4 py-2 text-sm font-semibold text-foreground">סה״כ</td>
                <td className="px-3 py-2 font-bold text-orange-600 dark:text-orange-400">
                  {unassigned.reduce((s, g) => s + g.noOfGuests, 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {tables.length === 0 && guests.length === 0 && (
        <p className="text-center text-muted-foreground py-8">אין נתונים להצגה</p>
      )}
    </div>
  )
}
