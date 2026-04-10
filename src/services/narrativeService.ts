import { GameState, AdvisorType, MomentFeedSource } from "../types";
import { BZA } from "../schoolBranding";
import { buildStudentProfile, studentProfileToPlainText } from "../studentProfileContent";
import { isLLMReady, chatCompletion, extractJSON } from "./llmClient";
import { WRITE_PAPER_MISCONDUCT_NARRATIVES } from "../constants";
import { EXPERIMENT_LIT_WEAK_LINES } from "../gameProgressionRules";

/**
 * 叙事与随机文案生成
 * - isLLMReady() 为 true 时走远端大模型，失败静默回退本地题库
 * - 否则走本地随机池（与原来行为一致）
 */

/* ------------------------------------------------------------------ */
/*  工具：把 GameState 摘要给大模型当上下文（避免暴露整体结构）          */
/* ------------------------------------------------------------------ */

function stateDigest(s: GameState): string {
  return [
    `学校：${BZA.name}（${BZA.triad}）`,
    `姓名：${s.playerName}`,
    `第 ${s.quarter}/16 季度（第${s.year}年${s.season}）`,
    `阶段：${s.milestone}`,
    `理智=${s.sanity} 健康=${s.health} 精力=${s.energy}`,
    `学术不端嫌疑=${s.misconduct} 声望=${s.reputation}`,
    `资金=${s.funding} 算力=${s.gpuCredits}`,
    `已发论文=${s.papersPublished} 引用=${s.citations}`,
    s.hasAdvisor ? `导师：${s.advisorName}（${advisorTypeLabel(s.advisorType)}）好感=${s.advisorFavor}` : '尚未选导师',
  ].join('；');
}

function advisorTypeLabel(t: AdvisorType): string {
  const m: Record<AdvisorType, string> = {
    MICROMANAGER: '微管理型',
    GHOST: '消失型',
    SUPPORTIVE: '温暖鼓励型',
    CELEBRITY: '学术大佬型',
  };
  return m[t] || t;
}

/* ================================================================== */
/*  1. 导师寄语                                                        */
/* ================================================================== */

const ADVISOR_FEEDBACK_SYSTEM = `你是一个中国高校 AI 方向博士生模拟器游戏中的导师，请根据给定的导师类型和学生状态，生成**一句**导师寄语（15~50字）。

导师类型说明：
- 微管理型：事无巨细都要管，喜欢挑毛病，语气严厉，经常关注实验记录/代码/PPT 等细节
- 消失型：经常出差，回复极简，有时忘记学生在做什么，语气冷淡疏远
- 温暖鼓励型：关心身心健康，语气温和，鼓励但也会中肯提醒
- 学术大佬型：关注论文档次和学术影响力，常提到顶会/大牛/大项目，口气宏大

要求：
- 口语化，像真实导师对学生说的话
- 有学术圈梗，幽默但不过分
- 不要用引号包裹，直接输出这句话
- 不要输出任何解释或前缀`;

async function llmAdvisorFeedback(state: GameState): Promise<string> {
  const user = `导师类型：${advisorTypeLabel(state.advisorType)}\n学生状态：${stateDigest(state)}`;
  return chatCompletion([
    { role: 'system', content: ADVISOR_FEEDBACK_SYSTEM },
    { role: 'user', content: user },
  ], { temperature: 1.0, maxTokens: 2048, source: 'advisorFeedback' });
}

export async function generateAdvisorFeedback(state: GameState): Promise<string> {
  if (isLLMReady()) {
    try { return await llmAdvisorFeedback(state); } catch { /* fall through */ }
  }
  return localAdvisorFeedback(state);
}

function localAdvisorFeedback(state: GameState): string {
  const feedbacks: Record<AdvisorType, string[]> = {
    MICROMANAGER: [
      "你的实验记录里第 42 行那个变量名写错了，改一下。",
      "为什么这周只跑了 10 组实验？我需要看到更多数据。",
      "你的 PPT 字体大小不统一，这会影响我们的学术形象。",
      "我看到你昨天下午三点不在实验室，去哪了？",
      "这篇论文的参考文献格式不对，重新检查一遍。",
      "你的代码注释太少了，别人怎么维护？",
      "周报写得太简单了，要把每小时的进展都列出来。"
    ],
    GHOST: [
      "已阅。",
      "挺好的，继续做吧。",
      "我最近在出差，回聊。",
      "那个...你最近在做什么课题来着？",
      "发邮件说吧，我现在没空。",
      "嗯，不错。",
      "你自己决定就好，我相信你的判断。"
    ],
    SUPPORTIVE: [
      "最近辛苦了，注意休息，身体是科研的本钱。",
      "这个思路很有趣，我们可以深入讨论一下。",
      "没关系，失败是成功的母亲，再试一次。",
      "我很看好你这个方向，加油！",
      "如果遇到困难，随时来找我聊天。",
      "你这周的进展很大，保持这个节奏。",
      "别压力太大，博士只是人生的一小部分。"
    ],
    CELEBRITY: [
      "我刚从 NeurIPS 回来，大家都在讨论这个方向。",
      "这个结果能发 Nature 吗？如果不能，就别浪费时间了。",
      "我下周要去给个 Keynote，你把结果整理成一页纸给我。",
      "我刚和那个大牛聊过，他说你的想法很有前景。",
      "我们需要一个更 High-level 的故事来包装这个实验。",
      "这个项目如果做成了，你就是领域内的领军人物。",
      "我最近在申一个千万级的项目，你帮我写个技术路线。"
    ]
  };
  const list = feedbacks[state.advisorType] || ["继续努力。"];
  if (state.sanity < 20) return "我看你状态不太对，要不先休个假？";
  if (state.misconduct > 40) return "最近有人反映你的数据有问题，你自己注意点。";
  return list[Math.floor(Math.random() * list.length)];
}

