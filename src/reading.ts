import {
  BRANCH_NAMES,
  calendarOverlay,
  major,
  palaceByName,
  patterns,
  shierShenForChart,
  type ChartResult,
} from './core';
import {
  CORE_SHA_STARS,
  findDoubleStarCombo,
  MAJOR_STAR_KNOWLEDGE,
  normalizePalaceKey,
  SIHUA_PALACE_GUIDE,
  STAR_SIHUA_SPECIFIC,
  summarizePalaceExtras,
} from './reading-knowledge';
import { buildPalacePlainSynthesis, STAR_PLAIN_PROFILES } from './reading-plain';
import {
  buildAuxPlainHighlights,
  buildConcreteScenes,
  buildSanfangPlainNote,
} from './reading-scenes';
import type { Palace } from './vendor/ziwei/types';

type Lens = 'self' | 'work' | 'relationships' | 'resources' | 'wellbeing';
export type ReadingTopic = {
  id: string;
  label: string;
  palace: string;
  lens: Lens;
  scope: string;
  question: string;
};

export const READING_TOPICS: ReadingTopic[] = [
  { id: 'overview', label: '命格总览', palace: '命宫', lens: 'self', scope: '先不看难懂的术数黑话，直接看你的天生性格、长处短板与这几年的生活重点。', question: '哪几条最贴近你平时真实的性格和经历？' },
  { id: 'personality', label: '性格与自我', palace: '命宫', lens: 'self', scope: '看你天生的脾气底色、做决定时的本能反应，以及最舒服的生活方式。', question: '在熟悉的人和陌生场合面前，你做事的方式有什么差别？' },
  { id: 'career', label: '事业与工作', palace: '官禄', lens: 'work', scope: '看你适合吃哪碗饭、适合单干还是带团队，以及在职场里怎么发挥最省力。', question: '你做过最顺手、最有成就感的事情，通常带有哪几种共同点？' },
  { id: 'wealth', label: '财务与资源', palace: '财帛', lens: 'resources', scope: '看你赚钱最顺手的路子、平时花钱留钱的习惯，以及最该防哪种破财坑。', question: '回顾过去几年的进出账，哪类钱最稳、哪类钱最容易白忙一场？' },
  { id: 'love', label: '亲密关系', palace: '夫妻', lens: 'relationships', scope: '看你会被什么样的人吸引、两口子平时容易为什么绊嘴，以及怎样处最舒服。', question: '在亲密关系里，最让你感到安心和最让你觉得累的分别是什么？' },
  { id: 'health', label: '身体与照顾', palace: '疾厄', lens: 'wellbeing', scope: '看长期劳累或情绪上火时，身体最先在哪儿提醒你歇一歇（不作医疗诊断）。', question: '一旦最近熬夜或压力大，最先不舒服的是不是提到的那一块？' },
  { id: 'siblings', label: '手足与同辈', palace: '兄弟', lens: 'relationships', scope: '看你跟兄弟姐妹、死党闺蜜以及平级合伙人之间怎么相处最舒服、少生摩擦。', question: '跟同龄熟人共事或互相帮忙时，什么样的边界让彼此最自在？' },
  { id: 'children', label: '子女与照护', palace: '子女', lens: 'relationships', scope: '看你带孩子、带新人时的沟通风格，以及你自己的创造力和生活情调。', question: '照顾或指导年轻晚辈时，你更倾向守规则还是放手让他们摸索？' },
  { id: 'travel', label: '外出与环境', palace: '迁移', lens: 'work', scope: '看别人第一眼怎么看你、你适合在家乡安稳还是出去换大舞台发展。', question: '出门见新人、换个环境发展 vs 留在老地方守成，哪边更让你精神焕发？' },
  { id: 'friends', label: '朋友与合作', palace: '仆役', lens: 'relationships', scope: '看你在泛朋友圈、客户圈和团队里的相处气场，以及合作时怎么避坑。', question: '过去给你带来好机会的人和消耗你的人，分别长什么样？' },
  { id: 'home', label: '家宅与居住', palace: '田宅', lens: 'resources', scope: '看你对住的环境有什么要求、家里氛围怎样，以及攒不动产家底的节奏。', question: '什么样的屋子灯光、格局和社区氛围，最能让你一回家就安心？' },
  { id: 'spirit', label: '内心与休息', palace: '福德', lens: 'wellbeing', scope: '看关起门后你真正想要的安全感、焦虑从哪来，以及干什么能最快回血开心。', question: '撇开别人怎么评价，最近做什么小事最能让你从心里感到高兴？' },
  { id: 'parents', label: '长辈与支持', palace: '父母', lens: 'relationships', scope: '看你跟父母、师长、直属上司相处时的气场磨合，以及长辈能给到哪类支持。', question: '面对长辈或老板的期待，你怎样在尊重和自己做主之间拿捏平衡？' },
];

