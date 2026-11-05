import { SlidersHorizontal, Calendar, TrendingUp, Repeat, Users, Percent } from 'lucide-react'
import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { TeamsProvider, useTeams } from './context/TeamsContext.jsx'
import FDRTable from './components/FDRTable.jsx'
import Footer from './components/Footer.jsx'
import uclLogo from './assets/brand/UCL-icon.png'
import { PLAYERS_SHEET_URL } from './utils/useLivePlayers.js'

// The FDR table is the landing view and ships in the first chunk. The other
// five load when they are first opened (or straight away when a link lands
// on one), so a first visit doesn't download all seven views up front.
const LOADERS = {
  runs: () => import('./components/BestFixtureRuns.jsx'),
  gk: () => import('./components/GkRotation.jsx'),
  players: () => import('./components/PlayerProjections.jsx'),
  odds: () => import('./components/OddsView.jsx'),
  strength: () => import('./components/TeamStrengthSettings.jsx'),
  // Not a view: the team panel, which the FDR table opens on a tap.
  teamPanel: () => import('./components/TeamDetailPanel.jsx'),
}
const BestFixtureRuns = lazy(LOADERS.runs)
const GkRotation = lazy(LOADERS.gk)
const PlayerProjections = lazy(LOADERS.players)
const OddsView = lazy(LOADERS.odds)
const TeamStrengthSettings = lazy(LOADERS.strength)

// Players comes second: fixtures joined to form, price and ownership is the
// thing no other free UCL tool does well, so it sits right after the table.
const TABS = [
  { id: 'table', label: 'FDR Table', short: 'FDR', icon: Calendar, Component: FDRTable },
  { id: 'players', label: 'Players', icon: Users, Component: PlayerProjections },
  { id: 'runs', label: 'Best Runs', short: 'Runs', icon: TrendingUp, Component: BestFixtureRuns },
  { id: 'gk', label: 'GK Rotation', short: 'GK', icon: Repeat, Component: GkRotation },
  { id: 'odds', label: 'Odds', icon: Percent, Component: OddsView },
  { id: 'strength', label: 'Strength', icon: SlidersHorizontal, Component: TeamStrengthSettings },
]

// The Players tab joins the nav once a player sheet is configured. Until
// then it's only reachable by its link (#/players, or #/players?demo=1 to
// preview it with made-up players), so the menu doesn't advertise an empty
// page.
const PLAYERS_OPEN = PLAYERS_SHEET_URL != null

