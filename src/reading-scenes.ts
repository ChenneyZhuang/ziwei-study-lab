import type { PalaceShierShen } from './core';
import { normalizePalaceKey } from './reading-knowledge';
import { STAR_PLAIN_PROFILES } from './reading-plain';
import type { Palace, Star } from './vendor/ziwei/types';

type RelatedItem = { label: string; palace: Palace };

const STAR_WORK_SCENE: Record<string, string> = {
  紫微: '团队遇到卡住拿不定主意的事时，大家常下意识看你表态或等你定方向',
  天机: '方案改了三版、别人理不清头绪时，你往往几分钟就能划出两三种备选思路',
  太阳: '一进新群或新项目就习惯先帮大家打通卡点、照应全局，很容易不知不觉扛很多责任',
  武曲: '谈项目先看预算、交付时间和实际 ROI，不喜欢听虚头巴脑的大饼承诺',
  天同: '喜欢轻松有人情味、不用整天剑拔弩张的工作气氛，一碰到恶意内卷立刻想撤退',
  廉贞: '既会抓规矩红线又懂得见什么人说什么话，公关协调与审美要求通常都很高',
  天府: '手里总喜欢留一手资源、备选名单和风险预案，天塌下来前先把自己和家人护稳',
  太阴: '最怕大嗓门催命连环 call，把资料、财务或设计需求留足安静时间给你打磨，成果极精细',
  贪狼: '同一段时间内很容易兼着主业＋兴趣副业＋跨界局，越是单调重复越呆不住',
  巨门: '听人汇报三句话就能抓出逻辑漏洞或潜台词，很靠语言沟通、提问追根和深度研究吃这碗饭',
  天相: '开会拉群时总成了两边都愿意信得过的“协调中间人”，极重视体面、契约和公平',
  天梁: '不管年纪大小，常被同事或晚辈拿来当“救火顾问”和值得托付的靠山',
  七杀: '接手烂摊子或紧急任务反而战意上来了，单兵推进速度快、极讨厌拖拖拉拉假客套',
  破军: '看不惯低效陈规，经常忍不住“干脆推倒重开一把”，越在变化革新赛道越出彩',
};

const STAR_MONEY_SCENE: Record<string, string> = {
  紫微: '花钱倾向于买“体感体面、牌子正、有掌控感”的好东西，平时正财靠职位与平台支撑',
  天机: '擅长用信息差、策划技能或灵活倒手赚钱，但也容易今天想学这个投资明天换个方向',
  太阳: '花钱对家人朋友很大方、经常请客或替身边人贴补，自己存钱得靠强制先锁起来',
  武曲: '正经赚钱与攒钱能力都不错，讲究付出和现金回流要实打实看到结果',
  天同: '只要手头够舒心生活，平时没那么爱苦哈哈加班攒死钱，花钱大多花在让自己开心舒服上',
  廉贞: '花钱看品味和社交体面，正经条理在行，怕在面子局或赌气消费时一下子花超',
  天府: '对“兜里有余粮”安全感极度敏感，擅长一点点把固定积蓄、房产或稳健资产垫厚',
  太阴: '喜欢细水长流地攒钱和配置家里长久用得到的资产，对乱冲高风险短线天生警惕',
  贪狼: '财路经常跟着人脉社交、多才多艺、兴趣变现或消费风口跑，容易有外快但也花得多',
  巨门: '挣钱多半吃“嘴巴、专业文字、谈判审核或细分知识”这口饭，花每一笔大钱前都得问个底朝天',
  天相: '钱路讲究名正言顺、契约清晰和专业服务分成，很适合做合规稳当的长期配置',
  天梁: '偏向吃资深经验、专业牌照或长辈资源照应这口稳定饭，偏财投机往往不如正经手艺赚得安稳',
  七杀: '挣钱像打突击战——看准机会敢重仓拼业绩或独当一面抢高分成，现金起伏也比坐班大',
  破军: '很难甘心一直只拿死工资，钱常先投进去闯一局新事物、装修或重开赛道后再滚雪球回来',
};

