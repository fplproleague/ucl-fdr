// Shared heading block. The page's single <h1> lives in the masthead
// (App.jsx) and names the product; each view's title is one level down as
// an <h2>, since it names a section of that product rather than the page.
export default function ViewHeading({ title, subtitle, action }) {
  return (
    // Below sm the title has the row to itself and the controls go
    // underneath at full width. Sharing one 390px row, the 30px title wrapped
    // ("FDR / Table") and was squeezed against the buttons beside it.
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <div className="min-w-0">
        {/* The largest thing on the page, at every width now that it doesn't
            share its row on a phone. */}
        <h2 className="font-display text-title font-extrabold">{title}</h2>
        {/* Hidden on phones: this line is orientation for a desktop visitor, but
            on a 390px screen it costs a row of actual fixtures above the fold. */}
        {subtitle && <p className="mt-1 hidden text-table text-ucl-star/60 sm:block">{subtitle}</p>}
      </div>
      {action && <div className="sm:shrink-0">{action}</div>}
    </div>
  )
}
