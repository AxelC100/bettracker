import type { Market, Sport } from './types.js'
export const markets: Market[]
export const sports: { id: Sport; label: string; leagues: string[] }[]
export function marketName(id: string): string
export function periods(sport: Sport): { id: string; label: string }[]
export function getMarket(sport: string, id: string): Market | undefined
