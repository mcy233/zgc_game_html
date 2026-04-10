import type { GameState } from './types';

/** 未解锁任何称号时，主页顶栏小字 */
export const DEFAULT_PROFILE_HEADLINE = '新生小白（初来乍到）';

export type ProfileHonorDef = {
  id: string;
  /** 越小越优先作为当前展示称号（在已解锁集合中取最优） */
  priority: number;
  /** 主页顶栏与「个人主页」并排的小字称号 */
  headlineTitle: string;
  /** 解锁浮窗标题 */
  popupTitle: string;
  /** 解锁说明：因何获得，诙谐口吻 */
  unlockBody: string;
  condition: (s: GameState) => boolean;
};

const H: ProfileHonorDef[] = [
  {
    id: 'graduate_mythic',
    priority: 1,
    headlineTitle: '神话级出站·传说缔造者',
    popupTitle: '称号解锁：神话级出站',
    unlockBody:
      '论文、引用、声望三位一体封顶毕业——你的履历已经可以直接投简历给诺奖委员会了（大雾）。此称号仅授予极少数把每个数值都点满的终极玩家。',
    condition: (s) => s.milestone === '顺利毕业' && s.graduationHonor === 'MYTHIC',
  },
  {
    id: 'graduate_legend',
    priority: 2,
    headlineTitle: '高光毕业·学术明星',
    popupTitle: '称号解锁：高光毕业',
    unlockBody:
      '答辩委员会集体点头的速度堪比审稿人拒稿的速度。你的成果已经让导师在组会里自豪了整整一学期。',
    condition: (s) => s.milestone === '顺利毕业' && s.graduationHonor === 'LEGEND',
  },
  {
    id: 'graduate_star',
    priority: 3,
    headlineTitle: '优秀博士·前途可期',
    popupTitle: '称号解锁：优秀博士',
    unlockBody:
      '超过大多数同届的硬指标毕业。博后、大厂研究院、高校教职 track，三叉路口你站在中间挑选方向的姿态相当从容。',
    condition: (s) => s.milestone === '顺利毕业' && s.graduationHonor === 'STAR',
  },
  {
    id: 'graduate_phd',
    priority: 5,
    headlineTitle: '博士通关·存档已写入',
    popupTitle: '称号解锁：博士通关',
    unlockBody:
      '你走到了「顺利毕业」这一结局节点。系统郑重宣布：学生证可以删了，焦虑可以打包备份，下一关地图请自行下载。此称号纪念你把培养方案从「进行中」熬成了「已完成」。',
    condition: (s) => s.milestone === '顺利毕业',
  },
  {
    id: 'graduate_scrape',
    priority: 6,
    headlineTitle: '惊险过关·心脏很强',
    popupTitle: '称号解锁：惊险过关',
    unlockBody:
      '差一点就要加入延毕大军，但你硬是在最后关头把论文和声望凑到了及格线。评委的眉头皱痕已经刻在你的毕业记忆里了。',
    condition: (s) => s.milestone === '顺利毕业' && s.graduationHonor === 'SCRAPE',
  },
  {
    id: 'papers_three',
    priority: 8,
    headlineTitle: '论文小瀑布制造机',
    popupTitle: '称号解锁：量产感上来了',
    unlockBody:
      '正式发表累计达到 3 篇。审稿系统开始把你当熟客，邮箱过滤规则都要单独给你开一页。说明你已经从「能写一篇」进化到「能写一串」。',
    condition: (s) => s.papersPublished >= 3,
  },
  {
    id: 'year_three_plus',
    priority: 12,
    headlineTitle: '三年级老生·时间感模糊',
    popupTitle: '称号解锁：年级上来了',
    unlockBody:
      '游戏内已进入第三学年及以上。日历翻得比实验记录还快，属于「别人问几年级你要愣一下」的早期症状。此称号表彰你对长周期培养方案的耐心充值。',
    condition: (s) => s.year >= 3,
  },
  {
    id: 'citations_300',
    priority: 13,
    headlineTitle: '引用三百·学术能见度已上线',
    popupTitle: '称号解锁：引用三位数后半段',
    unlockBody:
      '总引用突破 300。你的论文开始在各种 survey 和 related work 里冒头，Google Scholar 页面终于不再寒酸。这种被动收入的感觉，比季度补助还爽。',
    condition: (s) => s.citations >= 300,
  },
  {
    id: 'citations_100',
    priority: 15,
    headlineTitle: '引用破百·不再是小透明',
    popupTitle: '称号解锁：引用量三位数了',
    unlockBody:
      '总引用达到 100。你的论文终于从「自引 + 导师引」的自嗨模式毕业了，开始有陌生人在 cite 你。学术存在感初步建立，虽然可能有一半引用只是凑 related work 的。',
    condition: (s) => s.citations >= 100,
  },
  {
    id: 'credits_done',
    priority: 18,
    headlineTitle: '学分修满·课表观光模式',
    popupTitle: '称号解锁：培养方案学分清零',
    unlockBody:
      '学分达到 30。学院规定的课你修完了，接下来主要是项目和论文把你修。课表可以从「求生」切成「点缀」，但组会不会因此变短。',
    condition: (s) => s.credits >= 30,
  },
  {
    id: 'paper_first',
    priority: 20,
    headlineTitle: '首篇发表·引用从零起步',
    popupTitle: '称号解锁：不再是零发表',
    unlockBody:
      '你拥有了第一篇正式发表。引用统计终于有机会离开「恒为零」的舒适区，Related Work 里写自己也从幻想变成合法操作。值得开一罐无糖可乐庆祝。',
    condition: (s) => s.papersPublished >= 1,
  },
  {
    id: 'submitted_two',
    priority: 22,
    headlineTitle: '审稿池深度潜水员',
    popupTitle: '称号解锁：稿子在审×2',
    unlockBody:
      '同时在审稿件不少于 2 篇。你已成功把命运托管给多位匿名审稿人，心情与邮箱未读数强相关。此称号又称「回复信预演练习生」。',
    condition: (s) => s.submittedPapers >= 2,
  },
  {
    id: 'reputation_high',
    priority: 24,
    headlineTitle: '院内能见度·显著提高',
    popupTitle: '称号解锁：声望条亮眼了',
    unlockBody:
      '学术声望达到 72。走廊里打招呼的人变多，ppt 里放你名字的概率微涨。请注意表情管理，避免被误认为行政编。',
    condition: (s) => s.reputation >= 72,
  },
  {
    id: 'citations_30',
    priority: 25,
    headlineTitle: '引用数开始像那么回事',
    popupTitle: '称号解锁：引用两位数俱乐部',
    unlockBody:
      '总引用达到 30。你的论文开始有人读了——至少 Google Scholar 这么告诉你。从「恒为零」到两位数，这一步比你想象的难。',
    condition: (s) => s.citations >= 30,
  },
  {
    id: 'advisor_onboard',
    priority: 28,
    headlineTitle: '导师已签约·课题组在编',
    popupTitle: '称号解锁：有导师了',
    unlockBody:
      '你已完成导师双选或加入课题组。从此你的进度条与导师的日程表存在量子纠缠，组会 PPT 与人生规划共享同一套焦虑。欢迎成为「长期项目」的正式行员。',
    condition: (s) => s.hasAdvisor === true,
  },
  {
    id: 'submitted_one',
    priority: 30,
    headlineTitle: '稿件在审·焦虑正式上架',
    popupTitle: '称号解锁：第一次投稿',
    unlockBody:
      '至少 1 篇论文在审。你已经把作品交给全世界最擅长拖稿的群体之一。建议把「刷新邮箱」从爱好降级为偶尔行为，把睡眠从奢侈品升级为刚需。',
    condition: (s) => s.submittedPapers >= 1,
  },
  {
    id: 'quarter_eight',
    priority: 32,
    headlineTitle: '八季存活·模组未劝退',
    popupTitle: '称号解锁：两年季度制老兵',
    unlockBody:
      '游戏季度数达到 8。你经历的秋季冬季春季夏季比某些实验的对照组还多。此称号表彰你在随机事件与数值波动中仍选择继续游戏。',
    condition: (s) => s.quarter >= 8,
  },
  {
    id: 'gpu_rich',
    priority: 35,
    headlineTitle: '显存富人的短暂幻觉',
    popupTitle: '称号解锁：算力余额可观',
    unlockBody:
      'GPU 点数达到 2800。你暂时摆脱了「每次训练前先看余额」的卑微。请记住：实验越猛，清零越快，本称号不承诺持续时间。',
    condition: (s) => s.gpuCredits >= 2800,
  },
  {
    id: 'quarter_four',
    priority: 38,
    headlineTitle: '四季轮回幸存者',
    popupTitle: '称号解锁：完整学年体验卡',
    unlockBody:
      '游戏季度数达到 4。你完整经历了一轮学年四季，对「怎么又快季末了」有了肌肉记忆。离老油条还有距离，但已不再是纯萌新。',
    condition: (s) => s.quarter >= 4,
  },
  {
    id: 'gpu_poor',
    priority: 40,
    headlineTitle: '算力贫困户持证上岗',
    popupTitle: '称号解锁：显卡看了都叹气',
    unlockBody:
      'GPU 点数跌到 120 及以下。你进入了「能跑小实验就感恩」的境界。此称号不是羞辱，是提醒你：该蹭组里机器了，或者该写纯理论段落缓冲一下。',
    condition: (s) => s.gpuCredits <= 120,
  },
  {
    id: 'misconduct_hot',
    priority: 42,
    headlineTitle: '学术规范雷达常亮',
    popupTitle: '称号解锁（警示向）：规范雷达亮了',
    unlockBody:
      '学术不端嫌疑值达到 45。系统用黑色幽默给你发个灯牌：再往前就是剧情杀高发区。请立刻收手、自查、找导师坦白从宽，别让模拟器比现实还先毕业。',
    condition: (s) => s.misconduct >= 45,
  },
  {
    id: 'sanity_low',
    priority: 45,
    headlineTitle: '理智条红色旅游区',
    popupTitle: '称号解锁：理智条告急',
    unlockBody:
      '理智降到 28 及以下。你的大脑已进入「建议关机散热」模式。此称号表彰你在高压下仍坚持推进进度，同时强烈建议你游戏里摸鱼、散步、睡觉，现实里同理。',
    condition: (s) => s.sanity <= 28,
  },
  {
    id: 'rookie_fresh',
    priority: 99,
    headlineTitle: '新生小白（初来乍到）',
    popupTitle: '开局称号：新生小白',
    unlockBody:
      '学籍刚落、工位还在认路阶段。培养方案像一本厚说明书，你像刚拆封的玩家——此称号记录你「还没被项目制打磨过」的珍贵时刻，可在首页与其他已解锁称号切换展示。',
    condition: (_s) => true,
  },
];

