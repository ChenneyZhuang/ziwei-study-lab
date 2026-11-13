import {
  BRANCH_NAMES,
  calendarOverlay,
  palaceByName,
  type ChartResult,
} from './core';
import { explainMarriageClassical } from './classic-plain';
import {
  CORE_SHA_STARS,
  normalizePalaceKey,
} from './reading-knowledge';
import { STAR_PLAIN_PROFILES } from './reading-plain';
import { SI_HUA_TABLE, STEMS } from './vendor/ziwei/constants';
import {
  MARRIAGE_STARS_BRIEF,
  SIHUA_IN_FUQI_GU,
  STAR_IN_FUQI_GU,
} from './vendor/ziwei/heming-knowledge';
import type { Palace, SiHua, ZiweiChart } from './vendor/ziwei/types';

export type SiHuaOverlayItem = {
  siHua: SiHua;
  star: string;
  targetPalace: string;
  targetPalaceKey: string;
  plainTitle: string;
  plainMeaning: string;
  practicalTip: string;
};

export type LifeSlice = {
  id: 'communication' | 'moneyHome' | 'workCollab';
  title: string;
  summary: string;
  advice: string;
};

export type PalacePairRow = {
  name: string;
  key: string;
  aBranch: string;
  bBranch: string;
  aMajors: string;
  bMajors: string;
  aBorrowed: boolean;
  bBorrowed: boolean;
  plainNote: string;
};

export type FuqiClassicEntry = {
  label: string;
  classical: string;
  plain: string;
};

export type PersonLoveProfile = {
  label: string;
  mingBadge: string;
  mingDesc: string;
  fuqiTitle: string;
  fuqiPlain: string;
  fudePlain: string;
  auraTags: string[];
  classics: FuqiClassicEntry[];
};

export type RelationshipReport = {
  aName: string;
  bName: string;
  headline: string;
  chemistrySummary: string;
  strengthHighlights: string[];
  watchHighlights: string[];
  lifeSlices: LifeSlice[];
  mutualAttraction: {
    aSeesB: string;
    bSeesA: string;
  };
  overlaysAToB: SiHuaOverlayItem[];
  overlaysBToA: SiHuaOverlayItem[];
  profiles: {
    a: PersonLoveProfile;
    b: PersonLoveProfile;
  };
  decadeSync: {
    aSummary: string;
    bSummary: string;
    combinedPlain: string;
  };
  practicalAdvice: string[];
  palaceRows: PalacePairRow[];
};

const ACTION_GROUP_FAST = new Set(['七杀', '破军', '贪狼', '廉贞', '太阳', '武曲']);
const ACTION_GROUP_STEADY = new Set(['紫微', '天府', '天相', '天梁', '太阴', '天同']);
const THINK_GROUP = new Set(['天机', '巨门', '太阴']);

const PALACE_OVERALL_AREA: Record<string, string> = {
  命宫: '个人脾气、日常心情与安全感底色',
  兄弟: '身边平辈互动、死党闺蜜圈或平级搭档默契',
  夫妻: '谈恋爱与婚姻里的相处温度、亲密感与期待值',
  子女: '晚辈照护、居家生活情趣以及共同创作体验',
  财帛: '一起攒钱花钱、金钱观与实际物质保障',
  疾厄: '身体作息照顾、情绪紧绷度与真实体力消耗',
  迁移: '出门一起活动、换环境发展以及外人眼中的你们',
  仆役: '各自的朋友圈交集、人情往来与合作团队气场',
  官禄: '工作做事风格、事业规划与日常忙碌重点',
  田宅: '住在一起的家里气氛、家务安排与买房安家步调',
  福德: '内心深处的安心程度、夜深人静时快不快乐',
  父母: '见长辈、两家沟通协调、证照文书或外部规矩压力',
};

