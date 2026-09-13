import { AnimatePresence, motion } from 'framer-motion'
import { REASONING_STEPS, useStore } from '../store/useStore'
import { IconSparkle } from './icons'

const NODES: [number, number][] = [
  [18, 50], [36, 24], [60, 32], [74, 56], [50, 72], [26, 66], [46, 48], [62, 60],
]
const EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [6, 1], [6, 3], [6, 5], [7, 4], [7, 2],
]

function Orb({ busy }: { busy: boolean }) {
  return (
    <div className="relative h-[104px] w-[104px] shrink-0">
      {/* ambient bloom */}
      <motion.div
        className="absolute -inset-4 rounded-full"
        animate={{ opacity: busy ? [0.55, 0.95, 0.55] : 0.45, scale: busy ? [1, 1.06, 1] : 1 }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: 'radial-gradient(circle, rgba(242,198,106,.5), rgba(242,198,106,0) 68%)', filter: 'blur(10px)' }}
      />

      {/* outer bearing ring with tick marks */}
      <svg viewBox="0 0 128 128" className="absolute inset-0 h-full w-full"
        style={{ animation: `spin-slow ${busy ? 14 : 30}s linear infinite` }}>
        <circle cx="64" cy="64" r="61" fill="none" stroke="rgba(240,200,118,.5)" strokeWidth="1" strokeDasharray="2 6" />
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2
          const long = i % 3 === 0
          return (
            <line key={i}
              x1={64 + Math.cos(a) * (long ? 52 : 55)} y1={64 + Math.sin(a) * (long ? 52 : 55)}
              x2={64 + Math.cos(a) * 58} y2={64 + Math.sin(a) * 58}
              stroke={long ? 'rgba(250,226,160,.85)' : 'rgba(240,200,118,.4)'} strokeWidth={long ? 1.4 : 0.9} />
          )
        })}
      </svg>

      {/* counter-rotating arc ring */}
      <svg viewBox="0 0 128 128" className="absolute inset-0 h-full w-full"
        style={{ animation: `spin-rev ${busy ? 9 : 24}s linear infinite` }}>
        <circle cx="64" cy="64" r="48" fill="none" stroke="rgba(246,212,132,.6)" strokeWidth="1.4"
          strokeDasharray="26 14" strokeLinecap="round" />
        <circle cx="64" cy="16" r="2.4" fill="#fff2cf" />
      </svg>

      {/* the sphere */}
      <motion.div
        className="absolute inset-[14px] rounded-full"
        animate={{ scale: busy ? [1, 1.035, 1] : [1, 1.015, 1] }}
        transition={{ duration: busy ? 1.8 : 4.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background:
            'radial-gradient(circle at 34% 28%, rgba(255,253,240,1) 0%, rgba(255,228,160,.92) 20%, rgba(238,162,60,.6) 50%, rgba(122,58,16,.45) 78%, rgba(28,15,6,.3) 100%)',
          boxShadow: '0 0 44px rgba(246,196,102,.75), 0 0 96px rgba(236,158,58,.4), inset 0 0 34px rgba(255,238,190,.7), inset -8px -10px 26px rgba(70,32,6,.5)',
        }}
      />

      {/* constellation the orchestrator is "thinking" through */}
      <svg viewBox="0 0 92 92" className="absolute inset-[14px] h-[76px] w-[76px]">
        <g stroke="rgba(112,56,12,.7)" strokeWidth=".9" fill="none">
          {EDGES.map(([a, b], i) => (
            <line key={i} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} />
          ))}
        </g>
        <g stroke="rgba(255,246,214,.95)" strokeWidth="1.3" fill="none" strokeLinecap="round"
          strokeDasharray="5 26" style={{ animation: `dash-flow ${busy ? 1.5 : 4}s linear infinite` }}>
          {EDGES.map(([a, b], i) => (
            <line key={i} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} />
          ))}
        </g>
        {NODES.map(([x, y], i) => (
          <g key={i} style={{ animation: `twinkle ${1.6 + (i % 4) * 0.5}s ease-in-out ${i * 0.19}s infinite` }}>
            <circle cx={x} cy={y} r="4.4" fill="#fff3cf" opacity=".3" />
            <circle cx={x} cy={y} r="1.9" fill="#fffaf0" />
          </g>
        ))}
      </svg>

      {/* orbiting sparks */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: (busy ? 5 : 12) + i * 2.5, repeat: Infinity, ease: 'linear' }}
        >
          <span
            className="absolute left-1/2 h-[5px] w-[5px] -translate-x-1/2 rounded-full"
            style={{
              top: 6 + i * 9,
              background: '#fff3cf',
              boxShadow: '0 0 8px 2px rgba(250,214,140,.9)',
            }}
          />
        </motion.div>
      ))}
    </div>
  )
}

/**
 * PROTOTYPE: the orchestrator shows a scripted reasoning stream and a rule-based
 * plan. Nothing here calls a model; the panel is shaped so a real agent's output
 * can replace the script without touching the layout.
 */
