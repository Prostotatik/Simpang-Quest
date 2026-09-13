import { AnimatePresence, motion } from 'framer-motion'
import { MODE_LABEL, MODE_PATH, type TravelMode } from '../engine/travel'
import { useStore } from '../store/useStore'
import { MarkerGlyph } from './MapMarker'

const Dash = ({ color, dash }: { color: string; dash: string }) => (
  <svg width="26" height="8" viewBox="0 0 32 8" className="shrink-0">
    <line x1="1" y1="4" x2="31" y2="4" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeDasharray={dash} />
  </svg>
)

const Disc = ({ ring, children }: { ring: string; children: React.ReactNode }) => (
  <span className="grid h-[22px] w-[22px] place-items-center rounded-full"
    style={{
      background: 'radial-gradient(circle at 34% 28%, #23303a, #080c10)',
      boxShadow: `0 0 0 1.6px ${ring}`,
    }}>
    {children}
  </span>
)

const BaseFlag = () => (
  <Disc ring="#f0d08a">
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="#f7e3b0" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 21V3" /><path d="M7 4h10l-2.2 3.2L17 10.5H7z" fill="#e4bb63" />
    </svg>
  </Disc>
)

const HubDisc = ({ mode }: { mode: TravelMode }) => (
  <Disc ring="#bcd4e0">
    <svg viewBox="-12 -12 24 24" className="h-3.5 w-3.5">
      <path d={MODE_PATH[mode]} fill="#e6f1f7" stroke="#0a1114" strokeWidth="1.3" strokeOpacity=".8" />
    </svg>
  </Disc>
)

const ModeGlyph = ({ mode }: { mode: TravelMode }) => (
  <svg viewBox="-13 -13 26 26" className="h-[17px] w-[17px] shrink-0">
    <g transform="rotate(90)">
      <path d={MODE_PATH[mode]} fill="#f6dda6" stroke="#0a1114" strokeWidth="1.2" strokeOpacity=".85" />
    </g>
  </svg>
)

const rows = [
  { el: <BaseFlag />, label: 'Base camp' },
  { el: <MarkerGlyph kind="confirmed" size={22} />, label: 'In itinerary' },
  { el: <MarkerGlyph kind="food" size={22} />, label: 'Food stop' },
  { el: <MarkerGlyph kind="camp" size={22} />, label: 'Camp / Hotel' },
  { el: <MarkerGlyph kind="found" size={22} />, label: 'Candidate' },
  { el: <MarkerGlyph kind="scouting" size={22} />, label: 'Passed over' },
  { el: <MarkerGlyph kind="unsuitable" size={22} />, label: 'Not suitable' },
  { el: <HubDisc mode="plane" />, label: 'Airport' },
  { el: <HubDisc mode="ferry" />, label: 'Ferry port' },
  { el: <Dash color="#e8c172" dash="9 5" />, label: 'Route' },
  { el: <Dash color="#a9b1b5" dash="6 5" />, label: 'Scouting' },
]

const MODES: TravelMode[] = ['walk', 'car', 'train', 'ferry', 'plane']

export function Legend() {
  const collapsed = useStore((s) => !!s.collapsed.legend)
  const toggle = useStore((s) => s.toggleCollapsed)

  return (
    <div className="nightcard gold-corners w-full shrink-0 overflow-hidden px-3.5 py-2.5">
      <button
        type="button"
        onClick={() => toggle('legend')}
        title={collapsed ? 'Show legend' : 'Hide legend'}
        className="flex w-full items-center gap-2 text-left"
      >
        <h4 className="font-body text-[16px] font-semibold text-parch-50 dark-emboss">Legend</h4>
        <span className="flex-1" />
        <motion.svg
          viewBox="0 0 24 24" className="h-[15px] w-[15px] shrink-0 text-parch-200/80"
          fill="none" stroke="currentColor" strokeWidth="2.1"
          strokeLinecap="round" strokeLinejoin="round"
          animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.25 }}
        >
          <path d="M6 9l6 6 6-6" />
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <ul className="mt-2 grid grid-cols-2 gap-x-2 gap-y-[4px]">
              {rows.map((r) => (
                <li key={r.label} className="flex items-center gap-1.5">
                  <span className="grid w-[26px] shrink-0 place-items-center">{r.el}</span>
                  <span className="truncate font-body text-[11.5px] leading-tight text-parch-100/85">
                    {r.label}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-2 border-t border-[#e8c172]/20 pt-1.5">
              <div className="grid grid-cols-3 gap-x-2 gap-y-[3px]">
                {MODES.map((m) => (
                  <span key={m} className="flex items-center gap-1">
                    <ModeGlyph mode={m} />
                    <span className="truncate font-body text-[11px] text-parch-100/70">{MODE_LABEL[m]}</span>
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
