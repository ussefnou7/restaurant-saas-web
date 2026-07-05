import type {
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  ThHTMLAttributes,
  TdHTMLAttributes,
  TableHTMLAttributes,
} from 'react'

export function DataTable({ className = '', children, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table className={`data-table data-table--compact${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </table>
  )
}

export function TableHead({ children }: { children: ReactNode }) {
  return <thead className="data-table__head">{children}</thead>
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="data-table__body">{children}</tbody>
}

export function TableRow({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <tr className={`data-table__row${className ? ` ${className}` : ''}`}>{children}</tr>
  )
}

interface ClickableTableRowProps {
  children: ReactNode
  onClick: () => void
  selected?: boolean
}

export function ClickableTableRow({ children, onClick, selected }: ClickableTableRowProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <tr
      className={`data-table__row data-table__row--clickable${selected ? ' data-table__row--selected' : ''}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
    >
      {children}
    </tr>
  )
}

export function StopPropagationCell({
  children,
  className = '',
  column = 'default',
  cellAlign = 'start',
}: {
  children: ReactNode
  className?: string
  column?: 'entity' | 'status' | 'date' | 'default'
  cellAlign?: 'start' | 'end' | 'center'
}) {
  return (
    <td
      className={`data-table__td data-table__td--${column} data-table__td--align-${cellAlign}${className ? ` ${className}` : ''}`}
      onClick={(event: MouseEvent) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {children}
    </td>
  )
}

export function Th({
  className = '',
  column = 'default',
  children,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & {
  column?: 'entity' | 'status' | 'date' | 'actions' | 'default'
}) {
  return (
    <th className={`data-table__th data-table__th--${column}${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </th>
  )
}

export function ThActions({ children }: { children: ReactNode }) {
  return <Th column="actions">{children}</Th>
}

export function Td({
  className = '',
  cellAlign = 'start',
  column = 'default',
  children,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & {
  cellAlign?: 'start' | 'end' | 'center'
  column?: 'entity' | 'status' | 'date' | 'actions' | 'default'
}) {
  return (
    <td
      className={`data-table__td data-table__td--${column} data-table__td--align-${cellAlign}${className ? ` ${className}` : ''}`}
      {...props}
    >
      {children}
    </td>
  )
}
