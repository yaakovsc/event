import * as XLSX from 'xlsx'
import type { Guest } from '../types'

export function exportToExcel(guests: Guest[]): void {
  const rows = guests.map((guest) => ({
    name: guest.name,
    group: guest.group,
    side: guest.side,
    no_of_guests: guest.noOfGuests,
    table_no: guest.tableNo ?? '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)

  // Set column widths
  worksheet['!cols'] = [
    { wch: 30 }, // name
    { wch: 20 }, // group
    { wch: 15 }, // side
    { wch: 14 }, // no_of_guests
    { wch: 12 }, // table_no
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Guests')

  const date = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `seating-plan-${date}.xlsx`)
}
