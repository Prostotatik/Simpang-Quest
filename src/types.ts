export type Category = 'poi' | 'food' | 'beach' | 'nature' | 'culture' | 'city' | 'stay'

export type MarkerKind = 'scouting' | 'found' | 'confirmed' | 'unsuitable' | 'food' | 'camp'

export interface Poi {
  id: string
  name: string
  lat: number
  lng: number
  category: Category
  tags: string[]
  costRM: number
  durationHours: number
  veganFriendly: boolean
  accessible: boolean
  region: string
  description: string
}

/**
 * A whole day the traveller can give to the trip. There are no part-days: if
 * you are working half of Tuesday, Tuesday is not a free date.
 */
export interface FreeDate {
  id: string
  date: string      // yyyy-mm-dd
}

export interface Member {
  id: string
  name: string
  age: number
  vegan: boolean
  disability: boolean
  interests: string[]
  freeDates: FreeDate[]
  /** Longest trip this person will commit to, in days away from home. */
  maxTripDays: number
  /** Regions this person actually wants to reach (POI `region` values). */
  preferredRegions: string[]
  budgetRM: number
  avatarSeed: number
}

export interface StartLocation {
  id: string
  name: string
  lat: number
  lng: number
}

export interface Trip {
  startDate: string
  endDate: string
  /** Days inclusive of both endDate and startDate — the real trip length. */
  maxDurationDays: number
  budgetRM: number
  startLocationId: string
  maxTravelKm: number
  /** Why the trip came out this length — shown to the party, never edited. */
  limits: TripLimits
}

export interface TripLimits {
  /** Consecutive days the whole party is free, before personal caps apply. */
  windowDays: number
  /** The tightest personal `maxTripDays` in the party. */
  capDays: number
  /** True when `capDays` cut the shared window short rather than the reverse. */
  cappedByMember: boolean
  /** Regions somebody asked for, in the order they were first requested. */
  requestedRegions: string[]
  /** How the travel radius was decided. */
  radiusFrom: 'regions' | 'days'
}

export type JournalStatus = 'Completed' | 'In Progress' | 'Pending' | 'Skipped'

export interface ScoreReason {
  ok: boolean
  label: string
}

export interface ScoredPoi {
  poi: Poi
  score: number
  reasons: ScoreReason[]
  blocked: boolean
}

export interface ScoutLink {
  from: { lat: number; lng: number }
  /** Anchor the probe leaves from: 'base', or the POI id of a confirmed stop. */
  fromId: string
  toPoiId: string
}

export interface ItineraryStop {
  poiId: string
  day: number
  status: JournalStatus
  closed?: boolean
  replacedFrom?: string
}
