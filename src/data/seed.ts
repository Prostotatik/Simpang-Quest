import type { FreeDate, Member, Trip } from '../types'

/** Local-time ISO date (never UTC — that shifts the day in positive offsets). */
export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** `count` consecutive whole days from `start`. Free dates have no clock. */
const days = (start: string, count: number): FreeDate[] =>
  Array.from({ length: count }, (_, i) => {
    const d = new Date(start + 'T00:00:00')
    d.setDate(d.getDate() + i)
    return { id: `${toISODate(d)}-${i}`, date: toISODate(d) }
  })

/**
 * Seed trip values are placeholders only: `deriveTrip` overwrites every field
 * from the party before anything is rendered. Nothing here is presented to the
 * user as-is.
 */
export const SEED_TRIP: Trip = {
  startDate: '2025-08-12',
  endDate: '2025-08-12',
  maxDurationDays: 1,
  budgetRM: 0,
  startLocationId: 'kl',
  maxTravelKm: 120,
  limits: {
    windowDays: 1,
    capDays: 1,
    capNames: [],
    requestedRegions: [],
    radiusFrom: 'days',
  },
}

export interface PartyPreset {
  id: string
  label: string
  /** One line the presenter can read out loud: what this party is for. */
  blurb: string
  members: Member[]
}

/**
 * Three parties that exercise the planner at genuinely different scales. The
 * arithmetic is what makes them differ — short window, tight personal cap and
 * no region requests keep a trip local; a long window with Langkawi on the
 * wishlist forces a flight and a chain of beds.
 */
export const PARTY_PRESETS: PartyPreset[] = [
  {
    id: 'weekend',
    label: 'Weekend pair',
    blurb: 'Two people, one free weekend, neither wants more than two days out.',
    members: [
      {
        id: 'm-nadia', name: 'Nadia', age: 26, vegan: true, disability: false,
        interests: ['food', 'art', 'chill'],
        freeDates: days('2025-08-16', 2),
        maxTripDays: 2, preferredRegions: [],
        budgetRM: 700, avatarSeed: 1,
      },
      {
        id: 'm-arif', name: 'Arif', age: 28, vegan: false, disability: false,
        interests: ['food', 'photography', 'cities'],
        freeDates: days('2025-08-16', 2),
        maxTripDays: 2, preferredRegions: [],
        budgetRM: 800, avatarSeed: 3,
      },
    ],
  },
  {
    id: 'friends',
    label: 'Friends, one week',
    blurb: 'Four friends with a full week free — but Kai can only give seven days.',
    members: [
      {
        id: 'm-alex', name: 'Alex', age: 24, vegan: true, disability: false,
        interests: ['nature', 'active', 'museums'],
        freeDates: days('2025-08-12', 12),
        maxTripDays: 9, preferredRegions: ['Pahang'],
        budgetRM: 1600, avatarSeed: 0,
      },
      {
        id: 'm-maya', name: 'Maya', age: 27, vegan: false, disability: false,
        interests: ['food', 'culture', 'nightlife'],
        freeDates: days('2025-08-12', 12),
        maxTripDays: 8, preferredRegions: ['Penang'],
        budgetRM: 1800, avatarSeed: 2,
      },
      {
        id: 'm-lina', name: 'Lina', age: 22, vegan: true, disability: false,
        interests: ['art', 'nature', 'chill'],
        freeDates: days('2025-08-12', 12),
        maxTripDays: 10, preferredRegions: [],
        budgetRM: 1300, avatarSeed: 1,
      },
      {
        id: 'm-kai', name: 'Kai', age: 31, vegan: false, disability: false,
        interests: ['food', 'photography', 'cities'],
        freeDates: days('2025-08-12', 12),
        maxTripDays: 7, preferredRegions: ['Penang'],
        budgetRM: 1800, avatarSeed: 5,
      },
    ],
  },
  {
    id: 'expedition',
    label: 'Big group, full expedition',
    blurb: 'Six travellers, a fortnight free, and Langkawi on somebody’s wishlist.',
    members: [
      {
        id: 'm-sam', name: 'Sam', age: 29, vegan: false, disability: false,
        interests: ['adventure', 'hiking', 'beaches'],
        freeDates: days('2025-08-10', 20),
        maxTripDays: 14, preferredRegions: ['Langkawi', 'Pahang'],
        budgetRM: 2600, avatarSeed: 4,
      },
      {
        id: 'm-priya', name: 'Priya', age: 33, vegan: true, disability: false,
        interests: ['nature', 'wildlife', 'photography'],
        freeDates: days('2025-08-10', 20),
        maxTripDays: 14, preferredRegions: ['Langkawi'],
        budgetRM: 2400, avatarSeed: 2,
      },
      {
        id: 'm-hafiz', name: 'Hafiz', age: 35, vegan: false, disability: false,
        interests: ['history', 'culture', 'food'],
        freeDates: days('2025-08-10', 20),
        maxTripDays: 16, preferredRegions: ['Melaka'],
        budgetRM: 2200, avatarSeed: 5,
      },
      {
        id: 'm-elena', name: 'Elena', age: 30, vegan: false, disability: true,
        interests: ['museums', 'cities', 'shopping'],
        freeDates: days('2025-08-10', 20),
        maxTripDays: 14, preferredRegions: [],
        budgetRM: 2500, avatarSeed: 0,
      },
      {
        id: 'm-daniel', name: 'Daniel', age: 27, vegan: false, disability: false,
        interests: ['beaches', 'chill', 'view'],
        freeDates: days('2025-08-10', 20),
        maxTripDays: 15, preferredRegions: ['Penang'],
        budgetRM: 2100, avatarSeed: 3,
      },
      {
        id: 'm-yuki', name: 'Yuki', age: 25, vegan: true, disability: false,
        interests: ['art', 'photography', 'nature'],
        freeDates: days('2025-08-10', 20),
        maxTripDays: 14, preferredRegions: [],
        budgetRM: 2000, avatarSeed: 1,
      },
    ],
  },
]

export const DEFAULT_PRESET_ID = 'friends'

export const presetById = (id: string) =>
  PARTY_PRESETS.find((p) => p.id === id) ?? PARTY_PRESETS[1]

export const SEED_MEMBERS: Member[] = presetById(DEFAULT_PRESET_ID).members
