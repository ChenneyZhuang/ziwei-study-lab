import { makeChart, type BirthForm } from './core';

export type Saved = { id:string; form:BirthForm; uncertain?:boolean };
export const STORAGE='ziwei-study-lab-saved-v1';

/** Fail closed if existing storage is unreadable: never replace it with an empty list. */
export function readSaved(storage:Pick<Storage,'getItem'>):Saved[]{
 const raw=storage.getItem(STORAGE);
 if(raw===null)return [];
 let value:unknown;
 try{value=JSON.parse(raw)}catch{throw new Error('本机记录无法解析，已停止写入以保护原数据。')}
 if(!Array.isArray(value)||value.some(v=>!v||typeof v!=='object'||typeof v.id!=='string'||!v.form||typeof v.form!=='object')){
  throw new Error('本机记录格式异常，已停止写入以保护原数据。');
 }
 return value as Saved[];
}

export function makeBackup(records:Saved[]){
 return JSON.stringify({format:'ziwei-study-lab-backup',version:1,createdAt:new Date().toISOString(),records},null,2);
}

export function upsertSaved(existing:Saved[],item:Saved){
 return [item,...existing.filter(record=>record.id!==item.id)];
}

/** Validate the whole backup before merging; an invalid record never causes a partial import. */
export function parseBackup(text:string):Saved[]{
 let backup:unknown;
 try{backup=JSON.parse(text)}catch{throw new Error('备份文件不是有效的 JSON。')}
 if(!backup||typeof backup!=='object')throw new Error('备份格式不正确。');
 const b=backup as {format?:unknown;version?:unknown;records?:unknown};
 if(b.format!=='ziwei-study-lab-backup'||b.version!==1||!Array.isArray(b.records))throw new Error('这不是本网站支持的备份文件。');
 const ids=new Set<string>();
 return b.records.map((item:unknown,index:number)=>{
  if(!item||typeof item!=='object')throw new Error(`第 ${index+1} 条记录格式错误。`);
  const v=item as Saved;
  if(typeof v.id!=='string'||!v.id||ids.has(v.id)||!v.form||typeof v.form!=='object'||(v.uncertain!==undefined&&typeof v.uncertain!=='boolean'))throw new Error(`第 ${index+1} 条记录格式错误或编号重复。`);
  try{makeChart(v.form)}catch{throw new Error(`第 ${index+1} 条记录无法排盘，未导入任何内容。`)}
  ids.add(v.id);
  return {id:v.id,form:v.form,uncertain:v.uncertain};
 });
}

/** Existing records win conflicts; imports never silently overwrite local records. */
export function mergeSaved(existing:Saved[],incoming:Saved[]){
 const ids=new Set(existing.map(v=>v.id));
 const additions=incoming.filter(v=>!ids.has(v.id));
 return {records:[...additions,...existing],added:additions.length,skipped:incoming.length-additions.length};
}
