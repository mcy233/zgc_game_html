import { Action, AdvisorType, GameState, Asset } from './types';
import { BZA_WELCOME_LOG } from './schoolBranding';

/** 每季度可用于行动、拜访、互动、自我调节等的总次数上限 */
export const ACTIONS_PER_QUARTER = 20;

export const INITIAL_STATE: GameState = {
  quarter: 1,
  year: 1,
  season: '秋季',
  playerName: '',
  playerContactEmail: '',
  playerOfficeRoom: '',
  unlockedHonors: [],
  researchInterestGroup: 0,
  sanity: 80,
  health: 90,
  energy: 100,
  misconduct: 0,
  reputation: 20,
  funding: 5000,
  gpuCredits: 1000,
  credits: 0,
  progress: 0,
  paperWritingProgress: 0,
  submittedPapers: 0,
  papersPublished: 0,
  citations: 0,
  advisorFavor: 0,
  milestone: '课程学习',
  hasAdvisor: false,
  advisorName: '未选择',
  advisorType: 'SUPPORTIVE',
  potentialAdvisors: {
    MICROMANAGER: 0,
    GHOST: 0,
    SUPPORTIVE: 0,
    CELEBRITY: 0,
  },
  advisorJoinedQuarter: 0,
  proposalFinishedQuarter: 0,
  projectQuarters: 0,
  labMates: [],
  walksThisQuarter: 0,
  actionsThisQuarter: 0,
  actionsSinceExternalMoment: 0,
  externalMomentThreshold: 4 + Math.floor(Math.random() * 8),
  interactionsThisQuarter: [],
  assets: [],
  logs: [{ quarter: 1, message: BZA_WELCOME_LOG, type: 'INFO' }],
  moments: [],
};

/** 每季度登门推销时的随机身份（统一归为「神秘商人」势力） */
export const ASSET_VENDOR_TITLES = [
  '科技公司推销员',
  '不知名的神奇小商贩',
  '戴鸭舌帽的硬盘贩子',
  '实验室楼道里的流动货郎',
  '只会出现在季初的黑市中间商',
  '二手算力平台线下代理',
  '声称和导师很熟的设备掮客',
  '校园系统里查无此人的神秘客',
  '推着行李箱路过的「海归」装备商',
  '学术交流会上硬塞名片的器材顾问',
  '深夜论坛私信你的匿名出货人',
] as const;

export function pickRandomAssetVendorTitle(): string {
  const i = Math.floor(Math.random() * ASSET_VENDOR_TITLES.length);
  return ASSET_VENDOR_TITLES[i];
}

