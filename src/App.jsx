import { useState } from 'react'
import { SlidersHorizontal, Table2, TrendingUp, GitCompareArrows } from 'lucide-react'
import { TeamsProvider } from './context/TeamsContext.jsx'
import TeamStrengthSettings from './components/TeamStrengthSettings.jsx'
import FDRTable from './components/FDRTable.jsx'
import BestFixtureRuns from './components/BestFixtureRuns.jsx'
import CompareTeams from './components/CompareTeams.jsx'

const TABS = [
  { id: 'table', label: 'FDR-tabel', icon: Table2, Component: FDRTable },
  { id: 'runs', label: 'Beste runs', icon: TrendingUp, Component: BestFixtureRuns },
  { id: 'compare', label: 'Vergelijk', icon: GitCompareArrows, Component: CompareTeams },
  { id: 'settings', label: 'Sterkte', icon: SlidersHorizontal, Component: TeamStrengthSettings },
]

export default function App() {
  const [tab, setTab] = useState('table')
  const Active = TABS.find((t) => t.id === tab).Component

  return (
    <TeamsProvider>
      <div className="flex min-h-screen flex-col pb-20 sm:pb-0">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-ucl-navy/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center gap-2.5 px-3 py-3 sm:px-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-ucl-accent to-ucl-indigo shadow-card">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                <path d="M12 1.5l2.9 6.02 6.6.83-4.83 4.62 1.23 6.53L12 16.3l-5.9 3.2 1.23-6.53L2.5 8.35l6.6-.83L12 1.5z" />
              </svg>
            </div>
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
    </TeamsProvider>
  )
}