/* ================================================================== */
/*  2. 季度随机事件                                                    */
/* ================================================================== */

const VALID_EFFECT_FIELDS = [
  'sanity', 'health', 'energy', 'funding', 'gpuCredits',
  'progress', 'reputation', 'citations', 'advisorFavor', 'misconduct',
] as const;

const RANDOM_EVENT_SYSTEM = `你是一个中国高校 AI 方向博士生模拟器游戏的随机事件生成器。

请生成**一个**博士生活中可能发生的随机事件，输出**严格 JSON**，格式如下：
{
  "title": "事件标题（4~8字）",
  "description": "事件描述（1~2句话，口语化、幽默、有代入感）",
  "effect": { "字段名": 数值, ... }
}

effect 可选字段与建议范围：
- sanity: 理智 (-20 ~ +15)
- health: 健康 (-15 ~ +10)
- energy: 精力 (-40 ~ +20)
- funding: 资金 (-500 ~ +500)
- gpuCredits: 算力 (-300 ~ +200)
- progress: 科研进度 (-6 ~ +12)
- reputation: 学术声望 (-5 ~ +5)
- citations: 引用数 (0 ~ +15，仅限已有论文的学生)
- advisorFavor: 导师好感 (-10 ~ +15)
- misconduct: 学术不端嫌疑 (-5 ~ +10)

规则：
- effect 中选 1~3 个字段即可，不要全选
- 数值须为整数，不要超出范围
- 不要生成「论文被拒」类事件
- 风格：真实博士生日常，有梗但不低俗
- 只输出 JSON，不要有其他文字`;

async function llmRandomEvent(state: GameState): Promise<{ title: string; description: string; effect: Partial<GameState> }> {
  const user = `当前状态：${stateDigest(state)}`;
  const text = await chatCompletion([
    { role: 'system', content: RANDOM_EVENT_SYSTEM },
    { role: 'user', content: user },
  ], { temperature: 1.0, maxTokens: 4096, source: 'randomEvent' });

  const obj = extractJSON<{ title: string; description: string; effect: Record<string, number> }>(text);
  if (!obj.title || !obj.description || !obj.effect) throw new Error('Invalid event structure');

  const sanitized: Record<string, number> = {};
  for (const k of Object.keys(obj.effect)) {
    if ((VALID_EFFECT_FIELDS as readonly string[]).includes(k)) {
      sanitized[k] = Math.round(obj.effect[k]);
    }
  }
  if (Object.keys(sanitized).length === 0) throw new Error('No valid effect fields');

  return { title: obj.title, description: obj.description, effect: sanitized as Partial<GameState> };
}

export async function generateRandomEvent(state: GameState): Promise<{ title: string; description: string; effect: Partial<GameState> }> {
  if (isLLMReady()) {
    try { return await llmRandomEvent(state); } catch { /* fall through */ }
  }
  return localRandomEvent(state);
}

function localRandomEvent(state: GameState): { title: string; description: string; effect: Partial<GameState> } {
  const allEvents = [
    { title: "GPU 集群维护", description: "学校的 GPU 集群要维护三天，你的实验被迫中断了。", effect: { gpuCredits: -200, sanity: -5 } },
    { title: "深夜灵感", description: "你在洗澡时突然想到了一个绝妙的算法优化思路。", effect: { progress: 6, energy: -10 } },
    { title: "免费披萨", description: "隔壁实验室开会剩下了很多披萨，你饱餐了一顿。", effect: { health: 5, energy: 20 } },
    { title: "水电通知", description: "宿舍水电预缴扣款短信准时弹出：余额又薄了一层。你望着走廊里的「节约用电」标语，觉得钱包比灯先熄。", effect: { sanity: -8, funding: -200 } },
    { title: "行政填表", description: "学院突然要求补交一沓纸质材料，你在教务处排队排到脚底发麻，回来只想躺平。", effect: { sanity: -10, energy: -15 } },
    { title: "代码 Bug", description: "你发现跑了一周的实验结果全是错的，因为一个正负号写反了。", effect: { sanity: -15, progress: -6 } },
    { title: "顶会截稿", description: "为了赶 DDL，你已经在实验室连续奋战了 48 小时。", effect: { energy: -40, health: -10, progress: 12 } },
    { title: "学术讲座", description: "听了一场大牛的讲座，虽然没太听懂，但感觉不明觉厉。", effect: { reputation: 2, sanity: 5 } },
    { title: "硬盘损坏", description: "你的移动硬盘突然无法读取，幸好你昨天刚做了备份。", effect: { sanity: -5, funding: -100 } },
    { title: "导师请客", description: "导师今天心情好，带全组去吃了一顿大餐。", effect: { advisorFavor: 10, energy: 15 } },
    { title: "开源贡献", description: "你修复了一个知名开源项目的 Bug，获得了不少关注。", effect: { reputation: 5, citations: 10 } },
    { title: "键盘进水", description: "喝咖啡时不小心洒在了键盘上，损失了几百块。", effect: { funding: -500, sanity: -5 } },
    { title: "意外发现", description: "在清理数据时，你发现了一个之前被忽略的有趣现象。", effect: { progress: 9, sanity: 10 } }
  ];
  const events = allEvents.filter((e) => {
    const c = e.effect?.citations;
    if (typeof c === 'number' && c > 0 && state.papersPublished <= 0) return false;
    return true;
  });
  if (state.milestone === '毕业答辩') {
    events.push({ title: "答辩预演", description: "你在组会上进行了答辩预演，被师兄师姐问得哑口无言。", effect: { sanity: -10, progress: 6 } });
  }
  return events[Math.floor(Math.random() * events.length)];
}

