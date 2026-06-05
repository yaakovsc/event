import { useState, useEffect } from 'react'
import { X, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { useRulesStore, emptyRule } from '../store/rulesStore'
import { useGuestStore } from '../store/guestStore'
import { GuestMultiSelect } from '../components/GuestMultiSelect'
import type { Guest, GuestRule, WorkRelationType, CustomQuestion } from '../types'
import { cn } from '../utils/cn'

interface RulesDialogProps {
  open: boolean
  onClose: () => void
  guest: Guest
}

const WORK_TYPE_LABELS: Record<WorkRelationType, string> = {
  manager: 'מנהל שלי',
  subordinate: 'כפוף לי',
  colleague: 'עמית',
}

const EXTRA_PRESETS = [
  { key: 'synagogue',   label: '🕍 איזה בית כנסת מתפלל' },
  { key: 'buildingName',label: '🏢 גר במתחם / בניין (שם)' },
  { key: 'sameBuilding',label: '🏠 גר בבניין עם (אנשים)' },
  { key: 'isElderly',   label: '👴 אורח מבוגר' },
  { key: 'isYoung',     label: '🧒 אורח צעיר' },
  { key: 'custom',      label: '✏️ שאלה חופשית' },
]

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/40 hover:bg-muted transition-colors text-sm font-medium text-foreground"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="p-3 space-y-2">{children}</div>}
    </div>
  )
}

