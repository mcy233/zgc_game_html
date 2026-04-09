import type { GameState, Milestone } from './types';
import { BZA } from './schoolBranding';

/** 首页「个人简介」卡片：多段叙事 + 随培养阶段与成果变化 */
export type StudentProfileCard = {
  headline: string;
  intro: string;
  researchBullets: string[];
  labDiaryBullets: string[];
  achievements: string;
  quote: string;
  contactEmail: string;
  contactRoom: string;
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

function pickMany<T>(arr: readonly T[], rnd: () => number, count: number, dedupe = true): T[] {
  const ix = new Set<number>();
  const out: T[] = [];
  const n = Math.min(count, arr.length);
  let guard = 0;
  while (out.length < n && guard++ < 50) {
    const i = Math.floor(rnd() * arr.length);
    if (dedupe && ix.has(i)) continue;
    ix.add(i);
    out.push(arr[i]!);
  }
  return out;
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

/** 开篇：第一人称简介体 */
const FORMAL_INTRO_BY_PHASE: Record<Phase, readonly string[]> = {
  CHOOSING_ADVISOR: [
    `我是${BZA.name}直博生，主攻${BZA.focus}。目前正在参加导师双选，也在把课题问题想得更具体一些，希望尽快进组后能把路线跑通。`,
    `我本科毕业后直博进入${BZA.short}，研究兴趣在机器学习与交叉应用。现阶段以了解各课题组与补齐基础为主，想找到既契合学院方向也适合自己长跑的题目。`,
    `我在${BZA.name}注册直博学籍，方向是${BZA.focus}。正在和几位意向导师沟通研究设想，也希望能在项目制培养里做出能写进论文而不是只写进周报的进展。`,
    `我是${BZA.short}一年级直博生，关注${BZA.focus}。导师尚未确定，但我已经系统旁听组会并读完几篇领域综述，接下来想把想法落实成可验证的实验。`,
    `我攻读${BZA.name}博士学位，课题围绕${BZA.focus}展开。当前重点是走好培养环节并与导师组建立信任，早日拿到一条清晰的论文主线。`,
    `我通过直博渠道进入${BZA.short}，长期想做可发表的交叉工作。眼下在收敛选题与选导，也希望在学院「三极」科研理念下找到自己的立足点。`,
  ],
  COURSE: [
    `我是${BZA.name}直博生（第 ${0} 学年），研究方向为${BZA.focus}。我在按培养方案修核心课，同时每周留出固定时间在实验室练手，想把理论和平台能力一起补齐。`,
    `我在${BZA.short}直博就读，聚焦${BZA.focus}。课表和组里事务我会并行推进，也希望早点修满学分节点，把更多精力留给后面的开题和大论文。`,
    `我就读于${BZA.name}，研究面向${BZA.focus}。这阶段我主要以课程学习和文献积累为主，也会把课程大作业当成提前演练论文写作的场合。`,
    `我是${BZA.short}项目制博士生，方向${BZA.focus}。我在完成培养方案要求的课程，同时尽量让课内成绩和组内产出不要互相拖后腿。`,
    `我在${BZA.name}直博培养中，关注${BZA.focus}。课程和实验我都在跟，等学分节点达标后我打算把主线课题再往前推一大步。`,
    `我在${BZA.short}读博，领域是${BZA.focus}。我重视统计与系统方面的训练，目标是能独立把一条实验链从数据到图表完整跑通。`,
  ],
  PROPOSAL: [
    `我是${BZA.name}直博生，研究${BZA.focus}，正处在开题准备阶段。我在完善技术路线和可行性说明，也希望开题通过后能把贡献点写进可检验的实验而不是空话。`,
    `我在课题组做${BZA.focus}相关课题，开题材料还在迭代。我想把创新点讲清楚，同时让每一句「我们做了什么」背后都有对应实验支撑。`,
    `我的学籍在${BZA.short}，主攻${BZA.focus}。眼下重点是完成开题报告和预答辩，委员会认可路线后我打算全力进入系统实验阶段。`,
    `我聚焦开题环节，方向是${BZA.focus}。文献和初步实验已经对假设做了交叉验证，接下来我想把能讲的故事落成能跑的代码和能画的图。`,
    `我是${BZA.name}直博生，课题落在${BZA.focus}交叉方向。开题前我在补对比实验和风险分析，想一次性把节点踩实，少返工。`,
    `我在${BZA.short}准备开题，课题围绕${BZA.focus}。我希望通过后能获得更稳定的算力与数据支持，把主线工作推进到可投稿状态。`,
  ],
  MIDTERM: [
    `我是${BZA.name}直博生，方向${BZA.focus}，已进入中期考核相关阶段。我在并行推进论文和阶段材料，也想中期一次过关后把节奏转到大论文长线。`,
    `我聚焦${BZA.focus}并完成开题。现在按学院要求整理中期成果，我会用已发表论文和完整实验闭环来回应委员会的关切。`,
    `我在${BZA.short}研究${BZA.focus}。中期前我在统一数据口径和复现脚本，希望材料里每张图被追问时我都能当场指到对应脚本行。`,
    `我以中期考核为阶段性目标，课题属于${BZA.focus}。检查通过后我想把节奏从「补洞」切换成「冲刺产出」。`,
    `我是${BZA.name}博士生，方向${BZA.focus}。我在汇总阶段论文与项目证明，希望中期评议成为分水岭而不是无限补丁循环。`,
    `我在${BZA.short}推进${BZA.focus}课题，临近中期。我想用清晰的总结和可展示进展，换后面更集中的写作窗口。`,
  ],
  THESIS: [
    `我是${BZA.name}直博生，正在撰写学位论文，课题方向${BZA.focus}。我按章节推进书稿和图表统一，也想按时拿出可送审的终稿并留足答辩打磨时间。`,
    `我进入大论文密集写作期，研究围绕${BZA.focus}。我想把各章串成一条完整证据链，而不是各写各的最后硬拧在一起。`,
    `我在${BZA.short}主攻${BZA.focus}。眼下论文定稿是第一优先级，我会把格式和引用抠干净，也尽量在规范里保留一点自己的表述风格。`,
    `我在写博士学位论文，领域${BZA.focus}。我希望终稿既满足学院要求，也能在答辩台上用半小时讲清我为什么值得被授予学位。`,
    `我是${BZA.name}博士生，${BZA.focus}方向。大论文阶段我在压缩冗余图和统一符号，想让审稿人和答辩委员看到的版本足够利落。`,
    `我在${BZA.short}冲刺学位论文，课题${BZA.focus}。致谢我会认真写，讨论也会写得诚实，尽量不自我矮化也不夸大。`,
  ],
  DEFENSE: [
    `我是${BZA.name}直博生，论文主体工作已完成，方向${BZA.focus}。我在准备答辩问答和材料备份，也想在现场把复杂方法讲成委员容易跟上的版本。`,
    `我临近毕业，研究主题是${BZA.focus}。我在预演答辩流程，也希望答辩结束后顺利完成学位授予，再冷静想下一步去哪。`,
    `我在${BZA.short}准备毕业答辩，领域${BZA.focus}。材料我按清单自检过多轮，更关心贡献边界是否讲透，而不是 PPT 配色是否讨喜。`,
    `我进入答辩季，课题属${BZA.focus}。我在压缩 Introduction 废话并强化实验对照，也想把时间卡在允许上限内刚好讲完。`,
    `我是${BZA.name}博士生，${BZA.focus}方向。我希望答辩是对几年工作的体面总结，而不是新的焦虑起点。`,
    `我在${BZA.short}迎接学位答辩，研究${BZA.focus}。我会把核心贡献练到脱稿也能讲稳，剩下的交给现场讨论。`,
  ],
  GRADUATED: [
    `我已在${BZA.name}取得博士学位，攻读期间聚焦${BZA.focus}。培养环节已全部走完，我会把博士阶段练出的写作与抗压习惯带到下一站。`,
    `我从${BZA.short}博士毕业，长期做${BZA.focus}。学位论文和发表记录我都整理归档了，接下来无论是业界还是学界我都想继续做点扎实工作。`,
    `我完成了${BZA.name}博士培养，方向${BZA.focus}。感谢这几年项目制训练把我练得能写能讲也能扛，下一程我仍想保持可复现和可沟通的习惯。`,
    `我的博士学位在${BZA.short}授予，课题围绕${BZA.focus}。学生身份告一段落，我会珍惜这段经历，也把「中关村学院博士」当作对自己的约束而不是装饰。`,
    `我从${BZA.name}博士毕业，积累在${BZA.focus}交叉方向。后面的路不管是博后还是企业研发，我都希望延续认真写代码认真写文档的风格。`,
    `我在${BZA.short}拿到博士学位，研究${BZA.focus}。书读到这里先合上一册，下一册我慢慢写。`,
  ],
  DROPPED: [
    `我曾在${BZA.name}攻读博士，方向与${BZA.focus}相关。培养未能走完全程，我会把这段经历当作对自己能力和边界的清醒记录。`,
    `我中断了在${BZA.short}的博士学业，课题曾涉及${BZA.focus}。若将来再回到学术轨道，我会带着更清楚的成本意识上路。`,
    `我的博士培养在${BZA.name}提前结束，与${BZA.focus}有关。我对自己的选择负责，也仍感激在这里认识的人与读过的文献。`,
  ],
};

function formalIntroForPhase(phase: Phase, year: number, rnd: () => number): string {
  const pool = FORMAL_INTRO_BY_PHASE[phase];
  const raw = pick(pool, rnd);
  return raw.replace('第 ${0} 学年', `第 ${year} 学年`);
}

/** 研究兴趣与工作内容：第一人称，像主页上的 bullet */
const RESEARCH_POOL: Record<Phase, readonly string[]> = {
  CHOOSING_ADVISOR: [
    `我关注深度学习在真实场景里的落地，也希望课题能同时碰得到数据和理论其中至少一边`,
    `我近期系统阅读了领域综述，正在把「想做的」收敛成几个可写进研究计划的具体问题`,
    `我习惯先复现强 baseline 再谈改进，避免一上来就宣称「全新范式」`,
    `我对多模态与交叉应用都有兴趣，最终选题会服从导师组资源与学院方向的交集`,
  ],
  COURSE: [
    `我主修${BZA.focus}相关核心课，课程项目选题会尽量和日后论文方向对齐，减少重复劳动`,
    `我日常用 Python 与主流深度学习框架做实验，正在把工程习惯从「能跑」练到「可复现」`,
    `我对统计学习与优化也有需求，会在课内把基础打牢，方便后面写方法章节时不心虚`,
    `我会把文献阅读和课程大作业都当作训练，目标是能独立提出假设并设计对照实验`,
  ],
  PROPOSAL: [
    `我拟围绕${BZA.focus}中的一条明确问题线开展研究，把方法创新和场景约束写进同一套叙事`,
    `我在补齐与课题最相关的对比工作与消融设计，让开题里的每一句话找得到实验对应`,
    `我重视可复现与数据伦理，实验记录和版本管理会跟代码一起走`,
    `我希望贡献点落在「交叉」与「可验证」上，而不是形容词堆叠`,
  ],
  MIDTERM: [
    `我在${BZA.focus}方向已形成较完整实验链条，正在把阶段成果整理成可展示的主图与附录`,
    `我近期工作重点是论文投稿与实验补全两手抓，优先保证故事和证据对齐`,
    `我会主动维护复现脚本与数据说明，方便组内传承也方便自己半年后还能看懂`,
    `我对审稿意见持开放态度，把「大修」当成免费加强版同行评议`,
  ],
  THESIS: [
    `我的学位论文以${BZA.focus}为主线，各章节围绕同一核心贡献展开，避免拼盘式堆砌`,
    `我在统一全篇符号与图表风格，也删掉重复和装饰性曲线，只保留服务论点的结果`,
    `我会把局限与失败案例写进讨论，答辩时愿意正面回应边界条件`,
    `我在反复通读全文检查逻辑跳跃，确保非本方向委员也能跟上主线`,
  ],
  DEFENSE: [
    `我把答辩陈述压缩成「问题—方法—证据—贡献」四段，预留时间给委员追问`,
    `我准备了常见追问的口头版回答，也备份了关键图表的放大页与补充实验索引`,
    `我会坦诚说明工作的适用边界，不把「未来工作」当成掩饰不足的挡箭牌`,
    `我希望答辩结束后无论结果如何，都能对自己这几年的投入有个交代`,
  ],
  GRADUATED: [
    `博士期间我的工作集中在${BZA.focus}，形成了一套从问题定义到实验闭环的个人流程`,
    `我会继续跟进领域前沿，也把博士论文里未展开的方向记成后续可选题目`,
    `我乐于做学术报告与技术分享，把复杂方法讲清楚是我给自己的长期要求`,
    `我保持代码与文档同步更新的习惯，这是读博几年里我认为最值得带走的能力之一`,
  ],
  DROPPED: [
    `我曾投入${BZA.focus}方向的学习与探索，这段训练仍会体现在我今后的工作方式里`,
    `我做过系统的文献与实验训练，即使学籍中断我也把这些当作已获得的技能`,
  ],
};

/** 课题组与合作：第一人称，简介里可公开的表述，略带自嘲但不跳戏 */
const COLLAB_POOL: Record<Phase, readonly string[]> = {
  CHOOSING_ADVISOR: [
    `我积极参加公开组会与学院活动，希望和未来的课题组在节奏与风格上互相匹配`,
    `我注重邮件与消息的专业表达，也在练习用短篇幅把技术问题说清楚`,
    `我愿意承担组里力所能及的公共事务，把它当成提前融入团队的一部分`,
  ],
  COURSE: [
    `我固定参加课题组例会与讨论班，汇报前会尽量把图表和数字核对一遍`,
    `我和同门在课程与实验上互相帮衬，遇到卡壳会先尝试协作再单独熬夜`,
    `我会提前排好课表与实验时间，减少「临时请假导致组会空着手去」的情况`,
  ],
  PROPOSAL: [
    `我与导师保持定期同步，开题材料每个大改版本都会先走一轮口头对齐`,
    `我会主动约同门互读开题稿，互相挑逻辑漏洞比互相夸更有用`,
    `我接受导师对路线风险的质疑，也会用补充实验来回应而不是口头硬顶`,
  ],
  MIDTERM: [
    `我在组里承担一部分实验与文档维护，也想在中期前给组里交出可见进展`,
    `我和合作者分工明确，接口处留好记录，避免半年后谁写了哪段代码说不清`,
    `我会把组会提问当成免费预演，委员可能问什么我在组里先被问一遍`,
  ],
  THESIS: [
    `我大论文写作期尽量控制社交噪音，但保留和同门的短交流换换脑子`,
    `我会请导师和师兄师姐通读关键章节，再自己吸收意见而不是防御性反驳`,
    `我习惯把版本号和修改说明写清楚，方便别人提意见也方便自己回溯`,
  ],
  DEFENSE: [
    `我请组内做过答辩的师兄师姐听了一轮预讲，他们的刁钻问题我记了小本本`,
    `答辩前我会调整作息，避免台上脑子空白台下靠咖啡续命`,
    `无论结果如何，我都会当面感谢导师和同门这几年的包容与拉扯`,
  ],
  GRADUATED: [
    `我很感激课题组这几年的指导与包容，也会继续和同门保持专业上的联系`,
    `我会把博士期间学会的分工与沟通方式带到新团队，少制造信息黑洞`,
    `我仍关注母校${BZA.short}的学术活动，有机会愿意回来做分享`,
  ],
  DROPPED: [
    `我与学院师生仍保持礼貌距离内的联系，也对曾帮助过我的人心存感谢`,
    `我会以这段经历为参照，更谨慎地评估下一段学业或职业承诺`,
  ],
};

const QUOTES: readonly string[] = [
  `科研是神圣的，我们要为了全人类的未来而奋斗（顺便把这一章写完）。`,
  `我相信 reproducibility，除了我昨天那次跑不通的那次。`,
  `Related Work 的本质是：礼貌地说明「他们很棒，但我更棒」。`,
  `论文被拒不是否定，是「免费同行评议」——我后来学会这么安慰自己。`,
  `开题报告的最高境界：让老师觉得「这饼能吃」，让自己觉得「这饼能烤」。`,
  `博士训练送我的礼物之一：把焦虑排版成可执行清单。`,
  `我不是熬夜，我是在与全球时差对齐审稿时区。`,
  `实验失败不可怕，可怕的是失败得不够有故事性。`,
  `致谢里会写很多人，我心里最先感谢的常常是那台还在跑的服务器。`,
  `「极交叉」翻译成人话：多会一点，就少背锅一点。`,
  `组会对我来说是把进度摊开给大家看，也把压力摊开一点点。`,
  `毕业那天我终于可以把微信签名里的「在读」删掉了，有点空又有点爽。`,
];

const QUOTES_DEFENSE_EXTRA: readonly string[] = [
  `答辩台上每一句话，都是过去几年深夜的压缩包，我尽量解压得有条理一点。`,
  `委员点头的那一刻，我会想起第一次进机房时手心的汗，那也算同一套神经回路。`,
];

function buildAchievements(state: GameState, phase: Phase): string {
  const sentences: string[] = [];
  const p = state.papersPublished;
  const c = state.citations;
  const sub = state.submittedPapers;

  if (p <= 0) {
    sentences.push(
      `我尚未以正式发表形式产出论文，正在全力打磨第一篇可投稿的工作，目前引用统计仍为零也正常。`
    );
  } else if (p === 1) {
    sentences.push(`我目前已有 1 篇论文正式发表，相关工作累计被引用约 ${c} 次（统计口径随数据库更新会波动）。`);
  } else {
    sentences.push(`我目前已累计发表 ${p} 篇论文，引用约 ${c} 次，仍在继续拓展和深化同一条研究线。`);
  }

  if (sub > 0) {
    sentences.push(`我另有 ${sub} 篇论文正在同行评议流程中，我会根据意见认真修订。`);
  }

  if (state.credits >= 30) {
    sentences.push(`我已修满培养方案要求的 30 学分，课程阶段的相关节点已经完成。`);
  } else {
    sentences.push(`我已修读 ${state.credits} 学分，仍在向培养方案要求的 30 学分稳步推进。`);
  }

  if (state.reputation >= 70) {
    sentences.push(`我在学院讲坛与公开活动中露面较多，渐渐在院内混了个脸熟。`);
  } else if (state.reputation >= 45) {
    sentences.push(`我参加过若干学院活动与报告，正在慢慢让更多人知道我在做什么方向。`);
  } else if (state.reputation < 28) {
    sentences.push(`我还在积累学术能见度，后面会多争取报告和交流机会，让别人看见我的工作而不只是头像。`);
  }

  if (state.hasAdvisor) {
    sentences.push(`我在${state.advisorName}课题组学习，组内合作与讨论是我日常科研的重要部分。`);
  }

  if (phase === 'THESIS' || phase === 'DEFENSE') {
    sentences.push(`我当前处于${state.milestone}阶段，时间与精力主要投向学位论文与答辩准备。`);
  }

  if (phase === 'GRADUATED') {
    sentences.push(`我已完成博士学位论文答辩并取得学位，正在规划下一阶段的发展路径。`);
  }

  if (phase === 'DROPPED') {
    return `我未能完成在${BZA.short}的博士培养全程，但我会把已获得的训练与反思带进后面的选择里。`;
  }

  return sentences.join('');
}

function headlineFor(state: GameState, phase: Phase): string {
  if (phase === 'GRADUATED') return `${BZA.short} · 已授博士学位`;
  return `${BZA.short} · AI 方向博士生 · ${state.milestone}`;
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
  const floor = 3 + ((quarter + year * 2) % 6);
  const room = 10 + ((quarter * 7 + year * 11) % 40);
  return `${code}-${floor}${String(room).padStart(2, '0')} 工位`;
}

/** 供首页与（可选）纯文本导出 */
export function buildStudentProfile(state: GameState): StudentProfileCard {
  const phase = resolvePhase(state.milestone);
  const rnd = mulberry32(seedFromState(state));

  const intro = formalIntroForPhase(phase, state.year, rnd);
  const researchBullets = pickMany(RESEARCH_POOL[phase], rnd, Math.min(3, RESEARCH_POOL[phase].length));
  const collabPool = COLLAB_POOL[phase];
  const labDiaryBullets = pickMany(collabPool, rnd, Math.min(3, collabPool.length));

  const quotePool =
    phase === 'DEFENSE' || phase === 'GRADUATED'
      ? [...QUOTES, ...QUOTES_DEFENSE_EXTRA]
      : QUOTES;
  const quote = pick(quotePool, rnd);

  const achievements = buildAchievements(state, phase);

  const contactEmail = buildContactEmail(rnd);
  const contactRoom = buildContactRoom(rnd, state.quarter, state.year);

  return {
    headline: headlineFor(state, phase),
    intro,
    researchBullets,
    labDiaryBullets,
    achievements,
    quote,
    contactEmail,
    contactRoom,
  };
}

/** 兼容旧接口：拼成一段纯文本 */
export function studentProfileToPlainText(card: StudentProfileCard): string {
  return [
    card.intro,
    `研究兴趣：${card.researchBullets.join(' ')}`,
    `课题组与合作：${card.labDiaryBullets.join(' ')}`,
    card.achievements,
    card.quote,
  ].join(' ');
}
