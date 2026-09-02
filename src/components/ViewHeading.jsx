// Shared heading block. Each view owns the page's single <h1> — the site name
// in the masthead used to be a second one, which left screen readers with two
// competing titles on every screen.
export default function ViewHeading({ title, subtitle, action }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h1>
        {/* Hidden on phones: this line is orientation for a desktop visitor, but
            on a 390px screen it costs a row of actual fixtures above the fold. */}
        {subtitle && <p className="mt-0.5 hidden text-sm text-ucl-star/60 sm:block">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
