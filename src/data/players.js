// Player database FALLBACK for the knockout projections — shown when the
// live sheet can't be reached and while it loads (the live path is
// src/utils/useLivePlayers.js). Empty until the sheet is set up; then
// scripts/build-players.mjs refreshes it on every deploy, like the GK one.
export const PLAYERS = []
