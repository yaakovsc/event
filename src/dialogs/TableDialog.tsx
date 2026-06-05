import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { X } from 'lucide-react'
import { useTableStore } from '../store/tableStore'
import { cn } from '../utils/cn'
import type { EventTable } from '../types'

const schema = z.object({
  tableNo: z.string().min(1, 'מספר שולחן הוא שדה חובה'),
  capacity: z.number().min(1, 'הקיבולת חייבת להיות לפחות 1'),
  shape: z.enum(['round', 'rectangle', 'square']),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
})

type FormValues = {
  tableNo: string
  capacity: number
  shape: 'round' | 'rectangle' | 'square'
  x: number
  y: number
}

interface TableDialogProps {
  open: boolean
  onClose: () => void
  table?: EventTable
}

function nextTableNo(base: string, i: number): string {
  const n = parseInt(base, 10)
  if (!isNaN(n) && String(n) === base.trim()) return String(n + i)
  return i === 0 ? base : `${base}${i + 1}`
}

const COLS = 5
const X_STEP = 16
const Y_STEP = 18

export function TableDialog({ open, onClose, table }: TableDialogProps) {
  const addTable = useTableStore((s) => s.addTable)
  const updateTable = useTableStore((s) => s.updateTable)

  const isEdit = !!table
  const [count, setCount] = useState(1)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      tableNo: '',
      capacity: 8,
      shape: 'round',
      x: 50,
      y: 50,
    },
  })

  useEffect(() => {
    if (open) {
      setCount(1)
      reset({
        tableNo: table?.tableNo ?? '',
        capacity: table?.capacity ?? 8,
        shape: table?.shape ?? 'round',
        x: table?.x ?? 50,
        y: table?.y ?? 50,
      })
    }
  }, [open, table, reset])

  const onSubmit = (data: FormValues) => {
    if (isEdit && table) {
      updateTable({ ...table, ...data })
    } else {
      for (let i = 0; i < count; i++) {
        const col = i % COLS
        const row = Math.floor(i / COLS)
        const x = Math.min(96, Math.max(4, data.x + col * X_STEP))
        const y = Math.min(96, Math.max(4, data.y + row * Y_STEP))
        addTable({
          id: uuidv4(),
          tableNo: nextTableNo(data.tableNo, i),
          capacity: data.capacity,
          shape: data.shape,
          x,
          y,
        })
      }
    }
    onClose()
  }

  const tableNoValue = watch('tableNo')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            {isEdit ? 'ערוך שולחן' : 'הוסף שולחן'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {!isEdit && count > 1 ? 'מספר שולחן התחלתי' : 'מספר שולחן'}{' '}
              <span className="text-destructive">*</span>
            </label>
            <input
              {...register('tableNo')}
              type="text"
              className={cn(
                'w-full px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground',
                errors.tableNo ? 'border-destructive' : 'border-input'
              )}
              placeholder="למשל: 1, א, VIP"
            />
            {errors.tableNo && (
              <p className="mt-1 text-xs text-destructive">{errors.tableNo.message}</p>
            )}
            {!isEdit && count > 1 && tableNoValue && (
              <p className="mt-1 text-xs text-muted-foreground">
                יווצרו שולחנות:{' '}
                {Array.from({ length: Math.min(count, 5) }, (_, i) => nextTableNo(tableNoValue, i)).join(', ')}
                {count > 5 ? ` … ${nextTableNo(tableNoValue, count - 1)}` : ''}
              </p>
            )}
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">כמות שולחנות</label>
              <input
                type="number"
                min={1}
                max={30}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              קיבולת <span className="text-destructive">*</span>
            </label>
            <input
              {...register('capacity', { valueAsNumber: true })}
              type="number"
              min={1}
              className={cn(
                'w-full px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground',
                errors.capacity ? 'border-destructive' : 'border-input'
              )}
            />
            {errors.capacity && (
              <p className="mt-1 text-xs text-destructive">{errors.capacity.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">צורה</label>
            <select
              {...register('shape')}
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            >
              <option value="round">עגול</option>
              <option value="rectangle">מלבן</option>
              <option value="square">ריבוע</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {!isEdit && count > 1 ? 'מיקום X התחלתי' : 'מיקום X'} (0-100)
              </label>
              <input
                {...register('x', { valueAsNumber: true })}
                type="number"
                min={0}
                max={100}
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {!isEdit && count > 1 ? 'מיקום Y התחלתי' : 'מיקום Y'} (0-100)
              </label>
              <input
                {...register('y', { valueAsNumber: true })}
                type="number"
                min={0}
                max={100}
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              />
            </div>
          </div>

          {!isEdit && count > 1 && (
            <p className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded-md">
              השולחנות יפוזרו אוטומטית בשורות של {COLS} עם רווח של {X_STEP}% בין עמודות ו-{Y_STEP}% בין שורות.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {isEdit ? 'שמור שינויים' : count > 1 ? `הוסף ${count} שולחנות` : 'הוסף שולחן'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
