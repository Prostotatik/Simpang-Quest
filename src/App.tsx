import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MapCanvas } from './components/MapCanvas'
import { PartyPanel } from './components/PartyPanel'
import { TripPanel } from './components/TripPanel'
import { Orchestrator } from './components/Orchestrator'
import { QuestJournal } from './components/QuestJournal'
import { CandidateStrip } from './components/CandidateStrip'
import { Legend } from './components/Legend'
import { Logo } from './components/Logo'
import { Modals } from './components/Modals'
import { Onboarding } from './components/Onboarding'
import { useStore } from './store/useStore'

/**
 * The HUD is composed against a 1560x900 stage. On smaller windows the whole
 * overlay is zoomed down rather than reflowed, so the composition stays exactly
 * as designed while the live map underneath keeps its full size.
 */
function useHudScale() {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const measure = () => {
      const s = Math.min(1, Math.min(window.innerWidth / 1560, window.innerHeight / 900))
      setScale(Math.max(0.66, Math.round(s * 100) / 100))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  return scale
}

/** Debounced auto-replan whenever the party or the trip terms change. */
function useAutoReplan() {
  const members = useStore((s) => s.members)
  const trip = useStore((s) => s.trip)
  const phase = useStore((s) => s.phase)
  const generate = useStore((s) => s.generate)
  const signature = JSON.stringify({ members, trip })
  const first = useRef(true)

  useEffect(() => {
    if (phase !== 'map') { first.current = true; return }
    if (first.current) { first.current = false; return }
    const t = window.setTimeout(() => generate(), 700)
    return () => window.clearTimeout(t)
  }, [signature, phase, generate])
}

export default function App() {
  const phase = useStore((s) => s.phase)
  const backToOnboarding = useStore((s) => s.backToOnboarding)
  const scale = useHudScale()
  useAutoReplan()

  return (
    <div className="relative h-full w-full overflow-hidden bg-ocean-900">
      <MapCanvas />

      <AnimatePresence>
        {phase === 'map' && (
          <motion.div
            key="hud"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="pointer-events-none absolute inset-0"
            style={{ zoom: scale }}
          >
            {/* ---- left rail: who is going and on what terms ---- */}
            <div className="pointer-events-auto absolute bottom-3 left-3 top-3 flex w-[300px] flex-col gap-[18px]">
              <button type="button" onClick={backToOnboarding} className="shrink-0 self-start pl-3 text-left" title="Back to setup">
                <Logo />
              </button>

              {/* The party takes the rail's slack and scrolls its own list
                  inside the parchment — the panel itself never moves, so its
                  rods and rivets stay put and it keeps the trip card's width. */}
              <div className="flex min-h-0 flex-1 flex-col gap-[18px] px-2">
                <PartyPanel />
                <TripPanel />
              </div>

              {/* the agent sits at the foot of the rail it drives */}
              <div className="px-2"><Orchestrator /></div>
            </div>

            {/* ---- right rail: what the plan came out as ---- */}
            <div className="pointer-events-auto absolute bottom-3 right-4 top-3 flex w-[312px] flex-col gap-[18px] pr-1">
              <div className="flex min-h-0 flex-1 flex-col">
                <QuestJournal />
              </div>
              <Legend />
            </div>

            {/* ---- bottom rail: extra options, centred between the two rails ---- */}
            <div className="pointer-events-auto absolute bottom-3 left-[324px] right-[348px]">
              <CandidateStrip />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'onboarding' && (
          <motion.div key="onb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }} className="absolute inset-0 z-[120]">
            <Onboarding />
          </motion.div>
        )}
      </AnimatePresence>

      <Modals />
    </div>
  )
}
