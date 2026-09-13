import { startById } from '../data/startLocations'
import { inclusiveDays } from '../engine/deriveTrip'
import { useStore } from '../store/useStore'
import { ScrollPanel } from './ScrollPanel'
import {
  GoldCoin, IconCalendar, IconChevron, IconClock, IconCoin, IconCompassSmall, IconRadius, IconScroll,
} from './icons'

const fmt = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export const tripSpanDays = inclusiveDays

/**
 * Read-only by design: the trip's terms are derived from the party sheets in
 * `engine/deriveTrip.ts`, not typed in. PROTOTYPE: that derivation is a script
 * standing in for the agent.
 */
export function TripPanel() {
  const trip = useStore((s) => s.trip)
  const setEditingTrip = useStore((s) => s.setEditingTrip)
  const year = new Date(trip.endDate + 'T00:00:00').getFullYear()
  const start = startById(trip.startLocationId)
  const edit = () => setEditingTrip(true)

  return (
    <ScrollPanel
      id="trip"
      title="Trip Details"
      icon={<IconScroll className="h-[19px] w-[19px] shrink-0 text-ink-800" />}
      meta={<span className="shrink-0 font-body text-[13px] text-ink-600">{year}</span>}
      action={
        <button
          type="button"
          onClick={edit}
          title="How these were worked out"
          className="shrink-0 rounded-full border border-[#8a6a44]/45 px-2 py-[1px] font-body text-[12px] font-semibold text-ink-700 transition hover:bg-ink-900/10"
        >
          Why
        </button>
      }
    >
      <div className="space-y-[5px]">
        <Row icon={<IconCalendar className="h-[18px] w-[18px]" />} label="Dates" onClick={edit}>
          {fmt(trip.startDate)} – {fmt(trip.endDate)} · {tripSpanDays(trip.startDate, trip.endDate)}d
        </Row>
        <Row icon={<IconCompassSmall className="h-[18px] w-[18px]" />} label="From" onClick={edit}>
          {start.name}
        </Row>
        <Row icon={<IconRadius className="h-[18px] w-[18px]" />} label="Radius" onClick={edit}>
          {trip.maxTravelKm} km
        </Row>
        <Row icon={<IconClock className="h-[18px] w-[18px]" />} label="Limit" onClick={edit}>
          {trip.limits.capNames.length
            ? `${trip.limits.capDays}d — ${trip.limits.capNames[0]}${trip.limits.capNames.length > 1 ? ` +${trip.limits.capNames.length - 1}` : ''}`
            : `${trip.limits.windowDays}d free window`}
        </Row>
        <Row icon={<IconCoin className="h-[18px] w-[18px]" />} label="Budget" onClick={edit}>
          <span className="flex items-center justify-end gap-1.5">
            RM {trip.budgetRM.toLocaleString('en-US')}
            <GoldCoin size={14} />
          </span>
        </Row>
      </div>
    </ScrollPanel>
  )
}

function Row({ icon, label, children, onClick }: {
  icon: React.ReactNode; label: string; children: React.ReactNode; onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick}
      className="group flex w-full items-center gap-2 rounded-md px-1 py-[3px] text-left transition hover:bg-ink-900/[.06]">
      <span className="shrink-0 text-ink-800/90">{icon}</span>
      <span className="shrink-0 font-body text-[13px] uppercase tracking-[.06em] text-ink-600">{label}</span>
      <span className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(90,66,35,.22), transparent)' }} />
      <span className="min-w-0 whitespace-nowrap text-right font-body text-[14px] font-semibold text-ink-900">
        {children}
      </span>
      <IconChevron className="h-[13px] w-[13px] shrink-0 text-ink-500 opacity-0 transition group-hover:opacity-100" />
    </button>
  )
}
