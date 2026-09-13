import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GoogleMap, OverlayViewF, PolylineF, useJsApiLoader } from '@react-google-maps/api'
import { AnimatePresence, motion } from 'framer-motion'
import { POIS, poiById } from '../data/pois'
import { startById } from '../data/startLocations'
import { useStore } from '../store/useStore'
import type { MarkerKind, Poi } from '../types'
import { MapMarker } from './MapMarker'
import { captionAnchor, labelSide, type LabelPlacement } from './labelAnchor'
import { partialPath, useDrawnPaths } from './useDrawnPaths'
import { NodeCard } from './NodeCard'
import { haversineKm } from '../engine/scoring'
import { NON_DRIVABLE, curveBetween, trailBetween, type LL } from '../engine/directions'
import { MODE_PATH, type TravelMode } from '../engine/travel'
import { buildLegs, type HubStop, type PlanLeg } from '../engine/legs'

/** Calibrated against George Town / KL / Johor Bahru / Kota Bharu on the art. */
export const MAP_BOUNDS = { north: 7.1529, south: 1.0472, west: 96.3595, east: 108.0277 }
const ART_BOUNDS = MAP_BOUNDS
const CENTER = { lat: 4.05, lng: 102.2 }

const BLANK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#12384a' }] },
  { elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#12384a' }, { visibility: 'on' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#173c3f' }, { visibility: 'on' }] },
]

const scoutKey = (from: LL, toPoiId: string) =>
  `${from.lat.toFixed(3)},${from.lng.toFixed(3)}>${toPoiId}`

type Leg = PlanLeg & { path: LL[] }

const CARD_W = 302
const CARD_H = 382

/** Where a node sits on screen, so the card can open into free space. */
const anchorPixel = (map: google.maps.Map, lat: number, lng: number) => {
  const proj = map.getProjection()
  const bounds = map.getBounds()
  const zoom = map.getZoom()
  if (!proj || !bounds || zoom == null) return null
  const scale = 2 ** zoom
  const nw = proj.fromLatLngToPoint(
    new google.maps.LatLng(bounds.getNorthEast().lat(), bounds.getSouthWest().lng()),
  )
  const pt = proj.fromLatLngToPoint(new google.maps.LatLng(lat, lng))
  if (!nw || !pt) return null
  return { x: (pt.x - nw.x) * scale, y: (pt.y - nw.y) * scale }
}

const GOLD = '#f6dda6'
const GREY = '#dfe6e9'

/**
 * Dashes drawn twice - a dark backing stroke, then the bright one - plus the
 * travel glyph for the leg. Polyline symbols are rotated onto the edge they sit
 * on, so a glyph drawn pointing up ends up facing the way the party travels.
 */
const dashed = (
  color: string,
  weight: number,
  repeat: string,
  opacity: number,
  mode?: TravelMode,
  glyphScale = 0.62,
  legKm = 0,
) => {
  const icons: google.maps.IconSequence[] = [
    {
      icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.5, strokeColor: '#0a1114', strokeWeight: weight + 3.2, scale: 3.2 },
      offset: '0',
      repeat,
    },
    {
      icon: { path: 'M 0,-1 0,1', strokeOpacity: opacity, strokeColor: color, strokeWeight: weight, scale: 3.2 },
      offset: '0',
      repeat,
    },
  ]

  if (mode) {
    const glyph: google.maps.Symbol = {
      path: MODE_PATH[mode],
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#0a1114',
      strokeOpacity: 0.85,
      strokeWeight: 1.4,
      scale: glyphScale,
      anchor: new google.maps.Point(0, 0),
    }
    // Roughly 1.6 screen pixels per km at the zoom the board sits at.
    icons.push(legKm * 1.6 < 150
      ? { icon: glyph, offset: '50%' }
      : { icon: glyph, offset: '70px', repeat: '150px' })
  }

  return { strokeOpacity: 0, strokeColor: color, icons }
}

