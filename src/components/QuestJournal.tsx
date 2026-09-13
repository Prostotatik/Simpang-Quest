import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { poiById } from '../data/pois'
import { stopHours } from '../engine/route'
import { useStore } from '../store/useStore'
import { CATEGORY_COLOR, CATEGORY_LABEL, StatusPill } from './common'
import { ScrollPanel } from './ScrollPanel'
import { IconBook, IconGoblet, IconMapPin, IconTent } from './icons'
import type { Category, ItineraryStop, Poi } from '../types'

const CategoryBadge = ({ category }: { category: Category }) => (
  <span
    className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full text-[#f3e6c4]"
    style={{
      background: `radial-gradient(circle at 34% 28%, ${CATEGORY_COLOR[category]}, #16120c 130%)`,
      boxShadow: '0 0 0 1.5px rgba(70,48,20,.55), inset 0 1px 2px rgba(255,240,200,.25)',
    }}
  >
    {category === 'food' ? <IconGoblet className="h-4 w-4" />
      : category === 'stay' ? <IconTent className="h-4 w-4" />
      : <IconMapPin className="h-4 w-4" />}
  </span>
)

/** A day's banner: ordinal, stop count, and what the day costs in time and gold. */
function DayHeading({ day, cost, hours, stops }: {
  day: number; cost: number; hours: number; stops: number
}) {
  return (
    <div className="flex items-center gap-2 pb-[3px] pt-1">
      <span
        className="grid h-[19px] min-w-[19px] shrink-0 place-items-center rounded-full px-1 font-body text-[11.5px] font-bold text-[#3a2708]"
        style={{
          background: 'linear-gradient(180deg,#f6e2ac,#d3a243)',
          boxShadow: '0 0 0 1px rgba(80,55,12,.55), 0 1px 2px rgba(0,0,0,.35)',
        }}
      >
        {day}
      </span>
      <span className="shrink-0 font-body text-[13.5px] font-bold uppercase tracking-[.1em] text-ink-800">
        Day {day}
      </span>
      <span className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(90,66,35,.35), transparent)' }} />
      <span className="shrink-0 font-body text-[11.5px] text-ink-600">
        {stops} {stops === 1 ? 'stop' : 'stops'} · {hours}h · RM {cost}
      </span>
    </div>
  )
}

export function QuestJournal() {
  // The list grows into whatever the column has left after the legend, rather
  // than a hard-coded viewport fraction that could overlap it.
  const shellRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [bodyMaxHeight, setBodyMaxHeight] = useState<number>(320)
  useEffect(() => {
    const shell = shellRef.current
    if (!shell) return
    const measure = () => {
      const list = listRef.current
      const panel = list?.closest('section')
      if (!list || !panel) return
      // Measure the panel's chrome — rods, heading, rule, padding — instead of
      // guessing it, so the list ends exactly where the column does.
      const chrome = panel.getBoundingClientRect().height - list.getBoundingClientRect().height
      setBodyMaxHeight(Math.max(140, shell.clientHeight - chrome))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(shell)
    return () => ro.disconnect()
  }, [])

  const itinerary = useStore((s) => s.itinerary)
  const cycleStatus = useStore((s) => s.cycleStatus)
  const setPopup = useStore((s) => s.setPopup)
  const selectedPoiId = useStore((s) => s.selectedPoiId)
  const done = itinerary.filter((i) => i.status === 'Completed').length

  // Group into days, carrying each day's running cost and hours for the banner.
  const days = useMemo(() => {
    const byDay = new Map<number, ItineraryStop[]>()
    itinerary.forEach((stop) => {
      const list = byDay.get(stop.day)
      if (list) list.push(stop)
      else byDay.set(stop.day, [stop])
    })
    return [...byDay.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([day, stops]) => {
        const pois = stops.map((s) => poiById(s.poiId)).filter((p): p is Poi => !!p)
        return {
          day,
          stops,
          cost: pois.reduce((sum, p) => sum + p.costRM, 0),
          // Beds contribute no hours: the night is not part of the day's plan.
          hours: Math.round(pois.reduce((sum, p) => sum + stopHours(p), 0) * 10) / 10,
        }
      })
  }, [itinerary])

  return (
    <div ref={shellRef} className="flex min-h-0 flex-1 flex-col">
    <ScrollPanel
      id="journal"
      title="Quest Journal"
      icon={<IconBook className="h-[20px] w-[20px] shrink-0 text-ink-800" />}
      meta={
        <span className="shrink-0 font-body text-[13px] text-ink-600">
          {done}/{itinerary.length} done
        </span>
      }
      bodyMaxHeight={bodyMaxHeight}
      bodyRef={listRef}
    >
      <div>
        <AnimatePresence initial={false}>
          {days.map(({ day, stops, cost, hours }) => (
            <motion.section
              key={day}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="relative mb-1.5 last:mb-0"
            >
              <DayHeading day={day} cost={cost} hours={hours} stops={stops.length} />

              {/* the day's stops hang off a single vertical thread */}
              <div className="relative pl-[13px]">
                <span
                  className="pointer-events-none absolute bottom-2 left-[5px] top-0 w-px"
                  style={{ background: 'linear-gradient(180deg, rgba(90,66,35,.45), rgba(90,66,35,.08))' }}
                />
                {stops.map((stop) => {
                  const poi = poiById(stop.poiId)
                  if (!poi) return null
                  return (
                    <div
                      key={stop.poiId}
                      className={`relative flex items-center gap-2.5 rounded-md px-1 py-[6px] transition ${
                        selectedPoiId === stop.poiId ? 'bg-ink-900/[.08]' : 'hover:bg-ink-900/[.05]'
                      }`}
                    >
                      <span
                        className="pointer-events-none absolute -left-[11px] top-1/2 h-[5px] w-[5px] -translate-y-1/2 rounded-full"
                        style={{ background: 'radial-gradient(circle at 32% 28%,#f6e2ac,#a97f2c)' }}
                      />
                      <button type="button" onClick={() => setPopup(stop.poiId)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                        <CategoryBadge category={poi.category} />
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate font-body text-[15px] font-semibold leading-tight text-ink-900 ${stop.closed ? 'line-through opacity-60' : ''}`}>
                            {poi.name}
                          </span>
                          <span className="block font-body text-[12.5px] text-ink-600">
                            {CATEGORY_LABEL[poi.category]} · RM {poi.costRM}
                          </span>
                        </span>
                      </button>
                      <StatusPill status={stop.status} onClick={() => cycleStatus(stop.poiId)} />
                    </div>
                  )
                })}
              </div>
            </motion.section>
          ))}
        </AnimatePresence>

        {!itinerary.length && (
          <p className="px-1 py-6 text-center font-body text-[14px] italic text-ink-600">
            No quests accepted yet. Let the Orchestrator scout the map.
          </p>
        )}
      </div>
    </ScrollPanel>
    </div>
  )
}
