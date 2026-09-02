// Club badges render between 20px and 32px, so they ship as 96px WebP —
// crisp on a 3x phone, and every file is under 7 KB.
//
// The original vector art stays in src/assets/logos/*.svg as the source of
// truth. It is deliberately NOT imported: those files total ~490 KB, with a
// single crest reaching 31 KB gzipped for a badge drawn at 20 pixels.
const modules = import.meta.glob('../assets/badges/*.webp', { eager: true, query: '?url', import: 'default' })

export const LOGOS = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => {
    const abbr = path.split('/').pop().replace('.webp', '')
    return [abbr, url]
  }),
)
