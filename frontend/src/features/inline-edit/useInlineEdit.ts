import { useCallback, useState } from 'react'

export function useInlineEdit<T>(initialValue: T) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState<T>(initialValue)

  const startEdit = useCallback((init: T) => {
    setValue(init)
    setEditing(true)
  }, [])

  const cancelEdit = useCallback(() => {
    setEditing(false)
  }, [])

  return { editing, value, setValue, startEdit, cancelEdit, setEditing }
}
