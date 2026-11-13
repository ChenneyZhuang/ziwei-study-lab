import { useId, useState } from 'react';
import { BarChart3, Download, ExternalLink, FileSearch, FlaskConical } from 'lucide-react';
import { BRANCH_NAMES, DEFAULT_FORM, makeChart, type ChartResult } from '../core';
import { SectionHead } from '../components';
import { datasetBrightnessConflicts, findDatasetRecord, type DatasetRow } from '../dataset';

type Stat = { name: string; count: number };
const TOPICS: Record<string, string> = {
  overview: '命格总览',
  personality: '性格',
  love: '感情',
  career: '事业',
  wealth: '财运',
  health: '健康',
  family: '兄弟',
  children: '子女',
  move: '迁移',
  friends: '人际',
  home: '田宅',
  spirit: '福德',
  parents: '父母',
};

function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : part.startsWith('`') && part.endsWith('`') ? (
          <code key={i}>{part.slice(1, -1)}</code>
        ) : (
          part
        ),
      )}
    </>
  );
}

function DatasetText({ text }: { text: string }) {
  return (
    <div className="page-stack" style={{ gap: '0.5rem' }}>
      {text.split('\n').map((line, i) => {
        const heading = /^\s*#{1,6}\s+(.+)$/.exec(line);
        if (heading)
          return (
            <h4 key={i} style={{ marginTop: 6 }}>
              <Inline text={heading[1]} />
            </h4>
          );
        if (!line.trim()) return <div key={i} style={{ height: 4 }} />;
        return (
          <p key={i} className="small secondary">
            <Inline text={line} />
          </p>
        );
      })}
    </div>
  );
}

