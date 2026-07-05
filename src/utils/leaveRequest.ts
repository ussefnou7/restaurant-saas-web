export function calculateInclusiveDays(fromDate: string, toDate: string): number {
  if (!fromDate || !toDate) {
    return 0
  }

  const fromParts = fromDate.split('-').map(Number)
  const toParts = toDate.split('-').map(Number)
  if (fromParts.length !== 3 || toParts.length !== 3) {
    return 0
  }

  const from = Date.UTC(fromParts[0], fromParts[1] - 1, fromParts[2])
  const to = Date.UTC(toParts[0], toParts[1] - 1, toParts[2])
  if (from > to) {
    return 0
  }

  return Math.floor((to - from) / (1000 * 60 * 60 * 24)) + 1
}