const PALACE_CROSS_NOTE: Record<string, Record<SiHua, string>> = {
  命宫: {
    禄: '让你对对方天生很有好感、在一起容易觉得轻松开心，愿意主动多照顾和给甜头。',
    权: '让你特别有主意，总想替对方做决定、push 对方进步，对方既佩服有依靠感，有时也觉得有点被管着。',
    科: '让你欣赏对方的聪明体面或处事风格，常在公开场合或关键时候温和帮对方撑场面、给好建议。',
    忌: '让你特别把对方的情绪和一举一动放在心上，越紧张在乎越容易纠结挑剔、忍不住碎念操心。',
  },
  兄弟: {
    禄: '和彼此同龄好友、兄弟姐妹相处起来挺顺畅，合伙或互相搭把手常能带来实际便利。',
    权: '在平级圈子或家里日常事务分工上说话有分量，能帮对方拿主意，注意别在对方朋友面前太强势。',
    科: '彼此私下或和死党来往讲分寸讲礼貌，是对方平时遇到琐事喜欢找你商量参谋的好队友。',
    忌: '容易因为各自朋友、亲戚、或是谁该多帮谁一把的平级边界问题心里别扭，谈钱合伙尽量写清楚。',
  },
  夫妻: {
    禄: '特别会给对方制造感情上的甜头、照顾感和温暖仪式，是很容易让对方动心、感到被偏爱的位置。',
    权: '你在亲密关系里占据较主动位置，愿意扛起护着这段关系的责任，但别在吵架时非分出输赢。',
    科: '让对方觉得跟你在外站在一起很体面、有默契，拌嘴时你懂得递台阶，能给感情铺一层缓冲垫。',
    忌: '代表这段感情牵动得特别深、特别放在心尖上，越在意越怕失去或反复猜想对方想法；给足彼此透气的空间就能甜很多。',
  },
  子女: {
    禄: '一起吃喝玩乐、旅行探店或带娃/养宠物时充满笑声，能给平淡日子添很多新鲜生活情趣。',
    权: '在居家创意、育儿规划或共同嗜好上特别积极主动、定规矩带节奏，记得多问问对方喜好再安排。',
    科: '相处画面带点文艺体面感，一起看展、教导孩子或聊兴趣嗜好时，特别聊得来、很有审美共鸣。',
    忌: '在育儿方式、约会体验或共同休闲开销上容易较真期待落空；别拿理想化高标准去挑剔眼前轻松相处。',
  },
  财帛: {
    禄: '容易给对方带去赚钱灵感、实际花销便利或消费开心感——比如一起吃好的买好的，或在财务合作上带来进账机会。',
    权: '在怎么挣钱、怎么管钱投资上很有决断力，常推动对方敢于争取更好回报或把消费习惯理顺。',
    科: '能帮对方出靠谱的财务规划或消费避坑主意，不会乱挥霍，讲究花钱体面划算又有条理。',
    忌: '花钱观念和消费节奏最容易让其中一方操心或有“钱怎么又这么快流出去了”的紧迫感；设一个各自支配账户＋共同账本立省九成摩擦。',
  },
  疾厄: {
    禄: '贴身照顾、肢体亲密与日常作息投喂会让对方觉得舒服放松，你在生活起居上蛮能哄对方开心。',
    权: '督促对方注意身体健康、健身作息时干脆果断，但别变成每天紧盯指责对方生活习惯的小管家。',
    科: '在身体不适、体检保健或情绪累了的时候，懂得找专业靠谱的调养方案稳住对方情绪。',
    忌: '一旦闹别扭或生活压力大，对方容易感到情绪绷紧甚至影响到睡眠休息；学会把话摊在轻松的白天说，不把闷气带到睡前。',
  },
  迁移: {
    禄: '两个人一起出门旅游、换新城市发展或出去见朋友时运气与心情通常很不错，越往外走越旺这段关系。',
    权: '出门在外时往往由这一方领路定路线、扛对外社交，让另一半觉得跟着你走很有安全感和面子。',
    科: '外人眼中你们很相配、讲礼数、对外形象很好；一起拓展外部工作和人脉机会也很加分。',
    忌: '平时在家好好的，一碰到出远门、异地距离或对外应付陌生社交场合时容易闹小误会或各忙各顾不上彼此。',
  },
  仆役: {
    禄: '你的朋友或人脉常对对方蛮友好，甚至可能通过你的社交圈给对方牵来好用机会与善意。',
    权: '在社交局、团队合作里习惯带头组织协调，让对方或对方朋友感受到强行动力；注意保留对方自己的交友节奏。',
    科: '对方遇到团队协作或人际难题时，你很能站在客观友好的位置帮对方圆场出主意。',
    忌: '对彼此的朋友圈、异性友人或工作搭档特别敏感在意——与其猜来猜去，不如大方坦诚介绍认识或约好透明边界。',
  },
  官禄: {
    禄: '非常旺对方的工作心气和做事效率——你在背后或身边的支持常让对方工作起来更有劲、有甜头。',
    权: '在事业选择与工作方法上极能激发对方的冲劲和企图心，但少用上级命令口吻指导另一半工作就好。',
    科: '是对方的“优质事业参谋”：做重要汇报、跳槽选择或处理专业名声问题时，听你的建议往往很管用。',
    忌: '最容易因为各自加班忙碌时间、工作选择或对前途规划的焦虑而觉得对方不理解自己，每天下班留十分钟纯聊轻松话题能大大缓解。',
  },
  田宅: {
    禄: '能把两个人的家里搞得温暖舒服、烟火气十足，也容易在布置房间、改善居住或攒家底上带去好助力。',
    权: '在家里事务安排、置产装修风格上很有拍板主见，把家里打理得整整齐齐，只要多协商一点就不会像一言堂。',
    科: '喜欢干净舒雅、有品味的居住环境，也会用讲道理、好沟通的方式处理家里琐碎与置业大事。',
    忌: '回家后琐碎家务分工、房贷居住支出、或者房间摆设习惯容易踩到对方雷区；约定“各管固定一块、大件共同选”就能大幅减压。',
  },
  福德: {
    禄: '跟对方待在一起容易从心底松口气、有安全感，你的存在常能让对方觉得生活还是很有盼头的。',
    权: '心态上会激励对方更有上进心和底气，但遇到对方只想发呆休息时，别一直追着讲大道理或逼对方打起精神。',
    科: '能看懂对方内心小敏感和精神需求，往往一句话说进心坎里，给对方体面的情绪安慰与精神共鸣。',
    忌: '容易无意间碰触到对方心里最放不下、最没安全感的那根弦，让对方晚上翻来覆去想很多；记住“先共情、后给建议”，千万别急着反驳。',
  },
  父母: {
    禄: '对方父母长辈或上司往往对这段关系或你态度偏温和友好，遇到需要长辈帮衬、办手续时相对顺手。',
    权: '面对两家父母沟通、规则协议时敢挺身而出拿主意扛事，只是在长辈面前记得稍微把态度放柔一点。',
    科: '谈吐得体有分寸，容易赢取对方家长和资深人士的好感信任，处理证件合同长幼礼节很稳妥。',
    忌: '重点留神两家父母期待差异、长辈干涉太多，或签约文书上的沟通误会；涉及到两家大事，两口子先私下统一战线再去回应长辈最稳当。',
  },
};