const STAR_LOVE_SCENE: Record<string, string> = {
  紫微: '嘴上未必多黏人，其实格外看重另一半在外面给不给你面子、心里拿不拿你当主心骨',
  天机: '谈起恋爱特别喜欢两个人在夜里天南地北聊天解闷，最受不了跟完全聊不到一块去的人硬凑',
  太阳: '喜欢光明磊落热情型或能照亮你生活的人，但太习惯自己操心照顾别人时，也要学会偶尔向对方示弱',
  武曲: '感情表达偏直给实用——少一点甜言蜜语，习惯直接替对方搞定现实麻烦事或掏腰包扛底',
  天同: '特别追求相处松弛、不吵架、窝在沙发吃好吃的幸福感，一冷战或被硬逼就会瞬间失温',
  廉贞: '对另一半的仪态分寸、细节诚实度要求很高，眼睛里揉不得模棱两可的敷衍敷衍',
  天府: '挑长期伴侣和过日子会现实看重可靠感、性格稳不稳以及生活规划踏不踏实',
  太阴: '对另一半微小的情绪变化特别敏感，需要对方温柔回应和日常记在心上，而不是敷衍说“你想太多”',
  贪狼: '容易被有趣、好看、有魅力或会玩新鲜花样的人吸引，哪怕在一起久了也盼着保持一点浪漫新鲜感',
  巨门: '爱一个人就想什么心里话都跟对方说透问清楚，最受不了敷衍冷暴力和藏着掖着不沟通',
  天相: '在乎两人外在登不登对、说话有没有礼貌体面，哪怕生气也不希望当着外人撕破脸',
  天梁: '要么容易吸引年纪心态比你成熟稳重的人照应你，要么你在关系里不自觉扮演处处包容操心的那一方',
  七杀: '爱憎干脆利落，喜欢就直接热烈、不合适绝不拖泥带水，相处中最忌讳被猜忌或黏腻控制',
  破军: '要么不动心，一遇到强烈动心的人就愿意轰轰烈烈替对方打破原本规划；需要各自保留一点喘息空间',
};

const AUX_PLAIN_GLOSS: Record<string, string> = {
  左辅: '代表同辈帮手与团队协作助力——说明你不用一个人闷头硬扛，多找靠谱队友或外援事半功倍',
  右弼: '代表私下协调与灵活斡旋助力——遇卡点常有人居中搭桥缓和关系（唯独在感情宫忌留下暧昧空间）',
  文昌: '代表逻辑文字、考运契约与条理性——写材料、考证、走白纸黑字的正规流程往往比瞎撞更顺',
  文曲: '代表口才表达、艺术审美与随机应变——很吃灵感和表现力，但也易多愁善感',
  天魁: '代表明面上的长辈贵人与关键机会——每到紧要关头容易出现指路前辈或平台推你一把',
  天钺: '代表暗地里雪中送炭的好缘分——很多机会和解围来得安静自然，越礼貌待人越受照顾',
  禄存: '像自带一只稳当小存钱罐——能帮这个领域稳住资源与退路，但行事偏谨慎保守、防周围嫉妒竞争',
  天马: '代表“动起来就活了”——出门、换城市、跑客户或换个动作就能打破眼前的沉闷停滞',
  擎羊: '性格或动作里的“瞬间爆发力与直爽刀刃”——推进极快不怕得罪人，务必在话到嘴边和签约前冷三秒',
  陀罗: '“原地反复揉搓打转”——好处是够执着能磨出深功夫，缺点是一旦纠结起来最耗时间精神',
  火星: '“急性小爆脾气与突发行动力”——来得快去得快，适合抢急活突击，千万别上头那天发消息拍板',
  铃星: '“心里暗暗记账的耐力与闷火”——平时表面克制，实则心细记深，别独自攒太多不爽突然一次翻总账',
  地空: '“想得太高太飘，落地少算半步”——脑洞灵感和精神品味绝佳，花钱或做实务计划记得打八折留兜底',
  地劫: '“半路突然断链或意料外破耗”——越靠精确死预算的事越要留后备金，适合用创意破局代替重资产押注',
  天刑: '自带“规矩尺子、自律感与原则底线”——极其适合制度审查、专业规范或技术自律，别拿挑剔尺度去抠日常亲友',
  天姚: '代表审美情调、好感眼缘与浪漫吸引力——做事带魅力和好客气质，面对烂桃花记得保持理智边界',
  红鸾: '带来真挚喜庆缘分、好面相与情感热络度——也容易让人对你第一眼先产生好感',
  天喜: '偏轻松、乐观与社交喜气——遇事往往自带一分笑声和解套缓冲氛围',
  孤辰: '习惯留一块谁也不让进的精神自留地——不是人冷漠，而是需要独处才能真正把电量充回来',
  寡宿: '哪怕在人群或家庭里也常保留一半冷静旁观——尊重自己的安静需求，反而活得最舒服透亮',
  咸池: '增强个人审美气质、感性魅力和情绪感染力——把这股敏感放到创作与社交表达上极加分',
  截空: '像半路突然挡一道“暂停提醒牌”——看似节奏被打断，其实常顺便帮你截住一些没必要硬冲的坑',
  旬空: '让原本特别硬的棱角变空透几分——减少死磕面子与执念，心态反倒能放平一些',
};

