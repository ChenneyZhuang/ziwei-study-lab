import assert from 'node:assert/strict';
import { DEFAULT_FORM, EffectiveDateRangeError, candidatePeriods, candidates, makeChart, resolveBirthTime, calendarOverlay, flowContext, smallLimitContext } from '../../src/core';

const base={...DEFAULT_FORM,date:'1900-01-01',time:'00:00',gender:'female' as const};
for(const form of [
 base,
 {...base,time:'23:59',late:'next-day' as const},
 {...base,date:'2023-03-22',time:'12:00',calendar:'lunar' as const,lunarYear:'2023',lunarMonth:'2',lunarDay:'1',lunarLeap:true,leap:'origin-month' as const},
]){
 const chart=makeChart(form);
 assert.ok(calendarOverlay(chart,chart.effectiveDate));
 assert.ok(flowContext(chart,chart.effectiveDate,'12:00','hourly'));
 assert.ok(smallLimitContext(chart,chart.effectiveDate));
}
assert.throws(()=>makeChart({...base,date:'2050-12-31',time:'23:59'}),EffectiveDateRangeError);
assert.equal(candidates(base).length,13);

const edge=candidatePeriods({...base,date:'2050-12-31',unknownTime:true});
assert.deepEqual(edge.excluded,[{start:'23:00',end:'23:59'}]);
assert.equal(edge.periods[0].start,'00:00');
assert.equal(edge.periods.at(-1)?.end,'22:59');
assert.ok(edge.periods.every(period=>period.result.uncertain));

let outOfRange=0;
for(let minute=0;minute<1440;minute++){
 const time=`${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;
 try{resolveBirthTime({...base,date:'2050-12-31',time})}
 catch(error){assert.ok(error instanceof EffectiveDateRangeError);outOfRange++}
}
assert.equal(outOfRange,60,'仅晚子时换日后超出上界');
console.log('Boundary audit passed: candidate gaps are explicit, valid minutes are retained, and lunar/flow edges work.');