function getObservedMajors(chart: ZiweiChart, palaceName: string) {
  const palace = palaceByName(chart, palaceName);
  if (!palace) {
    return {
      palace: undefined as Palace | undefined,
      opposite: undefined as Palace | undefined,
      observed: [] as Palace['stars'],
      borrowed: false,
    };
  }
  const own = palace.stars.filter((s) => s.type === 'major');
  const opposite = palace.isEmpty ? chart.palaces.find((p) => p.branch === palace.oppositeBranch) : undefined;
  const observed = own.length ? own : opposite?.stars.filter((s) => s.type === 'major') || [];
  return {
    palace,
    opposite,
    observed,
    borrowed: own.length === 0,
  };
}

function getSanfangStars(chart: ZiweiChart, palaceBranch: number): Set<string> {
  const branches = [palaceBranch, (palaceBranch + 6) % 12, (palaceBranch + 4) % 12, (palaceBranch + 8) % 12];
  const out = new Set<string>();
  for (const b of branches) {
    const p = chart.palaces.find((x) => x.branch === b);
    if (!p) continue;
    for (const s of p.stars) {
      if (s.type === 'major') out.add(s.name);
    }
    if (p.isEmpty && p.borrowedStars) {
      for (const name of p.borrowedStars) out.add(name);
    }
  }
  return out;
}

function classifyStyle(stars: string[]) {
  const fast = stars.some((s) => ACTION_GROUP_FAST.has(s));
  const steady = stars.some((s) => ACTION_GROUP_STEADY.has(s));
  const think = stars.some((s) => THINK_GROUP.has(s));
  if (fast && !steady) return 'direct';
  if (steady && !fast) return 'steady';
  if (think && !fast) return 'thoughtful';
  return 'balanced';
}

function describeCommunicationStyle(label: string, chart: ZiweiChart): {
  tag: 'push' | 'cool' | 'talk' | 'steady';
  desc: string;
} {
  const ming = getObservedMajors(chart, '命宫');
  const fude = getObservedMajors(chart, '福德');
  const allStars = [...ming.observed, ...fude.observed, ...(ming.palace?.stars || []), ...(fude.palace?.stars || [])];
  const names = new Set(allStars.map((s) => s.name));
  const hasHotSha = names.has('擎羊') || names.has('火星');
  const hasCoolSha = names.has('陀罗') || names.has('铃星');
  const hasTalk = names.has('巨门') || names.has('天机') || names.has('太阳');
  const hasSoft = names.has('天同') || names.has('太阴') || names.has('天梁');

  if (hasHotSha || names.has('七杀') || names.has('破军')) {
    return {
      tag: 'push',
      desc: `${label}遇事性格直爽、藏不住话，急起来讲重点甚至语速变快、希望立刻把话说透解决掉`,
    };
  }
  if (hasCoolSha || (hasSoft && !hasTalk)) {
    return {
      tag: 'cool',
      desc: `${label}习惯先安静观察或把情绪憋在心里慢慢消化，有时嘴上不说其实心里默默记了好几笔`,
    };
  }
  if (hasTalk) {
    return {
      tag: 'talk',
      desc: `${label}重视逻辑和“事情有没有讲清楚”，习惯先反复琢磨细节把前因后果掰开揉碎聊明白`,
    };
  }
  return {
    tag: 'steady',
    desc: `${label}整体比较讲体面与分寸感，喜欢就事论事，但很在意对方当时说话的语气和尊重度`,
  };
}

function describeMoneyHomeStyle(label: string, chart: ZiweiChart): string {
  const cai = getObservedMajors(chart, '财帛');
  const tian = getObservedMajors(chart, '田宅');
  const caiNames = cai.observed.map((s) => s.name);
  const tianNames = tian.observed.map((s) => s.name);
  const hasSave = caiNames.some((s) => ['天府', '太阴', '武曲', '天相', '天梁'].includes(s)) || cai.palace?.stars.some((s) => s.name === '禄存');
  const hasSpendOrSwing = caiNames.some((s) => ['贪狼', '破军', '太阳', '天同'].includes(s)) || cai.palace?.stars.some((s) => s.name === '地空' || s.name === '地劫');
  const homeCozy = tianNames.some((s) => ['天同', '太阴', '天府', '太阳', '紫微'].includes(s));

  const moneyPart = hasSave && !hasSpendOrSwing
    ? `${label}管钱偏稳健实用派，讲究手里有储备和预算感`
    : hasSpendOrSwing
    ? `${label}更愿意花钱换生活体验、人情交流或冲有想象空间的新机会，情绪上来时也较容易随手多花一笔`
    : `${label}用钱偏折衷理性派，平时有数，看重性价比与生活质量平衡`;

  const homePart = homeCozy
    ? '；对居家舒适度要求蛮高，重视把屋子收拾舒服有家庭感。'
    : '；家里事务多靠明确规则分工才不容易乱。';

  return moneyPart + homePart;
}

