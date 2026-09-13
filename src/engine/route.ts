import { POIS } from '../data/pois'
import { startById } from '../data/startLocations'
import type { ItineraryStop, Member, Poi, ScoredPoi, ScoutLink, Trip } from '../types'
import { DAY_ACTIVE_HOURS, haversineKm, tripDays } from './scoring'

export interface PlanResult {
  itinerary: ItineraryStop[]
  candidates: string[]
  rejected: string[]
  passed: string[]
  scoutLinks: ScoutLink[]
}

type Pt = { lat: number; lng: number }

/**
 * Straight-line km to hours on the road. Malaysian trunk roads average well
 * under the motorway limit once towns and stops are counted, and a straight
 * line always understates the real drive — 55 km/h effective absorbs both.
 */
export const travelHours = (km: number) => km / 55

/** How far from the day's last stop the planner will look for a bed. */
export const BED_SEARCH_KM = 90

/** A day ending further than this from base is a night away, not a commute. */
export const NIGHT_AWAY_KM = 70

/**
 * Hours a stop costs the day it falls on. A bed is not an activity: its ten
 * hours are the night, which happens after the day is over, so it costs the
 * schedule nothing.
 */
export const stopHours = (poi: Poi) => (poi.category === 'stay' ? 0 : poi.durationHours)

/**
 * Hours from a stop out to the closest bed on the map. Used to reserve the end
 * of a day that will not finish at home, so the run to the hotel is paid for
 * before the day is declared full rather than added on afterwards.
 */
const nearestBedHours = (from: Pt) => {
  let best = Infinity
  POIS.forEach((p) => {
    if (p.category !== 'stay') return
    const d = haversineKm(from, p)
    if (d < best) best = d
  })
  return Number.isFinite(best) ? travelHours(best) : 0
}

/**
 * Walk an ordered route day by day, opening a new day whenever the next stop
 * will not fit in the hours this one has left. Returns the day each stop falls
 * on and how many days the route needs in total.
 *
 * This is the single source of truth for "does this fit": the greedy picker
 * asks it before accepting a stop, and the itinerary is built from it after.
 * The last day also has to pay for the drive home, or a plan can end the
 * fortnight four hours from base with no time to get back.
 */
export const scheduleDays = (seq: { poi: Poi }[], start: Pt) => {
  const dayOf: number[] = []
  let day = 1
  let hours = 0
  let cursor: Pt = start

  seq.forEach((s, i) => {
    const drive = travelHours(haversineKm(cursor, s.poi))
    const needed = drive + stopHours(s.poi)
    // Whatever happens after the last stop of a day still has to fit in it:
    // either the drive home, or — on a night away — the run out to a bed. Beds
    // are booked within BED_SEARCH_KM of the day's last stop, so that is the
    // worst case to hold back.
    const last = i === seq.length - 1
    const homeward = travelHours(haversineKm(s.poi, start))
    // Half an hour of slack on a night away: the bed the planner eventually
    // books is chosen from the whole map, which can be slightly further out
    // than the closest one this reservation is measured against.
    const tail = last ? homeward : Math.min(homeward, nearestBedHours(s.poi) + 0.5)

    // A haul across half the peninsula is its own day: starting one on the back
    // of a day already spent sightseeing is how a 10-hour day becomes a 17-hour
    // one. Crossing more than half a day's driving forces a fresh start.
    const isTransfer = drive > DAY_ACTIVE_HOURS / 2
    if (hours > 0 && (isTransfer || hours + needed + tail > DAY_ACTIVE_HOURS)) {
      day += 1
      hours = 0
    }
    hours += needed
    cursor = s.poi
    dayOf.push(day)
  })

  return { dayOf, days: day }
}

/**
 * Greedy nearest-neighbour walk out from the base, then 2-opt over the closed
 * loop so the trip comes home without a long backtrack.
 */