export function MapCanvas() {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'simpang-quest-map',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
  })

  const mapRef = useRef<google.maps.Map | null>(null)
  const [ready, setReady] = useState(false)

  const itinerary = useStore((s) => s.itinerary)
  const candidates = useStore((s) => s.candidates)
  const rejected = useStore((s) => s.rejected)
  const passed = useStore((s) => s.passed)
  const reveal = useStore((s) => s.reveal)
  const scoutLinks = useStore((s) => s.scoutLinks)
  const start = useStore((s) => startById(s.trip.startLocationId))
  const selectedPoiId = useStore((s) => s.selectedPoiId)
  const popupPoiId = useStore((s) => s.popupPoiId)
  const generating = useStore((s) => s.generating)
  const setPopup = useStore((s) => s.setPopup)
  const triggerForceMajeure = useStore((s) => s.triggerForceMajeure)

  // Ease the map so the clicked node sits high and left of centre, then work
  // out which corner the card should unfold from.
  const [placement, setPlacement] = useState({ flipX: false, flipY: false })
  useEffect(() => {
    const map = mapRef.current
    if (!map || !popupPoiId) return
    const poi = poiById(popupPoiId)
    if (!poi) return
    map.panTo({ lat: poi.lat, lng: poi.lng })
    const t1 = window.setTimeout(() => map.panBy(90, 200), 60)
    const t2 = window.setTimeout(() => {
      const px = anchorPixel(map, poi.lat, poi.lng)
      const el = map.getDiv()
      if (!px || !el) return
      setPlacement({
        flipX: px.x + 40 + CARD_W > el.clientWidth - 322,
        flipY: px.y + 34 + CARD_H > el.clientHeight - 42,
      })
    }, 520)
    return () => { window.clearTimeout(t1); window.clearTimeout(t2) }
  }, [popupPoiId])

  // When a fresh plan lands, frame the route instead of leaving the camera
  // wherever the last interaction left it.
  const planVersion = useStore((s) => s.planVersion)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !itinerary.length || generating) return
    const pts = [start, ...itinerary.map((s) => poiById(s.poiId)).filter(Boolean) as Poi[]]
    const lat = pts.reduce((a, p) => a + p.lat, 0) / pts.length
    const lng = pts.reduce((a, p) => a + p.lng, 0) / pts.length
    map.panTo({ lat, lng })
    const t = window.setTimeout(() => map.panBy(0, -50), 80)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planVersion, generating])

  // Each hop is its own leg: a travel mode, and geometry that starts as a drawn
  // trail and is replaced by the real road once the service answers.
  const [goldLegs, setGoldLegs] = useState<Leg[]>([])
  const [greyLegs, setGreyLegs] = useState<Leg[]>([])
  const [hubStops, setHubStops] = useState<HubStop[]>([])
  const itineraryKey = itinerary.map((i) => i.poiId).join('|')

  useEffect(() => {
    if (!isLoaded) return
    let live = true

    const stopPois = itinerary.map((s) => poiById(s.poiId)).filter((p): p is Poi => !!p)
    const plan = buildLegs(
      { lat: start.lat, lng: start.lng },
      stopPois.map((p) => ({
        id: p.id, ll: { lat: p.lat, lng: p.lng }, drivable: !NON_DRIVABLE.has(p.id),
      })),
      true,
    )
    setGoldLegs(plan.legs.map((l) => ({ ...l, path: curveBetween(l.from, l.to) })))

    // Scouting probes cross water the same way the golden route does: through a
    // real terminal. Drawing them straight from anchor to island is what put a
    // ferry over dry land — so every probe goes through `buildLegs` too, which
    // breaks a sea hop into drive → crossing → drive via the nearest hubs.
    const probeHubs: HubStop[] = []
    const grey: Leg[] = scoutLinks.flatMap((link) => {
      const target = poiById(link.toPoiId)
      if (!target) return []
      const to = { lat: target.lat, lng: target.lng }

      const probe = buildLegs(
        link.from,
        [{ id: link.toPoiId, ll: to, drivable: !NON_DRIVABLE.has(link.toPoiId) }],
        false,
        // The probe leaves an island when its anchor sits on one, so the origin
        // has to declare where it stands or the hop reads as a plain drive.
        { id: link.fromId, drivable: !NON_DRIVABLE.has(link.fromId) },
      )
      probeHubs.push(...probe.hubs)

      return probe.legs.map((leg) => ({
        ...leg,
        // Keyed by the probe's destination so the reveal gate still matches.
        key: `${scoutKey(link.from, link.toPoiId)}:${leg.key}`,
        toId: link.toPoiId,
        path: curveBetween(leg.from, leg.to),
      }))
    })
    setGreyLegs(grey)

    // A terminal earns its pin whichever route reaches it: showing only the
    // golden route's hubs left scouted crossings sailing from nowhere.
    const byHub = new Map<string, HubStop>()
    ;[...plan.hubs, ...probeHubs].forEach((h) => {
      if (!byHub.has(h.hub.id)) byHub.set(h.hub.id, h)
    })
    setHubStops([...byHub.values()])

    if (generating) return () => { live = false }

    plan.legs.forEach((leg) => {
      if (!leg.drivable) return
      trailBetween(leg.from, leg.to, true).then((path) => {
        if (live) setGoldLegs((prev) => prev.map((l) => (l.key === leg.key ? { ...l, path } : l)))
      })
    })

    grey.forEach((leg) => {
      if (!leg.drivable) return
      trailBetween(leg.from, leg.to, true).then((path) => {
        if (live) setGreyLegs((prev) => prev.map((l) => (l.key === leg.key ? { ...l, path } : l)))
      })
    })

    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planVersion, generating, isLoaded, itineraryKey, scoutLinks])

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
    const bounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(ART_BOUNDS.south, ART_BOUNDS.west),
      new google.maps.LatLng(ART_BOUNDS.north, ART_BOUNDS.east),
    )
    const overlay = new google.maps.GroundOverlay('/map.jpg', bounds, { clickable: false, opacity: 1 })
    overlay.setMap(map)
    setReady(true)
  }, [])

  const kinds = useMemo(() => {
    const map = new Map<string, { kind: MarkerKind; poi: Poi; order?: number }>()
    itinerary.forEach((stop, i) => {
      const poi = poiById(stop.poiId)
      if (!poi) return
      const kind: MarkerKind = stop.closed
        ? 'unsuitable'
        : poi.category === 'food' ? 'food'
        : poi.category === 'stay' ? 'camp'
        : 'confirmed'
      map.set(poi.id, { kind, poi, order: i + 1 })
    })
    candidates.forEach((id) => {
      const poi = poiById(id)
      if (poi && !map.has(id)) map.set(id, { kind: 'found', poi })
    })
    passed.forEach((id) => {
      const poi = poiById(id)
      if (poi && !map.has(id)) map.set(id, { kind: 'scouting', poi })
    })
    rejected.forEach((id) => {
      const poi = poiById(id)
      if (poi && !map.has(id)) map.set(id, { kind: 'unsuitable', poi })
    })
    return map
  }, [itinerary, candidates, passed, rejected])

  // Nodes that would overlap on screen are fanned out around their cluster.
  // Clustering is measured in pixels at the live zoom, so it reacts the way the
  // eye does: two places 700 m apart collide, and they stop colliding as soon as
  // the map is zoomed in far enough to separate them.
  const [zoom, setZoom] = useState(8)
  const spread = useMemo(() => {
    // Horizontal pixels per degree of longitude at this zoom level.
    const pxPerDegLng = (256 * 2 ** zoom) / 360
    const kmPerDegLng = 111.32 * Math.cos((4.2 * Math.PI) / 180)
    const pxPerKm = pxPerDegLng / kmPerDegLng
    const MARKER_PX = 44
    const GAP_PX = 8

    const anchored: { id: string; lat: number; lng: number }[] = [
      ...POIS.filter((p) => kinds.has(p.id) && reveal[p.id] && reveal[p.id] !== 'hidden')
        .map((p) => ({ id: p.id, lat: p.lat, lng: p.lng })),
      ...hubStops.map(({ hub }) => ({ id: `hub:${hub.id}`, lat: hub.lat, lng: hub.lng })),
    ]

    // Single-link clustering: a node joins a group if it is too close to *any*
    // member, not just the one that happened to open the group.
    const groups: { members: typeof anchored }[] = []
    anchored.forEach((node) => {
      const group = groups.find((g) =>
        g.members.some((m) => haversineKm(m, node) * pxPerKm < MARKER_PX),
      )
      if (group) group.members.push(node)
      else groups.push({ members: [node] })
    })

    const out: Record<string, { x: number; y: number }> = {}
    groups.forEach(({ members }) => {
      if (members.length < 2) return

      // Fan every member out around the group's own centre, on a ring wide
      // enough that neighbours on it cannot touch.
      const cLat = members.reduce((a, m) => a + m.lat, 0) / members.length
      const cLng = members.reduce((a, m) => a + m.lng, 0) / members.length

      let index = 0
      let ring = 0
      while (index < members.length) {
        // How many markers fit on this ring without overlapping each other.
        const radius = (MARKER_PX + GAP_PX) * (0.75 + ring * 0.85)
        const perRing = Math.max(
          3,
          Math.floor(Math.PI / Math.asin(Math.min(1, (MARKER_PX + GAP_PX) / (2 * radius)))),
        )
        const onThisRing = Math.min(perRing, members.length - index)
        for (let i = 0; i < onThisRing; i++) {
          const angle = -Math.PI / 2 + (i * (Math.PI * 2)) / onThisRing + ring * 0.6
          const node = members[index + i]
          const dLat = (node.lat - cLat) * pxPerKm * 110.57
          const dLng = (node.lng - cLng) * pxPerKm * kmPerDegLng
          out[node.id] = {
            x: Math.cos(angle) * radius + dLng,
            y: Math.sin(angle) * radius - dLat,
          }
        }
        index += onThisRing
        ring += 1
      }
    })

    // The ring layout is geometric, so a displaced node can still land on a
    // neighbouring cluster. Relax the whole set: repeatedly push apart any two
    // markers closer than one marker width, then settle.
    const px = anchored.map((node) => {
      const offset = out[node.id] ?? { x: 0, y: 0 }
      return {
        id: node.id,
        home: {
          x: node.lng * pxPerKm * kmPerDegLng,
          y: -node.lat * pxPerKm * 110.57,
        },
        at: {
          x: node.lng * pxPerKm * kmPerDegLng + offset.x,
          y: -node.lat * pxPerKm * 110.57 + offset.y,
        },
      }
    })

    for (let pass = 0; pass < 40; pass++) {
      let moved = false
      for (let i = 0; i < px.length; i++) {
        for (let j = i + 1; j < px.length; j++) {
          const a = px[i]
          const b = px[j]
          let dx = b.at.x - a.at.x
          let dy = b.at.y - a.at.y
          let dist = Math.hypot(dx, dy)
          if (dist >= MARKER_PX + GAP_PX) continue
          if (dist < 0.01) {
            // Perfectly coincident: nudge along a stable, id-derived direction.
            const seed = (a.id.charCodeAt(0) + j) % 360
            dx = Math.cos((seed * Math.PI) / 180)
            dy = Math.sin((seed * Math.PI) / 180)
            dist = 1
          }
          const push = ((MARKER_PX + GAP_PX - dist) / 2) * 0.6
          const ux = (dx / dist) * push
          const uy = (dy / dist) * push
          a.at.x -= ux; a.at.y -= uy
          b.at.x += ux; b.at.y += uy
          moved = true
        }
      }
      if (!moved) break
    }

    // Keep every marker within sight of the place it actually describes.
    const MAX_PULL = 96
    px.forEach((node) => {
      let dx = node.at.x - node.home.x
      let dy = node.at.y - node.home.y
      const dist = Math.hypot(dx, dy)
      if (dist > MAX_PULL) {
        dx = (dx / dist) * MAX_PULL
        dy = (dy / dist) * MAX_PULL
      }
      if (Math.hypot(dx, dy) < 0.5) delete out[node.id]
      else out[node.id] = { x: dx, y: dy }
    })

    return out
  }, [kinds, reveal, hubStops, zoom])

  // Only label nodes that are far enough apart to stay readable on the art.
  const labelIds = useMemo(() => {
    const kept: Poi[] = []
    itinerary.forEach((stop) => {
      const poi = poiById(stop.poiId)
      if (!poi) return
      if (kept.some((k) => haversineKm(k, poi) < 55)) return
      kept.push(poi)
    })
    return new Set(kept.map((p) => p.id))
  }, [itinerary])

  const visibleGold = useMemo(
    () => goldLegs.filter((l) => reveal[l.toId] === 'resolved'),
    [goldLegs, reveal],
  )
  const visibleGrey = useMemo(
    () => greyLegs.filter((l) => reveal[l.toId] === 'resolved'),
    [greyLegs, reveal],
  )

  // Each leg inks itself in once it becomes visible, rather than snapping on.
  const drawable = useMemo(
    () => [...visibleGold, ...visibleGrey].map((l) => ({ key: l.key, km: l.km })),
    [visibleGold, visibleGrey],
  )
  const drawn = useDrawnPaths(drawable)

  if (loadError) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-[#0c2a33] text-parch-200 font-body">
        Map failed to load.
      </div>
    )
  }

  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0 bg-[#0d2c38] bg-cover bg-center transition-opacity duration-700"
        style={{ backgroundImage: 'url(/map.jpg)', opacity: ready ? 0 : 1 }}
      />
      {isLoaded && (
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={CENTER}
          zoom={8}
          onLoad={onLoad}
          onClick={() => setPopup(null)}
          onZoomChanged={() => {
            const z = mapRef.current?.getZoom()
            if (typeof z === 'number') setZoom(z)
          }}
          options={{
            disableDefaultUI: true,
            clickableIcons: false,
            keyboardShortcuts: false,
            gestureHandling: 'greedy',
            backgroundColor: '#0d2c38',
            minZoom: 8,
            maxZoom: 10,
            isFractionalZoomEnabled: true,
            restriction: { latLngBounds: ART_BOUNDS, strictBounds: true },
            styles: BLANK_STYLE,
            tilt: 0,
            rotateControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: false,
          }}
        >
          {visibleGold.map((leg) => {
            const t = drawn[leg.key] ?? 0
            const path = partialPath(leg.path, t)
            if (path.length < 2) return null
            return (
              <Fragment key={leg.key}>
                <PolylineF
                  path={path}
                  options={{ strokeColor: '#f0d08a', strokeOpacity: 0.22, strokeWeight: 11, zIndex: 1 }}
                />
                <PolylineF
                  path={path}
                  // The glyph only rides along once the leg is fully drawn, so it
                  // never sits stranded on a half-finished line.
                  options={{
                    ...dashed(GOLD, 4.4, '18px', 1, t > 0.99 ? leg.mode : undefined, 1.02, leg.km),
                    zIndex: 4,
                  }}
                />
              </Fragment>
            )
          })}
          {visibleGrey.map((leg) => {
            const t = drawn[leg.key] ?? 0
            const path = partialPath(leg.path, t)
            if (path.length < 2) return null
            return (
              <PolylineF
                key={leg.key}
                path={path}
                options={{
                  ...dashed(GREY, 1.9, '13px', 0.75, t > 0.99 ? leg.mode : undefined, 0.84, leg.km),
                  zIndex: 2,
                }}
              />
            )
          })}

          {POIS.map((poi) => {
            const entry = kinds.get(poi.id)
            const state = reveal[poi.id]
            if (!entry || !state || state === 'hidden') return null
            const kind: MarkerKind = state === 'scouting' ? 'scouting' : entry.kind
            return (
              <OverlayViewF
                key={poi.id}
                position={{ lat: poi.lat, lng: poi.lng }}
                mapPaneName="overlayMouseTarget"
                getPixelPositionOffset={() => ({
                  x: -21 + (spread[poi.id]?.x ?? 0),
                  y: -21 + (spread[poi.id]?.y ?? 0),
                })}
              >
                <MapMarker
                  poi={poi}
                  kind={kind}
                  selected={selectedPoiId === poi.id}
                  showLabel={entry.order !== undefined && labelIds.has(poi.id)}
                  label={labelSide(spread[poi.id])}
                  onClick={() => setPopup(poi.id)}
                  onStorm={entry.order !== undefined && kind !== 'unsuitable'
                    ? () => triggerForceMajeure(poi.id)
                    : undefined}
                />
              </OverlayViewF>
            )
          })}

          {hubStops.map(({ hub, fare, mode }) => (
            <OverlayViewF
              key={hub.id}
              position={{ lat: hub.lat, lng: hub.lng }}
              mapPaneName="floatPane"
              getPixelPositionOffset={() => ({
                x: -17 + (spread[`hub:${hub.id}`]?.x ?? 0),
                y: -17 + (spread[`hub:${hub.id}`]?.y ?? 0),
              })}
            >
              <HubMarker name={hub.short} fare={fare} mode={mode}
                label={labelSide(spread[`hub:${hub.id}`])} />
            </OverlayViewF>
          ))}

          <OverlayViewF
            position={{ lat: start.lat, lng: start.lng }}
            mapPaneName="floatPane"
            getPixelPositionOffset={() => ({ x: -44, y: -44 })}
          >
            <StartMarker name={start.name} />
          </OverlayViewF>

          <AnimatePresence>
            {popupPoiId && poiById(popupPoiId) && (
              <OverlayViewF
                key={popupPoiId}
                position={{ lat: poiById(popupPoiId)!.lat, lng: poiById(popupPoiId)!.lng }}
                mapPaneName="floatPane"
                getPixelPositionOffset={(_w, h) => ({
                  x: placement.flipX ? -(CARD_W + 40) : 40,
                  y: placement.flipY ? -((h || CARD_H) + 34) : 34,
                })}
              >
                <NodeCard poi={poiById(popupPoiId)!} flipX={placement.flipX} flipY={placement.flipY} />
              </OverlayViewF>
            )}
          </AnimatePresence>
        </GoogleMap>
      )}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(150% 115% at 50% 45%, rgba(4,16,22,0) 62%, rgba(4,16,22,.5) 100%)' }} />
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 1 }}
        animate={{ opacity: ready ? 0 : 1 }}
        transition={{ duration: 0.8 }}
        style={{ background: '#07161d' }}
      />
    </div>
  )
}