function describeWorkCollabStyle(label: string, chart: ZiweiChart): string {
  const guan = getObservedMajors(chart, '官禄');
  const pu = getObservedMajors(chart, '仆役');
  const guanNames = guan.observed.map((s) => s.name);
  const isPioneer = guanNames.some((s) => ['七杀', '破军', '贪狼', '太阳', '紫微', '武曲'].includes(s));
  const isPlanner = guanNames.some((s) => ['天机', '天府', '天相', '太阴', '天梁', '巨门'].includes(s));
  const puHasSha = pu.palace?.stars.some((s) => CORE_SHA_STARS.has(s.name) || s.siHua === '忌');

  const workRole = isPioneer && !isPlanner
    ? `${label}做事敢抢主动权、喜欢拍板冲业务或直接盯结果`
    : isPlanner
    ? `${label}更擅长谋划方案、控住执行流程、顾细节和长远落地`
    : `${label}兼具一定主动与配合弹性，适合按阶段拆解推进`;

  const partnerBoundary = puHasSha
    ? '，但对共事对象的信誉与职责边界比较敏感，合伙一定要责权分明'
    : '，配合度相对平稳好沟通';

  return `${workRole}${partnerBoundary}。`;
}

function buildPersonLoveProfile(label: string, chart: ZiweiChart): PersonLoveProfile {
  const ming = getObservedMajors(chart, '命宫');
  const fuqi = getObservedMajors(chart, '夫妻');
  const fude = getObservedMajors(chart, '福德');

  const mingFirst = ming.observed[0];
  const mingProfile = mingFirst ? STAR_PLAIN_PROFILES[mingFirst.name] : undefined;
  const mingBadge = mingProfile
    ? `${ming.borrowed ? '借星弹性 · ' : ''}${mingProfile.badge}`
    : '灵动可塑 · 随境共振';
  const mingDesc = mingProfile
    ? `${mingProfile.palaces['命宫']?.life || mingProfile.strength} 在感情里，${mingProfile.relation}`
    : '自身主星弹性很大，容易被亲密伙伴的气质与生活习惯影响，挑对情绪稳定、真诚靠得住的对象格外重要。';

  const fuqiStarsList = fuqi.observed.map((s) => s.name);
  const fuqiTitle = fuqi.borrowed
    ? `夫妻空宫（借对宫「${fuqiStarsList.join('、') || '无主星'}」）`
    : fuqiStarsList.length
    ? `夫妻宫「${fuqiStarsList.join(' + ')}」`
    : '夫妻宫无主星';

  const fuqiDetails = fuqi.observed
    .map((s) => {
      const sp = STAR_PLAIN_PROFILES[s.name];
      if (!sp) return `${s.name}：影响你对理想伴侣气质与相处风格的偏好。`;
      return `${fuqi.borrowed ? `借参${s.name}` : s.name}：${sp.relation}`;
    })
    .join(' ');

  const fuqiSiHuas = (fuqi.palace?.stars || []).filter((s) => s.siHua);
  const fuqiHuaPlain = fuqiSiHuas
    .map((s) =>
      s.siHua === '禄'
        ? `带本命「${s.name}化禄」：天生较懂得在关系里释放善意、甜度与照顾感。`
        : s.siHua === '权'
        ? `带本命「${s.name}化权」：对伴侣有一定要求与主见，但也愿意护短扛起家的担子。`
        : s.siHua === '科'
        ? `带本命「${s.name}化科」：很重双方交流时的体面感、三观契合与相互尊重。`
        : `带本命「${s.name}化忌」：在感情里容易特别执着上心、爱反复琢磨细节，学会放松一点反而让双方喘得过气。`,
    )
    .join(' ');

  const fudeNames = fude.observed.map((s) => `${fude.borrowed ? '借参' : ''}${s.name}`).join('、') || '无主星';
  const fudeProfile = fude.observed[0] ? STAR_PLAIN_PROFILES[fude.observed[0].name] : undefined;
  const fudePlain = `福德宫见「${fudeNames}」：${
    fudeProfile
      ? `${fudeProfile.badge.split('·')[0].trim()}型内在需求——关起门独处或累了想回血时，${fudeProfile.growth}`
      : '内心很需要一段不受打扰的自在时光来整理思绪、慢慢补充精力。'
  }`;

  const auraTags: string[] = [];
  const allFuqiNames = new Set((fuqi.palace?.stars || []).map((s) => s.name));
  if (allFuqiNames.has('红鸾') || allFuqiNames.has('天喜')) {
    auraTags.push('桃花仪态佳（自带好感眼缘，重约会仪式感）');
  }
  if (allFuqiNames.has('天姚') || allFuqiNames.has('咸池')) {
    auraTags.push('感官敏锐浪漫（吸引点强烈，别在情绪上头时盲目滤镜太重）');
  }
  if (allFuqiNames.has('孤辰') || allFuqiNames.has('寡宿')) {
    auraTags.push('重视精神独处（即便结婚也要各留小书桌/独处时间，越透亮越相爱）');
  }
  if ((fuqi.palace?.stars || []).some((s) => CORE_SHA_STARS.has(s.name))) {
    auraTags.push('夫妻带煞星提醒（拌嘴别隔夜、别在情绪高点撂狠话）');
  }
  if ((fuqi.palace?.stars || []).some((s) => ['左辅', '右弼'].includes(s.name))) {
    auraTags.push('左右星入夫妻提示（沟通坦诚不留模棱两可的第三方空间最护感情）');
  }
  if (!auraTags.length) {
    auraTags.push('夫妻辅煞相对平和，重在日常点滴累积默契');
  }

  // Collect classical notes & attach calm plain translations
  const classics: FuqiClassicEntry[] = [];
  for (const star of fuqiStarsList) {
    const raw = STAR_IN_FUQI_GU[star];
    if (raw) {
      const classicalText = [
        raw.summary,
        raw.spouse_traits ? `伴侣表现：${raw.spouse_traits}` : '',
        raw.good ? `有利条件：${raw.good}` : '',
        raw.bad ? `传统提醒：${raw.bad}` : '',
        raw.timing ? `成家节奏：${raw.timing}` : '',
        raw.ni_quote ? `倪师口诀：“${raw.ni_quote}”` : '',
      ]
        .filter(Boolean)
        .join('｜');
      classics.push({
        label: `传统口诀 · 夫妻遇「${star}」`,
        classical: classicalText,
        plain: explainMarriageClassical(
          [raw.summary, raw.bad, raw.spouse_traits, raw.timing, raw.ni_quote].filter(Boolean).join('；'),
          star,
        ),
      });
    }
  }
  for (const s of fuqiSiHuas) {
    if (!s.siHua) continue;
    const huaKey = `化${s.siHua}` as keyof typeof SIHUA_IN_FUQI_GU;
    const raw = SIHUA_IN_FUQI_GU[huaKey];
    if (raw) {
      classics.push({
        label: `《四化口诀》· 夫妻遇「${s.name}${huaKey}」`,
        classical: raw,
        plain: explainMarriageClassical(raw, `${s.name}${huaKey}`),
      });
    }
  }
  for (const starName of ['红鸾', '天喜', '孤辰', '寡宿', '天姚', '咸池']) {
    if (allFuqiNames.has(starName) && MARRIAGE_STARS_BRIEF[starName]) {
      const raw = MARRIAGE_STARS_BRIEF[starName];
      classics.push({
        label: `婚恋辅助星 · ${starName}`,
        classical: raw,
        plain: explainMarriageClassical(raw, starName),
      });
    }
  }

  return {
    label,
    mingBadge,
    mingDesc,
    fuqiTitle,
    fuqiPlain: [fuqiDetails, fuqiHuaPlain].filter(Boolean).join(' ') || '夫妻宫表现随双人互动环境和流年阶段而变化，重点看对方是否真诚踏实。',
    fudePlain,
    auraTags,
    classics,
  };
}