export const ADVISOR_INTERACTIONS = [
  {
    id: 'adv_lit_report',
    label: '文献分享汇报',
    description: '在导师面前展示你最近阅读的文献。',
    texts: [
      '你详细汇报了最近的顶会论文，导师对你的理解深度表示赞赏。',
      '汇报过程中导师指出了你忽略的一个关键细节，让你受益匪浅。',
      '导师听完后和你探讨了该方向的未来趋势，你的科研视野得到了拓宽。'
    ],
    effect: { sanity: 5, progress: 6, energy: -10 }
  },
  {
    id: 'adv_project_discuss',
    label: '项目进度讨论',
    description: '主动找导师对齐当前项目的进度和难点。',
    texts: [
      '导师帮你梳理了项目的逻辑，原本混乱的思路瞬间清晰了。',
      '针对你遇到的 Bug，导师给出了几个非常有建设性的调试建议。',
      '讨论非常高效，导师决定为你增加一些算力资源支持。'
    ],
    effect: { progress: 9, advisorFavor: 5, energy: -15 }
  },
  {
    id: 'adv_career_talk',
    label: '学术生涯规划',
    description: '向导师请教未来的职业发展和学术追求。',
    texts: [
      '导师分享了他当年的奋斗史，极大地鼓舞了你的斗志。',
      '导师帮你分析了工业界和学术界的利弊，你对未来有了更清晰的认识。',
      '这次谈话让你感受到了导师的人格魅力，科研动力倍增。'
    ],
    effect: { sanity: 15, reputation: 2, energy: -5 }
  },
  {
    id: 'adv_paper_polishing',
    label: '论文润色指导',
    description: '请导师亲自下场帮你修改论文的摘要和结论。',
    texts: [
      '导师的神来之笔让你的论文瞬间提升了一个档次。',
      '导师教你如何用更学术的语言包装实验结果，学到了很多。',
      '虽然被导师批得体无完肤，但论文的逻辑确实严密了许多。'
    ],
    effect: { paperWritingProgress: 5, advisorFavor: 2, energy: -20 }
  },
  {
    id: 'adv_group_dinner',
    label: '单独请教午餐',
    description: '利用午餐时间与导师进行非正式的学术交流。',
    texts: [
      '在轻松的氛围下，导师透露了一些领域内的学术八卦和内幕。',
      '导师关心了你的生活状况，让你感受到了实验室的温暖。',
      '午餐间的闲聊触发了你对新课题的灵感。'
    ],
    effect: { sanity: 10, advisorFavor: 10, energy: -5, funding: -100 }
  },
  {
    id: 'adv_lab_meeting',
    label: '组会单独汇报',
    description: '在周例会上向全组展示本周实验进展。',
    texts: [
      '你硬着头皮讲完 PPT，师兄师姐的提问比审稿人还犀利。',
      '导师当场画白板帮你理清假设，全组都对你的方向有了新认识。',
      '汇报超时了十分钟，但导师说「这个点值得深挖」。'
    ],
    effect: { progress: 6, reputation: 3, energy: -18, sanity: -5 }
  },
  {
    id: 'adv_gpu_request',
    label: '申请算力资源',
    description: '向导师说明实验规模，申请更多 GPU 时长。',
    texts: [
      '你拿出 Loss 曲线和显存占用表，导师点头批了额外集群额度。',
      '导师让你先复现 baseline 再谈加卡，你连夜把对比实验补齐。',
      '导师把自己的卡号借你插队，你感动得差点当场写进致谢。'
    ],
    effect: { gpuCredits: 400, advisorFavor: 3, energy: -12, progress: 6 }
  }
];

