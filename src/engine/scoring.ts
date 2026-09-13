import { POIS } from '../data/pois'
import { startById } from '../data/startLocations'
import { prettyTag } from '../data/tags'
import type { Member, Poi, ScoredPoi, ScoreReason, Trip } from '../types'

export const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * PROTOTYPE: a hash of the POI id standing in for a forecast API. Deterministic
 * so the mock never flickers between renders.
 */
export const weatherOk = (poiId: string) => {
  let h = 0
  for (let i = 0; i < poiId.length; i++) h = (h * 31 + poiId.charCodeAt(i)) % 1000
  return h % 7 !== 0
}

export const tripDays = (trip: Trip) => Math.max(1, trip.maxDurationDays)

/**
 * Hours of sightseeing a day can absorb. Free dates are whole days now, so this
 * is one shared figure rather than a per-person window: rise, travel, see
 * things, eat, sleep. Anything longer than this cannot be a single day's stop.
 */
export const DAY_ACTIVE_HOURS = 10

export interface PartyProfile {
  size: number
  start: { id: string; name: string; lat: number; lng: number }
  maxTravelKm: number
  interestWeight: Record<string, number>
  topInterests: string[]
  hasVegan: boolean
  hasDisability: boolean
  perPersonBudget: number
  sharedDateCount: number
  /** How many people asked for each region, by region id. */
  regionWeight: Record<string, number>
  /** Who asked for each region, for the "Maya and Kai wanted this" line. */
  regionAskers: Record<string, string[]>
}

export const buildProfile = (members: Member[], trip: Trip): PartyProfile => {
  const size = Math.max(1, members.length)
  const interestWeight: Record<string, number> = {}
  members.forEach((m) => m.interests.forEach((t) => { interestWeight[t] = (interestWeight[t] ?? 0) + 1 }))

  const regionWeight: Record<string, number> = {}
  const regionAskers: Record<string, string[]> = {}
  members.forEach((m) => new Set(m.preferredRegions).forEach((r) => {
    regionWeight[r] = (regionWeight[r] ?? 0) + 1
    regionAskers[r] = [...(regionAskers[r] ?? []), m.name]
  }))

  // A day of the trip counts as shared only when the whole party is free for
  // it — the same rule that set the trip's dates in the first place.
  const inTrip = (d: string) => d >= trip.startDate && d <= trip.endDate
  const dateMap: Record<string, number> = {}
  members.forEach((m) =>
    new Set(m.freeDates.filter((f) => inTrip(f.date)).map((f) => f.date)).forEach((date) => {
      dateMap[date] = (dateMap[date] ?? 0) + 1
    }),
  )
  const sharedDateCount = Object.values(dateMap).filter((n) => n === members.length).length

  return {
    size,
    start: startById(trip.startLocationId),
    maxTravelKm: trip.maxTravelKm,
    interestWeight,
    topInterests: Object.entries(interestWeight).sort((a, b) => b[1] - a[1]).map(([t]) => t),
    hasVegan: members.some((m) => m.vegan),
    hasDisability: members.some((m) => m.disability),
    perPersonBudget: Math.min(
      trip.budgetRM / size,
      members.length ? Math.min(...members.map((m) => m.budgetRM)) : trip.budgetRM / size,
    ),
    sharedDateCount,
    regionWeight,
    regionAskers,
  }
}

export const scorePoi = (poi: Poi, p: PartyProfile): ScoredPoi => {
  const reasons: ScoreReason[] = []
  let score = 0
  let blocked = false

  // --- interest overlap -------------------------------------------------
  const matched = poi.tags.filter((t) => p.interestWeight[t])
  const matchWeight = matched.reduce((s, t) => s + (p.interestWeight[t] ?? 0), 0)
  const matchRatio = matchWeight / (p.size * Math.max(1, poi.tags.length))
  score += matchRatio * 100
  if (matched.length) score += 8 * matched.length
  reasons.push({
    ok: matched.length > 0,
    label: matched.length
      ? `Matches ${matched.slice(0, 2).map(prettyTag).join(' & ').toLowerCase()} preferences`
      : 'No interest overlap with the party',
  })

  // --- reach from the start location -------------------------------------
  const distanceKm = Math.round(haversineKm(p.start, poi))
  const reachOk = distanceKm <= p.maxTravelKm
  if (!reachOk) blocked = true
  score += reachOk ? Math.max(0, 18 - (distanceKm / Math.max(1, p.maxTravelKm)) * 18) : -80
  reasons.push({
    ok: reachOk,
    label: reachOk
      ? `${distanceKm} km from ${p.start.name}`
      : `${distanceKm} km away — outside the ${p.maxTravelKm} km range`,
  })

  // --- budget -----------------------------------------------------------
  const budgetOk = poi.costRM <= p.perPersonBudget
  if (!budgetOk) blocked = true
  score += budgetOk ? Math.max(0, 20 - (poi.costRM / Math.max(1, p.perPersonBudget)) * 20) : -60
  reasons.push({ ok: budgetOk, label: budgetOk ? 'Within budget' : `Over the RM ${Math.round(p.perPersonBudget)} per-head budget` })

  // --- duration ---------------------------------------------------------
  const durationOk = poi.durationHours <= DAY_ACTIVE_HOURS
  if (!durationOk) blocked = true
  score += durationOk ? 12 : -40
  reasons.push({
    ok: durationOk,
    label: durationOk
      ? `${poi.durationHours}h — fits inside one day`
      : `${poi.durationHours}h needs more than a single day`,
  })

  // --- free dates -------------------------------------------------------
  const datesOk = p.sharedDateCount > 0
  if (!datesOk) blocked = true
  reasons.push({ ok: datesOk, label: datesOk ? `${p.sharedDateCount} shared free days available` : 'No shared free day in the trip window' })

  // --- somebody asked for this region -----------------------------------
  // Never a blocker: a request lifts a place up the list, it does not rule the
  // rest of the map out.
  const askers = p.regionAskers[poi.region]
  if (askers?.length) {
    score += 14 + 10 * askers.length
    const names = askers.length > 2
      ? `${askers.slice(0, 2).join(', ')} +${askers.length - 2}`
      : askers.join(' & ')
    reasons.push({ ok: true, label: `${names} asked for ${poi.region}` })
  }

  // --- diet -------------------------------------------------------------
  if (poi.category === 'food' && p.hasVegan) {
    const dietOk = poi.veganFriendly
    if (!dietOk) blocked = true
    score += dietOk ? 14 : -50
    reasons.push({ ok: dietOk, label: dietOk ? 'Vegan-friendly options on site' : 'No vegan options for the party' })
  }

  // --- accessibility ----------------------------------------------------
  if (p.hasDisability) {
    const accessOk = poi.accessible
    if (!accessOk) blocked = true
    score += accessOk ? 12 : -50
    reasons.push({ ok: accessOk, label: accessOk ? 'Step-free access available' : 'Not accessible for the whole party' })
  }

  // --- weather (mocked, deterministic) ----------------------------------
  const wx = weatherOk(poi.id)
  score += wx ? 6 : -8
  reasons.push({ ok: wx, label: wx ? 'Good weather forecast' : 'Rain expected on most days' })

  return { poi, score: Math.round(score * 10) / 10, reasons, blocked }
}

export const scoreAll = (members: Member[], trip: Trip): ScoredPoi[] => {
  const profile = buildProfile(members, trip)
  // Places to sleep are not attractions — the planner books them, the party
  // never picks them off the map.
  return POIS.filter((poi) => poi.category !== 'stay')
    .map((poi) => scorePoi(poi, profile))
    .sort((a, b) => b.score - a.score)
}
