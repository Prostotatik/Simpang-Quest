import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { REGION_IDS } from '../data/regions'
import { toISODate } from '../data/seed'
import { startById } from '../data/startLocations'
import { TAG_POOL } from '../data/tags'
import { useStore } from '../store/useStore'
import { Avatar } from './common'
import { Field, Stepper, TagPicker, Toggle, inputClass } from './fields'
import { IconPlus, IconTrash, IconX } from './icons'
import type { FreeDate } from '../types'

function Shell({ title, subtitle, onClose, children, footer, width = 560 }: {
  title: string; subtitle?: string; onClose: () => void
  children: React.ReactNode; footer?: React.ReactNode; width?: number
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-[200] grid place-items-center p-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: 'rgba(4,12,16,.62)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="parchment flex max-h-[86vh] flex-col"
        style={{ width }}
      >
        <div className="flex items-start gap-3 px-5 pt-4">
          <div className="flex-1">
            <h2 className="font-body text-[23px] font-bold leading-tight text-ink-900 title-emboss">{title}</h2>
            {subtitle && <p className="font-body text-[14px] italic text-ink-600">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-ink-700 transition hover:bg-ink-900/10">
            <IconX className="h-4 w-4" />
          </button>
        </div>
        <div className="hairline mx-5 mt-2.5 min-h-0 flex-1 overflow-y-auto pr-1 pt-3.5">{children}</div>
        {footer && <div className="hairline mx-5 mb-4 mt-3 flex items-center gap-2 pt-3">{footer}</div>}
      </motion.div>
    </motion.div>
  )
}

export function MemberEditor() {
  const id = useStore((s) => s.editingMemberId)
  const member = useStore((s) => s.members.find((m) => m.id === s.editingMemberId))
  const update = useStore((s) => s.updateMember)
  const remove = useStore((s) => s.removeMember)
  const close = useStore((s) => s.setEditingMember)
  const trip = useStore((s) => s.trip)
  const [custom, setCustom] = useState('')

  const pool = member
    ? [...TAG_POOL, ...member.interests.filter((t) => !TAG_POOL.includes(t))]
    : TAG_POOL

  if (!id || !member) return null

  const addDate = () => {
    const last = member.freeDates[member.freeDates.length - 1]
    const base = last ? new Date(last.date + 'T00:00:00') : new Date(trip.startDate + 'T00:00:00')
    if (last) base.setDate(base.getDate() + 1)
    const date = toISODate(base)
    const next: FreeDate = { id: `${date}-${Math.random().toString(36).slice(2, 6)}`, date }
    update(member.id, { freeDates: [...member.freeDates, next] })
  }
  const patchDate = (dateId: string, patch: Partial<FreeDate>) =>
    update(member.id, { freeDates: member.freeDates.map((d) => (d.id === dateId ? { ...d, ...patch } : d)) })

  return (
    <Shell
      title="Character Sheet"
      subtitle="Every adventurer shapes the route."
      onClose={() => close(null)}
      footer={
        <>
          <button type="button" onClick={() => remove(member.id)}
            className="flex items-center gap-1.5 rounded-full border border-[#9c4a3a]/40 px-3 py-[6px] font-body text-[14px] font-semibold text-[#8a3a2c] transition hover:bg-[#9c4a3a]/10">
            <IconTrash className="h-4 w-4" /> Remove
          </button>
          <span className="flex-1" />
          <button type="button" onClick={() => close(null)} className="btn-gold px-6 py-[7px] font-body text-[15px]">Done</button>
        </>
      }
    >
      <div className="space-y-4 pb-1">
        <div className="flex items-end gap-3">
          <Avatar member={member} size={62} />
          <div className="flex-1">
            <Field label="Name">
              <input className={inputClass} value={member.name}
                onChange={(e) => update(member.id, { name: e.target.value })} />
            </Field>
          </div>
          <div className="w-[104px]">
            <Field label="Age">
              <input type="number" min={1} max={120} className={inputClass} value={member.age}
                onChange={(e) => update(member.id, { age: Math.max(1, Math.min(120, Number(e.target.value) || 0)) })} />
            </Field>
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <Field label="Diet">
            <Toggle value={member.vegan} left="Non-vegan" right="Vegan"
              onChange={(v) => update(member.id, { vegan: v })} />
          </Field>
          <Field label="Accessibility needs">
            <Toggle value={member.disability} left="No" right="Yes"
              onChange={(v) => update(member.id, { disability: v })} />
          </Field>
        </div>

        <Field label="Interests" hint="Drives which places the Orchestrator scouts.">
          <TagPicker selected={member.interests} pool={pool}
            onToggle={(t) => update(member.id, {
              interests: member.interests.includes(t)
                ? member.interests.filter((x) => x !== t)
                : [...member.interests, t],
            })} />
          <div className="mt-2 flex gap-2">
            <input
              className={inputClass}
              placeholder="Add your own interest…"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && custom.trim()) {
                  e.preventDefault()
                  const t = custom.trim().toLowerCase()
                  if (!member.interests.includes(t)) update(member.id, { interests: [...member.interests, t] })
                  setCustom('')
                }
              }}
            />
            <button type="button"
              onClick={() => {
                const t = custom.trim().toLowerCase()
                if (!t) return
                if (!member.interests.includes(t)) update(member.id, { interests: [...member.interests, t] })
                setCustom('')
              }}
              className="btn-gold shrink-0 px-4 font-body text-[14px]">Add</button>
          </div>
        </Field>

        <div className="flex flex-wrap gap-6">
          <Field label="Max adventure length" hint="The longest trip you will commit to.">
            <Stepper value={member.maxTripDays} min={1} max={30}
              onChange={(v) => update(member.id, { maxTripDays: v })}
              suffix={member.maxTripDays === 1 ? 'day' : 'days'} />
          </Field>
          <Field label="Personal budget">
            <Stepper value={member.budgetRM} min={0} max={20000} step={50}
              onChange={(v) => update(member.id, { budgetRM: v })} suffix="RM" />
          </Field>
        </div>

        <Field label="Places you want to reach" hint="Optional — the route stretches far enough to include them.">
          <TagPicker
            selected={member.preferredRegions}
            pool={REGION_IDS}
            label={(r) => r}
            onToggle={(r) => update(member.id, {
              preferredRegions: member.preferredRegions.includes(r)
                ? member.preferredRegions.filter((x) => x !== r)
                : [...member.preferredRegions, r],
            })}
          />
        </Field>

        <Field label={`Free days (${member.freeDates.length})`} hint="Whole days only — a working half-day is not a free day.">
          <div className="space-y-1.5">
            {member.freeDates.map((d) => (
              <div key={d.id} className="flex items-center gap-2">
                <input type="date" className={`${inputClass} flex-1`} value={d.date}
                  onChange={(e) => patchDate(d.id, { date: e.target.value })} />
                <button type="button"
                  onClick={() => update(member.id, { freeDates: member.freeDates.filter((x) => x.id !== d.id) })}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink-600 transition hover:bg-ink-900/10">
                  <IconX className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addDate}
              className="flex items-center gap-1.5 rounded-full border border-[#8a6a44]/45 px-3 py-[5px] font-body text-[14px] text-ink-800 transition hover:bg-ink-900/10">
              <IconPlus className="h-3.5 w-3.5" /> Add free date
            </button>
          </div>
        </Field>
      </div>
    </Shell>
  )
}

