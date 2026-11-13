import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, BookOpen, Copy, Printer, Sparkles } from 'lucide-react';
import { READING_TOPICS, getReading, readingOverview, readingText } from '../reading';
import { explainPatternPlain } from '../classic-plain';
import { BRANCH_NAMES, major, type ChartResult } from '../core';

export default function ReadingPanel({
  result,
  topicId,
  onSelectTopic,
  onOpenDataset,
}: {
  result: ChartResult;
  topicId: string;
  onSelectTopic: (id: string) => void;
  onOpenDataset: () => void;
}) {
  const [copyState, setCopyState] = useState('');
  const topicsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = topicsRef.current;
    const active = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (active && typeof active.scrollIntoView === 'function') {
      const reduced =
        typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      active.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: reduced ? 'auto' : 'smooth',
      });
    }
  }, [topicId]);

  const topic = READING_TOPICS.find((t) => t.id === topicId) ?? READING_TOPICS[0];
  const localDate = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  };
  const overview = useMemo(() => readingOverview(result, localDate()), [result]);
  const reading = useMemo(() => getReading(result, topic), [result, topic]);
  const allReadings = useMemo(
    () =>
      READING_TOPICS.filter((t) => t.id !== 'overview')
        .map((t) => getReading(result, t))
        .filter((r): r is NonNullable<typeof r> => Boolean(r)),
    [result],
  );

  const chooseTopic = (id: string, scroll = false) => {
    onSelectTopic(id);
    if (scroll) {
      requestAnimationFrame(() =>
        document.getElementById('reading-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
    }
  };

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    let nextIdx: number | null = null;
    if (e.key === 'ArrowRight') nextIdx = (idx + 1) % READING_TOPICS.length;
    else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + READING_TOPICS.length) % READING_TOPICS.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = READING_TOPICS.length - 1;
    if (nextIdx === null) return;
    e.preventDefault();
    const nextTopic = READING_TOPICS[nextIdx];
    onSelectTopic(nextTopic.id);
    requestAnimationFrame(() => {
      topicsRef.current?.querySelector<HTMLButtonElement>(`#tab-${nextTopic.id}`)?.focus();
    });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(readingText(result));
      setCopyState('已复制全部主题');
    } catch {
      setCopyState('复制失败，请检查浏览器权限');
    }
  };

  return (
    <section className="card page-stack" id="reading" aria-labelledby="reading-title">
      <div className="section-head">
        <div>
          <div className="eyebrow">
            <Sparkles size={13} aria-hidden="true" /> YOUR CHART · EXPLAINED
          </div>
          <h2 id="reading-title" style={{ fontSize: '1.45rem' }}>
            先看懂这张命盘
          </h2>
          <p className="secondary small" style={{ marginTop: 4 }}>
            按主题阅读，先用白话整理结构，再列出盘面依据。
          </p>
        </div>
      </div>

      <div className="info-banner" style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
        <BookOpen size={17} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
        <span className="small">
          本地本命解读 · 依据本盘星曜与传统关键词整理；不随运限切换，也不等同于官网的完整断语。不是 AI 生成。
        </span>
      </div>

      {result.uncertain ? (
        <div className="field-error" role="status">
          出生时间尚未核实，以下是候选时刻对应的参考解读。更换时辰可能改变内容。
        </div>
      ) : null}

      <div>
        <div className="small muted" style={{ marginBottom: 2 }}>
          左右滑动或方向键切换全部 13 个解读主题 →
        </div>
        <div className="reading-tabs-shell">
          <div ref={topicsRef} className="reading-topic-list" role="tablist" aria-label="选择解读主题">
            {READING_TOPICS.map((t, idx) => {
              const selected = topicId === t.id;
              return (
                <button
                  key={t.id}
                  id={`tab-${t.id}`}
                  role="tab"
                  type="button"
                  className="reading-tab"
                  aria-selected={selected}
                  aria-controls={`panel-${topic.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => onSelectTopic(t.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        id={`panel-${topic.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${topic.id}`}
        tabIndex={0}
      >
        <div id="reading-content" aria-live="polite" className="reading-panel-body">
          {topicId === 'overview' ? (
            <div className="page-stack" style={{ gap: '1rem' }}>
              <div className="reading-block">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span className="eyebrow">01 / 一眼看懂你自己</span>
                  <span className="meta-pill accent">{overview.heroBadge}</span>
                </div>
                <h3 style={{ fontSize: '1.22rem', marginTop: 2, marginBottom: 6 }}>先不说黑话，直接聊你的性格底色</h3>
                <p className="small" style={{ lineHeight: 1.8 }}>
                  {overview.overviewPlain}
                </p>
                <p
                  className="small"
                  style={{
                    lineHeight: 1.75,
                    fontWeight: 600,
                    color: 'var(--accent-strong)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-subtle)',
                    borderInlineStart: '3px solid var(--accent-strong)',
                  }}
                >
                  给你的方向建议：{overview.overviewAdvice}
                </p>
              </div>

              <div className="split-grid-2" style={{ gap: '0.65rem' }}>
                {overview.threeCards.map((card) => (
                  <div
                    key={card.label}
                    className="card-subtle"
                    style={{
                      padding: '0.8rem 0.9rem',
                      display: 'grid',
                      gap: '0.3rem',
                      gridColumn: card.label === '成长课题' ? '1 / -1' : undefined,
                    }}
                  >
                    <div className="small" style={{ fontWeight: 700, color: 'var(--accent-strong)' }}>
                      {card.label}
                    </div>
                    <p className="small secondary" style={{ lineHeight: 1.68 }}>
                      {card.text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="card-subtle">
                <span className="eyebrow">02 / 四个最关心的日常领域</span>
                <h3 style={{ fontSize: '1.08rem', marginBottom: 4 }}>想具体看哪一块，直接点进去</h3>
                <p className="secondary small">
                  上面标签还能切到「健康、朋友、居住、父母、情绪」等全部 13 个生活场景。
                </p>
              </div>

              <div className="split-grid-2" style={{ gap: '0.75rem' }}>
                {overview.sections.map((section) => (
                  <button
                    type="button"
                    key={section.topic.id}
                    className="feature-card"
                    style={{ textAlign: 'left', cursor: 'pointer', padding: '0.95rem 1rem' }}
                    onClick={() => chooseTopic(section.topic.id, true)}
                  >
                    <div>
                      <span className="meta-pill accent" style={{ marginBottom: 6 }}>
                        {section.topic.label}
                      </span>
                      <div style={{ fontWeight: 700, marginBottom: 4, lineHeight: 1.45 }}>
                        {section.plainTitle}
                      </div>
                      <p className="secondary small" style={{ lineHeight: 1.65 }}>
                        {section.plainQuote}
                      </p>
                    </div>
                    <span className="small" style={{ color: 'var(--accent-strong)', fontWeight: 700 }}>
                      看完整大白话与建议 <ArrowRight size={14} style={{ verticalAlign: '-2px' }} aria-hidden="true" />
                    </span>
                  </button>
                ))}
              </div>

              <details className="disclosure">
                <summary>展开看专业排盘详情与规则格局（{overview.ruleCount ?? 0} 项匹配）</summary>
                <div className="page-stack" style={{ gap: '0.75rem', marginTop: '0.6rem' }}>
                  <p className="small secondary" style={{ lineHeight: 1.7 }}>
                    {overview.overallSummary}
                  </p>
                  <div className="btn-row">
                    <span className="meta-pill">
                      命宫 <strong>{BRANCH_NAMES[result.chart.mingGongBranch]}</strong> · {result.chart.wuxingJuName}
                    </span>
                    {overview.calendar?.decade ? (
                      <span className="meta-pill">
                        虚岁 {overview.calendar.nominalAge} · 大限 {overview.calendar.decade.startAge}–
                        {overview.calendar.decade.endAge} 岁
                      </span>
                    ) : null}
                  </div>
                  {overview.patternHighlights.length > 0 ? (
                    <div className="split-grid-2" style={{ gap: '0.65rem' }}>
                      {overview.patternHighlights.map((pat) => (
                        <div
                          key={pat.name}
                          className="card-subtle"
                          style={{ padding: '0.7rem 0.85rem', display: 'grid', gap: '0.25rem' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                            <strong className="small">{pat.name}</strong>
                            <span className="meta-pill accent">
                              {pat.level === 'excellent'
                                ? '上格'
                                : pat.level === 'good'
                                ? '佳格'
                                : pat.level === 'caution'
                                ? '需留意'
                                : '格局参考'}
                            </span>
                          </div>
                          <p className="small" style={{ lineHeight: 1.65 }}>
                            <strong>大白话：</strong>
                            {explainPatternPlain(pat.name, pat.description)}
                          </p>
                          <p className="small muted" style={{ lineHeight: 1.55 }}>
                            传统描述：{pat.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </details>
            </div>
          ) : reading ? (
            <div className="page-stack" style={{ gap: '0.9rem' }}>
              <div className="card-subtle">
                <span className="eyebrow">
                  {String(READING_TOPICS.findIndex((t) => t.id === topicId) + 1).padStart(2, '0')} / {topic.label}
                </span>
                <h3 style={{ fontSize: '1.24rem', marginTop: 2, marginBottom: 6 }}>{reading.plainTitle}</h3>
                <p className="secondary small">{topic.scope}</p>
              </div>

              <div className="reading-block">
                <div className="reading-block-title">{topic.label} · 大白话直接看</div>
                <p className="small" style={{ lineHeight: 1.8 }}>
                  {reading.plainSummary}
                </p>
                {reading.concreteScenes.length > 0 ? (
                  <div className="page-stack" style={{ gap: '0.45rem', marginTop: 4 }}>
                    <div className="small" style={{ fontWeight: 700 }}>
                      落地到日常生活的具体画面：
                    </div>
                    {reading.concreteScenes.map((scene, idx) => (
                      <div key={idx} className="card-subtle" style={{ padding: '0.55rem 0.75rem' }}>
                        <p className="small" style={{ lineHeight: 1.7 }}>
                          {scene}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
                <p className="small secondary" style={{ lineHeight: 1.7 }}>
                  <strong>三方联动直解：</strong>
                  {reading.sanfangPlainNote}
                </p>
                <div
                  className="small"
                  style={{
                    lineHeight: 1.75,
                    fontWeight: 600,
                    padding: '0.7rem 0.9rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-subtle)',
                    borderInlineStart: '3px solid var(--accent-strong)',
                  }}
                >
                  <strong>给你的实操建议：</strong>
                  {reading.plainAdvice}
                </div>
              </div>

              <div className="reading-block">
                <div className="reading-block-title">一句话定调</div>
                <blockquote
                  className="small"
                  style={{
                    margin: 0,
                    padding: '0.45rem 0.9rem',
                    borderInlineStart: '3px solid var(--accent)',
                    fontWeight: 700,
                    fontSize: '0.98rem',
                    lineHeight: 1.65,
                  }}
                >
                  {reading.plainQuote}
                </blockquote>
                <p className="small" style={{ color: 'var(--accent-strong)', fontWeight: 600, marginTop: 4 }}>
                  不妨想想：{topic.question}
                </p>
              </div>

              <div className="reading-block">
                <div className="reading-block-title">为什么会这样看（星曜与理据）</div>
                {reading.comboNote ? (
                  <p className="card-subtle small" style={{ padding: '0.65rem 0.8rem', lineHeight: 1.7 }}>
                    <strong>结构组合：</strong>
                    {reading.comboNote}
                  </p>
                ) : null}
                {reading.interpretation.map((line, i) => (
                  <p key={i} className="small secondary" style={{ lineHeight: 1.75 }}>
                    {line}
                  </p>
                ))}
                {reading.transformations.map((line, i) => (
                  <p key={`t-${i}`} className="small secondary" style={{ lineHeight: 1.75 }}>
                    <strong>关键牵动 · </strong>
                    {line}
                  </p>
                ))}
                {reading.glossary.length > 0 ? (
                  <div className="card-subtle page-stack" style={{ gap: '0.35rem', padding: '0.7rem 0.85rem' }}>
                    <div className="small" style={{ fontWeight: 700, color: 'var(--accent-strong)' }}>
                      听不懂的词？这里翻译给你看
                    </div>
                    {reading.glossary.map((item, i) => (
                      <p key={i} className="small muted" style={{ lineHeight: 1.6 }}>
                        {item}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>

              {reading.auxPlainHighlights.length > 0 ? (
                <div className="reading-block">
                  <div className="reading-block-title">小帮手与提醒星曜直解</div>
                  <div className="page-stack" style={{ gap: '0.35rem' }}>
                    {reading.auxPlainHighlights.map((item, i) => (
                      <p key={i} className="small secondary" style={{ lineHeight: 1.65 }}>
                        • {item}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}

              <details className="disclosure">
                <summary>展开盘面依据、同宫辅煞、十二神与三方四正联动</summary>
                <div className="page-stack" style={{ gap: '0.7rem', marginTop: '0.6rem' }}>
                  <p className="small" style={{ fontWeight: 600 }}>
                    {reading.facts}
                  </p>
                  <p className="small muted">对应配置：{reading.headline}</p>
                  {reading.borrowed ? (
                    <p className="info-banner small">
                      本宫无主星不代表这里“空缺”，实际参考了对宫主星特质（不等于这些星真落在本宫）。
                    </p>
                  ) : null}
                  {reading.auxNote.split('\n').map((line, i) => (
                    <p key={i} className="small secondary" style={{ lineHeight: 1.68 }}>
                      {line}
                    </p>
                  ))}
                  <div>
                    <div className="small" style={{ fontWeight: 700, marginBottom: 4 }}>
                      关联影响的其他三个位置（三方四正）
                    </div>
                    <div className="reading-tri-grid">
                      {reading.related.map(({ label, palace }) => (
                        <button
                          key={palace.branch}
                          type="button"
                          className="btn btn-secondary"
                          style={{
                            height: 'auto',
                            padding: '0.55rem 0.7rem',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            whiteSpace: 'normal',
                            textAlign: 'left',
                          }}
                          onClick={() => {
                            const target = READING_TOPICS.find(
                              (t) =>
                                t.id !== 'overview' && t.palace.replace('宫', '') === palace.name.replace('宫', ''),
                            );
                            if (target) chooseTopic(target.id, true);
                          }}
                        >
                          <span className="small muted">
                            {label} · {BRANCH_NAMES[palace.branch]}位
                          </span>
                          <strong>{palace.name}</strong>
                          <span className="small secondary">{major(palace)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="small muted">
                    其他星曜：
                    {reading.palace.stars
                      .filter((s) => s.type !== 'major')
                      .map((s) => s.name + (s.siHua ? `化${s.siHua}` : ''))
                      .join('、') || '无'}
                    。
                  </p>
                </div>
              </details>
            </div>
          ) : (
            <div className="field-error">暂时无法读取这个宫位，请重新生成命盘。</div>
          )}
        </div>
      </div>

      <div className="card-subtle page-stack" style={{ gap: '0.75rem' }}>
        <p className="small muted">
          传统文化阅读与自我反思，不验证个人经历或未来；健康、财务和关系问题请结合现实信息判断。打印版包含十二个主题的文字解读。
        </p>
        <div className="btn-row">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenDataset}>
            查阅开源解读 <ArrowRight size={14} aria-hidden="true" />
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={copy}>
            <Copy size={14} aria-hidden="true" /> {copyState || '复制全部主题'}
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            <Printer size={14} aria-hidden="true" /> 打印 / 存为 PDF
          </button>
          <a className="btn btn-ghost btn-sm" href="#chart-visual">
            查看命盘图 <ArrowDown size={14} aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* Print-only Full Text Report */}
      <div className="print-report">
        <h1>紫微研习室 · 命盘解读</h1>
        <p>
          {result.form.name || '未命名命盘'} · 排盘日期 {result.effectiveDate} · {BRANCH_NAMES[result.branch]}时 ·{' '}
          {result.chart.wuxingJuName}
        </p>
        {result.uncertain ? <p>出生时间尚未核实，以下内容基于候选时刻。</p> : null}
        <p>{overview.overallSummary}</p>
        {allReadings.map((r) => (
          <section key={r.topic.id}>
            <h2>{r.topic.label} · {r.plainTitle}</h2>
            <p>{r.plainSummary}</p>
            {r.concreteScenes.map((scene, idx) => (
              <p key={`sc-${idx}`}>{scene}</p>
            ))}
            <p>
              <strong>关联联动：</strong>
              {r.sanfangPlainNote}
            </p>
            <p>
              <strong>实操建议：</strong>
              {r.plainAdvice}
            </p>
            <p>
              <strong>{r.headline}</strong>
            </p>
            <p>
              <strong>盘面依据：</strong>
              {r.facts}
            </p>
            {r.comboNote ? <p>{r.comboNote}</p> : null}
            {r.interpretation.map((text, i) => (
              <p key={i}>{text}</p>
            ))}
            {r.transformations.map((text, i) => (
              <p key={i}>{text}</p>
            ))}
            <p>{r.auxNote}</p>
            <p>
              <strong>建议：</strong>
              {r.actionAdvice}
            </p>
            <p>
              <strong>可以想一想：</strong>
              {r.topic.question}
            </p>
          </section>
        ))}
        <p>解读不验证个人经历或未来；请结合现实信息判断。</p>
      </div>
    </section>
  );
}
