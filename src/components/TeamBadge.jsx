import { LOGOS } from '../utils/logos.js'

export default function TeamBadge({ abbr, size = 24, className = '' }) {
  const src = LOGOS[abbr]
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img
          src={src}
          // The abbreviation is always printed next to the badge, so an alt
          // string here would just make screen readers say everything twice.
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          className="drop-shadow-sm"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      ) : (
        <span className="text-[10px] font-bold text-ucl-star/70">{abbr}</span>
      )}
    </span>
  )
}
