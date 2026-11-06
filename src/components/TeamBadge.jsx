import { useEffect, useRef, useState } from 'react'
import { LOGOS } from '../utils/logos.js'

// One observer for every badge on the page, created on first use.
let observer = null
const waiting = new Map()
function whenNear(el, onNear) {
  if (typeof IntersectionObserver === 'undefined') {
    onNear()
    return () => {}
  }
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        waiting.get(entry.target)?.()
        waiting.delete(entry.target)
        observer.unobserve(entry.target)
      }
    },
    { rootMargin: '300px 0px' },
  )
  waiting.set(el, onNear)
  observer.observe(el)
  return () => {
    waiting.delete(el)
    observer.unobserve(el)
  }
}

export default function TeamBadge({ abbr, size = 24, className = '' }) {
  const src = LOGOS[abbr]
  const ref = useRef(null)
  // The image is only requested once the badge is within 300px of the
  // screen. loading="lazy" alone left it to the browser, and Chrome's
  // threshold (1,250px and more) fetched all 36 crests of the FDR table on
  // first load, about 150 kB, for the dozen rows anyone can see. The box
  // keeps its size meanwhile, so nothing shifts when they arrive.
  const [near, setNear] = useState(false)
  useEffect(() => {
    if (near || !src || !ref.current) return undefined
    return whenNear(ref.current, () => setNear(true))
  }, [near, src])
  return (
    <span
      ref={ref}
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        near && (
          <img
            src={src}
            // The abbreviation is always printed next to the badge, so an alt
            // string here would just make screen readers say everything twice.
            alt=""
            width={size}
            height={size}
            decoding="async"
            className="drop-shadow-sm"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        )
      ) : (
        <span className="text-[10px] font-semibold text-ucl-star/70">{abbr}</span>
      )}
    </span>
  )
}
