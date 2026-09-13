import { HUBS, fareRM, type Hub, type HubKind } from '../data/hubs'
import type { LL } from './directions'
import { haversineKm } from './scoring'
import { CROSSING_MODE, type TravelMode } from './travel'
import { decideLandMode } from './modePlan'

export interface PlanLeg {
  key: string
  /** Reveal gate: the itinerary node this leg is travelling towards. */
  toId: string
  mode: TravelMode
  km: number
  from: LL
  to: LL
  drivable: boolean
  fare?: number
}

export interface HubStop {
  hub: Hub
  fare: number
  mode: TravelMode
}

export interface Waypoint {
  id: string
  ll: LL
  drivable: boolean
}

/**
 * Pick the pair of hubs that makes the *whole* journey shortest.
 *
 * Choosing the nearest hub to each end independently is wrong: the closest
 * jetty to Cherating is Merang, 330 km north of Tioman, which turns a 252 km
 * trip via Mersing into a 498 km one. Scoring the complete
 * drive + crossing + drive keeps the transfer sane.
 */
const bestHubPair = (from: LL, to: LL, kind: HubKind): { from: Hub; to: Hub } | null => {
  const options = HUBS.filter((h) => h.kind === kind)
  let best: { from: Hub; to: Hub } | null = null
  let bestCost = Infinity

  options.forEach((depart) => {
    options.forEach((arrive) => {
      if (depart.id === arrive.id) return
      const cost = haversineKm(from, depart) + haversineKm(depart, arrive) + haversineKm(arrive, to)
      if (cost < bestCost) { bestCost = cost; best = { from: depart, to: arrive } }
    })
  })
  return best
}

/**
 * Turns the ordered stops into drawable legs. A hop with no road between its
 * ends is broken into drive → crossing → drive through the nearest airport or
 * ferry terminal, so the flight or sailing starts where it really would.
 */
export const buildLegs = (
  start: LL,
  stops: Waypoint[],
  closeLoop: boolean,
): { legs: PlanLeg[]; hubs: HubStop[] } => {
  const legs: PlanLeg[] = []
  const hubs: HubStop[] = []
  const seenHubs = new Set<string>()

  const hop = (a: Waypoint, b: Waypoint, gate = b.id) => {
    const straight = haversineKm(a.ll, b.ll)

    if (a.drivable && b.drivable) {
      legs.push({
        key: `${a.id}>${b.id}`, toId: gate,
        mode: decideLandMode({ fromId: a.id, toId: b.id, km: straight, hubTransfer: false }),
        km: straight, from: a.ll, to: b.ll, drivable: true,
      })
      return
    }

    const kind: HubKind = straight > 320 ? 'airport' : 'ferry'
    const pair = bestHubPair(a.ll, b.ll, kind)
    const from = pair?.from ?? null
    const to = pair?.to ?? null
    if (!from || !to) {
      legs.push({
        key: `${a.id}>${b.id}`, toId: gate, mode: CROSSING_MODE[kind],
        km: straight, from: a.ll, to: b.ll, drivable: false,
      })
      return
    }

    const crossingKm = haversineKm(from, to)
    const fare = fareRM(kind, crossingKm)
    const mode: TravelMode = CROSSING_MODE[kind]

    const toHub = haversineKm(a.ll, from)
    if (toHub > 1.5) {
      legs.push({
        key: `${a.id}>${from.id}`, toId: gate,
        mode: decideLandMode({ fromId: a.id, toId: from.id, km: toHub, hubTransfer: true }),
        km: toHub, from: a.ll, to: { lat: from.lat, lng: from.lng }, drivable: true,
      })
    }

    legs.push({
      key: `${from.id}>${to.id}>${b.id}`, toId: gate, mode,
      km: crossingKm, from: { lat: from.lat, lng: from.lng }, to: { lat: to.lat, lng: to.lng },
      drivable: false, fare,
    })

    const fromHub = haversineKm(to, b.ll)
    if (fromHub > 1.5) {
      legs.push({
        key: `${to.id}>${b.id}`, toId: gate,
        mode: decideLandMode({ fromId: to.id, toId: b.id, km: fromHub, hubTransfer: true }),
        km: fromHub, from: { lat: to.lat, lng: to.lng }, to: b.ll, drivable: true,
      })
    }

    ;[from, to].forEach((h) => {
      if (seenHubs.has(h.id)) return
      seenHubs.add(h.id)
      hubs.push({ hub: h, fare, mode })
    })
  }

  const base: Waypoint = { id: 'base', ll: start, drivable: true }
  const chain = [base, ...stops]
  for (let i = 1; i < chain.length; i++) hop(chain[i - 1], chain[i])
  if (closeLoop && stops.length) {
    const last = chain[chain.length - 1]
    hop(last, { ...base, id: 'base-return' }, last.id)
  }

  return { legs, hubs }
}
