export type Sport = 'football' | 'basketball' | 'baseball'
export type BetStatus = 'pending' | 'won' | 'lost' | 'void'
export type LegStatus = BetStatus | 'half-won' | 'half-lost'
export type TicketType = 'single' | 'parlay' | 'same-game'
export type Leg = {
 id: string; sport: Sport; country: string; league: string; event: string; eventDate: string;
 home: string; away: string; market: string; selection: string; side: string;
 line: number | null; player: string; team: string; period: string; includesOvertime: boolean;
 odds: number | null; status: LegStatus; fixtureId: string; source: 'manual' | 'api-sports';
}
export type Ticket = {
 id: string; currency: 'USDT'; type: TicketType; legs: Leg[]; bookmaker: string;
 odds: number; stake: number; status: BetStatus; potentialReturn: number; potentialProfit: number;
 actualReturn: number | null; notes: string; createdAt: string; autoSettle: boolean;
 settlementMethod?: 'manual' | 'automatic'; settledAt?: string; sourceHash?: string;
 sport: string; country: string; league: string; event: string; eventDate: string; market: string; selection: string;
}
export type Market = { id: string; label: string; sport: Sport; kind: 'winner'|'three-way'|'double'|'total'|'handicap'|'btts'|'yesno'|'odd-even'|'custom'; player: boolean; team: boolean; auto: boolean; hint: string }
export type Fixture = { id: string; sport: Sport; home: string; away: string; league: string; date: string; status: string; scores: Record<string,{home:number;away:number}> }