export const LABMATE_INTERACTIONS = [
  {
    id: 'mate_gym',
    label: '健身长跑',
    description: '被师兄/师姐拉去操场跑一公里。',
    texts: [
      '大汗淋漓之后，感觉身体轻盈了许多，科研压力也释放了不少。',
      '虽然跑得气喘吁吁，但你的心肺功能得到了锻炼。',
      '跑步时和同门交流了近况，心情大好。'
    ],
    effect: { health: 10, sanity: 5, energy: -15 }
  },
  {
    id: 'mate_code_debug',
    label: '协助调代码',
    description: '请同门帮忙看看你那个跑不通的 Bug。',
    texts: [
      '同门一眼就看出了你的低级错误，困扰你三天的 Bug 终于解开了！',
      '你们一起重构了核心模块，代码运行效率大幅提升。',
      '在交流中你学到了同门的调试神技。'
    ],
    effect: { progress: 6, labMateFavor: 10, energy: -10 }
  },
  {
    id: 'mate_hotpot',
    label: '深夜火锅',
    description: '实验跑完后，大家一起去校门口吃顿火锅。',
    texts: [
      '火锅的热气驱散了科研的疲惫，大家聊得非常开心。',
      '在饭桌上，大家集体吐槽了最近的学术压力，心理平衡了许多。',
      '这顿火锅让你们的战友情更加深厚了。'
    ],
    effect: { sanity: 15, energy: 10, funding: -150, labMateFavor: 15 }
  },
  {
    id: 'mate_paper_reading',
    label: '互助读论文',
    description: '和同门交换阅读最近的顶会论文并互相讲解。',
    texts: [
      '同门的讲解让你快速理解了那篇晦涩难懂的数学推导。',
      '你们针对论文中的创新点展开了激烈的辩论，碰撞出了火花。',
      '这种互助学习模式让你们的科研进度都加快了。'
    ],
    effect: { progress: 6, sanity: 5, energy: -10 }
  },
  {
    id: 'mate_game_night',
    label: '宿舍开黑',
    description: '晚上回宿舍和同门打几局游戏放松一下。',
    texts: [
      '一波连胜让你们心情大悦，暂时忘掉了论文的烦恼。',
      '虽然输得很惨，但大家互相甩锅的过程充满了快感。',
      '适当的游戏放松让你的大脑得到了休息。'
    ],
    effect: { sanity: 20, energy: -10, labMateFavor: 10 }
  },
  {
    id: 'mate_coffee_break',
    label: '下午茶闲聊',
    description: '在茶歇间和同门交流学术圈的最新动向。',
    texts: [
      '同门告诉你某个顶会的审稿标准变了，这个信息非常关键。',
      '闲聊中你们发现了一个可以合作的研究点。',
      '一杯咖啡的时间，让你紧绷的神经得到了舒缓。'
    ],
    effect: { sanity: 8, reputation: 1, energy: 5 }
  },
  {
    id: 'mate_mock_interview',
    label: '模拟面试',
    description: '互相进行学术或找工作的模拟面试。',
    texts: [
      '同门的尖锐提问让你意识到了自己表达上的不足。',
      '通过模拟，你对自己的研究成果有了更自信的表达方式。',
      '你们互相分享了面试技巧和避坑指南。'
    ],
    effect: { reputation: 5, progress: 3, energy: -15 }
  },
  {
    id: 'mate_data_cleaning',
    label: '合力洗数据',
    description: '面对海量原始数据，大家分工合作进行清洗。',
    texts: [
      '人多力量大，原本要干一周的活，一天就干完了。',
      '你们开发了一套自动清洗脚本，一劳永逸。',
      '枯燥的工作因为有了同门的陪伴而显得不再难熬。'
    ],
    effect: { progress: 9, labMateFavor: 5, energy: -20 }
  },
  {
    id: 'mate_badminton',
    label: '羽毛球对决',
    description: '去体育馆打一场酣畅淋漓的羽毛球。',
    texts: [
      '几个杀球让你把对审稿人的怨气全发泄了出来。',
      '运动后的多巴胺让你重新找回了对生活的热爱。',
      '和同门配合默契，你们赢得了双打比赛。'
    ],
    effect: { health: 12, sanity: 10, energy: -15 }
  },
  {
    id: 'mate_lab_cleaning',
    label: '实验室大扫除',
    description: '清理工位和服务器机房，改善科研环境。',
    texts: [
      '整洁的环境让你的心情也变得明亮起来。',
      '你们在角落里发现了一台被遗忘的高性能服务器！',
      '大家分工明确，实验室焕然一新。'
    ],
    effect: { sanity: 5, gpuCredits: 100, energy: -10 }
  },
  {
    id: 'mate_seminar',
    label: '蹭组内小讲座',
    description: '听师兄讲了一小时方法论，记了满满三页笔记。',
    texts: [
      '师兄把调参讲成了玄学，但你居然听懂了关键三板斧。',
      '茶歇时大家围着白板争论，你第一次觉得自己也在圈里。',
      '讲座结束师兄把 slides 发你，文件名还是「最终版_真的最终」。'
    ],
    effect: { progress: 6, sanity: 6, energy: -12, labMateFavor: 8 }
  },
  {
    id: 'mate_lab_bbq',
    label: '天台烧烤局',
    description: '课题组凑钱买肉，在天台简易烧烤摊聊到半夜。',
    texts: [
      '油烟和笑声混在一起，你暂时忘了审稿意见有多毒舌。',
      '师弟烤糊了三串鸡翅，全组一致投票「科研可复现，烧烤不可」。',
      '有人提起延毕话题，大家默契碰杯：「先吃完再说。」'
    ],
    effect: { sanity: 18, health: 6, energy: 8, funding: -120, labMateFavor: 12 }
  },
  {
    id: 'mate_paper_idea',
    label: '白板头脑风暴',
    description: '和同门在白板上画架构图，碰撞出一个可写的小创新点。',
    texts: [
      '你们把 Related Work 画成思维导图，突然发现一个没人填的坑。',
      '争论到嗓子哑，最后一致同意「先跑通再讲故事」。',
      '师姐一句「这个可以当 ablation」让你眼睛发亮。'
    ],
    effect: { progress: 9, paperWritingProgress: 3, energy: -14, labMateFavor: 10 }
  }
];