/* ================================================================== */
/*  3. 学生简介                                                        */
/* ================================================================== */

export async function generateStudentBio(state: GameState): Promise<string> {
  return studentProfileToPlainText(buildStudentProfile(state));
}

/* ================================================================== */
/*  4. 朋友圈内容（玩家自己发的）                                       */
/* ================================================================== */

type MomentResult = { content: string; author: string; comments: { author: string; content: string }[] };

const MOMENT_SYSTEM = `你是博士生模拟器游戏的朋友圈文案生成器。请模仿真实朋友圈风格，生成一条博士生发的朋友圈动态。

输出严格 JSON：
{
  "content": "朋友圈正文（30~80字，可含 emoji，口语化、自嘲幽默、有博士生活梗）",
  "comments": [
    { "author": "评论人称呼", "content": "评论内容（5~20字）" },
    { "author": "...", "content": "..." }
  ]
}

规则：
- comments 2~3 条
- 评论人可以是：同门、师兄、师姐、学弟、学妹、导师、室友、老妈、路人甲 等
- 内容要像真实中国博士生朋友圈，有科研日常梗
- 只输出 JSON`;

async function llmMomentContent(state: GameState, eventTitle?: string): Promise<MomentResult> {
  const context = eventTitle
    ? `刚发生了事件「${eventTitle}」，请围绕此事件写一条我的朋友圈。`
    : `请根据当前状态写一条日常朋友圈。`;
  const user = `${context}\n当前状态：${stateDigest(state)}`;

  const text = await chatCompletion([
    { role: 'system', content: MOMENT_SYSTEM },
    { role: 'user', content: user },
  ], { temperature: 1.0, maxTokens: 4096, source: 'momentContent' });

  const obj = extractJSON<{ content: string; comments: { author: string; content: string }[] }>(text);
  if (!obj.content || !Array.isArray(obj.comments)) throw new Error('Invalid moment structure');
  return { content: obj.content, author: '我', comments: obj.comments.slice(0, 4) };
}

export async function generateMomentContent(state: GameState, eventTitle?: string): Promise<MomentResult> {
  if (isLLMReady()) {
    try { return await llmMomentContent(state, eventTitle); } catch { /* fall through */ }
  }
  return localMomentContent(state, eventTitle);
}

