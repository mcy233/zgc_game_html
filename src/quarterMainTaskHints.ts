import type { GameState } from './types';

type MainTaskCategory =
  | 'NO_ADVISOR'
  | 'COURSE_NEED_CREDITS'
  | 'COURSE_ADVANCE'
  | 'PROPOSAL_WAITING'
  | 'PROPOSAL_PUSH'
  | 'MIDTERM_JUST_STARTED'
  | 'MIDTERM_WAITING'
  | 'MIDTERM_NEED_PAPER'
  | 'MIDTERM_PUSH'
  | 'THESIS_WRITING'
  | 'DEFENSE_NEED_STATS'
  | 'DEFENSE_PUSH'
  | 'GRADUATED';

const B = 'font-semibold text-gray-900';

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

const POOLS: Record<MainTaskCategory, readonly string[]> = {
  NO_ADVISOR: [
    `校历又翻过一页，你还没进组。第一学年结束前要尽快把<strong class="${B}">导师与课题组</strong>敲定，别让系统一直把你标成「学术孤儿」。`,
    `培养办不会替你社交：没有<strong class="${B}">导师收留</strong>，后面的开题与项目制节奏都无从谈起。多去「团队」里刷脸、拜访，别拖到学籍亮红灯。`,
    `走廊里大家都在聊组会，你还在「待定」。主线很直白：先<strong class="${B}">拜师入组</strong>，再谈论文与算力配额。`,
    `学分可以慢慢修，但<strong class="${B}">导师不能一直空着</strong>。趁年级还新，把意向导师的好感刷上去，别等教务催命才慌张。`,
    `你现在的头号任务不是卷论文，而是<strong class="${B}">找到愿意签你的导师</strong>——否则开题那一格永远灰着。`,
  ],
  COURSE_NEED_CREDITS: [
    `导师已经在通讯录里，但教务口径里<strong class="${B}">学分未满 30</strong>不会放行下一阶段。课表该清的债迟早要还，别指望「先科研后补课」能混过去。`,
    `组里欢迎你来坐班，可系统判定你仍是「课没修完的学生」。把<strong class="${B}">学分堆到 30</strong>，进度条才有机会真正指向开题。`,
    `导师可以催你跑实验，但<strong class="${B}">培养方案上的学分</strong>不够，阶段进度拉满也会被教务一键打回——先去日常里把课修齐。`,
    `你离「准博士生」还差一纸课表：主线是<strong class="${B}">修满学分</strong>，顺便在课程里薅点进度与声望，不亏。`,
  ],
  COURSE_ADVANCE: [
    `学分和导师都就位了，本阶段主线是把<strong class="${B}">阶段进度</strong>稳步推到阈值；满了就能进入开题准备，别把「再摸一季」写成习惯。`,
    `你已经站在课程阶段的出口附近：多跑<strong class="${B}">日常与科研行动</strong>填进度，下一道门才是项目制真正的热身。`,
    `系统允许你同时焦虑三件事，但优先级只有一件——<strong class="${B}">把当前阶段进度跑满</strong>，然后体面地跟课表说再见。`,
    `课修完了、组也进了，剩下就是把培养条<strong class="${B}">涂满</strong>。别在 99% 磨蹭成史诗，下一季结算在看你。`,
  ],
  PROPOSAL_WAITING: [
    `入组还不满约两季度，学院默认<strong class="${B}">不会放行开题</strong>。这段时间与其干焦虑，不如修课、跑实验或蹭点论文——导师说你还太嫩，你就当真嫩给系统看。`,
    `开题大门还在冷却：按规则要<strong class="${B}">入组满约半年</strong>才解锁。你可以松口气匀一匀生活，也可以提前把文献与实验攒厚，别空转。`,
    `导师嘴上不说，系统写得明白——<strong class="${B}">时间门槛没到</strong>，进度拉满也会卡在门前。这季适合打底子，不适合硬闯答辩式开题。`,
    `「下半年才能开题」不是鸽子敷衍，是培养节点。利用空窗把<strong class="${B}">算力、数据与心态</strong>备好，开题季一到直接上强度。`,
    `现在强行开题只会被教务弹窗。主线是<strong class="${B}">等满入组季度数</strong>，顺便把组里人际关系与实验台位混熟。`,
  ],
  MIDTERM_JUST_STARTED: [
    `<strong class="${B}">开题报告通过</strong>——系统已把你送进中期考核赛道。先享受半格胜利，再准备论文与时间的双重拷打。`,
    `恭喜，<strong class="${B}">开题这一仗打完了</strong>！接下来是中期与成果验收，别把「刚开题」当成永久挡箭牌。`,
    `培养节点翻篇：从「开题准备」进到<strong class="${B}">中期考核</strong>。主线暂时变成攒论文、磨时间、别把进度条玩成心电图。`,
    `导师点头、系统盖章，<strong class="${B}">开题成功</strong>写进这一季。下一程是中期前的蓄力季，松弛一点可以，躺平不行。`,
    `终于开题成功啦，可以进入<strong class="${B}">下一阶段</strong>了——校历继续走，你的主线从画饼切换成烤饼。`,
  ],
  PROPOSAL_PUSH: [
    `时间门槛已过，<strong class="${B}">阶段进度推到满条</strong>就能在下次结算时把开题真正落定——别在 99% 跟自己对线。`,
    `系统已允许你走向开题：把<strong class="${B}">进度条拉满</strong>，下一季总结里你会看到阶段切换——记得提前跟导师对齐故事线。`,
    `开题不是许愿，是<strong class="${B}">进度达标后的自动结算</strong>。这季多堆点科研与日常，别让「差一点」变成「差一季」。`,
    `你可以把开题当成 boss 战前的存档点：主线就是<strong class="${B}">本阶段进度 100%</strong>，其余都是支线。`,
    `导师那边时间已够，剩下看你<strong class="${B}">培养进度</strong>能不能跑满。满条即过线，鸽子的下次就是这次。`,
  ],
  MIDTERM_WAITING: [
    `开题刚过不久，学院还要你再磨一阵子才轮到<strong class="${B}">中期考核</strong>。可以松口气匀生活，也可以趁机多投稿——别空窗到心虚。`,
    `中期节点有<strong class="${B}">最短间隔</strong>，系统不会让你开题完立刻「中期快乐」。这季适合夯实实验与论文，别跟规则硬刚。`,
    `导师让你再磨练，不完全是客套：<strong class="${B}">时间没到</strong>，进度拉满也会弹回 99%。把能写的先写出来，别浪费窗口。`,
    `主线暂时是<strong class="${B}">等满开题后的季度数</strong>，顺便把实验室工位坐穿。急也没用，培养系统比你还死板。`,
  ],
  MIDTERM_NEED_PAPER: [
    `中期卡的是硬指标：<strong class="${B}">至少一篇已发表论文</strong>没到位，进度满条也会被按住。先去科研里把成果落地，再回来喊苦。`,
    `委员会不看口头创新，看<strong class="${B}">paper 数</strong>。没有已发表论文，中期那一格永远差一口气——这季把投稿与修改排进日程。`,
    `你可以把中期理解成「成果验收」：主线是<strong class="${B}">先凑够发表</strong>，再谈阶段进度满不满。`,
    `系统提示很直白：<strong class="${B}">论文不够</strong>，中期免谈。把出差、撰写与实验排好，别指望运气替你中稿。`,
  ],
  MIDTERM_PUSH: [
    `时间与论文都齐了，把<strong class="${B}">阶段进度拉满</strong>就能解锁中期之后的大论文长跑——头发可以现在开始掉。`,
    `中期 boss 的钥匙你都有了，只剩<strong class="${B}">培养条涂满</strong>。下一季结算有机会直接跳进论文撰写，别手软。`,
    `这阶段主线单一：<strong class="${B}">进度 100%</strong>。其它声望与心态都是护航，别本末倒置。`,
    `再推一季进度，你就从「中期人」变成「写大论文的」。<strong class="${B}">把条跑满</strong>，别在 99% 开茶话会。`,
  ],
  THESIS_WRITING: [
    `你已经站在<strong class="${B}">大论文撰写</strong>这一格：科研产出、审稿心态与身体电量要同时在线，别指望「冲刺一周奇迹」。`,
    `主线从「做项目」切换成<strong class="${B}">把书稿闭环</strong>。日常里该休就休，该写就写，延毕预警在后台盯着你。`,
    `系统眼里你现在只有一个 KPI：<strong class="${B}">把阶段进度推到答辩前</strong>。其它都是支线，包括组里的八卦。`,
    `大论文阶段没有「摸鱼豁免权」：多堆<strong class="${B}">科研与进度</strong>，少堆借口——下一格就是毕业答辩的硬门槛。`,
  ],
  DEFENSE_NEED_STATS: [
    `答辩委员会不看鸡汤，看<strong class="${B}">学术声望与已发表论文数</strong>。红线没踩够就别幻想主席宣布「优秀」——该补的砖一块都少不了。`,
    `你离「可以毕业」还差<strong class="${B}">声望或论文的硬性组合</strong>：去科研里补产出，去日常里补人缘，别跟系统讨价还价。`,
    `毕业答辩不是剧情杀，是<strong class="${B}">数值达标后的结算</strong>。先把论文与声望刷够，再谈最后一格进度。`,
    `当前主线：把<strong class="${B}">答辩门槛</strong>补齐。卡在 99% 通常不是运气，是引用与论文还没到位。`,
  ],
  DEFENSE_PUSH: [
    `硬性指标已达标，接下来只要把<strong class="${B}">阶段进度推到终点</strong>，下一季结算就有机会正面撞线毕业——记得给自己留点睡觉时间。`,
    `你已经摸到学位帽边沿：主线是<strong class="${B}">进度满条触发答辩通过</strong>。这季少折腾支线，多堆有效行动。`,
    `系统允许你幻想毕业典礼了，前提是<strong class="${B}">本阶段进度跑满</strong>。别在终点线前绊在摸鱼上。`,
    `最后一格没有「下次一定」：把<strong class="${B}">培养条拉满</strong>，学院才会把「顺利毕业」写进你的档案。`,
  ],
  GRADUATED: [
    `培养主线已通关：<strong class="${B}">答辩与学位程序</strong>告一段落。接下来是现实世界的 HR 与博后邮件——游戏里的你，先享受这一格总结。`,
    `你从「在读」切换成「已授予」：这一页校历可以当纪念截图。主线故事讲完，支线人生才刚开始。`,
    `中关村学院的这一程跑到终点了。<strong class="${B}">博士帽</strong>在档案里落章，下一季不用再看这条提示。`,
    `系统不再给你布置主线，只给你留了一句：毕业快乐，别忘<strong class="${B}">备份论文与体检报告</strong>。`,
  ],
};

