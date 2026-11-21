import { useState } from 'react'
import { Check, Link2, SlidersHorizontal, X } from 'lucide-react'

// The parts every view's controls are built from, so the tabs line up:
//
//   heading     title, and on its right the small tools (how it works, copy link)
//   sub-tabs    when a view has two pages of its own (Odds: Teams / Players)
//   toolbar     the matchday range first, the view's own controls after it,
//               Options always last and on the right
//   chips       one per option that's changed from its default, each with
//               its own ✕, so nothing hidden behind Options is forgotten
//   meta row    right above the table: what it shows, and its key
//
// One height for everything you operate in the toolbar (40px), one gap (8px),
// and one look for a choice between a few things (the segmented rail).

// A choice between two to five things. The rail is a holder (8px corners),
// the segments are controls (4px).
export function Segmented({ label, options, value, onChange, className = '', stretch = false }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`flex h-10 shrink-0 rounded-lg border border-white/10 bg-white/[0.03] p-0.5 text-xs font-semibold ${className}`}
    >
      {options.map(({ id, label: text, title }) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          title={title}
          onClick={() => onChange(id)}
          className={`${stretch ? 'flex-1' : ''} whitespace-nowrap rounded px-3 transition ${
            value === id ? 'bg-ucl-select text-ucl-selectInk' : 'text-ucl-star/65 hover:bg-white/5 hover:text-ucl-star'
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  )
}

// Two pages of one view. Drawn as tabs under the heading, not as one more
// segmented control among the filters: it changes what the page is, not
// how a table is cut.
export function SubTabs({ label, options, value, onChange }) {
  return (
    <div role="tablist" aria-label={label} className="mb-3 flex gap-1 border-b border-white/10">
      {options.map(({ id, label: text }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={value === id}
          onClick={() => onChange(id)}
          className={`-mb-px min-h-[40px] border-b-2 px-3 text-sm font-semibold transition ${
            value === id ? 'border-ucl-select text-ucl-star' : 'border-transparent text-ucl-star/55 hover:text-ucl-star'
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  )
}

export function Toolbar({ children, className = '' }) {
  return <div className={`mb-2 flex flex-wrap items-center gap-2 ${className}`}>{children}</div>
}

// The small square tools beside a view's title.
export function IconButton({ label, onClick, pressed, controls, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      aria-controls={controls}
      className={`flex h-9 w-9 items-center justify-center rounded border transition sm:h-10 sm:w-10 ${
        pressed
          ? 'border-white/40 bg-white/10 text-ucl-star'
          : 'border-white/10 text-ucl-star/65 hover:bg-white/10 hover:text-ucl-star'
      }`}
    >
      {children}
    </button>
  )
}

// The whole view, as set, is in the link: range, filters, comparisons.
export function CopyLinkButton() {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard blocked (permissions, insecure context): nothing to show
    }
  }
  return (
    <IconButton label={copied ? 'Link copied' : 'Copy a link to this view'} onClick={copy}>
      {copied ? <Check size={16} aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
    </IconButton>
  )
}

export function OptionsButton({ open, onToggle, count, controls }) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={controls}
      onClick={onToggle}
      className={`ml-auto flex h-10 shrink-0 items-center gap-2 rounded border px-3 text-xs font-semibold transition ${
        open || count > 0
          ? 'border-white/40 bg-white/10 text-ucl-star'
          : 'border-white/10 text-ucl-star/75 hover:bg-white/10 hover:text-ucl-star'
      }`}
    >
      <SlidersHorizontal size={14} aria-hidden="true" />
      Options
      {count > 0 && (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded bg-ucl-select px-1 text-[11px] font-extrabold text-ucl-selectInk">
          {count}
          <span className="sr-only"> changed</span>
        </span>
      )}
    </button>
  )
}

// What sits behind Options: a grid of labelled tiles, one setting each.
export function OptionsPanel({ id, onClose, onReset, children }) {
  return (
    <div id={id} className="mb-3 rounded-lg border border-white/10 bg-ucl-deep/70 p-3 shadow-card">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
      <div className="mt-3 flex items-center justify-end gap-2">
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="min-h-[36px] rounded px-3 text-xs font-semibold text-ucl-star/70 transition hover:bg-white/10 hover:text-ucl-star"
          >
            Reset all
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="min-h-[36px] rounded bg-ucl-select px-4 text-xs font-semibold text-ucl-selectInk transition hover:bg-white/90"
        >
          Done
        </button>
      </div>
    </div>
  )
}

// One tile: a label, a line on what it does, and its control underneath.
export function OptionTile({ label, hint, children, wide = false }) {
  return (
    <div className={`rounded border border-white/10 bg-white/[0.02] p-2.5 ${wide ? 'sm:col-span-2' : ''}`}>
      <p className="text-xs font-semibold text-ucl-star">{label}</p>
      {hint && <p className="mt-0.5 text-meta text-ucl-muted">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  )
}

// An on/off tile: the switch sits beside its label, so the whole tile is the
// target.
export function SwitchTile({ label, hint, on, onChange, children }) {
  return (
    <div className="rounded border border-white/10 bg-white/[0.02] p-2.5">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className="flex w-full items-start gap-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-ucl-star">{label}</span>
          {hint && <span className="mt-0.5 block text-meta text-ucl-muted">{hint}</span>}
        </span>
        <span
          aria-hidden="true"
          className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition ${on ? 'bg-ucl-select' : 'bg-white/15'}`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${
              on ? 'left-[18px] bg-ucl-selectInk' : 'left-0.5 bg-ucl-star/80'
            }`}
          />
        </span>
      </button>
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}

// A select at the toolbar's size, for use inside a tile.
export function TileSelect({ label, value, onChange, children }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded border border-white/10 bg-ucl-deep px-2 text-sm font-semibold text-ucl-star"
    >
      {children}
    </select>
  )
}

// One chip per changed option. A chip with onRemove undoes it; one with only
// onClick opens where it's set (hidden teams, custom ratings).
export function ActiveChips({ chips, onClearAll }) {
  if (!chips.length) return null
  const removable = chips.filter((c) => c.onRemove).length
  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5" aria-label="Changed options">
      {chips.map((c) =>
        c.onRemove ? (
          <button
            key={c.key}
            type="button"
            onClick={c.onRemove}
            aria-label={`${c.label}: remove`}
            className="flex h-8 items-center gap-1.5 rounded border border-white/25 bg-white/[0.07] pl-2.5 pr-2 text-xs font-semibold text-ucl-star transition hover:bg-white/15"
          >
            {c.label}
            <X size={13} aria-hidden="true" className="text-ucl-star/60" />
          </button>
        ) : (
          <button
            key={c.key}
            type="button"
            onClick={c.onClick}
            className="flex h-8 items-center rounded border border-dashed border-white/25 px-2.5 text-xs font-semibold text-ucl-star/80 transition hover:bg-white/10 hover:text-ucl-star"
          >
            {c.label}
          </button>
        ),
      )}
      {removable > 1 && onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="flex h-8 items-center px-1.5 text-xs font-semibold text-ucl-link underline-offset-2 hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  )
}

// The line right above a table: what it shows on the left, its key on the
// right.
export function MetaRow({ children, aside }) {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-meta text-ucl-muted">
      <p className="min-w-0">{children}</p>
      {aside && <div className="flex items-center">{aside}</div>}
    </div>
  )
}
