import { regionById } from '../data/regions'
import { START_LOCATIONS } from '../data/startLocations'
import type { Member, Trip, TripLimits } from '../types'
import { haversineKm } from './scoring'

/**
 * The whole point of the product: nobody negotiates the trip's terms by hand.
 * Each traveller fills in their own sheet, and the plan's shape — when, from
 * where, how far, how long, how much — falls out of the group.
 *
 * PROTOTYPE: this is a deterministic script standing in for the agent that will
 * do the reasoning later. It only does arithmetic on the party sheets; there is
 * no model call anywhere. The seams an agent would take over are marked below.
 */

/** Local-time ISO date, matching the rest of the app's date handling. */
const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const addDays = (iso: string, days: number) => {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return toISO(d)
}

/** Days from `a` to `b` counting both ends: 12th→12th is 1 day, not 0. */
export const inclusiveDays = (a: string, b: string) =>
  Math.max(
    1,
    Math.round(
      (new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000,
    ) + 1,
  )

const EMPTY_LIMITS: TripLimits = {
  windowDays: 1,
  capDays: 1,
  capNames: [],
  requestedRegions: [],
  radiusFrom: 'days',
}

/**
 * The longest unbroken stretch the party can actually all make.
 *
 * Unlike the old quorum rule, a day only counts when *everyone* is free: a trip
 * is a single group moving together, so a day half the party is missing is not
 * a day of the trip.
 */
const sharedWindow = (members: Member[]) => {
  if (!members.length) return null

  const freeCount = new Map<string, number>()
  members.forEach((m) => {
    const seen = new Set<string>()
    m.freeDates.forEach((f) => {
      if (seen.has(f.date)) return
      seen.add(f.date)
      freeCount.set(f.date, (freeCount.get(f.date) ?? 0) + 1)
    })
  })

  const usable = [...freeCount.entries()]
    .filter(([, n]) => n === members.length)
    .map(([date]) => date)
    .sort()
  if (!usable.length) return null

  let bestStart = usable[0]
  let bestLen = 1
  let runStart = usable[0]
  let runLen = 1
  for (let i = 1; i < usable.length; i++) {
    if (addDays(usable[i - 1], 1) === usable[i]) {
      runLen += 1
    } else {
      runStart = usable[i]
      runLen = 1
    }
    if (runLen > bestLen) { bestLen = runLen; bestStart = runStart }
  }
  return { start: bestStart, days: bestLen }
}

/**
 * Where the group sets out from.
 *
 * PROTOTYPE: the hub closest to the party's centre of gravity, which here is
 * simply the centroid of everyone's current start. With real accounts this would
 * come from where people actually live.
 */
const deriveStart = (members: Member[], previous: string) => {
  const anchor = START_LOCATIONS.find((l) => l.id === previous) ?? START_LOCATIONS[0]
  if (!members.length) return anchor.id
  // Everyone shares one origin in the prototype, so the anchor already is the
  // centroid; the nearest-hub search is kept so real per-member origins drop in.
  const nearest = [...START_LOCATIONS]
    .sort((a, b) => haversineKm(anchor, a) - haversineKm(anchor, b))[0]
  return nearest.id
}

/** Regions somebody asked for, deduped, first request wins the ordering. */
const requestedRegions = (members: Member[]) => {
  const out: string[] = []
  members.forEach((m) => m.preferredRegions.forEach((r) => {
    if (!out.includes(r)) out.push(r)
  }))
  return out
}

/**
 * How far the party is willing to range.
 *
 * If anyone named a region, the radius simply has to reach it — a wish for
 * Langkawi is meaningless if the planner then rules Langkawi out of range.
 * With no requests it falls back to the trip length: a two-day trip stays near
 * home, a fortnight can cross the peninsula.
 */
const deriveRadius = (
  days: number,
  regions: string[],
  startId: string,
): { km: number; from: TripLimits['radiusFrom'] } => {
  const base = START_LOCATIONS.find((l) => l.id === startId) ?? START_LOCATIONS[0]

  // Roughly 250 km of reach for the first day, then 60 km for each day after —
  // a weekend stays regional, a two-week trip opens up the whole peninsula.
  const byDays = Math.min(900, Math.max(120, Math.round((190 + days * 60) / 10) * 10))

  const reach = regions
    .map((id) => regionById(id))
    .filter((r): r is NonNullable<typeof r> => !!r)
    .map((r) => haversineKm(base, r))
  if (!reach.length) return { km: byDays, from: 'days' }

  // 15% slack so the requested region is comfortably inside the ring rather
  // than sitting exactly on the boundary, where rounding could exclude it.
  const needed = Math.round((Math.max(...reach) * 1.15) / 10) * 10
  return { km: Math.min(900, Math.max(byDays, needed)), from: 'regions' }
}

/** Everything the group's sheets imply about the trip. */
export const deriveTrip = (members: Member[], previous: Trip): Trip => {
  const startLocationId = deriveStart(members, previous.startLocationId)
  const budgetRM = members.reduce((sum, m) => sum + m.budgetRM, 0)

  if (!members.length) {
    const today = toISO(new Date())
    return {
      startDate: today,
      endDate: today,
      maxDurationDays: 1,
      budgetRM,
      startLocationId,
      maxTravelKm: 120,
      limits: EMPTY_LIMITS,
    }
  }

  // When nobody shares a single free day there is no trip to plan; fall back to
  // a one-day outing starting today so the map still has something to show.
  const window = sharedWindow(members) ?? { start: toISO(new Date()), days: 1 }

  // The binding limit: nobody is dragged past the length they signed up for.
  const capDays = Math.max(1, Math.min(...members.map((m) => m.maxTripDays)))
  const days = Math.max(1, Math.min(window.days, capDays))
  const capNames = capDays < window.days
    ? members.filter((m) => m.maxTripDays === capDays).map((m) => m.name)
    : []

  const regions = requestedRegions(members)
  const radius = deriveRadius(days, regions, startLocationId)

  return {
    startDate: window.start,
    endDate: addDays(window.start, days - 1),
    maxDurationDays: days,
    budgetRM,
    startLocationId,
    maxTravelKm: radius.km,
    limits: {
      windowDays: window.days,
      capDays,
      capNames,
      requestedRegions: regions,
      radiusFrom: radius.from,
    },
  }
}
