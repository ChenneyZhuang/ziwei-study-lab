import { BRIGHT_LABEL, LEAP_LABEL, EffectiveDateRangeError, candidatePeriods, makeChart, type BirthForm, type ChartResult } from './core';

export type CompareMode='time'|'late'|'leap'|'brightness';
export type ComparisonRow={label:string;result:ChartResult};

/** Return every supported comparison and report any deliberately omitted boundary cases. */
export function createComparisons(base:BirthForm,mode:CompareMode,inheritedUncertainty=false):{rows:ComparisonRow[];omitted:string}{
 const uncertain=Boolean(inheritedUncertainty||base.unknownTime||base.timeApprox);
 let rows:ComparisonRow[]=[];let omitted='';
 if(mode==='time'){
  const {periods,excluded}=candidatePeriods(base);
  rows=periods.map(v=>({label:`${v.start}–${v.end}（代表 ${v.time}）`,result:v.result}));
  if(excluded.length)omitted=`以下出生地钟表时间经换日或校正后超出支持范围，未列入：${excluded.map(v=>`${v.start}–${v.end}`).join('、')}。`;
 }
 if(mode!=='time'&&(uncertain||!base.time))throw new Error('请先填写具体出生时间（并取消“出生时间不确定”），或先在「01 候选时辰」中选择一个候选时辰再比较此规则。');
 if(mode==='late'){
  const unavailable:string[]=[];
  for(const late of ['next-day','current-day'] as const){
   const label=late==='next-day'?'晚子时换日':'晚子时按当日';
   try{rows.push({label,result:{...makeChart({...base,unknownTime:false,late}),uncertain}})}
   catch(error){if(error instanceof EffectiveDateRangeError)unavailable.push(label);else throw error}
  }
  if(!rows.length)throw new EffectiveDateRangeError('两种换日口径都超出支持范围，请核对出生日期与时间校正。');
  if(unavailable.length)omitted=`${unavailable.join('、')}后的日期超出支持范围，未列入比较。`;
 }
 if(mode==='leap')rows=(['split','next-month','prev-month','origin-month'] as const).map(leap=>({label:LEAP_LABEL[leap],result:{...makeChart({...base,unknownTime:false,leap}),uncertain}}));
 if(mode==='brightness')rows=(['QS','XD1','XD2','ZZ'] as const).map(brightness=>({label:BRIGHT_LABEL[brightness],result:{...makeChart({...base,unknownTime:false,brightness}),uncertain}}));
 return {rows,omitted};
}
