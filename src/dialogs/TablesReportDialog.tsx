import { X, Printer } from 'lucide-react'
import { TablesReportPanel } from '../components/TablesReportPanel'

const PRINT_STYLE_ID = 'tables-report-print-style'

function handlePrint() {
  if (!document.getElementById(PRINT_STYLE_ID)) {
    const style = document.createElement('style')
    style.id = PRINT_STYLE_ID
    style.textContent = `
      @media print {
        body > *:not(#tables-report-print-root) { display: none !important; }
        #tables-report-print-root {
          display: block !important;
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: white;
          padding: 24px;
          color: black;
        }
        #tables-report-print-root .no-print { display: none !important; }
      }
    `
    document.head.appendChild(style)
  }

  const existing = document.getElementById(PRINT_STYLE_ID + '-root')
  if (existing) existing.remove()

  const panel = document.getElementById('tables-report-panel')
  if (!panel) return

  const root = document.createElement('div')
  root.id = 'tables-report-print-root'
  root.innerHTML = `<h1 style="font-size:18px;font-weight:700;margin-bottom:16px;direction:rtl;">דוח שולחנות</h1>` + panel.innerHTML
  document.body.appendChild(root)

  window.print()

  root.remove()
}

interface TablesReportDialogProps {
  open: boolean
  onClose: () => void
}

export function TablesReportDialog({ open, onClose }: TablesReportDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold text-foreground" dir="rtl">דוח שולחנות</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div id="tables-report-panel" className="overflow-y-auto flex-1 px-6 py-4">
          <TablesReportPanel />
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0 flex gap-3 no-print">
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