const SHIER_PLAIN: Record<string, string> = {
  // 博士十二神 / 岁前十二神 / 将前十二神
  博士: '聪明有想法、爱钻研细节，善于靠知识与思路解决问题',
  力士: '掌权担责或实干冲劲，适合挑实质担子干实活',
  青龙: '动起来见喜气、利于工作转机与贵人提携',
  小耗: '日常容易有计划外零碎小花销或精力琐碎消耗，立清预算最稳',
  将军: '做事讲究干脆推进力、有点要面子和霸气，记住收放分寸',
  奏书: '跟文书合同、申报审批、书面条文相关时往往比较顺畅得力',
  飞廉: '易传风言风语或招眼红嘴碎，管住情绪少接无谓口舌最明智',
  喜神: '带来轻松善意和好事缓冲，遇紧张事多有缓和余地',
  病符: '提醒留意身体作息透支、慢下来体检补觉，别一直撑着硬扛',
  大耗: '资金或时间容易一次性花得比较大，大额变动与签约务必反复核清单',
  伏兵: '容易出现暗地里没事先说透的小麻烦或小人别扭，关键沟通尽量书面确认',
  官符: '提醒涉及规则、手续、报税或正式合同务必要依法依规留底',
  岁建: '属于当值“总枢纽”位置，牵动较多实际事务得失',
  岁破: '变动感强、旧做法易打破，宜顺势微调而别死杠不变',
  龙德: '自带一股遇事能化解兜底的贵人好运',
  天德: '逢凶化吉、长辈或正气助力明显，遇困难多得善缘解围',
  白虎: '行动急锐但防血光碰伤或硬碰硬争执，出门驾车及用刀火多小心',
  吊客: '内心易感伤低落或家里长辈健康耗神，抽空陪家人与调节心情最重要',
  将星: '带领导坐镇气象，关键时刻撑得起场面、扛得起大任',
  攀鞍: '名声考试升迁或借前辈平台迈上一格的机会较好',
  岁驿: '奔波外出与调动搬迁象意明显，跑动反能撞见新出路',
  息神: '节奏偏缓、想停下来歇一歇整理思路，别硬逼自己每天满负荷',
  华盖: '天生带清高审美、独立思考与文艺哲学气质，独处时最有灵气',
  亡神: '容易分心丢三落四、拿不定主意时犯糊涂，重要东西和密钥备份好',
};

const PALACE_SCENE_DOMAIN: Record<string, string> = {
  命宫: '平时的待人接物、拿主意反应',
  兄弟: '跟手足死党、平级搭档相处与资金调动',
  夫妻: '谈恋爱、婚姻日常和核心伴侣互动',
  子女: '带孩子、指导年轻晚辈和个人兴趣消遣',
  财帛: '挣钱路子、平时花钱和存钱节奏',
  疾厄: '作息压力、疲劳信号和身体调养',
  迁移: '出门见人、换新环境发展或给人第一印象',
  仆役: '朋友圈筛选、团队下属协作与人情往来',
  官禄: '每天上班做事风格、项目执行和岗位角色',
  田宅: '家里生活气氛、室友/家人共居和买房攒家底',
  福德: '下班关上门后真正的开心度与抗焦虑能力',
  父母: '见父母长辈、直属老板汇报与考试/资质手续',
};

/**
 * Synthesize 3 concrete everyday scenarios dynamically per palace/topic.
 */
