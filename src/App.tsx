import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  ChartNoAxesCombined,
  ChevronRight,
  Clock3,
  Compass,
  Fingerprint,
  GitCompareArrows,
  HeartHandshake,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Moon,
  Plus,
  Sparkles,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { BirthEditor, ChartBoard, PalaceDetail, SectionHead, StatusPill } from './components';
import {
  BRANCH_NAMES,
  DEFAULT_FORM,
  FAMOUS_PERSONS,
  calendarOverlay,
  chartTimeUncertain,
  famousBirthForm,
  flowContext,
  makeChart,
  palaceByName,
  smallLimitContext,
  type BirthForm,
  type ChartResult,
  type FamousPerson,
} from './core';
import { STORAGE, makeBackup, mergeSaved, parseBackup, readSaved, upsertSaved, type Saved } from './storage';
import { SI_HUA_TABLE, STEMS } from './vendor/ziwei/constants';
import Assistant from './pages/Assistant';
import Library from './pages/Library';
import Compare from './pages/Compare';
import Relationship from './pages/Relationship';
import Research from './pages/Research';
import ReadingPanel from './pages/ReadingPanel';
import { READING_TOPICS } from './reading';
import Similar from './pages/Similar';
import Liuren from './pages/Liuren';

type Page = 'home' | 'chart' | 'assistant' | 'library' | 'compare' | 'relationship' | 'similar' | 'liuren' | 'research';

const NAV: { id: Page; label: string; subtitle: string; icon: typeof Compass }[] = [
  { id: 'home', label: '工作台', subtitle: 'OVERVIEW', icon: LayoutDashboard },
  { id: 'chart', label: '我的命盘', subtitle: 'BIRTH CHART', icon: Compass },
  { id: 'assistant', label: '问盘助手', subtitle: 'CHART COMPANION', icon: MessageCircle },
  { id: 'library', label: '资料与典籍', subtitle: 'THE LIBRARY', icon: BookOpen },
  { id: 'compare', label: '口径对照', subtitle: 'COMPARE', icon: GitCompareArrows },
  { id: 'relationship', label: '双人合盘', subtitle: 'TWO CHARTS', icon: HeartHandshake },
  { id: 'similar', label: '相似命盘样本', subtitle: 'SIMILAR CHARTS', icon: Fingerprint },
  { id: 'liuren', label: '小六壬', subtitle: 'SIX POSITIONS', icon: Clock3 },
  { id: 'research', label: '数据实验室', subtitle: 'RESEARCH LAB', icon: ChartNoAxesCombined },
];

function loadSaved() {
  try {
    return { records: readSaved(localStorage), error: '' };
  } catch (e) {
    return {
      records: [] as Saved[],
      error: e instanceof Error ? e.message : '本机记录不可读取。',
    };
  }
}

function revealReading() {
  if (typeof requestAnimationFrame !== 'function') return;
  requestAnimationFrame(() =>
    requestAnimationFrame(() => document.getElementById('reading')?.scrollIntoView({ behavior: 'smooth', block: 'start' })),
  );
}

function CelestialWheel() {
  return (
    <div className="hero-wheel-panel" aria-hidden="true">
      <svg viewBox="0 0 360 360" className="celestial-wheel-svg">
        <defs>
          <radialGradient id="wheelGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
            <stop offset="70%" stopColor="var(--indigo)" stopOpacity="0.06" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle cx="180" cy="180" r="168" fill="url(#wheelGlow)" />
        <circle cx="180" cy="180" r="158" fill="none" stroke="var(--border-ui)" strokeWidth="1.2" />
        <circle cx="180" cy="180" r="134" fill="none" stroke="var(--accent)" strokeWidth="1" strokeDasharray="3 4" />
        <circle cx="180" cy="180" r="102" fill="none" stroke="var(--border-subtle)" strokeWidth="1" />
        <circle cx="180" cy="180" r="54" fill="var(--bg-surface)" stroke="var(--accent)" strokeWidth="1.2" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI) / 6 - Math.PI / 2;
          const x1 = 180 + 102 * Math.cos(a);
          const y1 = 180 + 102 * Math.sin(a);
          const x2 = 180 + 158 * Math.cos(a);
          const y2 = 180 + 158 * Math.sin(a);
          const tx = 180 + 146 * Math.cos(a + Math.PI / 12);
          const ty = 180 + 146 * Math.sin(a + Math.PI / 12);
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--border-subtle)" strokeWidth="1" />
              <text
                x={tx}
                y={ty}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--text-secondary)"
                fontSize="12"
                fontFamily="var(--font-serif)"
                fontWeight="700"
              >
                {BRANCH_NAMES[i]}
              </text>
            </g>
          );
        })}
        <polygon
          points="180,78 268,231 92,231"
          fill="none"
          stroke="var(--indigo)"
          strokeWidth="1.2"
          strokeOpacity="0.65"
        />
        <polygon
          points="180,282 92,129 268,129"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.2"
          strokeOpacity="0.65"
        />
        <text
          x="180"
          y="174"
          textAnchor="middle"
          fill="var(--accent-strong)"
          fontSize="20"
          fontFamily="var(--font-serif)"
          fontWeight="700"
        >
          紫微
        </text>
        <text
          x="180"
          y="198"
          textAnchor="middle"
          fill="var(--text-muted)"
          fontSize="10"
          letterSpacing="2"
        >
          OBSERVATORY
        </text>
      </svg>
    </div>
  );
}

