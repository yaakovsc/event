export interface Guest {
  id: string
  name: string
  group: string
  side: string
  noOfGuests: number
  tableNo: string | null
}

export interface EventTable {
  id: string
  tableNo: string
  capacity: number
  shape: 'round' | 'rectangle' | 'square'
  x: number
  y: number
}

export interface VenueLayout {
  blueprintImageUrl: string | null
}

export type WorkRelationType = 'manager' | 'subordinate' | 'colleague'

export interface WorkRelation {
  guestId: string
  type: WorkRelationType
}

export interface CustomQuestion {
  id: string
  question: string
  guestIds: string[]
  text: string
}

export interface GuestRule {
  guestId: string
  parents: string[]
  children: string[]
  bestFriends: string[]
  doNotSeatWith: string[]
  workRelations: WorkRelation[]
  synagogue: string
  buildingName: string
  sameBuilding: string[]
  isElderly: boolean
  isYoung: boolean
  notes: string
  customQuestions: CustomQuestion[]
}
