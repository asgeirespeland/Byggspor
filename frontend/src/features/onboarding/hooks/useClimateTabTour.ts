import { useState } from 'react'
import { TOUR_STEP_COUNT } from '../tourSteps'

export const CLIMATE_TOUR_STORAGE_KEY = 'byggspor_climate_tour_seen'

export function useClimateTabTour() {
  const [open, setOpen] = useState(
    () => localStorage.getItem(CLIMATE_TOUR_STORAGE_KEY) !== 'true',
  )
  const [step, setStep] = useState(0)

  function close() {
    localStorage.setItem(CLIMATE_TOUR_STORAGE_KEY, 'true')
    setOpen(false)
    setStep(0)
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

  function restart() {
    setStep(0)
    setOpen(true)
  }

  return { open, step, next, prev, close, restart }
}
