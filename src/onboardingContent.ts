/** 与 App.tsx 中 Tab / RightTab 一致 */
export type OnboardingTab = 'HOME' | 'DAILY' | 'RESEARCH' | 'TEAM' | 'ASSETS';
export type OnboardingRightTab = 'LOGS' | 'MOMENTS';

const S = 'text-white font-semibold';
const T = 'text-slate-100 font-semibold';

export type TutorialStep = {
  id: string;
  title: string;
  /** 小段 HTML，可用 <strong class="text-slate-100 font-semibold"> 加粗 */
  body: string;
  /** 用于 spotlight 的元素 id，空则仅居中说明 */
  highlightId?: string;
  layoutZone?: 'ARCHIVE' | 'MAIN' | 'FEED';
  activeTab?: OnboardingTab;
  rightTab?: OnboardingRightTab;
};

export const SURVIVAL_GUIDE_META = {
  title: '入学须知',
  subtitle: '北京中关村学院 · AI 博士生生存指南',
} as const;

/** 入学须知正文（HTML 片段，不含 **） */
export const SURVIVAL_SECTIONS: {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  highlight?: string[];
}[] = [
  {
    heading: '一、核心目标',
    paragraphs: [
      `你在本作中扮演一名「北京中关村学院」<strong class="${S}">主攻人工智能与交叉学科</strong>的博士研究生。学院践行「极基础、极应用、极交叉」理念，以<strong class="${S}">项目制培养</strong>为主线。`,
      `<strong class="${S}">最终目标</strong>：在有限学制内完成各培养阶段、积累论文与声望，通过<strong class="${S}">毕业答辩</strong>，取得博士学位；并在过程中尽量保持身心健康与学术诚信。`,
    ],
  },
  {
    heading: '二、失败与退学（游戏结束）',
    bullets: [
      `<strong class="${S}">学制</strong>：共 16 个季度（约四年）。第 16 季度结束后若仍未达成「顺利毕业」答辩条件，将触发<strong class="${S}">延毕退学</strong>。`,
      `<strong class="${S}">身心与声望</strong>：理智、健康、精力<strong class="${S}">任一降至 0 及以下</strong>，或<strong class="${S}">学术声望降至 0</strong>，视为无法继续学业。`,
      `<strong class="${S}">学术不端</strong>：<strong class="${S}">学术不端嫌疑达到 100</strong> 将被认定违规，游戏结束。`,
      `<strong class="${S}">无导师</strong>：进入<strong class="${S}">第 2 学年</strong>时仍未加入任何导师团队，按培养规定无法继续注册。`,
      `<strong class="${S}">开题 / 中期超期</strong>：入组后<strong class="${S}">开题准备</strong>阶段超过约 6 个季度未完成开题，或<strong class="${S}">中期考核</strong>阶段超过开题完成后约 8 个季度仍未通过中期，可能被劝退。`,
    ],
  },
  {
    heading: '三、关键资源与指标',
    bullets: [
      `<strong class="${S}">资金 / 算力</strong>：用于日常行动、科研消耗与资产购买；每季度有补助与算力进账。`,
      `<strong class="${S}">理智 / 健康 / 精力</strong>：参与「自我调节」可恢复；科研与高压行动会持续消耗。`,
      `<strong class="${S}">学术不端嫌疑</strong>：<strong class="${S}">论文撰写</strong>有概率触发，每次增量以约 <strong class="${S}">5</strong> 为均值小幅上下浮动，并配有随机叙事说明缘由；<strong class="${S}">出差报告（顶会）</strong>有概率因现场表现<strong class="${S}">降低或升高</strong>嫌疑，结算时会显示在行动结果的「影响」中。`,
      `<strong class="${S}">学术声望 / 已发表论文</strong>：影响阶段推进与答辩门槛；答辩对声望与论文数量有硬性要求。`,
      `<strong class="${S}">阶段进度 / 学分 / 论文撰写进度</strong>：随行动推进；达到阈值会触发<strong class="${S}">阶段转换</strong>与剧情提示。`,
    ],
    highlight: ['撤稿止损可降低不端嫌疑，但会损伤声望与论文计数，请谨慎使用。'],
  },
  {
    heading: '四、界面分区（档案 / 主页 / 动态）',
    bullets: [
      `<strong class="${S}">档案</strong>（左栏 / 底栏「档案」）：个人状态条、阶段与学分、自我调节按钮、拜师后的导师简讯。`,
      `<strong class="${S}">主页</strong>（中栏 / 底栏「主页」）：<strong class="${S}">首页</strong>看简介与概览；<strong class="${S}">日常</strong>与<strong class="${S}">科研</strong>执行行动（每季度行动次数有上限）；<strong class="${S}">团队</strong>拜访导师与同门；<strong class="${S}">资产</strong>管理与神秘商人推销。`,
      `<strong class="${S}">动态</strong>（右栏 / 底栏「动态」）：<strong class="${S}">学术日志</strong>记录事件；<strong class="${S}">朋友圈</strong>含自己与他人的动态。<strong class="${S}">有新朋友圈时会出现红点</strong>，记得点开查看与互动。`,
    ],
  },
  {
    heading: '五、季度与随机事件',
    bullets: [
      `点击<strong class="${S}">进入下个季度</strong>后，会结算论文审稿、资源补助，并弹出<strong class="${S}">季度总结</strong>。`,
      `<strong class="${S}">第一类随机事件</strong>：有概率自动弹出并直接结算数值（与季度总结独立）。`,
      `<strong class="${S}">第二类培养抉择</strong>：关闭季度总结后，可能弹出<strong class="${S}">三选一</strong>事件——各选项在资金、嫌疑、声望、精力等之间<strong class="${S}">有利有弊</strong>，没有绝对最优解。`,
      `每学年<strong class="${S}">秋季</strong>可能有<strong class="${S}">实验室人事</strong>说明（离校/入组等）；与高好感师兄师姐离别时或有小礼物。`,
    ],
  },
  {
    heading: '六、其他提示',
    bullets: [
      `<strong class="${S}">担任助教</strong>：协助签到、教室设备、作业发布与统计等，可获得资金。`,
      `<strong class="${S}">校园与讲坛</strong>：参与学院相关活动，可提升<strong class="${S}">阶段进度</strong>与少量声望。`,
      `界面右上角可通过「？」再次打开本须知或<strong class="${S}">分步导览</strong>。`,
    ],
  },
];

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: '欢迎',
    body: '这是「中关村学院 · AI 博士生模拟器」的快速导览。你可以随时点「跳过」；需要时可在顶栏「？」重新打开。',
  },
  {
    id: 'header',
    title: '顶栏与季度推进',
    body: `这里显示当前<strong class="${T}">学年、季节、季度进度</strong>，以及<strong class="${T}">资金、算力</strong>和本季剩余<strong class="${T}">行动次数</strong>。准备好后点击<strong class="${T}">进入下个季度</strong>推进时间线并触发季度结算。`,
    highlightId: 'onb-header',
    layoutZone: 'MAIN',
    activeTab: 'HOME',
  },
  {
    id: 'stats',
    title: '档案 · 个人状态',
    body: `左栏「档案」中的<strong class="${T}">理智、健康、精力</strong>是生存线；<strong class="${T}">学术不端嫌疑</strong>过高会直接导致游戏结束。下方还有论文数、声望、阶段进度与学分等。`,
    highlightId: 'onb-stats-card',
    layoutZone: 'ARCHIVE',
  },
  {
    id: 'self',
    title: '档案 · 自我调节',
    body: `<strong class="${T}">校园漫步、摆烂摸鱼、外出游玩</strong>等可恢复状态或缓解压力；<strong class="${T}">撤稿止损</strong>用论文换降低不端嫌疑，但有代价。每季度次数与消耗见按钮说明。`,
    highlightId: 'onb-self-reg',
    layoutZone: 'ARCHIVE',
  },
  {
    id: 'advisor',
    title: '档案 · 导师（拜师后）',
    body: `拜师成功后，导师寄语与<strong class="${T}">好感度</strong>会出现在此。好感会影响部分科研体验；记得在「团队」里每季度互动。`,
    highlightId: 'onb-advisor',
    layoutZone: 'ARCHIVE',
  },
  {
    id: 'tabs',
    title: '主页 · 分区标签',
    body: `<strong class="${T}">首页</strong>查看个人简介与概览；<strong class="${T}">日常</strong>安排课程、讲坛、助教等；<strong class="${T}">科研</strong>推进文献、实验、论文与出差；<strong class="${T}">团队</strong>处理导师与同门；<strong class="${T}">资产</strong>购买装备与被动收益。`,
    highlightId: 'onb-tab-bar',
    layoutZone: 'MAIN',
    activeTab: 'HOME',
  },
  {
    id: 'home',
    title: '首页 · 个人卡片',
    body: '这里展示你的培养阶段、简介文案，以及论文、引用、学分等摘要，方便随时掌握「离毕业还有多远」。',
    highlightId: 'onb-home-card',
    layoutZone: 'MAIN',
    activeTab: 'HOME',
  },
  {
    id: 'daily',
    title: '日常行动',
    body: `修课、讲坛、助教等消耗行动次数，换取学分、资金、进度或好感。注意每季<strong class="${T}">最多 30 次</strong>行动，用完需进入下季度。`,
    highlightId: 'onb-main-body',
    layoutZone: 'MAIN',
    activeTab: 'DAILY',
  },
  {
    id: 'research',
    title: '科研行动',
    body: `文献、跑实验、写论文、出差报告等是论文与声望的主要来源；<strong class="${T}">写论文</strong>有概率触发学术不端嫌疑，增量以约 <strong class="${T}">5</strong> 为均值小幅波动，并会随机描述「这次哪里走了捷径」（会显示在「影响」中）；<strong class="${T}">出差</strong>则可能因表现加减嫌疑，同样会列出。`,
    highlightId: 'onb-main-body',
    layoutZone: 'MAIN',
    activeTab: 'RESEARCH',
  },
  {
    id: 'team',
    title: '团队与导师',
    body: `未拜师时可拜访、申请导师；入组后可与导师、同门<strong class="${T}">随机互动</strong>，影响好感与多项数值。`,
    highlightId: 'onb-main-body',
    layoutZone: 'MAIN',
    activeTab: 'TEAM',
  },
  {
    id: 'assets',
    title: '资产',
    body: '已拥有的装备显示在此；每季度初「神秘商人」可能上门推销，注意资金是否足够。',
    highlightId: 'onb-main-body',
    layoutZone: 'MAIN',
    activeTab: 'ASSETS',
  },
  {
    id: 'logs',
    title: '动态 · 学术日志',
    body: '右侧记录各季度重要事件与系统提示，便于回溯培养过程。',
    highlightId: 'onb-feed-panel',
    layoutZone: 'FEED',
    rightTab: 'LOGS',
  },
  {
    id: 'moments',
    title: '动态 · 朋友圈',
    body: `朋友圈会出现新动态；<strong class="${T}">列表顶部更新时，「动态」与「朋友圈」处会有红点提示</strong>。可点赞部分动态获得小幅理智回复。`,
    highlightId: 'onb-feed-panel',
    layoutZone: 'FEED',
    rightTab: 'MOMENTS',
  },
  {
    id: 'done',
    title: '导览结束',
    body: '祝你在中关村学院顺利扛过项目制培养、论文与答辩。需要时随时点击顶栏「？」查看入学须知或重播本导览。',
  },
];
