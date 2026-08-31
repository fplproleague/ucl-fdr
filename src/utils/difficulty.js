import { RATING_COLORS } from '../data/teams.js'

export function ratingColor(rating) {
  return RATING_COLORS[rating] ?? RATING_COLORS[3]
}

export function formatAvg(avg) {
  return avg.toFixed(2)
}
