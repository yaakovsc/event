import { useState, useRef } from 'react'
import { X, Upload, AlertCircle } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { useGuestStore } from '../store/guestStore'
import { importFromExcel } from '../services/excelImportService'
import { useToast } from '../components/Toast'
import { cn } from '../utils/cn'
import type { Guest } from '../types'

interface ImportDialogProps {
  open: boolean
  onClose: () => void
}

type ImportMode = 'replace' | 'merge'

export function ImportDialog({ open, onClose }: ImportDialogProps) {
  const setGuests = useGuestStore((s) => s.setGuests)
  const addGuest = useGuestStore((s) => s.addGuest)
  const existingGuests = useGuestStore((s) => s.guests)
  const showToast = useToast()

  const [mode, setMode] = useState<ImportMode>('replace')
  const [preview, setPreview] = useState<Guest[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setIsLoading(true)
    setPreview([])
    setErrors([])

    try {
      const result = await importFromExcel(file)
      setPreview(result.guests)
      setErrors(result.errors)
    } catch (err) {
      setErrors([`Failed to read file: ${err instanceof Error ? err.message : String(err)}`])
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = () => {
    if (preview.length === 0) return

    if (mode === 'replace') {
      setGuests(preview)
      showToast(`יובאו ${preview.length} אורחים (הוחלפו כולם)`, 'success')
    } else {
      const existingNames = new Set(existingGuests.map((g) => g.name.toLowerCase()))
      let added = 0
      let skipped = 0

      preview.forEach((guest) => {
        if (existingNames.has(guest.name.toLowerCase())) {
          skipped++
        } else {
          addGuest({ ...guest, id: uuidv4() })
          added++
        }
      })

      showToast(
        `יובאו ${added} אורחים${skipped > 0 ? `, דולגו על ${skipped} כפילויות` : ''}`,
        'success'
      )
    }

    onClose()
    resetState()
  }

  const resetState = () => {
    setPreview([])
    setErrors([])
    setFileName('')
    setMode('replace')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = () => {
    onClose()
    resetState()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <h2 className="text-lg font-semibold text-foreground">ייבוא אורחים מ-Excel</h2>
          <button
            onClick={handleClose}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          <div
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-foreground font-medium">
              {fileName || 'לחץ לבחירת קובץ Excel'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">תומך בפורמטים .xlsx ו-.xls</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-2">מצב ייבוא</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="replace"
                  checked={mode === 'replace'}
                  onChange={() => setMode('replace')}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">החלפה (מחק הכל וייבא מחדש)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="merge"
                  checked={mode === 'merge'}
                  onChange={() => setMode('merge')}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">מיזוג (דלג על כפילויות לפי שם)</span>
              </label>
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted rounded-md p-3">
            <p className="font-medium text-foreground mb-1">עמודות נדרשות בקובץ:</p>
            <code className="text-xs">name, group, side, no_of_guests, table_no</code>
          </div>

          {isLoading && (
            <div className="text-center py-4">
              <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground mt-2">קורא קובץ...</p>
            </div>
          )}

          {errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-sm font-medium text-destructive">{errors.length} שגיאות אימות</p>
              </div>
              <ul className="space-y-1">
                {errors.map((err, i) => (
                  <li key={i} className="text-xs text-destructive/90">
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {preview.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                תצוגה מקדימה ({preview.length} אורחים) — מציג 10 ראשונים
              </p>
              <div className="border border-border rounded-md overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-right font-medium text-foreground">שם</th>
                      <th className="px-3 py-2 text-right font-medium text-foreground">קבוצה</th>
                      <th className="px-3 py-2 text-right font-medium text-foreground">צד</th>
                      <th className="px-3 py-2 text-center font-medium text-foreground">#</th>
                      <th className="px-3 py-2 text-center font-medium text-foreground">שולחן</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((guest, i) => (
                      <tr
                        key={guest.id}
                        className={cn(
                          'border-t border-border',
                          i % 2 === 0 ? 'bg-card' : 'bg-muted/30'
                        )}
                      >
                        <td className="px-3 py-2 text-foreground font-medium">{guest.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{guest.group}</td>
                        <td className="px-3 py-2 text-muted-foreground">{guest.side}</td>
                        <td className="px-3 py-2 text-center text-foreground">{guest.noOfGuests}</td>
                        <td className="px-3 py-2 text-center text-muted-foreground">
                          {guest.tableNo ?? '—'}
                        </td>
                      </tr>
                    ))}
                    {preview.length > 10 && (
                      <tr className="border-t border-border bg-muted/50">
                        <td colSpan={5} className="px-3 py-2 text-center text-muted-foreground text-xs">
                          ... ועוד {preview.length - 10} נוספים
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 flex-shrink-0 border-t border-border mt-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
          >
            ביטול
          </button>
          <button
            onClick={handleImport}
            disabled={preview.length === 0 || isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {preview.length > 0 ? `ייבוא ${preview.length} אורחים` : 'ייבוא'}
          </button>
        </div>
      </div>
    </div>
  )
}
