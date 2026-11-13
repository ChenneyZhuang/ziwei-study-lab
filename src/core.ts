import { generateChart, resolveEffectiveLunarDate, setBrightnessSchool, type LunarMonthPolicy, type SchoolBrightnessKind } from './vendor/ziwei/algorithm';
import { BRANCHES, STEMS, STAR_DESCRIPTIONS } from './vendor/ziwei/constants';
import { calculateTrueSolarTime, resolveZiweiDayOffset, shiftGregorianDate, formatTrueSolarClock, isValidGregorianDate } from './vendor/ziwei/true-solar-time';
import { detectPatterns } from './vendor/ziwei/patterns';
import { detectDingZa, type DingZaHit } from './vendor/ziwei/patterns-dingza';
import {
  boshiShenByStem,
  suiQianShenByBranch,
  jiangQianShenByBranch,
  BOSHI_SHEN,
  SUI_QIAN_SHEN,
  JIANG_QIAN_SHEN,
} from './vendor/ziwei/shier-shen';
import { FAMOUS_PERSONS, type FamousPerson } from './vendor/ziwei/famous';
import {
  STAR_IN_FUQI_GU,
  SIHUA_IN_FUQI_GU,
  HEMING_METHODOLOGY,
  MARRIAGE_STARS_BRIEF,
  HEMING_SCORE_CRITERIA,
} from './vendor/ziwei/heming-knowledge';
import type { ZiweiChart, Palace } from './vendor/ziwei/types';
import { Solar } from 'lunar-javascript';
import { astro } from 'iztro';
import { lunarToSolar } from './vendor/ziwei/lunar-solar';

