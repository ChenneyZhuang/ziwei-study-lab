import type { ZiweiChart } from './vendor/ziwei/types';
/** A representative clock time for an effective-date branch, with no late-Zi rollover. */
export function representativeClock(branch:number){
 if(!Number.isInteger(branch)||branch<0||branch>11)throw new Error('时辰序号无效。');
 return branch===0?'00:30':`${String(branch*2).padStart(2,'0')}:00`;
}
/** Exact comparison of natal palace names, major stars and all natal transformations. */
export function chartSignature(chart:ZiweiChart){
 return JSON.stringify([...chart.palaces].sort((a,b)=>a.branch-b.branch).map(p=>({
  branch:p.branch,name:p.name,
  major:p.stars.filter(s=>s.type==='major').map(s=>s.name).sort(),
  transformations:p.stars.filter(s=>s.siHua).map(s=>`${s.name}:${s.siHua}`).sort(),
 })));
}
