import { useState } from 'react'
import { Check, Info, Link2 } from 'lucide-react'
import { RATING_METHOD } from '../data/teams.js'
import { useTeams } from '../context/TeamsContext.jsx'
import { DAY_LABEL } from '../utils/matchdaySplit.js'
import MdRangePicker from './MdRangePicker.jsx'
import RatingLegend from './RatingLegend.jsx'

// Every view shares one control bar, so the matchday range you pick on the table
// is still the range you're looking at on Best Runs and Compare. Three groups,
// each on its own line on a phone: what you're looking at (range, plus the
// view toggles beside it on a wide screen), the day filter when the split is
// on, and the reference bits (legend, how it works, share).
export default function ControlBar({ showRange = true, showMyTeamsFilter = false, className = '' }) {
  const {
    from,
    to,
    skipMd,
    setRange,
    setSkipMd,
    venueAdjust,
    setVenueAdjust,
    modifiedCount,
    setTab,
    showMatchday,
    setShowMatchday,
    dayFilter,
    setDayFilter,
    availableDayOptions,
    pinnedCount,
    myTeamsOnly,
    setMyTeamsOnly,
  } = useTeams()
  const [openMethod, setOpenMethod] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard blocked (permissions, insecure context) — nothing to show
    }
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        {showRange && (
          <MdRangePicker from={from} to={to} onChange={setRange} skipMd={skipMd} onSkipChange={setSkipMd} />
        )}

        {/* Chips with a tick rather than full switches: three switches with
            their labels don't fit across a 390px phone, three chips do. */}
        <div role="group" aria-label="Table options" className="flex flex-wrap items-center gap-1.5">
          <OptionToggle on={venueAdjust} onChange={setVenueAdjust}>
            Home/away
          </OptionToggle>
          <OptionToggle on={showMatchday} onChange={setShowMatchday}>
            Matchday Split
          </OptionToggle>
          {showMyTeamsFilter && (
            <OptionToggle on={myTeamsOnly} onChange={setMyTeamsOnly}>
              My teams{pinnedCount > 0 ? ` (${pinnedCount})` : ''}
            </OptionToggle>
          )}
        </div>
      </div>

      {showMatchday && (
        <div className="flex w-fit rounded-lg bg-white/5 p-0.5" role="group" aria-label="Filter fixtures by day">
          {['ALL', ...availableDayOptions].map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={dayFilter === d}
              onClick={() => setDayFilter(d)}
              className={`min-h-[32px] rounded-[6px] px-3 text-[11px] font-semibold transition ${
                dayFilter === d ? 'bg-ucl-accent text-white' : 'text-ucl-star/70 hover:bg-white/10'
              }`}
            >
              {d === 'ALL' ? 'All days' : DAY_LABEL[d]}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <RatingLegend />

        <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
          {modifiedCount > 0 && (
            <button
              type="button"
              onClick={() => setTab('strength')}
              title="Ratings you changed on the Strength tab"
              className="min-h-[32px] rounded-full bg-ucl-accent/20 px-2.5 text-[11px] font-semibold text-ucl-star transition hover:bg-ucl-accent/30"
            >
              {modifiedCount} custom rating{modifiedCount === 1 ? '' : 's'}
            </button>
          )}

          <button
            type="button"
            onClick={() => setOpenMethod((v) => !v)}
            aria-expanded={openMethod}
            className="flex min-h-[32px] items-center gap-1.5 rounded-full px-2 text-xs font-semibold text-ucl-muted transition hover:text-ucl-star"
          >
            <Info size={14} aria-hidden="true" />
            <span className="sm:hidden">How it works</span>
            <span className="hidden sm:inline">How difficulty works</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="flex min-h-[32px] items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 text-xs font-semibold text-ucl-star/70 transition hover:bg-white/10 hover:text-ucl-star"
          >
            {copied ? <Check size={14} aria-hidden="true" /> : <Link2 size={14} aria-hidden="true" />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
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

function OptionToggle({ on, onChange, children }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`flex min-h-[32px] items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition ${
        on
          ? 'border-ucl-accent/50 bg-ucl-accent/20 text-ucl-star'
          : 'border-white/10 bg-white/5 text-ucl-star/60 hover:text-ucl-star'
      }`}
    >
      <span
        aria-hidden="true"
        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full transition ${
          on ? 'bg-ucl-accent text-white' : 'border border-white/30'
        }`}
      >
        {on && <Check size={10} strokeWidth={3.5} />}
      </span>
      {children}
    </button>
  )
}