export type BirthForm = {
  name:string; date:string; time:string; unknownTime:boolean; gender:''|'male'|'female';
  correction:'clock'|'solar'; longitude:string; standardOffset:string; actualOffset:string;
  late:'next-day'|'current-day'; leap:LunarMonthPolicy; brightness:SchoolBrightnessKind;
  cityName?:string; timeApprox?:boolean;
  calendar?:'solar'|'lunar'; lunarYear?:string; lunarMonth?:string; lunarDay?:string; lunarLeap?:boolean;
};
export type ChartResult = { chart:ZiweiChart; form:BirthForm; effectiveDate:string; branch:number; solarClock:string; details:string[]; id:string; uncertain?:boolean };
export const DEFAULT_FORM:BirthForm = {name:'', date:'', time:'', unknownTime:false, gender:'', correction:'clock', longitude:'', standardOffset:'', actualOffset:'', late:'next-day', leap:'split', brightness:'QS'};
export const LEAP_LABEL:Record<LunarMonthPolicy,string> = {'split':'前后半月分界','next-month':'闰月归下月','prev-month':'闰月归前月','origin-month':'保留闰月'};
export const BRIGHT_LABEL:Record<SchoolBrightnessKind,string> = {'default':'全书派','QS':'全书派','XD1':'现代修订 1','XD2':'现代修订 2','ZZ':'中州派'};
export const BRANCH_NAMES=BRANCHES;
export const STEM_NAMES=STEMS;
const pad=(n:number)=>String(n).padStart(2,'0');
export class EffectiveDateRangeError extends RangeError {}
export function formatDate(v:{year:number;month:number;day:number}){return `${v.year}-${pad(v.month)}-${pad(v.day)}`;}
export function lunarFormDate(form:Pick<BirthForm,'lunarYear'|'lunarMonth'|'lunarDay'|'lunarLeap'>){
 const converted=lunarToSolar(Number(form.lunarYear),Number(form.lunarMonth),Number(form.lunarDay),Boolean(form.lunarLeap));
 return converted&&converted.year>=1900&&converted.year<=2050?formatDate(converted):'';
}
export function solarFormLunar(date:string){
 const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(date);if(!m)return null;
 const [y,month,day]=m.slice(1).map(Number);if(y<1900||y>2050||!isValidGregorianDate(y,month,day))return null;
 const lunar=Solar.fromYmd(y,month,day).getLunar();if(lunar.getYear()<1900||lunar.getYear()>2050)return null;
 return {lunarYear:String(lunar.getYear()),lunarMonth:String(Math.abs(lunar.getMonth())),lunarDay:String(lunar.getDay()),lunarLeap:lunar.getMonth()<0};
}
/** Resolve a clock minute before chart generation; reused to cover all possible minutes. */
export function resolveBirthTime(input:BirthForm) {
  if(input.calendar==='lunar'){const converted=lunarFormDate(input);if(!converted||converted!==input.date)throw new Error('请填写真实存在的农历日期，并确认闰月设置。')}
  const dateMatch=/^(\d{4})-(\d{2})-(\d{2})$/.exec(input.date);
  if(!dateMatch) throw new Error('请填写完整的公历出生日期。');
  const year=Number(dateMatch[1]),month=Number(dateMatch[2]),day=Number(dateMatch[3]);
  if(year<1900 || year>2050 || !isValidGregorianDate(year,month,day)) throw new Error('请填写 1900—2050 年内真实存在的公历日期。');
  if(input.gender!=='male' && input.gender!=='female') throw new Error('请选择排盘所需的性别口径。');
  if(input.unknownTime) throw new Error('出生时间不详：请使用“口径对照”查看多个候选时间。');
  const timeMatch=/^(\d{2}):(\d{2})$/.exec(input.time);
  if(!timeMatch || Number(timeMatch[1])>23 || Number(timeMatch[2])>59) throw new Error('请填写有效的出生时间。');
  const hh=Number(timeMatch[1]),mm=Number(timeMatch[2]);
  let baseDate={year,month,day}, clockHour=hh,clockMinute=mm;
  let longitude:number|undefined; let offset=480;
  const details:string[]=[];
  if(input.calendar==='lunar')details.push(`农历 ${input.lunarYear} 年${input.lunarLeap?'闰':''}${input.lunarMonth} 月 ${input.lunarDay} 日 → 公历 ${input.date}。`);
  if(input.timeApprox)details.push('出生钟表时间使用所选时段的代表时刻，具体分钟尚未核实。');
  if(input.correction==='solar') {
    if(input.longitude.trim()==='' || input.standardOffset.trim()==='' || input.actualOffset.trim()==='') throw new Error('真太阳时校正需要经度、标准时区和出生时实际时区。');
    longitude=Number(input.longitude); const std=Number(input.standardOffset),actual=Number(input.actualOffset);
    if(!Number.isFinite(longitude) || Math.abs(longitude)>180 || !Number.isFinite(std)||std< -12||std>14||!Number.isFinite(actual)||actual< -12||actual>14) throw new Error('经度需在 -180 至 180，UTC 时区需在 -12 至 +14 之间。');
    offset=std*60;
    const standard=new Date(Date.UTC(year,month-1,day,hh,mm)-(actual-std)*3600000);
    baseDate={year:standard.getUTCFullYear(),month:standard.getUTCMonth()+1,day:standard.getUTCDate()}; clockHour=standard.getUTCHours(); clockMinute=standard.getUTCMinutes();
    details.push(`实际 UTC${actual>=0?'+':''}${actual} → 标准 UTC${std>=0?'+':''}${std}；经度 ${longitude}°`);
    if(actual!==std) details.push(`先将出生钟表时间换算为标准时间 ${formatDate(baseDate)} ${pad(clockHour)}:${pad(clockMinute)}。`);
  }
  const solar=calculateTrueSolarTime({...baseDate,clockHour,clockMinute,longitude,utcOffsetMinutes:offset});
  const dateOffset=resolveZiweiDayOffset(solar,input.late);
  const effective=shiftGregorianDate(baseDate,dateOffset);
  if(effective.year<1900||effective.year>2050) throw new EffectiveDateRangeError('换日或时间校正后的日期超出 1900—2050 支持范围，请核对出生时间、时区与排盘口径。');
  const effectiveDate=formatDate(effective);
  if(input.correction==='solar') details.push(`真太阳时 ${formatTrueSolarClock(solar,true)}；经度修正 ${solar.longitudeCorrectionMinutes.toFixed(1)} 分钟，均时差 ${solar.equationOfTimeMinutes.toFixed(1)} 分钟。`);
  else details.push('未做真太阳时、时区或夏令时修正，直接按输入钟表时间排盘。');
  details.push(`排盘日 ${effectiveDate} · ${BRANCHES[solar.branch]}时；晚子时${input.late==='next-day'?'换至次日':'按当日'}；闰月：${LEAP_LABEL[input.leap]}。`);
  return {effective,effectiveDate,solar,details,longitude,original:{year,month,day,clockHour:hh,clockMinute:mm}};
}
export function makeChart(input:BirthForm):ChartResult {
  const {effective,effectiveDate,solar,details,longitude,original}=resolveBirthTime(input);
  setBrightnessSchool(input.brightness);
  const birth={...effective,hour:solar.branch,gender:input.gender as 'male'|'female',name:input.name||undefined,longitude,origInput:original};
  const chart=generateChart(birth,{leapMonth:input.leap});
  return {chart,form:{...input},effectiveDate,branch:solar.branch,solarClock:formatTrueSolarClock(solar,true),details,id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,uncertain:Boolean(input.timeApprox)};
}
export function major(p?:Palace){return p?.stars.filter(s=>s.type==='major').map(s=>s.name).join('、')||'无主星';}
export function palaceByName(c:ZiweiChart,name:string){return c.palaces.find(p=>p.name.replace('宫','')===name.replace('宫',''));}
export function patterns(result:ChartResult){return detectPatterns(result.chart)}
const QUESTION_TERMS: [string[],string,string][] = [
  [['事业','职业','工作','求职','官禄','创业','升职','跳槽','转行','上班','职场'],'官禄','事业'],
  [['财','钱','收入','投资','存款','副业','开销','理财'],'财帛','财帛'],
  [['感情','婚','伴侣','爱情','关系','夫妻','恋爱','桃花','另一半','对象','脱单'],'夫妻','关系'],
  [['健康','身体','疾病','疾厄','失眠','睡眠','体检','养生','生病'],'疾厄','健康'],
  [['父母','长辈','老板','上司','领导','师长'],'父母','父母'],
  [['兄弟','姐妹','手足','闺蜜','死党','同辈','哥哥','弟弟','姐姐','妹妹'],'兄弟','兄弟'],
  [['子女','孩子','晚辈','育儿','小孩','学生'],'子女','子女'],
  [['迁移','出国','外地','移居','出差','外派','留学','异地'],'迁移','迁移'],
  [['朋友','人际','合作','交友','仆役','贵人','同事','下属','团队','客户','人脉'],'仆役','人际'],
  [['房','家庭','居住','田宅','置业','搬家','物业','家宅'],'田宅','田宅'],
  [['福德','精神','内心','焦虑','安全感','内耗','休息','情绪'],'福德','福德'],
  [['性格','自己','命宫','命格','脾气','优缺点'],'命宫','命格']
 ];