export function buildConcreteScenes({
  palace,
  observed,
  borrowed,
  strongCount,
  weakCount,
  siHuas,
  luckyNames,
  shaNames,
}: {
  palace: Palace;
  observed: Star[];
  borrowed: boolean;
  strongCount: number;
  weakCount: number;
  siHuas: { name: string; siHua: string }[];
  luckyNames: string[];
  shaNames: string[];
}): string[] {
  const key = normalizePalaceKey(palace.name);
  const first = observed[0];
  const second = observed[1];
  const firstProfile = first ? STAR_PLAIN_PROFILES[first.name] : undefined;
  const scenes: string[] = [];

  // Scene 1: Concrete behavioral snapshot from the primary star + domain
  if (first) {
    const firstKeyLife = firstProfile?.palaces[key]?.life || firstProfile?.strength;
    const secondKeyLife = second ? STAR_PLAIN_PROFILES[second.name]?.palaces[key]?.life : undefined;
    if (key === '官禄' || key === '迁移' || key === '父母') {
      scenes.push(
        `日常画面一（做事与外部舞台）：在「${PALACE_SCENE_DOMAIN[key]}」上，${
          STAR_WORK_SCENE[first.name] || firstKeyLife || '你通常会按照自己的节奏先摸清门道再推进'
        }${second ? `；同时还带点「${second.name}」的影子——${STAR_WORK_SCENE[second.name] || secondKeyLife || '兼顾另一条补充能力'}。` : '。'}${
          borrowed ? '因为属于对宫借星，放在不同平台或合作氛围里，表现跨度会比别人大得多。' : ''
        }`,
      );
    } else if (key === '财帛' || key === '田宅' || key === '兄弟') {
      scenes.push(
        `日常画面一（用钱与资源手感）：落实在「${PALACE_SCENE_DOMAIN[key]}」时，${
          STAR_MONEY_SCENE[first.name] || firstKeyLife || '用钱往往有自己的一套实用考量'
        }${second ? `，再配合「${second.name}」让人在留存与流动之间更有层次感。` : '。'}${
          borrowed ? '借星特质说明身边朋友或环境氛围对你这块花钱攒钱习惯影响很大。' : ''
        }`,
      );
    } else if (key === '夫妻' || key === '子女' || key === '仆役') {
      scenes.push(
        `日常画面一（相处气场与互动）：放在「${PALACE_SCENE_DOMAIN[key]}」中，${
          STAR_LOVE_SCENE[first.name] || firstProfile?.relation || firstKeyLife || '更看重交流时的真诚与自在感'
        }${second ? `，再加上「${second.name}」的反差，让熟悉前后看到的样子挺丰富立体。` : '。'}`,
      );
    } else {
      scenes.push(
        `日常画面一（真实本能反应）：遇到「${PALACE_SCENE_DOMAIN[key]}」相关事情时，${
          firstKeyLife || firstProfile?.strength || '你往往有自己一套稳定的判断和回血方式。'
        }${second ? ` 外加「${second.name}」的特质叠加，遇事常常要在两种冲动之间权衡一会儿。` : ''}`,
      );
    }
  } else {
    scenes.push(
      `日常画面一（环境共振型）：因为本宫和对宫均无主星，你在「${PALACE_SCENE_DOMAIN[key]}」上像一块极好的海绵——跟积极靠谱、规矩清爽的人搭档，成长惊人；待在混乱内耗环境里也很容易被带偏，所以“选场域”就是你的核心能力。`,
    );
  }

  // Scene 2: Friction / Stress / Brightness / SiHua reality check
  const siHuaPart = siHuas.length
    ? siHuas
        .map((s) =>
          s.siHua === '禄'
            ? `「${s.name}化禄」带来这块天生较顺手、容易遇到现成甜头与好机会`
            : s.siHua === '权'
            ? `「${s.name}化权」让你在此不甘心被动等待，习惯主动出手管到底、扛起拍板责任`
            : s.siHua === '科'
            ? `「${s.name}化科」让你在此讲究专业口碑与体面协商，关键时懂得按章办事、化解僵局`
            : `「${s.name}化忌」把敏感放大镜对准这里——越在乎越觉得不够完美、容易自己反复琢磨卡死`,
        )
        .join('；')
    : '';

  const energyPart =
    strongCount > 0 && weakCount === 0
      ? '主星位置亮堂顺手，优点不容易藏着掖着，该发力的时候使得出劲来。'
      : weakCount > 0
      ? '因为星曜处在偏内敛吃力的位置，起头常得靠自己多摸几遍、先把底层笨功夫练扎实，后期才显出耐力反超。'
      : '星曜能量中等温和，重在靠长期习惯把它往好的方向固定下来。';

  scenes.push(
    `日常画面二（顺畅与卡点）：在「${PALACE_SCENE_DOMAIN[key]}」里，${
      siHuaPart ? `${siHuaPart}；` : ''
    }${energyPart}`,
  );

  // Scene 3: Lucky + Sha practical lever
  const shaTip = shaNames.length
    ? `遇到同宫「${shaNames.join('、')}」时，最容易在着急、熬夜或赌气那十分钟里做错决定——习惯性先停一停、把关键条件写进备忘再回消息。`
    : '本宫没带硬碰硬的急性煞星干扰，节奏相对从容，别因为太安稳而拖延改换习惯。';

  const luckyTip = luckyNames.length
    ? `好消息是身边伴着「${luckyNames.join('、')}」帮忙：越主动用协作、白纸黑字或向外请教，路子比闷头单干宽很多。`
    : '平时记得主动找一两个和你互补靠谱的前辈、好友定期对齐思路，省得一个人瞎琢磨。';

  scenes.push(`日常画面三（实操避坑与杠杆）：${luckyTip}${shaTip}`);

  return scenes;
}