/** Airport or ferry terminal the crossing actually leaves from. */
function HubMarker({ name, fare, mode, label }: {
  name: string; fare: number; mode: TravelMode
  label: LabelPlacement
}) {
  return (
    <div className="relative" style={{ width: 34, height: 34 }}>
      <div
        className="grid h-[34px] w-[34px] place-items-center rounded-full"
        style={{
          background: 'radial-gradient(circle at 34% 28%, #23303a 0%, #10171d 60%, #070b0e 100%)',
          boxShadow: '0 0 0 2px #bcd4e0, 0 0 12px rgba(188,212,224,.45), 0 5px 10px -4px rgba(0,0,0,.85)',
        }}
      >
        <svg viewBox="-12 -12 24 24" className="h-[17px] w-[17px]">
          <path d={MODE_PATH[mode]} fill="#e6f1f7" stroke="#0a1114" strokeWidth="1.3" strokeOpacity=".8" />
        </svg>
      </div>
      <div
        className="pointer-events-none absolute whitespace-nowrap font-body text-[11.5px] font-semibold leading-tight text-[#dce9f0]"
        style={{
          ...captionAnchor(label),
          textShadow: '0 2px 6px rgba(0,0,0,.95), 0 0 10px rgba(0,0,0,.9)',
        }}
      >
        {name}
        <span className="block text-[11px] font-bold text-gold-300">RM {fare}</span>
      </div>
    </div>
  )
}

/** The party's home base: where every gold route begins. */
function StartMarker({ name }: { name: string }) {
  return (
    <div className="relative" style={{ width: 44, height: 44, zIndex: 8 }}>
      <div
        className="grid h-11 w-11 place-items-center rounded-full"
        style={{
          background: 'radial-gradient(circle at 34% 28%, #3a2d14 0%, #1a1409 58%, #0a0806 100%)',
          boxShadow: '0 0 0 2.6px #f0d08a, 0 0 16px rgba(240,208,138,.6), 0 0 34px rgba(240,208,138,.35), 0 6px 12px -4px rgba(0,0,0,.85)',
        }}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#f7e3b0" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 21V3" />
          <path d="M7 4h10l-2.2 3.2L17 10.5H7z" fill="#e4bb63" stroke="#f7e3b0" />
        </svg>
      </div>
      <div
        className="pointer-events-none absolute left-1/2 top-[46px] -translate-x-1/2 whitespace-nowrap font-body text-[12.5px] font-semibold uppercase tracking-[.12em] text-gold-200"
        style={{ textShadow: '0 2px 6px rgba(0,0,0,.95), 0 0 12px rgba(0,0,0,.9)' }}
      >
        {name}
      </div>
    </div>
  )
}
