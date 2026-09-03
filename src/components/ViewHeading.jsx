// Shared heading block. The page's single <h1> lives in the masthead
// (App.jsx) and names the product; each view's title is one level down as
// an <h2>, since it names a section of that product rather than the page.
export default function ViewHeading({ title, subtitle, action }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h2>
        {/* Hidden on phones: this line is orientation for a desktop visitor, but
            on a 390px screen it costs a row of actual fixtures above the fold. */}
        {subtitle && <p className="mt-0.5 hidden text-sm text-ucl-star/60 sm:block">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
