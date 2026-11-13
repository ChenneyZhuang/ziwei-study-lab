import { useEffect, useId, useMemo, useState } from 'react';
import { ArrowLeftRight, BookmarkCheck, HeartHandshake, Sparkles, UserPlus } from 'lucide-react';
import {
  BRANCH_NAMES,
  DEFAULT_FORM,
  FAMOUS_PERSONS,
  STEM_NAMES,
  candidatePeriods,
  famousBirthForm,
  major,
  makeChart,
  palaceByName,
  type BirthForm,
  type ChartResult,
} from '../core';
import type { Saved } from '../storage';
import { BirthEditor, EmptyState, SectionHead } from '../components';
import { analyzeRelationship } from '../relationship-analysis';
import {
  HEMING_SCORE_CRITERIA,
} from '../vendor/ziwei/heming-knowledge';

export default function Relationship({
  first,
  saved = [],
  goChart,
}: {
  first: ChartResult | null;
  saved?: Saved[];
  goChart: () => void;
}) {
  const tableTitleId = useId();
  const [localA, setLocalA] = useState<ChartResult | null>(null);
  const [selectedAId, setSelectedAId] = useState<string>('');

  const [form, setForm] = useState<BirthForm>({ ...DEFAULT_FORM });
  const [second, setSecond] = useState<ChartResult | null>(null);
  const [selectedBId, setSelectedBId] = useState<string>('');
  const [choices, setChoices] = useState<ReturnType<typeof candidatePeriods>['periods']>([]);
  const [error, setError] = useState('');

  // Keep synced if parent current chart changes and user hasn't swapped/overridden A manually
  useEffect(() => {
    setLocalA(null);
    setSelectedAId('');
  }, [first?.id]);

  const activeA = localA ?? first;

  const savedCharts = useMemo(
    () =>
      saved.flatMap((item) => {
        try {
          const chart = makeChart(item.form);
          return [{ saved: item, chart: { ...chart, id: item.id, uncertain: item.uncertain } }];
        } catch {
          return [];
        }
      }),
    [saved],
  );

  const loadSavedAs = (target: 'A' | 'B', item: { saved: Saved; chart: ChartResult }) => {
    setError('');
    setChoices([]);
    if (target === 'A') {
      setLocalA(item.chart);
      setSelectedAId(item.saved.id);
    } else {
      setForm(item.saved.form);
      setSecond(item.chart);
      setSelectedBId(item.saved.id);
    }
  };

  const loadFamousAs = (target: 'A' | 'B', personId: string) => {
    const person = FAMOUS_PERSONS.find((p) => p.id === personId);
    if (!person) return;
    setError('');
    setChoices([]);
    try {
      const f = famousBirthForm(person);
      const r: ChartResult = { ...makeChart(f), id: `famous-${person.id}`, uncertain: true };
      if (target === 'A') {
        setLocalA(r);
        setSelectedAId(`famous-${person.id}`);
      } else {
        setForm(f);
        setSecond(r);
        setSelectedBId(`famous-${person.id}`);
      }
    } catch {
      setError('加载名人示例失败，请改用手动录入或已保存命盘。');
    }
  };

  const swapCharts = () => {
    if (!activeA || !second) return;
    const prevA = activeA;
    const prevB = second;
    setLocalA(prevB);
    setSecond(prevA);
    setForm(prevA.form);
    const oldAId = selectedAId;
    setSelectedAId(selectedBId);
    setSelectedBId(oldAId);
  };

  const submit = () => {
    setError('');
    try {
      if (form.unknownTime) {
        const res = candidatePeriods(form);
        if (!res.periods.length) {
          setError('无法为这一天生成候选时辰，请检查出生日期。');
          return;
        }
        setChoices(res.periods);
        setSecond({ ...res.periods[0].result, uncertain: true });
        setSelectedBId('manual');
        return;
      }
      setChoices([]);
      setSecond(makeChart(form));
      setSelectedBId('manual');
    } catch (e) {
      setError(e instanceof Error ? e.message : '无法生成第二张命盘。');
    }
  };

  const report = useMemo(
    () => (activeA && second ? analyzeRelationship(activeA, second) : null),
    [activeA, second],
  );

  if (!activeA) {
    return (
      <div className="page-stack">
        <SectionHead
          eyebrow="COMPATIBILITY COMPARISON"
          title="双人合盘"
          description="对比两个人的脾气节奏、沟通方式、花钱分工，以及彼此生年四化落入对方生活里的真实牵动。"
        />
        <EmptyState
          title="先建立第一张命盘"
          description="先在「我的命盘」里算好自己的盘；如果本机已存过命盘或想先试一组名人对照，也可以在下方一键加载。"
          onAction={goChart}
          action="前往排盘"
        />

        {(savedCharts.length > 0 || FAMOUS_PERSONS.length > 0) && (
          <div className="card page-stack" style={{ gap: '0.9rem' }}>
            <div className="eyebrow" style={{ marginBottom: 0 }}>
              <BookmarkCheck size={13} aria-hidden="true" /> 快速选取第一张命盘
            </div>
            {savedCharts.length > 0 ? (
              <div className="page-stack" style={{ gap: '0.45rem' }}>
                <span className="small secondary">从本机已保存的命盘一键作为第一张：</span>
                <div className="btn-row">
                  {savedCharts.map((item) => (
                    <button
                      type="button"
                      key={item.saved.id}
                      className="btn btn-secondary"
                      onClick={() => loadSavedAs('A', item)}
                    >
                      {item.saved.form.name || item.saved.form.date}（{item.saved.form.date}）
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="page-stack" style={{ gap: '0.45rem' }}>
              <span className="small secondary">或者选两位名家样本直接看合盘效果：</span>
              <div className="btn-row">
                {FAMOUS_PERSONS.map((person) => (
                  <button
                    type="button"
                    key={person.id}
                    className="btn btn-ghost"
                    onClick={() => loadFamousAs('A', person.id)}
                  >
                    名家 · {person.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const aMing = palaceByName(activeA.chart, '命宫');
  const bMing = second ? palaceByName(second.chart, '命宫') : undefined;
  const sameChartWarning =
    Boolean(second) &&
    activeA.effectiveDate === second!.effectiveDate &&
    activeA.branch === second!.branch &&
    activeA.form.gender === second!.form.gender &&
    Boolean(activeA.uncertain) === Boolean(second!.uncertain);

  const siHuaBadgeStyle = (hua: '禄' | '权' | '科' | '忌') =>
    hua === '禄' || hua === '科'
      ? 'meta-pill accent'
      : hua === '忌'
      ? 'meta-pill'
      : 'meta-pill';

  return (
    <div className="page-stack">
      <SectionHead
        eyebrow="COMPATIBILITY COMPARISON"
        title="双人合盘"
        description="从真实相处出发，用大白话看懂两个人处事节奏、吵架和解画风、花钱分工，以及彼此生年四化怎么牵动对方。"
        action={
          <div className="btn-row">
            <span className="meta-pill">A · {activeA.form.name || activeA.form.date}</span>
            {second ? (
              <button type="button" className="btn btn-secondary" onClick={swapCharts}>
                <ArrowLeftRight size={15} aria-hidden="true" /> A ⇄ B 互换视角
              </button>
            ) : null}
          </div>
        }
      />

      <div className="split-grid-2">
        {/* 第一张命盘控制区 */}
        <section className="card page-stack" style={{ gap: '0.9rem', alignContent: 'start' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="brand-mark" aria-hidden="true">
                <HeartHandshake size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem' }}>命盘 A · {activeA.form.name || '当前命盘'}</h2>
                <p className="secondary small">
                  {activeA.form.date} {activeA.form.time || '（未定时刻）'} · {activeA.chart.wuxingJuName}
                </p>
              </div>
            </div>
            <button type="button" className="btn btn-ghost" onClick={goChart}>
              去修改
            </button>
          </div>

          <div className="reading-block">
            <div className="reading-block-title">基础盘面</div>
            <p className="small">
              命宫：<strong>{aMing ? major(aMing) : '—'}</strong> · 夫妻宫：
              <strong>{palaceByName(activeA.chart, '夫妻') ? major(palaceByName(activeA.chart, '夫妻')!) : '—'}</strong>
            </p>
            <p className="small muted">
              农历 {STEM_NAMES[activeA.chart.lunarInfo.yearStem]}
              {BRANCH_NAMES[activeA.chart.lunarInfo.yearBranch]} 年生
            </p>
          </div>

          {savedCharts.length > 0 ? (
            <div className="page-stack" style={{ gap: '0.45rem' }}>
              <div className="eyebrow" style={{ marginBottom: 0 }}>
                <BookmarkCheck size={13} aria-hidden="true" /> 切换 A 为本机已保存命盘
              </div>
              <div className="btn-row">
                {first && localA ? (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setLocalA(null);
                      setSelectedAId('');
                    }}
                  >
                    恢复当前排盘
                  </button>
                ) : null}
                {savedCharts.map((item) => {
                  const active = selectedAId === item.saved.id;
                  return (
                    <button
                      type="button"
                      key={item.saved.id}
                      aria-pressed={active}
                      className={active ? 'btn btn-primary' : 'btn btn-secondary'}
                      onClick={() => loadSavedAs('A', item)}
                    >
                      {item.saved.form.name || item.saved.form.date}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="page-stack" style={{ gap: '0.45rem' }}>
            <span className="small muted">或用名家样本作为 A：</span>
            <div className="btn-row">
              {FAMOUS_PERSONS.slice(0, 4).map((person) => (
                <button
                  type="button"
                  key={person.id}
                  aria-pressed={selectedAId === `famous-${person.id}`}
                  className={selectedAId === `famous-${person.id}` ? 'btn btn-primary' : 'btn btn-ghost'}
                  onClick={() => loadFamousAs('A', person.id)}
                >
                  {person.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 第二张命盘快速选取 + 手动录入 */}
        <section className="card page-stack" style={{ gap: '1rem', alignContent: 'start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="brand-mark" aria-hidden="true">
              <UserPlus size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem' }}>加入命盘 B（更快一键选）</h2>
              <p className="secondary small">
                {savedCharts.length > 0
                  ? '可直接点选本机已保存的命盘，或在下方输入对方出生时间。'
                  : '在下方输入对方出生资料，或直接点名家示例体验合盘。'}
              </p>
            </div>
          </div>

          {savedCharts.length > 0 ? (
            <div className="page-stack" style={{ gap: '0.45rem' }}>
              <div className="eyebrow" style={{ marginBottom: 0 }}>
                <BookmarkCheck size={13} aria-hidden="true" /> 本机已保存命盘（一点即合）
              </div>
              <div className="btn-row">
                {savedCharts.map((item) => {
                  const active = selectedBId === item.saved.id;
                  return (
                    <button
                      type="button"
                      key={item.saved.id}
                      aria-pressed={active}
                      className={active ? 'btn btn-primary' : 'btn btn-secondary'}
                      onClick={() => loadSavedAs('B', item)}
                    >
                      {item.saved.form.name || item.saved.form.date}（{item.saved.form.date}）
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="info-banner">
              <strong>提示：</strong> 在「我的命盘」里点“保存”后，这里会自动出现已保存命盘的一键合盘按钮。
            </div>
          )}

          <div className="page-stack" style={{ gap: '0.45rem' }}>
            <span className="small muted">名家参考示例（一点加载作为 B）：</span>
            <div className="btn-row">
              {FAMOUS_PERSONS.slice(0, 4).map((person) => (
                <button
                  type="button"
                  key={person.id}
                  aria-pressed={selectedBId === `famous-${person.id}`}
                  className={selectedBId === `famous-${person.id}` ? 'btn btn-primary' : 'btn btn-ghost'}
                  onClick={() => loadFamousAs('B', person.id)}
                >
                  {person.name}
                </button>
              ))}
            </div>
          </div>

          <details className="disclosure" open={!second || selectedBId === 'manual'}>
            <summary>手动录入 / 修改命盘 B 的出生资料</summary>
            <div className="disclosure-body">
              <BirthEditor
                value={form}
                onChange={setForm}
                onSubmit={submit}
                buttonText="生成对方命盘并合盘"
              />
            </div>
          </details>

          {error ? (
            <div className="field-error" role="alert">
              {error}
            </div>
          ) : null}

          {choices.length > 0 ? (
            <div className="page-stack" style={{ gap: '0.45rem' }}>
              <span className="small secondary">对方出生时辰未确定，点选不同候选时辰对比合盘：</span>
              <div className="btn-row">
                {choices.map((c) => {
                  const mingPalace = palaceByName(c.result.chart, '命宫');
                  return (
                    <button
                      type="button"
                      key={c.result.branch}
                      aria-pressed={second?.branch === c.result.branch}
                      className={second?.branch === c.result.branch ? 'btn btn-primary' : 'btn btn-secondary'}
                      onClick={() => setSecond({ ...c.result, uncertain: true })}
                    >
                      {BRANCH_NAMES[c.result.branch]}时 ({c.start}–{c.end}) · 命宫 {major(mingPalace)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {sameChartWarning ? (
        <div className="info-banner" role="status">
          <strong>提示：</strong> 命盘 A 与命盘 B 目前使用的是同一份出生时间和性别，所以下方对比会反映出两个完全一致的盘面；建议选另一位保存在本机里的亲友盘，或加载不同名人示例对比体验。
        </div>
      ) : null}

      {report && second ? (
        <>
          {/* 1. 大白话总评卡 */}
          <section className="card page-stack" style={{ gap: '1rem' }}>
            <div className="split-header">
              <div>
                <div className="eyebrow">
                  <Sparkles size={13} aria-hidden="true" /> PAIRWISE SUMMARY · 大白话合盘总评
                </div>
                <h2 style={{ fontSize: '1.3rem' }}>{report.headline}</h2>
              </div>
              <div className="btn-row">
                <span className="meta-pill">
                  {report.aName}（命宫 {aMing ? major(aMing) : '—'}）
                </span>
                <span className="meta-pill accent">
                  {report.bName}（命宫 {bMing ? major(bMing) : '—'}）
                </span>
              </div>
            </div>

            <div className="reading-block">
              <div className="reading-block-title">相处主基调</div>
              <p style={{ lineHeight: 1.75 }}>{report.chemistrySummary}</p>
            </div>

            <div className="split-grid-2">
              <div className="card-subtle page-stack" style={{ gap: '0.45rem' }}>
                <strong className="small" style={{ color: 'var(--accent-strong)' }}>
                  最合拍、彼此加分的地方
                </strong>
                {report.strengthHighlights.map((item, idx) => (
                  <p key={idx} className="small" style={{ lineHeight: 1.65 }}>
                    • {item}
                  </p>
                ))}
              </div>
              <div className="card-subtle page-stack" style={{ gap: '0.45rem' }}>
                <strong className="small" style={{ color: 'var(--seal)' }}>
                  最容易踩雷、需要商量的功课
                </strong>
                {report.watchHighlights.map((item, idx) => (
                  <p key={idx} className="small" style={{ lineHeight: 1.65 }}>
                    • {item}
                  </p>
                ))}
              </div>
            </div>
          </section>

          {/* 2. 三大日常相处切片 */}
          <section className="page-stack" style={{ gap: '0.75rem' }}>
            <div>
              <div className="eyebrow">DAILY LIFE SCENES</div>
              <h2 style={{ fontSize: '1.18rem' }}>如果真的一起生活或共事，会是什么画风？</h2>
            </div>
            <div className="split-grid-3">
              {report.lifeSlices.map((slice) => (
                <article key={slice.id} className="card page-stack" style={{ gap: '0.55rem' }}>
                  <h3 style={{ fontSize: '1.05rem' }}>{slice.title}</h3>
                  <p className="small" style={{ lineHeight: 1.7 }}>
                    {slice.summary}
                  </p>
                  <div className="reading-block" style={{ marginTop: 'auto' }}>
                    <div className="reading-block-title">实用应对</div>
                    <p className="small secondary" style={{ lineHeight: 1.65 }}>
                      {slice.advice}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* 3. 彼此吸引点对照 */}
          <section className="card page-stack" style={{ gap: '0.9rem' }}>
            <div>
              <div className="eyebrow">MUTUAL ATTRACTION</div>
              <h2 style={{ fontSize: '1.18rem' }}>眼缘与理想型对不对得上？</h2>
              <p className="small secondary">对照一个人的「夫妻宫期待」和另一个人的「命宫及三方本色」。</p>
            </div>
            <div className="split-grid-2">
              <div className="card-subtle page-stack" style={{ gap: '0.35rem' }}>
                <strong className="small">
                  {report.aName} 眼中的 {report.bName}
                </strong>
                <p className="small" style={{ lineHeight: 1.7 }}>
                  {report.mutualAttraction.aSeesB}
                </p>
              </div>
              <div className="card-subtle page-stack" style={{ gap: '0.35rem' }}>
                <strong className="small">
                  {report.bName} 眼中的 {report.aName}
                </strong>
                <p className="small" style={{ lineHeight: 1.7 }}>
                  {report.mutualAttraction.bSeesA}
                </p>
              </div>
            </div>
          </section>

          {/* 4. 双向四化交互飞星（合盘最关键部分）*/}
          <section className="card page-stack" style={{ gap: '1rem' }}>
            <div>
              <div className="eyebrow">MUTUAL SIHUA OVERLAY · 双向四化牵动</div>
              <h2 style={{ fontSize: '1.18rem' }}>两个人的“生年四化”落进对方哪里？</h2>
              <p className="small secondary">
                这步看的是实实在在的互相影响：谁天生容易哄着对方（化禄）、谁容易帮对方拿主意管事（化权）、谁最讲理撑场面（化科）、谁又偏偏在哪块让对方压力大爱操心（化忌）。
              </p>
            </div>

            <div className="split-grid-2">
              <div className="page-stack" style={{ gap: '0.65rem' }}>
                <strong className="small">
                  {report.aName} → 给 {report.bName} 带来的牵动
                </strong>
                {report.overlaysAToB.map((item) => (
                  <div key={`ab-${item.siHua}`} className="card-subtle page-stack" style={{ gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong className="small">{item.plainTitle}</strong>
                      <span className={siHuaBadgeStyle(item.siHua)}>化{item.siHua}</span>
                    </div>
                    <p className="small" style={{ lineHeight: 1.65 }}>
                      {item.plainMeaning}
                    </p>
                    <p className="small secondary" style={{ lineHeight: 1.6 }}>
                      <strong>建议：</strong>
                      {item.practicalTip}
                    </p>
                  </div>
                ))}
              </div>

              <div className="page-stack" style={{ gap: '0.65rem' }}>
                <strong className="small">
                  {report.bName} → 给 {report.aName} 带来的牵动
                </strong>
                {report.overlaysBToA.map((item) => (
                  <div key={`ba-${item.siHua}`} className="card-subtle page-stack" style={{ gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong className="small">{item.plainTitle}</strong>
                      <span className={siHuaBadgeStyle(item.siHua)}>化{item.siHua}</span>
                    </div>
                    <p className="small" style={{ lineHeight: 1.65 }}>
                      {item.plainMeaning}
                    </p>
                    <p className="small secondary" style={{ lineHeight: 1.6 }}>
                      <strong>建议：</strong>
                      {item.practicalTip}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 5. 当前大限步调同步度 + 双方夫妻福德拆解 */}
          <div className="split-grid-2">
            <section className="card page-stack" style={{ gap: '0.75rem', alignContent: 'start' }}>
              <div className="eyebrow" style={{ marginBottom: 0 }}>
                CURRENT DECADE SYNC · 当下十年节奏
              </div>
              <h2 style={{ fontSize: '1.14rem' }}>最近几年两个人的步调合不合拍？</h2>
              <p className="small" style={{ lineHeight: 1.65 }}>
                • {report.decadeSync.aSummary}
              </p>
              <p className="small" style={{ lineHeight: 1.65 }}>
                • {report.decadeSync.bSummary}
              </p>
              <div className="reading-block">
                <div className="reading-block-title">步调解读</div>
                <p className="small" style={{ lineHeight: 1.7 }}>
                  {report.decadeSync.combinedPlain}
                </p>
              </div>
            </section>

            <section className="card page-stack" style={{ gap: '0.75rem', alignContent: 'start' }}>
              <div className="eyebrow" style={{ marginBottom: 0 }}>
                PRACTICAL PLAYBOOK · 实用相处指南
              </div>
              <h2 style={{ fontSize: '1.14rem' }}>留给你们的四条大白话经验</h2>
              {report.practicalAdvice.map((tip, i) => (
                <div key={i} className="card-subtle" style={{ padding: '0.65rem 0.8rem' }}>
                  <p className="small" style={{ lineHeight: 1.65 }}>
                    <strong>0{i + 1} · </strong>
                    {tip}
                  </p>
                </div>
              ))}
            </section>
          </div>

          {/* 6. 双方各自感情与内心安全感档案 */}
          <div className="split-grid-2">
            {[report.profiles.a, report.profiles.b].map((prof) => (
              <section key={prof.label} className="card page-stack" style={{ gap: '0.75rem', alignContent: 'start' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.1rem' }}>
                    {prof.label} · 感情与内心画像
                  </h3>
                  <span className="meta-pill accent">{prof.mingBadge}</span>
                </div>
                <p className="small" style={{ lineHeight: 1.7 }}>
                  {prof.mingDesc}
                </p>
                <div className="reading-block">
                  <div className="reading-block-title">{prof.fuqiTitle}</div>
                  <p className="small" style={{ lineHeight: 1.68 }}>
                    {prof.fuqiPlain}
                  </p>
                </div>
                <p className="small secondary" style={{ lineHeight: 1.68 }}>
                  <strong>内心与安全感（福德宫）：</strong>
                  {prof.fudePlain}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {prof.auraTags.map((tag) => (
                    <span key={tag} className="meta-pill" style={{ whiteSpace: 'normal', lineHeight: 1.45 }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* 7. 十二宫逐宫对照表 */}
          <div className="table-wrapper" tabIndex={0} role="region" aria-labelledby={tableTitleId}>
            <table className="data-table stack-mobile">
              <caption id={tableTitleId} className="muted small" style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>
                十二宫逐宫主星对照与白话默契点（含空宫对宫借星）
              </caption>
              <thead>
                <tr>
                  <th scope="col">宫位</th>
                  <th scope="col">{report.aName}</th>
                  <th scope="col">{report.bName}</th>
                  <th scope="col">这一块的合拍点与分工提示</th>
                </tr>
              </thead>
              <tbody>
                {report.palaceRows.map((row) => (
                  <tr key={row.name}>
                    <th scope="row">{row.name}</th>
                    <td data-label={report.aName}>
                      <div className="small">
                        <strong>{row.aBranch}宫</strong> · {row.aMajors}
                      </div>
                    </td>
                    <td data-label={report.bName}>
                      <div className="small">
                        <strong>{row.bBranch}宫</strong> · {row.bMajors}
                      </div>
                    </td>
                    <td data-label="默契与分工" className="small secondary" style={{ lineHeight: 1.55 }}>
                      {row.plainNote}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 8. 古文婚恋断语 + 白话去恐吓翻译 */}
          <details className="disclosure">
            <summary>查看传统古籍夫妻宫断语与大白话逐条翻译</summary>
            <div className="disclosure-body page-stack" style={{ gap: '0.85rem' }}>
              {[report.profiles.a, report.profiles.b].map((prof) => (
                <div key={`cls-${prof.label}`} className="page-stack" style={{ gap: '0.5rem' }}>
                  <strong className="small">{prof.label} 夫妻宫涉及的传统古诀（已附白话直解）：</strong>
                  {prof.classics.length > 0 ? (
                    prof.classics.map((c, idx) => (
                      <div key={idx} className="card-subtle page-stack" style={{ gap: '0.35rem' }}>
                        <span className="small muted">{c.label}</span>
                        <p className="small secondary">古籍/旧注原话：{c.classical}</p>
                        <p className="small" style={{ lineHeight: 1.65 }}>
                          <strong>{c.plain}</strong>
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="small secondary">该夫妻宫为空宫或无固定古诀条文，重点看上述双向互动分析与三方配合。</p>
                  )}
                </div>
              ))}

              <div className="card-subtle page-stack" style={{ gap: '0.45rem' }}>
                <strong className="small">合盘研究方法与传统星级维度说明</strong>
                <p className="small secondary" style={{ lineHeight: 1.65 }}>
                  传统合盘绝不是只拿两个生肖配对或单盯夫妻宫一句吓人断语，而是把双方的「命宫本性 + 夫妻宫期待 + 福德宫安全感 + 双方生年四化互飞」打包综合来看日常相处体验。
                </p>
                {Object.entries(HEMING_SCORE_CRITERIA).map(([tier, desc]) => (
                  <p key={tier} className="small muted" style={{ lineHeight: 1.55 }}>
                    <strong>{tier}：</strong>
                    {desc}
                  </p>
                ))}
              </div>
            </div>
          </details>
        </>
      ) : null}
    </div>
  );
}