function buildSiHuaOverlays(
  sourceLabel: string,
  targetLabel: string,
  sourceChart: ZiweiChart,
  targetChart: ZiweiChart,
): SiHuaOverlayItem[] {
  const row = SI_HUA_TABLE[sourceChart.lunarInfo.yearStem];
  if (!row) return [];
  const marks: SiHua[] = ['禄', '权', '科', '忌'];

  return marks.flatMap((siHua, idx) => {
    const star = row[idx];
    const targetPalace = targetChart.palaces.find((p) => p.stars.some((s) => s.name === star));
    if (!targetPalace) return [];
    const targetPalaceKey = normalizePalaceKey(targetPalace.name);
    const meaning =
      PALACE_CROSS_NOTE[targetPalaceKey]?.[siHua] ||
      `把「化${siHua}」的能量带进了${targetLabel}的「${targetPalace.name}」。`;

    const actionVerb =
      siHua === '禄'
        ? `给甜头、滋润、送机会`
        : siHua === '权'
        ? `带节奏、主动做主、给推进力`
        : siHua === '科'
        ? `显体面、好商量、给理性建议`
        : `最上心牵挂、也最易催出紧绷感`;

    const tip =
      siHua === '禄'
        ? `这是你们相处里天生顺滑加分的点：多让 ${sourceLabel} 在这一块自然照顾带路，彼此都开心。`
        : siHua === '权'
        ? `面对「${PALACE_OVERALL_AREA[targetPalaceKey] || targetPalace.name}」时，${sourceLabel} 很有主见想拍板——先问一句 ${targetLabel} 的真实感受再动手，效果更好。`
        : siHua === '科'
        ? `这块是彼此很讲道理好商量的安全区，闹小矛盾时聊一聊这里的事往往能很快恢复默契。`
        : `${sourceLabel} 对 ${targetLabel} 的「${PALACE_OVERALL_AREA[targetPalaceKey] || targetPalace.name}」特别执着上心，越紧张越像“不停提醒或担心”；把标准写清、有事白天坦诚说，避免憋着瞎猜。`;

    return [
      {
        siHua,
        star,
        targetPalace: targetPalace.name,
        targetPalaceKey,
        plainTitle: `${sourceLabel}（${STEMS[sourceChart.lunarInfo.yearStem]}干${star}化${siHua}）→ 落入 ${targetLabel}「${targetPalace.name}」（${actionVerb}）`,
        plainMeaning: `${sourceLabel}天生的这股「化${siHua}」，刚好打在 ${targetLabel}「${PALACE_OVERALL_AREA[targetPalaceKey] || targetPalace.name}」这一块：${meaning}`,
        practicalTip: tip,
      },
    ];
  });
}

