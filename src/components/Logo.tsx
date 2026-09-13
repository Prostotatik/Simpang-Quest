import { CompassRose } from './icons'

export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const lg = size === 'lg'
  return (
    <div className="flex items-center gap-2.5">
      <CompassRose
        className={lg ? 'h-[78px] w-[78px]' : 'h-[56px] w-[56px]'}
        style={{ filter: 'drop-shadow(0 0 14px rgba(232,193,114,.45)) drop-shadow(0 2px 4px rgba(0,0,0,.7))' }}
      />
      <div className="min-w-0">
        <h1
          className="font-display leading-none logo-glow"
          style={{
            fontSize: lg ? 50 : 33,
            background: 'linear-gradient(180deg,#fbeec6 6%,#efd08a 44%,#cf9e42 78%,#a6761f 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            letterSpacing: '.01em',
          }}
        >
          Simpang&nbsp;Quest
        </h1>
        <p
          className="mt-[3px] font-body text-parch-100/90"
          style={{ fontSize: lg ? 19 : 14.5, textShadow: '0 1px 5px rgba(0,0,0,.9)' }}
        >
          Plan your next adventure
        </p>
      </div>
    </div>
  )
}
