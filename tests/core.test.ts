import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { astro } from 'iztro';
import { DEFAULT_FORM, FAMOUS_PERSONS, STAR_IN_FUQI_GU, candidates, candidatePeriods, decadePatterns, famousBirthForm, makeChart, patterns, shierShenForChart, horoscopeText, horoscopeTexts, calendarOverlay, chartTimeUncertain, resolveBirthTime, lunarFormDate, solarFormLunar, flowContext, smallLimitContext } from '../src/core';
import { datasetBrightnessConflicts, findDatasetRecord } from '../src/dataset';
import { STORAGE, makeBackup, mergeSaved, parseBackup, readSaved, upsertSaved, type Saved } from '../src/storage';
import { READING_TOPICS, getReading, readingText } from '../src/reading';
import { chartSignature, representativeClock } from '../src/similar';
import { createComparisons } from '../src/compare';
import { LIUREN_MEANINGS, liurenForClock, sixPositions } from '../src/liuren';
import { explainClassicExcerpt, explainMarriageClassical, explainPatternPlain } from '../src/classic-plain';
import { analyzeRelationship } from '../src/relationship-analysis';
const base={...DEFAULT_FORM,date:'1990-01-01',time:'08:00',gender:'female' as const};
assert.throws(()=>makeChart({...base,gender:''}),/请选择/);
assert.throws(()=>makeChart({...base,date:'1990-02-30'}),/真实存在/);
assert.throws(()=>makeChart({...base,unknownTime:true}),/候选/);
const sample=makeChart(base);
assert.equal(lunarFormDate({lunarYear:'2023',lunarMonth:'2',lunarDay:'1',lunarLeap:true}),'2023-03-22');
assert.equal(lunarFormDate({lunarYear:'2024',lunarMonth:'2',lunarDay:'1',lunarLeap:true}),'');
assert.deepEqual(solarFormLunar('2023-03-22'),{lunarYear:'2023',lunarMonth:'2',lunarDay:'1',lunarLeap:true});
const lunarBirth={...base,calendar:'lunar' as const,lunarYear:'2023',lunarMonth:'2',lunarDay:'1',lunarLeap:true,date:'2023-03-22'};
const fromLunar=makeChart(lunarBirth);const fromSolar=makeChart({...base,date:'2023-03-22'});
assert.equal(fromLunar.chart.mingGongBranch,fromSolar.chart.mingGongBranch);
assert.throws(()=>makeChart({...lunarBirth,date:'2023-03-23'}),/农历日期/);
assert.equal(makeChart({...base,timeApprox:true}).uncertain,true);
assert.match(makeChart({...base,timeApprox:true}).details.join(' '),/代表时刻/);
assert.equal(chartSignature(sample.chart),chartSignature(makeChart(base).chart));
assert.notEqual(chartSignature(sample.chart),chartSignature(makeChart({...base,date:'1990-01-02'}).chart));
for(let branch=0;branch<12;branch++)assert.equal(makeChart({...base,time:representativeClock(branch)}).branch,branch,`搜索代表时刻 ${branch}`);
assert.throws(()=>representativeClock(12),/时辰序号/);
assert.deepEqual(sixPositions(3,3,4),{month:'速喜',day:'小吉',hour:'速喜'});
assert.deepEqual(sixPositions(3,5,6),{month:'速喜',day:'大安',hour:'大安'});
assert.deepEqual(liurenForClock('2024-02-10','00:30','current-day').positions,{month:'大安',day:'大安',hour:'大安'});
assert.equal(liurenForClock('2024-02-09','23:30','next-day').effectiveDate,'2024-02-10');
assert.equal(liurenForClock('2024-02-09','23:30','current-day').effectiveDate,'2024-02-09');
assert.throws(()=>liurenForClock('2024-02-30','10:00','current-day'),/有效/);
assert.equal(sample.chart.palaces.length,12);
assert.equal(new Set(sample.chart.palaces.map(p=>p.branch)).size,12);
assert.equal(sample.chart.palaces.filter(p=>p.isMingGong).length,1);
assert.equal(sample.chart.palaces.flatMap(p=>p.stars).filter(s=>s.type==='major').length,14);
assert.equal(sample.branch,4);
assert.equal(makeChart({...base,time:'23:30',late:'next-day'}).effectiveDate,'1990-01-02');
assert.equal(makeChart({...base,time:'23:30',late:'current-day'}).effectiveDate,'1990-01-01');
const boundary={...base,date:'1990-02-11',time:'01:05',correction:'solar' as const,longitude:'120',standardOffset:'8',actualOffset:'8'};
assert.equal(makeChart({...boundary,correction:'clock'}).branch,1);
assert.equal(makeChart(boundary).branch,0,'均时差应参与时辰计算');
const hongKong=makeChart({...base,date:'2025-12-31',time:'23:00',correction:'solar',longitude:'114.17',standardOffset:'8',actualOffset:'8'});
assert.equal(hongKong.branch,11);assert.equal(hongKong.effectiveDate,'2025-12-31');
const dst=makeChart({...base,date:'2000-01-01',time:'00:15',correction:'solar',longitude:'150',standardOffset:'10',actualOffset:'11'});
assert.match(dst.details.join(' '),/1999-12-31 23:15/);
assert.equal(dst.effectiveDate,'2000-01-01');
const variants=candidates(base);assert.equal(variants.length,13);assert.equal(variants[0].result.effectiveDate,'1990-01-01');assert.equal(variants[12].result.effectiveDate,'1990-01-02');
const lastDay=candidatePeriods({...base,date:'2050-12-31',unknownTime:true});
assert.deepEqual(lastDay.excluded,[{start:'23:00',end:'23:59'}]);
assert.equal(lastDay.periods[0].start,'00:00');assert.equal(lastDay.periods.at(-1)?.end,'22:59');
assert.ok(lastDay.periods.every(v=>v.result.uncertain));
assert.throws(()=>candidates({...base,date:'2050-12-31'}),/部分候选时段/);
const firstDay=candidatePeriods({...base,date:'1900-01-01',unknownTime:true,correction:'solar',longitude:'172',standardOffset:'13',actualOffset:'13'});
assert.deepEqual(firstDay.excluded,[{start:'00:00',end:'00:34'}]);assert.equal(firstDay.periods[0].start,'00:35');assert.equal(firstDay.periods.at(-1)?.end,'23:59');
for(const result of [firstDay,lastDay]){let next=0;for(const interval of [...result.periods,...result.excluded].sort((a,b)=>a.start.localeCompare(b.start))){const minute=(s:string)=>Number(s.slice(0,2))*60+Number(s.slice(3));assert.equal(minute(interval.start),next,'可计算与排除时段须完整且不重叠');next=minute(interval.end)+1}assert.equal(next,1440)}
assert.throws(()=>candidatePeriods({...base,gender:''}),/请选择/);
const partialComparison=createComparisons({...base,date:'2050-12-31',unknownTime:true},'time');
assert.equal(partialComparison.rows.length,12);assert.match(partialComparison.omitted,/23:00–23:59/);
const lateComparison=createComparisons({...base,date:'2050-12-31',time:'23:30'},'late');
assert.deepEqual(lateComparison.rows.map(row=>row.label),['晚子时按当日']);assert.match(lateComparison.omitted,/晚子时换日/);
assert.equal(chartTimeUncertain(variants[0].result.form,variants[0].result),true,'候选时刻仍未核实');
assert.equal(chartTimeUncertain({...variants[0].result.form,gender:'male'},variants[0].result),true,'仅更改其他资料不应消除时间不确定性');
assert.equal(chartTimeUncertain({...variants[0].result.form,time:'00:45',timeApprox:false},variants[0].result),false,'重新输入准确时间后不应继承旧盘的不确定状态');
assert.equal(chartTimeUncertain({...base,timeApprox:true},null),true);
assert.equal(calendarOverlay(sample,'2022-07-01')?.nominalAge,34);
assert.equal(calendarOverlay(sample,'2022-07-01')?.decade?.startAge,34);
assert.equal(calendarOverlay(sample,'2022-01-31')?.nominalAge,33);
assert.equal(calendarOverlay(sample,'2022-02-01')?.nominalAge,34);
assert.equal(calendarOverlay(sample,'2022-02-30'),null);
const reference=astro.bySolar('1990-01-01',4,'女',true,'zh-CN');
for(const date of ['2022-01-31','2022-02-01','2022-07-01','2023-01-21','2023-01-22']){
 assert.equal(calendarOverlay(sample,date)?.nominalAge,reference.horoscope(date).age.nominalAge,`农历换年边界 ${date}`);
}
for(const gender of ['female','male'] as const){
 const chart=makeChart({...base,gender});const natal=astro.bySolar('1990-01-01',4,gender==='female'?'女':'男',true,'zh-CN');
 for(const date of ['1990-01-01','1991-02-16','2022-01-31','2022-02-01','2030-06-01']){
  const actual=smallLimitContext(chart,date);assert.ok(actual);
  const expected=natal.palaces.find(p=>p.ages.includes(actual.nominalAge));assert.ok(expected);
  assert.equal(actual.branch,'子丑寅卯辰巳午未申酉戌亥'.indexOf(expected.earthlyBranch),`${gender} ${date} 小限`);
 }
}
assert.equal(smallLimitContext(sample,'1989-12-31'),null);
for(const scope of ['yearly','monthly','daily','hourly'] as const){
 const flow=flowContext(sample,'2022-07-01','08:00',scope);const expected=reference.horoscope('2022-07-01',4)[scope];
 assert.ok(flow);assert.equal(flow.stem,expected.heavenlyStem);assert.deepEqual(flow.mutagen,expected.mutagen);
 assert.equal(flow.branch,'子丑寅卯辰巳午未申酉戌亥'.indexOf(reference.palaces[expected.index].earthlyBranch));
 assert.equal(Object.keys(flow.names).length,12);
}
for(const [policy,lunarDate,isLeap] of [['next-month','2023-3-1',false],['prev-month','2023-2-1',false],['origin-month','2023-2-1',true]] as const){
 const natal=makeChart({...lunarBirth,leap:policy});
 const expectedNatal=astro.byLunar(lunarDate,4,'女',isLeap,false,'zh-CN');
 const little=smallLimitContext(natal,'2025-02-01');assert.ok(little);
 const expectedLittle=expectedNatal.palaces.find(p=>p.ages.includes(little.nominalAge));assert.ok(expectedLittle);
 assert.equal(little.branch,'子丑寅卯辰巳午未申酉戌亥'.indexOf(expectedLittle.earthlyBranch));
 for(const scope of ['yearly','monthly','daily','hourly'] as const){
  const expected=expectedNatal.horoscope('2025-02-01',12)[scope];
  const actual=flowContext(natal,'2025-02-01','23:30',scope);
  assert.ok(actual);assert.deepEqual(actual.mutagen,expected.mutagen);
  assert.equal(actual.branch,'子丑寅卯辰巳午未申酉戌亥'.indexOf(expectedNatal.palaces[expected.index].earthlyBranch));
 }
}
assert.equal(flowContext(sample,'1989-01-01','08:00','yearly'),null);
assert.equal(flowContext(sample,'2022-07-01','25:00','hourly'),null);
assert.equal(READING_TOPICS.length,13);
for(const topic of READING_TOPICS){const section=getReading(sample,topic);assert.ok(section);assert.ok(section.facts&&section.interpretation.length);assert.deepEqual(section.related.map(x=>x.palace.branch),[6,4,8].map(n=>(section.palace.branch+n)%12));assert.ok(!JSON.stringify(section).includes('undefined'))}
assert.match(readingText(sample),/事业与工作/);assert.match(readingText({...sample,uncertain:true}),/尚未核实/);
const emptyPalace=sample.chart.palaces.find(p=>p.isEmpty);if(emptyPalace){const topic=READING_TOPICS.find(t=>t.palace.replace('宫','')===emptyPalace.name.replace('宫',''));if(topic){const reading=getReading(sample,topic);assert.equal(reading?.borrowed,true);assert.match(reading!.facts,/无主星/)}}
const borrowedCareer=getReading(sample,READING_TOPICS.find(t=>t.id==='career')!);
assert.ok(borrowedCareer?.borrowed);assert.ok(borrowedCareer.interpretation.some(line=>line.startsWith('亮度参考')&&line.includes('对宫的亮度')&&line.includes('并非本宫有这些星')));
for(const day of ['1990-01-01','1990-05-06','2000-02-05','2023-03-22'])for(const time of ['00:30','06:00','12:00','18:00','23:30']){
 const chart=makeChart({...base,date:day,time});
 for(const topic of READING_TOPICS){const entry=getReading(chart,topic);assert.ok(entry);assert.ok(entry.facts.includes(entry.palace.name));assert.ok(entry.interpretation.length>0);assert.ok(!JSON.stringify(entry).includes('undefined'))}
}
// Only the fields the reading engine reads are fabricated here, so these charts are cast on purpose.
const fabricate=(fill:(p:any)=>any)=>({...sample.chart,palaces:sample.chart.palaces.map(fill)}) as typeof sample.chart;
for(const star of ['紫微','天机','太阳','武曲','天同','廉贞','天府','太阴','贪狼','巨门','天相','天梁','七杀','破军']){
 const chart=fabricate(p=>p.isMingGong?{...p,isEmpty:false,stars:[{name:star,type:'major' as const}]}:p);
 const entry=getReading({...sample,chart},READING_TOPICS.find(t=>t.id==='personality')!);
 assert.ok(entry?.interpretation[0].includes(star));assert.ok(!entry?.interpretation[0].includes('建议结合原文'),`${star}缺少白话释义`);
 // 同一颗星在不同主题下必须给出不同角度的句子（避免每个主题都是同一段话）
 const same=fabricate(p=>({...p,isEmpty:false,stars:[{name:star,type:'major' as const}]}));
 const self=getReading({...sample,chart:same},READING_TOPICS.find(t=>t.id==='personality')!)!;
 const body=getReading({...sample,chart:same},READING_TOPICS.find(t=>t.id==='health')!)!;
 const work=getReading({...sample,chart:same},READING_TOPICS.find(t=>t.id==='career')!)!;
 assert.notEqual(self.interpretation[0],body.interpretation[0],`${star} 的健康主题应与性格主题不同`);
 assert.notEqual(self.interpretation[0],work.interpretation[0],`${star} 的事业主题应与性格主题不同`);
}
// 亮度必须参与解读：庙旺与落陷要分别说明
const dimStar=fabricate(p=>p.isMingGong?{...p,isEmpty:false,stars:[{name:'太阳',type:'major' as const,brightnessRaw:'陷'}]}:p);
const dimReading=getReading({...sample,chart:dimStar},READING_TOPICS.find(t=>t.id==='personality')!)!;
assert.ok(dimReading.interpretation.some(l=>l.startsWith('亮度参考')&&l.includes('陷')),'落陷应出现在亮度参考中');
const brightStar=fabricate(p=>p.isMingGong?{...p,isEmpty:false,stars:[{name:'太阳',type:'major' as const,brightnessRaw:'庙'}]}:p);
const brightReading=getReading({...sample,chart:brightStar},READING_TOPICS.find(t=>t.id==='personality')!)!;
assert.ok(brightReading.interpretation.some(l=>l.startsWith('亮度参考')&&l.includes('庙')),'庙旺应出现在亮度参考中');
assert.ok(!getReading(sample,READING_TOPICS.find(t=>t.id==='personality')!)!.interpretation.some(l=>l.startsWith('亮度参考')&&l.includes('太阴')),'亮度参考不应提到其他宫位的星');
const solarForm={...base,correction:'solar' as const,longitude:'130',standardOffset:'8',actualOffset:'8'};
const solarCandidates=candidates(solarForm);
assert.equal(solarCandidates[0].start,'00:00');assert.equal(solarCandidates[0].end,'00:22');
assert.equal(solarCandidates[0].result.branch,0);assert.ok(solarCandidates.every(v=>v.result.uncertain));
const toMinute=(s:string)=>Number(s.slice(0,2))*60+Number(s.slice(3));
let next=0;
for(const candidate of solarCandidates){
 assert.equal(toMinute(candidate.start),next);
 const end=toMinute(candidate.end);assert.ok(end>=next);
 for(let minute=next;minute<=end;minute++){
  const clock=`${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;
  const resolved=resolveBirthTime({...solarForm,time:clock});
  assert.equal(resolved.effectiveDate,candidate.result.effectiveDate);
  assert.equal(resolved.solar.branch,candidate.result.branch);
 }
 next=end+1;
}
assert.equal(next,1440,'每一分钟都必须恰好覆盖');
const entries=Array.from({length:35},(_,i)=>({id:`test-${i}`,form:base,uncertain:i===0}));
let accumulated:Saved[]=[];for(const entry of entries)accumulated=upsertSaved(accumulated,entry);assert.equal(accumulated.length,35);assert.ok(accumulated.some(x=>x.id==='test-0'));
const backup=makeBackup(entries);assert.equal(parseBackup(backup).length,35);
const merged=mergeSaved(entries,parseBackup(backup));assert.equal(merged.records.length,35);assert.equal(merged.skipped,35);
assert.throws(()=>parseBackup('{broken'),/JSON/);
assert.throws(()=>parseBackup(JSON.stringify({format:'ziwei-study-lab-backup',version:1,records:[...entries,{id:'bad',form:{}}]})),/未导入/);
assert.throws(()=>readSaved({getItem:(key:string)=>key===STORAGE?'broken':null}),/停止写入/);
assert.ok(Array.isArray(patterns(sample)));assert.equal(horoscopeText(sample,'请看我的事业').topic,'事业');
assert.deepEqual(horoscopeTexts(sample,'事业和感情如何看').map(x=>x.topic),['事业','关系']);
assert.equal(horoscopeTexts(sample,'这个问题能回答吗')[0].topic,'未识别');
const sun=sample.chart.palaces.find(p=>p.stars.some(s=>s.name==='太阳'))!;
const sunStar=sun.stars.find(s=>s.name==='太阳')!;
const branch='子丑寅卯辰巳午未申酉戌亥'[sun.branch];
const alternate=sunStar.brightnessRaw==='陷'?'庙':'落陷';
assert.equal(datasetBrightnessConflicts({k:'x',c:{overview:`太阳在${branch}宫→${alternate}`}},sample.chart).length,1);
assert.equal(datasetBrightnessConflicts({k:'x',c:{overview:'没有可核对的星曜亮度'}},sample.chart).length,0);
const jsonl=[JSON.stringify({k:'1990-01-01-4-male',c:{overview:'other'}}),JSON.stringify({k:'1990-01-01-4-female',c:{overview:'匹配'}})].join('\n');
assert.equal((await findDatasetRecord(new Blob([jsonl]),'1990-01-01-4-female'))?.c.overview,'匹配');
assert.equal(await findDatasetRecord(new Blob([jsonl]),'not-present'),null);
const texts=JSON.parse(readFileSync('public/data/quanshu-wikisource.json','utf8')) as {text:string;section:string;anchor:string}[];
assert.ok(texts.length>1000);assert.ok(texts.some(x=>x.text.includes('斗数至玄至微')&&x.section==='太微赋'&&x.anchor));
// Upstream synced modules checks (patterns-dingza, shier-shen, famous, heming-knowledge)
const shenMap=shierShenForChart(sample);
assert.equal(Object.keys(shenMap).length,12);
assert.ok(shenMap[0].boshi && shenMap[0].suiqian && shenMap[0].jiangqian);
assert.ok(Array.isArray(decadePatterns(sample)));
assert.ok(FAMOUS_PERSONS.length>=10);
const famousSample=makeChart(famousBirthForm(FAMOUS_PERSONS[0]));
assert.equal(famousSample.chart.palaces.length,12);
assert.ok(Boolean(STAR_IN_FUQI_GU['紫微']?.summary));
// New concrete plain explanations, classic translations, and relationship compatibility checks
for (const topic of READING_TOPICS.filter((t)=>t.id!=='overview')) {
 const r=getReading(sample,topic)!;
 assert.equal(r.concreteScenes.length,3,`主题 ${topic.label} 应生成 3 个日常画面`);
 assert.ok(r.sanfangPlainNote.length>15,`主题 ${topic.label} 应包含三方联动白话`);
 assert.ok(Array.isArray(r.auxPlainHighlights));
}
for (const pat of ['君臣庆会','石中隐玉','衣锦还乡','生不逢时','马头带箭','贪狼化禄入命','天机化忌入迁','火贪格','财荫夹印']) {
 const pPlain=explainPatternPlain(pat);
 assert.ok(pPlain.length>=25 && !pPlain.includes('undefined'),`格局 ${pat} 白话解释应完整`);
}
const classicDecoded=explainClassicExcerpt(texts.find((x)=>x.section==='太微赋')!.text,'太微赋','quanshu');
assert.ok(classicDecoded.plain.length>25);
assert.ok(explainMarriageClassical('早婚早离或欠婚姻债，宜晚婚。','贪狼').includes('【白话翻译】'));
const rel=analyzeRelationship(sample,famousSample,'2025-06-01');
assert.equal(rel.lifeSlices.length,3);
assert.equal(rel.overlaysAToB.length,4);
assert.equal(rel.overlaysBToA.length,4);
assert.equal(rel.palaceRows.length,12);
assert.ok(rel.decadeSync.combinedPlain.length>20);
assert.ok(LIUREN_MEANINGS['大安'].classicPlain.length>20 && LIUREN_MEANINGS['赤口'].classicPlain.length>20);
console.log('Core validation passed: chart structure, calendar/time boundaries, uncertainty, source corpus, plain translations and relationship analysis.');
