import { useEffect, useState } from 'react'

export default function Typewriter({ text, speed = 65 }) {
  const [display, setDisplay] = useState('')
  const [i, setI] = useState(0)
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (i < text.length) {
      const t = setTimeout(() => { setDisplay(text.slice(0, i + 1)); setI(i + 1) }, speed)
      return () => clearTimeout(t)
    } else { setDone(true) }
  }, [i, text, speed])
  return <span>{display}{!done && <span className="tw-cursor">|</span>}</span>
}
