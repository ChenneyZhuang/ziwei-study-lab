import { useEffect, useId, useMemo, useState } from 'react';
import { ArrowUpRight, BookOpen, Copy, MessageCircle, Send, Sparkles } from 'lucide-react';
import {
  BRANCH_NAMES,
  chartSummary,
  decadePatterns,
  horoscopeTexts,
  major,
  type ChartResult,
} from '../core';
import { EmptyState, SectionHead } from '../components';
import { getReading, READING_TOPICS, readingOverview } from '../reading';
import { explainClassicExcerpt, explainPatternPlain } from '../classic-plain';

type Passage = { volume: string; section: string; anchor: string; text: string };
type TianjiNote = { book: string; h2: string; h3: string; quote: string };

const CLASSIC_URL =
  'https://zh.wikisource.org/zh-hans/%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B8%E5%85%A8%E6%9B%B8/%E5%85%A8%E8%A6%BD';

type SpecialCard = {
  title: string;
  body: string[];
  advice?: string;
};

type Entry = {
  question: string;
  special?: SpecialCard;
  responses: ReturnType<typeof horoscopeTexts>;
};

export default function Assistant({ result, goChart }: { result: ChartResult | null; goChart: () => void }) {
  const uid = useId();
  const [question, setQuestion] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [copied, setCopied] = useState(false);
  const [passages, setPassages] = useState<Passage[]>([]);
  const [tianji, setTianji] = useState<TianjiNote[]>([]);

  useEffect(() => {
    fetch('/data/quanshu-wikisource.json')
      .then((r) => (r.ok ? r.json() : []))
      .then(setPassages)
      .catch(() => setPassages([]));

    fetch('/data/tianji.json')
      .then((r) => (r.ok ? r.json() : []))
      .then(setTianji)
      .catch(() => setTianji([]));
  }, []);

  const localNow = useMemo(() => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }, []);

  const overview = useMemo(() => (result ? readingOverview(result, localNow) : null), [result, localNow]);

  if (!result) {
    return (
      <div className="page-stack">
        <SectionHead
          eyebrow="CHART COMPANION"
          title="问盘助手"
          description="围绕具体问题，从命盘结构和传统资料开始探索。"
        />
        <EmptyState
          title="先有一张命盘"
          description="起盘或选取工作台预设样本后，你可以直接查看整盘大白话速览，也能针对事业、关系、财运、四化和大限提问。"
          onAction={goChart}
        />
      </div>
    );
  }

  const buildSpecialAnswer = (q: string): SpecialCard | undefined => {
    if (/(四化|化禄|化权|化科|化忌)/.test(q)) {
      const siHuaLines = result.chart.palaces.flatMap((p) => {
        const t = READING_TOPICS.find(
          (item) => item.id !== 'overview' && item.palace.replace('宫', '') === p.name.replace('宫', ''),
        );
        const itemReading = t ? getReading(result, t) : null;
        return (itemReading?.transformations ?? []).map((line) => `【${t?.label || p.name}】${line}`);
      });
      if (siHuaLines.length > 0) {
        return {
          title: '你盘里最顺心与最容易较劲的四件事（四化）',
          body: siHuaLines,
          advice: '简单记法：看到「化禄」就是顺手和心情好；看到「化忌」就是你越在意越容易自己跟自己卡住、最需要慢半拍写清楚的事。',
        };
      }
    }

    if (/(大限|运限|今年|流年|这十年|最近|运势)/.test(q) && overview?.calendar) {
      const cal = overview.calendar;
      const dec = cal.decade;
      const decPalace = dec ? result.chart.palaces.find((p) => p.branch === dec.palaceBranch) : undefined;
      const decTopic =
        decPalace &&
        READING_TOPICS.find(
          (item) => item.id !== 'overview' && item.palace.replace('宫', '') === decPalace.name.replace('宫', ''),
        );
      const decReading = decTopic ? getReading(result, decTopic) : null;

      const yearBranch = ((cal.lunarYear - 4) % 12 + 12) % 12;
      const yearPalace = result.chart.palaces.find((p) => p.branch === yearBranch);
      const yearTopic =
        yearPalace &&
        READING_TOPICS.find(
          (item) => item.id !== 'overview' && item.palace.replace('宫', '') === yearPalace.name.replace('宫', ''),
        );
      const yearReading = yearTopic ? getReading(result, yearTopic) : null;

      const za = (() => {
        try {
          return decadePatterns(result, cal.nominalAge);
        } catch {
          return [];
        }
      })();
      return {
        title: dec
          ? `你眼下这十年（${dec.startAge}–${dec.endAge} 岁，当前虚岁 ${cal.nominalAge} 岁）的重点`
          : `当前运限参考（虚岁 ${cal.nominalAge} 岁）`,
        body: [
          decReading
            ? `这十年的主要风向围绕「${decTopic?.label || decPalace?.name}」展开：${decReading.plainTitle}`
            : `目前尚未进入第一大限（${result.chart.daXians[0]?.startAge ?? 2}岁起限），重点先以本命底色与父母家庭滋养为主。`,
          decReading ? decReading.plainSummary : '',
          yearReading
            ? `今年（${cal.lunarYear} 农历年）流年太岁落在「${yearTopic?.label || yearPalace?.name}」位置：${yearReading.plainTitle}`
            : '',
          ...(za.length
            ? [
                `近期节奏额外提醒：${za
                  .map((h) => `${h.name}（原文：${h.note}）→ 白话意思：${explainPatternPlain(h.name, h.detail || '', h.note)}`)
                  .join('；')}`,
              ]
            : []),
        ].filter(Boolean),
        advice: decReading?.plainAdvice || yearReading?.plainAdvice,
      };
    }

    if (/(空宫|无主星)/.test(q)) {
      const empties = result.chart.palaces.filter((p) => p.isEmpty);
      if (!empties.length) {
        return {
          title: '你的命盘十二宫都有自己坐守的主星',
          body: ['你这张盘十二宫里没有空宫，每一块领域都有各自固定鲜明的性格底色，可直接按主题往下查看。'],
        };
      }
      return {
        title: '盘里没有主星的宫位怎么看？（空宫不是空白）',
        body: [
          '在紫微斗数里，某宫没坐主星，不代表这里缺失或不好，而是像一张没有写死剧本的白纸——可塑性高，平时很受对面宫位（对宫）和身边环境氛围的影响。',
          ...empties.map((p) => {
            const opp = result.chart.palaces.find((x) => x.branch === p.oppositeBranch);
            return `• 「${p.name}」（${BRANCH_NAMES[p.branch]}位）无主星 → 借对宫「${opp?.name || ''}」的「${
              p.borrowedStars?.join('、') || '暂无主星'
            }」特质一起看。`;
          }),
        ],
        advice: '空宫最讲究“近朱者赤”：挑对靠谱搭档和舒服干净的环境，往往比别人按部就班更有惊喜发挥空间。',
      };
    }

    if (/(总览|性格|优缺点|优势|整体|全面)/.test(q) && overview) {
      return {
        title: `整体画像 · ${overview.heroBadge}`,
        body: [
          overview.overviewPlain,
          ...overview.sections.map((s) => `【${s.topic.label}】${s.plainTitle}——${s.plainQuote}`),
        ],
        advice: overview.overviewAdvice,
      };
    }

    return undefined;
  };

  const ask = (q: string) => {
    const clean = q.trim();
    if (!clean) return;
    const special = buildSpecialAnswer(clean);
    const responses = horoscopeTexts(result, clean);
    setEntries((old) => [...old, { question: clean, special, responses }]);
    setQuestion('');
  };

  const copy = async () => {
    const text = `请以传统文化学习的方式，根据以下结构化命盘回答我的问题。请把盘面事实、传统说法和不确定的推测分开，引用可核查来源，不要虚构我的经历，也不要把命理当成医疗、投资或人生决定的证据。\n\n${chartSummary(
      result,
    )}\n\n我的问题：${question || entries.at(-1)?.question || '请介绍命盘的主要结构。'}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.alert('复制失败，请检查浏览器的剪贴板权限。');
    }
  };

  const findTianji = (starName?: string, palaceName?: string) => {
    if (!tianji.length) return undefined;
    let best: { item: TianjiNote; score: number } | undefined;
    for (const item of tianji) {
      const q = item.quote.trim();
      if (q.length < 28 || q.length > 200) continue;
      const hasStar = Boolean(starName && (q.includes(starName) || item.h2.includes(starName) || item.h3.includes(starName)));
      const hasPalace = Boolean(palaceName && (q.includes(palaceName) || item.h2.includes(palaceName) || item.h3.includes(palaceName)));
      if (!hasStar && !hasPalace) continue;
      let score = 0;
      if (hasStar) score += 6;
      if (hasPalace) score += 4;
      if (starName && (item.h2.includes(starName) || item.h3.includes(starName))) score += 4;
      if (palaceName && (item.h2.includes(palaceName) || item.h3.includes(palaceName))) score += 3;
      if (q.length >= 45 && q.length <= 150) score += 2;
      if (/^(现在|实际上|你看|那这个|那个|所以说|对吧|那么|其实在)/.test(q)) score -= 5;
      if (!/[，。！？；：]/.test(q)) score -= 2;
      if (!best || score > best.score) best = { item, score };
    }
    return best && best.score >= 3 ? best.item : undefined;
  };

  return (
    <div className="page-stack">
      <SectionHead
        eyebrow="CHART COMPANION"
        title="问盘助手"
        description="打开即看本盘大白话速览，也可输入问题定位对应宫位、四化、大限、维基文库与《天纪》原话。"
        action={<span className="meta-pill good">当前命盘 · {result.form.name || '未命名'}</span>}
      />

      <div className="chart-workspace" style={{ alignItems: 'start' }}>
        <section className="card page-stack" style={{ gridColumn: '1 / 2' }}>
          {overview ? (
            <div className="reading-block">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <div className="reading-block-title">本盘白话速览 · 开局直接看结论</div>
                <span className="meta-pill accent">{overview.heroBadge}</span>
              </div>
              <p className="small" style={{ lineHeight: 1.8 }}>
                {overview.overviewPlain}
              </p>
              <div className="split-grid-2" style={{ gap: '0.55rem', marginTop: 4 }}>
                {overview.sections.map((s) => (
                  <div key={s.topic.id} className="card-subtle" style={{ padding: '0.65rem 0.78rem' }}>
                    <div className="small muted">{s.topic.label}</div>
                    <div className="small" style={{ fontWeight: 700, marginTop: 2 }}>
                      {s.plainTitle}
                    </div>
                    <p className="small secondary" style={{ marginTop: 3, lineHeight: 1.55 }}>
                      {s.plainQuote}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
            <div className="brand-mark" aria-hidden="true">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="eyebrow">LOCAL KEYWORD RETRIEVAL</div>
              <h2 style={{ fontSize: '1.25rem' }}>想具体了解哪一块？</h2>
              <p className="secondary small" style={{ marginTop: 4 }}>
                点选快捷提问，或输入事业、财运、感情、大限、化忌、星曜名称（如「紫微」「贪狼」）。
              </p>
            </div>
          </div>

          <div className="btn-row">
            {[
              '我的事业宫适合什么方向？',
              '感情与伴侣怎么相处最合适？',
              '我这辈子怎么赚钱最顺手？',
              '四化和化忌各自落哪，要注意啥？',
              '当前大限这十年重心在哪？',
              '命宫有哪些主星？',
            ].map((q) => (
              <button key={q} type="button" className="btn btn-secondary btn-sm" onClick={() => ask(q)}>
                {q} <ArrowUpRight size={14} aria-hidden="true" />
              </button>
            ))}
          </div>

          <form
            className="btn-row"
            style={{ alignItems: 'stretch' }}
            onSubmit={(e) => {
              e.preventDefault();
              ask(question);
            }}
          >
            <label htmlFor={`${uid}-ask`} className="visually-hidden">
              输入问题
            </label>
            <input
              id={`${uid}-ask`}
              className="input"
              style={{ flex: '1 1 240px' }}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.nativeEvent.isComposing) {
                  e.preventDefault();
                }
              }}
              placeholder="输入想问的主题，比如：事业、财运、感情、大限、化忌、天同…"
            />
            <button type="submit" className="btn btn-primary" aria-label="发送问题">
              <Send size={16} aria-hidden="true" />
              检索盘面
            </button>
          </form>
          <p className="field-hint">本地关键词与知识库匹配 · 不会把命盘发送到任何外部服务 · 按 Enter 提交。</p>

          <div className="page-stack" aria-live="polite" style={{ gap: '1rem' }}>
            {entries.map((entry, i) => (
              <div key={i} className="card-subtle page-stack" style={{ gap: '0.75rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--accent-strong)' }}>问题：{entry.question}</div>

                {entry.special ? (
                  <div className="reading-block">
                    <div className="reading-block-title">{entry.special.title}</div>
                    {entry.special.body.map((line, k) => (
                      <p key={k} className="small secondary" style={{ lineHeight: 1.7 }}>
                        {line}
                      </p>
                    ))}
                    {entry.special.advice ? (
                      <p className="small" style={{ fontWeight: 600 }}>
                        建议：{entry.special.advice}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {entry.responses
                  .filter((r) => !(entry.special && r.topic === '未识别'))
                  .map((response, j) => {
                    const p = response.palace;
                    const topic =
                      p &&
                      READING_TOPICS.find(
                        (t) => t.id !== 'overview' && t.palace.replace('宫', '') === p.name.replace('宫', ''),
                      );
                    const reading = topic ? getReading(result, topic) : null;
                    const first = p?.stars.find((s) => s.type === 'major')?.name || p?.borrowedStars?.[0];
                    const hit = first ? passages.find((item) => item.text.includes(first)) : undefined;
                    const tjHit = findTianji(first, p?.name.replace('宫', ''));

                    return (
                      <div key={j} className="reading-block">
                        <div className="reading-block-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MessageCircle size={15} aria-hidden="true" /> 大白话直接看 · {response.topic}
                        </div>

                        {reading ? (
                          <div className="page-stack" style={{ gap: '0.55rem' }}>
                            <strong className="small" style={{ fontSize: '0.98rem' }}>
                              {reading.plainTitle}
                            </strong>
                            <p className="small" style={{ lineHeight: 1.78 }}>
                              {reading.plainSummary}
                            </p>
                            {reading.concreteScenes.slice(0, 2).map((scene, scIdx) => (
                              <div key={scIdx} className="card-subtle" style={{ padding: '0.5rem 0.7rem' }}>
                                <p className="small" style={{ lineHeight: 1.65 }}>
                                  {scene}
                                </p>
                              </div>
                            ))}
                            <p className="small secondary" style={{ lineHeight: 1.65 }}>
                              <strong>关联牵动：</strong>
                              {reading.sanfangPlainNote}
                            </p>
                            <p
                              className="small"
                              style={{
                                lineHeight: 1.7,
                                fontWeight: 600,
                                padding: '0.55rem 0.75rem',
                                background: 'var(--bg-subtle)',
                                borderRadius: 'var(--radius-sm)',
                                borderInlineStart: '3px solid var(--accent-strong)',
                              }}
                            >
                              建议你：{reading.plainAdvice}
                            </p>
                            <details className="disclosure">
                              <summary>展开盘面星曜依据与《全书》《天纪》原文对照</summary>
                              <div className="page-stack" style={{ gap: '0.45rem', marginTop: 6 }}>
                                {p ? (
                                  <p className="small" style={{ fontWeight: 600 }}>
                                    对应宫位：{p.name.endsWith('宫') ? p.name : `${p.name}宫`}（
                                    {BRANCH_NAMES[p.branch]}位），
                                    {major(p) === '无主星' ? '本宫无主星（借看对宫）' : `主星：${major(p)}`}；其他星曜：{response.nearby}。
                                  </p>
                                ) : null}
                                {reading.comboNote ? (
                                  <p className="small secondary" style={{ lineHeight: 1.65 }}>
                                    <strong>结构合参：</strong>
                                    {reading.comboNote}
                                  </p>
                                ) : null}
                                {reading.interpretation.map((line, k) => (
                                  <p key={k} className="small secondary" style={{ lineHeight: 1.68 }}>
                                    {line}
                                  </p>
                                ))}
                                {reading.transformations.map((line, k) => (
                                  <p key={`s-${k}`} className="small secondary" style={{ lineHeight: 1.68 }}>
                                    {line}
                                  </p>
                                ))}
                                {tjHit ? (
                                  <div className="page-stack" style={{ gap: '0.35rem' }}>
                                    <p className="small secondary" style={{ lineHeight: 1.65 }}>
                                      <strong>《天纪》口述参考（{tjHit.h2}{tjHit.h3 ? ` · ${tjHit.h3}` : ''}）：</strong>
                                      “{tjHit.quote}”
                                    </p>
                                    <p className="small" style={{ lineHeight: 1.65 }}>
                                      <strong>白话释义：</strong>
                                      {explainClassicExcerpt(tjHit.quote, `${tjHit.h2} ${tjHit.h3 || ''}`, 'tianji').plain}
                                    </p>
                                  </div>
                                ) : null}
                                {hit ? (
                                  <div className="page-stack" style={{ gap: '0.35rem' }}>
                                    <p className="small">
                                      古籍索引：
                                      <a
                                        href={`${CLASSIC_URL}#${encodeURIComponent(hit.anchor)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        《{hit.volume} · {hit.section}》中包含“{first}” ↗
                                      </a>
                                    </p>
                                    <p className="small secondary" style={{ lineHeight: 1.65 }}>
                                      <strong>原文片段白话理解：</strong>
                                      {explainClassicExcerpt(hit.text, hit.section, 'quanshu').plain}
                                    </p>
                                  </div>
                                ) : null}
                              </div>
                            </details>
                          </div>
                        ) : p ? (
                          <p className="small">
                            对应宫位是<strong>{p.name.endsWith('宫') ? p.name : `${p.name}宫`}</strong>（
                            {BRANCH_NAMES[p.branch]}）。
                            {major(p) === '无主星' ? '本宫没有主星（参考对宫）。' : <>本宫主星是<strong>{major(p)}</strong>。</>}
                            其他星曜：{response.nearby}。
                          </p>
                        ) : (
                          <p className="small muted">
                            未匹配到具体宫位关键词；可以试试输入「事业 / 财运 / 感情 / 化忌 / 大限」或主星名字。
                          </p>
                        )}

                        <p className="field-hint">{response.notice}</p>
                      </div>
                    );
                  })}
                <p className="field-hint">
                  此回答完全由本地紫微知识库 + 盘面规则生成；如需进一步探讨复杂流年组合，可在右侧复制结构化盘面摘要。
                </p>
              </div>
            ))}
          </div>
        </section>

        <aside className="page-stack">
          <div className="card page-stack" style={{ gap: '0.65rem' }}>
            <div className="eyebrow">HOW IT WORKS</div>
            <h2 style={{ fontSize: '1.18rem' }}>回答来自哪里？</h2>
            <p className="small secondary">
              系统直接在本地对照你的命盘宫位、168 组星宫白话库、四化规则、维基文库与《天纪》文本切片。
            </p>
            <div className="card-subtle small">
              <strong>01</strong> 14 主星 × 12 宫 + 24 组双星白话
            </div>
            <div className="card-subtle small">
              <strong>02</strong> 生年四化 + 六吉六煞 + 十二神
            </div>
            <div className="card-subtle small">
              <strong>03</strong> 《全书》与《天纪》语料可核查
            </div>
          </div>

          <div className="card page-stack" style={{ gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Copy size={18} aria-hidden="true" />
              <h2 style={{ fontSize: '1.1rem' }}>导出结构化提示词</h2>
            </div>
            <p className="small secondary">
              复制当前命盘摘要和问题，可粘贴给外部助手深入讨论。复制前请确认你愿意分享这些出生资料。
            </p>
            <button type="button" className="btn btn-secondary" onClick={copy}>
              <Copy size={15} aria-hidden="true" /> {copied ? '已复制' : '复制命盘与问题'}
            </button>
            <a className="small" href="https://chatgpt.com/" target="_blank" rel="noreferrer">
              打开 ChatGPT <ArrowUpRight size={14} style={{ verticalAlign: '-2px' }} aria-hidden="true" />
            </a>
          </div>

          <div className="info-banner small" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <BookOpen size={17} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
            <span>这里用于学习和自我反思，不提供医疗、投资或人生决策判断。</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