export type RelatedPalace = { label: string; palace: Palace };
export type ReadingItem = {
  topic: ReadingTopic;
  palace: Palace;
  facts: string;
  plainTitle: string;
  plainQuote: string;
  plainSummary: string;
  plainAdvice: string;
  glossary: string[];
  concreteScenes: string[];
  auxPlainHighlights: string[];
  sanfangPlainNote: string;
  headline: string;
  comboNote?: string;
  interpretation: string[];
  considerations: string[];
  transformations: string[];
  auxNote: string;
  actionAdvice: string;
  related: RelatedPalace[];
  borrowed: boolean;
};

const SHENGONG_PLAIN_FOCUS: Record<string, string> = {
  命宫: '你越往后走，越是完全遵从自己本心做选择，别人不太容易轻易动摇你。',
  福德: '随着阅历增长（尤其三十岁后），你会越来越在乎内心舒不舒服、活得有没有趣味和意义，而不愿只为了别人眼光委屈自己。',
  官禄: '中后段人生的重心很大程度上寄托在事业与专业价值上——做得有成就感、被人认可本事，你整个人状态就特别好。',
  迁移: '你后面的大机会和开阔视野多半在“往外走、多跑动、换新圈层或大平台”，别把自己一直闷在原地小圈子里。',
  财帛: '越成熟你越讲究实际生活保障，经济独立、手里有稳当存款与看得到的回报，会成为你最大的底气来源。',
  夫妻: '亲密关系与核心合伙搭档对你的生命状态影响极深，遇到三观同频、互相稳住支撑的伴侣能让你整个人顺畅很多。',
};

const PALACE_PLAIN_DOMAIN: Record<string, string> = {
  命宫: '自我心态调整、个人方向升级与形象建立',
  兄弟: '身边平辈圈层互动、团队合伙规则与资金流动安排',
  夫妻: '亲密关系相处、婚姻经营与重要搭档契合度',
  子女: '晚辈培养教育、个人兴趣创作或生活情调拓展',
  财帛: '赚钱模式优化、实际收支规划与储蓄风控',
  疾厄: '作息修复、身体透支体检与情绪压力疏导',
  迁移: '走出去换新环境、开拓外地/外部圈层与拓展新机会',
  仆役: '人脉圈层洗牌筛选、团队下属协作与客户口碑维护',
  官禄: '工作赛道、专业晋升与长期做事风格磨炼',
  田宅: '家庭安居环境、置产换房或家庭内部照料',
  福德: '内心安全感梳理、摆脱精神内耗与生活品味提升',
  父母: '与长辈上司沟通边界、资质文书与正规平台突破',
};