/**
 * 资产贴图两种方式（二选一即可，程序优先雪碧图）：
 * 1）雪碧图：`public/assets/asset_atlas.png`，固定 **4 列 × 2 行**、每格等大，**行优先**顺序与下列 ASSETS_LIBRARY **逐条对应**（共 8 格）。
 * 2）单图：仍可将 `{id}.png` 放在 `public/assets/`，在无雪碧图或雪碧加载失败时作为回退。
 */
export const ASSETS_LIBRARY: Asset[] = [
  {
    id: 'noise_canceling_headphones',
    name: '降噪耳机',
    description: '屏蔽实验室的喧嚣。降低科研行动的理智消耗。',
    price: 1500,
    sellPrice: 500,
    type: 'HARDWARE',
    effect: { sanityCostMultiplier: 0.8 }
  },
  {
    id: 'premium_coffee_machine',
    name: '胶囊咖啡机',
    description: '续命神器。提升摸鱼时的精力恢复。',
    price: 2000,
    sellPrice: 800,
    type: 'LIFESTYLE',
    effect: { energyGainMultiplier: 1.2 }
  },
  {
    id: 'ergonomic_mouse',
    name: '人体工学鼠标',
    description: '保护手腕。降低论文撰写的健康消耗。',
    price: 800,
    sellPrice: 200,
    type: 'HARDWARE',
    effect: { healthCostMultiplier: 0.7 }
  },
  {
    id: 'cloud_computing_voucher',
    name: '云算力充值卡',
    description: '每季度额外提供算力资源。',
    price: 3000,
    sellPrice: 0,
    type: 'SERVICE',
    effect: { gpuGainPerQuarter: 500 }
  },
  {
    id: 'proofreading_service',
    name: '论文润色服务',
    description: '让你的英语看起来像母语。提升论文撰写进度。',
    price: 2500,
    sellPrice: 0,
    type: 'SERVICE',
    effect: { progressGainMultiplier: 1.2 }
  },
  {
    id: 'vitamin_supplements',
    name: '复合维生素',
    description: '增强体质。降低所有行动的健康消耗。',
    price: 600,
    sellPrice: 100,
    type: 'LIFESTYLE',
    effect: { healthCostMultiplier: 0.9 }
  },
  {
    id: 'stress_ball',
    name: '减压捏捏乐',
    description: '面对导师时的心理防线。降低拜访导师的理智消耗。',
    price: 100,
    sellPrice: 10,
    type: 'LIFESTYLE',
    effect: { sanityCostMultiplier: 0.5 }
  },
  {
    id: 'smart_watch',
    name: '智能运动手表',
    description: '实时监测心率。降低集体加班的健康消耗。',
    price: 1800,
    sellPrice: 600,
    type: 'HARDWARE',
    effect: { healthCostMultiplier: 0.8 }
  }
];

/** 与 `asset_atlas.png` 中格子顺序一致（由 ASSETS_LIBRARY 推导，勿手动改序） */
export const ASSET_ATLAS_ORDER: readonly string[] = ASSETS_LIBRARY.map(a => a.id);

/** 与 `public/assets/asset_atlas.png` 实测像素一致（换图后请读 PNG IHDR 更新） */
export const ASSET_ATLAS_CONFIG = {
  src: '/assets/asset_atlas.png',
  cols: 4,
  rows: 2,
  pixelWidth: 1376,
  pixelHeight: 768,
} as const;

/**
 * 头像雪碧图：`public/assets/avatar_atlas.png`，**4 列 × 3 行**、每格等大、行优先编号 0…11。
 * 对应关系（生成大图时请严格按此排版）：
 * 第 1 行：玩家 | 神秘商人 | 同门·师兄 | 同门·师姐
 * 第 2 行：同门·师弟 | 同门·师妹 | 导师·控制型 | 导师·放养型
 * 第 3 行：导师·支持型 | 导师·名流型 | （预留） | （预留）
 */
export const AVATAR_ATLAS_ORDER = [
  'player',
  'merchant',
  '师兄',
  '师姐',
  '师弟',
  '师妹',
  'advisor_MICROMANAGER',
  'advisor_GHOST',
  'advisor_SUPPORTIVE',
  'advisor_CELEBRITY',
  '_reserved',
  '_reserved',
] as const;

