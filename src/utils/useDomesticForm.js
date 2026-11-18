import { useEffect, useState } from 'react'

// The saved domestic form (src/data/domesticForm.js), loaded only when the
// Players tab opens, like the player sheet's saved copy.
export function useDomesticForm() {
  const [form, setForm] = useState(null)
  useEffect(() => {
    let cancelled = false
    import('../data/domesticForm.js').then(({ DOMESTIC_FORM }) => {
      if (!cancelled) setForm(DOMESTIC_FORM)
    })
    return () => {
      cancelled = true
    }
  }, [])
  return form
}