function localMomentContent(state: GameState, eventTitle?: string): MomentResult {
  const authors = [BZA.bulletinAuthor, "某位同学", "隔壁课题组", "路人甲", "学术圈搬运工"];
  if (state.hasAdvisor) authors.push(state.advisorName);
  const _randomAuthor = () => authors[Math.floor(Math.random() * authors.length)];
  void _randomAuthor;

  if (eventTitle) {
    const eventResponses: MomentResult[] = [
      {
        content: `今天遇到了：${eventTitle}。科研生活真是充满意外。😅`,
        author: "我",
        comments: [
          { author: "同门小王", content: "习惯就好，习惯就好。" },
          { author: "导师", content: "收到，继续努力。" },
          { author: "隔壁老李", content: "兄弟保重啊！" }
        ]
      },
      {
        content: `关于 ${eventTitle}，我只想说：毁灭吧，赶紧的。😫`,
        author: "我",
        comments: [
          { author: "学弟", content: "学长别放弃，你走了谁带我？" },
          { author: "同门小张", content: "这就是命啊。" }
        ]
      },
      {
        content: `刚经历「${eventTitle}」，情绪稳定，指稳定地崩溃。`,
        author: "我",
        comments: [
          { author: "师姐", content: "先去吃饭，胃比 paper 重要。" },
          { author: "室友", content: "奶茶已点，下楼。" }
        ]
      },
      {
        content: `${eventTitle} 已加入人生 DLC，售价：若干根头发。`,
        author: "我",
        comments: [
          { author: "同门", content: "DLC 还能退款吗？" },
          { author: "网友", content: "头发不可退。" }
        ]
      },
      {
        content: `如果 ${eventTitle} 能写进论文贡献里，我第一作者稳了。`,
        author: "我",
        comments: [
          { author: "导师", content: "写 Related Work 里。" },
          { author: "学弟", content: "哥，审稿人不吃这套。" }
        ]
      }
    ];
    return eventResponses[Math.floor(Math.random() * eventResponses.length)];
  }
  
  if (state.sanity < 30) {
    return {
      content: "想回家，想睡觉，想转行。😭 #退学申请书怎么写",
      author: "我",
      comments: [
        { author: "老妈", content: "儿子加油，实在不行就回家考公。" },
        { author: "同门小李", content: "别走啊，你走了谁帮我调代码？" },
        { author: "路人甲", content: "博士压力这么大吗？吓得我不敢读了。" }
      ]
    };
  }

  if (state.papersPublished > 0 && Math.random() < 0.5) {
    return {
      content: "论文终于中了！感谢导师，感谢同门，感谢 GPU！🎉🎉🎉",
      author: "我",
      comments: [
        { author: "导师", content: "不错，下一篇什么时候投？" },
        { author: "同门小张", content: "大佬强啊！求带飞！" },
        { author: "学妹", content: "学长太厉害了！" }
      ]
    };
  }

  const idleMoments: MomentResult[] = [
    {
      content: "又是科研的一天。🚀 #PhDLife #AI",
      author: "我",
      comments: [
        { author: "同门小张", content: "大佬强啊！" },
        { author: "学妹", content: "学长加油！" }
      ]
    },
    {
      content: "凌晨三点的实验室，风景真美。🌃",
      author: "我",
      comments: [
        { author: "保安大叔", content: "同学，该锁门了。" },
        { author: "同门小王", content: "我也在，回头看。" }
      ]
    },
    {
      content: "调了一天的参数，结果还是随机波动。🙃",
      author: "我",
      comments: [
        { author: "同门小李", content: "玄学，都是玄学。" },
        { author: "学弟", content: "学长，要不试试换个随机种子？" }
      ]
    },
    {
      content: "今日 KPI：活着走出实验室。附加题：别和导师对视。",
      author: "我",
      comments: [
        { author: "同门", content: "已完成附加题失败。" },
        { author: "师姐", content: "对视了就要汇报进度。" }
      ]
    },
    {
      content: "泡了杯咖啡，忘了喝，再发现时已经冷成冷萃。科研时间管理大师。",
      author: "我",
      comments: [
        { author: "室友", content: "微波炉 30 秒救一下。" },
        { author: "导师", content: "少喝凉的，胃要紧（罕见温柔）。" }
      ]
    },
    {
      content: "把「再改一版」设置成手机壁纸，提醒自己这就是生活。",
      author: "我",
      comments: [
        { author: "学弟", content: "哥，太硬核了。" },
        { author: "老妈", content: "换张花花草草吧。" }
      ]
    },
    {
      content: "组会前一小时开始突击做 PPT，肾上腺素才是第一生产力。",
      author: "我",
      comments: [
        { author: "师兄", content: "模板发你了。" },
        { author: "导师", content: "下次提前两天。" }
      ]
    },
    {
      content: "想养猫，算了一下房租和猫粮，决定先养 Jupyter。",
      author: "我",
      comments: [
        { author: "同门", content: "真实。" },
        { author: "网友", content: "猫会踩键盘，还是 Jupyter 乖。" }
      ]
    },
    {
      content: "周末去书店买了本闲书，结果在扉页写满了 idea。没救。",
      author: "我",
      comments: [
        { author: "闺蜜", content: "这叫职业病晚期。" },
        { author: "导师", content: "idea 发我看看。" }
      ]
    },
    {
      content: "耳机里放白噪音，脑内却在开组会，精神分裂式专注。",
      author: "我",
      comments: [
        { author: "室友", content: "我以为你在听歌。" },
        { author: "同门", content: "推荐雨声 + 咖啡厅混音。" }
      ]
    },
    {
      content: "立 flag：这周一定早睡。当前时间：凌晨 1:47。",
      author: "我",
      comments: [
        { author: "学弟", content: "哥，flag 是拿来倒的。" },
        { author: "老妈", content: "截图存证了。" }
      ]
    },
    {
      content: "把论文打印出来当枕头，据说有助于梦里过审（伪科学）。",
      author: "我",
      comments: [
        { author: "师姐", content: "醒来一脸墨。" },
        { author: "同门", content: "建议双面打印省纸。" }
      ]
    }
  ];
  return idleMoments[Math.floor(Math.random() * idleMoments.length)];
}

/* ================================================================== */
/*  5. 他人朋友圈（学院通知 / 同学 / 隔壁组 / 导师）                    */
/* ================================================================== */

type ExtMomentResult = {
  content: string;
  author: string;
  comments: { author: string; content: string }[];
  feedSource: MomentFeedSource;
};

const EXTERNAL_MOMENT_SYSTEM = `你是博士生模拟器游戏的朋友圈生成器，请生成一条**不是玩家本人**发的朋友圈动态。

来源类型（feedSource）从以下随机选一个：
- COLLEGE —— 学院通知：正式但不失调侃评论，作者用「${BZA.short}通知」
- PEER —— 同届同学：用「同届·某名字」做作者，日常学习生活吐槽
- OTHER_LAB —— 隔壁课题组：用「隔壁课题组·xxx」做作者，通常是资源/成果/八卦
- ADVISOR —— 导师：用导师真名做作者，发与组会/论文/培养相关内容（仅当学生已有导师时）

输出严格 JSON：
{
  "feedSource": "COLLEGE|PEER|OTHER_LAB|ADVISOR",
  "content": "正文（20~80字，口语化、可含 emoji）",
  "author": "发布者名称",
  "comments": [
    { "author": "评论人", "content": "评论（5~20字）" },
    { "author": "...", "content": "..." }
  ]
}

规则：
- comments 2~3 条，其中一条 author 为「我」（代表玩家的回复）
- 风格：真实中国高校研究生朋友圈
- 只输出 JSON`;

