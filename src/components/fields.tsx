import type { ReactNode } from 'react'

export const Field = ({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) => (
  <label className="block">
    <span className="mb-1 block font-body text-[13px] font-semibold uppercase tracking-[.09em] text-ink-600">{label}</span>
    {children}
    {hint && <span className="mt-0.5 block font-body text-[12.5px] italic text-ink-500">{hint}</span>}
  </label>
)

export const inputClass =
  'w-full rounded-md border border-[#8a6a44]/45 bg-[#fbf3de]/70 px-2.5 py-1.5 font-body text-[15px] text-ink-900 ' +
  'shadow-[inset_0_1px_2px_rgba(90,64,30,.18)] outline-none transition focus:border-[#b0862f] focus:bg-[#fdf7e8] ' +
  'focus:ring-2 focus:ring-[#d3a243]/30'

export function Toggle({ value, onChange, left, right }: {
  value: boolean; onChange: (v: boolean) => void; left: string; right: string
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-full border border-[#8a6a44]/45 bg-[#00000008] p-[2px]">
      {[[false, left], [true, right]].map(([v, label]) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v as boolean)}
          className={`rounded-full px-3 py-[3px] font-body text-[13.5px] font-semibold transition ${
            value === v
              ? 'bg-gradient-to-b from-[#f2d89b] to-[#d3a243] text-[#3a2708] shadow-[0_1px_3px_rgba(0,0,0,.3)]'
              : 'text-ink-600 hover:text-ink-900'
          }`}
        >
          {label as string}
        </button>
      ))}
    </div>
  )
}

export function TagPicker({ selected, onToggle, pool, label }: {
  selected: string[]; onToggle: (t: string) => void; pool: string[]
  /** Supply when the values are already cased (place names), so they are left alone. */
  label?: (t: string) => string
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {pool.map((t) => {
        const on = selected.includes(t)
        return (
          <button
            key={t}
            type="button"
            onClick={() => onToggle(t)}
            className={`rounded-full border px-2.5 py-[3px] font-body text-[13px] transition ${
              label ? '' : 'capitalize'
            } ${
              on
                ? 'border-[#a97f2c] bg-gradient-to-b from-[#f2d89b] to-[#dcb055] text-[#3a2708] shadow-[0_1px_3px_rgba(0,0,0,.25)]'
                : 'border-[#7a5c34]/30 bg-[#7b7771]/15 text-ink-600 hover:bg-[#7b7771]/25'
            }`}
          >
            {label ? label(t) : t}
          </button>
        )
      })}
    </div>
  )
}

export function Stepper({ value, onChange, min, max, step = 1, suffix }: {
  value: number; onChange: (v: number) => void; min: number; max: number; step?: number; suffix?: string
}) {
  const btn =
    'grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#8a6a44]/45 bg-[#00000006] ' +
    'font-body text-[16px] leading-none text-ink-800 transition hover:bg-ink-900/10 active:translate-y-px ' +
    'disabled:opacity-30'
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={btn} disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - step))}>–</button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = Number(e.target.value)
          if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)))
        }}
        className={inputClass}
        style={{ width: 96, textAlign: 'center' }}
      />
      <button type="button" className={btn} disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + step))}>+</button>
      {suffix && <span className="font-body text-[14px] text-ink-600">{suffix}</span>}
    </div>
  )
}