export const orderLoop = <T,>(items: T[], start: Pt, at: (item: T) => Pt): T[] => {
  const ordered: T[] = []
  const pool = [...items]
  let cursor: Pt = start
  while (pool.length) {
    let bestIdx = 0
    let bestD = Infinity
    pool.forEach((c, i) => {
      const d = haversineKm(cursor, at(c))
      if (d < bestD) { bestD = d; bestIdx = i }
    })
    const next = pool.splice(bestIdx, 1)[0]
    ordered.push(next)
    cursor = at(next)
  }

  const loopCost = (seq: T[]) => {
    let total = 0
    let prev: Pt = start
    seq.forEach((item) => { total += haversineKm(prev, at(item)); prev = at(item) })
    return total + haversineKm(prev, start)
  }

  for (let pass = 0; pass < 4; pass++) {
    let improved = false
    for (let i = 0; i < ordered.length - 1; i++) {
      for (let j = i + 1; j < ordered.length; j++) {
        const candidate = [
          ...ordered.slice(0, i),
          ...ordered.slice(i, j + 1).reverse(),
          ...ordered.slice(j + 1),
        ]
        if (loopCost(candidate) < loopCost(ordered) - 0.5) {
          ordered.splice(0, ordered.length, ...candidate)
          improved = true
        }
      }
    }
    if (!improved) break
  }
  return ordered
}

/**
 * PROTOTYPE: a rule-based planner standing in for the agent that will choose
 * the itinerary. Pure arithmetic over the mock dataset — no model call anywhere.
 *
 * Rule-based planner. Picks the best-scoring POIs that still fit the shared
 * budget, orders them with a greedy nearest-neighbour walk over the real
 * coordinates, then slices the walk into days.
 */
