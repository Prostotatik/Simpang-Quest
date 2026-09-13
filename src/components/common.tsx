import { useState } from 'react'
import type { Category, JournalStatus, Member } from '../types'

export const CATEGORY_GRADIENT: Record<Category, string> = {
  nature: 'linear-gradient(150deg,#2c5730,#6d8c3b 55%,#c5b163)',
  beach: 'linear-gradient(150deg,#0d4f6b,#2f9fb4 55%,#e6dcae)',
  food: 'linear-gradient(150deg,#4a1a10,#b4622a 60%,#e5b055)',
  culture: 'linear-gradient(150deg,#3a2747,#9a6a3c 60%,#e0bd72)',
  city: 'linear-gradient(150deg,#16212c,#4d647a 60%,#c3cdd6)',
  poi: 'linear-gradient(150deg,#2f2617,#8a6c33 60%,#e2c27d)',
  stay: 'linear-gradient(150deg,#241d33,#5c4a7a 58%,#e2c9a0)',
}

export const CATEGORY_COLOR: Record<Category, string> = {
  nature: '#2f6b34', beach: '#1d5f86', food: '#8a3a22',
  culture: '#4a6b34', city: '#46566b', poi: '#7a5c22', stay: '#4d3f74',
}

export const CATEGORY_LABEL: Record<Category, string> = {
  nature: 'Nature', beach: 'Beach', food: 'Food',
  culture: 'Culture', city: 'City', poi: 'Point of interest', stay: 'Stay',
}

export function PoiImage({
  id, category, className = '', alt, style,
}: { id: string; category: Category; className?: string; alt: string; style?: React.CSSProperties }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: CATEGORY_GRADIENT[category], ...style }}
    >
      <img
        src={`/poi/${id}.jpg`}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className="h-full w-full object-cover transition-opacity duration-500"
        style={{ opacity: loaded ? 1 : 0 }}
      />
      <div className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(180deg,rgba(0,0,0,.14),rgba(0,0,0,0) 45%,rgba(0,0,0,.22))' }} />
    </div>
  )
}

const STATUS_STYLE: Record<JournalStatus, string> = {
  Completed: 'bg-[#bcdd9a] text-[#2c4a1d] border-[#7fa25e]',
  'In Progress': 'bg-[#f0cd7e] text-[#5a3f12] border-[#c09a44]',
  Pending: 'bg-[#cfcabf] text-[#4a453c] border-[#a49d8f]',
  Skipped: 'bg-[#f0b6ba] text-[#63262b] border-[#c07f84]',
}

export function StatusPill({ status, onClick }: { status: JournalStatus; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Click to change status"
      className={`shrink-0 rounded-full border px-2.5 py-[3px] font-body text-[12px] font-semibold shadow-sm transition hover:brightness-105 active:translate-y-px ${STATUS_STYLE[status]}`}
    >
      {status === 'Completed' && <span className="mr-1">✓</span>}
      {status}
    </button>
  )
}

/** Painted-medallion palettes: deep ground + rim tint, one per party seat. */
const AVATAR_PALETTES = [
  ['#45341d', '#8a6634', '#f2dda6'], ['#2b3a23', '#5d7539', '#e2e8b8'],
  ['#42231c', '#8d4a30', '#f4cfae'], ['#1e3540', '#3f6b78', '#cfe8ec'],
  ['#4a2a18', '#96552a', '#f6d1a6'], ['#3a2530', '#75455a', '#efcedd'],
]

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='90' height='90' filter='url(%23n)' opacity='.4'/%3E%3C/svg%3E\")"

export function Avatar({ member, size = 46 }: { member: Member; size?: number }) {
  const [deep, mid, glow] = AVATAR_PALETTES[member.avatarSeed % AVATAR_PALETTES.length]
  return (
    <div
      className="relative shrink-0 overflow-hidden"
      style={{
        width: size, height: size * 1.12,
        borderRadius: size * 0.16,
        background: `radial-gradient(120% 95% at 34% 22%, ${glow}33, ${mid} 42%, ${deep} 100%)`,
        boxShadow: '0 0 0 1px rgba(60,40,16,.75), inset 0 0 0 1px rgba(255,238,198,.35), 0 3px 8px -2px rgba(0,0,0,.55)',
      }}
    >
      <span className="pointer-events-none absolute inset-0 opacity-[.28] mix-blend-overlay"
        style={{ backgroundImage: NOISE }} />
      <span className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(90% 70% at 50% 108%, rgba(0,0,0,.55), rgba(0,0,0,0) 62%)' }} />
      <span
        className="absolute inset-0 grid place-items-center font-display font-bold"
        style={{
          fontSize: size * 0.46,
          background: `linear-gradient(180deg, #fff3d4, ${glow} 40%, #c79a46 95%)`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,.8))',
        }}
      >
        {member.name.slice(0, 1).toUpperCase()}
      </span>
      <span className="pointer-events-none absolute inset-[3px]"
        style={{ borderRadius: size * 0.11, boxShadow: 'inset 0 0 0 1px rgba(255,232,180,.22)' }} />
      <span
        className="absolute bottom-[3px] right-[3px] grid place-items-center rounded-full font-body font-bold text-[#3a2708]"
        style={{
          height: size * 0.28, width: size * 0.28, fontSize: size * 0.17,
          background: 'linear-gradient(180deg,#f7e2a8,#c9963c)',
          boxShadow: '0 0 0 1px rgba(60,40,12,.7)',
        }}
      >
        {member.age >= 30 ? '★' : '✦'}
      </span>
    </div>
  )
}
