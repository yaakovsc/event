import { v4 as uuidv4 } from 'uuid'
import type { Guest, EventTable } from '../types'

const firstNames = [
  'Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace', 'Henry',
  'Iris', 'Jack', 'Karen', 'Liam', 'Mia', 'Noah', 'Olivia', 'Paul',
  'Quinn', 'Rose', 'Sam', 'Tina', 'Uma', 'Victor', 'Wendy', 'Xander',
  'Yara', 'Zoe', 'Aaron', 'Beth', 'Carl', 'Diana', 'Eric', 'Fiona',
  'George', 'Hannah', 'Ivan', 'Julia', 'Kevin', 'Laura', 'Mike', 'Nancy',
  'Oscar', 'Pam', 'Quentin', 'Rachel', 'Steve', 'Tracy', 'Ursula', 'Vince',
  'Willa', 'Xena',
]

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White',
  'Harris', 'Martin', 'Thompson', 'Moore', 'Young', 'Hall',
]

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getLastName(index: number): string {
  return lastNames[index % lastNames.length]
}

export const seedGuests: Guest[] = firstNames.map((firstName, index) => {
  const side = index % 2 === 0 ? 'כלה' : 'חתן'
  const group = side === 'כלה' ? 'צד הכלה' : 'צד החתן'
  return {
    id: uuidv4(),
    name: `${firstName} ${getLastName(index)}`,
    group,
    side,
    noOfGuests: randomInt(1, 4),
    tableNo: null,
  }
})

const shapes: Array<'round' | 'rectangle' | 'square'> = ['round', 'rectangle', 'square']

export const seedTables: EventTable[] = Array.from({ length: 10 }, (_, i) => {
  const col = i % 5
  const row = Math.floor(i / 5)
  return {
    id: uuidv4(),
    tableNo: String(i + 1),
    capacity: randomInt(8, 12),
    shape: shapes[i % 3],
    x: 10 + col * 18,
    y: 15 + row * 45,
  }
})
