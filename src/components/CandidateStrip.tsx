import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { poiById } from '../data/pois'
import { prettyTag } from '../data/tags'
import { useStore } from '../store/useStore'
import type { MarkerKind, Poi } from '../types'
import { PoiImage } from './common'
import { MarkerGlyph } from './MapMarker'
import { IconClock, IconCoin, IconSparkle } from './icons'

function CandidateCard({ poi, kind, index }: { poi: Poi; kind: MarkerKind; index: number }) {
  const selectPoi = useStore((s) => s.selectPoi)
  const setPopup = useStore((s) => s.setPopup)
  const selected = useStore((s) => s.selectedPoiId) === poi.id
  const dim = kind === 'unsuitable'

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 24 }}
      onClick={() => { selectPoi(poi.id); setPopup(poi.id) }}
      className={`group relative w-[158px] shrink-0 rounded-lg p-2 text-left transition ${
        selected ? 'ring-1 ring-gold-400/70' : ''
      }`}
      style={{
        transform: selected ? 'translateY(-3px)' : undefined,
        background: 'linear-gradient(160deg, rgba(38,33,26,.9), rgba(16,14,11,.92))',
        boxShadow: selected
          ? '0 0 0 1px rgba(232,193,114,.75), 0 8px 18px -8px rgba(0,0,0,.9)'
          : '0 0 0 1px rgba(212,165,80,.22), 0 6px 14px -8px rgba(0,0,0,.8)',
      }}
    >
      <div className="relative">
        <PoiImage
          id={poi.id} category={poi.category} alt={poi.name}
          className="h-[86px] w-full rounded-[7px] ring-1 ring-black/40"
          style={dim ? { filter: 'grayscale(1) brightness(.72)' } : undefined}
        />
        <div className="absolute -left-1 -top-1 scale-[.72] origin-top-left">
          <MarkerGlyph kind={kind} size={34} />
        </div>
        {(kind === 'food' || kind === 'camp' || kind === 'confirmed') && (
          <div className="absolute -bottom-1.5 -right-1.5 scale-[.66] origin-bottom-right">
            <MarkerGlyph kind={kind} size={32} />
          </div>
        )}
      </div>

      <div className="mt-2 truncate font-body text-[14.5px] font-semibold text-parch-50 dark-emboss">{poi.name}</div>

      <div className="mt-1.5 flex flex-wrap gap-1">
        {poi.tags.slice(0, 2).map((t) => (
          <span key={t} className="chip-night px-2 py-[1px] font-body text-[11.5px]">{prettyTag(t)}</span>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between font-body text-[12.5px] text-parch-200/90">
        <span className="flex items-center gap-1"><IconCoin className="h-[14px] w-[14px] text-gold-400" />RM {poi.costRM}</span>
        <span className="flex items-center gap-1"><IconClock className="h-[14px] w-[14px] text-parch-300/80" />{poi.durationHours}h</span>
      </div>
    </motion.button>
  )
}

export function CandidateStrip() {
  const candidates = useStore((s) => s.candidates)
  const passed = useStore((s) => s.passed)
  const reveal = useStore((s) => s.reveal)
  const collapsed = useStore((s) => !!s.collapsed.scouting)
  const toggle = useStore((s) => s.toggleCollapsed)

  const scroller = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: false, end: false })

  // Only places the party could still take: the gold and grey question marks.
  // Anything blocked by a hard rule is a grey '!' on the map and is deliberately
  // absent here — these cards are extra options, not a list of dead ends.
  const items: { poi: Poi; kind: MarkerKind }[] = useMemo(() => [
    ...candidates.map((id) => ({
      poi: poiById(id)!,
      kind: (reveal[id] === 'scouting' ? 'scouting' : 'found') as MarkerKind,
    })),
    ...passed.map((id) => ({ poi: poiById(id)!, kind: 'scouting' as MarkerKind })),
  ].filter((i) => i.poi && reveal[i.poi.id] && reveal[i.poi.id] !== 'hidden'),
  [candidates, passed, reveal])

  const syncEdges = useCallback(() => {
    const el = scroller.current
    if (!el) return
    setEdges({
      start: el.scrollLeft > 4,
      end: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    })
  }, [])

  useEffect(() => {
    syncEdges()
    const el = scroller.current
    if (!el) return
    const ro = new ResizeObserver(syncEdges)
    ro.observe(el)
    return () => ro.disconnect()
  }, [items.length, collapsed, syncEdges])

  const nudge = (dir: -1 | 1) => {
    scroller.current?.scrollBy({ left: dir * 360, behavior: 'smooth' })
  }

  return (
    <div className="nightcard gold-corners relative overflow-hidden">
      <div className="flex items-center gap-2 px-3 pb-1 pt-2">
        <IconSparkle className="h-3.5 w-3.5 shrink-0 text-gold-300" />
        <h4 className="shrink-0 font-body text-[15px] font-semibold text-parch-50 dark-emboss">
          Scouting Reports
        </h4>
        <span className="shrink-0 font-body text-[12px] text-parch-200/60">
          {items.length} {items.length === 1 ? 'place' : 'places'}
        </span>
        <span className="flex-1" />

        {!collapsed && (
          <>
            <RailButton dir={-1} disabled={!edges.start} onClick={() => nudge(-1)} />
            <RailButton dir={1} disabled={!edges.end} onClick={() => nudge(1)} />
          </>
        )}
        <button
          type="button"
          onClick={() => toggle('scouting')}
          title={collapsed ? 'Show reports' : 'Hide reports'}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-parch-200/80 transition hover:bg-white/10"
        >
          <motion.svg
            viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor"
            strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"
            animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.25 }}
          >
            <path d="M6 9l6 6 6-6" />
          </motion.svg>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="rail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="relative">
              <div
                ref={scroller}
                onScroll={syncEdges}
                className="flex gap-2.5 overflow-x-auto px-3 pb-3 pt-1"
              >
                {items.map((it, i) => (
                  <CandidateCard key={it.poi.id} poi={it.poi} kind={it.kind} index={i} />
                ))}
                {!items.length && (
                  <div className="flex h-[186px] w-full items-center justify-center px-6 font-body text-[14px] italic text-parch-200/60">
                    Scouting parties will report their findings here.
                  </div>
                )}
              </div>

              {/* fades that tell you the rail keeps going */}
              <span
                className="pointer-events-none absolute inset-y-0 left-0 w-10 transition-opacity duration-200"
                style={{
                  opacity: edges.start ? 1 : 0,
                  background: 'linear-gradient(90deg, rgba(10,9,7,.96), rgba(10,9,7,0))',
                }}
              />
              <span
                className="pointer-events-none absolute inset-y-0 right-0 w-10 transition-opacity duration-200"
                style={{
                  opacity: edges.end ? 1 : 0,
                  background: 'linear-gradient(270deg, rgba(10,9,7,.96), rgba(10,9,7,0))',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function RailButton({ dir, disabled, onClick }: {
  dir: -1 | 1; disabled: boolean; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={dir < 0 ? 'Scroll left' : 'Scroll right'}
      className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#e8c172]/35 text-parch-200/85 transition hover:bg-white/10 disabled:opacity-25"
    >
      <svg viewBox="0 0 24 24" className="h-[13px] w-[13px]" fill="none" stroke="currentColor"
        strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: dir < 0 ? 'rotate(180deg)' : undefined }}>
        <path d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}