async function llmExternalMoment(state: GameState): Promise<ExtMomentResult> {
  const extra = state.hasAdvisor ? `导师名：${state.advisorName}` : '玩家尚未选导师，不要选 ADVISOR 类型';
  const user = `${extra}\n当前状态：${stateDigest(state)}`;

  const text = await chatCompletion([
    { role: 'system', content: EXTERNAL_MOMENT_SYSTEM },
    { role: 'user', content: user },
  ], { temperature: 1.0, maxTokens: 4096, source: 'externalMoment' });

  const obj = extractJSON<ExtMomentResult>(text);
  const validSources: MomentFeedSource[] = ['COLLEGE', 'PEER', 'OTHER_LAB', 'ADVISOR'];
  if (!validSources.includes(obj.feedSource)) obj.feedSource = 'PEER';
  if (!state.hasAdvisor && obj.feedSource === 'ADVISOR') obj.feedSource = 'PEER';
  if (!obj.content || !obj.author || !Array.isArray(obj.comments)) throw new Error('Invalid ext moment');
  return { content: obj.content, author: obj.author, comments: obj.comments.slice(0, 4), feedSource: obj.feedSource };
}

export async function generateExternalMoment(state: GameState): Promise<ExtMomentResult> {
  if (isLLMReady()) {
    try { return await llmExternalMoment(state); } catch { /* fall through */ }
  }
  return localExternalMoment(state);
}