export default function Research({ current }: { current: ChartResult | null }) {
  const uid = useId();
  const [year, setYear] = useState('1990');
  const [days, setDays] = useState('7');
  const [stats, setStats] = useState<Stat[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState<{ year: number; days: number } | null>(null);
  const [data, setData] = useState<DatasetRow | null>(null);
  const [dataMessage, setDataMessage] = useState('');
  const [topic, setTopic] = useState('overview');
  const [reading, setReading] = useState(false);

  const stale = Boolean(generated && (String(generated.year) !== year || String(generated.days) !== days));

  const run = async () => {
    const y = Number(year);
    const n = Number(days);
    if (!Number.isInteger(y) || y < 1900 || y > 2050 || !Number.isInteger(n) || n < 1 || n > 31) {
      setError('年份需为 1900—2050，抽样天数为 1—31。');
      return;
    }
    setError('');
    setBusy(true);
    setGenerated(null);
    setStats([]);
    setTotal(0);
    const counts: Record<string, number> = {};
    let count = 0;
    try {
      for (let day = 1; day <= n; day++) {
        for (const gender of ['female', 'male'] as const) {
          for (let h = 0; h < 12; h++) {
            const clock = h === 0 ? '00:30' : `${String(2 * h - 1).padStart(2, '0')}:30`;
            const date = `${y}-01-${String(day).padStart(2, '0')}`;
            const r = makeChart({ ...DEFAULT_FORM, date, time: clock, gender });
            const m =
              r.chart.palaces.find((p) => p.isMingGong)?.stars.find((s) => s.type === 'major')?.name || '无主星';
            counts[m] = (counts[m] || 0) + 1;
            count++;
          }
        }
        setTotal(count);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      setStats(
        Object.entries(counts)
          .map(([name, c]) => ({ name, count: c }))
          .sort((a, b) => b.count - a.count),
      );
      setGenerated({ year: y, days: n });
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成样本失败。');
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    if (!generated || stale) return;
    const csv =
      '命宫第一主星,数量,占比\n' +
      stats.map((s) => `${s.name},${s.count},${((s.count / total) * 100).toFixed(2)}%`).join('\n');
    const a = document.createElement('a');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    a.href = url;
    a.download = `ziwei-sample-${generated.year}-${generated.days}days.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const loadFile = async (file: File | undefined) => {
    if (!file || !current) return;
    setData(null);
    setDataMessage('正在按键读取文件，较大的文件可能需要一些时间…');
    setReading(true);
    const key = `${current.effectiveDate}-${current.branch}-${current.form.gender}`;
    try {
      const found = await findDatasetRecord(file, key);
      if (
        found &&
        found.c &&
        typeof found.c === 'object' &&
        Object.values(found.c).every((v) => typeof v === 'string')
      ) {
        setData(found);
        setDataMessage(`找到键 ${key}。键匹配不代表排盘口径一致，请核对下方提示。`);
      } else if (found) {
        setDataMessage('找到记录，但解读内容格式不正确。请检查数据文件。');
      } else {
        setDataMessage(`没有找到 ${key}。请确认选择了正确的年份文件以及出生日期、时辰和性别。`);
      }
    } catch (e) {
      setDataMessage(e instanceof Error ? `读取失败：${e.message}` : '读取失败，请确认文件是解压后的 JSONL。');
    } finally {
      setReading(false);
    }
  };

  const conflicts = data && current ? datasetBrightnessConflicts(data, current.chart) : [];
  const maxStat = stats.length ? Math.max(...stats.map((x) => x.count)) : 1;

  return (
    <div className="page-stack">
      <SectionHead
        eyebrow="RESEARCH LAB"
        title="数据实验室"
        description="用可重复的样本研究命盘分布，或在本机按键查阅开源 v4.0 JSONL 解读文件。"
      />

      <div className="split-grid-2">
        <section className="card page-stack" style={{ gap: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="eyebrow">GENERATE & EXPLORE</div>
              <h2 style={{ fontSize: '1.2rem' }}>生成一组示例命盘</h2>
            </div>
            <FlaskConical size={20} aria-hidden="true" />
          </div>
          <p className="small muted">
            按指定年份 1 月逐日、12 个代表时辰和男女两种口径生成样本，统计命宫第一颗主星频次。
          </p>

          <div className="form-grid">
            <div className="form-field">
              <label className="form-label" htmlFor={`${uid}-year`}>
                年份
              </label>
              <input
                id={`${uid}-year`}
                className="input"
                type="number"
                min="1900"
                max="2050"
                value={year}
                disabled={busy}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor={`${uid}-days`}>
                抽样天数 <span className="muted small">（1 月 1 日起）</span>
              </label>
              <input
                id={`${uid}-days`}
                className="input"
                type="number"
                min="1"
                max="31"
                value={days}
                disabled={busy}
                onChange={(e) => setDays(e.target.value)}
              />
            </div>
          </div>

          <button type="button" className="btn btn-primary" onClick={run} disabled={busy}>
            <BarChart3 size={16} aria-hidden="true" /> {busy ? `正在生成 ${total} 张…` : '开始生成'}
          </button>
          {error ? (
            <div className="field-error" role="alert">
              {error}
            </div>
          ) : null}
          <p className="field-hint">
            这是一组按规则虚构的日期组合，不是真人资料。结果随时间口径和抽样方式改变，不验证命理预测能力。
          </p>
        </section>

        <section className="card page-stack" style={{ gap: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="eyebrow">SAMPLE RESULTS</div>
              <h2 style={{ fontSize: '1.2rem' }}>命宫主星分布</h2>
            </div>
            {stats.length > 0 ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                aria-label="下载 CSV"
                onClick={exportCsv}
                disabled={stale}
              >
                <Download size={15} aria-hidden="true" /> 导出 CSV
              </button>
            ) : null}
          </div>

          {stats.length && generated ? (
            <>
              <p className="small muted">
                {generated.year} 年 1 月前 {generated.days} 天 · 共 {total} 张示例盘 · 统计命宫第一颗主星
              </p>
              {stale ? (
                <div className="field-error">输入参数已更改；当前显示仍是旧样本，请重新生成后再下载。</div>
              ) : null}
              <div style={{ display: 'grid', gap: '0.45rem' }}>
                {stats.map((s) => (
                  <div
                    key={s.name}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '68px 1fr 48px',
                      alignItems: 'center',
                      gap: '0.6rem',
                      fontSize: '0.86rem',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{s.name}</span>
                    <div
                      style={{
                        height: 10,
                        borderRadius: 99,
                        background: 'var(--bg-inset)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${(s.count / maxStat) * 100}%`,
                          height: '100%',
                          background: 'var(--accent)',
                          borderRadius: 99,
                        }}
                      />
                    </div>
                    <strong className="mono" style={{ textAlign: 'right' }}>
                      {s.count}
                    </strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="card-subtle" style={{ textAlign: 'center', paddingBlock: '2.5rem' }}>
              <BarChart3 size={28} className="muted" aria-hidden="true" />
              <p className="small muted" style={{ marginTop: 8 }}>
                生成样本后在这里查看主星频次分布
              </p>
            </div>
          )}
        </section>
      </div>

      <section className="card page-stack" style={{ gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="eyebrow">OPEN DATASET · V4.0</div>
            <h2 style={{ fontSize: '1.25rem' }}>查阅开源预生成解读</h2>
          </div>
          <FileSearch size={22} aria-hidden="true" />
        </div>

        <p className="small secondary">
          作者提供的 v4.0 数据集按年份发布。下载并解压对应年份的 <code>.jsonl</code> 文件后，可在本机选择文件，按当前盘的排盘日期、时辰序号和性别查找；文件不会上传到任何服务器。
        </p>

        <div className="btn-row">
          <span className="meta-pill">01 下载对应年份</span>
          <span className="meta-pill">02 解压为 JSONL</span>
          <span className="meta-pill">03 选择本地文件</span>
        </div>

        <div className="btn-row">
          <a
            className="btn btn-secondary"
            href="https://github.com/Renhuai123/ziwei-doushu/releases/tag/v4.0-13d"
            target="_blank"
            rel="noreferrer"
          >
            获取数据集 <ExternalLink size={15} aria-hidden="true" />
          </a>
          <label
            className={`btn btn-primary ${!current || reading ? 'disabled' : ''}`}
            style={{ opacity: !current || reading ? 0.55 : 1 }}
          >
            {reading ? '正在查找…' : '选择 JSONL 文件'}
            <input
              type="file"
              aria-label="选择 JSONL 文件"
              className="visually-hidden"
              accept=".jsonl,application/json,text/plain"
              disabled={!current || reading}
              onChange={(e) => {
                void loadFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
        </div>

        <p className="field-hint">
          {current
            ? `当前查找键：${current.effectiveDate}-${current.branch}-${current.form.gender}（${BRANCH_NAMES[current.branch]}时）`
            : '先生成一张命盘，再选择文件查找。'}{' '}
          数据集涵盖 1950—2026 年，单年解压后约 700 MB；未按出生地校正，亮度表与当前默认可能不同。
        </p>

        {dataMessage ? (
          <div className="info-banner" role="status">
            {dataMessage}
          </div>
        ) : null}

        {data ? (
          <div className="card-subtle page-stack" style={{ gap: '0.85rem' }}>
            <div className="field-error" role="status">
              <strong>口径核对：</strong>仅通过日期、时辰和性别查找，并未验证所有星曜及流派规则。
              {conflicts.length ? (
                <ul style={{ margin: '0.4rem 0 0 1.2rem' }}>
                  {conflicts.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              ) : (
                '未在资料中发现可自动识别的亮度冲突，但这不代表两种口径一致。'
              )}
              请以原数据与命盘分别核对，传统叙述不能作为真实经历或未来结果的证据。
            </div>

            <div className="form-field" style={{ maxWidth: 280 }}>
              <label className="form-label" htmlFor={`${uid}-topic`}>
                选择解读主题
              </label>
              <select
                id={`${uid}-topic`}
                className="select"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              >
                {Object.entries(TOPICS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className="reading-block">
              <DatasetText text={data.c[topic] || '这个主题没有内容。'} />
            </div>

            <p className="field-hint">
              来源：紫微斗数开源解读数据集 v4.0，作者：王多鱼AI；数据采用 CC BY 4.0，引用的倪海厦原话另有权利限制。
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
