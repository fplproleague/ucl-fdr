// Always-rendered prose, not a modal or a collapsible panel — a crawler has to
// see the words "Fantasy", "Champions League" and "fixture difficulty" without
// clicking anything. It sits below the grid on purpose: the mobile fold budget
// for the first fixture row is fought-for real estate (see FixtureGrid), and
// prose above it would spend that budget on text instead of data.
//
// Every factual claim here is checked against the code it describes:
// - 36 teams, MD1-8: src/data/teams.js (36 entries) and TOTAL_MATCHDAYS.
// - Home/away half-step and Strength-tab override: src/utils/difficulty.js
//   and RATING_METHOD in src/data/teams.js — this paragraph exists so that
//   information is on the page even before anyone opens the collapsible
//   "How difficulty works" panel.
// - 4 home / 4 away per team: verified comment at the top of
//   src/data/fixtures.js ("all 36 teams play 8 matches (4 home, 4 away)").
// - Two transfers per matchday with one rollover: UEFA's own 2026/27 rules
//   (fantasy.uefa.com), not something this codebase can verify — checked
//   separately rather than assumed.
export default function AboutFdr() {
  return (
    <section aria-labelledby="about-heading" className="mt-6 space-y-4 text-sm leading-relaxed text-ucl-star/80">
      <h2 id="about-heading" className="sr-only">
        About UCL Fantasy FDR
      </h2>

      <div>
        <h3 className="font-display text-base font-bold text-ucl-star">What this tool does</h3>
        <p className="mt-1">
          UCL Fantasy FDR ranks the fixture difficulty of all 36 teams in the Champions League league phase, from
          Matchday 1 through Matchday 8. Every fixture is coloured and scored 1–5 based on the strength of the
          opponent you face, so you can see at a glance which teams have a run worth buying into.
        </p>
      </div>

      <div>
        <h3 className="font-display text-base font-bold text-ucl-star">How difficulty is calculated</h3>
        <p className="mt-1">
          Every team starts on a 1–5 strength rating that&apos;s yours to override — a fixture takes the difficulty
          of the opponent you face, not of the team playing it. Home ties are eased by half a step and away ties
          hardened by half a step, which shifts most fixtures one colour band; switch that off with the Home/away
          toggle. Change a rating in the Strength tab and the table, the fixture runs and the comparison all
          recalculate live.
        </p>
      </div>

      <div>
        <h3 className="font-display text-base font-bold text-ucl-star">Why the range picker matters</h3>
        <p className="mt-1">
          UCL Fantasy gives you two transfers per matchday with one rollover, so the next three or four matchdays
          are usually the only window you can actually act on. Over the full MD1–MD8 range the home/away adjustment
          nets out, because every team plays exactly four home and four away — it changes individual
          fixtures, not the season-long ranking. Over a shorter window, where the split is uneven, it moves the
          averages.
        </p>
      </div>

      <p className="text-xs text-ucl-muted">Fixtures are taken from the official 2026/27 league phase draw.</p>
    </section>
  )
}