/** 与 `public/assets/avatar_atlas.png` 实测像素一致（换图后请读 PNG IHDR 更新） */
export const AVATAR_ATLAS_CONFIG = {
  src: '/assets/avatar_atlas.png',
  cols: 4,
  rows: 3,
  pixelWidth: 1200,
  pixelHeight: 896,
} as const;

export const ACTIONS: Action[] = [
  // 日常板块
  {
    id: 'take_course',
    label: '修读课程',
    description: '参加北京中关村学院为 AI 与交叉方向安排的核心课程与学分模块。',
    descriptions: [
      '项目制培养里还要抢学分课，坐在第一排昏昏欲睡，但必须强撑。',
      '教授在讲台上口若悬河，你在台下疯狂记笔记（其实在画小人）。',
      '作业多到怀疑人生，但教务系统里的学分条是真香。',
      '和同学讨论课程项目，发现大家其实都没听懂——但彼此心照不宣。'
    ],
    category: 'DAILY',
    energyCost: 30,
    sanityCost: 10,
    healthCost: 5,
    fundingCost: 200,
    gpuCost: 0,
    progressGain: 6,
    favorGain: 0,
    fundingGain: 0,
    creditGain: 6,
  },
  {
    id: 'college_activity',
    label: '校园与讲坛',
    description: '参加中关村学院的讲座、智汇讲坛或交流活动，刷存在感与人脉。',
    descriptions: [
      '中关村「智汇讲坛」散场后蹭到茶歇，披萨和可乐就是继续肝论文的动力。',
      '前沿报告听得半懂不懂，但签到二维码扫得飞快——学院活动参与率 +1。',
      '茶歇时端着纸杯假装镇定，试图和隔壁课题组的师兄搭上话。',
      '学院组织的交流活动上，所有人表面聊 AI 治理，内心在算还有几个季度毕业。'
    ],
    category: 'DAILY',
    energyCost: 20,
    sanityCost: -10,
    healthCost: 0,
    fundingCost: 100,
    gpuCost: 0,
    progressGain: 3,
    favorGain: 2,
    fundingGain: 0,
  },
  {
    id: 'teaching_assistant',
    label: '担任助教',
    description:
      '协助开课老师整理签到、操控教室设备、发布与统计作业提交情况等助教事务。',
    descriptions: [
      '帮授课老师整理课堂签到表，发现总有人用「设备调试中」当迟到理由。',
      '报告厅里你负责切 PPT、试麦克风，感觉自己像隐形导演。',
      '在系统里发布本周阅读材料，顺便统计谁没交——名单一键导出发给导师。',
      '帮老师汇总作业提交率，数据难看时你学会了如何写委婉的提醒话术。',
    ],
    category: 'DAILY',
    energyCost: 40,
    sanityCost: 15,
    healthCost: 5,
    fundingCost: 0,
    gpuCost: 0,
    progressGain: 0,
    favorGain: 0,
    fundingGain: 2000,
  },

  // 科研板块
  {
    id: 'literature_review',
    label: '文献调研',
    description: '阅读最新顶会论文，对齐学院「极交叉」视野，寻找研究灵感。',
    descriptions: [
      '打开了 20 个标签页，最后只看懂了 Abstract——也算对得起中关村学院的网速。',
      '发现你想做的 Idea 在三年前就被别人做过了，心碎一地。',
      '在 Related Work 里挖到金矿，隐约看到「极应用」能落在哪里。',
      '盯着公式看了半小时，感觉它们在嘲笑你的智商。'
    ],
    category: 'RESEARCH',
    energyCost: 25,
    sanityCost: 5,
    healthCost: 2,
    fundingCost: 0,
    gpuCost: 0,
    progressGain: 6,
    favorGain: 1,
    fundingGain: 0,
  },
  {
    id: 'run_experiments',
    label: '运行实验',
    description: '在学院算力与实验平台上跑模型、调参与记录结果。',
    descriptions: [
      '看着 Loss 曲线稳步下降，感觉自己离诺贝尔奖又近了一步。',
      '实验跑了一半显存溢出了，你对着屏幕发出了无声的尖叫。',
      '为了赶 Deadline，你偷偷改了几个超参数。',
      '服务器风扇的轰鸣声是你听过最动听的摇篮曲。'
    ],
    category: 'RESEARCH',
    energyCost: 35,
    sanityCost: 10,
    healthCost: 5,
    fundingCost: 0,
    gpuCost: 300,
    progressGain: 9,
    favorGain: 2,
    fundingGain: 0,
  },
  {
    id: 'write_paper',
    label: '论文撰写',
    description: '将实验结果转化为文字。极度消耗理智。',
    descriptions: [
      '在 Word 里打下一个 "The"，然后盯着屏幕发呆了一小时。',
      '疯狂套用 Overleaf 模板，感觉自己是个排版大师。',
      '为了凑字数，你把一个简单的句子改写成了三行长难句。',
      '凌晨三点的实验室，只有你和你的论文在互相折磨。'
    ],
    category: 'RESEARCH',
    energyCost: 40,
    sanityCost: 25,
    healthCost: 10,
    fundingCost: 0,
    gpuCost: 0,
    progressGain: 9,
    favorGain: 5,
    fundingGain: 0,
  },
  {
    id: 'conference_trip',
    label: '出差报告',
    description: '赴顶会 Oral/Poster，把中关村学院的牌子扛到国际会场。',
    descriptions: [
      '在海报前站了四小时，口干舌燥但收获了不少点赞。',
      '在台上讲 PPT 时手心冒汗，生怕下面有人提刁钻问题。',
      '会议间隙在异国他乡游玩，这才是出差的真正目的。',
      '和同行大佬交换了名片，感觉自己已经打入了学术圈内部。'
    ],
    category: 'RESEARCH',
    energyCost: 50,
    sanityCost: -10,
    healthCost: 10,
    fundingCost: 1500,
    gpuCost: 0,
    progressGain: 6,
    favorGain: 10,
    fundingGain: 0,
  },

  // 团队板块
  {
    id: 'team_building',
    label: '发起团建',
    description: '组织实验室成员聚餐或出游，大幅提升同门好感。',
    descriptions: [
      '大家在火锅店抢肉吃，这一刻没有学术，只有干饭。',
      'KTV 里师兄的高音震碎了你的理智，但气氛真的很嗨。',
      '团建时大家集体吐槽导师，实验室的凝聚力瞬间达到了顶峰。',
      '组织了一场剧本杀，发现平时木讷的师弟竟然是个戏精。'
    ],
    category: 'TEAM',
    energyCost: 30,
    sanityCost: -20,
    healthCost: 0,
    fundingCost: 1000,
    gpuCost: 0,
    progressGain: 0,
    favorGain: 5,
    fundingGain: 0,
    labMateFavorGain: 15,
  },
  {
    id: 'group_overtime',
    label: '集体加班',
    description: '和大家一起在实验室熬夜，进度飞快但身心俱疲。',
    descriptions: [
      '实验室里充满了咖啡和红牛的味道，大家都在和 Deadline 赛跑。',
      '凌晨两点，你和师姐在走廊里相视一笑，笑容中透着一丝凄凉。',
      '集体加班变成了集体点外卖，实验室变成了深夜食堂。',
      '虽然很累，但看到大家都在努力，你也不好意思先走。'
    ],
    category: 'TEAM',
    energyCost: 50,
    sanityCost: 20,
    healthCost: 15,
    fundingCost: 0,
    gpuCost: 0,
    progressGain: 9,
    favorGain: 10,
    fundingGain: 0,
    labMateFavorGain: 5,
  },
  {
    id: 'visit_advisor',
    label: '拜访求教',
    description: '带着问题（或水果）去办公室找导师。',
    descriptions: [
      '在导师办公室门口深呼吸三次才敢敲门。',
      '导师对你的进展表示满意，并顺手又给你塞了两个新任务。',
      '和导师讨论学术，最后变成了导师对他人生的感悟分享。',
      '导师看了一眼你的代码，皱着眉头说："这写的是什么？"'
    ],
    category: 'TEAM',
    energyCost: 20,
    sanityCost: 5,
    healthCost: 0,
    fundingCost: 100,
    gpuCost: 0,
    progressGain: 6,
    favorGain: 15,
    fundingGain: 0,
  },
];

