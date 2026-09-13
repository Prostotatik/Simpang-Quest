import { POIS } from './pois'

/**
 * Regions are not a separate dataset: they are whatever the POIs say they are.
 * Deriving them here keeps the picker in the character sheet honest — you can
 * never ask for a region the map has nothing in.
 */
export interface Region {
  id: string
  /** Centre of gravity of the region's POIs, used for the travel radius. */
  lat: number
  lng: number
  poiCount: number
}

const build = (): Region[] => {
  const groups = new Map<string, { lat: number; lng: number; n: number }>()
  POIS.forEach((poi) => {
    // Beds are not destinations; a region exists because there is something to do.
    if (poi.category === 'stay') return
    const g = groups.get(poi.region) ?? { lat: 0, lng: 0, n: 0 }
    g.lat += poi.lat
    g.lng += poi.lng
    g.n += 1
    groups.set(poi.region, g)
  })

  return [...groups.entries()]
    .map(([id, g]) => ({ id, lat: g.lat / g.n, lng: g.lng / g.n, poiCount: g.n }))
    .sort((a, b) => b.poiCount - a.poiCount || a.id.localeCompare(b.id))
}

export const REGIONS: Region[] = build()

export const REGION_IDS: string[] = REGIONS.map((r) => r.id)

export const regionById = (id: string) => REGIONS.find((r) => r.id === id) ?? null