function Home({
  go,
  current,
  onExample,
  onFamous,
  saved,
  openSaved,
}: {
  go: (p: Page) => void;
  current: ChartResult | null;
  onExample: () => void;
  onFamous: (person: FamousPerson) => void;
  saved: Saved[];
  openSaved: (s: Saved) => void;
}) {
  const cards: [Page, string, string, string, typeof Compass][] = [
    ['chart', '01', '起盘与解读', '生成命盘、三方四正图谱与十二主题白话对照', Compass],
    ['assistant', '02', '问盘助手', '围绕具体问题检索宫位与古籍原文片段', MessageCircle],
    ['compare', '03', '口径对照', '同时比较候选时辰、晚子时、闰月与亮度表差异', GitCompareArrows],
    ['relationship', '04', '双人合盘', '并排观察两张命盘，查阅古典夫妻与福德宫辞条', HeartHandshake],
    ['library', '05', '翻阅典籍', '检索维基文库《紫微斗数全书》与《天纪》语料', BookOpen],
    ['similar', '06', '相似命盘样本', '按本地年份逐日检索相同主星与四化结构', Fingerprint],
    ['liuren', '07', '小六壬', '用农历月日时体验传统六宫顺数起课', Clock3],
    ['research', '08', '数据实验室', '统计大样本命宫分布与查阅 v4.0 开源 JSONL', ChartNoAxesCombined],
  ];

  const featuredPeople = FAMOUS_PERSONS.slice(0, 6);

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div>
          <div className="hero-badges">
            <span className="meta-pill accent">纯浏览器本地排盘</span>
            <span className="meta-pill">《全书》四表严格格判</span>
            <span className="meta-pill">支持公历 / 农历 / 真太阳时</span>
          </div>
          <h1 className="hero-title">
            每一张命盘，
            <br />
            都是一场安静的秩序探索。
          </h1>
          <p className="hero-subtitle">
            在星曜亮度、三方四正、古典文献与不同排盘口径之间，建立可核对、可比较、不盲从的个人紫微研习空间。
          </p>
          <div className="btn-row">
            <button type="button" className="btn btn-primary" onClick={() => go('chart')}>
              {current ? '查看我的命盘' : '开始排盘'}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button type="button" className="btn btn-secondary" onClick={onExample}>
              体验示例命盘 <ArrowUpRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>

        <CelestialWheel />
      </section>

      {/* Famous Sample Presets from upstream famous.ts */}
      <section className="card page-stack" style={{ gap: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div className="eyebrow">FAMOUS SAMPLES · 上游案例库</div>
            <h2 style={{ fontSize: '1.2rem' }}>一键载入经典样本对比</h2>
          </div>
          <span className="small muted">以下出生时辰为公开资料估算值，仅供格判对照学习</span>
        </div>
        <div className="split-grid-3">
          {featuredPeople.map((person) => (
            <button
              type="button"
              key={person.id}
              className="feature-card"
              style={{ textAlign: 'left', cursor: 'pointer', padding: '0.95rem 1rem' }}
              onClick={() => onFamous(person)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <strong>{person.name}</strong>
                  <span className="meta-pill">{person.category}</span>
                </div>
                <div className="small muted" style={{ marginTop: 2 }}>
                  {person.description} · {person.year}-{person.month}-{person.day}
                </div>
                <p className="small secondary" style={{ marginTop: 6 }}>
                  {person.notable}
                </p>
              </div>
              <span className="small" style={{ color: 'var(--accent-strong)', fontWeight: 700 }}>
                载入排盘 <ArrowRight size={13} style={{ verticalAlign: '-2px' }} aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {saved.length > 0 ? (
        <section className="card page-stack" style={{ gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.15rem' }}>本机已保存的命盘</h2>
            <span className="meta-pill">{saved.length} 条</span>
          </div>
          <div className="saved-list">
            {saved.map((s) => (
              <button
                type="button"
                key={s.id}
                className="saved-item"
                style={{ cursor: 'pointer', textAlign: 'left' }}
                onClick={() => openSaved(s)}
              >
                <div>
                  <strong>{s.form.name || '未命名命盘'}</strong>
                  <div className="small muted">
                    {s.form.date} {s.uncertain ? '· 候选盘' : ''}
                  </div>
                </div>
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="page-stack" style={{ gap: '0.85rem' }}>
        <SectionHead
          headingLevel={2}
          eyebrow="EXPLORE THE WORKSPACE"
          title="研习工具集"
          description="从排盘、十二宫主题、规则对照到文献溯源，所有运算均在当前浏览器完成。"
        />
        <div className="feature-grid">
          {cards.map(([id, num, title, desc, Icon]) => (
            <button
              type="button"
              key={id}
              className="feature-card"
              style={{ textAlign: 'left', cursor: 'pointer' }}
              onClick={() => go(id)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span className="brand-mark" style={{ width: 32, height: 32 }} aria-hidden="true">
                    <Icon size={16} />
                  </span>
                  <span className="mono small muted">{num}</span>
                </div>
                <h3 style={{ fontSize: '1.08rem', marginBottom: 4 }}>{title}</h3>
                <p className="small secondary">{desc}</p>
              </div>
              <span className="small" style={{ color: 'var(--accent-strong)', fontWeight: 700 }}>
                进入 <ArrowUpRight size={14} style={{ verticalAlign: '-2px' }} aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export function ChartPage({
  form,
  setForm,
  result,
  setResult,
  go,
  save,
  saved,
  openSaved,
  removeSaved,
  exportSaved,
  importSaved,
  storageError,
}: {
  form: BirthForm;
  setForm: (x: BirthForm) => void;
  result: ChartResult | null;
  setResult: (x: ChartResult | null) => void;
  go: (p: Page) => void;
  save: () => void;
  saved: Saved[];
  openSaved: (s: Saved) => void;
  removeSaved: (id: string) => void;
  exportSaved: () => void;
  importSaved: (file: File) => void;
  storageError: string;
}) {
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(!result);
  const [readingTopic, setReadingTopic] = useState('overview');
  const [selected, setSelected] = useState<number | null>(null);
  const [view, setView] = useState<'natal' | 'decade' | 'small' | 'year' | 'month' | 'day' | 'hour' | 'fly'>('natal');
  const [date, setDate] = useState(() => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  });
  const [flowTime, setFlowTime] = useState('12:00');

  useEffect(() => {
    setReadingTopic('overview');
    setSelected(null);
  }, [result?.id]);

  const selectTopic = (id: string) => {
    setReadingTopic(id);
    if (id === 'overview' || !result) return;
    const topic = READING_TOPICS.find((t) => t.id === id);
    const palace = topic && palaceByName(result.chart, topic.palace);
    if (palace) setSelected(palace.branch);
  };

  const selectPalace = (branch: number) => {
    setSelected(branch);
    if (!result) return;
    const palace = result.chart.palaces.find((p) => p.branch === branch);
    const topic = READING_TOPICS.find(
      (t) => t.id !== 'overview' && t.palace.replace('宫', '') === palace?.name.replace('宫', ''),
    );
    if (topic) setReadingTopic(topic.id);
  };

  const calendar = result ? calendarOverlay(result, date) : null;
  const small =
    result && view === 'small'
      ? (() => {
          try {
            return smallLimitContext(result, date);
          } catch {
            return null;
          }
        })()
      : null;
  const decade = calendar?.decade;
  const targetPalace = decade && result?.chart.palaces.find((p) => p.branch === decade.palaceBranch);
  const flySource = result?.chart.palaces.find((p) => p.branch === (selected ?? result.chart.mingGongBranch));
  const scope =
    view === 'year'
      ? 'yearly'
      : view === 'month'
        ? 'monthly'
        : view === 'day'
          ? 'daily'
          : view === 'hour'
            ? 'hourly'
            : undefined;
  const flow =
    result && scope
      ? (() => {
          try {
            return flowContext(result, date, view === 'hour' ? flowTime : '12:00', scope);
          } catch {
            return null;
          }
        })()
      : null;

  const list =
    view === 'decade' && targetPalace
      ? SI_HUA_TABLE[targetPalace.stem]
      : view === 'fly' && flySource
        ? SI_HUA_TABLE[flySource.stem]
        : flow?.mutagen;
  const overlayLabel =
    view === 'decade'
      ? '限'
      : view === 'year'
        ? '年'
        : view === 'month'
          ? '月'
          : view === 'day'
            ? '日'
            : view === 'hour'
              ? '时'
              : view === 'fly'
                ? '飞'
                : '';
  const layerLabel =
    view === 'year'
      ? '流年'
      : view === 'month'
        ? '流月'
        : view === 'day'
          ? '流日'
          : view === 'hour'
            ? '流时'
            : view === 'decade'
              ? '大限'
              : view === 'small'
                ? '小限'
                : view === 'fly'
                  ? '宫干飞星'
                  : '';

  const overlay: Record<string, string> = {};
  if (list) list.forEach((star, i) => (overlay[star] = ['禄', '权', '科', '忌'][i]));

  const highlightBranch =
    view === 'decade'
      ? decade?.palaceBranch
      : view === 'small'
        ? small?.branch
        : view === 'fly'
          ? flySource?.branch
          : flow?.branch;

  const overlayText =
    view === 'small'
      ? small
        ? `${date} 按农历年计算虚岁 ${small.nominalAge}，小限在${BRANCH_NAMES[small.branch]}位（本命${small.palaceName}）。小限采用 iztro 男女顺逆口径。`
        : '所选日期无法计算小限。'
      : view === 'fly'
        ? `点击任一宫位，查看该宫宫干 ${flySource ? STEMS[flySource.stem] : ''} 飞出的四化；这是常用四化表的一种口径。`
        : !calendar
          ? '请选择有效日期。'
          : view === 'decade'
            ? decade
              ? `${date}（农历 ${calendar.lunarYear} 年）虚岁 ${calendar.nominalAge}，大限 ${decade.startAge}–${decade.endAge} 岁 · ${decade.palaceName}。`
              : '所选日期未对应到大限。'
            : flow
              ? `${date}${view === 'hour' ? ` ${flowTime}` : ''} · ${layerLabel}命宫在${BRANCH_NAMES[flow.branch]}位，${flow.stem}干四化。`
              : '无法计算运限，请检查日期、时间和出生日期。';

  const submit = () => {
    setError('');
    if (form.unknownTime) {
      if (!form.date) {
        setError('请先填写出生日期。');
        return;
      }
      setResult(null);
      go('compare');
      return;
    }
    try {
      setResult({ ...makeChart(form), uncertain: chartTimeUncertain(form, result) });
      setSelected(null);
      setFormOpen(false);
      revealReading();
    } catch (e) {
      setError(e instanceof Error ? e.message : '无法排盘，请检查输入。');
    }
  };

  const loadFamousPreset = (person: FamousPerson) => {
    const presetForm = famousBirthForm(person);
    setForm(presetForm);
    try {
      setResult({ ...makeChart(presetForm), uncertain: true });
      setSelected(null);
      setFormOpen(false);
      revealReading();
    } catch (e) {
      setError(e instanceof Error ? e.message : '预设案例生成失败。');
    }
  };

  const formDirty = Boolean(result && JSON.stringify(form) !== JSON.stringify(result.form));

  return (
    <div className="page-stack">
      <SectionHead
        eyebrow="YOUR BIRTH CHART"
        title="我的命盘"
        description="输入出生资料，生成可交互的三方四正命盘与主题解读。"
        action={
          result ? (
            <button type="button" className="btn btn-secondary" disabled={formDirty} onClick={save}>
              <Bookmark size={16} aria-hidden="true" /> 保存到本机
            </button>
          ) : undefined
        }
      />

      <details
        className="card disclosure"
        open={formOpen}
        onToggle={(e) => setFormOpen(e.currentTarget.open)}
      >
        <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', listStyle: 'none' }}>
          <span>
            <strong>出生资料</strong>
            <span className="small muted" style={{ marginLeft: 10 }}>
              {result ? `${form.name || '未命名'} · ${form.date} ${form.time || ''}` : '填写出生日期与时间'}
            </span>
          </span>
          <span className="meta-pill">
            {formOpen ? '收起' : '修改资料'} <ChevronRight size={14} aria-hidden="true" />
          </span>
        </summary>

        <div className="page-stack" style={{ marginTop: '1rem' }}>
          <p className="small muted">日期与时间以出生地当时的记录为准。</p>
          <BirthEditor value={form} onChange={setForm} onSubmit={submit} />
          {error ? (
            <div className="field-error" role="alert">
              {error}
            </div>
          ) : null}

          <div className="card-subtle page-stack" style={{ gap: '0.6rem' }}>
            <div className="small" style={{ fontWeight: 700 }}>
              快速载入公开历史样本（估算时辰，供对比规则）
            </div>
            <div className="btn-row">
              {FAMOUS_PERSONS.map((person) => (
                <button
                  type="button"
                  key={person.id}
                  className="btn btn-ghost btn-sm"
                  onClick={() => loadFamousPreset(person)}
                >
                  {person.name}
                </button>
              ))}
            </div>
          </div>

          <div className="card-subtle page-stack" style={{ gap: '0.65rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontWeight: 700 }}>
                已保存到本机 <span className="meta-pill">{saved.length}</span>
              </span>
              <div className="btn-row">
                <button type="button" className="btn btn-secondary btn-sm" onClick={exportSaved}>
                  导出备份
                </button>
                <label className="btn btn-secondary btn-sm">
                  导入备份
                  <input
                    aria-label="导入命盘备份"
                    className="visually-hidden"
                    type="file"
                    accept=".json,application/json"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) importSaved(f);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>
            <p className="field-hint">
              仅保存在此浏览器，建议定期导出备份；更换设备或清除浏览器数据会丢失本地记录。
            </p>
            {storageError ? (
              <div className="field-error" role="alert">
                {storageError} 可先导出原始备份。
              </div>
            ) : null}
            {saved.length > 0 ? (
              <div className="saved-list">
                {saved.map((s) => (
                  <div className="saved-item" key={s.id}>
                    <button
                      type="button"
                      style={{
                        background: 'transparent',
                        border: 0,
                        textAlign: 'left',
                        cursor: 'pointer',
                        flex: 1,
                        padding: 0,
                      }}
                      onClick={() => openSaved(s)}
                    >
                      <strong>{s.form.name || '未命名命盘'}</strong>
                      <div className="small muted">
                        {s.form.date} {s.uncertain ? '· 候选盘' : ''}
                      </div>
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      title="删除本机记录"
                      aria-label={`删除 ${s.form.name || '未命名命盘'}`}
                      onClick={() => removeSaved(s.id)}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </details>

      {formDirty ? (
        <div className="field-error" role="status">
          出生资料已修改；当前仍显示上一次的命盘，请重新生成后再查看、保存或复制。
        </div>
      ) : null}

      {result ? (
        <>
          {result.uncertain ? (
            <div className="info-banner" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <span>这是一张用于比较或估算时辰的参考盘，出生时间尚未核实。请勿将代表时刻当作真实记录。</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={formDirty}
                onClick={() => {
                  if (
                    window.confirm(
                      `请确认已核实实际出生时间为 ${result.form.time}。代表时刻不能代替出生记录。`,
                    )
                  ) {
                    const verified = { ...result.form, timeApprox: false };
                    setForm(verified);
                    setResult({ ...result, form: verified, uncertain: false });
                  }
                }}
              >
                我已核实出生时间
              </button>
            </div>
          ) : null}

          {/* Two-Column Workspace: Reading Col 1, Chart Col 2 */}
          <div className="chart-workspace" style={{ opacity: formDirty ? 0.6 : 1 }}>
            <div className="reading-column">
              {!formDirty ? (
                <ReadingPanel
                  key={result.id}
                  result={result}
                  topicId={readingTopic}
                  onSelectTopic={selectTopic}
                  onOpenDataset={() => go('research')}
                />
              ) : (
                <div className="card">
                  <p className="muted">资料修改后，重新点击“生成我的命盘”以同步刷新主题解读。</p>
                </div>
              )}
            </div>

            <div className="chart-column">
              <section className="card page-stack" id="chart-visual" style={{ gap: '0.95rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div className="eyebrow">THE CELESTIAL MAP</div>
                    <h2 style={{ fontSize: '1.3rem' }}>
                      {result.form.name || '你的紫微命盘'}{' '}
                      <span className="small muted" style={{ fontWeight: 500 }}>
                        {result.chart.wuxingJuName}
                      </span>
                    </h2>
                  </div>
                  <StatusPill tone="good">本地计算</StatusPill>
                </div>

                {/* Flow & Layer Switcher */}
                <div className="page-stack" style={{ gap: '0.6rem' }}>
                  <div className="segmented-group" role="group" aria-label="切换运限与飞星层级">
                    {(
                      [
                        ['natal', '本命'],
                        ['decade', '大限'],
                        ['small', '小限'],
                        ['year', '流年'],
                        ['month', '流月'],
                        ['day', '流日'],
                        ['hour', '流时'],
                        ['fly', '宫干飞星'],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        className={`seg-btn ${view === key ? 'active' : ''}`}
                        aria-pressed={view === key}
                        onClick={() => setView(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {view !== 'natal' && view !== 'fly' ? (
                    <div className="form-grid" style={{ maxWidth: 460 }}>
                      <div className="form-field">
                        <label className="form-label" htmlFor="flow-date-input">
                          查看日期
                        </label>
                        <input
                          id="flow-date-input"
                          className="input"
                          type="date"
                          min="1900-01-01"
                          max="2100-12-31"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                        />
                      </div>
                      {view === 'hour' ? (
                        <div className="form-field">
                          <label className="form-label" htmlFor="flow-time-input">
                            查看时间
                          </label>
                          <input
                            id="flow-time-input"
                            className="input"
                            type="time"
                            value={flowTime}
                            onChange={(e) => setFlowTime(e.target.value)}
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {view !== 'natal' ? (
                  <div className="info-banner small">
                    {overlayText}{' '}
                    {list?.length ? ` ${list.map((name, i) => `${name}化${['禄', '权', '科', '忌'][i]}`).join(' / ')}。` : ''}
                    {scope ? ' 运限宫位与四化采用 iztro 口径，未显示全部流曜；查看时间按所填钟表时间处理。' : ''}
                    {' 解读面板基于本命盘，不随此处切换。'}
                    {view === 'fly' ? (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ marginLeft: 8 }}
                        onClick={() => document.getElementById('palace-detail')?.scrollIntoView({ behavior: 'smooth' })}
                      >
                        查看所选宫位详情
                      </button>
                    ) : null}
                  </div>
                ) : null}

                <div role="region" tabIndex={0} aria-label="命盘，可横向滚动">
                  <ChartBoard
                    result={result}
                    selected={selected}
                    onSelect={selectPalace}
                    overlay={overlay}
                    overlayLabel={overlayLabel}
                    highlightBranch={highlightBranch}
                    flowNames={flow?.names}
                    flowLabel={layerLabel}
                  />
                </div>

                <div className="btn-row small muted">
                  <span>●禄 ◆权 ✦科 ▲忌 · 实线本命 / 虚线运限飞星</span>
                  <span>点击任意宫位高亮三方四正并联动解读</span>
                </div>
              </section>

              <PalaceDetail result={result} branch={selected} overlay={overlay} overlayLabel={layerLabel} />

              <section className="card page-stack" style={{ gap: '0.6rem' }}>
                <div className="eyebrow">CALCULATION NOTES</div>
                <h3 style={{ fontSize: '1.1rem' }}>这张盘是怎么排出来的</h3>
                {result.details.map((x, i) => (
                  <div key={i} className="card-subtle small">
                    <strong className="mono" style={{ marginRight: 8 }}>
                      0{i + 1}
                    </strong>
                    {x}
                  </div>
                ))}
                <p className="field-hint">输入修改后，请重新点击“生成我的命盘”。</p>
              </section>

              <div className="split-grid-2">
                <button
                  type="button"
                  className="feature-card"
                  style={{ cursor: 'pointer', textAlign: 'left' }}
                  onClick={() => go('assistant')}
                >
                  <div>
                    <MessageCircle size={18} aria-hidden="true" />
                    <div style={{ fontWeight: 700, marginTop: 6 }}>围绕命盘提问</div>
                    <div className="small muted">检索相关宫位与古籍原文片段</div>
                  </div>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="feature-card"
                  style={{ cursor: 'pointer', textAlign: 'left' }}
                  onClick={() => go('compare')}
                >
                  <div>
                    <GitCompareArrows size={18} aria-hidden="true" />
                    <div style={{ fontWeight: 700, marginTop: 6 }}>比较排盘口径</div>
                    <div className="small muted">对比候选时辰与不同流派设定</div>
                  </div>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', paddingBlock: '3rem' }}>
          <div className="eyebrow" style={{ justifyContent: 'center' }}>
            YOUR CHART AWAITS
          </div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: 6 }}>一张命盘，一段探索。</h2>
          <p className="secondary">在上方填写出生资料或选择历史示例后，十二宫星图会在这里展开。</p>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [form, setForm] = useState<BirthForm>({ ...DEFAULT_FORM });
  const [result, setResult] = useState<ChartResult | null>(null);
  const [initial] = useState(loadSaved);
  const [saved, setSaved] = useState<Saved[]>(initial.records);
  const [storageError, setStorageError] = useState(initial.error);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navCompact, setNavCompact] = useState(false);
  const [toast, setToast] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const headerRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  // Sync theme state from meta/media without mutating storage on OS changes
  useEffect(() => {
    const syncThemeState = () => {
      const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
      if (meta?.content === 'dark' || meta?.content === 'light') {
        setTheme(meta.content);
      } else {
        setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      }
    };
    syncThemeState();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener?.('change', syncThemeState);
    return () => mq.removeEventListener?.('change', syncThemeState);
  }, []);

  // Measure header overflow using ResizeObserver (navbar pattern)
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const check = () => setNavCompact(el.clientWidth < 1100);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Update document <title> cleanly on page switch
  useEffect(() => {
    const item = NAV.find((x) => x.id === page);
    if (typeof document !== 'undefined') {
      document.title = item ? `${item.label} · 紫微研习室` : '紫微研习室 · 一张命盘，一场探索';
    }
  }, [page]);

  // Storage listener across tabs
  useEffect(() => {
    const sync = (e: StorageEvent) => {
      if (e.key !== STORAGE && e.key !== null) return;
      try {
        setSaved(readSaved(localStorage));
        setStorageError('');
      } catch (err) {
        setStorageError(err instanceof Error ? err.message : '本机记录不可读取。');
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  // Close drawer on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuBtnRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const toggleTheme = () => {
    const next: 'light' | 'dark' = theme === 'dark' ? 'light' : 'dark';
    const osDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const osTheme: 'light' | 'dark' = osDark ? 'dark' : 'light';
    const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');

    if (next === osTheme) {
      localStorage.removeItem('color-scheme');
      if (meta) meta.content = 'light dark';
    } else {
      localStorage.setItem('color-scheme', next);
      if (meta) meta.content = next;
    }
    setTheme(next);
  };

  const go = (p: Page) => {
    setPage(p);
    setMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const notify = (x: string) => {
    setToast(x);
    setTimeout(() => setToast(''), 2700);
  };

  const save = () => {
    if (!result) return;
    const item = { id: result.id, form: result.form, uncertain: result.uncertain };
    try {
      const current = readSaved(localStorage);
      const next = upsertSaved(current, item);
      localStorage.setItem(STORAGE, JSON.stringify(next));
      setSaved(next);
      setStorageError('');
      notify('已保存到当前浏览器');
    } catch (e) {
      setStorageError(e instanceof Error ? e.message : '保存失败，请检查浏览器存储空间。');
      notify('保存失败，原有记录未更改');
    }
  };

  const remove = (id: string) => {
    if (!window.confirm('确定删除这条本机命盘记录吗？删除后可使用之前导出的备份恢复。')) return;
    try {
      const next = readSaved(localStorage).filter((s) => s.id !== id);
      localStorage.setItem(STORAGE, JSON.stringify(next));
      setSaved(next);
      setStorageError('');
      notify('已从本机移除');
    } catch {
      notify('删除失败，原有记录未更改');
    }
  };

  const exportSaved = () => {
    try {
      let data: string;
      let filename = 'ziwei-study-backup.json';
      try {
        data = makeBackup(readSaved(localStorage));
      } catch {
        data = localStorage.getItem(STORAGE) || '';
        filename = 'ziwei-study-raw-recovery.json';
      }
      const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify('备份已导出，请妥善保管出生资料');
    } catch {
      notify('导出失败，请检查浏览器设置');
    }
  };

  const importSaved = async (file: File) => {
    try {
      if (file.size > 10_000_000) throw new Error('备份文件超过 10 MB。');
      const incoming = parseBackup(await file.text());
      const merged = mergeSaved(readSaved(localStorage), incoming);
      localStorage.setItem(STORAGE, JSON.stringify(merged.records));
      setSaved(merged.records);
      setStorageError('');
      notify(`已导入 ${merged.added} 条，保留 ${merged.skipped} 条已有记录`);
    } catch (e) {
      notify(e instanceof Error ? e.message : '导入失败，原有记录未更改');
    }
  };

  const open = (s: Saved) => {
    try {
      const r = {
        ...makeChart(s.form),
        uncertain: Boolean(s.uncertain || s.form.timeApprox),
        id: s.id,
      };
      setForm(s.form);
      setResult(r);
      go('chart');
      revealReading();
    } catch {
      notify('记录无法读取，请重新输入资料');
    }
  };

  const example = () => {
    const f: BirthForm = {
      ...DEFAULT_FORM,
      name: '示例命盘（虚构）',
      date: '1990-01-01',
      time: '08:00',
      gender: 'female',
    };
    try {
      setForm(f);
      setResult(makeChart(f));
      go('chart');
      revealReading();
    } catch {
      notify('示例命盘生成失败');
    }
  };

  const loadFamous = (person: FamousPerson) => {
    const f = famousBirthForm(person);
    try {
      setForm(f);
      setResult({ ...makeChart(f), uncertain: true });
      go('chart');
      revealReading();
    } catch {
      notify('示例命盘生成失败');
    }
  };

  const pick = (r: ChartResult) => {
    setForm(r.form);
    setResult(r);
    go('chart');
    revealReading();
  };

  const current = result && JSON.stringify(form) === JSON.stringify(result.form) ? result : null;

  const body =
    page === 'home' ? (
      <Home
        go={go}
        current={current}
        onExample={example}
        onFamous={loadFamous}
        saved={saved}
        openSaved={open}
      />
    ) : page === 'chart' ? (
      <ChartPage
        form={form}
        setForm={setForm}
        result={result}
        setResult={setResult}
        go={go}
        save={save}
        saved={saved}
        openSaved={open}
        removeSaved={remove}
        exportSaved={exportSaved}
        importSaved={importSaved}
        storageError={storageError}
      />
    ) : page === 'assistant' ? (
      <Assistant key={current?.id || 'empty'} result={current} goChart={() => go('chart')} />
    ) : page === 'library' ? (
      <Library />
    ) : page === 'compare' ? (
      <Compare
        form={form}
        result={current}
        onPick={pick}
        goChart={() => go('chart')}
        inheritedUncertainty={chartTimeUncertain(form, result)}
      />
    ) : page === 'relationship' ? (
      <Relationship first={current} saved={saved} goChart={() => go('chart')} />
    ) : page === 'similar' ? (
      <Similar current={current} goChart={() => go('chart')} />
    ) : page === 'liuren' ? (
      <Liuren />
    ) : (
      <Research current={current} />
    );

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link visually-hidden">
        跳到正文
      </a>

      <header className="site-header">
        <div ref={headerRef} className="header-inner">
          <button type="button" className="brand-btn" onClick={() => go('home')}>
            <span className="brand-mark" aria-hidden="true">
              <Sparkles size={16} />
            </span>
            <span className="brand-copy">
              <span className="brand-title">紫微研习室</span>
              <span className="brand-sub">ZIWEI STUDY LAB</span>
            </span>
          </button>

          <nav className={`nav-wrap ${navCompact ? 'is-compact' : 'is-wide'}`} aria-label="主导航">
            <ul className="nav-list">
              {NAV.map(({ id, label }) => (
                <li key={id}>
                  <button
                    type="button"
                    className="nav-link"
                    aria-current={page === id ? 'page' : undefined}
                    onClick={() => go(id)}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>

            <button
              ref={menuBtnRef}
              type="button"
              className="nav-menu-trigger"
              aria-expanded={menuOpen}
              aria-controls="compact-nav-drawer"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X size={16} aria-hidden="true" /> : <Menu size={16} aria-hidden="true" />}
              <span>导航</span>
            </button>
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="theme-toggle"
              aria-pressed={theme === 'dark'}
              aria-label={theme === 'dark' ? '切换为宣纸浅色主题' : '切换为星夜深色主题'}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={15} aria-hidden="true" />
                  <span>宣纸</span>
                </>
              ) : (
                <>
                  <Moon size={15} aria-hidden="true" />
                  <span>星夜</span>
                </>
              )}
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => go('chart')}>
              <Plus size={14} aria-hidden="true" />
              <span>打开命盘</span>
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div
          ref={drawerRef}
          id="compact-nav-drawer"
          className="nav-drawer"
          role="dialog"
          aria-label="页面导航菜单"
        >
          <ul className="nav-drawer-list">
            {NAV.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <button
                  type="button"
                  className="nav-link"
                  aria-current={page === id ? 'page' : undefined}
                  onClick={() => go(id)}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <main id="main-content" className="main-content" tabIndex={-1}>
        {body}
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <span>© 2026 紫微研习室 · 传统文化学习与研究 · 本地浏览器运算</span>
          <span>
            <a href="https://github.com/Renhuai123/ziwei-doushu" target="_blank" rel="noreferrer">
              上游开源引擎与数据来源 <ArrowUpRight size={12} aria-hidden="true" />
            </a>{' '}
            ·{' '}
            <a href="/UPSTREAM-LICENSE.txt" target="_blank" rel="noreferrer">
              MIT 许可
            </a>
          </span>
        </div>
      </footer>

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '1.25rem',
            right: '1.25rem',
            zIndex: 200,
            padding: '0.7rem 1.05rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-elevated)',
            border: '1.5px solid var(--accent)',
            color: 'var(--text-primary)',
            boxShadow: 'var(--shadow-lg)',
            fontSize: '0.88rem',
            fontWeight: 600,
          }}
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
