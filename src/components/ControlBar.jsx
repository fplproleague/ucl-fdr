import { useState } from 'react'
import { Info } from 'lucide-react'
import { RATING_METHOD } from '../data/teams.js'
import { useTeams } from '../context/TeamsContext.jsx'
import MdRangePicker from './MdRangePicker.jsx'
import RatingLegend from './RatingLegend.jsx'

// Every view shares one control bar, so the matchday range you pick on the table
// is still the range you're looking at on Best Runs and Compare. Two rows on a
// phone instead of the two full-height cards this replaces.
export default function ControlBar({ showRange = true, className = '' }) {
  const { from, to, skipMd, setRange, setSkipMd, venueAdjust, setVenueAdjust, modifiedCount, setTab } = useTeams()
  const [openMethod, setOpenMethod] = useState(false)

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {showRange && (
        <MdRangePicker from={from} to={to} onChange={setRange} skipMd={skipMd} onSkipChange={setSkipMd} />
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <RatingLegend />

        <button
          type="button"
          role="switch"
          aria-checked={venueAdjust}
          onClick={() => setVenueAdjust(!venueAdjust)}
          className={`flex min-h-[32px] items-center gap-2 rounded-full border px-2.5 text-xs font-semibold transition ${
            venueAdjust
              ? 'border-ucl-accent/50 bg-ucl-accent/20 text-ucl-star'
              : 'border-white/10 bg-white/5 text-ucl-star/60'
          }`}
        >
          <span
            aria-hidden="true"
            className={`flex h-4 w-7 items-center rounded-full p-0.5 transition ${
              venueAdjust ? 'bg-ucl-accent' : 'bg-white/20'
            }`}
          >
            <span
              className={`h-3 w-3 rounded-full bg-white transition-transform ${venueAdjust ? 'translate-x-3' : ''}`}
            />
          </span>
          Home/away
        </button>

        <button
          type="button"
          onClick={() => setOpenMethod((v) => !v)}
          aria-expanded={openMethod}
          className="flex min-h-[32px] items-center gap-1.5 rounded-full px-2 text-xs font-semibold text-ucl-muted transition hover:text-ucl-star"
        >
          <Info size={14} />
          <span className="sm:hidden">How it works</span>
          <span className="hidden sm:inline">How difficulty works</span>
        </button>

        {modifiedCount > 0 && (
          <span className="rounded-full bg-ucl-accent/20 px-2.5 py-1 text-[11px] font-semibold text-ucl-star">
            {modifiedCount} custom rating{modifiedCount === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {openMethod && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-ucl-star/75">
          <ul className="space-y-1.5">
            {RATING_METHOD.map((line, i) => (
              <li key={line} className="flex gap-2">
                <span aria-hidden="true" className="text-ucl-accent">
                  •
                </span>
                <span>
                  {line}
                  {i === 0 && (
                    <>
                      {' '}
                      <button
                        type="button"
                        onClick={() => setTab('strength')}
                        className="font-semibold text-ucl-accent underline underline-offset-2 hover:text-ucl-star"
                      >
                        Go to Strength tab
                      </button>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
