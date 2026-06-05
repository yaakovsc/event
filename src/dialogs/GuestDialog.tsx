import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { X } from 'lucide-react'
import { useGuestStore } from '../store/guestStore'
import { useTableStore } from '../store/tableStore'
import { cn } from '../utils/cn'
import type { Guest } from '../types'

const schema = z.object({
  name: z.string().min(1, 'שם הוא שדה חובה'),
  group: z.string(),
  side: z.string(),
  noOfGuests: z.number().min(1, 'חייב להיות לפחות 1'),
  tableNo: z.string(),
})

type FormValues = {
  name: string
  group: string
  side: string
  noOfGuests: number
  tableNo: string
}

interface GuestDialogProps {
  open: boolean
  onClose: () => void
  guest?: Guest
}

export function GuestDialog({ open, onClose, guest }: GuestDialogProps) {
  const addGuest = useGuestStore((s) => s.addGuest)
  const updateGuest = useGuestStore((s) => s.updateGuest)
  const tables = useTableStore((s) => s.tables)

  const isEdit = !!guest

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: '',
      group: '',
      side: '',
      noOfGuests: 1,
      tableNo: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: guest?.name ?? '',
        group: guest?.group ?? '',
        side: guest?.side ?? '',
        noOfGuests: guest?.noOfGuests ?? 1,
        tableNo: guest?.tableNo ?? '',
      })
    }
  }, [open, guest, reset])

  const onSubmit = (data: FormValues) => {
    const tableNo = data.tableNo === '' ? null : data.tableNo

    if (isEdit && guest) {
      updateGuest({ ...guest, ...data, tableNo })
    } else {
      addGuest({
        id: uuidv4(),
        name: data.name,
        group: data.group,
        side: data.side,
        noOfGuests: data.noOfGuests,
        tableNo,
      })
    }
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            {isEdit ? 'ערוך אורח' : 'הוסף אורח'}
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
              שם <span className="text-destructive">*</span>
            </label>
            <input
              {...register('name')}
              type="text"
              className={cn(
                'w-full px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground',
                errors.name ? 'border-destructive' : 'border-input'
              )}
              placeholder="שם מלא"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">קבוצה</label>
              <input
                {...register('group')}
                type="text"
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                placeholder="למשל: צד הכלה"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">צד</label>
              <input
                {...register('side')}
                type="text"
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                placeholder="למשל: כלה"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              מספר אורחים <span className="text-destructive">*</span>
            </label>
            <input
              {...register('noOfGuests', { valueAsNumber: true })}
              type="number"
              min={1}
              className={cn(
                'w-full px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground',
                errors.noOfGuests ? 'border-destructive' : 'border-input'
              )}
            />
            {errors.noOfGuests && (
              <p className="mt-1 text-xs text-destructive">{errors.noOfGuests.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">שולחן</label>
            <select
              {...register('tableNo')}
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            >
              <option value="">— ללא שיבוץ —</option>
              {tables.map((t) => (
                <option key={t.id} value={t.tableNo}>
                  שולחן {t.tableNo} (קיבולת {t.capacity})
                </option>
              ))}
            </select>
          </div>

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
              {isEdit ? 'שמור שינויים' : 'הוסף אורח'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
