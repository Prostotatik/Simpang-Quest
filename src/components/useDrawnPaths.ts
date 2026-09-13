import { useEffect, useMemo, useRef, useState } from 'react'
import type { LL } from '../engine/directions'

/** How far along a leg the ink has reached, 0 to 1. */
export type DrawProgress = Record<string, number>

const SPEED_PX_PER_MS = 0.0011 // ~1.1 km of path per second at the board's zoom

/**
 * Advances a stroke-on progress value for every leg key handed in, so a route
 * draws itself dash by dash instead of snapping into place. Keys that vanish are
 * forgotten; keys that reappear start over.
 */
export const useDrawnPaths = (legs: { key: string; km: number }[]): DrawProgress => {
  const [progress, setProgress] = useState<DrawProgress>({})
  const frame = useRef<number | null>(null)
  const startedAt = useRef<Record<string, number>>({})

  // A stable signature so the effect only restarts when the set of legs changes.
  const signature = useMemo(
    () => legs.map((l) => `${l.key}:${Math.round(l.km)}`).join('|'),
    [legs],
  )

  useEffect(() => {
    const durations: Record<string, number> = {}
    legs.forEach((leg) => {
      // Longer legs take longer to draw, but never so long that the eye wanders.
      durations[leg.key] = Math.min(1400, Math.max(320, leg.km / SPEED_PX_PER_MS / 620))
    })

    // Drop anything that is no longer on the board.
    const live = new Set(legs.map((l) => l.key))
    Object.keys(startedAt.current).forEach((key) => {
      if (!live.has(key)) delete startedAt.current[key]
    })

    const tick = (now: number) => {
      let running = false
      const next: DrawProgress = {}

      legs.forEach((leg) => {
        if (startedAt.current[leg.key] === undefined) startedAt.current[leg.key] = now
        const elapsed = now - startedAt.current[leg.key]
        const t = Math.min(1, elapsed / durations[leg.key])
        // Ease out, so the line lands softly rather than stopping dead.
        next[leg.key] = 1 - (1 - t) ** 2
        if (t < 1) running = true
      })

      setProgress(next)
      frame.current = running ? requestAnimationFrame(tick) : null
    }

    frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      frame.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  return progress
}

/** The leading part of a path, cut at `t` of its total length. */
export const partialPath = (path: LL[], t: number): LL[] => {
  if (t >= 1 || path.length < 2) return path
  if (t <= 0) return []

  const cut = 1 + t * (path.length - 1)
  const whole = Math.floor(cut)
  const head = path.slice(0, whole)

  // Interpolate the final sliver so the tip advances smoothly between vertices.
  const prev = path[whole - 1]
  const nextPoint = path[whole]
  if (prev && nextPoint) {
    const f = cut - whole
    head.push({
      lat: prev.lat + (nextPoint.lat - prev.lat) * f,
      lng: prev.lng + (nextPoint.lng - prev.lng) * f,
    })
  }
  return head
}
