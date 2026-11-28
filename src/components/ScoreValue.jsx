// The score as a number, right-aligned like the price and form beside it,
// with a 2px rule under it as long as the score. It used to be a filled bar
// with the number printed on it as well: the same value twice, and a column
// that read as a row of progress bars. The rule keeps the glance; the
// number is the reading. The player on 100 gets his number in 800.
export function ScoreValue({ value, highlight = false }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <span className="ml-auto block w-10 sm:w-20">
      <span className={`block text-right tabular-nums ${highlight ? 'font-extrabold text-ucl-star' : 'font-semibold'}`}>
        {Math.round(pct)}
      </span>
      {/* 2px at 60% white on a barely-there track: at the old white/70 on
          white/15 the two were too close to read as a length. */}
      <span aria-hidden="true" className="mt-1 block h-0.5 bg-white/[0.06]">
        <span className="block h-full bg-white/60" style={{ width: `${pct}%` }} />
      </span>
    </span>
  )
}
