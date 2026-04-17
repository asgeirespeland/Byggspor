export function groupBy<T>(
  items: T[],
  key: (item: T) => string,
): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const k = key(item)
    const list = map.get(k)
    if (list) list.push(item)
    else map.set(k, [item])
  }
  return map
}

export function sumBy<T>(
  items: T[],
  pick: (item: T) => number | null | undefined,
): number {
  let total = 0
  for (const item of items) {
    const v = pick(item)
    if (v != null) total += v
  }
  return total
}