/**
 * Plain-language bullet breakdown of every non-major star & 12-Shen present in this palace.
 */
export function buildAuxPlainHighlights(palace: Palace, shier?: PalaceShierShen): string[] {
  const highlights: string[] = [];
  const seen = new Set<string>();

  for (const s of palace.stars) {
    if (s.type === 'major' || seen.has(s.name)) continue;
    const gloss = AUX_PLAIN_GLOSS[s.name];
    if (gloss) {
      seen.add(s.name);
      highlights.push(`${s.name}：${gloss}`);
    }
    if (highlights.length >= 5) break;
  }

  if (palace.selfSihua && palace.selfSihua.length > 0) {
    const mapWord: Record<string, string> = {
      禄: '容易在这里主动示好、花出去分享或随手带出机会',
      权: '在这里很容易自己加压、想说了算一把抓',
      科: '遇到这里的事爱顾全颜面、讲求体面收尾',
      忌: '有时不知不觉自己跟自己过不去或无意间把机会推走，事后记得复盘止损',
    };
    highlights.push(
      `宫干自化（${palace.selfSihua.map((x) => `${x.starName}自化${x.siHua}`).join('、')}）：${palace.selfSihua
        .map((x) => mapWord[x.siHua] || '')
        .filter(Boolean)
        .join('；')}。`,
    );
  }

  if (shier) {
    const shenItems = [
      shier.boshi && SHIER_PLAIN[shier.boshi] ? `博士神「${shier.boshi}」：${SHIER_PLAIN[shier.boshi]}` : '',
      shier.suiqian && SHIER_PLAIN[shier.suiqian] ? `岁前神「${shier.suiqian}」：${SHIER_PLAIN[shier.suiqian]}` : '',
      shier.jiangqian && SHIER_PLAIN[shier.jiangqian] ? `将前神「${shier.jiangqian}」：${SHIER_PLAIN[shier.jiangqian]}` : '',
    ].filter(Boolean);
    if (shenItems.length > 0) {
      highlights.push(shenItems.slice(0, 2).join('；'));
    }
  }

  return highlights;
}

/**
 * Plain-language summary explaining how this palace interacts with its 三方四正 (opposite + tri-harmony).
 */
export function buildSanfangPlainNote(
  palace: Palace,
  related: RelatedItem[],
  borrowed: boolean,
): string {
  const opposite = related.find((r) => r.label === '对宫')?.palace;
  const tri = related.filter((r) => r.label === '三合位').map((r) => r.palace);
  const domain = PALACE_SCENE_DOMAIN[normalizePalaceKey(palace.name)] || palace.name;

  const oppDesc = opposite
    ? `对面的「${opposite.name}」像一面镜子也是外部出口——你在「${domain}」上会遭遇什么样的外界反馈，往往顺着「${opposite.name}」表现出来`
    : '';
  const triDesc =
    tri.length === 2
      ? `；左右斜对角的「${tri[0].name}」和「${tri[1].name}」则像两条输送补给的管道，平时这三块地方往往一顺俱顺、一卡都卡`
      : '';
  const emptyHint = borrowed ? '。尤其因为本宫无主星，更要连着对面与三方合起来看才完整。' : '。看懂这组联动，就知道为什么调整好其中一块常常能带动另一块一起转顺。';

  return `${oppDesc}${triDesc}${emptyHint}`.replace(/^；/, '');
}
