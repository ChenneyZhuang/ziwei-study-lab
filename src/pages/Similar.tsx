import { useEffect, useId, useRef, useState } from 'react';
import { Fingerprint, Search } from 'lucide-react';
import { BRANCH_NAMES, makeChart, type ChartResult } from '../core';
import { EmptyState, SectionHead } from '../components';
import { chartSignature, representativeClock } from '../similar';

/** Compare synthetic dates locally; this does not search real people's records. */
export default function Similar({ current, goChart }: { current: ChartResult | null; goChart: () => void }) {
  const yearId = useId();
  const [year, setYear] = useState(() => current?.effectiveDate.slice(0, 4) || '1990');
  const [matches, setMatches] = useState<{ date: string; branch: number }[]>([]);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [allHours, setAllHours] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [finished, setFinished] = useState(false);
  const [stopped, setStopped] = useState(false);
  const generation = useRef(0);

  useEffect(() => () => {
    generation.current++;
  }, []);

  const stop = () => {
    generation.current++;
    setBusy(false);
    setFinished(false);
    setStopped(true);
  };

  const run = async () => {
    if (!current) return;
    const y = Number(year);
    if (!Number.isInteger(y) || y < 1900 || y > 2050) {
      setError('请输入 1900—2050 年之间的年份。');
      return;
    }
    const runId = ++generation.current;
    setBusy(true);
    setError('');
    setMatches([]);
    setDone(0);
    setFinished(false);
    setStopped(false);

    const days = (Date.UTC(y + 1, 0, 1) - Date.UTC(y, 0, 1)) / 86400000;
    const branches = allHours ? Array.from({ length: 12 }, (_, i) => i) : [current.branch];
    setTotal(days * branches.length);
    const found: { date: string; branch: number }[] = [];
    let checked = 0;
    const target = chartSignature(current.chart);

    try {
      for (let i = 0; i < days; i++) {
        if (generation.current !== runId) return;
        const date = new Date(Date.UTC(y, 0, 1 + i)).toISOString().slice(0, 10);
        for (const branch of branches) {
          const sample = makeChart({
            ...current.form,
            date,
            time: representativeClock(branch),
            unknownTime: false,
            timeApprox: false,
            calendar: 'solar',
            correction: 'clock',
          });
          if (
            (date !== current.effectiveDate || branch !== current.branch) &&
            chartSignature(sample.chart) === target
          ) {
            found.push({ date, branch });
          }
          checked++;
        }
        const reportEvery = allHours ? 16 : 4;
        if ((i + 1) % reportEvery === 0 || i === days - 1) {
          setDone(checked);
          setMatches([...found]);
        }
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      if (generation.current === runId) setFinished(true);
    } catch (e) {
      if (generation.current === runId) {
        setError(e instanceof Error ? e.message : '样本计算失败。');
      }
    } finally {
      if (generation.current === runId) setBusy(false);
    }
  };

  if (!current) {
    return (
      <div className="page-stack">
        <SectionHead
          eyebrow="SIMILAR CHARTS"
          title="相似命盘样本"
          description="用程序生成的日期，比较命盘结构。"
        />
        <EmptyState
          title="先建立一张命盘"
          description="生成命盘后，可以在本地搜索相同结构的虚构日期样本。"
          onAction={goChart}
        />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <SectionHead
        eyebrow="SIMILAR CHARTS"
        title="相似命盘样本"
        description="看看其他日期是否会生成相同的命盘结构（十二宫、主星与本命四化）。"
      />

      <div className="split-grid-2" style={{ alignItems: 'start' }}>
        <section className="card page-stack" style={{ gap: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="eyebrow">LOCAL MATCHING</div>
              <h2 style={{ fontSize: '1.2rem' }}>搜索一年的日期组合</h2>
            </div>
            <Fingerprint size={22} aria-hidden="true" />
          </div>
          <p className="small muted">
            按照当前盘的性别口径、闰月和亮度设置，逐日生成示例盘。比较十二宫位置、主星与本命四化。
          </p>

          {current.uncertain ? (
            <div className="field-error" role="status">
              当前命盘使用未核实的候选出生时间，匹配结果也会随时辰变化。
            </div>
          ) : null}

          <div className="form-field">
            <label className="form-label" htmlFor={yearId}>
              搜索年份
            </label>
            <input
              id={yearId}
              className="input"
              type="number"
              min="1900"
              max="2050"
              value={year}
              disabled={busy}
              onChange={(e) => {
                setYear(e.target.value);
                setMatches([]);
                setFinished(false);
                setStopped(false);
              }}
            />
          </div>

          <fieldset className="fieldset-box" disabled={busy}>
            <legend>搜索时辰</legend>
            <div style={{ display: 'grid', gap: '0.3rem' }}>
              <label className="checkbox-row">
                <input
                  type="radio"
                  name="matching-scope"
                  checked={!allHours}
                  onChange={() => {
                    setAllHours(false);
                    setMatches([]);
                    setFinished(false);
                    setStopped(false);
                  }}
                />
                <span>当前 {BRANCH_NAMES[current.branch]} 时（较快）</span>
              </label>
              <label className="checkbox-row">
                <input
                  type="radio"
                  name="matching-scope"
                  checked={allHours}
                  onChange={() => {
                    setAllHours(true);
                    setMatches([]);
                    setFinished(false);
                    setStopped(false);
                  }}
                />
                <span>全部 12 个时辰（约 12 倍计算量）</span>
              </label>
            </div>
          </fieldset>

          <div className="btn-row">
            <button type="button" className="btn btn-primary" onClick={run} disabled={busy}>
              <Search size={16} aria-hidden="true" /> 开始搜索
            </button>
            {busy ? (
              <button type="button" className="btn btn-secondary" onClick={stop}>
                停止搜索
              </button>
            ) : null}
          </div>

          {error ? (
            <div className="field-error" role="alert">
              {error}
            </div>
          ) : null}

          {busy || finished || stopped ? (
            <div className="card-subtle" aria-live="polite" style={{ display: 'grid', gap: '0.45rem' }}>
              <span className="small">
                已检查 {done} / {total} 个日期与时辰组合 {busy ? '· 正在计算' : stopped ? '· 已停止' : '· 已完成'}
              </span>
              <progress max={total} value={done} style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </div>
          ) : null}

          <p className="field-hint">
            计算只在本浏览器进行；按排盘日期和时辰生成样本，不推断出生地或实际钟表时间。与官网的数据库搜索范围不同。
          </p>
        </section>

        <section className="card page-stack" style={{ gap: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="eyebrow">MATCHING DATES</div>
              <h2 style={{ fontSize: '1.2rem' }}>匹配结果</h2>
            </div>
            <span className="meta-pill accent">{matches.length} 组</span>
          </div>

          {!busy && !finished && !stopped ? (
            <p className="small muted">选择年份后开始搜索。</p>
          ) : matches.length ? (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.5rem' }}>
              {matches.map(({ date, branch }) => (
                <li
                  key={`${date}-${branch}`}
                  className="card-subtle"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}
                >
                  <strong className="mono">{date}</strong>
                  <span className="small secondary">{BRANCH_NAMES[branch]}时 · 相同主星与本命四化</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="small muted">
              {busy ? '正在搜索…' : stopped ? '已停止，目前没有找到符合条件的日期。' : '该年份没有找到符合条件的日期。'}
            </p>
          )}

          <div className="info-banner small">
            这是按规则生成的虚构日期组合，不是与真实人物的匹配；相同结构不意味着性格、经历或命运相同。
          </div>
        </section>
      </div>
    </div>
  );
}
