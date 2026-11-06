// The @fpl_proleague mark: the "F" from the owner's own app icon (the
// teal-on-dark squircle used across fplproleague's tools), redrawn as two
// paths on its original 390-unit grid from app-icon-mark.png in the
// jpl-fdr-tool repo. It replaces the UEFA starball, which is UEFA's
// trademark and doesn't belong in this site's own identity (header,
// favicon, share card): the club crests in the tables are a different,
// referential use and stay.
//
// In the header it is monochrome (currentColor, white there), so it sits in
// the navy / white / brass palette; the full-colour teal version is the
// favicon (public/favicon.svg) and the share card.
export default function BrandMark({ className = '' }) {
  return (
    <svg viewBox="80 80 230 230" className={className} aria-hidden="true" focusable="false">
      <path d="M121 108H278V140H143V292H111V118A10 10 0 0 1 121 108Z" fill="currentColor" />
      <path d="M158 183H263V216H158Z" fill="currentColor" />
    </svg>
  )
}
