// Shared heading block. The page's single <h1> lives in the masthead
// (App.jsx) and names the product; each view's title is one level down as
// an <h2>, since it names a section of that product rather than the page.
//   tools:  small icon buttons (how it works, copy link), top right at
//           every width, so they're in the same spot on every tab
//   action: a labelled button beside them (Strength's Reset)
export default function ViewHeading({ title, subtitle, tools, action }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        {/* A step smaller on a phone, so the title keeps one line beside
            the tools. */}
        <h2 className="font-display text-[24px] font-extrabold leading-8 tracking-[-0.02em] sm:text-title">{title}</h2>
        {/* Hidden on phones: this line is orientation for a desktop visitor, but
            on a 390px screen it costs a row of actual fixtures above the fold.
            The meta line right above each table says what it shows. */}
        {subtitle && <p className="mt-1 hidden text-table text-ucl-star/60 sm:block">{subtitle}</p>}
      </div>
      {(tools || action) && (
        <div className="flex shrink-0 items-center gap-1.5">
          {action}
          {tools}
        </div>
      )}
    </div>
  )
}