export function getReading(result: ChartResult, topic: ReadingTopic): ReadingItem | null {
  const palace = palaceByName(result.chart, topic.palace);
  if (!palace) return null;

  const own = palace.stars.filter((s) => s.type === 'major');
  const opposite = palace.isEmpty
    ? result.chart.palaces.find((p) => p.branch === palace.oppositeBranch)
    : undefined;
  const observed = own.length ? own : opposite?.stars.filter((s) => s.type === 'major') || [];
  const borrowed = own.length === 0;
  const palaceKey = normalizePalaceKey(topic.palace);
  const palaceName = (name: string) => (name.endsWith('宫') ? name : `${name}宫`);
  const brightness = (s: string) =>
    s === '不'
      ? '不，称不得地'
      : s === '陷'
      ? '陷，称落陷'
      : s === '闲'
      ? '闲，偏弱不得势'
      : s === '地'
      ? '地，平实落点'
      : s;

  const starFacts =
    own.map((s) => `${s.name}${s.brightnessRaw ? `（${brightness(s.brightnessRaw)}）` : ''}`).join('、') ||
    '本宫无主星';
  const facts = `${palaceName(palace.name)}在${BRANCH_NAMES[palace.branch]}位；${starFacts}${
    borrowed && opposite ? `。参考对宫${palaceName(opposite.name)}的${major(opposite)}` : ''
  }。`;

  // Audit invariants: exact count & star name presence on interpretation
  const interpretation = observed.map((s) => {
    const g = MAJOR_STAR_KNOWLEDGE[s.name];
    if (!g) {
      return `${s.name}是${borrowed ? '对宫参考星曜' : '本宫主星'}；建议结合原文和其他星曜一起观察。`;
    }
    const specific = g.palaces[palaceKey] || g.essence;
    const prefix = borrowed
      ? `对宫借参「${s.name}」（${g.archetype}）：虽然本宫没坐主星，但会从对宫带入这股特质——`
      : `「${s.name}」坐守本宫（${g.archetype}）：`;
    return `${prefix}${specific}`;
  });

  if (!interpretation.length) {
    interpretation.push(
      '本宫没有主星，对宫也没有可借用的主星；这种双空配置像一张未预设固定剧本的白纸，实际表现高度受同宫辅煞、流年环境与三方四正所挟带的气场带动。',
    );
  }

  const strong = observed.filter((s) => s.brightnessRaw === '庙' || s.brightnessRaw === '旺');
  const weak = observed.filter(
    (s) => s.brightnessRaw === '不' || s.brightnessRaw === '陷' || s.brightnessRaw === '闲' || s.brightnessRaw === '地',
  );
  if (strong.length || weak.length) {
    const parts: string[] = [];
    if (strong.length) {
      parts.push(`${strong.map((s) => `${s.name}（${s.brightnessRaw}）`).join('、')}能量顺畅、优点较容易自然发挥`);
    }
    if (weak.length) {
      parts.push(
        `${weak.map((s) => `${s.name}（${brightness(s.brightnessRaw!)}）`).join('、')}需要更多后天方法调整与现实条件配合，容易先辛苦磨合后成型`,
      );
    }
    interpretation.push(
      `亮度参考：${parts.join('；')}。${
        borrowed
          ? '这里采用对宫主星在对宫的亮度，并非本宫有这些星；能量约按七至八成参考。'
          : '亮度是这些星在本宫的传统等级，只表示发挥顺不顺手，不代表事情的好坏高低。'
      }`,
    );
  }

  const siHuaMarks = palace.stars.filter((s) => s.siHua);
  const siHuaTag = siHuaMarks.length
    ? `，同时带本命${siHuaMarks.map((s) => `${s.name}化${s.siHua}`).join('、')}`
    : '';
  let headline: string;
  if (borrowed) {
    if (observed.length) {
      headline = `${palaceName(palace.name)}空宫（借对宫 ${observed.map((s) => s.name).join('、')}）${siHuaTag}`;
    } else {
      headline = `${palaceName(palace.name)}与对宫均无主星${siHuaTag}`;
    }
  } else if (observed.length >= 2) {
    headline = `${observed.map((s) => s.name).join(' + ')}同坐${palaceName(palace.name)}${siHuaTag}`;
  } else {
    headline = `${observed[0].name}独坐${palaceName(palace.name)}${siHuaTag}`;
  }

  let comboNote: string | undefined;
  if (borrowed && opposite && observed.length > 0) {
    const oppHua = observed.filter((s) => s.siHua).map((s) => `${s.name}化${s.siHua}`);
    comboNote = `「${palaceName(palace.name)}无主星（空宫）」不代表这里空白，而是平时表现与选择弹性很大，会借着对面「${palaceName(opposite.name)}」(${observed.map((s) => s.name).join('、')}) 的性格与身边环境一起发挥。${
      oppHua.length ? `对面所借主星自带${oppHua.join('、')}，也会从外缘互动上微妙牵动这一块的感受。` : ''
    }`;
  } else if (observed.length >= 2) {
    comboNote = findDoubleStarCombo(observed.map((s) => s.name));
  }

  const transformations = siHuaMarks.map((s) => {
    const guide = SIHUA_PALACE_GUIDE[s.siHua!];
    if (!guide) return `${s.name}化${s.siHua}：请结合具体口径核对。`;
    const starSpec = STAR_SIHUA_SPECIFIC[`${s.name}化${s.siHua}`]?.detail;
    const palaceText = guide.byPalace[palaceKey] || guide.general;
    return `${s.name}化${s.siHua}：${starSpec ? `${starSpec} ` : ''}落在此宫时——${palaceText}`;
  });

  const considerations = observed
    .map((s) => MAJOR_STAR_KNOWLEDGE[s.name]?.watch)
    .filter((v): v is string => Boolean(v));
  if (siHuaMarks.some((s) => s.siHua === '忌')) {
    considerations.push('本宫带生年「化忌」：越是在乎、抓得越紧越容易内耗卡住，重要决定建议留出检查清单和心理缓冲。');
  }
  if (palace.stars.some((s) => CORE_SHA_STARS.has(s.name))) {
    considerations.push('本宫逢六煞星提示：重大决定、合同与情绪交流宜慢半拍留足检查防线，不宜一时冲动赌一把。');
  }
  if (palaceKey === '兄弟' || palaceKey === '父母' || palaceKey === '子女' || palaceKey === '仆役') {
    considerations.push('人际六亲宫位重点看彼此相处的气场、互动方式与合作边界，不代表替另一方贴死绝对命运标签。');
  }
  if (!considerations.length) {
    considerations.push('挑对身边靠谱的共事环境和朋友，往往比一个人闷头苦熬决定性得多。');
  }

  const shier = shierShenForChart(result)[palace.branch];
  const nonMajorNames = palace.stars.filter((s) => s.type !== 'major').map((s) => s.name);
  const auxNote = summarizePalaceExtras(nonMajorNames, shier, palace.selfSihua);

  const adviceParts = observed
    .map((s) => MAJOR_STAR_KNOWLEDGE[s.name]?.advice)
    .filter((v): v is string => Boolean(v));
  const actionAdvice =
    adviceParts.length > 0
      ? adviceParts.join(' ')
      : '先把身边共事伙伴与生活大环境选对，稳步借助靠谱规则和前辈建议做决定。';

  // Pure plain-language synthesis incorporating decade & current year
  const localNow = (() => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  })();
  const cal = calendarOverlay(result, localNow);
  const currentYear = Number(localNow.slice(0, 4));
  const yearlyBranch = (((cal?.lunarYear ?? currentYear) - 4) % 12 + 12) % 12;

  const plain = buildPalacePlainSynthesis({
    palaceKey,
    observedStars: observed.map((s) => ({ name: s.name, brightnessRaw: s.brightnessRaw })),
    borrowed,
    strongCount: strong.length,
    weakCount: weak.length,
    siHuas: siHuaMarks.map((s) => ({ starName: s.name, siHua: s.siHua! })),
    luckyNames: palace.stars.filter((s) => s.type === 'lucky').map((s) => s.name),
    shaNames: palace.stars.filter((s) => s.type === 'sha').map((s) => s.name),
    decadeInfo: cal?.decade
      ? {
          ageRange: `${cal.decade.startAge}–${cal.decade.endAge}`,
          palaceName: palace.name,
          matchesThisPalace: cal.decade.palaceBranch === palace.branch,
        }
      : undefined,
    yearlyBranchInfo: {
      year: currentYear,
      palaceName: palace.name,
      matchesThisPalace: yearlyBranch === palace.branch,
    },
  });

  const related: RelatedPalace[] = [
    { label: '对宫', branch: (palace.branch + 6) % 12 },
    { label: '三合位', branch: (palace.branch + 4) % 12 },
    { label: '三合位', branch: (palace.branch + 8) % 12 },
  ].flatMap(({ label, branch }) => {
    const item = result.chart.palaces.find((p) => p.branch === branch);
    return item ? [{ label, palace: item }] : [];
  });

  const concreteScenes = buildConcreteScenes({
    palace,
    observed,
    borrowed,
    strongCount: strong.length,
    weakCount: weak.length,
    siHuas: siHuaMarks.map((s) => ({ name: s.name, siHua: s.siHua! })),
    luckyNames: palace.stars.filter((s) => s.type === 'lucky').map((s) => s.name),
    shaNames: palace.stars.filter((s) => s.type === 'sha').map((s) => s.name),
  });
  const auxPlainHighlights = buildAuxPlainHighlights(palace, shier);
  const sanfangPlainNote = buildSanfangPlainNote(palace, related, borrowed);

  return {
    topic,
    palace,
    facts,
    plainTitle: plain.plainTitle,
    plainQuote: plain.plainQuote,
    plainSummary: plain.plainSummary,
    plainAdvice: plain.plainAdvice,
    glossary: plain.glossary,
    concreteScenes,
    auxPlainHighlights,
    sanfangPlainNote,
    headline,
    comboNote,
    interpretation,
    considerations: [...new Set(considerations)],
    transformations,
    auxNote,
    actionAdvice,
    related,
    borrowed,
  };
}

