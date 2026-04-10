export type AdvisorType = 'MICROMANAGER' | 'GHOST' | 'SUPPORTIVE' | 'CELEBRITY';

export type Milestone =
  | '课程学习'
  | '导师选择'
  | '开题准备'
  | '开题报告'
  | '中期考核'
  | '论文撰写'
  | '毕业答辩'
  | '顺利毕业'
  | '学术不端退学'
  | '身心崩溃退学'
  | '无导师退学'
  | '开题拖延退学'
  | '中期拖延退学'
  | '延毕退学'
  | '培养环节退学';

/** 答辩通过后的结局分档（论文数 + 学术声望） */
export type GraduationHonor = 'MYTHIC' | 'LEGEND' | 'STAR' | 'MERIT' | 'PASS' | 'SCRAPE';

export interface LabMate {
  id: string;
  name: string;
  role: '师兄' | '师姐' | '师弟' | '师妹';
  year: number; // PhD Year (1-4)
  status: string;
  favor: number;
  /** 最近一次与玩家互动的季度编号；与当前季不同则季末可能衰减好感 */
  lastInteractedQuarter?: number;
}

/** 他人朋友圈动态来源（用于点赞文案与样式） */
export type MomentFeedSource = 'COLLEGE' | 'PEER' | 'OTHER_LAB' | 'ADVISOR' | 'SELF';

export interface Moment {
  id: string;
  quarter: number;
  content: string;
  author: string;
  likes: number;
  comments: { author: string; content: string }[];
  hasInteracted: boolean;
  timestamp: string;
  /** 非「我」发的朋友圈时标记来源 */
  feedSource?: MomentFeedSource;
}

/** 季度伊始待玩家抉择的第二类随机事件（关闭「季度总结」后弹出） */
export type PendingQuarterChoice = {
  title: string;
  description: string;
  options: {
    id: string;
    label: string;
    hint: string;
    /** 选择确定后，结果浮窗中的叙事（不含数值，数值由 deltas 单独展示） */
    outcomeText: string;
    deltas: Partial<Record<string, number>>;
  }[];
};

export interface GameState {
  quarter: number; // 1-16 (4 years * 4 quarters)
  year: number;
  season: '秋季' | '冬季' | '春季' | '夏季';
  /** 玩家角色中文姓名，开局随机生成并随存档保留 */
  playerName: string;
  /** 与姓名对应的学院邮箱（整址，开局固定） */
  playerContactEmail: string;
  /** 工位展示文案，开局随机（楼栋 C5/C8/C9，楼层 1–4） */
  playerOfficeRoom: string;
  /** 本科母校展示文案，登录时随机一次，之后不随季度变化 */
  playerUndergradUniversity: string;
  /** 已解锁的个人主页称号 id（见 profileHonors） */
  unlockedHonors: string[];
  /** 称号首次解锁顺序（用于「最新」与荣誉墙排序） */
  honorUnlockOrder: string[];
  /** 首页顶栏：latest=展示最后一次解锁；pinned=固定展示 honorHomePinnedId */
  honorHomeDisplayMode: 'latest' | 'pinned';
  honorHomePinnedId: string | null;
  /** 开局随机，用于首页个性签名首抽；与季度块种子组合，保证每局开局文案不同 */
  signatureQuoteSeed: number;
  /** 研究兴趣文案组索引 0..4，开局随机，本局固定 */
  researchInterestGroup: number;
  
  // Stats (0-100)
  sanity: number;
  health: number;
  energy: number;
  misconduct: number; // 学术不端嫌疑值 (0-100)
  reputation: number; // 学术声望 (0-100)
  
  // Resources
  funding: number;
  gpuCredits: number;
  
