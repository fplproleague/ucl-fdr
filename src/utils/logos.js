// Eagerly import every club badge so components can look one up by abbreviation.
const modules = import.meta.glob('../assets/logos/*.svg', { eager: true, query: '?url', import: 'default' })

export const LOGOS = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => {
    const abbr = path.split('/').pop().replace('.svg', '')
    return [abbr, url]
  }),
)
