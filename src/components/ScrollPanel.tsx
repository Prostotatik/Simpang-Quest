import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store/useStore'

/** Wooden roller with brass end caps — the thing a scroll rolls onto. */
function Rod({ side }: { side: 'top' | 'bottom' }) {
  return (
    <div
      className={`pointer-events-none absolute -left-2 -right-2 h-[11px] ${side === 'top' ? '-top-[6px]' : '-bottom-[6px]'}`}
      aria-hidden
    >
      <div
        className="absolute inset-x-[7px] top-[1px] h-[9px] rounded-full"
        style={{
          background: 'linear-gradient(180deg,#6b4e28 0%,#5a3f21 8%,#3d2a13 55%,#241706 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,224,170,.35), 0 2px 5px rgba(0,0,0,.55)',
        }}
      />
      {(['left-0', 'right-0'] as const).map((end) => (
        <div
          key={end}
          className={`absolute top-0 h-[11px] w-[11px] rounded-full ${end}`}
          style={{
            background: 'radial-gradient(circle at 34% 28%, #fbeec6, #e0b45f 42%, #8d6420 100%)',
            boxShadow: '0 0 0 1px rgba(60,40,12,.8), 0 2px 5px rgba(0,0,0,.6)',
          }}
        />
      ))}
    </div>
  )
}

const Rivets = () => (
  <span className="pointer-events-none absolute inset-0" aria-hidden>
    {[['left-[6px]', 'top-[6px]'], ['right-[6px]', 'top-[6px]'],
      ['left-[6px]', 'bottom-[6px]'], ['right-[6px]', 'bottom-[6px]']].map(([x, y]) => (
      <span
        key={`${x}${y}`}
        className={`absolute h-[5px] w-[5px] rounded-full ${x} ${y}`}
        style={{
          background: 'radial-gradient(circle at 32% 28%, #f6e2ac, #b58a35 60%, #6d4c12)',
          boxShadow: '0 1px 1px rgba(0,0,0,.5)',
        }}
      />
    ))}
  </span>
)

interface Props {
  id: string
  title: string
  icon?: ReactNode
  meta?: ReactNode
  action?: ReactNode
  children: ReactNode
  bodyMaxHeight?: number | string
  /** Handle on the scrolling area, so a caller can size it against its column. */
  bodyRef?: React.RefObject<HTMLDivElement | null>
  className?: string
}

export function ScrollPanel({
  id, title, icon, meta, action, children, bodyMaxHeight, bodyRef, className = '',
}: Props) {
  const collapsed = useStore((s) => !!s.collapsed[id])
  const toggle = useStore((s) => s.toggleCollapsed)

  return (
    <section className={`parchment relative ${className}`}>
      <Rod side="top" />
      <Rivets />

      <div className="flex items-center gap-2.5 px-3.5 pb-1.5 pt-[11px]">
        <button
          type="button"
          onClick={() => toggle(id)}
          title={collapsed ? 'Unroll' : 'Roll up'}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          {icon}
          <h2 className="truncate font-body text-[21px] font-bold leading-none text-ink-900 title-emboss">
            {title}
          </h2>
        </button>
        {meta}
        {action}
        <button
          type="button"
          onClick={() => toggle(id)}
          title={collapsed ? 'Unroll' : 'Roll up'}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink-700 transition hover:bg-ink-900/10"
        >
          <motion.svg
            viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor"
            strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"
            animate={{ rotate: collapsed ? -90 : 0 }} transition={{ duration: 0.25 }}
          >
            <path d="M6 9l6 6 6-6" />
          </motion.svg>
        </button>
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
            <div className="mx-3.5 border-t border-[#5a4223]/25 pt-1.5" />
            <div
              ref={bodyRef}
              className="px-3.5 pb-3"
              style={bodyMaxHeight !== undefined
                ? { maxHeight: bodyMaxHeight, overflowY: 'auto' }
                : undefined}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-[9px]" />
      <Rod side="bottom" />
    </section>
  )
}
