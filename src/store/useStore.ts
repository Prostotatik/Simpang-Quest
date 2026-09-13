import { create } from 'zustand'
import { POIS, poiById } from '../data/pois'
import { DEFAULT_PRESET_ID, SEED_MEMBERS, SEED_TRIP, presetById } from '../data/seed'
import { DAY_ACTIVE_HOURS, buildProfile, haversineKm, scoreAll } from '../engine/scoring'
import { findAlternative, orderLoop, planTrip, travelHours } from '../engine/route'
import { deriveTrip } from '../engine/deriveTrip'
import { startById } from '../data/startLocations'
import type { ItineraryStop, JournalStatus, Member, ScoredPoi, ScoutLink, Trip } from '../types'

/**
 * PROTOTYPE: canned reasoning lines. The real build streams an agent's tokens
 * through the same `reasoningStep` cursor that drives these.
 */
export const REASONING_STEPS = [
  'Analyzing group preferences...',
  'Checking budget & availability...',
  'Filtering best routes...',
  'Considering weather & risks...',
  'Generating itinerary...',
]

export type RevealState = 'hidden' | 'scouting' | 'resolved'

interface ForceMajeure {
  closedPoiId: string
  alternativePoiId: string | null
  distanceKm: number
  resolving: boolean
  applied: boolean
}

interface State {
  phase: 'onboarding' | 'map'
  members: Member[]
  /** Which demo party is loaded, or null once the party is hand-edited. */
  presetId: string | null
  trip: Trip
  scored: ScoredPoi[]
  itinerary: ItineraryStop[]
  candidates: string[]
  rejected: string[]
  passed: string[]
  scoutLinks: ScoutLink[]
  collapsed: Record<string, boolean>
  reveal: Record<string, RevealState>
  generating: boolean
  reasoningStep: number
  selectedPoiId: string | null
  popupPoiId: string | null
  editingMemberId: string | null
  editingTrip: boolean
  forceMajeure: ForceMajeure | null
  planVersion: number

  start: () => void
  backToOnboarding: () => void
  applyPreset: (id: string) => void
  addMember: (m?: Partial<Member>) => void
  updateMember: (id: string, patch: Partial<Member>) => void
  removeMember: (id: string) => void
  setEditingMember: (id: string | null) => void
  setEditingTrip: (v: boolean) => void
  toggleCollapsed: (key: string) => void
  generate: () => void
  selectPoi: (id: string | null) => void
  setPopup: (id: string | null) => void
  setStatus: (poiId: string, status: JournalStatus) => void
  cycleStatus: (poiId: string) => void
  addToItinerary: (poiId: string) => void
  removeFromItinerary: (poiId: string) => void
  triggerForceMajeure: (poiId: string) => void
  useAlternative: () => void
  undoForceMajeure: () => void
  dismissForceMajeure: () => void
}

let revealTimers: number[] = []
let reasoningTimer: number | null = null
const clearTimers = () => {
  revealTimers.forEach((t) => window.clearTimeout(t))
  revealTimers = []
  if (reasoningTimer) { window.clearInterval(reasoningTimer); reasoningTimer = null }
}

const STATUS_CYCLE: JournalStatus[] = ['Pending', 'In Progress', 'Completed', 'Skipped']

/**
 * Re-run the loop ordering after the itinerary changes under us, then re-slice
 * it into days with the same clock the planner used — travel included, and
 * never spilling past the days the party actually has.
 */
const reorder = (stops: ItineraryStop[], trip: Trip): ItineraryStop[] => {
  const base = startById(trip.startLocationId)
  const withPoi = stops
    .map((stop) => ({ stop, poi: poiById(stop.poiId) }))
    .filter((x): x is { stop: ItineraryStop; poi: NonNullable<ReturnType<typeof poiById>> } => !!x.poi)
  const ordered = orderLoop(withPoi, base, (x) => x.poi, (x) => x.poi.id)

  const maxDay = Math.max(1, trip.maxDurationDays)
  let day = 1
  let hours = 0
  let cursor: { lat: number; lng: number } = base
  return ordered.map(({ stop, poi }) => {
    const needed = travelHours(haversineKm(cursor, poi)) + poi.durationHours
    if (hours > 0 && hours + needed > DAY_ACTIVE_HOURS && day < maxDay) { day += 1; hours = 0 }
    hours += needed
    cursor = poi
    return { ...stop, day }
  })
}

const emptyMember = (index: number): Member => ({
  id: `m-${Math.random().toString(36).slice(2, 9)}`,
  name: `Adventurer ${index + 1}`,
  age: 25,
  vegan: false,
  disability: false,
  interests: [],
  freeDates: [],
  maxTripDays: 5,
  preferredRegions: [],
  budgetRM: 1200,
  avatarSeed: index % 6,
})

