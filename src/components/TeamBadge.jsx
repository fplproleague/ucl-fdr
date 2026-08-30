import { LOGOS } from '../utils/logos.js'

export default function TeamBadge({ abbr, size = 24, className = '' }) {
  const src = LOGOS[abbr]
  return (
    <span className={`inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      {src ? (
        <img src={src} alt={abbr} width={size} height={size} className="object-contain drop-shadow-sm" loading="lazy" />
      ) : (
        <span className="text-[10px] font-bold text-ucl-star/70">{abbr}</span>
      )}
    </span>
  )
}
