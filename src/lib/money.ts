const formatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })
export function formatAmount(value: number) { return `${formatter.format(Object.is(value, -0) ? 0 : value)} USDT` }
