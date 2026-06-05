import { useEffect } from 'react'
import { useAuthStore, ADMIN_ID } from '../store/authStore'
import { useGuestStore } from '../store/guestStore'
import { useTableStore } from '../store/tableStore'
import { useLayoutStore } from '../store/layoutStore'
import { useRulesStore } from '../store/rulesStore'
import { seedGuests, seedTables } from '../utils/seedData'

export function TenantSync() {
  const currentUserId = useAuthStore((s) => s.currentUserId)
  const setGuests = useGuestStore((s) => s.setGuests)
  const setTables = useTableStore((s) => s.setTables)
  const setBlueprintImage = useLayoutStore((s) => s.setBlueprintImage)
  const setRules = useRulesStore((s) => s.setRules)

  // Load / clear data when the logged-in user changes
  useEffect(() => {
    if (!currentUserId) {
      setGuests([])
      setTables([])
      setBlueprintImage(null)
      return
    }

    const rawGuests = localStorage.getItem(`seating-guests-${currentUserId}`)
    const rawTables = localStorage.getItem(`seating-tables-${currentUserId}`)
    const rawLayout = localStorage.getItem(`seating-layout-${currentUserId}`)

    const rawRules = localStorage.getItem(`seating-rules-${currentUserId}`)

    if (currentUserId === ADMIN_ID && rawGuests === null) {
      setGuests(seedGuests)
      setTables(seedTables)
      setBlueprintImage(null)
      setRules({})
    } else {
      setGuests(rawGuests ? JSON.parse(rawGuests) : [])
      setTables(rawTables ? JSON.parse(rawTables) : [])
      setBlueprintImage(rawLayout ? JSON.parse(rawLayout) : null)
      setRules(rawRules ? JSON.parse(rawRules) : {})
    }
  }, [currentUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-persist subscriptions — set up once, read currentUserId dynamically at save time
  useEffect(() => {
    const unsubGuests = useGuestStore.subscribe((state) => {
      const uid = useAuthStore.getState().currentUserId
      if (uid) localStorage.setItem(`seating-guests-${uid}`, JSON.stringify(state.guests))
    })
    const unsubTables = useTableStore.subscribe((state) => {
      const uid = useAuthStore.getState().currentUserId
      if (uid) localStorage.setItem(`seating-tables-${uid}`, JSON.stringify(state.tables))
    })
    const unsubLayout = useLayoutStore.subscribe((state) => {
      const uid = useAuthStore.getState().currentUserId
      if (uid) localStorage.setItem(`seating-layout-${uid}`, JSON.stringify(state.blueprintImageUrl))
    })
    const unsubRules = useRulesStore.subscribe((state) => {
      const uid = useAuthStore.getState().currentUserId
      if (uid) localStorage.setItem(`seating-rules-${uid}`, JSON.stringify(state.rules))
    })
    return () => {
      unsubGuests()
      unsubTables()
      unsubLayout()
      unsubRules()
    }
  }, [])

  return null
}