export function Orchestrator() {
  const generating = useStore((s) => s.generating)
  const step = useStore((s) => s.reasoningStep)
  const generate = useStore((s) => s.generate)
  const itinerary = useStore((s) => s.itinerary)
  const collapsed = useStore((s) => !!s.collapsed.orchestrator)
  const toggle = useStore((s) => s.toggleCollapsed)

  const progress = generating ? ((step + 1) / REASONING_STEPS.length) * 100 : 100

  return (
    <motion.div
      layout
      transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
      className="nightcard gold-corners relative w-full shrink-0 overflow-hidden"
    >
      {/* warm hearth behind the orb, cool dusk on the far side */}
      <div className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(236,186,92,.3), transparent 70%)' }} />
      <div className="pointer-events-none absolute -bottom-12 -right-12 h-40 w-40 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(86,124,150,.22), transparent 70%)' }} />
      {generating && (
        <motion.div
          className="pointer-events-none absolute inset-y-0 w-24"
          animate={{ x: [-130, 470] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
          style={{ background: 'linear-gradient(90deg, transparent, rgba(246,221,166,.08), transparent)' }}
        />
      )}

      {/* ---- header ---- */}
      <div className="relative flex items-center gap-2 px-3 pb-1.5 pt-2.5">
        <motion.span
          animate={{ rotate: generating ? 360 : 0, scale: generating ? [1, 1.18, 1] : 1 }}
          transition={{
            rotate: { duration: 3.4, repeat: Infinity, ease: 'linear' },
            scale: { duration: 1.6, repeat: Infinity },
          }}
          className="shrink-0 text-gold-300"
        >
          <IconSparkle className="h-4 w-4" />
        </motion.span>

        <span className="shrink-0 font-body text-[15.5px] font-semibold tracking-wide text-parch-50 dark-emboss">
          Orchestrator
        </span>

        <span className="flex-1" />

        <button
          type="button"
          onClick={generate}
          disabled={generating}
          className="btn-gold shrink-0 px-3 py-[3px] font-body text-[12.5px] disabled:cursor-wait disabled:opacity-70"
        >
          {generating ? 'Scouting…' : itinerary.length ? 'Regenerate' : 'Generate'}
        </button>

        <button
          type="button"
          onClick={() => toggle('orchestrator')}
          title={collapsed ? 'Show reasoning' : 'Hide reasoning'}
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

      {/* ---- progress rail, doubles as the collapsed-state heartbeat ---- */}
      <div className="relative mx-3 mb-1 h-[3px] overflow-hidden rounded-full bg-[#ffffff14]">
        <motion.div
          className="h-full rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={{ background: 'linear-gradient(90deg,#8d6a2a,#f2d89b,#e4bb63)' }}
        />
      </div>

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
            <div className="relative px-3 pb-2">
              <div className="flex justify-center pb-0.5">
                <Orb busy={generating} />
              </div>

              {/* filaments fan down from the orb into the thoughts below it */}
              <svg className="pointer-events-none mx-auto -mt-1 block h-3 w-[120px]" viewBox="0 0 120 12"
                preserveAspectRatio="none" aria-hidden>
                {[10, 35, 60, 85, 110].map((x, i) => (
                  <path key={i} d={`M60 0 C60 6 ${x} 4 ${x} 12`} fill="none"
                    stroke="rgba(226,180,90,.3)" strokeWidth="1" />
                ))}
              </svg>

              <div className="space-y-[3px]">
                {REASONING_STEPS.map((text, i) => (
                  <ReasoningLine
                    key={text}
                    text={text}
                    reached={generating ? i <= step : true}
                    active={generating && i === step}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/** One line of the mocked reasoning stream. */
function ReasoningLine({ text, reached, active }: {
  text: string; reached: boolean; active: boolean
}) {
  return (
    <motion.div
      animate={{
        opacity: reached ? (active ? 1 : 0.6) : 0.14,
        x: reached ? 0 : -8,
        filter: reached ? 'blur(0px)' : 'blur(2.5px)',
      }}
      transition={{ duration: 0.45 }}
      className="relative flex items-center gap-1.5 rounded-md py-[2px] pl-2 pr-2.5 font-body text-[13.5px]"
      style={{
        background: active
          ? 'linear-gradient(90deg, rgba(226,180,90,.26), rgba(226,180,90,.02))'
          : 'linear-gradient(90deg, rgba(255,246,224,.09), rgba(255,246,224,.01))',
        color: active ? '#fdf1d2' : '#e4d7ba',
        textShadow: '0 1px 4px rgba(0,0,0,.85)',
      }}
    >
      {active && (
        <motion.span
          className="pointer-events-none absolute inset-y-0 left-0 w-[2px] rounded-full"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ background: 'linear-gradient(180deg,#f2d89b,#b1802c)' }}
        />
      )}
      <span className="grid h-[11px] w-[11px] shrink-0 place-items-center">
        {reached && !active && (
          <svg viewBox="0 0 24 24" className="h-[10px] w-[10px]" fill="none" stroke="#9fd3a2"
            strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12.5l5 5L20 6.5" />
          </svg>
        )}
        {active && (
          <motion.span
            className="h-[6px] w-[6px] rounded-full bg-[#ffe7ab]"
            animate={{ scale: [1, 1.55, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{ boxShadow: '0 0 8px rgba(255,224,150,.9)' }}
          />
        )}
      </span>
      <span className="truncate">{text}</span>
    </motion.div>
  )
}