function checkAttractionDirection(
  seekerLabel: string,
  partnerLabel: string,
  seekerChart: ZiweiChart,
  partnerChart: ZiweiChart,
): string {
  const seekerFuqi = getObservedMajors(seekerChart, '夫妻');
  const partnerMing = getObservedMajors(partnerChart, '命宫');
  const partnerSanfang = partnerMing.palace ? getSanfangStars(partnerChart, partnerMing.palace.branch) : new Set<string>();
  const partnerMingNames = new Set(partnerMing.observed.map((s) => s.name));

  const desiredNames = seekerFuqi.observed.map((s) => s.name);
  const directMingMatches = desiredNames.filter((n) => partnerMingNames.has(n));
  const sanfangMatches = desiredNames.filter((n) => !partnerMingNames.has(n) && partnerSanfang.has(n));

  if (directMingMatches.length > 0) {
    return `${seekerLabel} 心里向往的伴侣气场（夫妻宫见${desiredNames.join('、')}），正好直中 ${partnerLabel} 本身最核心的命宫主星「${directMingMatches.join('、')}」！属于一眼容易觉得“对味、有熟稔感、就是喜欢这种性格底色”的强眼缘组合。`;
  }
  if (sanfangMatches.length > 0) {
    return `${seekerLabel} 看重的理想型特质（${desiredNames.join('、')}），在 ${partnerLabel} 的性格三方配合里直接找得到「${sanfangMatches.join('、')}」。初次相处也许不是戏剧化一见钟情，但一起共事生活、熟起来之后，会越处越发现对方身上正好有自己最受用的那一面。`;
  }
  const seekerStyle = classifyStyle(desiredNames);
  const partnerStyle = classifyStyle([...partnerMingNames]);
  if (seekerStyle === partnerStyle) {
    return `${seekerLabel} 期待的伴侣节奏和 ${partnerLabel} 天生性格属于同一大类画风，三观大方向容易对齐，相处比较省去猜来猜去的磨合成本。`;
  }
  return `${seekerLabel} 夫妻宫偏爱「${desiredNames.join('、') || '灵活型'}」特质，而 ${partnerLabel} 命格走的是「${[...partnerMingNames].join('、') || '弹性型'}」路线——说明你们不是死照单一择偶模板，而是在真实接触里靠性格落差带来的新鲜感与互补互相吸引。`;
}

/**
 * Compute full concrete plain-language pairwise compatibility report for two charts.
 */
