import { useId, useState } from 'react';
import { ArrowRight, Columns3, GitCompareArrows } from 'lucide-react';
import { BRANCH_NAMES, major, type BirthForm, type ChartResult } from '../core';
import { createComparisons, type CompareMode } from '../compare';
import { EmptyState, SectionHead } from '../components';

function difference(a: ChartResult, b: ChartResult, mode: CompareMode) {
  return b.chart.palaces.flatMap((p) => {
    const old = a.chart.palaces.find((q) => q.branch === p.branch);
    if (!old) return [];
    if (mode === 'brightness') {
      const changes = p.stars.flatMap((s) => {
        const before = old.stars.find((x) => x.name === s.name);
        return before && before.brightnessRaw !== s.brightnessRaw
          ? [`${s.name} ${before.brightnessRaw || '无'}→${s.brightnessRaw || '无'}`]
          : [];
      });
      return changes.length ? [`${BRANCH_NAMES[p.branch]}：${changes.slice(0, 3).join('、')}`] : [];
    }
    const sig = (q: typeof p) =>
      JSON.stringify([q.name, q.stars.map((s) => `${s.name}:${s.siHua || ''}`).sort()]);
    return sig(old) !== sig(p)
      ? [`${BRANCH_NAMES[p.branch]}：${old.name} ${major(old)} → ${p.name} ${major(p)}`]
      : [];
  });
}

