import React from 'react'
import './reusable-table.scss'

export type TableColumn<T> = {
  key: string
  label: string
  hasTooltip?: boolean
  tooltip?: string
  value: (row: T) => string
  className?: string
}

export type TableAction<T> = {
  id: string
  label: string
  variant?: string
  disabled?: (row: T) => boolean
  visible?: (row: T) => boolean
  onClick: (row: T) => void
}

type Props<T> = {
  rows: T[]
  columns: TableColumn<T>[]
  actions?: TableAction<T>[]
  emptyMessage?: string
}

export default function ReusableTable<T>({
  rows,
  columns,
  actions = [],
  emptyMessage = 'No records available for the selected filter.',
}: Props<T>) {
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            {columns.map((column) => (
              <th key={column.key}>
                {column.label}
                {column.hasTooltip && column.tooltip && (
                  <span className="text-primary ms-2" title={column.tooltip}>
                    <i className="fa-solid fa-info-circle text-info" />
                  </span>
                )}
              </th>
            ))}
            {actions.length > 0 && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column) => (
                <td key={column.key} className={column.className}>
                  {column.value(row)}
                </td>
              ))}
              {actions.length > 0 && (
                <td>
                  <div className="d-flex flex-wrap gap-2">
                    {actions.map((action) =>
                      (!action.visible || action.visible(row)) ? (
                        <button
                          key={action.id}
                          type="button"
                          className={`btn btn-sm ${action.variant ? 'btn-' + action.variant : 'btn-outline-primary'}`}
                          disabled={action.disabled?.(row)}
                          onClick={() => action.onClick(row)}
                        >
                          {action.label}
                        </button>
                      ) : null,
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + (actions.length ? 1 : 0)} className="text-center text-muted py-4">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