function resolveCategory(state: GameState): MainTaskCategory | null {
  const m = state.milestone;
  if (
    m === '学术不端退学' ||
    m === '身心崩溃退学' ||
    m === '无导师退学' ||
    m === '开题拖延退学' ||
    m === '中期拖延退学' ||
    m === '延毕退学'
  ) {
    return null;
  }
  if (m === '顺利毕业') return 'GRADUATED';
  if (m === '导师选择') return 'NO_ADVISOR';

  if (m === '课程学习') {
    if (!state.hasAdvisor) return 'NO_ADVISOR';
    if (state.credits < 30) return 'COURSE_NEED_CREDITS';
    return 'COURSE_ADVANCE';
  }

  if (m === '开题准备') {
    const joined = state.advisorJoinedQuarter || 0;
    if (state.quarter < joined + 2) return 'PROPOSAL_WAITING';
    return 'PROPOSAL_PUSH';
  }

  if (m === '中期考核') {
    const prop = state.proposalFinishedQuarter || 0;
    if (prop > 0 && state.quarter === prop) return 'MIDTERM_JUST_STARTED';
    if (state.quarter < prop + 4) return 'MIDTERM_WAITING';
    if (state.papersPublished < 1) return 'MIDTERM_NEED_PAPER';
    return 'MIDTERM_PUSH';
  }

  if (m === '论文撰写') return 'THESIS_WRITING';

  if (m === '毕业答辩') {
    if (state.reputation < 60 || state.papersPublished < 2) return 'DEFENSE_NEED_STATS';
    return 'DEFENSE_PUSH';
  }

  return null;
}

/**
 * 季度总结弹窗用：根据当前培养阶段返回一段 HTML（含 &lt;strong&gt; 加粗），无则 null。
 */
export function pickMainTaskHintHtml(state: GameState): string | null {
  const cat = resolveCategory(state);
  if (!cat) return null;
  return pick(POOLS[cat]);
}