function Shell() {
  const { tab, setTab } = useTeams()
  // The site header's height as --header-h, for the sticky table headers
  // that sit right under it.
  const headerRef = useRef(null)
  // Once the page is scrolled the tagline goes, so the sticky bar is just the
  // mark, the title and the nav. The header's height changes with it, which
  // the observer below already passes on to the sticky table heads. Two
  // thresholds, so the line can't flicker: hiding it shortens the page by
  // its height (~14px), which must not drop scrollY back under the point
  // where it returns.
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const el = headerRef.current
    if (!el) return undefined
    const set = () => document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`)
    set()
    const observer = new ResizeObserver(set)
    observer.observe(el)
    const onScroll = () => setScrolled((was) => (was ? window.scrollY > 4 : window.scrollY > 40))
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])
  // Once the first view is up and the browser is idle, fetch the rest, so a
  // tab opened later doesn't wait on the network. It costs the same bytes as
  // before, just after first paint instead of before it.
  useEffect(() => {
    const warm = () => Object.values(LOADERS).forEach((load) => load().catch(() => {}))
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(warm, { timeout: 4000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = setTimeout(warm, 2000)
    return () => clearTimeout(id)
  }, [])
  const Active = (TABS.find((t) => t.id === tab) ?? TABS[0]).Component
  const tabs = TABS.filter((t) => t.id !== 'players' || PLAYERS_OPEN || tab === 'players')

  // Real <a href="#/id"> links now (the site had zero internal links before),
  // but role="tab" means they must keep behaving like the buttons they
  // replaced: activate on click, and — since anchors, unlike buttons, don't
  // natively respond to Space — activate on Space too.
  function goToTab(e, id) {
    e.preventDefault()
    setTab(id)
  }
  function onTabKeyDown(e, id) {
    if (e.key === ' ') {
      e.preventDefault()
      setTab(id)
    }
  }

  return (
    <div className="flex min-h-screen flex-col pb-[4.5rem] sm:pb-0">
      <header ref={headerRef} className="sticky top-0 z-30 border-b border-white/10 bg-ucl-navy/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-2.5 px-3 py-2 sm:px-4 sm:py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white p-1 shadow-card sm:h-11 sm:w-11 sm:p-1.5">
            <img src={uclLogo} alt="" width="44" height="44" className="h-full w-full object-contain" />
          </span>
          <div className="min-w-0">
            {/* No text-transform here: it would only change how this renders, but
                keeping the DOM's actual text ("UCL Fantasy FDR") is what a crawler
                (or an automated check for that exact string) reads either way. */}
            <h1 className="whitespace-nowrap font-display text-sm font-extrabold leading-tight tracking-wide sm:text-base md:text-lg">
              UCL Fantasy FDR
            </h1>
            {/* The og:title's line, which was better than the one here. The
                old one was clipped at every width tested. This one is short
                enough to fit beside the full nav, so it isn't truncated: it is
                left out at 640-767px, where the nav leaves it no room, and
                once the page scrolls. */}
            <p
              className={`whitespace-nowrap text-meta text-ucl-muted sm:hidden md:block ${scrolled ? '!hidden' : ''}`}
            >
              Every Champions League fixture, ranked.
            </p>
          </div>

          <nav aria-label="Views" className="ml-auto hidden gap-1 sm:flex" role="tablist">
            {/* Text only. Seven unambiguous words don't need a glyph each; the
                icons stay in the phone bar below, where they do replace text. */}
            {tabs.map(({ id, label, short }) => (
              <a
                key={id}
                href={`#/${id}`}
                role="tab"
                aria-selected={tab === id}
                onClick={(e) => goToTab(e, id)}
                onKeyDown={(e) => onTabKeyDown(e, id)}
                title={label}
                className={`flex min-h-[40px] items-center whitespace-nowrap rounded px-1.5 text-table font-semibold transition md:px-2 lg:px-3 lg:text-sm ${
                  tab === id ? 'bg-ucl-select text-ucl-selectInk' : 'text-ucl-star/60 hover:bg-white/5'
                }`}
              >
                {/* The full labels don't fit beside the title on a tablet (the
                    title was wrapping onto three lines at 768px), so up to lg
                    the tabs use the short forms the phone bar uses. The hidden
                    span is display:none, so the accessible name is whichever
                    one shows. */}
                <span className="lg:hidden">{short ?? label}</span>
                <span className="hidden lg:inline">{label}</span>
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Suspense fallback={<ViewLoading />}>
          <Active />
        </Suspense>
      </main>

      <Footer />

      <nav
        aria-label="Views"
        role="tablist"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-ucl-navy/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
      >
        <div className="mx-auto flex max-w-6xl">
          {/* Seven tabs across a phone: the long labels get a short form
              (the full one stays as the accessible name). */}
          {tabs.map(({ id, label, short, icon: Icon }) => (
            <a
              key={id}
              href={`#/${id}`}
              role="tab"
              aria-selected={tab === id}
              aria-label={label}
              onClick={(e) => goToTab(e, id)}
              onKeyDown={(e) => onTabKeyDown(e, id)}
              className={`relative flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition ${
                tab === id ? 'text-ucl-select' : 'text-ucl-star/60'
              }`}
            >
              {/* The active tab is marked by a white rule along the bar's top
                  edge as well as its colour: white against the inactive
                  tabs' 60% white is too small a step to carry it alone. */}
              {tab === id && <span aria-hidden="true" className="absolute inset-x-3 top-0 h-0.5 bg-ucl-select" />}
              <Icon size={20} aria-hidden="true" />
              <span aria-hidden="true">{short ?? label}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  )
}

// Shown for the moment a view's code is on its way. Min-height keeps the
// footer from jumping up and back while it loads.
function ViewLoading() {
  return (
    <p role="status" className="mx-auto min-h-[60vh] max-w-6xl px-4 pt-10 text-center text-sm text-ucl-muted">
      Loading…
    </p>
  )
}

// Vercel Analytics counts pages by path, and the whole app is one path with
// the view in the hash — so every tab (and the Odds tab's Teams/Players
// view) is reported as a page of its own: /table, /odds/players, … A
// pageview goes out whenever that changes, never for a filter or a search.
function TrackedAnalytics() {
  const { tab, oddsView } = useTeams()
  const page = tab === 'odds' ? `/odds/${oddsView}` : `/${tab}`
  return <Analytics route={page} path={page} />
}

export default function App() {
  return (
    <TeamsProvider>
      <Shell />
      <TrackedAnalytics />
    </TeamsProvider>
  )
}
