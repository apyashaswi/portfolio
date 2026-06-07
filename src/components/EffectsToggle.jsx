import { useReducedEffects, setEffectsReduced } from '../effects'

// Lets visitors dial the motion/3D down without changing their OS settings.
export default function EffectsToggle() {
  const reduced = useReducedEffects()
  return (
    <button
      type="button"
      className={`effects-toggle${reduced ? ' is-reduced' : ''}`}
      aria-pressed={!reduced}
      onClick={() => setEffectsReduced(!reduced)}
      title={reduced ? 'Turn motion & 3D effects on' : 'Reduce motion & 3D effects'}
    >
      <span className="effects-dot" aria-hidden="true" />
      {reduced ? 'Effects: off' : 'Effects: on'}
    </button>
  )
}
