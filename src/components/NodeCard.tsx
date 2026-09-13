import { AnimatePresence, motion } from 'framer-motion'
import { poiById } from '../data/pois'
import { prettyTag } from '../data/tags'
import { useStore } from '../store/useStore'
import { CATEGORY_COLOR, CATEGORY_LABEL, PoiImage } from './common'
import {
  IconCheck, IconClock, IconCloud, IconCoin, IconMapPin, IconShare, IconTrash, IconX,
} from './icons'
import type { Poi } from '../types'

/** The detail sheet, anchored to the node it belongs to. */
export function NodeCard({ poi, flipX, flipY }: { poi: Poi; flipX: boolean; flipY: boolean }) {
  const scored = useStore((s) => s.scored)
  const itinerary = useStore((s) => s.itinerary)
  const addToItinerary = useStore((s) => s.addToItinerary)
  const removeFromItinerary = useStore((s) => s.removeFromItinerary)
  const triggerForceMajeure = useStore((s) => s.triggerForceMajeure)
  const setPopup = useStore((s) => s.setPopup)
  const fm = useStore((s) => s.forceMajeure)
  const useAlternative = useStore((s) => s.useAlternative)
  const dismissFm = useStore((s) => s.dismissForceMajeure)
  const undoFm = useStore((s) => s.undoForceMajeure)

  const entry = scored.find((s) => s.poi.id === poi.id)
  const inTrip = itinerary.some((i) => i.poiId === poi.id)
  const fmHere = fm && (fm.closedPoiId === poi.id || fm.alternativePoiId === poi.id) ? fm : null
  const alt = fmHere?.alternativePoiId ? poiById(fmHere.alternativePoiId) : null
  const closedName = fmHere ? poiById(fmHere.closedPoiId)?.name ?? poi.name : poi.name

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 340, damping: 26 }}
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      className="relative w-[302px]"
      style={{ transformOrigin: `${flipY ? 'bottom' : 'top'} ${flipX ? 'right' : 'left'}` }}
    >
      <div className="parchment overflow-hidden">
      <div className="relative">
        <PoiImage id={poi.id} category={poi.category} alt={poi.name} className="h-[96px] w-full" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10"
          style={{ background: 'linear-gradient(180deg, rgba(231,215,179,0), rgba(231,215,179,.95))' }} />
        <div className="absolute right-2.5 top-2.5 flex gap-1.5">
          {inTrip && !fmHere && (
            <IconBtn title="Report closed (Forces Majeure)" onClick={() => triggerForceMajeure(poi.id)}>
              <IconCloud className="h-[17px] w-[17px]" />
            </IconBtn>
          )}
          <IconBtn title="Share this stop"><IconShare className="h-[17px] w-[17px]" /></IconBtn>
          <IconBtn title="Close" onClick={() => setPopup(null)}><IconX className="h-[15px] w-[15px]" /></IconBtn>
        </div>
      </div>

      <div className="overflow-y-auto px-3.5 pt-1" style={{ maxHeight: fmHere ? 'min(276px, 34vh)' : 'min(212px, 26vh)' }}>
        <h3 className="font-body text-[19px] font-bold leading-tight text-ink-900 title-emboss">{poi.name}</h3>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-body text-[14px] text-ink-700">
          <span className="flex items-center gap-1.5 rounded-full bg-[#c7d6b2]/70 px-2.5 py-[2px] text-[13.5px] text-[#39501f]">
            <span className="h-[9px] w-[9px] rounded-full" style={{ background: CATEGORY_COLOR[poi.category] }} />
            {CATEGORY_LABEL[poi.category]}
          </span>
          <span className="flex items-center gap-1.5"><IconCoin className="h-[17px] w-[17px] text-[#9c7420]" />RM {poi.costRM}</span>
          <span className="flex items-center gap-1.5"><IconClock className="h-[17px] w-[17px] text-ink-600" />{poi.durationHours}h</span>
        </div>

        <div className="mt-1.5 flex flex-wrap gap-1">
          {poi.tags.slice(0, 4).map((t) => (
            <span key={t} className="chip-parch px-2 py-[1px] font-body text-[11.5px]">{prettyTag(t)}</span>
          ))}
        </div>

        <p className="mt-2 font-body text-[14.5px] leading-snug text-ink-700">{poi.description}</p>

        <AnimatePresence initial={false} mode="wait">
          {fmHere ? (
            <motion.div key="fm"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <div className="mt-2.5 rounded-lg border border-[#9c4a3a]/35 bg-[#9c4a3a]/[.07] p-2.5">
                <div className="flex items-center gap-2">
                  <IconCloud className="h-[19px] w-[19px] text-ink-800" strokeWidth={1.9} />
                  <h4 className="flex-1 font-body text-[16px] font-bold text-ink-900">Forces Majeure</h4>
                  <button type="button" onClick={dismissFm} title="Dismiss"
                    className="grid h-5 w-5 place-items-center rounded-full text-ink-600 transition hover:bg-ink-900/10">
                    <IconX className="h-[13px] w-[13px]" />
                  </button>
                </div>
                <p className="mt-1 font-body text-[14px] text-ink-800">
                  <span className="font-semibold">{closedName}</span> is closed (for now).
                </p>

                {fmHere.resolving ? (
                  <p className="mt-1 font-body text-[14px] text-ink-600">
                    Finding alternative
                    <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.2, repeat: Infinity }}>…</motion.span>
                  </p>
                ) : alt ? (
                  <>
                    <p className="mt-1 font-body text-[13.5px] italic text-ink-600">
                      {fmHere.applied ? 'Swapped into the route automatically:' : 'Nearest match with the same vibe:'}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2.5 rounded-md border border-[#8a6a4a]/30 bg-[#00000006] p-1.5">
                      <PoiImage id={alt.id} category={alt.category} alt={alt.name}
                        className="h-[52px] w-[52px] shrink-0 rounded-md ring-1 ring-[#6b4f2c]/30" />
                      <div className="min-w-0">
                        <div className="truncate font-body text-[15px] font-semibold text-ink-900">{alt.name}</div>
                        <div className="font-body text-[13px] text-ink-600">
                          {CATEGORY_LABEL[alt.category]} · RM {alt.costRM}
                        </div>
                        <div className="flex items-center gap-1.5 font-body text-[13px] text-ink-600">
                          <IconMapPin className="h-[12px] w-[12px] text-[#9c7420]" />{fmHere.distanceKm} km away
                        </div>
                      </div>
                    </div>
                    {!fmHere.applied && (
                      <button type="button" onClick={useAlternative}
                        className="btn-gold mt-2 w-full py-[6px] font-body text-[14.5px]">
                        Use Alternative
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <p className="mt-1 font-body text-[14px] text-ink-600">
                      No comparable alternative fits the party’s budget right now.
                    </p>
                    <button type="button" onClick={dismissFm} className="btn-gold mt-2 w-full py-[6px] font-body text-[14.5px]">
                      Keep the original plan
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="fit"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <div className="mt-2.5">
                <h4 className="font-body text-[15px] font-bold text-ink-900">Why it’s a good fit:</h4>
                <ul className="mt-1 space-y-[3px]">
                  {(entry?.reasons ?? []).map((r) => (
                    <li key={r.label} className="flex items-start gap-1.5 font-body text-[14px] leading-snug">
                      {r.ok
                        ? <IconCheck className="mt-[3px] h-[13px] w-[13px] shrink-0 text-[#4e7a2e]" strokeWidth={2.6} />
                        : <IconX className="mt-[3px] h-[13px] w-[13px] shrink-0 text-[#9c4a3a]" strokeWidth={2.6} />}
                      <span className={r.ok ? 'text-ink-700' : 'text-[#8a4436]'}>{r.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {fmHere?.applied && (
        <div className="flex gap-2 px-3.5 pb-3 pt-2">
          <button type="button" onClick={undoFm}
            className="flex-1 rounded-full border border-[#8a6a4a]/50 py-[7px] font-body text-[14px] font-semibold text-ink-700 transition hover:bg-ink-900/[.07]">
            Undo
          </button>
          <button type="button" onClick={dismissFm}
            className="btn-gold flex-1 py-[7px] font-body text-[14px]">Keep it</button>
        </div>
      )}

      {!fmHere && (
        <div className="px-3.5 pb-3 pt-2">
          {inTrip ? (
            <button
              type="button"
              onClick={() => removeFromItinerary(poi.id)}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-[#8a6a4a]/50 bg-[#00000008] py-[7px] font-body text-[14.5px] font-semibold text-ink-700 transition hover:bg-ink-900/[.07]"
            >
              <IconTrash className="h-4 w-4" /> Remove from itinerary
            </button>
          ) : (
            <button
              type="button"
              onClick={() => addToItinerary(poi.id)}
              disabled={entry?.blocked}
              className="btn-gold w-full py-[7px] font-body text-[15px] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {entry?.blocked ? 'Not suitable for this party' : 'Add to itinerary'}
            </button>
          )}
        </div>
      )}
      </div>

      {/* tether: the card unfurls out of its node */}
      <svg
        className="pointer-events-none absolute h-14 w-14"
        viewBox="0 0 56 56"
        aria-hidden
        style={{
          [flipX ? 'right' : 'left']: -48,
          [flipY ? 'bottom' : 'top']: -42,
          transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
        }}
      >
        <path d="M8 6 L52 46" stroke="rgba(10,17,20,.7)" strokeWidth="5" strokeLinecap="round" />
        <path d="M8 6 L52 46" stroke="#f6dda6" strokeWidth="2.4" strokeDasharray="5 5" strokeLinecap="round" />
        <circle cx="52" cy="46" r="3.4" fill="#f6dda6" stroke="rgba(10,17,20,.7)" strokeWidth="1.2" />
      </svg>
    </motion.div>
  )
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick?: () => void; title: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="grid h-[30px] w-[30px] place-items-center rounded-full border border-[#3b2a16]/45 bg-[#e9dcc0]/85 text-ink-800 shadow-md backdrop-blur-sm transition hover:bg-[#f4e9d1]"
    >
      {children}
    </button>
  )
}