/** 按 priority 升序，便于展示时取最小 priority */
export const PROFILE_HONORS: readonly ProfileHonorDef[] = [...H].sort((a, b) => a.priority - b.priority);

export const PROFILE_HONOR_BY_ID: Record<string, ProfileHonorDef> = Object.fromEntries(
  PROFILE_HONORS.map((h) => [h.id, h])
);

/** 首页顶栏称号：`latest` 为解锁顺序中最后一项；`pinned` 为玩家固定展示 */
export function resolveHomeHeadlineTitle(state: GameState): string {
  const unlocked = new Set(state.unlockedHonors ?? []);
  if (unlocked.size === 0) return DEFAULT_PROFILE_HEADLINE;

  if (state.honorHomeDisplayMode === 'pinned' && state.honorHomePinnedId) {
    const pid = state.honorHomePinnedId;
    if (unlocked.has(pid)) {
      const h = PROFILE_HONOR_BY_ID[pid];
      if (h) return h.headlineTitle;
    }
  }

  const order = state.honorUnlockOrder ?? [];
  for (let i = order.length - 1; i >= 0; i--) {
    const id = order[i]!;
    if (!unlocked.has(id)) continue;
    const h = PROFILE_HONOR_BY_ID[id];
    if (h) return h.headlineTitle;
  }

  for (const id of state.unlockedHonors) {
    const h = PROFILE_HONOR_BY_ID[id];
    if (h) return h.headlineTitle;
  }
  return DEFAULT_PROFILE_HEADLINE;
}

/** 动态页荣誉墙：按解锁先后，其余未在顺序表中的补在后 */
export function listUnlockedHonorsOrdered(state: GameState): ProfileHonorDef[] {
  const unlocked = new Set(state.unlockedHonors ?? []);
  const order = state.honorUnlockOrder ?? [];
  const seen = new Set<string>();
  const out: ProfileHonorDef[] = [];
  for (const id of order) {
    if (seen.has(id) || !unlocked.has(id)) continue;
    seen.add(id);
    const h = PROFILE_HONOR_BY_ID[id];
    if (h) out.push(h);
  }
  for (const id of state.unlockedHonors) {
    if (seen.has(id)) continue;
    seen.add(id);
    const h = PROFILE_HONOR_BY_ID[id];
    if (h) out.push(h);
  }
  return out;
}

export function scanNewHonorIds(state: GameState): string[] {
  const have = new Set(state.unlockedHonors ?? []);
  return PROFILE_HONORS.filter((h) => h.condition(state) && !have.has(h.id)).map((h) => h.id);
}