export const useStore = create<State>((set, get) => ({
  phase: 'onboarding',
  members: SEED_MEMBERS,
  presetId: DEFAULT_PRESET_ID,
  trip: deriveTrip(SEED_MEMBERS, SEED_TRIP),
  scored: scoreAll(SEED_MEMBERS, deriveTrip(SEED_MEMBERS, SEED_TRIP)),
  itinerary: [],
  candidates: [],
  rejected: [],
  passed: [],
  scoutLinks: [],
  collapsed: {},
  reveal: {},
  generating: false,
  reasoningStep: 0,
  selectedPoiId: null,
  popupPoiId: null,
  editingMemberId: null,
  editingTrip: false,
  forceMajeure: null,
  planVersion: 0,

  start: () => { set({ phase: 'map' }); get().generate() },
  backToOnboarding: () => set({ phase: 'onboarding' }),

  /** Swap the whole party for a demo preset and let the trip fall out of it. */
  applyPreset: (id) => set((s) => {
    const preset = presetById(id)
    // Fresh copies: editing a member must never mutate the preset itself, or
    // switching back and forth would carry edits across.
    const members = preset.members.map((m) => ({
      ...m,
      interests: [...m.interests],
      preferredRegions: [...m.preferredRegions],
      freeDates: m.freeDates.map((f) => ({ ...f })),
    }))
    return {
      members,
      presetId: preset.id,
      trip: deriveTrip(members, s.trip),
      editingMemberId: null,
    }
  }),

  addMember: (m) => set((s) => {
    if (s.members.length >= 6) return s
    const member = { ...emptyMember(s.members.length), ...m }
    const members = [...s.members, member]
    return { members, presetId: null, trip: deriveTrip(members, s.trip), editingMemberId: member.id }
  }),
  updateMember: (id, patch) => set((s) => {
    const members = s.members.map((m) => (m.id === id ? { ...m, ...patch } : m))
    return { members, presetId: null, trip: deriveTrip(members, s.trip) }
  }),
  removeMember: (id) => set((s) => {
    const members = s.members.filter((m) => m.id !== id)
    return {
      members,
      presetId: null,
      trip: deriveTrip(members, s.trip),
      editingMemberId: s.editingMemberId === id ? null : s.editingMemberId,
    }
  }),
  setEditingMember: (id) => set({ editingMemberId: id }),
  setEditingTrip: (v) => set({ editingTrip: v }),
  toggleCollapsed: (key) => set((s) => ({ collapsed: { ...s.collapsed, [key]: !s.collapsed[key] } })),

  generate: () => {
    clearTimers()
    const { members, trip } = get()
    const scored = scoreAll(members, trip)
    const plan = planTrip(scored, members, trip)

    const order = [
      ...plan.itinerary.map((i) => i.poiId),
      ...plan.candidates,
      ...plan.passed,
      ...plan.rejected,
    ]
    const reveal: Record<string, RevealState> = {}
    POIS.forEach((p) => { reveal[p.id] = 'hidden' })

    set({
      scored,
      itinerary: plan.itinerary,
      candidates: plan.candidates,
      rejected: plan.rejected,
      passed: plan.passed,
      scoutLinks: plan.scoutLinks,
      reveal,
      generating: true,
      reasoningStep: 0,
      forceMajeure: null,
      selectedPoiId: plan.itinerary[0]?.poiId ?? plan.candidates[0] ?? null,
      popupPoiId: null,
      planVersion: get().planVersion + 1,
    })

    // Pace the scouting so every reasoning line is readable while it runs.
    const step = 380
    const total = 600 + order.length * step + 700

    reasoningTimer = window.setInterval(() => {
      set((s) => ({ reasoningStep: Math.min(REASONING_STEPS.length - 1, s.reasoningStep + 1) }))
    }, Math.round(total / REASONING_STEPS.length))

    order.forEach((id, i) => {
      revealTimers.push(window.setTimeout(() => {
        set((s) => ({ reveal: { ...s.reveal, [id]: 'scouting' } }))
      }, 300 + i * step))
      revealTimers.push(window.setTimeout(() => {
        set((s) => ({ reveal: { ...s.reveal, [id]: 'resolved' } }))
      }, 300 + i * step + 700))
    })
    revealTimers.push(window.setTimeout(() => {
      if (reasoningTimer) { window.clearInterval(reasoningTimer); reasoningTimer = null }
      set({ generating: false, reasoningStep: REASONING_STEPS.length - 1 })
    }, total))
  },

  selectPoi: (id) => set({ selectedPoiId: id }),
  setPopup: (id) => set({ popupPoiId: id, selectedPoiId: id ?? get().selectedPoiId }),

  setStatus: (poiId, status) => set((s) => ({
    itinerary: s.itinerary.map((i) => (i.poiId === poiId ? { ...i, status } : i)),
  })),
  cycleStatus: (poiId) => set((s) => ({
    itinerary: s.itinerary.map((i) =>
      i.poiId === poiId
        ? { ...i, status: STATUS_CYCLE[(STATUS_CYCLE.indexOf(i.status) + 1) % STATUS_CYCLE.length] }
        : i,
    ),
  })),

  addToItinerary: (poiId) => set((s) => {
    if (s.itinerary.some((i) => i.poiId === poiId)) return s
    const last = s.itinerary[s.itinerary.length - 1]
    return {
      itinerary: reorder(
        [...s.itinerary, { poiId, day: last?.day ?? 1, status: 'Pending' as JournalStatus }],
        s.trip,
      ),
      candidates: s.candidates.filter((c) => c !== poiId),
      reveal: { ...s.reveal, [poiId]: 'resolved' },
    }
  }),
  removeFromItinerary: (poiId) => set((s) => ({
    itinerary: s.itinerary.filter((i) => i.poiId !== poiId),
    candidates: s.candidates.includes(poiId) ? s.candidates : [...s.candidates, poiId],
  })),

  triggerForceMajeure: (poiId) => {
    const { scored, members, trip, itinerary } = get()
    set({
      forceMajeure: { closedPoiId: poiId, alternativePoiId: null, distanceKm: 0, resolving: true, applied: false },
      itinerary: itinerary.map((i) => (i.poiId === poiId ? { ...i, closed: true } : i)),
      selectedPoiId: poiId,
      popupPoiId: poiId,
    })
    const profile = buildProfile(members, trip)
    const taken = new Set(itinerary.map((i) => i.poiId))

    // The orchestrator does not ask twice: it swaps in the best nearby match and
    // rebuilds the golden route, leaving an undo on the card.
    window.setTimeout(() => {
      const alt = findAlternative(poiId, scored, taken, profile.perPersonBudget)
      if (!alt) {
        set({ forceMajeure: { closedPoiId: poiId, alternativePoiId: null, distanceKm: 0, resolving: false, applied: false } })
        return
      }
      set((s) => ({
        itinerary: reorder(
          s.itinerary.map((i) => (i.poiId === poiId
            ? { poiId: alt.poiId, day: i.day, status: 'Pending' as JournalStatus, replacedFrom: poiId }
            : i)),
          s.trip,
        ),
        candidates: s.candidates.filter((c) => c !== alt.poiId),
        rejected: s.rejected.includes(poiId) ? s.rejected : [...s.rejected, poiId],
        reveal: { ...s.reveal, [alt.poiId]: 'resolved' },
        selectedPoiId: alt.poiId,
        popupPoiId: alt.poiId,
        forceMajeure: {
          closedPoiId: poiId,
          alternativePoiId: alt.poiId,
          distanceKm: Math.round(alt.distanceKm * 10) / 10,
          resolving: false,
          applied: true,
        },
      }))
    }, 1100)
  },

  useAlternative: () => {
    const fm = get().forceMajeure
    if (!fm?.alternativePoiId || fm.applied) return
    const altId = fm.alternativePoiId
    set((s) => ({
      itinerary: reorder(
        s.itinerary.map((i) => (i.poiId === fm.closedPoiId
          ? { poiId: altId, day: i.day, status: 'Pending' as JournalStatus, replacedFrom: fm.closedPoiId }
          : i)),
        s.trip,
      ),
      candidates: s.candidates.filter((c) => c !== altId),
      rejected: s.rejected.includes(fm.closedPoiId) ? s.rejected : [...s.rejected, fm.closedPoiId],
      reveal: { ...s.reveal, [altId]: 'resolved' },
      forceMajeure: { ...fm, applied: true },
      selectedPoiId: altId,
      popupPoiId: altId,
    }))
  },

  undoForceMajeure: () => {
    const fm = get().forceMajeure
    if (!fm?.alternativePoiId || !fm.applied) return
    const { closedPoiId, alternativePoiId } = fm
    set((s) => ({
      itinerary: reorder(
        s.itinerary.map((i) => (i.poiId === alternativePoiId
          ? { poiId: closedPoiId, day: i.day, status: 'Pending' as JournalStatus }
          : i)),
        s.trip,
      ),
      rejected: s.rejected.filter((r) => r !== closedPoiId),
      candidates: s.candidates.includes(alternativePoiId) ? s.candidates : [...s.candidates, alternativePoiId],
      forceMajeure: null,
      selectedPoiId: closedPoiId,
      popupPoiId: closedPoiId,
    }))
  },

  dismissForceMajeure: () => set((s) => ({
    forceMajeure: null,
    itinerary: s.itinerary.map((i) =>
      i.poiId === s.forceMajeure?.closedPoiId ? { ...i, closed: false } : i,
    ),
  })),
}))

export const selectScored = (id: string | null) =>
  id ? useStore.getState().scored.find((s) => s.poi.id === id) ?? null : null

export const poiName = (id: string) => poiById(id)?.name ?? id