export function TripEditor() {
  const open = useStore((s) => s.editingTrip)
  const trip = useStore((s) => s.trip)
  const members = useStore((s) => s.members)
  const close = useStore((s) => s.setEditingTrip)
  const editMember = useStore((s) => s.setEditingMember)

  if (!open) return null

  const { limits } = trip
  const capped = limits.capNames.length > 0
  const names = limits.capNames.length > 2
    ? `${limits.capNames.slice(0, 2).join(', ')} and ${limits.capNames.length - 2} more`
    : limits.capNames.join(' and ')

  return (
    <Shell
      title="Trip Details"
      subtitle="Worked out from the party — nothing here is set by hand."
      width={470}
      onClose={() => close(false)}
      footer={<><span className="flex-1" /><button type="button" onClick={() => close(false)} className="btn-gold px-6 py-[7px] font-body text-[15px]">Close</button></>}
    >
      <div className="space-y-3 pb-1">
        <p className="font-body text-[14px] leading-snug text-ink-700">
          Everyone fills in their own sheet; the orchestrator turns those sheets into
          the shape of the trip. Change a person and these numbers follow.
        </p>

        <Derived label="Dates" value={`${trip.startDate} – ${trip.endDate}`}
          from={`the longest unbroken run all ${members.length} are free (${limits.windowDays} ${limits.windowDays === 1 ? 'day' : 'days'})`} />
        <Derived
          label="Trip length"
          value={`${trip.maxDurationDays} ${trip.maxDurationDays === 1 ? 'day' : 'days'}`}
          from={capped
            ? `${names} will not travel longer than ${limits.capDays} days, so the ${limits.windowDays}-day window is cut short`
            : 'the shared free window — nobody’s personal limit is tighter'}
        />
        <Derived label="Starting from" value={startById(trip.startLocationId).name}
          from="the hub nearest the party" />
        <Derived label="Travel radius" value={`${trip.maxTravelKm} km`}
          from={limits.radiusFrom === 'regions'
            ? `far enough to reach ${limits.requestedRegions.join(', ')}`
            : `nobody named a place, so ${trip.maxDurationDays} ${trip.maxDurationDays === 1 ? 'day' : 'days'} of reach`} />
        <Derived label="Budget" value={`RM ${trip.budgetRM.toLocaleString('en-US')}`}
          from={`the sum of ${members.length} personal budgets`} />

        <div className="hairline pt-3">
          <p className="mb-2 font-body text-[13px] uppercase tracking-[.08em] text-ink-600">
            Adjust a traveller instead
          </p>
          <div className="flex flex-wrap gap-1.5">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { close(false); editMember(m.id) }}
                className="rounded-full border border-[#8a6a44]/45 px-3 py-[4px] font-body text-[13.5px] text-ink-800 transition hover:bg-ink-900/10"
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  )
}

/** One derived figure, shown with the reason it came out that way. */
function Derived({ label, value, from }: { label: string; value: string; from: string }) {
  return (
    <div className="rounded-lg border border-[#7a5c34]/25 bg-[#00000008] px-3 py-2">
      <div className="flex items-baseline gap-2">
        <span className="font-body text-[13px] uppercase tracking-[.06em] text-ink-600">{label}</span>
        <span className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(90,66,35,.22), transparent)' }} />
        <span className="font-body text-[15px] font-semibold text-ink-900">{value}</span>
      </div>
      <p className="mt-0.5 font-body text-[12.5px] italic leading-snug text-ink-500">from {from}</p>
    </div>
  )
}

export function Modals() {
  const editingMemberId = useStore((s) => s.editingMemberId)
  const editingTrip = useStore((s) => s.editingTrip)
  return (
    <AnimatePresence>
      {editingMemberId && <MemberEditor key="member" />}
      {editingTrip && <TripEditor key="trip" />}
    </AnimatePresence>
  )
}
