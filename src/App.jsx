import { useState } from 'react'
import { SlidersHorizontal, Table2, TrendingUp, GitCompareArrows } from 'lucide-react'
import { Analytics } from '@vercel/analytics/react'
import { TeamsProvider } from './context/TeamsContext.jsx'
import TeamStrengthSettings from './components/TeamStrengthSettings.jsx'
import FDRTable from './components/FDRTable.jsx'
import BestFixtureRuns from './components/BestFixtureRuns.jsx'
import CompareTeams from './components/CompareTeams.jsx'
import Footer from './components/Footer.jsx'
import uclLogo from './assets/brand/UCL.png'

const TABS = [
  { id: 'table', label: 'FDR Table', icon: Table2, Component: FDRTable },
  { id: 'runs', label: 'Best Runs', icon: TrendingUp, Component: BestFixtureRuns },
  { id: 'compare', label: 'Compare', icon: GitCompareArrows, Component: CompareTeams },
  { id: 'settings', label: 'Strength', icon: SlidersHorizontal, Component: TeamStrengthSettings },
]

export default function App() {
  const [tab, setTab] = useState('table')
  const Active = TABS.find((t) => t.id === tab).Component

  return (
    <TeamsProvider>
      <div className="flex min-h-screen flex-col pb-20 sm:pb-0">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-ucl-navy/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center gap-2.5 px-3 py-3 sm:px-4">
            <img src={uclLogo} alt="UCL" className="h-9 w-9 shrink-0 object-contain" />
            <div>
              <h1 className="font-display text-base font-extrabold uppercase tracking-wide sm:text-lg">UCL FDR</h1>
              <p className="text-[11px] text-ucl-star/50 sm:text-xs">Fixture Difficulty Rating</p>
            </div>

            <nav className="ml-auto hidden gap-1 sm:flex">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                    tab === id ? 'bg-ucl-accent text-white shadow-card' : 'text-ucl-star/60 hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1">
          <Active />
        </main>

        <Footer />

        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-ucl-navy/95 backdrop-blur-md sm:hidden">
          <div className="mx-auto flex max-w-6xl">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${
                  tab === id ? 'text-ucl-accent' : 'text-ucl-star/50'
                }`}
              >
                <Icon size={20} />
                {label}
              </button>
            ))}
          </div>
        </nav>
      </div>
      <Analytics />
    </TeamsProvider>
  )
}
