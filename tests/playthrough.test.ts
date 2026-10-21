import {it,expect} from 'vitest';
import {Engine,defaultProfile} from '../src/engine';
for(const seed of [4455,1729,9001])it('광고 없는 20웨이브 전략 플레이 seed '+seed,()=>{
const e=new Engine(defaultProfile(),undefined,'normal',seed);let ticks=0;
while(!['won','lost','revive'].includes(e.s.phase)&&ticks++<20000){
if(e.s.phase==='perk'){const id=e.s.choices.find(x=>['damage','speed','gold','hp'].includes(x))||e.s.choices[0];e.choosePerk(id);}
if(e.s.phase==='event')e.resolveEvent(e.s.event==='supply'?'heal':e.s.event==='trade'?'decline':'accept');
if(ticks%10===0){
 for(const u of [...e.s.units]){const b=e.s.units.find(b=>b.id!==u.id&&b.kind===u.kind&&b.star===u.star&&!b.evolution);const f=Math.floor(b?.slot! /3);if(b&&e.s.units.filter(a=>Math.floor(a.slot/3)===f).length>1)e.merge(u.id);if(u.star>=3)e.evolve(u.id,'rapid');}
 if(e.s.units.length<12)e.summon();
 if(e.s.units.length>=10&&e.s.gold>e.upgradeCost)e.upgrade();
 const counts=Array.from({length:4},(_,f)=>e.s.units.filter(u=>Math.floor(u.slot/3)===f).length);const min=counts.indexOf(Math.min(...counts));const max=counts.indexOf(Math.max(...counts));if(counts[max]-counts[min]>1){const u=e.s.units.find(u=>Math.floor(u.slot/3)===max)!;const slot=[min*3,min*3+1,min*3+2].find(i=>!e.s.units.some(u=>u.slot===i));if(slot!==undefined)e.move(u.id,slot);}
 if(e.s.enemies.length>7||e.s.enemies.some(x=>x.kind>=6))e.skill();}
 e.tick(.1);
}
console.log(JSON.stringify({seed,phase:e.s.phase,wave:e.s.wave,hp:Math.round(e.s.hp),time:Math.round(e.s.time),power:e.power,kills:e.s.kills}));
expect(e.s.phase).toBe('won');expect(e.s.revived).toBe(false);expect(Object.keys(e.s.adCounts)).toHaveLength(0);
});