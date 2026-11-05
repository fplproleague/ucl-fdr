// Copies the visit's utm_* parameters (from location.search) onto an
// analytics event URL that doesn't already carry them.
//
// Vercel Web Analytics reads UTM parameters from the URL it reports, but this
// app reports a virtual path per tab (/table, /compare, …) because the real
// view lives in the hash. This makes sure a shared link like
// /?utm_source=x&utm_medium=social#/table still lands in the UTM report.
// Parameters already on the URL are left as they are, so it's a no-op when
// the analytics script keeps the query string itself.
export function keepUtmParams(url, search, base) {
  const utm = [...new URLSearchParams(search)].filter(([key]) => key.startsWith('utm_'))
  if (!utm.length || !url) return url
  try {
    const out = new URL(url, base)
    let changed = false
    for (const [key, value] of utm) {
      if (out.searchParams.has(key)) continue
      out.searchParams.set(key, value)
      changed = true
    }
    return changed ? out.toString() : url
  } catch {
    return url
  }
}
