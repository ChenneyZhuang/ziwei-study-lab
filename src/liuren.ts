import { Solar } from 'lunar-javascript';
import { isValidGregorianDate, shiftGregorianDate } from './vendor/ziwei/true-solar-time';
import { BRANCH_NAMES, formatDate } from './core';

export const LIUREN_NAMES=['大安','留连','速喜','赤口','小吉','空亡'] as const;
export const LIUREN_MEANINGS:Record<
 typeof LIUREN_NAMES[number],
 {meaning:string;reflection:string;classicVerse:string;classicPlain:string}
>={
 大安:{
  classicVerse:'大安事事昌，求谋在东方；失物去不远，宅舍保安康。',
  classicPlain:'古口诀白话：整体态势沉稳顺遂，适合守住已经稳妥的基本盘。找东西多半就在身边或常待之处，人平安、家里或日常事务安稳最重要。',
  meaning:'代表稳当、踏实、节奏慢而牢固，适合按部就班把已定好的事情收尾推进，不适合临时起意去赌高风险新摊子。',
  reflection:'实在建议：先把手头稳当可控制的那几步做牢；如果有找东西、等合同或确认安排，先从熟悉的环境或既有进度里稳稳推进。',
 },
 留连:{
  classicVerse:'留连事难成，求谋日未明；官事只宜缓，去者未回程。',
  classicPlain:'古口诀白话：事情眼下容易卡在半空拖着、一时得不到痛快准信；如果是沟通谈判、找人或等批复，急着催也未必立马出结果，反而宜慢半拍核清楚。',
  meaning:'表示停顿、拖延、反复拉锯或暂时卡住，不是坏结局，而是信号提醒“目前信息还没完全明朗，急着硬推多半要反复返工”。',
  reflection:'实在建议：别在同一天里指望一口气拍板，检查卡在哪里（谁还没回消息、哪个手续或数据缺位），给自己和对方留出缓冲余地。',
 },
 速喜:{
  classicVerse:'速喜喜来临，求财向南行；失物申未午，逢人路上寻。',
  classicPlain:'古口诀白话：好消息、突破进展或有人带信儿很快会到眼前，适合主动迎上去抓住机会，节奏明显提快；但话到面前还是顺手核实一下细节最稳。',
  meaning:'表示信息来得快、行动有回应、事情出现积极转机或短期小好消息；很利联系沟通、快速推进已有方案和出门拜访。',
  reflection:'实在建议：遇到传来的好风声或突来机会时反应要果断，同时也别光听表面一高兴就忘了核对具体时间、价格与条件。',
 },
 赤口:{
  classicVerse:'赤口主口舌，官非切宜防；失物急去寻，行人有惊慌。',
  classicPlain:'古口诀白话：古代“赤口”重点怕吵架惹官司与口头冲突。现代来看就是这段话容易说重、双方抓错字眼闹不快，或者事情突然有点惊慌忙碌感，注意说话别上头！',
  meaning:'象征沟通摩擦、话赶话误会、急性争执或小意外惊扰（如文件写错、临时催单等）；不是注定倒霉，而是高声提醒“闭嘴慢三秒、凡事留书面”。',
  reflection:'实在建议：遇到扯皮先核事实再回复、重要约定发微信文字确认而不是全靠口头争，少在生气急躁那几分钟里回击或开车抢道。',
 },
 小吉:{
  classicVerse:'小吉最吉昌，路上好商量；阴人来报喜，失物在坤方。',
  classicPlain:'古口诀白话：遇到不错的小助力与好商量的贵人缘，虽然未必惊天动地发大财，但事情顺顺当当、一路多有身边女性长辈或靠谱队友搭把手。',
  meaning:'代表小范围的配合顺利、温和顺手、人情与协作刚刚好；很适合把复杂目标拆成眼下小步骤稳妥落地，借助他人好意一起往前推。',
  reflection:'实在建议：别好高骛远非一口吃成胖子，从眼下最顺手的小事动手，礼貌多问一句身边信得过的朋友或同事往往就有好思路。',
 },
 空亡:{
  classicVerse:'空亡事不祥，阴人少乖张；求财无利益，行人有灾殃。',
  classicPlain:'古口诀白话：古词听着吓人，其实直译就是“十有八九暂时落空、条件没凑齐、计划随时会临时改道”。越是这种时候越不能盲目投大钱或全押在一件事上。',
  meaning:'表示预期暂未成型、信息不真或白跑一趟的几率偏高；此时强求反而空消耗，倒不如当作老天给的“复查与放空窗口”，重新审视方案是否真可行。',
  reflection:'实在建议：涉及真金白银花大钱、重大签约或急着要准信的事，建议先往后缓一缓留 B 计划，不轻信口头画饼或模糊传闻。',
 },
};
export function sixPositions(month:number,day:number,branch:number){
 if(!Number.isInteger(month)||month<1||month>12||!Number.isInteger(day)||day<1||day>30||!Number.isInteger(branch)||branch<0||branch>11)throw new Error('农历月、日或时辰无效。');
 const monthIndex=(month-1)%6;const dayIndex=(monthIndex+day-1)%6;const hourIndex=(dayIndex+branch)%6;
 return {month:LIUREN_NAMES[monthIndex],day:LIUREN_NAMES[dayIndex],hour:LIUREN_NAMES[hourIndex]};
}
export function liurenForClock(date:string,time:string,late:'current-day'|'next-day'){
 const d=/^(\d{4})-(\d{2})-(\d{2})$/.exec(date),t=/^(\d{2}):(\d{2})$/.exec(time);
 if(!d||!t)throw new Error('请选择完整日期与时间。');
 const [year,month,day]=d.slice(1).map(Number),hour=Number(t[1]),minute=Number(t[2]);
 if(year<1900||year>2050||!isValidGregorianDate(year,month,day)||hour>23||minute>59)throw new Error('请选择 1900—2050 年内有效的日期与时间。');
 const effective=shiftGregorianDate({year,month,day},hour===23&&late==='next-day'?1:0);
 if(effective.year>2050)throw new Error('换日后超出支持的日期范围。');
 const lunar=Solar.fromYmd(effective.year,effective.month,effective.day).getLunar();
 const lunarMonth=Math.abs(lunar.getMonth()),lunarDay=lunar.getDay();
 const branch=hour===23||hour===0?0:Math.floor((hour+1)/2);
 return {effectiveDate:formatDate(effective),lunarYear:lunar.getYear(),lunarMonth,lunarDay,isLeap:lunar.getMonth()<0,branch:BRANCH_NAMES[branch],positions:sixPositions(lunarMonth,lunarDay,branch)};
}