export const ADVISOR_PROFILES: Record<AdvisorType, { 
  label: string; 
  description: string; 
  favorMultiplier: number; 
  progressMultiplier: number;
  favorGainRate: number; // How fast favor accumulates (multiplier)
  requirements: { reputation?: number; credits?: number; papers?: number };
}> = {
  MICROMANAGER: {
    label: '微观管理者',
    description: '项目制团队里常见：每几小时要一次进展。推进快，但理智掉得也快。',
    favorMultiplier: 0.5,
    progressMultiplier: 1.5,
    favorGainRate: 0.8,
    requirements: { reputation: 30 },
  },
  GHOST: {
    label: '学术鸽子',
    description: '放养型导师：邮件轮回。好感难刷，但适合自驱强的中关村学院学生。',
    favorMultiplier: 0.2,
    progressMultiplier: 0.8,
    favorGainRate: 0.5,
    requirements: { credits: 12 },
  },
  SUPPORTIVE: {
    label: '慈父/慈母型',
    description: '真心关心你扛不扛得住项目制节奏，数值上相对均衡。',
    favorMultiplier: 1.0,
    progressMultiplier: 1.0,
    favorGainRate: 1.2,
    requirements: { reputation: 10 },
  },
  CELEBRITY: {
    label: '学术大牛',
    description: '对外代表学院门面，日程爆满。引用潜力高，但线下难约。',
    favorMultiplier: 1.5,
    progressMultiplier: 1.2,
    favorGainRate: 0.6,
    requirements: { reputation: 50, papers: 1 },
  },
};

