export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-5 text-center">
      <a
        href="https://x.com/fpl_proleague"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ucl-star/50 transition hover:text-ucl-star/80"
      >
        Made by @fpl_proleague
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
    </footer>
  )
}