  // Academic
  credits: number; // 学分 (target: 30)
  progress: number; // 0-100 towards next milestone
  paperWritingProgress: number; // 论文撰写进度 (0-100)
  submittedPapers: number; // 已投稿待审核的论文数量
  papersPublished: number;
  /** 每篇已发表论文首次计入「已发表」时的季度编号，与 papersPublished 顺序一致 */
  paperPublicationQuarters: number[];
  citations: number;
  advisorFavor: number;
  milestone: Milestone;
  /** 仅「顺利毕业」时有效：成就档位 */
  graduationHonor?: GraduationHonor;
  /** 每学年秋季实验室人事变动，在季度总结弹窗中展示，关闭总结后清除 */
  quarterLabNotice?: {
    title: string;
    description: string;
    effect: Record<string, number>;
  };
  
  // Advisor & Project
  hasAdvisor: boolean;
  advisorName: string;
  advisorType: AdvisorType;
  potentialAdvisors: Record<AdvisorType, number>; // Favor for each potential advisor (0-100)
  advisorJoinedQuarter: number; // 记录加入导师的季度
  proposalFinishedQuarter: number; // 记录开题完成的季度
  projectQuarters: number; // 加入项目的时间（季度数）
  labMates: LabMate[];
  
  // Self-Regulation
  walksThisQuarter: number; // 校园漫步次数
  actionsThisQuarter: number; // 本季度已执行动作次数
  /** 自上次插入「他人动态」以来已消耗的行动次数 */
  actionsSinceExternalMoment: number;
  /** 当前周期触发他人动态的阈值（随机 3~10，达标后重置并重新随机） */
  externalMomentThreshold: number;
  interactionsThisQuarter: string[]; // 本季度已互动的成员ID（包含 'advisor'）

  /** 按季度统计「校园与讲坛」完成次数（下标 = 季度号 - 1） */
  collegeActivityByQuarter: number[];
  /** 按季度统计文献调研次数 */
  literatureReviewByQuarter: number[];
  /** 讲坛学期未达标时，累计到下一学期的补足次数 */
  seminarCarryoverDeficit: number;
  /** 讲坛学期考核：0 正常；1 表示已发生过一次未达标（再犯则退学） */
  seminarComplianceStrikes: number;
  /** 进入新季度时若刚触发讲坛警告，在季度总结顶栏展示 */
  semesterComplianceAlert?: string;
  /** 上一季度是否与导师有过互动（拜访/随机互动/团队类行动） */
  advisorLastInteractedQuarter: number;
  /** 文献支撑不足时，本季累计点击「跑实验/写论文/出差」次数（文献达标后清零） */
  lowLitResearchClickCount: number;

  // Assets
  assets: Asset[];
  pendingAssetOffer?: Asset; // The asset offered by the vendor this quarter
  /** 本季度推销者的随机身份称呼（神秘商人系列） */
  assetVendorTitle?: string;
  /** 本季度待处理的抉择事件（与自动结算的第一类随机事件独立） */
  pendingQuarterChoice?: PendingQuarterChoice;

  // History
  logs: GameLog[];
  moments: Moment[];
}

export interface Asset {
  id: string;
  name: string;
  description: string;
  price: number;
  sellPrice: number;
  type: 'HARDWARE' | 'SOFTWARE' | 'LIFESTYLE' | 'SERVICE';
  effect: {
    sanityCostMultiplier?: number;
    healthCostMultiplier?: number;
    energyGainMultiplier?: number;
    progressGainMultiplier?: number;
    gpuGainPerQuarter?: number;
    fundingGainPerQuarter?: number;
    reputationGainMultiplier?: number;
  };
}

export interface GameLog {
  quarter: number;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
}

export interface Action {
  id: string;
  label: string;
  description: string;
  descriptions?: string[]; // Multiple funny descriptions
  category: 'DAILY' | 'RESEARCH' | 'ASSETS' | 'TEAM';
  energyCost: number;
  sanityCost: number;
  healthCost: number;
  fundingCost: number;
  gpuCost: number;
  progressGain: number;
  favorGain: number;
  fundingGain: number;
  creditGain?: number;
  misconductChange?: number;
  labMateFavorGain?: number;
}
