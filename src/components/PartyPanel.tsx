import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { prettyTag } from '../data/tags'
import { useStore } from '../store/useStore'
import { Avatar } from './common'
import { ScrollPanel } from './ScrollPanel'
import { IconChevron, IconDrumstick, IconLeaf, IconPlus, IconUsers, IconWheelchair } from './icons'

export function PartyPanel() {
  const members = useStore((s) => s.members)
  const addMember = useStore((s) => s.addMember)
  const setEditingMember = useStore((s) => s.setEditingMember)

  // The list scrolls inside the parchment rather than the panel scrolling in
  // the rail: measure the slack the rail leaves us and cap the body at it.
  const shellRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [bodyMaxHeight, setBodyMaxHeight] = useState<number | undefined>()

  useEffect(() => {
    const shell = shellRef.current
    if (!shell) return
    const measure = () => {
      const list = listRef.current
      const panel = list?.closest('section')
      if (!list || !panel) return
      // Measure the panel's chrome — rods, heading, rule, padding — rather than
      // guessing it, so the list ends exactly where the shell does.
      const chrome = panel.getBoundingClientRect().height - list.getBoundingClientRect().height
      setBodyMaxHeight(Math.max(120, shell.clientHeight - chrome))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(shell)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={shellRef} className="flex min-h-0 flex-1 flex-col">
    <ScrollPanel
      id="party"
      title="The Party"
      bodyMaxHeight={bodyMaxHeight}
      bodyRef={listRef}
      icon={<IconUsers className="h-[19px] w-[19px] shrink-0 text-ink-800" />}
      meta={<span className="shrink-0 font-body text-[14px] text-ink-600">{members.length}/6</span>}
      action={
        <button
          type="button"
          onClick={() => addMember()}
          disabled={members.length >= 6}
          title="Add a party member"
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink-800 transition hover:bg-ink-900/10 disabled:opacity-30"
        >
          <IconPlus className="h-[17px] w-[17px]" strokeWidth={2.2} />
        </button>
      }
    >
      <div>
        {members.map((m, i) => (
          <motion.button
            key={m.id}
            type="button"
            layout
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => setEditingMember(m.id)}
            className={`group flex w-full items-start gap-2.5 rounded-md px-1 py-[5px] text-left transition hover:bg-ink-900/[.06] ${i ? 'hairline' : ''}`}
          >
            <Avatar member={m} size={40} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-body text-[15.5px] font-semibold leading-tight text-ink-900">
                {m.name}
              </span>
              <span className="flex items-center gap-1.5 font-body text-[13px] leading-tight text-ink-600">
                <span>{m.age}</span><span className="opacity-50">·</span>
                <span>{m.vegan ? 'Vegan' : 'Non-vegan'}</span><span className="opacity-50">·</span>
                {m.vegan
                  ? <IconLeaf className="h-[13px] w-[13px] text-[#4a7a35]" />
                  : <IconDrumstick className="h-[13px] w-[13px] text-[#9c5330]" />}
                {m.disability && <IconWheelchair className="h-[13px] w-[13px] text-[#3f5f7a]" />}
              </span>
              <span className="mt-[3px] flex flex-wrap gap-[3px]">
                {m.interests.slice(0, 3).map((t) => (
                  <span key={t} className="chip-parch px-[6px] py-[1px] font-body text-[10.5px]">{prettyTag(t)}</span>
                ))}
                {m.interests.length > 3 && (
                  <span className="chip-parch px-[6px] py-[1px] font-body text-[10.5px]">+{m.interests.length - 3}</span>
                )}
              </span>
            </span>
            <IconChevron className="mt-2 h-4 w-4 shrink-0 text-ink-500 transition group-hover:translate-x-0.5" />
          </motion.button>
        ))}

        <button
          type="button"
          onClick={() => addMember()}
          disabled={members.length >= 6}
          className="hairline mt-1 flex w-full items-center gap-2 rounded-md px-1.5 py-[6px] font-body text-[14.5px] text-ink-800 transition hover:bg-ink-900/[.06] disabled:opacity-35"
        >
          <IconPlus className="h-4 w-4" strokeWidth={2.2} /> Add member
        </button>
      </div>
    </ScrollPanel>
    </div>
  )
}
