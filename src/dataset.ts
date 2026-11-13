export type DatasetRow = {k:string;c:Record<string,string>};
import type { ZiweiChart } from './vendor/ziwei/types';
import { BRANCHES } from './vendor/ziwei/constants';

/** Flag only explicit star/branch/brightness claims; absence of a flag is not a compatibility check. */
export function datasetBrightnessConflicts(row:DatasetRow,chart:ZiweiChart){
 const combined=Object.values(row.c).filter((v):v is string=>typeof v==='string').join('\n');
 const conflicts:string[]=[];
 for(const palace of chart.palaces)for(const star of palace.stars){
  if(!star.brightnessRaw)continue;
  const re=new RegExp(`${star.name}[\\s*]*在[\\s*]*${BRANCHES[palace.branch]}宫[\\s*]*(?:→|：|:)[\\s*]*(落陷|入庙|陷|庙|旺|得|利|平|不|闲|地)`,'g');
  for(const match of combined.matchAll(re)){
   const reported=match[1]==='落陷'?'陷':match[1]==='入庙'?'庙':match[1];
   if(reported!==star.brightnessRaw){const description=`${star.name}在${BRANCHES[palace.branch]}宫：资料写“${match[1]}”，当前盘面为“${star.brightnessRaw}”`;if(!conflicts.includes(description))conflicts.push(description)}
  }
 }
 return conflicts;
}
/** Stream local JSONL and parse only candidate lines. Nothing is sent over the network. */
export async function findDatasetRecord(file:Blob,key:string):Promise<DatasetRow|null>{
 const reader=file.stream().pipeThrough(new TextDecoderStream()).getReader();let buffer='';let done=false;let found:DatasetRow|null=null;
 try {
  while(!done&&!found){const part=await reader.read();done=part.done;buffer+=part.value||'';let next:number;
   while((next=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,next);buffer=buffer.slice(next+1);if(line.includes(key)){const parsed=JSON.parse(line) as DatasetRow;if(parsed.k===key){found=parsed;break}}}
   if(buffer.length>2000000)throw new Error('输入不是预期的逐行 JSON 文件。');
  }
  if(!found&&buffer.includes(key)){const parsed=JSON.parse(buffer) as DatasetRow;if(parsed.k===key)found=parsed}
  return found;
 } finally {await reader.cancel()}
}
