import { useRef, useState, useEffect } from 'react'
import {
  Upload,
  Download,
  UserPlus,
  Table2,
  ImageIcon,
  BarChart3,
  Moon,
  Sun,
  Heart,
  RotateCcw,
  LogOut,
  Users,
  HelpCircle,
  Wand2,
} from 'lucide-react'
import { exportToExcel } from '../services/excelExportService'
import { useGuestStore } from '../store/guestStore'
import { useTableStore } from '../store/tableStore'
import { useLayoutStore } from '../store/layoutStore'
import { useAuthStore } from '../store/authStore'
import { useRulesStore } from '../store/rulesStore'
import { autoSeat } from '../utils/autoSeating'
import { GuestDialog } from '../dialogs/GuestDialog'
import { TableDialog } from '../dialogs/TableDialog'
import { ImportDialog } from '../dialogs/ImportDialog'
import { StatisticsDialog } from '../dialogs/StatisticsDialog'
import { TablesReportDialog } from '../dialogs/TablesReportDialog'
import { UserManagementDialog } from '../dialogs/UserManagementDialog'

export function Toolbar() {
  const guests = useGuestStore((s) => s.guests)
  const setGuests = useGuestStore((s) => s.setGuests)
  const assignGuest = useGuestStore((s) => s.assignGuest)
  const tables = useTableStore((s) => s.tables)
  const setTables = useTableStore((s) => s.setTables)
  const setBlueprintImage = useLayoutStore((s) => s.setBlueprintImage)
  const rules = useRulesStore((s) => s.rules)

  const currentUserId = useAuthStore((s) => s.currentUserId)
  const users = useAuthStore((s) => s.users)
  const logout = useAuthStore((s) => s.logout)
  const currentUser = users.find((u) => u.id === currentUserId) ?? null

  const [fillTables, setFillTables] = useState(true)
  const [guestDialogOpen, setGuestDialogOpen] = useState(false)
  const [tableDialogOpen, setTableDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [statisticsDialogOpen, setStatisticsDialogOpen] = useState(false)
  const [tablesReportOpen, setTablesReportOpen] = useState(false)
  const [userMgmtOpen, setUserMgmtOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [showImportHelp, setShowImportHelp] = useState(false)

  const blueprintInputRef = useRef<HTMLInputElement>(null)
  const importHelpRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dark = document.documentElement.classList.contains('dark')
    setIsDark(dark)
  }, [])

  // Close import help popover on outside click
  useEffect(() => {
    if (!showImportHelp) return
    const handler = (e: MouseEvent) => {
      if (importHelpRef.current && !importHelpRef.current.contains(e.target as Node)) {
        setShowImportHelp(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showImportHelp])

  const handleAutoSeat = () => {
    const assignments = autoSeat(guests, tables, rules, fillTables)
    for (const [guestId, tableNo] of Object.entries(assignments)) {
      assignGuest(guestId, tableNo)
    }
  }

  const handleReset = () => {
    if (confirmReset) {
      setGuests([])
      setTables([])
      setBlueprintImage(null)
      setConfirmReset(false)
    } else {
      setConfirmReset(true)
      setTimeout(() => setConfirmReset(false), 3000)
    }
  }

  const toggleDarkMode = () => {
    const html = document.documentElement
    if (html.classList.contains('dark')) {
      html.classList.remove('dark')
      setIsDark(false)
    } else {
      html.classList.add('dark')
      setIsDark(true)
    }
  }

  const handleBlueprintUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string
      if (dataUrl) setBlueprintImage(dataUrl)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const buttonBase =
    'inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1'

  return (
    <>
      <header className="flex items-center justify-between px-4 py-2 bg-card border-b border-border shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary fill-primary" />
          <span className="font-bold text-foreground text-lg">סידור הושבה</span>
          {currentUser && (
            <span className="text-xs text-muted-foreground">· {currentUser.username}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Import Excel + ? help */}
          <div className="relative flex items-center gap-0.5" ref={importHelpRef}>
            <button
              onClick={() => setImportDialogOpen(true)}
              className={`${buttonBase} bg-secondary text-secondary-foreground hover:bg-secondary/80`}
              title="ייבוא אורחים מ-Excel"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">ייבוא Excel</span>
            </button>
            <button
              onClick={() => setShowImportHelp((v) => !v)}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded"
              title="פורמט קובץ Excel"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            {showImportHelp && (
              <div className="absolute top-full mt-2 left-0 z-50 bg-card border border-border rounded-lg shadow-xl p-4 min-w-[320px] text-sm">
                <p className="font-semibold text-foreground mb-2">פורמט קובץ Excel לייבוא</p>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-right py-1 px-2 text-muted-foreground font-medium">עמודה</th>
                      <th className="text-right py-1 px-2 text-muted-foreground font-medium">חובה</th>
                      <th className="text-right py-1 px-2 text-muted-foreground font-medium">תיאור</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground">
                    {[
                      { col: 'name', req: '✓', desc: 'שם מלא' },
                      { col: 'no_of_guests', req: '✓', desc: 'מספר מוזמנים (מינימום 1)' },
                      { col: 'group', req: '', desc: 'קבוצה (למשל: משפחה)' },
                      { col: 'side', req: '', desc: 'צד (למשל: כלה / חתן)' },
                      { col: 'table_no', req: '', desc: 'שולחן — ריק = לא משובץ' },
                    ].map(({ col, req, desc }) => (
                      <tr key={col} className="border-b border-border/50">
                        <td className="py-1 px-2 font-mono text-primary">{col}</td>
                        <td className="py-1 px-2 text-center text-green-600 dark:text-green-400">{req}</td>
                        <td className="py-1 px-2 text-muted-foreground">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-muted-foreground">שורה 1 חייבת להיות כותרת העמודות.</p>
              </div>
            )}
          </div>

          <button
            onClick={() => exportToExcel(guests)}
            className={`${buttonBase} bg-secondary text-secondary-foreground hover:bg-secondary/80`}
            title="ייצוא אורחים ל-Excel"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">ייצוא Excel</span>
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          <button
            onClick={() => setGuestDialogOpen(true)}
            className={`${buttonBase} bg-primary text-primary-foreground hover:bg-primary/90`}
            title="הוסף אורח חדש"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">הוסף אורח</span>
          </button>

          <button
            onClick={() => setTableDialogOpen(true)}
            className={`${buttonBase} bg-primary text-primary-foreground hover:bg-primary/90`}
            title="הוסף שולחן חדש"
          >
            <Table2 className="w-4 h-4" />
            <span className="hidden sm:inline">הוסף שולחן</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={handleAutoSeat}
              className={`${buttonBase} bg-primary text-primary-foreground hover:bg-primary/90`}
              title="סידור אוטומטי לפי חוקי ישיבה"
            >
              <Wand2 className="w-4 h-4" />
              <span className="hidden sm:inline">סידור אוטומטי</span>
            </button>
            <label
              className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer select-none px-1"
              title="מלא שולחנות לפני פתיחת שולחן חדש"
            >
              <input
                type="checkbox"
                checked={fillTables}
                onChange={(e) => setFillTables(e.target.checked)}
                className="accent-primary w-3.5 h-3.5"
              />
              <span className="hidden sm:inline">מלא</span>
            </label>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          <button
            onClick={() => blueprintInputRef.current?.click()}
            className={`${buttonBase} bg-secondary text-secondary-foreground hover:bg-secondary/80`}
            title="העלה תשריט אולם"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">תשריט</span>
          </button>
          <input
            ref={blueprintInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBlueprintUpload}
          />

          <button
            onClick={() => setStatisticsDialogOpen(true)}
            className={`${buttonBase} bg-secondary text-secondary-foreground hover:bg-secondary/80`}
            title="הצג סטטיסטיקות אירוע"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">סטטיסטיקה</span>
          </button>

          <button
            onClick={() => setTablesReportOpen(true)}
            className={`${buttonBase} bg-secondary text-secondary-foreground hover:bg-secondary/80`}
            title="דוח שולחנות"
          >
            <Table2 className="w-4 h-4" />
            <span className="hidden sm:inline">שולחנות</span>
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          <button
            onClick={toggleDarkMode}
            className={`${buttonBase} bg-secondary text-secondary-foreground hover:bg-secondary/80`}
            title={isDark ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={handleReset}
            className={`${buttonBase} ${
              confirmReset
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
            title="אפס את כל הנתונים"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">{confirmReset ? 'בטוח?' : 'אפס'}</span>
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          {currentUser?.isAdmin && (
            <button
              onClick={() => setUserMgmtOpen(true)}
              className={`${buttonBase} bg-secondary text-secondary-foreground hover:bg-secondary/80`}
              title="ניהול משתמשים"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">משתמשים</span>
            </button>
          )}

          <button
            onClick={logout}
            className={`${buttonBase} bg-secondary text-secondary-foreground hover:bg-secondary/80`}
            title="התנתק"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">התנתק</span>
          </button>
        </div>
      </header>

      <GuestDialog open={guestDialogOpen} onClose={() => setGuestDialogOpen(false)} />
      <TableDialog open={tableDialogOpen} onClose={() => setTableDialogOpen(false)} />
      <ImportDialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} />
      <StatisticsDialog open={statisticsDialogOpen} onClose={() => setStatisticsDialogOpen(false)} />
      <TablesReportDialog open={tablesReportOpen} onClose={() => setTablesReportOpen(false)} />
      <UserManagementDialog open={userMgmtOpen} onClose={() => setUserMgmtOpen(false)} />
    </>
  )
}
