import { astro } from 'iztro';
import assert from 'node:assert/strict';
import { DEFAULT_FORM, makeChart, calendarOverlay, flowContext } from '../../src/core';
import { SI_HUA_TABLE } from '../../src/vendor/ziwei/constants';

const BR = '子丑寅卯辰巳午未申酉戌亥';
const br = (s: string) => BR.indexOf(s.slice(-1));

let n = 0;
const bad = { decadeBranch: 0, decadeRange: 0, decadeMutagen: 0, yearlyMutagen: 0 };
const ex: Record<string, string[]> = { decadeBranch: [], decadeRange: [], decadeMutagen: [], yearlyMutagen: [] };

for (let y = 1950; y <= 2010; y += 5) {
  for (const md of ['01-15', '04-20', '08-08', '11-11']) {
    const date = `${y}-${md}`;
    for (const gender of ['female', 'male'] as const) {
      const chart = makeChart({ ...DEFAULT_FORM, date, time: '10:00', gender });
      const natal = astro.bySolar(date, 5, gender === 'female' ? '女' : '男', true, 'zh-CN');
      for (const probe of [`${y + 12}-06-01`, `${y + 24}-06-01`, `${y + 36}-09-01`, `${y + 50}-03-01`]) {
        if (Number(probe.slice(0, 4)) > 2050) continue;
        n++;
        const cal = calendarOverlay(chart, probe);
        const h = natal.horoscope(probe, 5);
        const decadal = h.decadal!;
        const decBranch = br(natal.palaces[decadal.index].earthlyBranch);
        const refRange = (natal.palaces[decadal.index] as any).decadal?.range as [number, number] | undefined;
        assert.ok(cal?.decade,`${date} ${gender} @${probe}: 无法计算大限`);
        const decade = cal.decade;
        if (decade.palaceBranch !== decBranch) {
          bad.decadeBranch++;
          if (ex.decadeBranch.length < 4) ex.decadeBranch.push(`${date} ${gender} @${probe}: app ${BR[decade.palaceBranch]}(${decade.startAge}-${decade.endAge}) vs iztro ${BR[decBranch]}(${refRange?.[0]}-${refRange?.[1]})`);
        }
        if (refRange && (decade.startAge !== refRange[0] || decade.endAge !== refRange[1])) {
          bad.decadeRange++;
          if (ex.decadeRange.length < 4) ex.decadeRange.push(`${date} ${gender} @${probe}: app ${decade.startAge}-${decade.endAge} vs iztro ${refRange[0]}-${refRange[1]}`);
        }
        // decade mutagen from the decade palace's own stem vs iztro's decadal.mutagen
        const palace = chart.chart.palaces.find(p => p.branch === decade.palaceBranch)!;
        const mine = SI_HUA_TABLE[palace.stem].map(String);
        if (JSON.stringify(mine) !== JSON.stringify(decadal.mutagen.map(String))) {
          bad.decadeMutagen++;
          if (ex.decadeMutagen.length < 4) ex.decadeMutagen.push(`${date} ${gender} @${probe}: app [${mine}] vs iztro [${decadal.mutagen}]`);
        }
        const yr = flowContext(chart, probe, '12:00', 'yearly');
        assert.ok(yr,`${date} ${gender} @${probe}: 无法计算流年`);
        if (JSON.stringify(yr.mutagen) !== JSON.stringify(h.yearly!.mutagen.map(String))) {
          bad.yearlyMutagen++;
          if (ex.yearlyMutagen.length < 4) ex.yearlyMutagen.push(`${date} ${gender} @${probe}: app [${yr.mutagen}] vs iztro [${h.yearly!.mutagen}]`);
        }
      }
    }
  }
}
console.log('probes:', n);
console.log('mismatch:', bad);
for (const [k, v] of Object.entries(ex)) if (v.length) { console.log('\n--- ' + k); v.forEach(x => console.log('  ' + x)); }
assert.equal(n,400,'运限探针数量发生变化，请检查审计覆盖范围');
assert.deepEqual(bad,{decadeBranch:0,decadeRange:0,decadeMutagen:0,yearlyMutagen:0},'大限或流年交叉核对发现差异');
