import { useState } from 'react'

export const CLIMATE_TOUR_STORAGE_KEY = 'byggspor_climate_tour_seen'

export const TOUR_STEP_COUNT = 5

/**
 * Manages the climate tab tour state.
 *
 * The tour auto-opens on first mount if the user has not yet seen it
 * (i.e. the localStorage key is absent). Calling `complete()` or `skip()`
 * marks it as seen and closes the dialog. Calling `reset()` removes the
 * key so the tour will show again on the next project visit — intended for
 * use from the Settings page.
 */
export function useClimateTabTour() {
  const [open, setOpen] = useState(
    () => localStorage.getItem(CLIMATE_TOUR_STORAGE_KEY) !== 'true',
  )
  const [step, setStep] = useState(0)

  function close() {
    localStorage.setItem(CLIMATE_TOUR_STORAGE_KEY, 'true')
    setOpen(false)
  }

  function next() {
    if (step < TOUR_STEP_COUNT - 1) {
      setStep((s) => s + 1)
    } else {
      close()
    }
  }

  function prev() {
    setStep((s) => Math.max(0, s - 1))
  }

  return { open, step, next, prev, close }
}
