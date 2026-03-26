import { useState } from 'react'

export function useOverrides() {
  const [overrides, setOverrides] = useState<
    Record<string, { total_co2_kg: number }>
  >({})
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [pendingInputs, setPendingInputs] = useState<Record<string, string>>({})

  const startEdit = (idx: number) => {
    setEditingIdx(idx)
    const existing = overrides[String(idx)]?.total_co2_kg
    setEditValue(existing != null ? String(existing) : '')
  }

  const saveEdit = (idx: number) => {
    const val = parseFloat(editValue)
    if (isNaN(val)) return
    setOverrides((prev) => ({
      ...prev,
      [String(idx)]: { total_co2_kg: val },
    }))
    setEditingIdx(null)
    setEditValue('')
  }

  const cancelEdit = () => {
    setEditingIdx(null)
    setEditValue('')
  }

  const commitInlineInput = (idx: number) => {
    const raw = pendingInputs[String(idx)]
    const val = parseFloat(raw)
    if (isNaN(val)) return
    setOverrides((prev) => ({
      ...prev,
      [String(idx)]: { total_co2_kg: val },
    }))
    setPendingInputs((prev) => {
      const next = { ...prev }
      delete next[String(idx)]
      return next
    })
  }

  return {
    overrides,
    editingIdx,
    editValue,
    setEditValue,
    pendingInputs,
    setPendingInputs,
    startEdit,
    saveEdit,
    cancelEdit,
    commitInlineInput,
  }
}
