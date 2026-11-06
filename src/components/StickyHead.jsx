import { useEffect, useRef, useState } from 'react'

// A long table's header row, kept in view under the site header while the
// table scrolls past — one slim row, nothing else.
//
// The tables scroll sideways in their own box (overflow-x), and a box like
// that can't let `position: sticky` stick to the page, so the row is drawn
// a second time here: a zero-height sticky strip above the table, holding a
// copy of the header that appears once the real one has scrolled under the
// site header, with the real columns' widths and following the table's
// sideways scroll. The copy is aria-hidden; buttons in it (sorting) work.
//   scrollerRef: the table's overflow box; tableRef: the <table>
//   children: the header <tr>, the same element the real <thead> renders
export default function StickyHead({ scrollerRef, tableRef, children, className = '' }) {
  const innerRef = useRef(null)
  const [show, setShow] = useState(false)
  const [cols, setCols] = useState({ widths: [], total: 0 })

  // Visible while the table's top is above the site header and enough of
  // the table is left below it to be worth labelling.
  useEffect(() => {
    const update = () => {
      const table = tableRef.current
      const head = table?.tHead
      if (!table || !head) return
      const top = document.querySelector('header')?.offsetHeight ?? 0
      const rect = table.getBoundingClientRect()
      setShow(rect.top < top && rect.bottom > top + head.offsetHeight * 2.5)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [tableRef])

  // The real header cells' widths, kept up to date — each cell watched, so
  // a column that animates narrower (the FDR table's team column) is
  // followed too. Cells hidden at this width (display: none) are hidden in
  // the copy as well, so they're left out of the column list.
  useEffect(() => {
    const table = tableRef.current
    const row = table?.tHead?.rows[0]
    if (!row) return undefined
    const measure = () => {
      const visible = [...row.cells].filter((c) => c.getClientRects().length > 0)
      setCols({ widths: visible.map((c) => c.getBoundingClientRect().width), total: table.getBoundingClientRect().width })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(table)
    for (const cell of row.cells) observer.observe(cell)
    return () => observer.disconnect()
  }, [tableRef, children])

  // Sideways in step with the table.
  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return undefined
    const sync = () => {
      if (innerRef.current) innerRef.current.scrollLeft = scroller.scrollLeft
    }
    sync()
    scroller.addEventListener('scroll', sync, { passive: true })
    return () => scroller.removeEventListener('scroll', sync)
  }, [scrollerRef, show])

  return (
    <div className="sticky z-20 h-0" style={{ top: 'var(--header-h, 0px)' }} aria-hidden="true">
      <div
        ref={innerRef}
        className={`absolute inset-x-0 top-0 overflow-hidden border-b border-white/10 shadow-card transition-opacity duration-150 ${
          show ? 'opacity-100' : 'pointer-events-none invisible opacity-0'
        } ${className}`}
      >
        <table className="border-separate border-spacing-0 text-table" style={{ tableLayout: 'fixed', width: cols.total || undefined }}>
          <colgroup>
            {cols.widths.map((w, i) => (
              <col key={i} style={{ width: w }} />
            ))}
          </colgroup>
          <thead>{children}</thead>
        </table>
      </div>
    </div>
  )
}
