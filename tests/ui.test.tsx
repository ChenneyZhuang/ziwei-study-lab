import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'node:assert/strict';
import App, { ChartPage } from '../src/App';
import { BirthEditor, selectBirthCity } from '../src/components';
import { DEFAULT_FORM, makeChart } from '../src/core';
import Assistant from '../src/pages/Assistant';
import Compare from '../src/pages/Compare';
import Library from '../src/pages/Library';
import Relationship from '../src/pages/Relationship';
import Research from '../src/pages/Research';
import Similar from '../src/pages/Similar';
import Liuren from '../src/pages/Liuren';

const form={...DEFAULT_FORM,date:'1990-01-01',time:'08:00',gender:'female' as const};
const chart=makeChart(form);
const noop=()=>{};
Object.defineProperty(globalThis,'localStorage',{value:{getItem:()=>null},configurable:true});
const home=renderToStaticMarkup(<App/>);
for(const label of ['工作台','我的命盘','问盘助手','资料与典籍','口径对照','双人合盘','相似命盘样本','小六壬','数据实验室'])assert.ok(home.includes(label),label);
const html=renderToStaticMarkup(<ChartPage form={form} setForm={noop} result={chart} setResult={noop} go={noop} save={noop} saved={[]} openSaved={noop} removeSaved={noop} exportSaved={noop} importSaved={noop} storageError=""/>);
assert.ok(html.includes('先看懂这张命盘'));
assert.ok(html.indexOf('先看懂这张命盘')<html.indexOf('THE CELESTIAL MAP'),'解读应先于命盘图呈现');
for(const label of ['命格总览','性格与自我','事业与工作','财务与资源','亲密关系','身体与照顾','手足与同辈','子女与照护','外出与环境','朋友与合作','家宅与居住','内心与休息','长辈与支持'])assert.ok(html.includes(label),label);
for(const label of ['本命','大限','小限','流年','流月','流日','流时','宫干飞星'])assert.ok(html.includes(label),label);
assert.ok(html.includes('修改资料')&&html.includes('chart-workspace'),'生成后应收拢资料并同时呈现盘面与解读');
assert.ok(html.includes('查阅开源解读'),'应能从解读找到开源数据入口');
assert.ok(html.includes('不是 AI 生成'));
assert.ok(html.includes('print-report')&&html.includes('打印 / 存为 PDF'));
const uncertain=renderToStaticMarkup(<ChartPage form={form} setForm={noop} result={{...chart,uncertain:true}} setResult={noop} go={noop} save={noop} saved={[]} openSaved={noop} removeSaved={noop} exportSaved={noop} importSaved={noop} storageError=""/>);
assert.ok(uncertain.includes('出生时间尚未核实'));
const lunar=renderToStaticMarkup(<BirthEditor value={{...form,calendar:'lunar',lunarYear:'2023',lunarMonth:'2',lunarDay:'1',lunarLeap:true,date:'2023-03-22'}} onChange={noop} onSubmit={noop}/>);
for(const label of ['农历年份','农历月份','农历日期','这是闰月','对应公历 2023-03-22'])assert.ok(lunar.includes(label),label);
const approximate=renderToStaticMarkup(<BirthEditor value={{...form,timeApprox:true,correction:'solar',longitude:'151.21',standardOffset:'10',actualOffset:'11',cityName:'海外 / 悉尼'}} onChange={noop} onSubmit={noop}/>);
for(const label of ['按时辰选择','代表时刻','悉尼','出生时实际时区'])assert.ok(approximate.includes(label),label);
const previous={...form,correction:'solar' as const,longitude:'151.21',standardOffset:'10',actualOffset:'11',cityName:'海外 / 悉尼'};
const london=selectBirthCity(previous,'海外 / 伦敦');assert.equal(london.longitude,'-0.13');assert.equal(london.standardOffset,'0');assert.equal(london.actualOffset,'');assert.equal(previous.actualOffset,'11');
const pages=[
 [<Assistant result={chart} goChart={noop}/>, '问盘助手'],
 [<Compare form={form} result={chart} onPick={noop} goChart={noop}/>, '口径对照'],
 [<Library/>, '资料与典籍'],
 [<Relationship first={chart} goChart={noop}/>, '双人合盘'],
 [<Research current={chart}/>, '数据实验室'],
 [<Similar current={chart} goChart={noop}/>, '相似命盘样本'],
 [<Liuren/>, '小六壬'],
] as const;
for(const [page,label] of pages)assert.ok(renderToStaticMarkup(page).includes(label),label);
for(const [page,label] of [
 [<Assistant result={null} goChart={noop}/>, '先有一张命盘'],
 [<Compare form={DEFAULT_FORM} result={null} onPick={noop} goChart={noop}/>, '先填写出生资料'],
 [<Relationship first={null} goChart={noop}/>, '先建立第一张命盘'],
 [<Relationship first={null} saved={[{id:'saved-1',form}]} goChart={noop}/>, '快速选取第一张命盘'],
 [<Relationship first={chart} saved={[{id:'saved-1',form:{...form,name:'保存档案A'}}]} goChart={noop}/>, '保存档案A'],
 [<Similar current={null} goChart={noop}/>, '先建立一张命盘'],
] as const)assert.ok(renderToStaticMarkup(page).includes(label),label);
console.log('UI structure passed: automatic reading, 13 topics, flow choices, lunar form and every workspace page.');