export function readingOverview(result: ChartResult, date: string) {
  const sections = ['personality', 'career', 'love', 'wealth']
    .map((id) => getReading(result, READING_TOPICS.find((t) => t.id === id)!))
    .filter((x): x is ReadingItem => Boolean(x));

  let ruleCount: number | null = null;
  let patternHighlights: { name: string; description: string; level: string }[] = [];
  try {
    const found = patterns(result);
    ruleCount = found.length;
    patternHighlights = found.slice(0, 6).map((p) => ({
      name: p.name,
      description: p.description,
      level: p.level,
    }));
  } catch {
    /* preserve null ruleCount on pattern error */
  }

  const ming = result.chart.palaces.find((p) => p.isMingGong);
  const mingOwn = ming?.stars.filter((s) => s.type === 'major') ?? [];
  const mingOpp = ming?.isEmpty
    ? result.chart.palaces.find((p) => p.branch === ming.oppositeBranch)?.stars.filter((s) => s.type === 'major') ?? []
    : [];
  const mingBorrowed = mingOwn.length === 0;
  const mingObserved = mingOwn.length ? mingOwn : mingOpp;
  const firstMingProfile = mingObserved[0] ? STAR_PLAIN_PROFILES[mingObserved[0].name] : undefined;
  const secondMingProfile = mingObserved[1] ? STAR_PLAIN_PROFILES[mingObserved[1].name] : undefined;

  const baseHeroBadge = firstMingProfile
    ? secondMingProfile
      ? `${firstMingProfile.badge.split('·')[0].trim()} × ${secondMingProfile.badge.split('·')[0].trim()}`
      : firstMingProfile.badge
    : '灵活包容 · 遇强则强';

  const heroBadge =
    mingBorrowed && firstMingProfile
      ? `随境弹性 × ${baseHeroBadge}`
      : baseHeroBadge;

  const mingHasJi = Boolean(ming?.stars.some((s) => s.siHua === '忌'));
  const mingHasCoreSha = Boolean(ming?.stars.some((s) => CORE_SHA_STARS.has(s.name)));
  const mingHasWeak = mingObserved.some(
    (s) => s.brightnessRaw === '陷' || s.brightnessRaw === '不' || s.brightnessRaw === '闲' || s.brightnessRaw === '地',
  );

  const threeCards = firstMingProfile
    ? [
        {
          label: '核心优势',
          text: [
            firstMingProfile.strength,
            secondMingProfile ? `同时你也有另一面底色：${secondMingProfile.strength}` : '',
            mingBorrowed ? '再加上性格自带很强的顺应环境与借势发挥弹性，放在好团队好圈子里很容易快速成型。' : '',
          ]
            .filter(Boolean)
            .join(' '),
        },
        {
          label: '关系模式',
          text: [
            firstMingProfile.relation,
            secondMingProfile ? `而在更深一层交往里也会带出另一面：${secondMingProfile.relation}` : '',
            mingHasJi || mingHasCoreSha
              ? '碰到特别上心或情绪紧绷的时候容易自己较真生闷气或急着脱口而出，事缓半天再谈最护感情。'
              : '',
          ]
            .filter(Boolean)
            .join(' '),
        },
        {
          label: '成长课题',
          text: [
            firstMingProfile.growth,
            secondMingProfile ? `同时要留心的另一面是：${secondMingProfile.growth}` : '',
            mingHasWeak
              ? '早期可能总觉得顺手托举少一点、需要多靠自己摸索铺路，稳住基本功慢慢积累反而在中后程格外扎实。'
              : '',
            mingHasJi ? '很多卡点其实来自对自己要求太绷紧、一件事抓得太死，学会适度留白放过自己会顺畅很多。' : '',
          ]
            .filter(Boolean)
            .join(' '),
        },
      ]
    : [
        { label: '核心优势', text: '你的适应力强、可塑性很高，放在优质靠谱的环境和圈子里很快能学成样子。' },
        { label: '关系模式', text: '容易跟着身边亲近伙伴的节奏共振，挑对同路人与生活氛围比单打独斗更关键。' },
        { label: '成长课题', text: '遇到选择时尽量别随大流摇摆，花时间听清楚自己内心真实想要什么。' },
      ];

  const shen = result.chart.palaces.find((p) => p.isShenGong);
  const mingMajors = ming ? major(ming) : '未知';
  const shenKey = shen ? normalizePalaceKey(shen.name) : '';
  const shenPlain = shenKey ? SHENGONG_PLAIN_FOCUS[shenKey] || '' : '';

  // Translate SiHua locations into pure human language without jargon
  const siHuaHits = result.chart.palaces.flatMap((p) =>
    p.stars.filter((s) => s.siHua).map((s) => ({ siHua: s.siHua!, palaceKey: normalizePalaceKey(p.name) })),
  );
  const luPalace = siHuaHits.find((x) => x.siHua === '禄')?.palaceKey;
  const jiPalace = siHuaHits.find((x) => x.siHua === '忌')?.palaceKey;
  let siHuaFocusPlain = '';
  if (luPalace && jiPalace && luPalace === jiPalace) {
    siHuaFocusPlain = `尤其在「${PALACE_PLAIN_DOMAIN[luPalace] || luPalace}」上爱恨交织——一边很有机会有甜头，一边又偏偏最容易在这里操心或因细节起摩擦，切记写清边界。`;
  } else {
    const luPlain = luPalace ? `平时最有心投入、也最容易顺手见回报的方向在「${PALACE_PLAIN_DOMAIN[luPalace] || luPalace}」；` : '';
    const jiPlain = jiPalace ? `而最需要留神防内耗、越急着抓取越要写清规则的功课在「${PALACE_PLAIN_DOMAIN[jiPalace] || jiPalace}」。` : '';
    siHuaFocusPlain = luPlain + jiPlain;
  }

  const cal = calendarOverlay(result, date);
  const decadePalace = cal?.decade
    ? result.chart.palaces.find((p) => p.branch === cal.decade!.palaceBranch)
    : undefined;
  const decKey = decadePalace ? normalizePalaceKey(decadePalace.name) : '';
  const decadePlain = cal?.decade
    ? `眼下你正在走 ${cal.decade.startAge}–${cal.decade.endAge} 岁这十年（当前虚岁 ${cal.nominalAge} 岁），这一整十年的主线课题都围着「${
        PALACE_PLAIN_DOMAIN[decKey] || decadePalace?.name || '该阶段重点'
      }」转。`
    : '';

  const personalityReading = sections.find((s) => s.topic.id === 'personality');
  const overviewPlain = [
    personalityReading ? `${personalityReading.plainQuote}` : '',
    shenPlain,
    siHuaFocusPlain,
    decadePlain,
  ]
    .filter(Boolean)
    .join(' ');

  const overviewAdvice = [
    personalityReading?.plainAdvice ||
      '顺着你最顺手的方式积累核心本事，在你最在乎、最容易较真焦虑的地方慢半拍、留足余地就好。',
    jiPalace && jiPalace !== '命宫'
      ? `同时把重点风控放在「${PALACE_PLAIN_DOMAIN[jiPalace] || jiPalace}」上——越上心的地方越适合白纸黑字写清楚再拍板。`
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Keep concise traditional overview text for disclosure / summary
  const siHuaMap = result.chart.palaces
    .flatMap((p) =>
      p.stars
        .filter((s) => s.siHua)
        .map((s) => ({ siHua: s.siHua!, label: `${s.name}化${s.siHua}落${p.name}` })),
    )
    .sort((a, b) => '禄权科忌'.indexOf(a.siHua) - '禄权科忌'.indexOf(b.siHua))
    .map((x) => x.label);

  const overallSummary = [
    `本盘为「${result.chart.wuxingJuName}」，命宫在 ${BRANCH_NAMES[result.chart.mingGongBranch]} 位（${
      ming?.isEmpty ? `无主星，借对宫 ${ming.borrowedStars?.join('、') || ''}` : `主星：${mingMajors}`
    }），身宫落「${shen?.name || '—'}」。`,
    siHuaMap.length ? `生年四化：${siHuaMap.join('；')}。` : '',
    cal?.decade ? `当前大限 ${cal.decade.startAge}–${cal.decade.endAge} 岁（${decadePalace?.name || ''}）。` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return {
    sections,
    calendar: cal,
    ruleCount,
    heroBadge,
    threeCards,
    overviewPlain,
    overviewAdvice,
    overallSummary,
    patternHighlights,
  };
}

export function readingText(result: ChartResult) {
  const localNow = (() => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  })();
  const overview = readingOverview(result, localNow);
  return [
    '紫微研习室 · 本地大白话读盘报告',
    result.uncertain ? '注意：此盘使用尚未核实的候选时刻。' : '',
    `\n【整体画像】${overview.heroBadge}\n${overview.overviewPlain}\n建议：${overview.overviewAdvice}`,
    ...overview.threeCards.map((c) => `- ${c.label}：${c.text}`),
    ...READING_TOPICS.filter((t) => t.id !== 'overview').flatMap((t) => {
      const r = getReading(result, t);
      return r
        ? [
            `\n【${t.label}】${r.plainTitle}`,
            `一句话：${r.plainQuote}`,
            r.plainSummary,
            ...r.concreteScenes,
            `关联影响：${r.sanfangPlainNote}`,
            `建议：${r.plainAdvice}`,
            `盘面依据：${r.facts}`,
            ...(r.comboNote ? [r.comboNote] : []),
            ...r.interpretation,
            ...r.transformations,
            `可以想一想：${t.question}`,
          ]
        : [];
    }),
    '\n说明：以上为本地结构化白话整理与学习参考，不验证个人经历或未来，不构成医疗、理财或法律建议。',
  ]
    .filter(Boolean)
    .join('\n');
}
