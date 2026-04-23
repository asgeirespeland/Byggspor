export function todayFormatted(): string {
  return new Date().toLocaleDateString('nb-NO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function calcLineTotal(
  price: string,
  quantity: string,
  discount: string,
): number {
  const p = parseFloat(price) || 0
  const q = parseFloat(quantity) || 0
  const d = parseFloat(discount) || 0
  return p * q * (1 - d / 100)
}