export default function Compare({
  form,
  result,
  onPick,
  goChart,
  inheritedUncertainty = false,
}: {
  form: BirthForm;
  result: ChartResult | null;
  onPick: (r: ChartResult) => void;
  goChart: () => void;
  inheritedUncertainty?: boolean;
}) {
  const captionId = useId();
  const [mode, setMode] = useState<CompareMode>('time');
  const [rows, setRows] = useState<{ label: string; result: ChartResult }[]>([]);
  const [error, setError] = useState('');
  const [omitted, setOmitted] = useState('');

  const base = result?.form ?? form;

  const run = () => {
    setError('');
    setOmitted('');
    try {
      const next = createComparisons(base, mode, Boolean(inheritedUncertainty || result?.uncertain));
      setRows(next.rows);
      setOmitted(next.omitted);
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : '无法生成对照。');
    }
  };

  if (!base.date) {
    return (
      <div className="page-stack">
        <SectionHead
          eyebrow="COMPARE THE RULES"
          title="口径对照"
          description="同一份出生资料，看看不同的时间和规则会改变什么。"
        />
        <EmptyState
          title="先填写出生资料"
          description="填写出生日期后，即使时间不详也可以比较多个候选时辰。"
          onAction={goChart}
          action="填写出生资料"
        />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <SectionHead
        eyebrow="COMPARE THE RULES"
        title="口径对照"
        description="不确定的地方，值得被清楚地摆出来。"
        action={<span className="meta-pill">{base.date} · {base.name || '未命名'}</span>}
      />

      <div className="card page-stack" style={{ gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="brand-mark" aria-hidden="true">
            <Columns3 size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.18rem' }}>同一份资料，多种可能</h2>
            <p className="secondary small">根据当前出生资料重新排盘。差异来自所选计算规则，不代表哪一种一定正确。</p>
          </div>
        </div>

        <div className="split-grid-2" style={{ gap: '0.65rem' }}>
          {(
            [
              ['time', '候选时辰', '出生时间不确定'],
              ['late', '晚子时换日', '当日或次日'],
              ['leap', '闰月规则', '四种处理方式'],
              ['brightness', '星曜亮度', '不同亮度表'],
            ] as const
          ).map(([id, title, sub], i) => (
            <button
              type="button"
              key={id}
              aria-pressed={mode === id}
              className="feature-card"
              style={{
                cursor: 'pointer',
                textAlign: 'left',
                padding: '0.85rem 1rem',
                borderColor: mode === id ? 'var(--accent)' : undefined,
                background: mode === id ? 'var(--accent-soft)' : undefined,
              }}
              onClick={() => {
                setMode(id);
                setRows([]);
                setError('');
                setOmitted('');
              }}
            >
              <div>
                <span className="eyebrow" style={{ marginBottom: 2 }}>
                  0{i + 1}
                </span>
                <div style={{ fontWeight: 700 }}>{title}</div>
                <span className="small muted">{sub}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="reading-block">
          <div className="reading-block-title">
            大白话看懂：为什么选「
            {mode === 'time' ? '候选时辰' : mode === 'late' ? '晚子时换日' : mode === 'leap' ? '闰月规则' : '星曜亮度'}
            」会改变命盘，平时怎么定？
          </div>
          <p className="small" style={{ lineHeight: 1.7 }}>
            {mode === 'time'
              ? '紫微斗数里每两个小时换一个时辰，只要错开一个时辰，命宫位置与主星就会整套轮转。如果你不确定准确出生分钟，最靠谱的核对方法不是瞎猜，而是点开下方几个差异较大的候选盘，用「先看性格与生活经历」对照自己过去的脾气、学业事业和感情风格，通常很快能排除掉不像的那几张。'
              : mode === 'late'
              ? '晚上 23:00–23:59（晚子时）跨在当天和明天交界。一派认为 23 点就算进入下一天（次日子时），另一派认为要过了零点才算明天（当日晚子时）。如果你正好生在夜里十一点多，两边排出来的命盘会差整整一天甚至换命宫，用各自的大事或性格对照最准。'
              : mode === 'leap'
              ? '碰上农历闰月出生时（比如闰四月），古代各派算法分歧很大：有的算作四月、有的当成下个月五月，还有一派以闰月十五为界分上下半月（前当上月、后当下月）。不同口径最常影响宫位顺行起落与四化安星，建议结合早年重大转折来对照。'
              : '不同古本和流派（《全书》本表与中州派）给同一颗星在某宫打的“亮不亮分（庙旺平陷）”会有细微出入。注意：十二宫在哪儿、有哪些主星、本命四化全部一模一样！差异只在于古人认为某些星在某宫位“顺手发挥（旺）”还是“略吃力（陷）”。'}
          </p>
        </div>

        <div className="btn-row" style={{ justifyContent: 'space-between' }}>
          <p className="small secondary">
            {mode === 'time'
              ? '按出生地钟表时间逐分钟划分区间，每个区间取代表时刻；结果保留时间未核实的标记。'
              : '使用当前填写时间，分别套用不同口径。候选时间仍保持未核实状态。'}
          </p>
          <button type="button" className="btn btn-primary" onClick={run}>
            <GitCompareArrows size={16} aria-hidden="true" /> 生成对照
          </button>
        </div>

        {error ? (
          <div className="field-error" role="alert">
            {error}
          </div>
        ) : null}
        {omitted ? (
          <div className="info-banner" role="status">
            {omitted}
          </div>
        ) : null}
      </div>

      {rows.length > 0 ? (
        <section className="card page-stack" style={{ gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <div>
              <div className="eyebrow">COMPARISON RESULTS</div>
              <h2 id={captionId} style={{ fontSize: '1.25rem' }}>
                对照结果
              </h2>
            </div>
            <span className="meta-pill accent">{rows.length} 组</span>
          </div>

          <div className="table-wrapper" tabIndex={0} role="region" aria-labelledby={captionId}>
            <table className="data-table stack-mobile">
              <thead>
                <tr>
                  <th scope="col">口径 / 时间</th>
                  <th scope="col">排盘日期</th>
                  <th scope="col">时辰</th>
                  <th scope="col">命宫位置</th>
                  <th scope="col">命宫主星</th>
                  <th scope="col">五行局</th>
                  <th scope="col">与首行差异</th>
                  <th scope="col">操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const ming = r.result.chart.palaces.find((p) => p.isMingGong);
                  const diff = i === 0 ? [] : difference(rows[0].result, r.result, mode);
                  return (
                    <tr key={i}>
                      <th scope="row">{r.label}</th>
                      <td data-label="排盘日期" className="mono">
                        {r.result.effectiveDate}
                      </td>
                      <td data-label="时辰">{BRANCH_NAMES[r.result.branch]}</td>
                      <td data-label="命宫位置">{BRANCH_NAMES[r.result.chart.mingGongBranch]}</td>
                      <td data-label="命宫主星">{major(ming)}</td>
                      <td data-label="五行局">{r.result.chart.wuxingJuName}</td>
                      <td data-label="与首行差异">
                        {i === 0 ? (
                          '基准'
                        ) : diff.length ? (
                          <details>
                            <summary>{diff.length} 宫变化</summary>
                            <div className="small secondary" style={{ marginTop: 4 }}>
                              {diff.map((line, j) => (
                                <p key={j}>{line}</p>
                              ))}
                            </div>
                          </details>
                        ) : (
                          '无变化'
                        )}
                      </td>
                      <td data-label="操作">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onPick(r.result)}>
                          查看 <ArrowRight size={13} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="field-hint">
            差异宫位与首行相比；展开“宫变化”可查看部分明细，点击“查看”进入完整命盘。区间按分钟精度划分；代表时刻不能视为真实出生时间。
          </p>
        </section>
      ) : null}
    </div>
  );
}
