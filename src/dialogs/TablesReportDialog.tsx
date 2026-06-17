import { X, Printer } from 'lucide-react'
import { TablesReportPanel } from '../components/TablesReportPanel'

function handlePrint() {
  const existing = document.getElementById('tables-report-print-css')
  if (existing) existing.remove()

  const style = document.createElement('style')
  style.id = 'tables-report-print-css'
  style.textContent = `
    @media print {
      @page { size: landscape; margin: 5mm; }
      body * { visibility: hidden !important; }
      #tables-report-venue, #tables-report-venue * { visibility: visible !important; }
      #tables-report-venue {
        position: fixed !important;
        inset: 0 !important;
        width: 100% !important;
        height: auto !important;
        aspect-ratio: 297/210 !important;
        border: none !important;
        box-shadow: none !important;
        background: white !important;
        background-image: none !important;
      }
    }
  `
  document.head.appendChild(style)
  window.print()
  document.head.removeChild(style)
}

interface TablesReportDialogProps {
  open: boolean
  onClose: () => void
}

export function TablesReportDialog({ open, onClose }: TablesReportDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-stretch p-3">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl flex flex-col w-full">

        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-foreground" dir="rtl">דוח שולחנות — פריסת אולם</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-4 flex items-center justify-center">
          <div className="w-full">
            <TablesReportPanel />
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border shrink-0 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 flex-1 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Printer className="w-4 h-4" />
            הדפס / שמור כ-PDF
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
          >
            סגור
          </button>
        </div>

      </div>
    </div>
  )
}