function localExternalMoment(state: GameState): ExtMomentResult {
  type Item = ExtMomentResult;

  const college: Item[] = [
    {
      content: `【${BZA.short}】研究生学术规范与论文写作工作坊报名开启，限额 80 人，面向 AI 与交叉方向博士生。`,
      author: BZA.bulletinAuthor,
      comments: [
        { author: "我", content: "先报为敬，培养档案里多一条也是好的。" },
        { author: "教务老师", content: "材料审核通过后邮件通知。" }
      ],
      feedSource: "COLLEGE"
    },
    {
      content: `【提醒】本周五前完成导师签字版项目制培养计划上传系统（${BZA.short}）。`,
      author: BZA.bulletinAuthor,
      comments: [
        { author: "我", content: "差点忘了……" },
        { author: "班长", content: "已整理操作截图发群文件。" }
      ],
      feedSource: "COLLEGE"
    },
    {
      content: `「智汇讲坛」学科前沿系列本周预告：大模型与 AI 安全方向，报告厅见。`,
      author: BZA.bulletinAuthor,
      comments: [
        { author: "我", content: "去蹭茶歇算不算「极应用」？" },
        { author: "同门", content: "算，只要你能把 PPT 拍全。" }
      ],
      feedSource: "COLLEGE"
    },
    {
      content: `【心理】${BZA.short}研究生压力疏导一对一预约开放，本周名额有限。`,
      author: BZA.bulletinAuthor,
      comments: [
        { author: "我", content: "先码住，未必敢去。" },
        { author: "班长", content: "匿名也可。" }
      ],
      feedSource: "COLLEGE"
    },
    {
      content: `科研学部公共自习区占座专项整治：请勿用杂物长时间占座，算力预约同理。`,
      author: BZA.bulletinAuthor,
      comments: [
        { author: "我", content: "博士工位也管吗？" },
        { author: "管理员", content: "一视同仁，学院地盘。" }
      ],
      feedSource: "COLLEGE"
    },
    {
      content: `体检补检截止提醒：未检同学将影响奖助与培养环节审核（${BZA.short}医务协同通知）。`,
      author: BZA.bulletinAuthor,
      comments: [
        { author: "我", content: "明天一定去（真的）。" },
        { author: "室友", content: "你上周也这么说。" }
      ],
      feedSource: "COLLEGE"
    }
  ];

  const peer: Item[] = [
    {
      content: "终于把 baseline 复现出来了，今晚可以睡个整觉。",
      author: "同届·林晓舟",
      comments: [
        { author: "我", content: "太强了，求配置文件。" },
        { author: "室友", content: "恭喜脱离玄学调参。" }
      ],
      feedSource: "PEER"
    },
    {
      content: "有人一起拼车去听学院「智汇讲坛」吗？下午两点场，抢不到座就站后排。",
      author: "同届·周予安",
      comments: [
        { author: "我", content: "+1 求带。" },
        { author: "路人", content: "已满员了吗？" }
      ],
      feedSource: "PEER"
    },
    {
      content: "求一张上周数理统计课的板书照片，手机没电了没拍到。",
      author: "同届·陈思远",
      comments: [
        { author: "我", content: "私你了。" },
        { author: "学委", content: "课件已上传网盘。" }
      ],
      feedSource: "PEER"
    },
    {
      content: "食堂二楼新窗口的麻辣香锅测评：辣度三颗星，可冲。",
      author: "同届·赵景行",
      comments: [
        { author: "我", content: "码住，下周去。" },
        { author: "吃货群友", content: "记得错峰。" }
      ],
      feedSource: "PEER"
    },
    {
      content: "求租学校附近单间，预算有限，能接受室友是 bug。",
      author: "同届·沈砚秋",
      comments: [
        { author: "我", content: "转发租房群了。" },
        { author: "房东", content: "私聊发图。" }
      ],
      feedSource: "PEER"
    },
    {
      content: "今天把 Introduction 删了又写写了又删，字数守恒定律成立。",
      author: "同届·顾予安",
      comments: [
        { author: "我", content: "我也是，在原地踏步。" },
        { author: "师姐", content: "先写方法后写引言。" }
      ],
      feedSource: "PEER"
    },
    {
      content: "有人拼单买显示器吗？27 寸 4K，凑够三人下单。",
      author: "同届·韩明澈",
      comments: [
        { author: "我", content: "+1" },
        { author: "学弟", content: "算我。" }
      ],
      feedSource: "PEER"
    },
    {
      content: "实习面试被问「博士为什么来卷开发」，我沉默了十秒。",
      author: "同届·苏若溪",
      comments: [
        { author: "我", content: "标准答案是热爱工程。" },
        { author: "HR", content: "其实想听你能扛压。" }
      ],
      feedSource: "PEER"
    },
    {
      content: "宿舍空调坏了，在实验室蹭冷气顺便干活，双赢。",
      author: "同届·陆书昀",
      comments: [
        { author: "我", content: "宿管已报修。" },
        { author: "同门", content: "老板赚麻了。" }
      ],
      feedSource: "PEER"
    },
    {
      content: "脱单了，对象是数据集，名字叫 COCO。",
      author: "同届·段子手",
      comments: [
        { author: "我", content: "祝百年好合。" },
        { author: "导师", content: "……少刷朋友圈多跑实验。" }
      ],
      feedSource: "PEER"
    }
  ];

  const otherLab: Item[] = [
    {
      content: "我们组服务器扩容完成，欢迎有合作意向的同学私聊。",
      author: "隔壁课题组·官方号",
      comments: [
        { author: "我", content: "羡慕算力。" },
        { author: "某师兄", content: "合作邮件已发导师。" }
      ],
      feedSource: "OTHER_LAB"
    },
    {
      content: "刚开完组会，老板请客奶茶，又是别人家的实验室。",
      author: "隔壁课题组·匿名博士",
      comments: [
        { author: "我", content: "酸了。" },
        { author: "同门", content: "咱们组只有咖啡渣。" }
      ],
      feedSource: "OTHER_LAB"
    },
    {
      content: "招会 PyTorch + 分布式训练的实习生，有 GPU 补贴。",
      author: "隔壁课题组·招生贴",
      comments: [
        { author: "我", content: "先转发给学弟。" },
        { author: "HR", content: "简历投邮箱见主页。" }
      ],
      feedSource: "OTHER_LAB"
    },
    {
      content: "老板刚拿了大项目，全组聚餐，照片九宫格预警。",
      author: "隔壁课题组·匿名硕士",
      comments: [
        { author: "我", content: "羡慕。" },
        { author: "同门", content: "咱们组上次聚餐是三年前。" }
      ],
      feedSource: "OTHER_LAB"
    },
    {
      content: "他们组在晒 accepted list，我们组在晒外卖订单，各有过人之处。",
      author: "隔壁课题组·吐槽号",
      comments: [
        { author: "我", content: "人间真实。" },
        { author: "师弟", content: "至少外卖是热的。" }
      ],
      feedSource: "OTHER_LAB"
    },
    {
      content: "联合培养名额放出一个，要求已有一篇一作在投，卷。",
      author: "隔壁课题组·合作办",
      comments: [
        { author: "我", content: "围观神仙打架。" },
        { author: "教务", content: "细则见官网。" }
      ],
      feedSource: "OTHER_LAB"
    },
    {
      content: "实验室新到了一批显卡，门禁刷卡声比过年还热闹。",
      author: "隔壁课题组·硬件党",
      comments: [
        { author: "我", content: "闻到了算力的味道。" },
        { author: "管理员", content: "排队登记。" }
      ],
      feedSource: "OTHER_LAB"
    }
  ];

  const advisorPool: Item[] = state.hasAdvisor
    ? [
        {
          content: "刚看到一篇和我们方向很相关的 survey，建议大家本周读完第二节。",
          author: state.advisorName,
          comments: [
            { author: "我", content: "好的老师，今晚开始读。" },
            { author: "师兄", content: "已下载。" }
          ],
          feedSource: "ADVISOR"
        },
        {
          content: "下周组会提前到周三下午，请大家调整时间。",
          author: state.advisorName,
          comments: [
            { author: "我", content: "收到。" },
            { author: "师姐", content: "已改日历提醒。" }
          ],
          feedSource: "ADVISOR"
        },
        {
          content: "学校科研伦理培训链接发群了，未完成的请本周搞定。",
          author: state.advisorName,
          comments: [
            { author: "我", content: "今晚刷掉。" },
            { author: "师弟", content: "已完成截图发您。" }
          ],
          feedSource: "ADVISOR"
        },
        {
          content: "基金本子deadline临近，这周组会暂停一次，大家专心各自进度。",
          author: state.advisorName,
          comments: [
            { author: "我", content: "收到，祝本子高中。" },
            { author: "师兄", content: "老师加油。" }
          ],
          feedSource: "ADVISOR"
        },
        {
          content: "审稿季互相体谅，回复邮件尽量 24 小时内，急事电话。",
          author: state.advisorName,
          comments: [
            { author: "我", content: "明白。" },
            { author: "师姐", content: "手机常年静音的我慌了。" }
          ],
          feedSource: "ADVISOR"
        }
      ]
    : [];

  const pool: Item[] = [...college, ...peer, ...otherLab, ...advisorPool];
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ================================================================== */
/*  6. 活动结果描述（日常 / 科研 / 团队）                               */
/* ================================================================== */

const ACTIVITY_DESC_SYSTEM = `你是博士生模拟器游戏的活动叙事生成器。根据活动类型和学生当前状态，生成**一句**活动结果描述（20~60字）。
要求：口语化、幽默、有中国博士生日常梗，参考给出的风格样例但创作新内容。直接输出这句话，不要前缀或解释。`;

export async function generateActivityDescription(label: string, descs: string[], s: GameState): Promise<string> {
  if (isLLMReady() && descs.length > 0) {
    try {
      const examples = descs.slice(0, 2).join('\n');
      return await chatCompletion([
        { role: 'system', content: ACTIVITY_DESC_SYSTEM },
        { role: 'user', content: `活动：${label}\n样例：\n${examples}\n\n${stateDigest(s)}` },
      ], { temperature: 1.0, maxTokens: 256, source: 'actionDesc' });
    } catch { /* fall through */ }
  }
  return descs.length > 0 ? descs[Math.floor(Math.random() * descs.length)] : '';
}

/* ================================================================== */
/*  7. 自我调节描述（漫步 / 摸鱼 / 外出）                               */
/* ================================================================== */

const SELF_REG_LABELS: Record<string, string> = {
  walk: '校园漫步（在中关村学院园区散步放松）',
  slack: '摆烂摸鱼（在实验室偷懒刷手机发呆）',
  outing: '外出游玩（离开学校看电影逛街爬山）',
};

const SELF_REG_SYSTEM = `你是博士生模拟器游戏的自我调节叙事生成器。根据活动类型和学生状态，生成**一句**自我调节结果描述（30~70字）。
要求：口语化、自嘲幽默、有博士生日常感，参考样例但创作新内容。直接输出这句话。`;

export async function generateSelfRegDescription(type: string, descs: string[], s: GameState): Promise<string> {
  if (isLLMReady() && descs.length > 0) {
    try {
      return await chatCompletion([
        { role: 'system', content: SELF_REG_SYSTEM },
        { role: 'user', content: `活动：${SELF_REG_LABELS[type] || type}\n样例：\n${descs.slice(0, 2).join('\n')}\n\n${stateDigest(s)}` },
      ], { temperature: 1.0, maxTokens: 256, source: 'selfRegulation' });
    } catch { /* fall through */ }
  }
  return descs[Math.floor(Math.random() * descs.length)];
}

/* ================================================================== */
/*  8. 互动文案（导师 / 同门）                                          */
/* ================================================================== */

const INTERACTION_SYSTEM = `你是博士生模拟器游戏的互动叙事生成器。根据互动类型和学生状态，生成**一句**互动结果描述（20~50字）。
要求：像真实实验室里的对话后感想，有学术圈梗但不过分。直接输出这句话。`;

export async function generateInteractionText(label: string, texts: string[], isAdvisor: boolean, s: GameState): Promise<string> {
  if (isLLMReady() && texts.length > 0) {
    try {
      const role = isAdvisor ? '与导师' : '与同门';
      return await chatCompletion([
        { role: 'system', content: INTERACTION_SYSTEM },
        { role: 'user', content: `互动：${role}·${label}\n样例：\n${texts.slice(0, 2).join('\n')}\n\n${stateDigest(s)}` },
      ], { temperature: 1.0, maxTokens: 256, source: 'interaction' });
    } catch { /* fall through */ }
  }
  return texts[Math.floor(Math.random() * texts.length)];
}

/* ================================================================== */
/*  9. 学术不端叙事                                                    */
/* ================================================================== */

const MISCONDUCT_SYSTEM = `你是博士生模拟器游戏的叙事生成器。请生成**一句**关于博士生在赶论文时走学术捷径的描述（30~60字）。
要求：描写学生在赶进度压力下的小动作（改数据、裁图、凑结果等），第二人称（「你」），有真实感。直接输出这句话。`;

export async function generateMisconductLine(s: GameState): Promise<string> {
  if (isLLMReady()) {
    try {
      const examples = (WRITE_PAPER_MISCONDUCT_NARRATIVES as readonly string[]).slice(0, 2).join('\n');
      return await chatCompletion([
        { role: 'system', content: MISCONDUCT_SYSTEM },
        { role: 'user', content: `样例：\n${examples}\n\n${stateDigest(s)}` },
      ], { temperature: 0.9, maxTokens: 256, source: 'misconductLine' });
    } catch { /* fall through */ }
  }
  const pool = WRITE_PAPER_MISCONDUCT_NARRATIVES;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ================================================================== */
/*  10. 实验弱文献氛围句                                               */
/* ================================================================== */

const EXPERIMENT_WEAK_SYSTEM = `你是博士生模拟器游戏的叙事生成器。请生成**一句**描述博士生在文献调研不足时跑实验的困惑感（20~50字）。
描写实验不顺利、数据看不懂、炼丹玄学感。第二人称（「你」）。直接输出这句话。`;

export async function generateExperimentWeakLine(s: GameState): Promise<string> {
  if (isLLMReady()) {
    try {
      return await chatCompletion([
        { role: 'system', content: EXPERIMENT_WEAK_SYSTEM },
        { role: 'user', content: `样例：\n${EXPERIMENT_LIT_WEAK_LINES.join('\n')}\n\n${stateDigest(s)}` },
      ], { temperature: 0.9, maxTokens: 256, source: 'experimentWeakLine' });
    } catch { /* fall through */ }
  }
  return EXPERIMENT_LIT_WEAK_LINES[Math.floor(Math.random() * EXPERIMENT_LIT_WEAK_LINES.length)];
}

/* ================================================================== */
/*  11. 审稿结果叙事                                                   */
/* ================================================================== */

const PAPER_REVIEW_SYSTEM = `你是博士生模拟器游戏的叙事生成器。根据投稿审核结果，生成一句简短的审稿情绪总结（20~60字）。
体现录用的喜悦和/或被拒的痛苦，有学术圈审稿梗。直接输出文字。`;

export async function generatePaperReviewNarrative(submitted: number, accepted: number, rejected: number, s: GameState): Promise<string> {
  if (isLLMReady()) {
    try {
      return await chatCompletion([
        { role: 'system', content: PAPER_REVIEW_SYSTEM },
        { role: 'user', content: `投稿 ${submitted} 篇，录用 ${accepted} 篇，拒稿 ${rejected} 篇。\n${stateDigest(s)}` },
      ], { temperature: 1.0, maxTokens: 256, source: 'paperReview' });
    } catch { /* fall through */ }
  }
  if (accepted > 0 && rejected > 0) return '有悲有喜，审稿意见让你体验了一把情绪过山车。';
  if (accepted > 0) return '审稿人终于认可了你的工作，这一刻所有的熬夜都值了。';
  if (rejected > 0) return '看着满屏的 reject，你默默关上邮件客户端。';
  return '';
}

/* ================================================================== */
/*  12. 首页个人简介                                                   */
/* ================================================================== */

const PROFILE_BIO_SYSTEM = `你是博士生模拟器游戏的学术主页生成器。根据学生状态生成一段学术主页简介（40~100字）。
第三人称或无主语句式，偶尔自嘲，像真实学术主页但多一点幽默。参考样例风格。直接输出文字。`;

export async function generateProfileBio(s: GameState, localBio: string): Promise<string> {
  if (!isLLMReady()) return localBio;
  try {
    return await chatCompletion([
      { role: 'system', content: PROFILE_BIO_SYSTEM },
      { role: 'user', content: `当前样例：${localBio}\n\n${stateDigest(s)}` },
    ], { temperature: 0.9, maxTokens: 512, source: 'profileContent' });
  } catch { return localBio; }
}

/* ================================================================== */
/*  13. 首页研究兴趣                                                   */
/* ================================================================== */

const PROFILE_RESEARCH_SYSTEM = `你是博士生模拟器游戏的学术主页生成器。根据学生状态和研究方向，生成3条研究兴趣描述。
输出严格 JSON 数组：["第1条(30~80字)", "第2条", "第3条"]
带一点中国博士生特色的学术黑话，参考样例但创作新内容。只输出 JSON。`;

export async function generateProfileResearch(s: GameState, localBullets: string[]): Promise<string[]> {
  if (!isLLMReady()) return localBullets;
  try {
    const text = await chatCompletion([
      { role: 'system', content: PROFILE_RESEARCH_SYSTEM },
      { role: 'user', content: `当前样例：\n${localBullets.join('\n')}\n\n${stateDigest(s)}` },
    ], { temperature: 0.9, maxTokens: 512, source: 'profileContent' });
    const arr = extractJSON<string[]>(text);
    if (Array.isArray(arr) && arr.length >= 3) return arr.slice(0, 3);
    return localBullets;
  } catch { return localBullets; }
}

/* ================================================================== */
/*  14. 首页论文与投稿                                                 */
/* ================================================================== */

const PROFILE_PUB_SYSTEM = `你是博士生模拟器游戏的学术主页生成器。根据学生发表情况生成「论文与投稿」栏目正文（50~150字）。
包含发表数、引用数等关键信息，文风像学术主页但偶尔夹带吐槽。参考样例风格。直接输出文字。`;

export async function generateProfilePublications(s: GameState, localText: string): Promise<string> {
  if (!isLLMReady()) return localText;
  try {
    return await chatCompletion([
      { role: 'system', content: PROFILE_PUB_SYSTEM },
      { role: 'user', content: `当前样例：${localText}\n\n${stateDigest(s)}` },
    ], { temperature: 0.9, maxTokens: 512, source: 'profileContent' });
  } catch { return localText; }
}

/* ================================================================== */
/*  15. 首页签名                                                       */
/* ================================================================== */

const PROFILE_QUOTE_SYSTEM = `你是博士生模拟器游戏的签名生成器。请生成一句博士生学术主页上的个人签名（15~40字）。
关于科研生活的感悟或自嘲，幽默有共鸣，可以有学术圈梗。直接输出这句话。`;

export async function generateProfileQuote(s: GameState, localQuote: string): Promise<string> {
  if (!isLLMReady()) return localQuote;
  try {
    return await chatCompletion([
      { role: 'system', content: PROFILE_QUOTE_SYSTEM },
      { role: 'user', content: `当前样例：${localQuote}\n\n${stateDigest(s)}` },
    ], { temperature: 1.0, maxTokens: 256, source: 'profileContent' });
  } catch { return localQuote; }
}

/* ================================================================== */
/*  16. 毕业结局叙事                                                    */
/* ================================================================== */

const GRADUATION_SYSTEM = `你是博士生模拟器游戏的毕业结局叙事生成器。根据玩家的毕业评级和最终数据，写一段毕业结局描述（60~120字）。
要求：幽默诙谐、有中国博士生圈的日常梗，语气像一位见多识广的老教授在答辩后给你说的话。直接输出这段话，不要前缀或解释。`;

export async function generateGraduationNarrative(
  s: GameState,
  honor: string,
  localBody: string
): Promise<string> {
  if (!isLLMReady()) return localBody;
  try {
    return await chatCompletion([
      { role: 'system', content: GRADUATION_SYSTEM },
      { role: 'user', content: `毕业评级：${honor}\n论文：${s.papersPublished}篇，引用：${s.citations}次，声望：${s.reputation}\n历经季度：${s.quarter}\n${stateDigest(s)}\n\n参考风格：${localBody}` },
    ], { temperature: 0.9, maxTokens: 512, source: 'other' });
  } catch { return localBody; }
}
