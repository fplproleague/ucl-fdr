import { useEffect } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])'

// What a modal dialog owes keyboard users beyond Escape and a first focus:
// Tab and Shift+Tab cycle inside it instead of walking off into the page
// behind (aria-modal tells a screen reader that page is out of play; this
// makes the keyboard agree), and on close focus goes back to whatever
// opened it — the team's row — rather than to the top of the document.
//   ref: the dialog element
export function useDialogFocus(ref) {
  useEffect(() => {
    const opener = document.activeElement
    function onKeyDown(e) {
      const dialog = ref.current
      if (e.key !== 'Tab' || !dialog) return
      const items = [...dialog.querySelectorAll(FOCUSABLE)].filter((el) => el.getClientRects().length > 0)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      const inside = dialog.contains(document.activeElement)
      if (e.shiftKey && (!inside || document.activeElement === first)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      // Only if it's still on the page and nothing else took focus meanwhile.
      if (opener instanceof HTMLElement && opener.isConnected && opener !== document.body) {
        opener.focus({ preventScroll: true })
      }
    }
  }, [ref])
}
