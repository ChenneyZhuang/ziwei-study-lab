import { useId, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Compass,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { READING_TOPICS, getReading } from './reading';
import { explainPatternPlain } from './classic-plain';
import {
  BRANCH_NAMES,
  BRIGHT_LABEL,
  LEAP_LABEL,
  decadePatterns,
  lunarFormDate,
  patterns,
  shierShenForChart,
  solarFormLunar,
  type BirthForm,
  type ChartResult,
} from './core';
import { PROVINCES } from './vendor/ziwei/cities';
import { STEMS } from './vendor/ziwei/constants';
import type { Palace, SiHua, Star } from './vendor/ziwei/types';

const WORLD_CITIES = [
  { name: '悉尼', longitude: '151.21', offset: '10' },
  { name: '墨尔本', longitude: '144.96', offset: '10' },
  { name: '布里斯班', longitude: '153.03', offset: '10' },
  { name: '阿德莱德', longitude: '138.60', offset: '9.5' },
  { name: '珀斯', longitude: '115.86', offset: '8' },
  { name: '达尔文', longitude: '130.85', offset: '9.5' },
  { name: '奥克兰', longitude: '174.76', offset: '12' },
  { name: '新加坡', longitude: '103.82', offset: '8' },
  { name: '吉隆坡', longitude: '101.69', offset: '8' },
  { name: '东京', longitude: '139.69', offset: '9' },
  { name: '伦敦', longitude: '-0.13', offset: '0' },
  { name: '纽约', longitude: '-74.01', offset: '-5' },
  { name: '洛杉矶', longitude: '-118.24', offset: '-8' },
];

const TIME_HINTS: Array<[string, string]> = [
  ['00:30', '早子时 00:00–00:59'],
  ['02:00', '丑时 01:00–02:59'],
  ['04:00', '寅时 03:00–04:59'],
  ['06:00', '卯时 05:00–06:59'],
  ['08:00', '辰时 07:00–08:59'],
  ['10:00', '巳时 09:00–10:59'],
  ['12:00', '午时 11:00–12:59'],
  ['14:00', '未时 13:00–14:59'],
  ['16:00', '申时 15:00–16:59'],
  ['18:00', '酉时 17:00–18:59'],
  ['20:00', '戌时 19:00–20:59'],
  ['22:00', '亥时 21:00–22:59'],
  ['23:30', '晚子时 23:00–23:59'],
];

export function selectBirthCity(value: BirthForm, cityName: string): BirthForm {
  const domestic = PROVINCES.flatMap((p) =>
    p.cities.map((c) => ({
      longitude: String(c.longitude),
      offset: '8',
      key: `${p.name} / ${c.name}`,
    })),
  );
  const overseas = WORLD_CITIES.map((c) => ({
    ...c,
    key: `海外 / ${c.name}`,
  }));
  const city = [...domestic, ...overseas].find((c) => c.key === cityName);
  return {
    ...value,
    cityName,
    longitude: city ? city.longitude : value.longitude,
    standardOffset: city ? city.offset : value.standardOffset,
    actualOffset: cityName !== value.cityName ? '' : value.actualOffset,
  };
}

export function SectionHead({
  eyebrow,
  title,
  description,
  action,
  headingLevel = 1,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h1';
  return (
    <div className="section-head">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <Heading>{title}</Heading>
        <p className="lead-copy">{description}</p>
      </div>
      {action ? <div className="btn-row">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  onAction,
  action = '开始排盘',
}: {
  title: string;
  description: string;
  onAction: () => void;
  action?: string;
}) {
  return (
    <div className="card" style={{ textAlign: 'center', paddingBlock: '3rem' }}>
      <div
        className="brand-mark"
        style={{ width: 48, height: 48, marginInline: 'auto', marginBottom: '0.9rem' }}
        aria-hidden="true"
      >
        <Sparkles size={22} />
      </div>
      <h2 style={{ fontSize: '1.3rem', marginBottom: '0.45rem' }}>{title}</h2>
      <p className="secondary" style={{ maxWidth: '48ch', marginInline: 'auto', marginBottom: '1.25rem' }}>
        {description}
      </p>
      <button type="button" className="btn btn-primary" onClick={onAction}>
        {action}
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'good' | 'warn' | 'accent';
}) {
  return (
    <span className={`status-pill ${tone !== 'neutral' ? tone : ''}`}>
      <Check size={13} aria-hidden="true" />
      {children}
    </span>
  );
}

export function BirthEditor({
  value,
  onChange,
  onSubmit,
  compact = false,
  buttonText,
}: {
  value: BirthForm;
  onChange: (v: BirthForm) => void;
  onSubmit: () => void;
  compact?: boolean;
  buttonText?: string;
}) {
  const uid = useId();
  const [advanced, setAdvanced] = useState(false);

  const patch = (x: Partial<BirthForm>) => onChange({ ...value, ...x });
  const changeLunar = (x: Partial<BirthForm>) => {
    const next = { ...value, ...x, calendar: 'lunar' as const };
    onChange({ ...next, date: lunarFormDate(next) });
  };
  const switchCalendar = (calendar: 'solar' | 'lunar') => {
    if ((value.calendar || 'solar') === calendar) return;
    if (calendar === 'solar') {
      patch({ calendar });
      return;
    }
    const converted = solarFormLunar(value.date);
    onChange({
      ...value,
      calendar,
      ...(converted || { lunarYear: '', lunarMonth: '', lunarDay: '', lunarLeap: false }),
      date: converted ? value.date : '',
    });
  };

  const nameId = `${uid}-name`;
  const genderId = `${uid}-gender`;
  const solarDateId = `${uid}-solar-date`;
  const lunarYearId = `${uid}-lunar-year`;
  const lunarMonthId = `${uid}-lunar-month`;
  const lunarDayId = `${uid}-lunar-day`;
  const lunarHelpId = `${uid}-lunar-help`;
  const timeId = `${uid}-time`;
  const approxId = `${uid}-approx`;
  const cityId = `${uid}-city`;
  const lngId = `${uid}-lng`;
  const stdId = `${uid}-std`;
  const actId = `${uid}-act`;
  const solarHelpId = `${uid}-solar-help`;
  const lateId = `${uid}-late`;
  const leapId = `${uid}-leap`;
  const brightId = `${uid}-bright`;

  return (
    <form
      className={compact ? 'page-stack' : 'page-stack'}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="form-grid">
        <div className="form-field">
          <label className="form-label" htmlFor={nameId}>
            称呼 <span className="muted small">（可留空）</span>
          </label>
          <input
            id={nameId}
            className="input"
            value={value.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="例如：我的本命盘"
            maxLength={40}
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor={genderId}>
            排盘性别 <span className="muted small">（阴阳顺逆计算所需）</span>
          </label>
          <select
            id={genderId}
            className="select"
            value={value.gender}
            onChange={(e) => patch({ gender: e.target.value as BirthForm['gender'] })}
          >
            <option value="">请选择…</option>
            <option value="female">女</option>
            <option value="male">男</option>
          </select>
        </div>

        <fieldset className="fieldset-box" style={{ padding: '0.7rem 0.9rem' }}>
          <legend>出生日期历法</legend>
          <div className="segmented-group" role="group" aria-label="出生日期历法">
            <button
              type="button"
              className={`seg-btn ${(value.calendar || 'solar') === 'solar' ? 'active' : ''}`}
              aria-pressed={(value.calendar || 'solar') === 'solar'}
              onClick={() => switchCalendar('solar')}
            >
              公历
            </button>
            <button
              type="button"
              className={`seg-btn ${value.calendar === 'lunar' ? 'active' : ''}`}
              aria-pressed={value.calendar === 'lunar'}
              onClick={() => switchCalendar('lunar')}
            >
              农历
            </button>
          </div>
        </fieldset>

        {value.calendar === 'lunar' ? (
          <div className="fieldset-box" style={{ gridColumn: '1 / -1' }}>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label" htmlFor={lunarYearId}>
                  农历年份
                </label>
                <input
                  id={lunarYearId}
                  aria-label="农历年份"
                  aria-describedby={lunarHelpId}
                  className="input"
                  type="number"
                  min="1900"
                  max="2050"
                  value={value.lunarYear || ''}
                  onChange={(e) => changeLunar({ lunarYear: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor={lunarMonthId}>
                  农历月份
                </label>
                <input
                  id={lunarMonthId}
                  aria-label="农历月份"
                  aria-describedby={lunarHelpId}
                  className="input"
                  type="number"
                  min="1"
                  max="12"
                  value={value.lunarMonth || ''}
                  onChange={(e) => changeLunar({ lunarMonth: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor={lunarDayId}>
                  农历日期
                </label>
                <input
                  id={lunarDayId}
                  aria-label="农历日期"
                  aria-describedby={lunarHelpId}
                  className="input"
                  type="number"
                  min="1"
                  max="30"
                  value={value.lunarDay || ''}
                  onChange={(e) => changeLunar({ lunarDay: e.target.value })}
                  required
                />
              </div>
            </div>
            <label className="checkbox-row" style={{ marginTop: '0.45rem' }}>
              <input
                type="checkbox"
                checked={Boolean(value.lunarLeap)}
                onChange={(e) => changeLunar({ lunarLeap: e.target.checked })}
              />
              <span>这是闰月</span>
            </label>
            <p id={lunarHelpId} className="field-hint" aria-live="polite">
              {value.date
                ? `对应公历 ${value.date}`
                : '请输入真实存在的农历日期；闰月需与当年历法一致，换算后的公历须在 1900—2050 年内。'}
            </p>
          </div>
        ) : (
          <div className="form-field">
            <label className="form-label" htmlFor={solarDateId}>
              出生日期 <span className="muted small">（公历）</span>
            </label>
            <input
              id={solarDateId}
              className="input"
              type="date"
              min="1900-01-01"
              max="2050-12-31"
              value={value.date}
              onChange={(e) => patch({ date: e.target.value })}
              required
            />
          </div>
        )}

        <div className="form-field">
          <label className="form-label" htmlFor={timeId}>
            出生时间 <span className="muted small">（出生地钟表时间）</span>
          </label>
          <input
            id={timeId}
            className="input"
            type="time"
            value={value.time}
            onChange={(e) => patch({ time: e.target.value, timeApprox: false })}
            disabled={value.unknownTime}
            required={!value.unknownTime}
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor={approxId}>
            按时辰选择 <span className="muted small">（仅知时段时使用）</span>
          </label>
          <select
            id={approxId}
            className="select"
            value={value.timeApprox ? value.time : ''}
            disabled={value.unknownTime}
            onChange={(e) => patch({ time: e.target.value, timeApprox: Boolean(e.target.value) })}
          >
            <option value="">直接输入具体时间</option>
            {TIME_HINTS.map(([time, label]) => (
              <option key={time} value={time}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {value.timeApprox ? (
        <div className="info-banner" role="status">
          已填入该时段的代表时刻，具体分钟尚未核实；真太阳时修正可能跨越时辰边界，可用候选时辰对照。
        </div>
      ) : null}

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={value.unknownTime}
          onChange={(e) => patch({ unknownTime: e.target.checked })}
        />
        <span>出生时间不确定，查看多个候选时辰</span>
        <CircleHelp size={15} className="muted" aria-hidden="true" />
      </label>

      <fieldset className="fieldset-box">
        <legend>
          <MapPin size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} aria-hidden="true" />
          时间计算方式
        </legend>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <p className="field-hint">若选真太阳时，请填写出生地经度与出生当年的标准/实际时区。</p>
          <div className="segmented-group" role="group" aria-label="时间计算方式">
            <button
              type="button"
              className={`seg-btn ${value.correction === 'clock' ? 'active' : ''}`}
              aria-pressed={value.correction === 'clock'}
              onClick={() => patch({ correction: 'clock' })}
            >
              钟表时间
            </button>
            <button
              type="button"
              className={`seg-btn ${value.correction === 'solar' ? 'active' : ''}`}
              aria-pressed={value.correction === 'solar'}
              onClick={() => patch({ correction: 'solar' })}
            >
              真太阳时
            </button>
          </div>
        </div>

        {value.correction === 'solar' ? (
          <div style={{ marginTop: '1rem', display: 'grid', gap: '0.85rem' }}>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label" htmlFor={cityId}>
                  出生城市参考 <span className="muted small">（可选）</span>
                </label>
                <select
                  id={cityId}
                  className="select"
                  value={value.cityName || ''}
                  onChange={(e) => onChange(selectBirthCity(value, e.target.value))}
                >
                  <option value="">选择城市填入参考经度…</option>
                  <optgroup label="海外常见城市（市中心近似值）">
                    {WORLD_CITIES.map((city) => (
                      <option key={city.name} value={`海外 / ${city.name}`}>
                        {city.name} · {city.longitude}°
                      </option>
                    ))}
                  </optgroup>
                  {PROVINCES.map((province) => (
                    <optgroup key={province.name} label={province.name}>
                      {province.cities.map((city, i) => (
                        <option key={`${city.name}-${i}`} value={`${province.name} / ${city.name}`}>
                          {city.name} · {city.longitude}°E
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor={lngId}>
                  出生地经度 <span className="muted small">（东正西负）</span>
                </label>
                <input
                  id={lngId}
                  aria-describedby={solarHelpId}
                  className="input"
                  type="number"
                  min="-180"
                  max="180"
                  step="0.01"
                  placeholder="例如 121.50"
                  value={value.longitude}
                  onChange={(e) => patch({ longitude: e.target.value, cityName: '' })}
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor={stdId}>
                  标准时区 <span className="muted small">（UTC 小时）</span>
                </label>
                <input
                  id={stdId}
                  aria-describedby={solarHelpId}
                  className="input"
                  type="number"
                  min="-12"
                  max="14"
                  step="0.25"
                  placeholder="例如 8"
                  value={value.standardOffset}
                  onChange={(e) => patch({ standardOffset: e.target.value, actualOffset: '' })}
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor={actId}>
                  出生时实际时区 <span className="muted small">（UTC 小时）</span>
                </label>
                <input
                  id={actId}
                  aria-describedby={solarHelpId}
                  className="input"
                  type="number"
                  min="-12"
                  max="14"
                  step="0.25"
                  placeholder="需按出生时核对"
                  value={value.actualOffset}
                  onChange={(e) => patch({ actualOffset: e.target.value })}
                />
              </div>
            </div>
            <p id={solarHelpId} className="field-hint">
              <Clock3 size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} aria-hidden="true" />
              城市经度和标准时区是参考值；更换城市或标准时区后，请重新核对并填写出生时实际时区。实际偏移与标准偏移不同时，系统先换算为标准时间。
            </p>
          </div>
        ) : null}
      </fieldset>

      <div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setAdvanced(!advanced)}
          aria-expanded={advanced}
        >
          排盘口径设置
          <ChevronDown
            size={15}
            aria-hidden="true"
            style={{
              transform: advanced ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s ease',
            }}
          />
        </button>

        {advanced ? (
          <div className="card-subtle" style={{ marginTop: '0.65rem', display: 'grid', gap: '0.85rem' }}>
            <p className="field-hint">
              这里可切换晚子时、闰月与亮度表。天马、天空、截空、魁钺等其他安星流派目前沿用开源默认口径，不能逐项切换。
            </p>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label" htmlFor={lateId}>
                  晚子时换日
                </label>
                <select
                  id={lateId}
                  className="select"
                  value={value.late}
                  onChange={(e) => patch({ late: e.target.value as BirthForm['late'] })}
                >
                  <option value="next-day">23:00 后按次日</option>
                  <option value="current-day">按当日</option>
                </select>
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor={leapId}>
                  闰月规则
                </label>
                <select
                  id={leapId}
                  className="select"
                  value={value.leap}
                  onChange={(e) => patch({ leap: e.target.value as BirthForm['leap'] })}
                >
                  {Object.entries(LEAP_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor={brightId}>
                  星曜亮度表
                </label>
                <select
                  id={brightId}
                  className="select"
                  value={value.brightness}
                  onChange={(e) => patch({ brightness: e.target.value as BirthForm['brightness'] })}
                >
                  {Object.entries(BRIGHT_LABEL)
                    .filter(([k]) => k !== 'default')
                    .map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="btn-row">
        <button className="btn btn-primary" type="submit">
          {buttonText || (value.unknownTime ? '查看候选时辰' : '生成我的命盘')}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
        <span className="field-hint">你的输入只在当前浏览器中计算；只有主动保存时才会写入本机浏览器。</span>
      </div>
    </form>
  );
}

/* ── Celestial 4x4 Grid & 三方四正 Geometry Coordinates ── */

const PALACE_POS: Record<number, { col: number; row: number }> = {
  5: { col: 1, row: 1 }, // 巳
  6: { col: 2, row: 1 }, // 午
  7: { col: 3, row: 1 }, // 未
  8: { col: 4, row: 1 }, // 申
  9: { col: 4, row: 2 }, // 酉
  10: { col: 4, row: 3 }, // 戌
  11: { col: 4, row: 4 }, // 亥
  0: { col: 3, row: 4 }, // 子
  1: { col: 2, row: 4 }, // 丑
  2: { col: 1, row: 4 }, // 寅
  3: { col: 1, row: 3 }, // 卯
  4: { col: 1, row: 2 }, // 辰
};

// Anchors along the 2x2 central courtyard boundary (viewBox 0..200 x 0..200)
const COURTYARD_SVG_POS: Record<number, { x: number; y: number }> = {
  5: { x: 2, y: 2 },
  6: { x: 67, y: 2 },
  7: { x: 133, y: 2 },
  8: { x: 198, y: 2 },
  9: { x: 198, y: 67 },
  10: { x: 198, y: 133 },
  11: { x: 198, y: 198 },
  0: { x: 133, y: 198 },
  1: { x: 67, y: 198 },
  2: { x: 2, y: 198 },
  3: { x: 2, y: 133 },
  4: { x: 2, y: 67 },
};

const DISPLAY_BRANCH_ORDER = [5, 6, 7, 8, 4, 9, 3, 10, 2, 1, 0, 11];

const SIHUA_META: Record<SiHua, { cls: string; mark: string }> = {
  禄: { cls: 'hua-lu', mark: '●' },
  权: { cls: 'hua-quan', mark: '◆' },
  科: { cls: 'hua-ke', mark: '✦' },
  忌: { cls: 'hua-ji', mark: '▲' },
};

function SiHuaBadge({ hua, prefix, isFlow = false }: { hua: SiHua; prefix: string; isFlow?: boolean }) {
  const meta = SIHUA_META[hua];
  return (
    <span className={`sihua-badge ${meta.cls} ${isFlow ? 'is-flow' : ''}`}>
      <span aria-hidden="true">{meta.mark}</span>
      {prefix}
      {hua}
    </span>
  );
}

function brightnessClass(raw?: string): string {
  if (raw === '庙' || raw === '旺') return 'is-strong';
  if (raw === '陷' || raw === '不') return 'is-dim';
  return '';
}

export function ChartBoard({
  result,
  selected,
  onSelect,
  overlay = {},
  overlayLabel = '',
  highlightBranch,
  flowNames,
  flowLabel,
}: {
  result: ChartResult;
  selected: number | null;
  onSelect: (branch: number) => void;
  overlay?: Record<string, string>;
  overlayLabel?: string;
  highlightBranch?: number;
  flowNames?: Record<number, string>;
  flowLabel?: string;
}) {
  const c = result.chart;
  const focusBranch = selected ?? highlightBranch ?? c.mingGongBranch;
  const oppBranch = (focusBranch + 6) % 12;
  const triBranchA = (focusBranch + 4) % 12;
  const triBranchB = (focusBranch + 8) % 12;

  const shierShen = shierShenForChart(result, highlightBranch);

  const ptFocus = COURTYARD_SVG_POS[focusBranch];
  const ptOpp = COURTYARD_SVG_POS[oppBranch];
  const ptTriA = COURTYARD_SVG_POS[triBranchA];
  const ptTriB = COURTYARD_SVG_POS[triBranchB];

  // Build courtyard Four Transformations strip (show active flow if present, else natal)
  const natalSihuaList: Array<{ hua: SiHua; star: string }> = (['禄', '权', '科', '忌'] as SiHua[]).map((hua) => {
    const found = c.palaces.flatMap((p) => p.stars).find((s) => s.siHua === hua);
    return { hua, star: found?.name || '—' };
  });

  const overlayEntries = Object.entries(overlay);

  return (
    <div className="chart-scroll-shell">
      <div className="chart-grid" aria-label="紫微斗数十二宫命盘">
        {/* Central 2x2 Courtyard */}
        <div className="chart-center">
          <svg
            className="courtyard-svg"
            viewBox="0 0 200 200"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {/* Outer subtle circle */}
            <circle cx="100" cy="100" r="68" fill="none" stroke="var(--border-subtle)" strokeWidth="0.7" strokeDasharray="3 3" />
            {/* 三合 triangle */}
            <polygon
              points={`${ptFocus.x},${ptFocus.y} ${ptTriA.x},${ptTriA.y} ${ptTriB.x},${ptTriB.y}`}
              fill="var(--indigo-soft)"
              fillOpacity="0.28"
              stroke="var(--indigo)"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
            {/* 对宫 sightline */}
            <line
              x1={ptFocus.x}
              y1={ptFocus.y}
              x2={ptOpp.x}
              y2={ptOpp.y}
              stroke="var(--seal)"
              strokeWidth="1.4"
            />
            {/* Focus & Opposite rays */}
            <circle cx={ptFocus.x} cy={ptFocus.y} r="3.4" fill="var(--accent)" />
            <circle cx={ptOpp.x} cy={ptOpp.y} r="3" fill="var(--seal)" />
            <circle cx={ptTriA.x} cy={ptTriA.y} r="2.6" fill="var(--indigo)" />
            <circle cx={ptTriB.x} cy={ptTriB.y} r="2.6" fill="var(--indigo)" />
          </svg>

          <div className="courtyard-content">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                <div className="eyebrow" style={{ marginBottom: 0 }}>
                  <Compass size={12} aria-hidden="true" /> THE CELESTIAL MAP
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', justifyContent: 'flex-end' }}>
                  <span className="meta-pill accent">{c.wuxingJuName}</span>
                  <span className="meta-pill">{c.yinYangGender}</span>
                </div>
              </div>
              <strong style={{ fontSize: '1.12rem', fontFamily: 'var(--font-serif)', lineHeight: 1.25 }}>
                {result.form.name || '命盘主视图'}
              </strong>
            </div>

            <div style={{ display: 'grid', gap: '0.25rem', fontSize: '0.82rem' }}>
              <div>
                公历口径 <span className="mono">{result.effectiveDate}</span> ·{' '}
                <strong>{BRANCH_NAMES[result.branch]}时</strong>
              </div>
              <div className="secondary">
                农历 {c.lunarInfo.lunarYear}年{c.lunarInfo.isLeapMonth ? '闰' : ''}
                {c.lunarInfo.lunarMonth}月{c.lunarInfo.lunarDay}日 · 命主{' '}
                <strong>{c.mingZhu || '—'}</strong> · 身主 <strong>{c.shenZhu || '—'}</strong>
              </div>
            </div>

            <div>
              <div className="small muted" style={{ marginBottom: '0.3rem', fontWeight: 600 }}>
                {overlayLabel && overlayEntries.length > 0
                  ? `${overlayLabel}四化（虚框）与本命四化`
                  : '本命生年四化'}
              </div>
              <div className="courtyard-sihua-strip">
                {natalSihuaList.map(({ hua, star }) => {
                  const flowStar = overlayEntries.find(([, h]) => h === hua)?.[0];
                  return (
                    <div key={hua} className="courtyard-sihua-card">
                      <SiHuaBadge hua={hua} prefix="本" />
                      <div style={{ fontWeight: 700, marginTop: 2 }}>{star}</div>
                      {flowStar ? (
                        <div className="small" style={{ color: 'var(--accent-strong)', marginTop: 1 }}>
                          {overlayLabel}：{flowStar}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 12 Palaces placed strictly around perimeter */}
        {DISPLAY_BRANCH_ORDER.map((b) => {
          const p = c.palaces.find((x) => x.branch === b);
          const pos = PALACE_POS[b];
          if (!p) return null;

          const isSelected = selected === b;
          const isFocused = focusBranch === b;
          const isOpp = b === oppBranch;
          const isTri = b === triBranchA || b === triBranchB;

          const majors = p.stars.filter((s) => s.type === 'major');
          const others = p.stars.filter((s) => s.type !== 'major');
          const shen = shierShen[b];

          const cellClasses = [
            'palace-cell',
            p.isMingGong ? 'is-ming' : '',
            isSelected ? 'is-selected' : '',
            !isSelected && isOpp ? 'is-opposite' : '',
            !isSelected && isTri ? 'is-sanhe' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              type="button"
              key={b}
              style={{ gridColumn: pos.col, gridRow: pos.row }}
              aria-pressed={isSelected}
              className={cellClasses}
              onClick={() => onSelect(b)}
            >
              <div>
                <div className="palace-top">
                  <div className="palace-name-group">
                    <span className="palace-name">
                      {p.name.endsWith('宫') ? p.name : `${p.name}宫`}
                    </span>
                    {p.isShenGong ? <span className="palace-badge shen">身</span> : null}
                    {isFocused && selected !== null ? (
                      <span className="palace-badge rel-self">本位</span>
                    ) : isOpp ? (
                      <span className="palace-badge rel-opp">对冲</span>
                    ) : isTri ? (
                      <span className="palace-badge rel-tri">三合</span>
                    ) : null}
                  </div>
                  <span className="palace-branch">
                    {STEMS[p.stem]}
                    {BRANCH_NAMES[b]}
                  </span>
                </div>

                {flowNames?.[b] ? (
                  <div className="small" style={{ color: 'var(--accent-strong)', fontWeight: 700, marginTop: '0.2rem' }}>
                    {flowLabel} {flowNames[b]}
                  </div>
                ) : highlightBranch === b && (flowLabel === '小限' || flowLabel === '大限' || flowLabel === '宫干飞星') ? (
                  <div className="small" style={{ color: 'var(--accent-strong)', fontWeight: 700, marginTop: '0.2rem' }}>
                    {flowLabel === '宫干飞星' ? '飞星起点' : flowLabel}
                  </div>
                ) : null}

                <div className="palace-stars" style={{ marginTop: '0.32rem' }}>
                  <div className="major-star-list">
                    {majors.length > 0 ? (
                      majors.map((s) => {
                        const flowHua = overlay[s.name] as SiHua | undefined;
                        return (
                          <span key={s.name} className="major-star-chip">
                            <span>{s.name}</span>
                            {s.brightnessRaw ? (
                              <span className={`star-bright ${brightnessClass(s.brightnessRaw)}`}>
                                {s.brightnessRaw}
                              </span>
                            ) : null}
                            {s.siHua ? <SiHuaBadge hua={s.siHua} prefix="本" /> : null}
                            {flowHua ? <SiHuaBadge hua={flowHua} prefix={overlayLabel} isFlow /> : null}
                          </span>
                        );
                      })
                    ) : (
                      <span className="muted small">无主星（可借对宫）</span>
                    )}
                  </div>

                  {others.length > 0 ? (
                    <div className="aux-star-list">
                      {others.map((s) => {
                        const flowHua = overlay[s.name] as SiHua | undefined;
                        const kindClass = s.type === 'lucky' ? 'is-lucky' : s.type === 'sha' ? 'is-sha' : '';
                        return (
                          <span key={s.name} className={`aux-tag ${kindClass}`}>
                            {s.name}
                            {s.brightnessRaw ? <small>({s.brightnessRaw})</small> : null}
                            {s.siHua ? <SiHuaBadge hua={s.siHua} prefix="本" /> : null}
                            {flowHua ? <SiHuaBadge hua={flowHua} prefix={overlayLabel} isFlow /> : null}
                          </span>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="palace-foot">
                <div className="shen-mini">
                  {shen ? (
                    <>
                      <span>{shen.boshi}</span>
                      <span>·{shen.suiqian}</span>
                      <span>·{shen.jiangqian}</span>
                    </>
                  ) : null}
                </div>
                <span className="mono" style={{ whiteSpace: 'nowrap' }}>
                  {p.daXianAge ? `${p.daXianAge[0]}–${p.daXianAge[1]}岁` : ''}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PalaceDetail({
  result,
  branch,
  overlay = {},
  overlayLabel = '',
}: {
  result: ChartResult;
  branch: number | null;
  overlay?: Record<string, string>;
  overlayLabel?: string;
}) {
  const targetBranch = branch ?? result.chart.mingGongBranch;
  const p = result.chart.palaces.find((x) => x.branch === targetBranch);
  if (!p) return null;

  const shier = shierShenForChart(result)[p.branch];
  const report = (() => {
    try {
      return { found: patterns(result), failed: false };
    } catch {
      return { found: [], failed: true };
    }
  })();
  const { found } = report;

  const zaHits = (() => {
    try {
      return decadePatterns(result, result.chart.currentAge);
    } catch {
      return [];
    }
  })();

  const formatStar = (s: Star) =>
    `${s.name}${s.brightnessRaw ? `（${s.brightnessRaw}）` : ''}${s.siHua ? ` 本命化${s.siHua}` : ''}${
      overlay[s.name] ? ` ${overlayLabel}化${overlay[s.name]}` : ''
    }`;

  const majors = p.stars.filter((s) => s.type === 'major');
  const luckys = p.stars.filter((s) => s.type === 'lucky');
  const shas = p.stars.filter((s) => s.type === 'sha');
  const minors = p.stars.filter((s) => s.type === 'minor');
  const topicForPalace = READING_TOPICS.find(
    (t) => t.id !== 'overview' && t.palace.replace('宫', '') === p.name.replace('宫', ''),
  );
  const palaceReading = topicForPalace ? getReading(result, topicForPalace) : null;

  return (
    <div className="card page-stack" id="palace-detail" tabIndex={-1}>
      <div className="section-head">
        <div>
          <div className="eyebrow">PALACE DETAIL · 宫位与格局详解</div>
          <h2 style={{ fontSize: '1.3rem' }}>
            {p.name.endsWith('宫') ? p.name : `${p.name}宫`}
            <span className="muted mono" style={{ fontWeight: 500, fontSize: '1rem', marginLeft: 8 }}>
              {STEMS[p.stem]}
              {BRANCH_NAMES[p.branch]}
            </span>
          </h2>
        </div>
        <div className="btn-row">
          {p.isMingGong ? <span className="meta-pill accent">本命宫</span> : null}
          {p.isShenGong ? <span className="meta-pill">身宫</span> : null}
          <span className="meta-pill mono">
            {p.daXianAge ? `大限 ${p.daXianAge[0]}–${p.daXianAge[1]} 岁` : '—'}
          </span>
        </div>
      </div>

      <p className="field-hint">点击命盘中的任一宫位，高亮其三方四正并查看宫内星曜、十二神与全书格局匹配。</p>

      <div className="split-grid-2">
        <div className="card-subtle" style={{ display: 'grid', gap: '0.5rem' }}>
          <div>
            <span className="small muted">主星</span>
            <div style={{ fontWeight: 700, marginTop: 2 }}>
              {majors.length > 0 ? majors.map(formatStar).join('、') : '无主星'}
            </div>
          </div>
          <div>
            <span className="small muted">空宫参考</span>
            <div style={{ fontWeight: 600, marginTop: 2 }}>
              {p.isEmpty ? `借对宫 ${p.borrowedFromName || ''}：${p.borrowedStars?.join('、') || '—'}` : '本宫有主星'}
            </div>
          </div>
          <div>
            <span className="small muted">十二神（博士 / 岁前 / 将前）</span>
            <div style={{ fontWeight: 600, marginTop: 2 }}>
              {shier ? `${shier.boshi} · ${shier.suiqian} · ${shier.jiangqian}` : '—'}
            </div>
          </div>
        </div>

        <div className="card-subtle" style={{ display: 'grid', gap: '0.5rem' }}>
          <div>
            <span className="small muted">六吉辅佐</span>
            <div style={{ fontWeight: 600, color: luckys.length ? 'var(--jade)' : undefined, marginTop: 2 }}>
              {luckys.length > 0 ? luckys.map(formatStar).join('、') : '—'}
            </div>
          </div>
          <div>
            <span className="small muted">六煞警示</span>
            <div style={{ fontWeight: 600, color: shas.length ? 'var(--seal)' : undefined, marginTop: 2 }}>
              {shas.length > 0 ? shas.map(formatStar).join('、') : '—'}
            </div>
          </div>
          <div>
            <span className="small muted">其他杂曜星神</span>
            <div className="small" style={{ marginTop: 2 }}>
              {minors.length > 0 ? minors.map(formatStar).join('、') : '—'}
            </div>
          </div>
        </div>
      </div>

      {p.selfSihua && p.selfSihua.length > 0 ? (
        <div className="info-banner">
          <strong>宫干自化标记（供三合之外飞星对照）：</strong>
          {p.selfSihua.map((m) => `${m.starName}（自化${m.siHua}）`).join('；')}
          ——白话来说，自化代表你在这个宫位的事情上容易主动向外散出情绪、资源或反复自己跟自己较劲（自化禄偏大方输出、自化权想自己抓牢、自化科重体面、自化忌易内耗留不住）。
        </div>
      ) : null}

      {palaceReading ? (
        <div className="reading-block">
          <div className="reading-block-title">人话直译 · {palaceReading.topic.label}</div>
          <p className="small" style={{ fontWeight: 700, fontSize: '0.96rem' }}>
            {palaceReading.plainTitle}
          </p>
          <p className="small" style={{ lineHeight: 1.75 }}>
            {palaceReading.plainSummary}
          </p>
          {palaceReading.concreteScenes.map((scene, idx) => (
            <div key={idx} className="card-subtle" style={{ padding: '0.5rem 0.7rem' }}>
              <p className="small" style={{ lineHeight: 1.65 }}>
                {scene}
              </p>
            </div>
          ))}
          <p className="small secondary" style={{ lineHeight: 1.65 }}>
            <strong>三方关联：</strong>
            {palaceReading.sanfangPlainNote}
          </p>
          {palaceReading.auxPlainHighlights.length > 0 ? (
            <div className="page-stack" style={{ gap: '0.25rem' }}>
              {palaceReading.auxPlainHighlights.map((item, idx) => (
                <p key={idx} className="small muted" style={{ lineHeight: 1.6 }}>
                  • {item}
                </p>
              ))}
            </div>
          ) : null}
          <p
            className="small"
            style={{
              lineHeight: 1.7,
              fontWeight: 600,
              color: 'var(--accent-strong)',
              padding: '0.55rem 0.75rem',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              borderInlineStart: '3px solid var(--accent-strong)',
            }}
          >
            实用建议：{palaceReading.plainAdvice}
          </p>
          <details className="disclosure" style={{ marginTop: 2 }}>
            <summary>查看具体星曜推演与十二神详情</summary>
            <div className="page-stack" style={{ gap: '0.45rem', marginTop: 6 }}>
              <p className="small" style={{ fontWeight: 600 }}>
                {palaceReading.headline}
              </p>
              {palaceReading.comboNote ? (
                <p className="small secondary" style={{ lineHeight: 1.65 }}>
                  <strong>结构合参：</strong>
                  {palaceReading.comboNote}
                </p>
              ) : null}
              {palaceReading.interpretation.map((line, idx) => (
                <p key={idx} className="small secondary" style={{ lineHeight: 1.68 }}>
                  {line}
                </p>
              ))}
              {palaceReading.transformations.map((line, idx) => (
                <p key={`t-${idx}`} className="small secondary" style={{ lineHeight: 1.68 }}>
                  {line}
                </p>
              ))}
              {palaceReading.auxNote.split('\n').map((line, idx) => (
                <p key={`a-${idx}`} className="small muted" style={{ lineHeight: 1.65 }}>
                  {line}
                </p>
              ))}
            </div>
          </details>
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem' }}>规则库格局匹配</strong>
          <span className="meta-pill accent">{report.failed ? '—' : `${found.length} 项`}</span>
        </div>

        {report.failed ? (
          <div className="field-error">规则计算暂不可用，请重新生成命盘后再试。</div>
        ) : found.length > 0 ? (
          <div className="pattern-list">
            {found.map((x, i) => (
              <div
                key={`${x.name}-${i}`}
                className={`pattern-card ${
                  x.level === 'caution' ? 'is-caution' : x.level === 'excellent' || x.level === 'good' ? 'is-good' : ''
                }`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <strong>{x.name}</strong>
                  <span className="small muted">{x.source || '开源格局规则'}</span>
                </div>
                {x.conditions?.breaking?.length ? (
                  <p className="small" style={{ color: 'var(--seal)', marginTop: 4 }}>
                    规则提示：{x.conditions.breaking.join('；')}
                  </p>
                ) : null}
                <p className="secondary small" style={{ marginTop: 4 }}>
                  传统规则描述：{x.description}
                </p>
                <p className="small" style={{ marginTop: 4, color: 'var(--text)', lineHeight: 1.65 }}>
                  <strong>大白话解释：</strong>
                  {explainPatternPlain(x.name, x.description)}
                </p>
                {x.conditions?.required?.length ? (
                  <p className="small muted" style={{ marginTop: 3 }}>
                    已匹配条件：{x.conditions.required.join('；')}
                  </p>
                ) : null}
                {x.conditions?.bonus?.length ? (
                  <p className="small" style={{ color: 'var(--jade)', marginTop: 3 }}>
                    附加条件：{x.conditions.bonus.join('；')}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="muted small">当前严格格局规则未识别到成格条目。</p>
        )}

        {zaHits.length > 0 ? (
          <div style={{ marginTop: '0.5rem' }}>
            <div className="small" style={{ fontWeight: 700, marginBottom: '0.45rem', color: 'var(--accent-strong)' }}>
              当前虚岁（{result.chart.currentAge} 岁）运限〈定杂局〉对照
            </div>
            <div className="pattern-list">
              {zaHits.map((hit) => (
                <div key={`${hit.no}-${hit.startAge}-${hit.palaceBranch}`} className="pattern-card">
                  <strong>
                    {hit.name}（{hit.unit} {hit.startAge}–{hit.endAge} 岁 · {hit.palaceName || '对应宫位'}）
                  </strong>
                  <p className="small secondary" style={{ marginTop: 3 }}>
                    {hit.note}
                    {hit.detail ? `（${hit.detail}）` : ''}
                  </p>
                  <p className="small" style={{ marginTop: 4, color: 'var(--text)', lineHeight: 1.65 }}>
                    <strong>大白话解释：</strong>
                    {explainPatternPlain(hit.name, hit.detail || '', hit.note)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <p className="field-hint">
          格局为上游《紫微斗数全书》四表严格格判及古典规则结果，出处标注供学习索引，不一定仅针对当前点击的单个宫位。
        </p>
      </div>
    </div>
  );
}