export const SEASONS: ('秋季' | '冬季' | '春季' | '夏季')[] = ['秋季', '冬季', '春季', '夏季'];

/** 论文撰写概率触发学术不端时，嫌疑增量以 5 为均值小幅波动（约 2～8，整型） */
export function rollWritePaperMisconductDelta(): number {
  return Math.max(2, Math.min(8, Math.round(5 + (Math.random() - 0.5) * 5)));
}

/** 文献调研：论文撰写进度约 +3%，小幅上下浮动（整型，约 1～5） */
export function rollLiteraturePaperProgressDelta(): number {
  return Math.max(1, Math.min(5, Math.round(3 + (Math.random() - 0.5) * 2)));
}

/** 运行实验：论文撰写进度约 +5%，小幅上下浮动（整型，约 3～8） */
export function rollExperimentPaperProgressDelta(): number {
  return Math.max(3, Math.min(8, Math.round(5 + (Math.random() - 0.5) * 4)));
}

/** 与「赶进度、凑图表、写论文」语境契合的随机叙事，用于结果弹窗与日志 */
export const WRITE_PAPER_MISCONDUCT_NARRATIVES: readonly string[] = [
  '为了赶进度，你偷偷改过一张核心对比表里的数字，让曲线看起来更「漂亮」一点。',
  '消融少跑了两组，你在正文里用「篇幅所限」一笔带过，心里知道这是在糊弄未来审稿人。',
  '引用了一条相关性存疑的二手出处，只因为写起来更顺口、更像那么回事。',
  '把几次不理想的实验截图裁掉不利部分，只留了能支撑结论的那一帧。',
  'Related Work 里把对手工作写轻了半档，Related 读起来像只有你这一条路可走。',
  '为了把 Loss 画好看，你悄悄换了一个更「友好」的纵轴刻度，脚注里没提。',
  '可复现性检查能拖就拖，你在方法节先写了理想条件下的版本，备注里再小声补一句限制。',
  '把未显著的结果归到附录最深处，目录里看起来像从未发生过。',
  '为了对上导师上周口头里的「故事线」，你微调了实验设定的表述，和原始记录差了一点点。',
  '拼图中有一张图其实是旧实验凑的，你赌没人会翻到半年前的组会 PPT 对照。',
  '统计显著性那一格 p 值你手滑「对齐」到模板里常见的星号档，事后不敢细看原始表格。',
  '结论段多写了一句「充分证明」，心里清楚证据链其实还差半截。',
];
