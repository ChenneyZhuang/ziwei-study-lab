import { astro } from 'iztro';
import assert from 'node:assert/strict';
import { DEFAULT_FORM, makeChart } from '../../src/core';

const BR = '子丑寅卯辰巳午未申酉戌亥';
const br = (s: string) => BR.indexOf(s.slice(-1));

let total = 0;
const diff = { ming: 0, shen: 0, ju: 0, palaceName: 0, major: 0, sihua: 0 };
const detail: Record<string, string[]> = { ming: [], shen: [], ju: [], palaceName: [], major: [], sihua: [] };

const dates: string[] = [];
// Deterministic spread across 1900-2050, seven clock hours, both genders.
for (let y = 1900; y <= 2050; y += 7) {
  for (const md of ['01-01', '02-04', '03-15', '06-30', '09-09', '12-31']) dates.push(`${y}-${md}`);
}
for (const date of dates) {
  for (const gender of ['female', 'male'] as const) {
    for (const hour of [0, 3, 7, 11, 15, 19, 23]) {
      const time = `${String(hour).padStart(2, '0')}:30`;
      for(const late of hour===23?(['current-day','next-day'] as const):(['next-day'] as const)){
      const mine = makeChart({ ...DEFAULT_FORM, date, time, gender, late });
      // Compare the same effective date and branch. iztro's index 12 can apply its
      // own late-Zi rollover; passing that index alongside our already adjusted
      // policy would compare different calendars rather than the chart engines.
      const ref = astro.bySolar(mine.effectiveDate, mine.branch, gender === 'female' ? '女' : '男', true, 'zh-CN');
      total++;

      if (BR.indexOf(mine.chart.mingGongBranch.toString()) >= 0) { /* noop */ }
      const myMing = mine.chart.mingGongBranch;
      const refMing = br(ref.palaces.find(p => p.name === '命宫')!.earthlyBranch);
      if (myMing !== refMing) { diff.ming++; if (detail.ming.length < 3) detail.ming.push(`${date} ${time} ${gender}: vendor ${BR[myMing]} vs iztro ${BR[refMing]}`); }

      const myShen = mine.chart.shenGongBranch;
      const refShen = br(ref.palaces.find(p => p.isBodyPalace)!.earthlyBranch);
      if (myShen !== refShen) { diff.shen++; if (detail.shen.length < 3) detail.shen.push(`${date} ${time} ${gender}: vendor ${BR[myShen]} vs iztro ${BR[refShen]}`); }

      if (mine.chart.wuxingJuName !== ref.fiveElementsClass) {
        diff.ju++;
        if (detail.ju.length < 3) detail.ju.push(`${date} ${time} ${gender}: vendor ${mine.chart.wuxingJuName} vs iztro ${ref.fiveElementsClass}`);
      }

      for (const p of mine.chart.palaces) {
        const rp = ref.palaces.find(q => br(q.earthlyBranch) === p.branch)!;
        const myName = p.name.replace('宫', '');
        const refName = rp.name.replace('宫', '');
        if (myName !== refName) {
          diff.palaceName++;
          if (detail.palaceName.length < 3) detail.palaceName.push(`${date} ${time}: branch ${BR[p.branch]} vendor ${myName} vs iztro ${refName}`);
          break;
        }
      }

      for (const p of mine.chart.palaces) {
        const rp = ref.palaces.find(q => br(q.earthlyBranch) === p.branch)!;
        const my = p.stars.filter(s => s.type === 'major').map(s => s.name).sort().join(',');
        const rf = (rp.majorStars || []).map((s: any) => s.name).sort().join(',');
        if (my !== rf) {
          diff.major++;
          if (detail.major.length < 5) detail.major.push(`${date} ${time} ${gender} ${BR[p.branch]}: vendor [${my}] vs iztro [${rf}]`);
          break;
        }
      }

      // natal four transformations
      const myHua = mine.chart.palaces.flatMap(p => p.stars.filter(s => s.siHua).map(s => `${s.name}化${s.siHua}`)).sort().join(',');
      const refHua = ref.palaces.flatMap(p => (p.majorStars || []).concat(p.minorStars || []).filter((s: any) => s.mutagen).map((s: any) => `${s.name}化${s.mutagen}`)).sort().join(',');
      if (myHua !== refHua) {
        diff.sihua++;
        if (detail.sihua.length < 5) detail.sihua.push(`${date} ${time} ${gender}: vendor [${myHua}] vs iztro [${refHua}]`);
      }
      }
    }
  }
}

console.log('samples:', total);
console.log('mismatch counts:', diff);
console.log('rates:', Object.fromEntries(Object.entries(diff).map(([k, v]) => [k, ((v / total) * 100).toFixed(1) + '%'])));
for (const [k, v] of Object.entries(detail)) if (v.length) { console.log('\n--- ' + k); v.forEach(x => console.log('  ' + x)); }
assert.equal(total,2112,'抽样数量发生变化，请检查审计覆盖范围');
assert.deepEqual(diff,{ming:0,shen:0,ju:0,palaceName:0,major:0,sihua:0},'相同晚子时口径下排盘与 iztro 不一致');
