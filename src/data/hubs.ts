export type HubKind = 'airport' | 'ferry'

export interface Hub {
  id: string
  name: string
  short: string
  kind: HubKind
  lat: number
  lng: number
}

/**
 * Real airports and ferry terminals. A sea or air hop never runs door to door:
 * the party drives to the nearest hub, crosses, and drives on from the far side.
 */
export const HUBS: Hub[] = [
  // --- airports ---
  { id: 'klia', name: 'KL International Airport', short: 'KLIA', kind: 'airport', lat: 2.7456, lng: 101.7099 },
  { id: 'pen-air', name: 'Penang International Airport', short: 'Penang Intl', kind: 'airport', lat: 5.2971, lng: 100.277 },
  { id: 'lgk-air', name: 'Langkawi International Airport', short: 'Langkawi Intl', kind: 'airport', lat: 6.3297, lng: 99.7287 },
  { id: 'tod-air', name: 'Tioman Airport', short: 'Tioman Air', kind: 'airport', lat: 2.8182, lng: 104.16 },
  { id: 'tgg-air', name: 'Sultan Mahmud Airport', short: 'Terengganu Air', kind: 'airport', lat: 5.3826, lng: 103.1036 },
  { id: 'kua-air', name: 'Sultan Ahmad Shah Airport', short: 'Kuantan Air', kind: 'airport', lat: 3.7754, lng: 103.209 },
  { id: 'jhb-air', name: 'Senai International Airport', short: 'Senai Intl', kind: 'airport', lat: 1.6411, lng: 103.6694 },
  { id: 'kbr-air', name: 'Sultan Ismail Petra Airport', short: 'Kota Bharu Air', kind: 'airport', lat: 6.1668, lng: 102.2933 },

  // --- ferry terminals ---
  { id: 'mersing-jetty', name: 'Mersing Jetty', short: 'Mersing', kind: 'ferry', lat: 2.4326, lng: 103.84 },
  { id: 'tioman-jetty', name: 'Tekek Jetty, Tioman', short: 'Tekek Jetty', kind: 'ferry', lat: 2.81, lng: 104.145 },
  { id: 'kperlis-jetty', name: 'Kuala Perlis Jetty', short: 'Kuala Perlis', kind: 'ferry', lat: 6.399, lng: 100.13 },
  { id: 'lgk-jetty', name: 'Kuah Jetty, Langkawi', short: 'Kuah Jetty', kind: 'ferry', lat: 6.318, lng: 99.851 },
  { id: 'merang-jetty', name: 'Merang Jetty', short: 'Merang', kind: 'ferry', lat: 5.534, lng: 102.953 },
  { id: 'redang-jetty', name: 'Redang Jetty', short: 'Redang Jetty', kind: 'ferry', lat: 5.776, lng: 103.008 },
  { id: 'penang-pier', name: 'Swettenham Pier, Penang', short: 'Swettenham', kind: 'ferry', lat: 5.42, lng: 100.343 },
]

export const hubById = (id: string) => HUBS.find((h) => h.id === id)

/** Cheap fare model: a base plus a per-kilometre rate, rounded to RM 5. */
export const fareRM = (kind: HubKind, km: number) =>
  Math.max(15, Math.round(((kind === 'airport' ? 65 + km * 0.52 : 18 + km * 0.34)) / 5) * 5)