export const planTrip = (scored: ScoredPoi[], members: Member[], trip: Trip): PlanResult => {
  const size = Math.max(1, members.length)
  const days = tripDays(trip)

  // The real constraint is the calendar, not a stop count: a stop is affordable
  // only if the whole route still schedules inside the days the party has. A
  // two-day trip near home therefore fits far more than a two-day trip that
  // spends most of its hours reaching the coast.
  //
  // Hard ceiling on top, so a long trip stays legible on the map and in the
  // journal rather than becoming a wall of pins. Beds are added afterwards and
  // do not count against it.
  const maxStops = Math.min(22, Math.max(2, days * 3))

  const start = startById(trip.startLocationId)
  const viable = scored.filter((s) => !s.blocked && s.score > 0)

  // Discarded places are part of the story: keep the ones the party could
  // plausibly have reached so the map shows what was scouted and dropped.
  const rejected = scored
    .filter((s) => s.blocked)
    .sort((a, b) => haversineKm(start, a.poi) - haversineKm(start, b.poi))
    .slice(0, 10)
    .map((s) => s.poi.id)

  // Greedily accept the strongest POIs while both the money and the clock hold.
  // Re-ordering after every accept keeps the travel estimate honest: a stop is
  // only affordable in hours once we know where it actually sits in the loop.
  const picked: ScoredPoi[] = []
  let spend = 0
  const regionCount: Record<string, number> = {}
  // A short trip should not scatter across the country, so cap how many stops
  // any one region may contribute — generously on long trips, tightly on short.
  const perRegionCap = Math.max(2, Math.ceil(maxStops / 2))

  for (const s of viable) {
    if (picked.length >= maxStops) break
    const cost = s.poi.costRM * size
    if (spend + cost > trip.budgetRM) continue
    if ((regionCount[s.poi.region] ?? 0) >= perRegionCap) continue

    const trial = orderLoop([...picked, s], start, (x) => x.poi)
    if (scheduleDays(trial, start).days > days) continue

    picked.push(s)
    regionCount[s.poi.region] = (regionCount[s.poi.region] ?? 0) + 1
    spend += cost
  }

  const ordered = orderLoop(picked, start, (s) => s.poi)

  // Same clock the picker used, so what was accepted is exactly what is shown.
  const { dayOf } = scheduleDays(ordered, start)
  const itinerary: ItineraryStop[] = ordered.map((s, i) => ({
    poiId: s.poi.id,
    day: dayOf[i],
    status: 'Pending' as const,
  }))

  // A night away needs a bed: whenever a day ends far from base and another day
  // follows, book the nearest affordable place to sleep. Staying two nights in
  // the same hotel is normal, so a bed is only skipped when it is already the
  // night before — the party does not check out and back into the same room.
  const stays = POIS.filter((p) => p.category === 'stay')
  const lastDay = itinerary.length ? itinerary[itinerary.length - 1].day : 1
  let previousBedId: string | null = null
  for (let d = 1; d < lastDay; d++) {
    const dayStopsList = itinerary.filter((i) => i.day === d)
    const last = dayStopsList[dayStopsList.length - 1]
    const lastPoi = last && scored.find((s) => s.poi.id === last.poiId)?.poi
    if (!lastPoi || haversineKm(start, lastPoi) < NIGHT_AWAY_KM) { previousBedId = null; continue }

    const bed = stays
      .filter((p) => spend + p.costRM * size <= trip.budgetRM)
      .map((p) => ({ p, d: haversineKm(lastPoi, p) }))
      .sort((a, b) => a.d - b.d)[0]
    if (!bed || bed.d > BED_SEARCH_KM) { previousBedId = null; continue }

    // Same hotel as last night: the party never left it, so there is nothing
    // new to add to the route — the night simply continues.
    if (bed.p.id === previousBedId) {
      spend += bed.p.costRM * size
      continue
    }

    previousBedId = bed.p.id
    spend += bed.p.costRM * size
    const at = itinerary.indexOf(last) + 1
    itinerary.splice(at, 0, { poiId: bed.p.id, day: d, status: 'Pending' })
  }

  // Every stop starts Pending: the plan has just been drawn, so nothing has
  // happened yet. The party marks progress itself from the journal.

  const pickedIds = new Set(picked.map((s) => s.poi.id))
  const leftover = viable.filter((s) => !pickedIds.has(s.poi.id))
  const candidates = leftover.slice(0, 6).map((s) => s.poi.id)
  // Everything else the scouts walked to and decided against.
  const passed = leftover.slice(6)
    .sort((a, b) => haversineKm(start, a.poi) - haversineKm(start, b.poi))
    .slice(0, 12)
    .map((s) => s.poi.id)

  // Scouting trails: each stop (and the base) sends two or three short dashed
  // probes to the nearest places that were walked to and set aside.
  const byId = new Map(scored.map((s) => [s.poi.id, s.poi]))
  const anchors: { lat: number; lng: number; id: string }[] = [
    { lat: start.lat, lng: start.lng, id: 'base' },
    ...ordered.map((s) => ({ lat: s.poi.lat, lng: s.poi.lng, id: s.poi.id })),
  ]
  const used = anchors.map(() => 0)
  const scoutLinks: ScoutLink[] = []

  const greys = [...rejected, ...passed, ...candidates]
  const ranked = greys
    .map((id) => {
      const poi = byId.get(id)!
      const order = anchors
        .map((a, i) => ({ i, d: haversineKm(a, poi) }))
        .sort((x, y) => x.d - y.d)
      return { id, order }
    })
    .sort((x, y) => x.order[0].d - y.order[0].d)

  // Give every anchor two or three probes: walk the closest pairings first and
  // spill over to the next nearest stop once one is full.
  ranked.forEach(({ id, order }) => {
    const slot = order.find((o) => used[o.i] < 3 && o.d < 300)
    if (!slot) return
    used[slot.i] += 1
    scoutLinks.push({
      from: { lat: anchors[slot.i].lat, lng: anchors[slot.i].lng },
      fromId: anchors[slot.i].id,
      toPoiId: id,
    })
  })

  return { itinerary, candidates, rejected, passed, scoutLinks }
}

/** Nearest POI with overlapping tags, inside budget, used by Forces Majeure. */
export const findAlternative = (
  closedId: string,
  scored: ScoredPoi[],
  taken: Set<string>,
  perHeadBudget: number,
) => {
  const closed = scored.find((s) => s.poi.id === closedId)
  if (!closed) return null
  const candidates = scored
    .filter((s) => !s.blocked && s.poi.id !== closedId && !taken.has(s.poi.id))
    .filter((s) => s.poi.costRM <= Math.max(perHeadBudget, closed.poi.costRM * 1.3))
    .map((s) => ({
      scored: s,
      distanceKm: haversineKm(closed.poi, s.poi),
      shared: s.poi.tags.filter((t) => closed.poi.tags.includes(t)).length,
    }))
    .filter((c) => c.shared > 0)
    .sort((a, b) => (b.shared - a.shared) || (a.distanceKm - b.distanceKm))

  const near = candidates.filter((c) => c.distanceKm < 220)
  const best = (near.length ? near : candidates)[0]
  return best ? { poiId: best.scored.poi.id, distanceKm: best.distanceKm } : null
}
