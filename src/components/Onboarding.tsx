import { motion } from 'framer-motion'
import { PARTY_PRESETS, presetById } from '../data/seed'
import { prettyTag } from '../data/tags'
import { startById } from '../data/startLocations'
import { useStore } from '../store/useStore'
import { Avatar } from './common'
import { Logo } from './Logo'
import { tripSpanDays } from './TripPanel'
import { IconCalendar, IconChevron, IconClock, IconCoin, IconCompassSmall, IconLeaf, IconPlus, IconDrumstick, IconRadius, IconUsers, IconWheelchair } from './icons'

const fmt = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export function Onboarding() {
  const members = useStore((s) => s.members)
  const trip = useStore((s) => s.trip)
  const presetId = useStore((s) => s.presetId)
  const applyPreset = useStore((s) => s.applyPreset)
  const addMember = useStore((s) => s.addMember)
  const setEditingMember = useStore((s) => s.setEditingMember)
  const setEditingTrip = useStore((s) => s.setEditingTrip)
  const start = useStore((s) => s.start)

  return (
    <div className="absolute inset-0 z-[120] overflow-y-auto">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(120% 90% at 50% 30%, rgba(5,20,26,.62), rgba(3,11,15,.93) 75%)', backdropFilter: 'blur(3px)' }}
      />

      <div className="relative mx-auto flex min-h-full w-full max-w-[1080px] flex-col items-center px-6 py-9">
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Logo size="lg" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.6 }}
          className="mt-4 max-w-[620px] text-center font-body text-[16px] leading-relaxed text-parch-100/80"
        >
          Gather your party, set the terms of the journey, and the Orchestrator will scout
          the peninsula for the route that fits everyone.
        </motion.p>

        {/* minmax(0,…) so a long chip or name cannot push a column past its
            share of the row — grid tracks default to min-content otherwise. */}
        <div className="mt-7 grid w-full gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <motion.section
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.5 }}
            className="parchment min-w-0 px-5 pb-5 pt-4"
          >
            <div className="flex items-center gap-2.5">
              <IconUsers className="h-[21px] w-[21px] text-ink-800" />
              <h2 className="flex-1 font-body text-[22px] font-bold text-ink-900 title-emboss">The Party</h2>
              <span className="font-body text-[14px] text-ink-600">{members.length}/6</span>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {PARTY_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p.id)}
                  title={p.blurb}
                  className={`rounded-full border px-2.5 py-[3px] font-body text-[13px] transition ${
                    presetId === p.id
                      ? 'border-[#a97f2c] bg-gradient-to-b from-[#f2d89b] to-[#dcb055] text-[#3a2708] shadow-[0_1px_3px_rgba(0,0,0,.25)]'
                      : 'border-[#7a5c34]/30 bg-[#7b7771]/15 text-ink-600 hover:bg-[#7b7771]/25'
                  }`}
                >
                  {p.label}
                </button>
              ))}
              {!presetId && (
                <span className="font-body text-[12.5px] italic text-ink-500">Edited by hand</span>
              )}
            </div>
            {presetId && (
              <p className="mt-1.5 font-body text-[12.5px] italic leading-snug text-ink-500">
                {presetById(presetId).blurb}
              </p>
            )}

            <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setEditingMember(m.id)}
                  className="group flex items-start gap-3 rounded-lg border border-[#7a5c34]/25 bg-[#00000008] px-2.5 py-2 text-left transition hover:border-[#a97f2c]/60 hover:bg-[#00000012]"
                >
                  <Avatar member={m} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-body text-[16px] font-semibold text-ink-900">{m.name}</span>
                    <span className="flex items-center gap-1.5 font-body text-[13px] text-ink-600">
                      {m.age} <span className="opacity-50">·</span> {m.vegan ? 'Vegan' : 'Non-vegan'}
                      {m.vegan
                        ? <IconLeaf className="h-[12px] w-[12px] text-[#4a7a35]" />
                        : <IconDrumstick className="h-[12px] w-[12px] text-[#9c5330]" />}
                      {m.disability && <IconWheelchair className="h-[12px] w-[12px] text-[#3f5f7a]" />}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      {m.interests.slice(0, 3).map((t) => (
                        <span key={t} className="chip-parch px-1.5 py-[1px] font-body text-[11px]">{prettyTag(t)}</span>
                      ))}
                    </span>
                  </span>
                  <IconChevron className="mt-2 h-4 w-4 shrink-0 text-ink-500 transition group-hover:translate-x-0.5" />
                </button>
              ))}

              {members.length < 6 && (
                <button
                  type="button"
                  onClick={() => addMember()}
                  className="flex min-h-[74px] items-center justify-center gap-2 rounded-lg border border-dashed border-[#7a5c34]/45 font-body text-[15px] text-ink-700 transition hover:border-[#a97f2c] hover:bg-[#00000010]"
                >
                  <IconPlus className="h-4 w-4" strokeWidth={2.2} /> Add member
                </button>
              )}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
            className="parchment flex flex-col px-5 pb-5 pt-4"
          >
            <h2 className="font-body text-[22px] font-bold text-ink-900 title-emboss">Trip Details</h2>
            <p className="mt-0.5 font-body text-[13px] italic leading-snug text-ink-600">
              Worked out from the party — fill in the people, not the plan.
            </p>

            <div className="mt-3 space-y-3">
              <InfoRow icon={<IconCalendar className="h-[19px] w-[19px]" />} label="Dates"
                value={`${fmt(trip.startDate)} – ${fmt(trip.endDate)}`}
                note={`${tripSpanDays(trip.startDate, trip.endDate)} days`} />
              <InfoRow icon={<IconCompassSmall className="h-[19px] w-[19px]" />} label="Starting from"
                value={startById(trip.startLocationId).name} />
              <InfoRow icon={<IconRadius className="h-[19px] w-[19px]" />} label="Max travel"
                value={`${trip.maxTravelKm} km from base`}
                note={trip.limits.radiusFrom === 'regions' ? 'to reach requested places' : undefined} />
              <InfoRow icon={<IconClock className="h-[19px] w-[19px]" />} label="Trip length"
                value={`${trip.maxDurationDays} ${trip.maxDurationDays === 1 ? 'day' : 'days'}`}
                note={trip.limits.cappedByMember
                  ? `the party's ${trip.limits.capDays}-day appetite`
                  : 'the shared free window'} />
              <InfoRow icon={<IconCoin className="h-[19px] w-[19px]" />} label="Budget (total)"
                value={`RM ${trip.budgetRM.toLocaleString('en-US')}`} />
            </div>

            <button type="button" onClick={() => setEditingTrip(true)}
              className="mt-3 w-full rounded-full border border-[#8a6a44]/50 py-[7px] font-body text-[14.5px] font-semibold text-ink-800 transition hover:bg-ink-900/[.08]">
              How this was worked out
            </button>

            <span className="flex-1" />

            <button type="button" onClick={start}
              className="btn-gold mt-4 w-full py-[10px] font-body text-[17px]">
              Begin the quest
            </button>
          </motion.section>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value, note }: {
  icon: React.ReactNode; label: string; value: string; note?: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-[3px] text-ink-800">{icon}</span>
      <div>
        <div className="font-body text-[15px] font-semibold leading-tight text-ink-900">{label}</div>
        <div className="font-body text-[14.5px] text-ink-700">
          {value}{note && <span className="ml-1.5 text-ink-500">({note})</span>}
        </div>
      </div>
    </div>
  )
}