export function analyzeRelationship(
  first: ChartResult,
  second: ChartResult,
  todayDate?: string,
): RelationshipReport {
  const aName = first.form.name || '第一张命盘';
  const bName = second.form.name || '第二张命盘';
  const aDisplay = aName === bName ? `${aName} (A)` : aName;
  const bDisplay = aName === bName ? `${bName} (B)` : bName;

  const aMing = getObservedMajors(first.chart, '命宫');
  const bMing = getObservedMajors(second.chart, '命宫');
  const aStars = aMing.observed.map((s) => s.name);
  const bStars = bMing.observed.map((s) => s.name);

  const aStyle = classifyStyle(aStars);
  const bStyle = classifyStyle(bStars);

  let headline = '差异互补 · 在磨合中长出默契的组合';
  let chemistrySummary = '';
  if (aStyle === bStyle && aStyle === 'steady') {
    headline = '安稳同频 · 日子越过越有底气的组合';
    chemistrySummary = `${aDisplay} 和 ${bDisplay} 都偏向先求稳、顾分寸、喜欢提前计划的性子。好处是不容易为鸡毛蒜皮大吵大闹，很适合一起攒家底过稳当日子；需要留心的是别两个人都把话闷在心里客气过头，记得主动制造点新鲜感与直接夸奖。`;
  } else if (aStyle === bStyle && aStyle === 'direct') {
    headline = '火花碰撞 · 办事痛快但需避开硬碰硬';
    chemistrySummary = `两个人都属于脑子快、有主见、藏不住情绪和行动力强的爽快派！聊得来、一起折腾项目或闯荡效率极高；最关键的保鲜秘诀是“永远别在同一秒一起发火”，约定谁声音抬高三度时另一个人先去倒杯水歇一分钟。`;
  } else if (aStyle !== bStyle) {
    headline = '快慢互补 · 一个带头破冰，一个稳住大局';
    chemistrySummary = `你们天生节奏差了半拍：一方更冲更果断（适合对外开路拿主意），另一方更细更稳当（擅长托底看长远风险）。处得好就是绝佳拍档；怕的是急的一方嫌另一半磨蹭，稳的一方嫌另一半太莽撞——看懂彼此本性只是发力方向不同，反倒少生一半闲气。`;
  } else {
    headline = '思维贴合 · 靠聊得来与理解建立安全感';
    chemistrySummary = `${aDisplay} 和 ${bDisplay} 对生活中的小情绪、做事逻辑和品味分寸都比较敏感，属于很能“听懂对方潜台词”的组合；唯独要防两个人都爱反复揣摩、把小事想太深，遇到拿不准的事直接挑明了问比猜更有安全感。`;
  }

  // Communication, Money & Home, Work Collab
  const commA = describeCommunicationStyle(aDisplay, first.chart);
  const commB = describeCommunicationStyle(bDisplay, second.chart);
  let commAdvice = '把重要分歧留到不饿不累的白天心平气和地聊，先说具体一件事而不是翻旧账。';
  if (commA.tag === 'push' && commB.tag === 'cool') {
    commAdvice = `一个越急越追着问、一个越逼越闭嘴冷处理，这是最典型的“追逃循环”。${aDisplay} 请放慢追问步子给半小时缓冲；${bDisplay} 也要明确说一句“我不是在摆脸色，我需要冷静想半小时再跟你说”，就能立刻拆弹！`;
  } else if (commB.tag === 'push' && commA.tag === 'cool') {
    commAdvice = `${bDisplay} 性子直追得急、${aDisplay} 习惯先往心里退一步消化。${bDisplay} 说话别带逼迫感和绝对字眼；${aDisplay} 就算想安静，也要提前给个明确回应时间点，让对方别干等瞎急。`;
  } else if (commA.tag === 'push' && commB.tag === 'push') {
    commAdvice = '两把直脾气碰一块，吵架当时话赶话最伤人但通常也忘得快——立条家规“吵架绝不说离婚/分手/翻老账”，气头上先分开房间冷静十五分钟。';
  } else if (commA.tag === 'cool' && commB.tag === 'cool') {
    commAdvice = '两个人都偏爱维持体面、心里藏话。千万别靠猜“他怎么不哄我”；小不爽趁刚冒头那天睡前用温和的话轻轻讲出来，积久了才不会变闷雷。';
  }

  const overlaysAToB = buildSiHuaOverlays(aDisplay, bDisplay, first.chart, second.chart);
  const overlaysBToA = buildSiHuaOverlays(bDisplay, aDisplay, second.chart, first.chart);

  const jiA = overlaysAToB.find((x) => x.siHua === '忌');
  const jiB = overlaysBToA.find((x) => x.siHua === '忌');
  const luA = overlaysAToB.find((x) => x.siHua === '禄');
  const luB = overlaysBToA.find((x) => x.siHua === '禄');

  const strengthHighlights = [
    luA ? `${aDisplay} 的「化禄」照亮 ${bDisplay}「${luA.targetPalace}」：在「${PALACE_OVERALL_AREA[luA.targetPalaceKey] || luA.targetPalace}」上自然容易让对方开心受用、有资源甜头。` : '',
    luB ? `${bDisplay} 的「化禄」照亮 ${aDisplay}「${luB.targetPalace}」：也会用顺畅照顾与好人缘滋润对方的「${PALACE_OVERALL_AREA[luB.targetPalaceKey] || luB.targetPalace}」。` : '',
    `双向气质碰撞：${chemistrySummary}`,
  ].filter(Boolean);

  const watchHighlights = [
    jiA ? `彼此在意功课 ①：${aDisplay} 的化忌落入 ${bDisplay}「${jiA.targetPalace}」——在「${PALACE_OVERALL_AREA[jiA.targetPalaceKey] || jiA.targetPalace}」最容易忍不住多虑、碎念或给对方无形压力。` : '',
    jiB ? `彼此在意功课 ②：${bDisplay} 的化忌落入 ${aDisplay}「${jiB.targetPalace}」——在「${PALACE_OVERALL_AREA[jiB.targetPalaceKey] || jiB.targetPalace}」上也特别敏感放不下，最怕双方都用挑刺来表达关心。` : '',
  ].filter(Boolean);

  // Decade sync
  const localNow = todayDate || (() => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  })();
  const calA = calendarOverlay(first, localNow);
  const calB = calendarOverlay(second, localNow);
  const decPalA = calA?.decade ? first.chart.palaces.find((p) => p.branch === calA.decade!.palaceBranch) : undefined;
  const decPalB = calB?.decade ? second.chart.palaces.find((p) => p.branch === calB.decade!.palaceBranch) : undefined;
  const decKeyA = decPalA ? normalizePalaceKey(decPalA.name) : '';
  const decKeyB = decPalB ? normalizePalaceKey(decPalB.name) : '';

  const aSummary = calA?.decade
    ? `${aDisplay} 当前虚岁 ${calA.nominalAge} 岁，正在走 ${calA.decade.startAge}–${calA.decade.endAge} 岁大限「${decPalA?.name || '本运宫'}」（主线围绕：${PALACE_OVERALL_AREA[decKeyA] || '当前十年课题'}）。`
    : `${aDisplay} 暂无大限年龄区间。`;
  const bSummary = calB?.decade
    ? `${bDisplay} 当前虚岁 ${calB.nominalAge} 岁，正在走 ${calB.decade.startAge}–${calB.decade.endAge} 岁大限「${decPalB?.name || '本运宫'}」（主线围绕：${PALACE_OVERALL_AREA[decKeyB] || '当前十年课题'}）。`
    : `${bDisplay} 暂无大限年龄区间。`;

  const outgoingPalaces = new Set(['官禄', '迁移', '财帛', '仆役']);
  const inwardPalaces = new Set(['田宅', '福德', '夫妻', '父母', '疾厄', '子女']);
  let combinedPlain = '这段时期建议每半年坐下来对一次生活近况与未来半年安排，让彼此始终知道对方脑子里在忙什么、盼什么。';
  if (decKeyA && decKeyB) {
    if (decKeyA === decKeyB) {
      combinedPlain = `很巧！两个人的这十年主题正好落在同一大类的「${decPalA?.name}」阶段（都在忙「${PALACE_OVERALL_AREA[decKeyA] || decKeyA}」），现阶段操心的事几乎同频，有共同目标时特别容易拧成一股绳，注意互相搭把手别一起瞎焦急。`;
    } else if (outgoingPalaces.has(decKeyA) && inwardPalaces.has(decKeyB)) {
      combinedPlain = `现阶段步调一动一静：${aDisplay} 这几年心思偏往外拼事业、赚钱、拓展圈子，而 ${bDisplay} 更渴望稳定生活、顾好家里与内心踏实感。如果没聊清楚，很容易变成一方嫌对方只顾着忙外头、另一方觉得怎么努力都不被理解——提前约好每周固定的“完全不谈工作陪伴时间”最见效。`;
    } else if (outgoingPalaces.has(decKeyB) && inwardPalaces.has(decKeyA)) {
      combinedPlain = `现阶段步调一静一动：${bDisplay} 正处在往外冲刺事业、跑动扩展的十年，而 ${aDisplay} 当前重心更偏向顾家安稳、整理生活质量与自身状态。把这视为自然分工（一个在外打仗、一个帮稳大后方，同时彼此定期报备近况并互相致谢），关系会格外牢靠。`;
    } else if (outgoingPalaces.has(decKeyA) && outgoingPalaces.has(decKeyB)) {
      combinedPlain = '眼下两个人都在忙着拼事业、见世面、开拓外部资源，生活像并肩冲锋的战友！干劲很足，但小心别把家熬成了“只回来睡觉的旅馆”，哪怕再忙也约好每周一顿关掉工作消息的安静晚饭。';
    } else {
      combinedPlain = '这几年两个人的主旋律都偏重生活品质、内心感受、家庭照料或个人休养调整。很适合放慢外头不必要的应酬消耗，把日子过扎实、经营家和自身健康。';
    }
  }

  const palaceRows: PalacePairRow[] = [
    '命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母',
  ].map((pName) => {
    const ka = normalizePalaceKey(pName);
    const oa = getObservedMajors(first.chart, pName);
    const ob = getObservedMajors(second.chart, pName);
    const aMaj = oa.observed.map((s) => `${s.name}${s.siHua ? `[${s.siHua}]` : ''}`).join('、') || '空宫无主星';
    const bMaj = ob.observed.map((s) => `${s.name}${s.siHua ? `[${s.siHua}]` : ''}`).join('、') || '空宫无主星';
    const aStyleP = classifyStyle(oa.observed.map((s) => s.name));
    const bStyleP = classifyStyle(ob.observed.map((s) => s.name));
    const hasOverlap = oa.observed.some((x) => ob.observed.some((y) => y.name === x.name));
    const plainNote = hasOverlap
      ? `有共同星曜「${oa.observed.filter((x) => ob.observed.some((y) => y.name === x.name)).map((x) => x.name).join('、')}」，在这块体会特别容易同频看懂对方。`
      : aStyleP === bStyleP
      ? `双方节奏靠近，在「${PALACE_OVERALL_AREA[ka] || pName}」上较易商量出共识。`
      : `各自着眼点一个偏重行动力/直观感受，一个偏重稳妥细致，做好分工更顺。`;

    return {
      name: pName,
      key: ka,
      aBranch: oa.palace ? BRANCH_NAMES[oa.palace.branch] : '—',
      bBranch: ob.palace ? BRANCH_NAMES[ob.palace.branch] : '—',
      aMajors: oa.borrowed ? `借参 ${aMaj}` : aMaj,
      bMajors: ob.borrowed ? `借参 ${bMaj}` : bMaj,
      aBorrowed: oa.borrowed,
      bBorrowed: ob.borrowed,
      plainNote,
    };
  });

  const practicalAdvice = [
    jiA ? jiA.practicalTip : '沟通中多看对方实际付出的好意，减少用预设去猜对方的动机。',
    jiB ? jiB.practicalTip : '尊重双方各自独处和保留自己朋友空间的合理需求，信任感会更踏实。',
    '遇到花钱、买房、见家长或工作换城市这类大事时，提前各自写下三条最在意的底线再坐下来聊，比临场赌气争论省心很多。',
    '多顺着彼此「化禄/化科」落入的顺手领域合作互补——一个人擅长的地方让他带着做，会比事事平均硬扛更容易越过越甜。',
  ];

  return {
    aName: aDisplay,
    bName: bDisplay,
    headline,
    chemistrySummary,
    strengthHighlights,
    watchHighlights,
    lifeSlices: [
      {
        id: 'communication',
        title: '沟通与吵架画风',
        summary: `${commA.desc}；而 ${commB.desc}。`,
        advice: commAdvice,
      },
      {
        id: 'moneyHome',
        title: '花钱习惯与居家分工',
        summary: `${describeMoneyHomeStyle(aDisplay, first.chart)} ${describeMoneyHomeStyle(bDisplay, second.chart)}`,
        advice: '建议家庭公共开销建透明共同账户，各自保留互不盘问的小额零花支配权，家务按“谁更不烦那件事谁主责”来分最不容易生怨气。',
      },
      {
        id: 'workCollab',
        title: '搭档协作 / 共事适合度',
        summary: `${describeWorkCollabStyle(aDisplay, first.chart)} ${describeWorkCollabStyle(bDisplay, second.chart)}`,
        advice: '如果考虑一起搞副业或合作项目，谁偏向开拓沟通就对外对接，谁偏向风控细节就负责把关收尾；同一件小事尽量别两个人都同时下场指挥。',
      },
    ],
    mutualAttraction: {
      aSeesB: checkAttractionDirection(aDisplay, bDisplay, first.chart, second.chart),
      bSeesA: checkAttractionDirection(bDisplay, aDisplay, second.chart, first.chart),
    },
    overlaysAToB,
    overlaysBToA,
    profiles: {
      a: buildPersonLoveProfile(aDisplay, first.chart),
      b: buildPersonLoveProfile(bDisplay, second.chart),
    },
    decadeSync: {
      aSummary,
      bSummary,
      combinedPlain,
    },
    practicalAdvice,
    palaceRows,
  };
}
