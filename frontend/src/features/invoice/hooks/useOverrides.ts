import React, { useReducer } from 'react'

type OverrideState = {
  overrides: Record<string, { total_co2_kg: number }>
  editingIdx: number | null
  editValue: string
  pendingInputs: Record<string, string>
}

type Action =
  | { type: 'START_EDIT'; idx: number; value: string }
  | { type: 'SET_EDIT_VALUE'; value: string }
  | { type: 'SAVE_EDIT'; idx: number; co2: number }
  | { type: 'CANCEL_EDIT' }
  | { type: 'SET_PENDING_INPUTS'; value: Record<string, string> }
  | { type: 'COMMIT_INLINE'; idx: number; co2: number }

const INITIAL_STATE: OverrideState = {
  overrides: {},
  editingIdx: null,
  editValue: '',
  pendingInputs: {},
}

function reducer(state: OverrideState, action: Action): OverrideState {
  switch (action.type) {
    case 'START_EDIT':
      return { ...state, editingIdx: action.idx, editValue: action.value }
    case 'SET_EDIT_VALUE':
      return { ...state, editValue: action.value }
    case 'SAVE_EDIT':
      return {
        ...state,
        overrides: {
          ...state.overrides,
          [String(action.idx)]: { total_co2_kg: action.co2 },
        },
        editingIdx: null,
        editValue: '',
      }
    case 'CANCEL_EDIT':
      return { ...state, editingIdx: null, editValue: '' }
    case 'SET_PENDING_INPUTS':
      return { ...state, pendingInputs: action.value }
    case 'COMMIT_INLINE': {
      const next = { ...state.pendingInputs }
      delete next[String(action.idx)]
      return {
        ...state,
        overrides: {
          ...state.overrides,
          [String(action.idx)]: { total_co2_kg: action.co2 },
        },
        pendingInputs: next,
      }
    }
  }
}

export function useOverrides() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)

  const startEdit = (idx: number) => {
    const existing = state.overrides[String(idx)]?.total_co2_kg
    dispatch({
      type: 'START_EDIT',
      idx,
      value: existing != null ? String(existing) : '',
    })
  }

  const saveEdit = (idx: number) => {
    const val = parseFloat(state.editValue)
    if (isNaN(val)) return
    dispatch({ type: 'SAVE_EDIT', idx, co2: val })
  }

  const cancelEdit = () => dispatch({ type: 'CANCEL_EDIT' })

  const setEditValue = (value: string) =>
    dispatch({ type: 'SET_EDIT_VALUE', value })

  const setPendingInputs: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  > = (updater) => {
    const next =
      typeof updater === 'function' ? updater(state.pendingInputs) : updater
    dispatch({ type: 'SET_PENDING_INPUTS', value: next })
  }

  const commitInlineInput = (idx: number) => {
    const raw = state.pendingInputs[String(idx)]
    const val = parseFloat(raw)
    if (isNaN(val)) return
    dispatch({ type: 'COMMIT_INLINE', idx, co2: val })
  }

  return {
    overrides: state.overrides,
    editingIdx: state.editingIdx,
    editValue: state.editValue,
    setEditValue,
    pendingInputs: state.pendingInputs,
    setPendingInputs,
    startEdit,
    saveEdit,
    cancelEdit,
    commitInlineInput,
  }
}
