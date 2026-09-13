export type LL = google.maps.LatLngLiteral

/**
 * Road geometry for the drawn trails.
 *
 * Real driving routes come from the Directions service and are cached for the
 * session. Anything the service cannot answer — islands, a disabled API key —
 * falls back to a deterministic curved trail so the dashes still read as a
 * path rather than a ruler line.
 */

const cache = new Map<string, LL[]>()
let serviceDisabled = false
let chain: Promise<unknown> = Promise.resolve()
let service: google.maps.DirectionsService | null = null

/**
 * Places that cannot be reached by road, grouped by the landmass they sit on.
 *
 * The grouping matters as much as the flag: everything on one island has to be
 * visited in a single run, or the route pays for a crossing each time it hops
 * back and forth — which is how a ferry ends up drawn straight over dry land.
 */
export const ISLAND_GROUPS: Record<string, string[]> = {
  tioman: ['tioman-island', 'juara-beach', 'stay-tioman'],
  redang: ['redang-island'],
  langkawi: ['langkawi-skybridge', 'langkawi-cenang', 'langkawi-kilim', 'stay-langkawi'],
}

/** Islands and ferry hops — the driving service has nothing to say about them. */
export const NON_DRIVABLE = new Set(Object.values(ISLAND_GROUPS).flat())

/** Which island a place belongs to, or null when it is on the mainland. */
export const islandOf = (poiId: string): string | null => {
  for (const [island, ids] of Object.entries(ISLAND_GROUPS)) {
    if (ids.includes(poiId)) return island
  }
  return null
}

/** One service instance for the session: constructing it logs a deprecation notice. */
const getService = () => {
  if (!service) service = new google.maps.DirectionsService()
  return service
}

const keyOf = (pts: LL[]) =>
  pts.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join('|')

/** Deterministic pseudo-random in [-1, 1] from a pair of coordinates. */
const wobble = (a: LL, b: LL) => {
  const n = Math.sin((a.lat * 12.9898 + a.lng * 78.233 + b.lat * 37.719 + b.lng * 4.581) * 43758.5453)
  return n - Math.floor(n) - 0.5
}

/**
 * A bowed trail between two points, sampled for polyline drawing. Used for the
 * legs no road can answer — a sea crossing to Tioman, Redang or Langkawi. The
 * bow always has a minimum depth so such a leg never draws as a ruler line.
 */
export const curveBetween = (a: LL, b: LL, steps = 22): LL[] => {
  const w = wobble(a, b)
  const bend = Math.sign(w || 1) * (0.11 + Math.abs(w) * 0.16)
  const mx = (a.lat + b.lat) / 2 + (b.lng - a.lng) * bend
  const my = (a.lng + b.lng) / 2 - (b.lat - a.lat) * bend
  const out: LL[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const u = 1 - t
    out.push({
      lat: u * u * a.lat + 2 * u * t * mx + t * t * b.lat,
      lng: u * u * a.lng + 2 * u * t * my + t * t * b.lng,
    })
  }
  return out
}

export const curveThrough = (pts: LL[]): LL[] => {
  if (pts.length < 2) return pts
  const out: LL[] = [pts[0]]
  for (let i = 1; i < pts.length; i++) out.push(...curveBetween(pts[i - 1], pts[i]).slice(1))
  return out
}

/**
 * Driving geometry through the given stops, or null when the service has
 * nothing to offer (the caller then draws the curved fallback).
 */
export const routeThrough = (pts: LL[]): Promise<LL[] | null> => {
  if (pts.length < 2) return Promise.resolve(null)

  const key = keyOf(pts)
  const hit = cache.get(key)
  if (hit) return Promise.resolve(hit.length ? hit : null)
  if (serviceDisabled || typeof google === 'undefined') return Promise.resolve(null)

  const run = () =>
    new Promise<LL[] | null>((resolve) => {
      let settled = false
      const done = (v: LL[] | null) => { if (!settled) { settled = true; resolve(v) } }
      // Never let one slow lookup stall the queue.
      window.setTimeout(() => done(null), 9000)

      try {
        getService().route(
          {
            origin: pts[0],
            destination: pts[pts.length - 1],
            waypoints: pts.slice(1, -1).map((location) => ({ location, stopover: true })),
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (res, status) => {
            if (status === google.maps.DirectionsStatus.OK && res?.routes[0]) {
              const path = res.routes[0].overview_path.map((p) => ({ lat: p.lat(), lng: p.lng() }))
              cache.set(key, path)
              done(path)
              return
            }
            if (
              status === google.maps.DirectionsStatus.REQUEST_DENIED ||
              status === google.maps.DirectionsStatus.OVER_QUERY_LIMIT ||
              status === google.maps.DirectionsStatus.UNKNOWN_ERROR
            ) {
              serviceDisabled = true
            }
            cache.set(key, [])
            done(null)
          },
        )
      } catch {
        serviceDisabled = true
        done(null)
      }
    })

  // Serialise lookups with a small gap so the service is never hammered.
  const p = chain.then(run)
  chain = p.then(() => new Promise((r) => window.setTimeout(r, 90)))
  return p
}

/**
 * Geometry for one hop: the real road when the service can supply it, the
 * curved trail otherwise. Resolved leg by leg so a single unreachable island
 * never flattens the rest of the route.
 */
export const trailBetween = async (a: LL, b: LL, drivable: boolean): Promise<LL[]> => {
  if (drivable) {
    const routed = await routeThrough([a, b])
    if (routed && routed.length > 1) return routed
  }
  return curveBetween(a, b)
}

export const trailThrough = async (
  pts: LL[],
  drivable: (index: number) => boolean,
): Promise<LL[]> => {
  if (pts.length < 2) return pts
  const out: LL[] = []
  for (let i = 1; i < pts.length; i++) {
    const leg = await trailBetween(pts[i - 1], pts[i], drivable(i))
    out.push(...(i === 1 ? leg : leg.slice(1)))
  }
  return out
}

export const directionsAvailable = () => !serviceDisabled
