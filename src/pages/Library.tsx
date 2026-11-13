import { useEffect, useId, useMemo, useState } from 'react';
import { ArrowUpRight, BookOpen, ScrollText, Search } from 'lucide-react';
import { SectionHead } from '../components';
import { explainClassicExcerpt } from '../classic-plain';

type Tianji = {
  book: string;
  h2: string;
  h3: string;
  quote: string;
  t_hms: string;
  bvid: string;
  part: number;
  note: string;
};
type Passage = { volume: string; section: string; anchor: string; text: string };
const CLASSIC_URL =
  'https://zh.wikisource.org/zh-hans/%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B8%E5%85%A8%E6%9B%B8/%E5%85%A8%E8%A6%BD';
const sec = (s: string) => s.split(':').reduce((a, b) => a * 60 + Number(b), 0);

export default function Library() {
  const searchId = useId();
  const [query, setQuery] = useState('紫微');
  const [source, setSource] = useState<'classics' | 'tianji'>('classics');
  const [entries, setEntries] = useState<Tianji[]>([]);
  const [passages, setPassages] = useState<Passage[]>([]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setLoadError(false);
    const url = source === 'tianji' ? '/data/tianji.json' : '/data/quanshu-wikisource.json';
    if ((source === 'tianji' && entries.length) || (source === 'classics' && passages.length)) return;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((data) => (source === 'tianji' ? setEntries(data) : setPassages(data)))
      .catch(() => setLoadError(true));
  }, [source, entries.length, passages.length]);

  const hits = useMemo(
    () => (query.trim() ? passages.filter((x) => `${x.text}${x.section}`.includes(query.trim())).slice(0, 80) : []),
    [query, passages],
  );
  const teacher = useMemo(
    () =>
      query.trim() ? entries.filter((x) => `${x.quote}${x.h2}${x.h3}`.includes(query.trim())).slice(0, 80) : [],
    [query, entries],
  );

  return (
    <div className="page-stack">
      <SectionHead
        eyebrow="THE LIBRARY"
        title="资料与典籍"
        description="从原文开始，找到值得继续追问的线索。"
      />

      <div className="card page-stack" style={{ gap: '1rem' }}>
        <div>
          <span className="eyebrow">READ · TRACE · LEARN</span>
          <h2 style={{ fontSize: '1.3rem', marginBottom: 4 }}>让每一种说法都能找到出处。</h2>
          <p className="secondary small">
            检索维基文库《紫微斗数全书》与开源仓库《天纪》语料，回到原始页面或视频核对上下文。
          </p>
        </div>

        <div className="btn-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="segmented-group" role="group" aria-label="切换文献来源">
            <button
              type="button"
              className={`seg-btn ${source === 'classics' ? 'active' : ''}`}
              aria-pressed={source === 'classics'}
              onClick={() => setSource('classics')}
            >
              <BookOpen size={15} style={{ verticalAlign: '-2px', marginRight: 5 }} aria-hidden="true" />
              维基文库《全书》
            </button>
            <button
              type="button"
              className={`seg-btn ${source === 'tianji' ? 'active' : ''}`}
              aria-pressed={source === 'tianji'}
              onClick={() => setSource('tianji')}
            >
              <ScrollText size={15} style={{ verticalAlign: '-2px', marginRight: 5 }} aria-hidden="true" />
              《天纪》语料
            </button>
          </div>

          <search style={{ flex: '1 1 260px', maxWidth: 420 }}>
            <label htmlFor={searchId} className="visually-hidden">
              搜索星曜、宫位或关键词
            </label>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                aria-hidden="true"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }}
              />
              <input
                id={searchId}
                type="search"
                className="input"
                style={{ paddingLeft: 36 }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索星曜、宫位或关键词"
              />
            </div>
          </search>
        </div>
      </div>

      {source === 'classics' ? (
        <>
          <div className="btn-row" style={{ justifyContent: 'space-between' }}>
            <span className="small secondary">
              {passages.length
                ? `搜索“${query || '…'}” · ${hits.length} 条结果${hits.length === 80 ? '（最多显示 80 条）' : ''}`
                : '正在读取典籍…'}
            </span>
            <span className="small muted">维基文库简体显示版本 · 共 {passages.length} 条片段</span>
          </div>
          <div className="split-grid-2">
            {hits.map((h, i) => {
              const decoded = explainClassicExcerpt(h.text, h.section, 'quanshu');
              return (
                <article className="card page-stack" style={{ gap: '0.6rem' }} key={`${h.anchor}-${i}`}>
                  <div className="eyebrow" style={{ marginBottom: 0 }}>
                    <BookOpen size={13} aria-hidden="true" /> {h.volume}
                  </div>
                  <h3 style={{ fontSize: '1.08rem' }}>{h.section}</h3>
                  <p className="small secondary">{h.text}</p>
                  <div className="reading-block">
                    <div className="reading-block-title">白话解释</div>
                    <p className="small" style={{ lineHeight: 1.7 }}>
                      {decoded.plain}
                    </p>
                    {decoded.terms.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                        {decoded.terms.map((t) => (
                          <span key={t.term} className="meta-pill" style={{ whiteSpace: 'normal', lineHeight: 1.45 }}>
                            <strong>{t.term}</strong>：{t.gloss}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <span className="small muted">《紫微斗数全书》</span>
                  <a href={`${CLASSIC_URL}#${encodeURIComponent(h.anchor)}`} target="_blank" rel="noreferrer" className="small">
                    核对原文 <ArrowUpRight size={13} aria-hidden="true" />
                  </a>
                </div>
                </article>
              );
            })}
          </div>
          {passages.length > 0 && !hits.length ? (
            <div className="card-subtle small">没有找到相关段落。试试“紫微”“天机”或“命宫”。</div>
          ) : null}
        </>
      ) : (
        <>
          <div className="btn-row" style={{ justifyContent: 'space-between' }}>
            <span className="small secondary">
              {entries.length
                ? `搜索“${query || '…'}” · ${teacher.length} 条结果${teacher.length === 80 ? '（最多显示 80 条）' : ''}`
                : '正在读取语料…'}
            </span>
            <span className="small muted">仅供非商业学习 · CC BY-NC-SA 4.0</span>
          </div>
          <div className="split-grid-2">
            {teacher.map((item, i) => {
              const decoded = explainClassicExcerpt(item.quote, `${item.h2} ${item.h3 || ''}`, 'tianji');
              return (
                <article className="card page-stack" style={{ gap: '0.6rem' }} key={i}>
                  <div className="eyebrow" style={{ marginBottom: 0 }}>
                    <ScrollText size={13} aria-hidden="true" /> 《天纪》· {item.h2}
                  </div>
                  <h3 style={{ fontSize: '1.08rem' }}>{item.h3 || item.h2}</h3>
                  <p className="small">“{item.quote}”</p>
                  {item.note ? <p className="small muted">{item.note}</p> : null}
                  <div className="reading-block">
                    <div className="reading-block-title">白话重点拆解</div>
                    <p className="small" style={{ lineHeight: 1.7 }}>
                      {decoded.plain}
                    </p>
                    {decoded.terms.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                        {decoded.terms.map((t) => (
                          <span key={t.term} className="meta-pill" style={{ whiteSpace: 'normal', lineHeight: 1.45 }}>
                            <strong>{t.term}</strong>：{t.gloss}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <span className="small mono muted">{item.t_hms}</span>
                  <a
                    href={`https://www.bilibili.com/video/${item.bvid}?p=${item.part}&t=${sec(item.t_hms)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="small"
                  >
                    回到视频 <ArrowUpRight size={13} aria-hidden="true" />
                  </a>
                </div>
                </article>
              );
            })}
          </div>
          {entries.length > 0 && !teacher.length ? (
            <div className="card-subtle small">没有找到相关语料，请尝试其他关键词。</div>
          ) : null}
        </>
      )}

      {loadError ? <div className="field-error">资料读取失败，请刷新页面重试。</div> : null}

      <p className="field-hint">
        《紫微斗数全书》来自
        <a href={CLASSIC_URL} target="_blank" rel="noreferrer">
          维基文库
        </a>
        的简体显示版本，已分段以便检索；并非影印本，请回到原页面核对上下文。《天纪》引文著作权归原权利人，本站按上游提供的非商业学习许可展示。
        <a href="/data/TIANJI-LICENSE.md" target="_blank" rel="noreferrer">
          查看许可
        </a>
      </p>
    </div>
  );
}
