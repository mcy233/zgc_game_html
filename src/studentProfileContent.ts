import type { GameState, Milestone } from './types';
import { BZA } from './schoolBranding';
import { generateRandomPlayerName } from './playerName';
import { resolveProfileHeadline } from './profileHonors';
import { getResearchBulletsForPhase, type ResearchInterestPhase } from './researchInterestGroups';

/** 首页个人主页卡片：学术主页式分块，少叠「我」字，语气可诙谐 */
export type StudentProfileCard = {
  /** 玩家随机中文姓名（与顶栏大标题一致） */
  playerName: string;
  /** 年级、单位、方向（不含阶段） */
  roleLinePrimary: string;
  /** 当前培养阶段，单独一行展示 */
  stageLine: string;
  /** 顶栏小字：当前称号（无后缀） */
  headline: string;
  /** 一两句话综述：多为第三人称或话题主语开头 */
  bioBlurb: string;
  contactEmail: string;
  contactRoom: string;
  educationLines: string[];
  researchBullets: string[];
  /** 「论文与投稿」正文 */
  publicationsText: string;
  quote: string;
};

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromState(state: GameState): number {
  const cit = Math.floor(state.citations / 20);
  const rep = Math.floor(state.reputation / 12);
  const cr = Math.floor(state.credits / 6);
  const san = Math.floor(state.sanity / 22);
  const mis = Math.floor(state.misconduct / 18);
  const s = `${state.milestone}|${state.quarter}|${state.papersPublished}|${cit}|${rep}|${cr}|${san}|${mis}|${state.hasAdvisor ? 1 : 0}|${state.advisorType}|${state.year}|${state.submittedPapers}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(arr: readonly T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)]!;
}

type Phase =
  | 'CHOOSING_ADVISOR'
  | 'COURSE'
  | 'PROPOSAL'
  | 'MIDTERM'
  | 'THESIS'
  | 'DEFENSE'
  | 'GRADUATED'
  | 'DROPPED';

function resolvePhase(m: Milestone): Phase {
  if (m === '导师选择') return 'CHOOSING_ADVISOR';
  if (m === '课程学习') return 'COURSE';
  if (m === '开题准备') return 'PROPOSAL';
  if (m === '开题报告') return 'MIDTERM';
  if (m === '中期考核') return 'MIDTERM';
  if (m === '论文撰写') return 'THESIS';
  if (m === '毕业答辩') return 'DEFENSE';
  if (m === '顺利毕业') return 'GRADUATED';
  return 'DROPPED';
}

const YEAR_GRADE_CN = ['一', '二', '三', '四'] as const;

function buildRoleLineParts(state: GameState, phase: Phase): { primary: string; stageLine: string } {
  const base = `${BZA.short} · ${BZA.focus}`;
  const stage = state.milestone;
  if (phase === 'GRADUATED') {
    return { primary: `已获得博士学位 · ${base}`, stageLine: `阶段：${stage}` };
  }
  if (phase === 'DROPPED') {
    return { primary: `培养轨迹已结束 · ${base}`, stageLine: `最后阶段：${stage}` };
  }
  const y =
    state.year >= 1 && state.year <= YEAR_GRADE_CN.length
      ? YEAR_GRADE_CN[state.year - 1]!
      : String(state.year);
  return { primary: `博士生${y}年级 · ${base}`, stageLine: `当前阶段：${stage}` };
}

/** 综述段：第三人称 / 无主语句为主，偶尔一句自嘲 */
const BIO_BLURB_BY_PHASE: Record<Phase, readonly string[]> = {
  CHOOSING_ADVISOR: [
    `现为${BZA.name}直博培养对象，研究方向锚定在${BZA.focus}。正处于导师双选与选题收敛期，日常在「邮件已读不回」与「走廊偶遇尬聊」之间练习社交韧性。`,
    `学籍注册于${BZA.short}，关注机器学习与交叉落地。近期主要产出是组会旁听笔记和越来越厚的文献文件夹，课题主线尚在加载中。`,
    `直博身份已激活，领域标签为${BZA.focus}。当前任务是把想法翻译成可答辩的句子，顺便确认哪位导师愿意签收这份长期快递。`,
  ],
  COURSE: [
    `第 __YEAR__ 学年直博在读，培养单位${BZA.name}，方向${BZA.focus}。课表与机房两点一线，营养结构以课件 PDF 与咖啡因为主，偶尔插入食堂。`,
    `直博第 __YEAR__ 学年，主攻${BZA.focus}。核心课与实验并行推进，长期目标是让「作业能交」和「论文能投」尽量指向同一套代码。`,
    `在${BZA.short}接受项目制培养，研究兴趣横跨算法与交叉应用。`,
  ],
  PROPOSAL: [
    `开题准备阶段在读博士生，课题围绕${BZA.focus}展开。技术路线与可行性说明持续迭代，文件夹命名已进化到「最终版_再改剁手」形态。`,
    `学籍${BZA.short}，正冲刺开题节点。创新点叙事与对照实验同步施工，力求每一句「我们提出」背后都找得到脚本文件名。`,
  ],
  MIDTERM: [
    `中期考核前后阶段的${BZA.focus}方向博士生。阶段材料与投稿邮件共享同一块日历，心态与图表坐标轴一样需要定期校准。`,
    `已通过开题，正面对中期清单。数据口径与复现说明写进附录，方便委员会提问时当场指到行号而不是指到运气。`,
  ],
  THESIS: [
    `学位论文撰写中，主题${BZA.focus}。全篇符号与色板正在统一，致谢草稿情感充沛，讨论章节则努力在诚实与体面之间走钢丝。`,
    `大论文密集写作期，键盘 Enter 磨损明显。目标是在截止日期前把故事讲圆，并把「未来工作」控制在谦虚而非逃责的剂量。`,
  ],
  DEFENSE: [
    `毕业答辩筹备中，研究${BZA.focus}。PPT 备注栏写满战术性喝水点，预演次数与心率曲线呈弱相关。`,
    `临近学位授予流程，材料按学院清单自检多轮。核心诉求是让委员听懂贡献边界，而不是纠结封面是不是学院模板色。`,
  ],
  GRADUATED: [
    `已于${BZA.name}取得博士学位，攻读方向${BZA.focus}。学生邮箱即将失效，但备份硬盘与肌肉记忆长期有效。`,
    `博士阶段收官，课题标签${BZA.focus}。毕业证像一张通关截图，下一关的加载动画还在转圈。`,
  ],
  DROPPED: [
    `培养轨迹在${BZA.short}提前结束，曾涉足${BZA.focus}相关训练。档案句短，经历未必短，后续章节自填。`,
  ],
};

function bioBlurbForPhase(phase: Phase, year: number, rnd: () => number): string {
  const pool = BIO_BLURB_BY_PHASE[phase];
  const raw = pick(pool, rnd);
  return raw.replace('__YEAR__', String(year));
}

/** 个人签名每隔若干游戏季度轮换一块，块内稳定、跨块重新抽选 */
const SIGNATURE_BLOCK_QUARTERS = 3;

function signatureBlockSeed(state: GameState): number {
  const q = Math.max(1, state.quarter);
  const block = Math.floor((q - 1) / SIGNATURE_BLOCK_QUARTERS);
  const s = `signature|${block}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const QUOTES: readonly string[] = [
  `科研很神圣，全人类未来也要顾（但这一章今晚得保存）。`,
  `相信 reproducibility，除了昨天那次怎么都复现不出来那次。`,
  `Related Work 的精髓：客气地说别人很强，含蓄地说自己更强一点。`,
  `Related Work 的本质是：礼貌地说明「他们很棒，但我更棒」。`,
  `拒稿不是否定，是免费加强版审稿，学会这么想睡眠质量会好半格。`,
  `开题理想态：导师觉得饼能吃，自己知道饼得烤熟，别只停在 PPT 香气。`,
  `博士必修课之一：把焦虑排版成 checklist，再假装勾选能带来控制感。`,
  `熬夜可以解释为与全球审稿时区对齐，只要心脏同意这个时区。`,
  `失败实验不可怕，可怕的是失败得没有故事可写进附录。`,
  `致谢名单很长，心里最先感谢的常是那台还在跑的服务器。`,
  `所谓极交叉：多会一点，锅就少背一点，汇报也多一页。`,
  `组会把进度摊开，也把压力摊开，属于合法的情绪公摊。`,
  `毕业那天删掉签名里的「在读」，空落落里夹着一点爽。`,
  `Abstract 的艺术：用最少的字让人以为你已经做完了全部实验。`,
  `Introduction 像相亲简介：既要真诚，又不能把底牌全亮。`,
  `Discussion 的潜台词：我知道不完美，但请你假装没看出来。`,
  `跑不通就调参，调参不行就换 seed，再不行就写进 limitation。`,
  `显卡风扇的呼啸，是当代博士生最接近海风的白噪音。`,
  `论文被拒那天，宜吃顿好的；论文中了那天，宜把致谢里画的大饼兑现一点点。`,
  `理想科研作息存在，主要存在于 README 和导师的期望里。`,
  `代码能跑就不要问为什么能跑，问多了容易变成哲学系旁听生。`,
  `引用数涨一格的快乐，约等于外卖准时到达的快乐，短暂但真实。`,
];

const QUOTES_DEFENSE_EXTRA: readonly string[] = [
  `答辩台上每句话都是过去几年深夜的压缩包，解压时请按顺序。`,
  `委员点头瞬间会闪回第一次进机房手心的汗，神经回路还是同一套。`,
];

function buildPublicationsText(state: GameState, phase: Phase): string {
  const p = state.papersPublished;
  const c = state.citations;
  const sub = state.submittedPapers;
  const parts: string[] = [];

  if (phase === 'DROPPED') {
    return `论文与培养节点未走完，曾在${BZA.focus}方向积累部分稿件与实验记录，后续若重返学术线再单独更新本栏。`;
  }

  if (p <= 0) {
    parts.push(
      `正式发表：暂无。首篇工作仍在打磨，引用统计为零属于正常开局，不是系统 bug。`
    );
  } else if (p === 1) {
    parts.push(`正式发表：1 篇。相关工作累计被引用约 ${c} 次（数据库更新会导致数字轻微抖动）。`);
  } else {
    parts.push(`正式发表：累计 ${p} 篇。引用约 ${c} 次，故事线仍在同一条主线上延伸。`);
  }

  if (sub > 0) {
    parts.push(`在审稿件：${sub} 篇，流程含大修、小修以及「邮件假装掉线」等经典关卡。`);
  }

  if (state.credits >= 30) {
    parts.push(`学分：培养方案 30 分已修满，课表栏可从「求生」切到「点缀」。`);
  } else {
    parts.push(`学分：已修 ${state.credits}/30，课表与实验共享同一条时间轴。`);
  }

  if (state.hasAdvisor) {
    parts.push(`合作与指导：${state.advisorName}课题组，日常科研以组内讨论与分任务执行为主。`);
  }

  if (phase === 'THESIS' || phase === 'DEFENSE') {
    parts.push(`当前阶段：${state.milestone}，精力优先拨给学位论文与答辩材料。`);
  }

  if (phase === 'GRADUATED') {
    parts.push(`学位：已通过答辩并取得博士学位，本栏可视为静态快照。`);
  }

  return parts.join('');
}

function educationLinesFor(state: GameState, phase: Phase, rnd: () => number): string[] {
  const uni = pick(['某理工大学', '某综合大学', '某信息科技大学', '某交通大学'], rnd);
  const entry = 2026;
  const bsStart = entry - 4;
  const lines: string[] = [
    `${bsStart}–${entry}  工学学士  ${uni}  毕设与如今课题的关系≈远房表亲`,
    `${entry}–至今  工学博士（直博）  ${BZA.name}  导师：${state.hasAdvisor ? state.advisorName : '双选中'}`,
  ];
  if (phase === 'GRADUATED') {
    lines.push(`学位：博士（已授予）  论文题目对外统称「能过审的那版」`);
  }
  return lines;
}

const EMAIL_LOCAL_A = [
  'yinghao.tao',
  'xinyue.li',
  'zihan.chen',
  'muchen.wang',
  'yitong.zhang',
  'ziqi.song',
  'haoran.jia',
  'keyi.guo',
  'rui.zhou',
  'anqi.he',
  'borui.xu',
  'shihan.ma',
];

const EMAIL_LOCAL_B = ['phd', 'grad', 'lab', 'stu', 'ai', 'bza'];

function buildContactEmail(rnd: () => number): string {
  const a = pick(EMAIL_LOCAL_A, rnd);
  const b = pick(EMAIL_LOCAL_B, rnd);
  const n = Math.floor(rnd() * 90) + 10;
  if (rnd() < 0.45) return `${a}@baz.edu.cn`;
  return `${a}.${b}${n}@baz.edu.cn`;
}

const BUILDING_CODES = ['C5', 'C8', 'C9'] as const;

function buildContactRoom(rnd: () => number, quarter: number, year: number): string {
  const code = BUILDING_CODES[Math.floor(rnd() * BUILDING_CODES.length)]!;
  const floor = 1 + ((quarter + year * 2) % 4);
  const room = 10 + ((quarter * 7 + year * 11) % 90);
  return `${code}-${floor}${String(room).padStart(2, '0')} 工位`;
}

export function buildStudentProfile(state: GameState): StudentProfileCard {
  const phase = resolvePhase(state.milestone);
  const rnd = mulberry32(seedFromState(state));

  const playerName =
    state.playerName && state.playerName.trim().length > 0
      ? state.playerName.trim()
      : generateRandomPlayerName();
  const { primary: roleLinePrimary, stageLine } = buildRoleLineParts(state, phase);
  const headline = resolveProfileHeadline(state);
  const bioBlurb = bioBlurbForPhase(phase, state.year, rnd);
  const educationLines = educationLinesFor(state, phase, rnd);
  const researchBullets = getResearchBulletsForPhase(state.researchInterestGroup, phase as ResearchInterestPhase);
  const publicationsText = buildPublicationsText(state, phase);
  const quotePool =
    phase === 'DEFENSE' || phase === 'GRADUATED' ? [...QUOTES, ...QUOTES_DEFENSE_EXTRA] : QUOTES;
  const quoteRnd = mulberry32(signatureBlockSeed(state));
  const quote = pick(quotePool, quoteRnd);

  const contactEmail =
    state.playerContactEmail && state.playerContactEmail.trim().length > 0
      ? state.playerContactEmail.trim()
      : buildContactEmail(rnd);
  const contactRoom =
    state.playerOfficeRoom && state.playerOfficeRoom.trim().length > 0
      ? state.playerOfficeRoom.trim()
      : buildContactRoom(rnd, state.quarter, state.year);

  return {
    playerName,
    roleLinePrimary,
    stageLine,
    headline,
    bioBlurb,
    contactEmail,
    contactRoom,
    educationLines,
    researchBullets,
    publicationsText,
    quote,
  };
}

export function studentProfileToPlainText(card: StudentProfileCard): string {
  return [
    card.playerName,
    card.headline,
    `${card.roleLinePrimary} ${card.stageLine}`,
    card.bioBlurb,
    `教育：${card.educationLines.join(' ')}`,
    `研究：${card.researchBullets.join(' ')}`,
    card.publicationsText,
    card.quote,
  ].join(' ');
}