export function horoscopeTexts(result:ChartResult,question:string){
 const selected=QUESTION_TERMS.filter(([keys])=>keys.some(k=>question.includes(k)));
 const starMatch=result.chart.palaces.flatMap(p=>p.stars.map(s=>({p,s}))).find(({s})=>question.includes(s.name));
 if(!selected.length&&!starMatch)return [{topic:'未识别',palace:undefined,description:'',nearby:'',notice:'当前使用关键词检索，尚不能理解这个问题；请尝试明确写出事业、感情、命宫等主题。'}];
 const targets=selected.length?selected.map(item=>({p:palaceByName(result.chart,item[1]),topic:item[2]})):[{p:starMatch?.p,topic:`${starMatch?.s.name}所在宫位`}];
 return targets.map(({p,topic})=>{
 const main=p?.stars.filter(s=>s.type==='major')??[];
 const desc=main.map(s=>{const d=STAR_DESCRIPTIONS[s.name];return d?`${s.name}：${d.keywords}（${d.nature}）`:s.name}).join('；');
 const nearby=p?.stars.filter(s=>s.type!=='major').slice(0,6).map(s=>`${s.name}${s.siHua?'化'+s.siHua:''}`).join('、');
 return {topic,palace:p,description:desc,nearby:nearby||'无',notice:p?.name.replace('宫','')==='疾厄'?'命盘不用于诊断疾病或决定治疗。':'这些词语是传统资料中的描述，不是对真实经历或未来结果的验证。'};
 });
}
export function horoscopeText(result:ChartResult,question:string){return horoscopeTexts(result,question)[0]}
export function chartSummary(result:ChartResult){
 const c=result.chart;return [result.uncertain?'注意：这是一张候选时刻盘，并非已核实的出生时刻。':'',`出生资料：${result.form.date} ${result.form.time}，${result.form.gender==='male'?'男':'女'}`, ...result.details,`命宫：${BRANCHES[c.mingGongBranch]}；身宫：${BRANCHES[c.shenGongBranch]}；${c.wuxingJuName}`,...c.palaces.map(p=>`${p.name}（${STEMS[p.stem]}${BRANCHES[p.branch]}）：${p.stars.map(s=>s.name+(s.siHua?`化${s.siHua}`:'')).join('、')}`)].join('\n');
}
/** A selected civil date defines the lunar year; lunar new year is the boundary. */
export function calendarOverlay(result:ChartResult,date:string){
 const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
 if(!m) return null;
 const [year,month,day]=m.slice(1).map(Number);
 if(year<1900||year>2100||!isValidGregorianDate(year,month,day)) return null;
 const lunarYear=Solar.fromYmd(year,month,day).getLunar().getYear();
 const [by,bm,bd]=result.effectiveDate.split('-').map(Number);
 const birthLunarYear=Solar.fromYmd(by,bm,bd).getLunar().getYear();
 const nominalAge=lunarYear-birthLunarYear+1;
 const decade=date>=result.effectiveDate?result.chart.daXians.find(d=>nominalAge>=d.startAge&&nominalAge<=d.endAge):undefined;
 return {lunarYear,birthLunarYear,nominalAge,decade,stemIndex:((lunarYear-4)%10+10)%10};
}
/** Preserve the uncertainty of a candidate time until its clock time changes or is explicitly verified. */
export function chartTimeUncertain(form:BirthForm,previous:ChartResult|null){
 return Boolean(form.timeApprox||(previous?.uncertain&&form.time===previous.form.time));
}
export type FlowScope='yearly'|'monthly'|'daily'|'hourly';
/** Rebuild with the selected leap-month policy for the iztro flow calculations. */
function iztroNatal(result:ChartResult){
 const [year,month,day]=result.effectiveDate.split('-').map(Number);
 const effective=resolveEffectiveLunarDate(year,month,day,result.form.leap);
 const gender=result.form.gender==='male'?'男':'女';
 return result.form.leap!=='split'&&effective.rawLunarMonth<0
  ?astro.byLunar(`${effective.lunarYear}-${effective.lunarMonth}-${effective.lunarDay}`,result.branch,gender,effective.isLeapMonth,false,'zh-CN')
  :astro.bySolar(result.effectiveDate,result.branch,gender,true,'zh-CN');
}
/** Rebuild the natal chart using the same leap-month policy, then ask iztro for a flow layer. */
export function flowContext(result:ChartResult,date:string,time:string,scope:FlowScope){
 const calendar=calendarOverlay(result,date);const tm=/^(\d{2}):(\d{2})$/.exec(time);
 if(!calendar||date<result.effectiveDate||!tm||Number(tm[1])>23||Number(tm[2])>59)return null;
 const natal=iztroNatal(result);
 const hour=Number(tm[1]);const timeIndex=hour===23?12:Math.floor((hour+1)/2);
 const flow=natal.horoscope(date,timeIndex)[scope];
 const palace=natal.palaces[flow.index];if(!palace)return null;
 const branch=BRANCHES.indexOf(palace.earthlyBranch);if(branch<0)return null;
 const names:Record<number,string>={};
 natal.palaces.forEach((p,i)=>{const b=BRANCHES.indexOf(p.earthlyBranch);if(b>=0&&flow.palaceNames[i])names[b]=flow.palaceNames[i]});
 return {branch,names,stem:flow.heavenlyStem,mutagen:flow.mutagen.map(String),label:flow.name};
}
/** Small-limit palace follows iztro's male-forward/female-reverse age sequence, using lunar-year nominal age. */
export function smallLimitContext(result:ChartResult,date:string){
 const calendar=calendarOverlay(result,date);
 if(!calendar||date<result.effectiveDate||calendar.nominalAge<1)return null;
 const ageInCycle=(calendar.nominalAge-1)%12+1;
 const palace=iztroNatal(result).palaces.find(p=>p.ages.includes(ageInCycle));
 if(!palace)return null;
 const branch=BRANCHES.indexOf(palace.earthlyBranch);if(branch<0)return null;
 return {branch,nominalAge:calendar.nominalAge,palaceName:palace.name};
}
export type CandidatePeriod={time:string;start:string;end:string;result:ChartResult};
export function candidatePeriods(form:BirthForm){
 const clock=(minute:number)=>`${pad(Math.floor(minute/60))}:${pad(minute%60)}`;
 const groups:{start:number;end:number;key:string}[]=[];
 const excluded:{start:number;end:number}[]=[];
 // Inputs have minute precision. Group every minute by effective date and branch,
 // keeping out-of-range intervals explicit rather than losing the rest of the day.
 for(let minute=0;minute<1440;minute++){
  let resolved:ReturnType<typeof resolveBirthTime>;
  try{resolved=resolveBirthTime({...form,time:clock(minute),unknownTime:false})}
  catch(e){
   if(!(e instanceof EffectiveDateRangeError))throw e;
   const last=excluded.at(-1);if(last?.end===minute-1)last.end=minute;else excluded.push({start:minute,end:minute});
   continue;
  }
  const key=`${resolved.effectiveDate}/${resolved.solar.branch}`;
  const last=groups.at(-1);
  if(last?.key===key&&last.end===minute-1) last.end=minute;
  else groups.push({start:minute,end:minute,key});
 }
 if(!groups.length)throw new EffectiveDateRangeError('所有候选时段经换日或时间校正后都超出 1900—2050 支持范围，请核对日期、时区与排盘口径。');
 const periods=groups.map(group=>{
  const time=clock(Math.floor((group.start+group.end)/2));
  return {time,start:clock(group.start),end:clock(group.end),result:{...makeChart({...form,time,unknownTime:false}),uncertain:true}};
 });
 return {periods,excluded:excluded.map(group=>({start:clock(group.start),end:clock(group.end)}))};
}
/** Strict convenience wrapper for callers that require all 1,440 minutes to be covered. */
export function candidates(form:BirthForm){
 const result=candidatePeriods(form);
 if(result.excluded.length)throw new EffectiveDateRangeError('部分候选时段超出支持范围，请使用带排除时段的候选比较。');
 return result.periods;
}

