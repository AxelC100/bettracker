import test from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {validateBet} from '../dist/app.js'
import {settleLeg} from '../dist/settlement.js'
import {payout} from '../dist/tickets.js'
import {normalizeFixture} from '../dist/providers.js'
import {decodeImage,reviewDrafts} from '../dist/image-import.js'
const leg=(changes={})=>({id:randomUUID(),sport:'basketball',country:'',league:'NBA',event:'A vs B',eventDate:'2026-10-27T12:00:00Z',home:'A',away:'B',market:'spread',selection:'A -4.5',side:'home',line:-4.5,player:'',team:'',period:'full',includesOvertime:true,odds:1.9,status:'pending',fixtureId:'123',source:'api-sports',...changes})
const ticket=(changes={})=>({id:randomUUID(),currency:'USDT',type:'single',legs:[leg()],bookmaker:'Stake',odds:1.9,stake:10,status:'pending',actualReturn:null,notes:'',autoSettle:true,...changes})
const fixture=(changes={})=>({id:'123',sport:'basketball',home:'A',away:'B',date:'2026-10-27T12:00:00Z',league:'NBA',status:'AOT',scores:{full:{home:110,away:104},regulation:{home:100,away:100},q1:{home:30,away:20}},...changes})
test('ticket schema retains legs and counts stake once; optional country/league',()=>{
 const value=validateBet(ticket({type:'parlay',legs:[leg(),leg({sport:'baseball',market:'total-runs',line:8.5,side:'over',league:'MLB'})]}))
 assert.equal(value.stake,10);assert.equal(value.legs.length,2);assert.equal(value.sport,'mixed');assert.equal(value.market,'parlay');assert.equal(value.potentialReturn,19)
})
test('rejects wrong sport market, invalid period, missing player, inconsistent SGM',()=>{
 for(const l of [leg({sport:'baseball',market:'spread'}),leg({period:'inning-1'}),leg({market:'player-points',player:''}),leg({line:-4.3})])assert.throws(()=>validateBet(ticket({legs:[l]})))
 assert.throws(()=>validateBet(ticket({type:'same-game',legs:[leg(),leg({event:'C vs D'})]})))
 assert.throws(()=>validateBet(ticket({type:'single',legs:[leg(),leg()]})))
 assert.throws(()=>validateBet(ticket({status:'won',actualReturn:0})))
})
test('basketball distinguishes overtime, regulation, spread and quarter',()=>{
 assert.equal(settleLeg(leg(),fixture()).status,'won')
 assert.equal(settleLeg(leg({includesOvertime:false}),fixture()).status,'lost')
 assert.equal(settleLeg(leg({market:'moneyline',side:'home',line:null,includesOvertime:false}),fixture()).status,'void')
 assert.equal(settleLeg(leg({period:'q1',includesOvertime:false,line:-5.5}),fixture()).status,'won')
 assert.equal(settleLeg(leg({market:'total-points',line:214,side:'over'}),fixture()).status,'void')
})
test('quarter lines support half wins and losses including negative handicaps',()=>{
 const f=fixture({scores:{full:{home:105,away:100}}})
 assert.equal(settleLeg(leg({line:-5.25}),f).status,'half-lost')
 assert.equal(settleLeg(leg({line:-4.75}),f).status,'half-won')
 assert.equal(settleLeg(leg({market:'total-points',side:'over',line:204.75}),f).status,'half-won')
 assert.equal(settleLeg(leg({market:'total-points',side:'under',line:204.75}),f).status,'half-lost')
})
test('football 1X2, double chance and BTTS; no unverified identity or props',()=>{
 const f=fixture({sport:'football',status:'FT',scores:{regulation:{home:1,away:1}}})
 assert.equal(settleLeg(leg({sport:'football',market:'match-winner',side:'draw',line:null,includesOvertime:false}),f).status,'won')
 assert.equal(settleLeg(leg({sport:'football',market:'double-chance',side:'away-draw',line:null,includesOvertime:false}),f).status,'won')
 assert.equal(settleLeg(leg({sport:'football',market:'btts',side:'yes',line:null,includesOvertime:false}),f).status,'won')
 assert.equal(settleLeg(leg({home:'Wrong'}),fixture()).status,'pending')
 assert.equal(settleLeg(leg(),fixture({status:'CANC'})).status,'pending')
 assert.equal(settleLeg(leg({market:'player-points',player:'A Player',side:'over',line:20.5}),fixture()).status,'pending')
})
test('baseball provider does not invent missing innings or settle shortened games',()=>{
 const innings=Object.fromEntries(Array.from({length:9},(_,i)=>[String(i+1),i===0?1:0]))
 const row={id:123,date:'2026-10-27T12:00Z',status:{short:'FT'},league:{name:'MLB'},teams:{home:{name:'A'},away:{name:'B'}},scores:{home:{innings:{...innings,9:null,extra:null},total:2},away:{innings:{...innings,1:0,extra:null},total:0}}}
 // Inconsistent scoreboard cannot produce a full-game score.
 assert.equal(normalizeFixture('baseball',row).scores.full,undefined)
 assert.equal(normalizeFixture('baseball',row).scores.regulation,undefined)
 row.scores.home.total=1
 const full=normalizeFixture('baseball',row)
 assert.equal(full.scores.full.home,1)
 assert.equal(settleLeg(leg({sport:'baseball',market:'moneyline',side:'home',line:null}),full).status,'won')
 row.scores.away.innings['9']=null
 assert.equal(normalizeFixture('baseball',row).scores.full,undefined)
 assert.deepEqual(normalizeFixture('baseball',row).scores['first-5'],{home:1,away:0})
})
test('basketball normalization leaves regulation unknown if a quarter is missing',()=>{
 const row={id:1,teams:{home:{name:'A'},away:{name:'B'}},status:{short:'AOT'},scores:{home:{quarter_1:25,quarter_2:25,quarter_3:25,quarter_4:25,total:110},away:{quarter_1:25,quarter_2:25,quarter_3:25,quarter_4:25,total:104}}}
 assert.deepEqual(normalizeFixture('basketball',row).scores.regulation,{home:100,away:100})
 row.scores.home.quarter_1=null
 assert.equal(normalizeFixture('basketball',row).scores.regulation,undefined)
})
test('ticket payouts handle void leg, SGM void priority, pending and half results',()=>{
 assert.deepEqual(payout(ticket({type:'parlay',odds:4,legs:[leg({status:'won',odds:2}),leg({status:'void',odds:2})]})),{status:'won',actualReturn:20})
 assert.deepEqual(payout(ticket({type:'same-game',odds:4,legs:[leg({status:'lost'}),leg({status:'void'})]})),{status:'void',actualReturn:10})
 assert.equal(payout(ticket({type:'same-game',legs:[leg({status:'lost'}),leg({status:'pending'})]})),null)
 assert.deepEqual(payout(ticket({legs:[leg({status:'half-lost'})]})),{status:'lost',actualReturn:5})
 assert.deepEqual(payout(ticket({legs:[leg({status:'half-won'})]})),{status:'won',actualReturn:14.5})
 assert.equal(payout(ticket({type:'parlay',odds:4,legs:[leg({status:'won',odds:null}),leg({status:'void',odds:null})]})),null)
})
test('image validation rejects mismatched formats and extraction preserves missing fields',()=>{
 assert.throws(()=>decodeImage('data:image/png;base64,'+Buffer.from('not an image at all').toString('base64')))
 const draft=reviewDrafts({tickets:[{type:'single',currency:null,stake:0,odds:2.45,status:'won',actualReturn:2.45,legs:[{sport:'football',event:'Torino vs Como',eventDate:null,market:'player-goals',selection:'Nico 1+',includesOvertime:null,side:'over',line:0.5,player:'Nico Paz',status:'won'}],warnings:[]}]},'abc')[0]
 assert.equal(draft.ticket.legs[0].eventDate,'');assert.equal(draft.ticket.stake,0);assert.equal(draft.ticket.autoSettle,false);assert.ok(draft.warnings.length>=3)
})
