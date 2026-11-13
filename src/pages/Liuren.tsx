import { useId, useState } from 'react';
import { Clock3, Sparkles } from 'lucide-react';
import { SectionHead } from '../components';
import { LIUREN_MEANINGS, LIUREN_NAMES, liurenForClock } from '../liuren';

function nowFields() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
  return { date: local.slice(0, 10), time: local.slice(11, 16) };
}

export default function Liuren() {
  const uid = useId();
  const [initial] = useState(nowFields);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [late, setLate] = useState<'current-day' | 'next-day'>('current-day');
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<ReturnType<typeof liurenForClock> | null>(null);
  const [error, setError] = useState('');

  const update = () => {
    try {
      setResult(liurenForClock(date, time, late));
      setError('');
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : '无法起课。');
    }
  };

  const change = () => {
    setResult(null);
    setError('');
  };

  return (
    <div className="page-stack">
      <SectionHead
        eyebrow="SIX POSITIONS"
        title="小六壬"
        description="用月、日、时体验六宫顺数的传统民俗起课方法。"
      />

      <div className="split-grid-2" style={{ alignItems: 'start' }}>
        <section className="card page-stack" style={{ gap: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="eyebrow">ONE MOMENT</div>
              <h2 style={{ fontSize: '1.2rem' }}>选择起课时间</h2>
            </div>
            <Clock3 size={20} aria-hidden="true" />
          </div>
          <p className="small muted">
            默认使用本设备的当地日期和时间，也可以手动修改。问题只保留在当前页面，不会被保存或发送。
          </p>

          <div className="form-field">
            <label className="form-label" htmlFor={`${uid}-q`}>
              想记录的问题 <span className="muted small">（可留空）</span>
            </label>
            <textarea
              id={`${uid}-q`}
              className="textarea"
              value={question}
              maxLength={180}
              onChange={(e) => {
                setQuestion(e.target.value);
                change();
              }}
              placeholder="例如：我想整理一件正在考虑的事"
            />
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label className="form-label" htmlFor={`${uid}-d`}>
                公历日期
              </label>
              <input
                id={`${uid}-d`}
                className="input"
                type="date"
                min="1900-01-01"
                max="2050-12-31"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  change();
                }}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor={`${uid}-t`}>
                钟表时间
              </label>
              <input
                id={`${uid}-t`}
                className="input"
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  change();
                }}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor={`${uid}-l`}>
                晚子时换日
              </label>
              <select
                id={`${uid}-l`}
                className="select"
                value={late}
                onChange={(e) => {
                  setLate(e.target.value as typeof late);
                  change();
                }}
              >
                <option value="current-day">23:00 后仍按当日</option>
                <option value="next-day">23:00 后按次日</option>
              </select>
            </div>
          </div>

          <p className="field-hint">
            按所选钟表日期换算常用农历，闰月按本月计算；不会自动校正所在地时区和真太阳时。
          </p>

          <div className="btn-row">
            <button type="button" className="btn btn-primary" onClick={update}>
              <Sparkles size={16} aria-hidden="true" /> 开始起课
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                const n = nowFields();
                setDate(n.date);
                setTime(n.time);
                change();
              }}
            >
              使用此刻
            </button>
          </div>

          {error ? (
            <div className="field-error" role="alert">
              {error}
            </div>
          ) : null}
        </section>

        <section className="card page-stack" style={{ gap: '0.9rem' }}>
          <div>
            <div className="eyebrow">THE SIX POSITIONS</div>
            <h2 style={{ fontSize: '1.2rem' }}>月上起日，日上起时</h2>
          </div>

          <div className="split-grid-3" style={{ gap: '0.6rem' }}>
            {LIUREN_NAMES.map((name) => {
              const active = result?.positions.hour === name;
              return (
                <div
                  key={name}
                  className="card-subtle"
                  style={{
                    textAlign: 'center',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.08rem',
                    fontWeight: 700,
                    borderColor: active ? 'var(--accent)' : undefined,
                    background: active ? 'var(--accent-soft)' : undefined,
                    color: active ? 'var(--accent-strong)' : undefined,
                  }}
                >
                  {name}
                </div>
              );
            })}
          </div>

          {result ? (
            <div aria-live="polite" className="page-stack" style={{ gap: '0.75rem' }}>
              <p className="small secondary">
                排课日 <span className="mono">{result.effectiveDate}</span> · 农历 {result.lunarYear} 年{' '}
                {result.isLeap ? '闰' : ''}
                {result.lunarMonth} 月 {result.lunarDay} 日 · {result.branch}时
              </p>
              <div className="btn-row">
                <span className="meta-pill">
                  月落 <strong>{result.positions.month}</strong>
                </span>
                <span className="meta-pill">
                  日落 <strong>{result.positions.day}</strong>
                </span>
                <span className="meta-pill accent">
                  时落 <strong>{result.positions.hour}</strong>
                </span>
              </div>
              <div className="reading-block">
                <div className="reading-block-title">终局落点：{result.positions.hour}（大白话拆解）</div>
                <p className="small" style={{ lineHeight: 1.7 }}>
                  <strong>整体画面：</strong>
                  {LIUREN_MEANINGS[result.positions.hour].meaning}
                </p>
                <p className="small secondary" style={{ lineHeight: 1.7 }}>
                  <strong>三步过程解读：</strong>
                  大环境/起头落在「{result.positions.month}」，中期发展卡在或经过「{result.positions.day}」，最终当下行动重点停在「
                  {result.positions.hour}」——也就是说，事情经过前面的铺垫与节奏过渡，眼下最核心的处理态度按「{result.positions.hour}」来拿捏最省心。
                </p>
                <p className="small secondary" style={{ lineHeight: 1.7 }}>
                  {LIUREN_MEANINGS[result.positions.hour].reflection}
                </p>
                <details className="disclosure" style={{ marginTop: 4 }}>
                  <summary>查看《小六壬》古口诀原话与白话翻译</summary>
                  <div className="page-stack" style={{ gap: '0.35rem', marginTop: 6 }}>
                    <p className="small secondary">古诀原话：“{LIUREN_MEANINGS[result.positions.hour].classicVerse}”</p>
                    <p className="small" style={{ lineHeight: 1.65 }}>
                      {LIUREN_MEANINGS[result.positions.hour].classicPlain}
                    </p>
                  </div>
                </details>
              </div>
            </div>
          ) : (
            <p className="small muted">选择时间后，页面会显示三步计算和传统象意。</p>
          )}

          <p className="field-hint">
            这是传统民俗体验，不是对事实或未来的验证，不应作为医疗、财务或其他重大决定的依据。规则参考{' '}
            <a href="https://www.chaosxy.com/guide/" target="_blank" rel="noreferrer">
              六宫顺数方法
            </a>
            。
          </p>
        </section>
      </div>
    </div>
  );
}
