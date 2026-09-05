import { SlidersHorizontal, Calendar, TrendingUp, Scale, Repeat } from 'lucide-react'
import { Analytics } from '@vercel/analytics/react'
import { TeamsProvider, useTeams } from './context/TeamsContext.jsx'
import TeamStrengthSettings from './components/TeamStrengthSettings.jsx'
import FDRTable from './components/FDRTable.jsx'
import BestFixtureRuns from './components/BestFixtureRuns.jsx'
import CompareTeams from './components/CompareTeams.jsx'
import GkRotation from './components/GkRotation.jsx'
import Footer from './components/Footer.jsx'
import uclLogo from './assets/brand/UCL-icon.png'

const TABS = [
  { id: 'table', label: 'FDR Table', icon: Calendar, Component: FDRTable },
  { id: 'runs', label: 'Best Runs', icon: TrendingUp, Component: BestFixtureRuns },
  { id: 'compare', label: 'Compare', icon: Scale, Component: CompareTeams },
  { id: 'gk', label: 'GK Rotation', icon: Repeat, Component: GkRotation },
  { id: 'strength', label: 'Strength', icon: SlidersHorizontal, Component: TeamStrengthSettings },
]

function Shell() {
  const { tab, setTab } = useTeams()
  const Active = (TABS.find((t) => t.id === tab) ?? TABS[0]).Component

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
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ucl-navy/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-2.5 px-3 py-2 sm:px-4 sm:py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white p-1 shadow-card sm:h-11 sm:w-11 sm:p-1.5">
            <img src={uclLogo} alt="" width="44" height="44" className="h-full w-full object-contain" />
          </span>
          <div className="min-w-0">
            {/* No text-transform here: it would only change how this renders, but
                keeping the DOM's actual text ("UCL Fantasy FDR") is what a crawler
                (or an automated check for that exact string) reads either way. */}
            <h1 className="font-display text-sm font-extrabold leading-tight tracking-wide sm:text-lg">
              UCL Fantasy FDR
            </h1>
            <p className="truncate text-[11px] leading-tight text-ucl-muted sm:text-xs">
              Champions League fixture difficulty, MD1–MD8 — all 36 teams, ratings you control.
            </p>
          </div>

          <nav aria-label="Views" className="ml-auto hidden gap-1 sm:flex" role="tablist">
            {TABS.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`#/${id}`}
                role="tab"
                aria-selected={tab === id}
                onClick={(e) => goToTab(e, id)}
                onKeyDown={(e) => onTabKeyDown(e, id)}
                className={`flex min-h-[40px] items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition ${
                  tab === id ? 'bg-ucl-accent text-white shadow-card' : 'text-ucl-star/60 hover:bg-white/5'
                }`}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Active />
      </main>

      <Footer />

      <nav
        aria-label="Views"
        role="tablist"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-ucl-navy/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
      >
        <div className="mx-auto flex max-w-6xl">
          {TABS.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#/${id}`}
              role="tab"
              aria-selected={tab === id}
              onClick={(e) => goToTab(e, id)}
              onKeyDown={(e) => onTabKeyDown(e, id)}
              className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition ${
                tab === id ? 'text-ucl-accent' : 'text-ucl-star/60'
              }`}
            >
              <Icon size={20} aria-hidden="true" />
              {label}
            </a>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <TeamsProvider>
      <Shell />
      <Analytics />
    </TeamsProvider>
  )
}