function WorkRelationRow({
  guestId,
  type,
  onRemove,
  onTypeChange,
}: {
  guestId: string
  type: WorkRelationType
  onRemove: () => void
  onTypeChange: (t: WorkRelationType) => void
}) {
  const name = useGuestStore((s) => s.guests.find((g) => g.id === guestId)?.name ?? guestId)
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 bg-muted rounded-md">
      <span className="flex-1 text-sm text-foreground truncate">{name}</span>
      <select
        value={type}
        onChange={(e) => onTypeChange(e.target.value as WorkRelationType)}
        className="text-xs bg-background border border-input rounded px-1 py-0.5 focus:outline-none text-foreground"
      >
        {Object.entries(WORK_TYPE_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <button type="button" onClick={onRemove} className="p-0.5 text-muted-foreground hover:text-destructive transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export function RulesDialog({ open, onClose, guest }: RulesDialogProps) {
  const storedRules = useRulesStore((s) => s.rules)
  const setRule = useRulesStore((s) => s.setRule)

  const [rule, setLocalRule] = useState<GuestRule>(() => emptyRule(guest.id))
  const [showExtraMenu, setShowExtraMenu] = useState(false)
  const [visibleExtras, setVisibleExtras] = useState<Set<string>>(new Set())
  const [newWorkGuests, setNewWorkGuests] = useState<string[]>([])
  const [newWorkType, setNewWorkType] = useState<WorkRelationType>('colleague')

  useEffect(() => {
    if (!open) return
    const existing = storedRules[guest.id]
    const r = existing ?? emptyRule(guest.id)
    setLocalRule(r)
    const extras = new Set<string>()
    if (r.synagogue) extras.add('synagogue')
    if (r.buildingName) extras.add('buildingName')
    if (r.sameBuilding.length) extras.add('sameBuilding')
    if (r.isElderly) extras.add('isElderly')
    if (r.isYoung) extras.add('isYoung')
    if (r.customQuestions.length) extras.add('custom')
    setVisibleExtras(extras)
    setNewWorkGuests([])
    setShowExtraMenu(false)
  }, [open, guest.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const update = (patch: Partial<GuestRule>) => setLocalRule((r) => ({ ...r, ...patch }))

  const addWorkRelations = () => {
    if (newWorkGuests.length === 0) return
    const existing = new Set(rule.workRelations.map((w) => w.guestId))
    const additions = newWorkGuests
      .filter((id) => !existing.has(id))
      .map((id) => ({ guestId: id, type: newWorkType }))
    update({ workRelations: [...rule.workRelations, ...additions] })
    setNewWorkGuests([])
  }

  const addCustomQuestion = () => {
    const q: CustomQuestion = { id: uuidv4(), question: '', guestIds: [], text: '' }
    update({ customQuestions: [...rule.customQuestions, q] })
  }

  const updateCustomQ = (id: string, patch: Partial<CustomQuestion>) =>
    update({ customQuestions: rule.customQuestions.map((q) => (q.id === id ? { ...q, ...patch } : q)) })

  const enableExtra = (key: string) => {
    setVisibleExtras((s) => new Set([...s, key]))
    if (key === 'custom') addCustomQuestion()
    setShowExtraMenu(false)
  }

  const handleSave = () => {
    setRule(rule)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[88vh]">

        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-foreground">חוקי ישיבה</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{guest.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          <Section title="👨‍👩‍👧 הורים">
            <GuestMultiSelect value={rule.parents} onChange={(ids) => update({ parents: ids })} excludeId={guest.id} placeholder="בחר הורים..." />
          </Section>

          <Section title="👶 ילדים">
            <GuestMultiSelect value={rule.children} onChange={(ids) => update({ children: ids })} excludeId={guest.id} placeholder="בחר ילדים..." />
          </Section>

          <Section title="👫 חברים טובים (עד 3)">
            <GuestMultiSelect
              value={rule.bestFriends}
              onChange={(ids) => update({ bestFriends: ids.slice(0, 3) })}
              excludeId={guest.id}
              placeholder="בחר עד 3 חברים..."
            />
            {rule.bestFriends.length >= 3 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">הגעת למקסימום של 3 חברים</p>
            )}
          </Section>

          <Section title="🚫 ליד מי לא לשבת">
            <GuestMultiSelect value={rule.doNotSeatWith} onChange={(ids) => update({ doNotSeatWith: ids })} excludeId={guest.id} placeholder="בחר אורחים להפרדה..." />
          </Section>

          <Section title="💼 קשר בעבודה" defaultOpen={false}>
            {rule.workRelations.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {rule.workRelations.map((w) => (
                  <WorkRelationRow
                    key={w.guestId}
                    guestId={w.guestId}
                    type={w.type}
                    onRemove={() => update({ workRelations: rule.workRelations.filter((wr) => wr.guestId !== w.guestId) })}
                    onTypeChange={(t) => update({ workRelations: rule.workRelations.map((wr) => wr.guestId === w.guestId ? { ...wr, type: t } : wr) })}
                  />
                ))}
              </div>
            )}
            <div className="flex gap-2 items-start">
              <div className="flex-1 min-w-0">
                <GuestMultiSelect value={newWorkGuests} onChange={setNewWorkGuests} excludeId={guest.id} placeholder="בחר עמיתים..." />
              </div>
              <select
                value={newWorkType}
                onChange={(e) => setNewWorkType(e.target.value as WorkRelationType)}
                className="px-2 py-1.5 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground flex-shrink-0"
              >
                {Object.entries(WORK_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={addWorkRelations}
                disabled={newWorkGuests.length === 0}
                className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-40 flex-shrink-0"
              >
                הוסף
              </button>
            </div>
          </Section>

          {/* Optional sections revealed by "Add question" */}
          {visibleExtras.has('synagogue') && (
            <Section title="🕍 בית כנסת">
              <input
                type="text"
                value={rule.synagogue}
                onChange={(e) => update({ synagogue: e.target.value })}
                placeholder="שם בית הכנסת..."
                className="w-full px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              />
            </Section>
          )}

          {visibleExtras.has('buildingName') && (
            <Section title="🏢 מתחם / בניין">
              <input
                type="text"
                value={rule.buildingName}
                onChange={(e) => update({ buildingName: e.target.value })}
                placeholder="שם הבניין או המתחם..."
                className="w-full px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              />
            </Section>
          )}

          {visibleExtras.has('sameBuilding') && (
            <Section title="🏠 גר בבניין עם">
              <GuestMultiSelect value={rule.sameBuilding} onChange={(ids) => update({ sameBuilding: ids })} excludeId={guest.id} placeholder="בחר שכנים..." />
            </Section>
          )}

          {(visibleExtras.has('isElderly') || visibleExtras.has('isYoung')) && (
            <Section title="👴 מאפיין גיל">
              <div className="flex gap-6">
                {visibleExtras.has('isElderly') && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={rule.isElderly} onChange={(e) => update({ isElderly: e.target.checked })} className="accent-primary w-4 h-4" />
                    <span className="text-sm text-foreground">מבוגר</span>
                  </label>
                )}
                {visibleExtras.has('isYoung') && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={rule.isYoung} onChange={(e) => update({ isYoung: e.target.checked })} className="accent-primary w-4 h-4" />
                    <span className="text-sm text-foreground">צעיר</span>
                  </label>
                )}
              </div>
            </Section>
          )}

          {/* Custom free-text questions */}
          {rule.customQuestions.map((q) => (
            <div key={q.id} className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => updateCustomQ(q.id, { question: e.target.value })}
                  placeholder="כתוב שאלה..."
                  className="flex-1 px-2 py-1 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
                />
                <button type="button" onClick={() => update({ customQuestions: rule.customQuestions.filter((x) => x.id !== q.id) })} className="p-1 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <GuestMultiSelect value={q.guestIds} onChange={(ids) => updateCustomQ(q.id, { guestIds: ids })} excludeId={guest.id} placeholder="אורחים קשורים (אופציונלי)..." />
              <input
                type="text"
                value={q.text}
                onChange={(e) => updateCustomQ(q.id, { text: e.target.value })}
                placeholder="הערה חופשית..."
                className="w-full px-2 py-1 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
              />
            </div>
          ))}

          <Section title="📝 הערות כלליות" defaultOpen={false}>
            <textarea
              value={rule.notes}
              onChange={(e) => update({ notes: e.target.value })}
              placeholder="הערות חופשיות על העדפות הישיבה..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground resize-none"
            />
          </Section>

          {/* Add more questions */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExtraMenu((v) => !v)}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-primary hover:text-primary/80 border border-dashed border-primary/40 hover:border-primary rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              הוסף שאלה
            </button>
            {showExtraMenu && (
              <div className="absolute bottom-full mb-1 left-0 right-0 z-50 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
                {EXTRA_PRESETS.map((p) => {
                  const alreadyVisible = visibleExtras.has(p.key) && p.key !== 'custom'
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => !alreadyVisible && enableExtra(p.key)}
                      className={cn(
                        'w-full text-right px-4 py-2.5 text-sm hover:bg-muted transition-colors text-foreground',
                        alreadyVisible && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-border flex-shrink-0">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors">
            ביטול
          </button>
          <button type="button" onClick={handleSave} className="flex-1 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            שמור חוקים
          </button>
        </div>
      </div>
    </div>
  )
}