const BRANCH_CLOCK_REP = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

/** Build an approximate BirthForm preset from an upstream famous-person entry. */
export function famousBirthForm(person: FamousPerson): BirthForm {
  return {
    ...DEFAULT_FORM,
    name: `${person.name}（示例）`,
    date: `${person.year}-${pad(person.month)}-${pad(person.day)}`,
    time: BRANCH_CLOCK_REP[person.hour] ?? '12:00',
    gender: person.gender,
    timeApprox: true,
    calendar: 'solar',
  };
}

/** Detect运限〈定杂局〉hits for the full chart or a specific nominal age. */
export function decadePatterns(result: ChartResult, age?: number): DingZaHit[] {
  return detectDingZa(result.chart, age !== undefined ? { age } : undefined);
}

export type PalaceShierShen = {
  boshi: string;
  suiqian: string;
  jiangqian: string;
};

/** Compute 博士十二神 / 岁前十二神 / 将前十二神 indexed by palace branch (0-11). */
export function shierShenForChart(result: ChartResult, scopeBranch?: number): Record<number, PalaceShierShen> {
  const { chart } = result;
  const natalYearBranch = chart.lunarInfo.yearBranch;
  const anchorBranch = typeof scopeBranch === 'number' && scopeBranch >= 0 ? scopeBranch : natalYearBranch;
  const boshiIdx = boshiShenByStem(chart.lunarInfo.yearStem, chart.birthInfo.gender);
  const suiqianIdx = suiQianShenByBranch(anchorBranch);
  const jiangqianIdx = jiangQianShenByBranch(anchorBranch);
  const out: Record<number, PalaceShierShen> = {};
  for (let branch = 0; branch < 12; branch++) {
    out[branch] = {
      boshi: BOSHI_SHEN[boshiIdx[branch]] ?? '',
      suiqian: SUI_QIAN_SHEN[suiqianIdx[branch]] ?? '',
      jiangqian: JIANG_QIAN_SHEN[jiangqianIdx[branch]] ?? '',
    };
  }
  return out;
}

export {
  FAMOUS_PERSONS,
  STAR_IN_FUQI_GU,
  SIHUA_IN_FUQI_GU,
  HEMING_METHODOLOGY,
  MARRIAGE_STARS_BRIEF,
  HEMING_SCORE_CRITERIA,
};
export type { FamousPerson, DingZaHit };
