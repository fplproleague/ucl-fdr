export default function Footer() {
  return (
    <footer className="border-t border-white/10 px-4 py-5 text-center">
      <a
        href="https://x.com/fpl_proleague"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-normal text-ucl-star/60 transition hover:text-ucl-star"
      >
        Made by @fpl_proleague
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
      {/* Muted, not the 25% white it was (about 2:1): this line now names
          whose marks are whose, so it has to be readable. */}
      <p className="mx-auto mt-2 max-w-xl text-[10px] leading-relaxed text-ucl-muted">
        Unofficial fan project. Not affiliated with, endorsed by or sponsored by UEFA. UEFA, Champions League and the
        UEFA Champions League marks are the property of UEFA. Club badges are the property of their respective clubs.
      </p>
    </footer>
  )
}
