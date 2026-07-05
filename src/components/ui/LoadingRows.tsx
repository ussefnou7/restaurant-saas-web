interface LoadingRowsProps {
  rows?: number
  columns?: number
}

export function LoadingRows({ rows = 6, columns = 5 }: LoadingRowsProps) {
  return (
    <div className="table-skeleton" aria-hidden="true">
      <table className="data-table data-table--skeleton">
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((__, colIndex) => (
                <td key={colIndex}>
                  <span
                    className={`skeleton-bar${colIndex === 0 ? ' skeleton-bar--lg' : colIndex === columns - 1 ? ' skeleton-bar--sm' : ''}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
