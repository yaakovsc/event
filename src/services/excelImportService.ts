import * as XLSX from 'xlsx'
import { v4 as uuidv4 } from 'uuid'
import type { Guest } from '../types'

interface ImportResult {
  guests: Guest[]
  errors: string[]
}

interface RawRow {
  name?: unknown
  group?: unknown
  side?: unknown
  no_of_guests?: unknown
  table_no?: unknown
}

export async function importFromExcel(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result
      if (!data) {
        resolve({ guests: [], errors: ['Failed to read file'] })
        return
      }

      try {
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) {
          resolve({ guests: [], errors: ['No sheets found in workbook'] })
          return
        }

        const worksheet = workbook.Sheets[sheetName]
        const rows: RawRow[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

        const guests: Guest[] = []
        const errors: string[] = []

        rows.forEach((row, index) => {
          const rowNum = index + 2 // +2 because row 1 is header

          const name = String(row.name ?? '').trim()
          if (!name) {
            errors.push(`Row ${rowNum}: name is required`)
            return
          }

          const rawNoOfGuests = Number(row.no_of_guests)
          if (isNaN(rawNoOfGuests) || rawNoOfGuests < 1) {
            errors.push(`Row ${rowNum}: no_of_guests must be a number greater than 0`)
            return
          }

          const tableNoRaw = String(row.table_no ?? '').trim()
          const tableNo = tableNoRaw === '' ? null : tableNoRaw

          guests.push({
            id: uuidv4(),
            name,
            group: String(row.group ?? '').trim(),
            side: String(row.side ?? '').trim(),
            noOfGuests: Math.floor(rawNoOfGuests),
            tableNo,
          })
        })

        resolve({ guests, errors })
      } catch (err) {
        resolve({
          guests: [],
          errors: [`Failed to parse Excel file: ${err instanceof Error ? err.message : String(err)}`],
        })
      }
    }
    reader.readAsBinaryString(file)
  })
}
