export default function GwRangePicker({ allGws, from, to, onFromChange, onToChange, className = '' }) {
  return (
    <div className={`grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 ${className}`}>
      <label className="text-xs font-semibold uppercase tracking-wide text-ucl-star/60">
        From GW
        <select
          value={from}
          onChange={(e) => onFromChange(Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-white/10 bg-ucl-deep px-2 py-2 text-sm font-medium text-ucl-star focus:outline-none focus:ring-2 focus:ring-ucl-accent"
        >
          {allGws.map((gw) => (
            <option key={gw} value={gw}>
              GW{gw}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-semibold uppercase tracking-wide text-ucl-star/60">
        To GW
        <select
          value={to}
          onChange={(e) => onToChange(Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-white/10 bg-ucl-deep px-2 py-2 text-sm font-medium text-ucl-star focus:outline-none focus:ring-2 focus:ring-ucl-accent"
        >
          {allGws.map((gw) => (
            <option key={gw} value={gw}>
              GW{gw}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
