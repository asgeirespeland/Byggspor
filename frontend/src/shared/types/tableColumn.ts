import type { ReactNode } from 'react'

/**
 * Column spec for the editable DataTable widget.
 * `editable` is optional — omit it for read-only columns.
 */
export interface EditableColumn<T> {
  header: string
  width?: string
  align?: 'left' | 'right'
  render: (row: T, index: number) => ReactNode
  editable?: {
    getValue: (row: T) => string
    type?: 'text' | 'number' | 'date'
    render?: (value: string, onChange: (v: string) => void) => ReactNode
  }
}

/**
 * Column spec for the read-only ReportDataTable widget.
 */
export interface DisplayColumn<T> {
  header: string
  align?: 'left' | 'right'
  render: (item: T) => ReactNode
}
