import { useTeams } from '../context/TeamsContext.jsx'
import { MATCHDAYS } from '../data/matchdays.js'

// A short "About" in plain, crawlable text, collapsed so it never pushes
// anything down; the static matchday pages (/md/1/ … /md/8/, built by
// scripts/build-md-pages.mjs) are linked from here so they aren't orphans.
const LINK = 'font-semibold text-ucl-link underline underline-offset-2 hover:text-ucl-star'

export default function Footer() {
  const { setTab } = useTeams()

  // Same behaviour as the tab bar: switch view in place, then show it from
  // the top (the link is down at the bottom of the page).
  function goTo(e, id) {
    e.preventDefault()
    setTab(id)
    window.scrollTo(0, 0)
  }

  return (
    <footer className="border-t border-white/10 px-4 py-5 text-center">
      <details className="group mx-auto max-w-2xl text-left">
        <summary className="mx-auto w-fit cursor-pointer list-none rounded-full px-3 py-1.5 text-xs font-semibold text-ucl-star/60 transition hover:text-ucl-star [&::-webkit-details-marker]:hidden">
          About UCL FDR &amp; the fixture ticker{' '}
          <span aria-hidden="true" className="inline-block transition group-open:rotate-180">
            ▾
          </span>
        </summary>
        <div className="mt-3 space-y-3 text-xs leading-relaxed text-ucl-star/70">
          <div>
            <h2 className="font-semibold text-ucl-star">What is FDR, and what is a fixture ticker?</h2>
            <p>
              FDR is a fixture difficulty rating: every Champions League fixture coloured from 1 (very easy) to 5 (very
              hard). A fixture ticker lays those ratings out per team, matchday by matchday, so you can see at a glance
              which teams have a good run coming up. The FDR Table here is that ticker for all 36 teams, MD1–MD8.
            </p>
          </div>
          <div>
            <h2 className="font-semibold text-ucl-star">How do I compare two teams&apos; fixtures side by side?</h2>
            <p>
              In the{' '}
              <a href="#/table" onClick={(e) => goTo(e, 'table')} className={LINK}>
                FDR Table
              </a>
              , tap <strong className="font-semibold text-ucl-star">Compare</strong> and pick the teams: only they stay
              in the table, their fixtures lined up matchday by matchday, easiest run first. The link carries your
              pick, so you can share it.
            </p>
          </div>
          <div>
            <h2 className="font-semibold text-ucl-star">
              Which teams have the easiest fixtures over the next matchdays?
            </h2>
            <p>
              <a href="#/runs" onClick={(e) => goTo(e, 'runs')} className={LINK}>
                Best Runs
              </a>{' '}
              ranks every team by its average difficulty over the matchdays you choose, with home games and very hard
              fixtures as tiebreaks.
            </p>
          </div>
          <div>
            <h2 className="font-semibold text-ucl-star">How is difficulty calculated?</h2>
            <p>
              Every team has a 1–5 strength rating, taken by default from the bookmakers&apos; odds. A fixture takes
              the rating of the opponent, eased half a step at home and hardened half a step away, and you can change
              any rating in the Strength tab.
            </p>
          </div>
        </div>
      </details>

      <nav aria-label="Matchday pages" className="mt-3 text-[11px] text-ucl-muted">
        Matchday pages:{' '}
        {MATCHDAYS.map(({ md }, i) => (
          <span key={md}>
            {i > 0 && ' · '}
            <a href={`/md/${md}/`} className="transition hover:text-ucl-star">
              MD{md}
            </a>
          </span>
        ))}
      </nav>

      <a
        href="https://x.com/fpl_proleague"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-normal text-ucl-star/60 transition hover:text-ucl-star"
      >
        Made by @fpl_proleague
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
      {/* Muted, not the 25% white it was (about 2:1): this line now names
          whose marks are whose, so it has to be readable. */}
      <p className="mx-auto mt-2 max-w-xl text-[10px] leading-relaxed text-ucl-muted">
        Unofficial fan project. Not affiliated with, endorsed by or sponsored by UEFA. UEFA, Champions League and the
        UEFA Champions League marks are the property of UEFA. Club badges are the property of their respective clubs.
      </p>
    </footer>
  )
}
