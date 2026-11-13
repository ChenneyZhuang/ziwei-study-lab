import { DEFAULT_FORM, makeChart } from '../../src/core';
import assert from 'node:assert/strict';
import { READING_TOPICS, getReading, readingText } from '../../src/reading';

const problems: string[] = [];
let checked = 0;

const dates = ['1990-01-01', '1975-06-15', '2000-12-31', '1955-03-05', '2010-08-20', '1988-11-11', '2024-02-10'];
const times = ['00:30', '04:00', '09:15', '14:45', '20:00', '23:30'];

for (const date of dates) {
  for (const time of times) {
    for (const gender of ['female', 'male'] as const) {
      const result = makeChart({ ...DEFAULT_FORM, date, time, gender });
      const chart = result.chart;
      for (const topic of READING_TOPICS) {
        checked++;
        const r = getReading(result, topic);
        const tag = `${date} ${time} ${gender} / ${topic.id}`;
        if (!r) { problems.push(`${tag}: 无解读`); continue; }
        const p = r.palace;
        const own = p.stars.filter(s => s.type === 'major');
        const opposite = chart.palaces.find(x => x.branch === p.oppositeBranch);
        const observed = own.length ? own : opposite?.stars.filter(s => s.type === 'major') ?? [];

        // 1. palace identity
        if (!r.facts.includes(p.name)) problems.push(`${tag}: facts 未包含宫名 ${p.name}`);
        if (!r.facts.includes('子丑寅卯辰巳午未申酉戌亥'[p.branch])) problems.push(`${tag}: facts 未包含地支`);

        // 2. borrowed flag must match emptiness
        if (r.borrowed !== (own.length === 0)) problems.push(`${tag}: borrowed=${r.borrowed} 但本宫主星数=${own.length}`);

        // 3. every interpretation line must reference a star actually observed
        for (const line of r.interpretation) {
          const named = observed.filter(s => line.includes(s.name));
          if (named.length === 0 && !line.includes('没有主星')) problems.push(`${tag}: 解读提到未知星曜 → ${line}`);
        }
        const brightNote = r.interpretation.length > (observed.length || 1) && r.interpretation[r.interpretation.length - 1].startsWith('亮度参考');
        if (r.interpretation.length !== (observed.length || 1) + (brightNote ? 1 : 0)) problems.push(`${tag}: 解读条数 ${r.interpretation.length} ≠ 主星数 ${observed.length}（含亮度说明）`);

        // 4. transformations only for stars in this palace that carry siHua
        const huaStars = p.stars.filter(s => s.siHua).map(s => s.name);
        for (const t of r.transformations) {
          const star = huaStars.find(n => t.startsWith(n));
          if (!star) problems.push(`${tag}: 四化提到不存在的星 ${t}`);
        }
        if (r.transformations.length !== huaStars.length) problems.push(`${tag}: 四化条数不符`);

        // 5. related palaces = opposite + two trines, names must match chart
        const expect = [6, 4, 8].map(n => (p.branch + n) % 12);
        if (JSON.stringify(r.related.map(x => x.palace.branch)) !== JSON.stringify(expect)) problems.push(`${tag}: 三方四正位置错误`);
        for (const rel of r.related) {
          const target = chart.palaces.find(x => x.branch === rel.palace.branch)!;
          if (target.name !== rel.palace.name) problems.push(`${tag}: 关联宫名不符`);
        }

        // 6. 空宫时不应说本宫有主星
        if (r.borrowed && /本宫(主星|的).*[紫微天机太阳武曲天同廉贞天府太阴贪狼巨门天相天梁七杀破军]/.test(r.facts)) problems.push(`${tag}: 空宫 facts 措辞可疑 → ${r.facts}`);

        // 7. no placeholder leakage
        if (/undefined|NaN|\[object/.test(JSON.stringify(r))) problems.push(`${tag}: 出现 undefined/NaN`);
      }
      const text = readingText(result);
      if (/undefined|NaN/.test(text)) problems.push(`${date} ${time} ${gender}: 全文出现 undefined/NaN`);
    }
  }
}
console.log('checked readings:', checked);
console.log('problems:', problems.length);
problems.slice(0, 20).forEach(p => console.log('  - ' + p));
assert.equal(checked,1092,'解读探针数量发生变化，请检查审计覆盖范围');
assert.equal(problems.length,0,`解读一致性检查发现问题：${problems.slice(0,5).join('；')}`);
