import { useTeams } from '../context/TeamsContext.jsx'
import { DAY_LABEL } from './matchdaySplit.js'
import { OptionTile, Segmented, SwitchTile, TileSelect } from '../components/Toolbar.jsx'

// The options a fixture view shares: home/away, the day split, my teams,
// and leaving a matchday out. Returns the tiles for the panel, the chips for
// what's changed, and how to reset them, so a view adds its own and draws
// the lot.
// range: a view's own range and skipped matchday, in place of the shared ones.
export function useSharedOptions({ venue = false, split = false, myTeams = false, skip = true } = {}, range = null) {
  const ctx = useTeams()
  const { from, to, skipMd, setSkipMd } = range ?? ctx
  const {
    venueAdjust,
    setVenueAdjust,
    showMatchday,
    setShowMatchday,
    dayFilter,
    setDayFilter,
    availableDayOptions,
    myTeamsOnly,
    setMyTeamsOnly,
    pinnedCount,
  } = ctx
  const tiles = []
  const chips = []
  const resets = []

  if (myTeams) {
    tiles.push(
      <SwitchTile
        key="mine"
        label={`My teams only${pinnedCount ? ` (${pinnedCount})` : ''}`}
        hint={pinnedCount ? 'Just the teams you starred.' : 'Star a team (☆ in its row) to make it yours.'}
        on={myTeamsOnly}
        onChange={setMyTeamsOnly}
      />,
    )
    if (myTeamsOnly) {
      chips.push({ key: 'mine', label: 'My teams', onRemove: () => setMyTeamsOnly(false) })
      resets.push(() => setMyTeamsOnly(false))
    }
  }

  if (venue) {
    tiles.push(
      <SwitchTile
        key="venue"
        label="Home/away"
        hint="Away fixtures count as a little harder, home ones as easier."
        on={venueAdjust}
        onChange={setVenueAdjust}
      />,
    )
    if (!venueAdjust) {
      chips.push({ key: 'venue', label: 'Home/away off', onRemove: () => setVenueAdjust(true) })
      resets.push(() => setVenueAdjust(true))
    }
  }

  if (split) {
    tiles.push(
      <SwitchTile
        key="split"
        label="Matchday split"
        hint="Show the day each match is played, to plan around the Tuesday to Thursday deadline."
        on={showMatchday}
        onChange={setShowMatchday}
      >
        {showMatchday && availableDayOptions.length > 1 && (
          <Segmented
            label="Filter fixtures by day"
            value={dayFilter}
            onChange={setDayFilter}
            options={['ALL', ...availableDayOptions].map((d) => ({
              id: d,
              label: d === 'ALL' ? 'All' : DAY_LABEL[d].slice(0, 3),
              title: d === 'ALL' ? 'All days' : DAY_LABEL[d],
            }))}
          />
        )}
      </SwitchTile>,
    )
    if (showMatchday) {
      chips.push({ key: 'split', label: 'Matchday split', onRemove: () => setShowMatchday(false) })
      if (dayFilter !== 'ALL') chips.push({ key: 'day', label: DAY_LABEL[dayFilter], onRemove: () => setDayFilter('ALL') })
      resets.push(() => setShowMatchday(false), () => setDayFilter('ALL'))
    }
  }

  // Only a matchday strictly inside the range can be left out: leaving out
  // an edge one is the same as narrowing the range.
  const skippable = []
  for (let md = from + 1; md < to; md++) skippable.push(md)
  if (skip && (skippable.length > 0 || skipMd)) {
    tiles.push(
      <OptionTile
        key="skip"
        label="Ignore a matchday"
        hint="Leave one matchday out of every average, for example the week you play Limitless."
      >
        <TileSelect label="Ignore matchday" value={skipMd ?? ''} onChange={(v) => setSkipMd(v ? Number(v) : null)}>
          <option value="">None</option>
          {skippable.map((md) => (
            <option key={md} value={md}>
              MD{md}
            </option>
          ))}
        </TileSelect>
      </OptionTile>,
    )
  }
  if (skip && skipMd) {
    chips.push({ key: 'skip', label: `Ignoring MD${skipMd}`, onRemove: () => setSkipMd(null) })
    resets.push(() => setSkipMd(null))
  }

  return { tiles, chips, reset: () => resets.forEach((r) => r()) }
}
