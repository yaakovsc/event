import type { Guest, EventTable, GuestRule } from '../types'

const PROXIMITY_THRESHOLD = 25 // canvas units (0-100 scale)

// ── Neighbor map ─────────────────────────────────────────────────────────────

function buildNeighborMap(tables: EventTable[]): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  for (const t of tables) {
    map[t.id] = tables
      .filter((o) => o.id !== t.id)
      .filter((o) => {
        const dx = t.x - o.x
        const dy = t.y - o.y
        return Math.sqrt(dx * dx + dy * dy) < PROXIMITY_THRESHOLD
      })
      .map((o) => o.id)
  }
  return map
}

// ── Hard conflict check ───────────────────────────────────────────────────────

function hasHardConflict(
  guest: Guest,
  tableNo: string,
  guestsByTable: Record<string, Guest[]>,
  rules: Record<string, GuestRule>
): boolean {
  const tableGuests = guestsByTable[tableNo] ?? []
  const gRule = rules[guest.id]
  for (const other of tableGuests) {
    if (gRule?.doNotSeatWith.includes(other.id)) return true
    if (rules[other.id]?.doNotSeatWith.includes(guest.id)) return true
  }
  return false
}

// ── Pair affinity score ───────────────────────────────────────────────────────

function pairScore(
  guest: Guest,
  other: Guest,
  rules: Record<string, GuestRule>,
  weight: number
): number {
  let s = 0
  const gr = rules[guest.id]
  const or = rules[other.id]

  if (gr) {
    if (gr.parents.includes(other.id) || gr.children.includes(other.id)) s += 8
    if (gr.sameBuilding.includes(other.id)) s += 5
    if (gr.bestFriends.includes(other.id)) s += 4
    if (gr.workRelations.some((w) => w.guestId === other.id)) s += 2
    if (gr.isElderly && or?.isElderly) s += 3
    if (gr.isYoung && or?.isYoung) s += 3
  }

  if (or) {
    if (or.parents.includes(guest.id) || or.children.includes(guest.id)) s += 8
    if (or.sameBuilding.includes(guest.id)) s += 5
    if (or.bestFriends.includes(guest.id)) s += 4
  }

  if (guest.group && other.group && guest.group === other.group) s += 3
  if (guest.side && other.side && guest.side === other.side) s += 1

  return s * weight
}

// ── Table score for a guest ───────────────────────────────────────────────────

function scoreTable(
  guest: Guest,
  tableId: string,
  neighborIds: string[],
  guestsByTable: Record<string, Guest[]>,
  tableById: Record<string, EventTable>,
  rules: Record<string, GuestRule>
): number {
  const table = tableById[tableId]
  if (!table) return 0
  let total = 0

  // Level 0 — same table (full weight)
  for (const other of guestsByTable[table.tableNo] ?? []) {
    total += pairScore(guest, other, rules, 1.0)
  }

  // Level 1 — neighboring tables (50% weight)
  for (const nid of neighborIds) {
    const neighbor = tableById[nid]
    if (!neighbor) continue
    for (const other of guestsByTable[neighbor.tableNo] ?? []) {
      total += pairScore(guest, other, rules, 0.5)
    }
  }

  return total
}

// ── Constraint count (for sort order) ────────────────────────────────────────

function constraintCount(guest: Guest, rules: Record<string, GuestRule>): number {
  const r = rules[guest.id]
  if (!r) return 0
  return (
    r.parents.length +
    r.children.length +
    r.bestFriends.length +
    r.doNotSeatWith.length +
    r.sameBuilding.length +
    r.workRelations.length
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function autoSeat(
  guests: Guest[],
  tables: EventTable[],
  rules: Record<string, GuestRule>,
  fillTables: boolean
): Record<string, string> {
  if (tables.length === 0) return {}

  const neighborMap = buildNeighborMap(tables)
  const tableById: Record<string, EventTable> = {}
  for (const t of tables) tableById[t.id] = t

  // Running assignments: guestId → tableNo (seeded with pre-assigned)
  const assignments: Record<string, string> = {}
  for (const g of guests) {
    if (g.tableNo !== null) assignments[g.id] = g.tableNo
  }

  // Compute current occupancy and guests-by-tableNo (live, updated as we assign)
  const occupancy = (tableNo: string): number =>
    guests
      .filter((g) => (assignments[g.id] ?? null) === tableNo)
      .reduce((s, g) => s + g.noOfGuests, 0)

  const guestsByTable = (): Record<string, Guest[]> => {
    const map: Record<string, Guest[]> = {}
    for (const g of guests) {
      const t = assignments[g.id]
      if (t) {
        if (!map[t]) map[t] = []
        map[t].push(g)
      }
    }
    return map
  }

  const unassigned = guests.filter((g) => g.tableNo === null)
  const sorted = [...unassigned].sort(
    (a, b) => constraintCount(b, rules) - constraintCount(a, rules)
  )

  for (const guest of sorted) {
    const snapshot = guestsByTable()

    // Filter to tables with enough capacity
    const withCapacity = tables.filter(
      (t) => occupancy(t.tableNo) + guest.noOfGuests <= t.capacity
    )

    // Filter out hard doNotSeatWith conflicts
    const valid = withCapacity.filter(
      (t) => !hasHardConflict(guest, t.tableNo, snapshot, rules)
    )

    if (valid.length === 0) continue // leave unassigned

    // Apply fill-tables rule: prefer non-empty tables
    let candidates = valid
    if (fillTables) {
      const nonEmpty = valid.filter((t) => occupancy(t.tableNo) > 0)
      if (nonEmpty.length > 0) candidates = nonEmpty
      // else fall through to all valid (including empty)
    }

    // Score and pick best
    let bestTable: EventTable | null = null
    let bestScore = -Infinity

    for (const t of candidates) {
      const s = scoreTable(
        guest,
        t.id,
        neighborMap[t.id] ?? [],
        snapshot,
        tableById,
        rules
      )
      if (s > bestScore) {
        bestScore = s
        bestTable = t
      }
    }

    if (bestTable) assignments[guest.id] = bestTable.tableNo
  }

  // Return only the newly made assignments
  const result: Record<string, string> = {}
  for (const g of unassigned) {
    if (assignments[g.id]) result[g.id] = assignments[g.id]
  }
  return result
}
