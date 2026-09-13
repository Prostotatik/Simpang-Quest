import { motion } from 'framer-motion'
import type { MarkerKind, Poi } from '../types'
import { IconCloud, IconGoblet, IconTent } from './icons'
import { captionAnchor, type LabelPlacement } from './labelAnchor'

const GOLD_KINDS: MarkerKind[] = ['found', 'confirmed', 'food', 'camp']

export function MarkerGlyph({ kind, size = 42 }: { kind: MarkerKind; size?: number }) {
  const gold = GOLD_KINDS.includes(kind)
  const ring = gold ? '#e8c172' : '#9aa2a6'
  const glyph = gold ? '#f5dda4' : '#cfd4d6'
  const glow = gold ? 'rgba(232,193,114,.55)' : 'rgba(160,170,175,.35)'
  return (
    <div
      className="relative grid place-items-center rounded-full"
      style={{
        width: size, height: size,
        background: 'radial-gradient(circle at 34% 28%, #2a2318 0%, #14110c 58%, #0a0806 100%)',
        boxShadow: `0 0 0 2.4px ${ring}, 0 0 14px ${glow}, 0 0 30px ${glow}, 0 6px 12px -4px rgba(0,0,0,.85)`,
      }}
    >
      {(kind === 'scouting' || kind === 'found') && (
        <span className="font-title font-bold leading-none" style={{ color: glyph, fontSize: size * 0.52 }}>?</span>
      )}
      {(kind === 'confirmed' || kind === 'unsuitable') && (
        <span className="font-title font-bold leading-none" style={{ color: glyph, fontSize: size * 0.52 }}>!</span>
      )}
      {kind === 'food' && <IconGoblet style={{ width: size * 0.56, height: size * 0.56, color: glyph }} />}
      {kind === 'camp' && <IconTent style={{ width: size * 0.56, height: size * 0.56, color: glyph }} />}
    </div>
  )
}

interface Props {
  poi: Poi
  kind: MarkerKind
  selected: boolean
  showLabel: boolean
  label?: LabelPlacement
  onClick: () => void
  onStorm?: () => void
}

export function MapMarker({ poi, kind, selected, showLabel, label, onClick, onStorm }: Props) {
  return (
    <motion.div
      className="group relative"
      initial={{ scale: 0.2, opacity: 0 }}
      animate={{ scale: selected ? 1.14 : 1, opacity: kind === 'unsuitable' ? 0.72 : 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 20 }}
      style={{ width: 42, height: 42, zIndex: selected ? 30 : 10 }}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClick() }}
        className="block cursor-pointer outline-none"
        title={poi.name}
      >
        <MarkerGlyph kind={kind} />
      </button>

      {onStorm && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onStorm() }}
          title="Report this place closed"
          className="absolute -right-2.5 -top-2.5 grid h-5 w-5 place-items-center rounded-full border border-[#e8c172]/60 bg-[#12100c] text-[#e8c172] opacity-0 shadow-lg transition group-hover:opacity-100 hover:bg-[#241d12]"
        >
          <IconCloud className="h-3 w-3" />
        </button>
      )}

      {showLabel && (
        <div
          className="pointer-events-none absolute whitespace-nowrap font-body text-[12.5px] font-semibold tracking-wide text-parch-50"
          style={{
            ...captionAnchor(label ?? { side: 'below', shift: 0 }),
            textShadow: '0 2px 6px rgba(0,0,0,.95), 0 0 12px rgba(0,0,0,.9)',
          }}
        >
          {poi.name}
        </div>
      )}
    </motion.div>
  )
}
