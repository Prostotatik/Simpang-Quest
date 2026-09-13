import type { StartLocation } from '../types'

/** Where the party sets out from. Real coordinates, fixed list (no geocoding). */
export const START_LOCATIONS: StartLocation[] = [
  { id: 'kl', name: 'Kuala Lumpur', lat: 3.139, lng: 101.6869 },
  { id: 'penang', name: 'George Town, Penang', lat: 5.4141, lng: 100.3288 },
  { id: 'jb', name: 'Johor Bahru', lat: 1.4927, lng: 103.7414 },
  { id: 'melaka', name: 'Melaka', lat: 2.1896, lng: 102.2501 },
  { id: 'ipoh', name: 'Ipoh', lat: 4.5975, lng: 101.0901 },
  { id: 'kotabharu', name: 'Kota Bharu', lat: 6.1254, lng: 102.2381 },
  { id: 'kuantan', name: 'Kuantan', lat: 3.8077, lng: 103.326 },
  { id: 'terengganu', name: 'Kuala Terengganu', lat: 5.3302, lng: 103.1408 },
  { id: 'langkawi', name: 'Langkawi', lat: 6.3548, lng: 99.7286 },
  { id: 'alorsetar', name: 'Alor Setar', lat: 6.1184, lng: 100.3685 },
]

export const startById = (id: string) =>
  START_LOCATIONS.find((s) => s.id === id) ?? START_LOCATIONS[0]
