import { GameState, AdvisorType, MomentFeedSource } from "../types";
import { BZA } from "../schoolBranding";

/**
 * 离线版内容生成服务
 * 为了应对高并发和 API 限制，所有内容现在由本地题库随机生成
 */

export async function generateAdvisorFeedback(state: GameState): Promise<string> {
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
  // 根据状态添加一些特定的反馈
  if (state.sanity < 20) {
    return "我看你状态不太对，要不先休个假？";
  }
  if (state.misconduct > 40) {
    return "最近有人反映你的数据有问题，你自己注意点。";
  }
  
  return list[Math.floor(Math.random() * list.length)];
}

export async function generateRandomEvent(state: GameState): Promise<{ title: string; description: string; effect: Partial<GameState> }> {
  const events = [
    { title: "GPU 集群维护", description: "学校的 GPU 集群要维护三天，你的实验被迫中断了。", effect: { gpuCredits: -200, sanity: -5 } },
    { title: "深夜灵感", description: "你在洗澡时突然想到了一个绝妙的算法优化思路。", effect: { progress: 2, energy: -10 } },
    { title: "免费披萨", description: "隔壁实验室开会剩下了很多披萨，你饱餐了一顿。", effect: { health: 5, energy: 20 } },
    { title: "论文被拒", description: "你的论文被审稿人以“缺乏创新性”为由拒绝了。", effect: { sanity: -20, reputation: -2 } },
    { title: "代码 Bug", description: "你发现跑了一周的实验结果全是错的，因为一个正负号写反了。", effect: { sanity: -15, progress: -2 } },
    { title: "顶会截稿", description: "为了赶 DDL，你已经在实验室连续奋战了 48 小时。", effect: { energy: -40, health: -10, progress: 4 } },
    { title: "学术讲座", description: "听了一场大牛的讲座，虽然没太听懂，但感觉不明觉厉。", effect: { reputation: 2, sanity: 5 } },
    { title: "硬盘损坏", description: "你的移动硬盘突然无法读取，幸好你昨天刚做了备份。", effect: { sanity: -5, funding: -100 } },
    { title: "导师请客", description: "导师今天心情好，带全组去吃了一顿大餐。", effect: { advisorFavor: 10, energy: 15 } },
    { title: "开源贡献", description: "你修复了一个知名开源项目的 Bug，获得了不少关注。", effect: { reputation: 5, citations: 10 } },
    { title: "键盘进水", description: "喝咖啡时不小心洒在了键盘上，损失了几百块。", effect: { funding: -500, sanity: -5 } },
    { title: "意外发现", description: "在清理数据时，你发现了一个之前被忽略的有趣现象。", effect: { progress: 3, sanity: 10 } }
  ];

  // 根据当前阶段筛选或增加特定事件
  if (state.milestone === '毕业答辩') {
    events.push({ title: "答辩预演", description: "你在组会上进行了答辩预演，被师兄师姐问得哑口无言。", effect: { sanity: -10, progress: 2 } });
  }

  return events[Math.floor(Math.random() * events.length)];
}

export async function generateStudentBio(state: GameState): Promise<string> {
  let bio = `一名${BZA.name}、正在经历 ${state.milestone} 阶段的 AI 方向博士生，培养路径强调「${BZA.triad}」。`;
  
  if (state.papersPublished > 5) {
    bio += " 已经是领域内公认的学术新星，各大顶会审稿人的常客。";
  } else if (state.papersPublished > 2) {
    bio += " 已经在领域内小有名气，正在稳步积累影响力。";
  } else if (state.papersPublished > 0) {
    bio += ` 目前已发表 ${state.papersPublished} 篇论文，初露锋芒。`;
  } else {
    bio += " 还在为第一篇顶会论文而奋斗，每天都在与 DDL 赛跑。";
  }

  if (state.sanity < 20) {
    bio += " 看起来极度疲惫，眼神涣散，似乎随时都会在实验室晕倒。";
  } else if (state.sanity < 50) {
    bio += " 精神状态略显紧绷，咖啡和红牛是他的生命线。";
  } else {
    bio += " 精神饱满，对科研充满热情，甚至觉得加班是一种享受。";
  }

  if (state.misconduct > 60) {
    bio += " 正在学术道德的边缘疯狂试探，名声岌岌可危。";
  } else if (state.misconduct > 30) {
    bio += " 偶尔会为了结果漂亮而微调数据，如履薄冰。";
  }

  if (state.year >= 4) {
    bio += " 高年级了，对项目制培养的节奏和中关村这片科研圈的「卷法」早已心中有数。";
  }

  return bio;
}

export async function generateMomentContent(state: GameState, eventTitle?: string): Promise<{ content: string; author: string; comments: { author: string; content: string }[] }> {
  const authors = [BZA.bulletinAuthor, "某位同学", "隔壁课题组", "路人甲", "学术圈搬运工"];
  if (state.hasAdvisor) authors.push(state.advisorName);
  
  const randomAuthor = () => authors[Math.floor(Math.random() * authors.length)];

  if (eventTitle) {
    const eventResponses = [
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

  const externalMoments = [
    {
      content: `【${BZA.short}】学术规范与科研诚信专题讲座报名开启，现场签到计入培养档案……`,
      author: BZA.bulletinAuthor,
      comments: [
        { author: "我", content: "收到，准时参加。" },
        { author: "同学 A", content: "又要签到了吗？" }
      ]
    },
    {
      content: "终于把这个 Bug 调通了，今晚必须加餐！🥩",
      author: "某位同学",
      comments: [
        { author: "我", content: "恭喜恭喜，求带！" },
        { author: "同学 B", content: "羡慕了，我还在调。" }
      ]
    },
    {
      content: "隔壁组又发顶会了，压力山大啊。😱",
      author: "隔壁课题组",
      comments: [
        { author: "我", content: "习惯了，咱们组也快了。" },
        { author: "导师", content: "看看人家的进度。" }
      ]
    },
    {
      content: "最近这个新出的模型效果真惊人，大家关注了吗？",
      author: "学术圈搬运工",
      comments: [
        { author: "我", content: "正在跑实验对比。" },
        { author: "大牛", content: "思路很有启发性。" }
      ]
    },
    {
      content: "宿舍断网一小时，意外发现论文引言居然写顺了。#断网疗法",
      author: "某位同学",
      comments: [
        { author: "我", content: "科学上网不如科学断网。" },
        { author: "室友", content: "路由器我拔的，不谢。" }
      ]
    },
    {
      content: "体检报告出来了：颈椎曲度变直 + 轻度脂肪肝。科研赠品签收。",
      author: "我",
      comments: [
        { author: "老妈", content: "少熬夜！" },
        { author: "同门", content: "咱们组团购按摩仪吗？" }
      ]
    },
    {
      content: "相亲对象问我是做什么的，我说训练模型，对方以为是开服装店的。",
      author: "我",
      comments: [
        { author: "闺蜜", content: "下次说人工智能，别省字。" },
        { author: "学弟", content: "哥，模型确实挺多义的。" }
      ]
    },
    {
      content: "把审稿意见打印出来折纸飞机，飞得意外地稳。#情绪稳定",
      author: "某位同学",
      comments: [
        { author: "我", content: "Major revision 当风筝放。" },
        { author: "师兄", content: "记得碎纸机销毁。" }
      ]
    },
    {
      content: "今日成就：在食堂抢到最后一份糖醋排骨。学术上暂无。",
      author: "我",
      comments: [
        { author: "吃货群", content: "哪个窗口？急。" },
        { author: "导师", content: "……论文呢？" }
      ]
    },
    {
      content: "梦见一作变成了通讯作者，吓醒发现只是梦，又有点失落。",
      author: "某位同学",
      comments: [
        { author: "我", content: "梦都是反的（但愿）。" },
        { author: "师姐", content: "去要 authorship 共识邮件。" }
      ]
    },
    {
      content: "整理了 200 篇参考文献，Word 崩了，人生第一次想给比尔·盖茨写邮件。",
      author: "我",
      comments: [
        { author: "同门", content: "上 LaTeX 吧，哭完再说话。" },
        { author: "学院 IT", content: "定期保存，同学——算力与数据都在学院资产里。" }
      ]
    },
    {
      content: "旁听本科生的课，发现自己连基础题都不会了，博士贬值实锤。",
      author: "某位同学",
      comments: [
        { author: "我", content: "专精一条窄路，不丢人。" },
        { author: "助教", content: "其实我也不会。" }
      ]
    },
    {
      content: "和合作者时差十二小时，会议永远在凌晨。我活的也是 UTC。",
      author: "我",
      comments: [
        { author: "海外师兄", content: "我这儿下午茶时间。" },
        { author: "导师", content: "把纪要发群里。" }
      ]
    },
    {
      content: "报销单被打回三次，理由分别是格式、发票抬头、导师签字角度不对。",
      author: "某位同学",
      comments: [
        { author: "我", content: "财务才是隐藏 boss。" },
        { author: "行政", content: "按模板重填。" }
      ]
    },
    {
      content: "跑步五公里，脑子里全程在过实验设计，配速随缘。",
      author: "我",
      comments: [
        { author: "跑友", content: "你这叫移动组会。" },
        { author: "师弟", content: "师兄注意膝盖。" }
      ]
    },
    {
      content: "知乎刷到「读博后悔吗」，看了两小时，结论是没结论。",
      author: "某位同学",
      comments: [
        { author: "我", content: "时间成本已沉没。" },
        { author: "路人", content: "快跑（误）。" }
      ]
    }
  ];

  if (state.hasAdvisor && Math.random() > 0.7) {
    externalMoments.push({
      content: "分享一篇很有意思的文章，大家有空看看。链接：[学术前沿...]",
      author: state.advisorName,
      comments: [
        { author: "我", content: "好的老师，这就看。" },
        { author: "师兄", content: "收到。" }
      ]
    });
  }

  if (state.papersPublished > 0 && Math.random() > 0.5) {
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

  const idleMoments = [
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

  const allPossible = [...externalMoments, ...idleMoments];
  return allPossible[Math.floor(Math.random() * allPossible.length)];
}

/** 由 App 在累计行动达到随机阈值（3~10）时调用，生成一条「他人发」的朋友圈（学院 / 同学 / 隔壁组 / 可选导师） */
export async function generateExternalMoment(state: GameState): Promise<{
  content: string;
  author: string;
  comments: { author: string; content: string }[];
  feedSource: MomentFeedSource;
}> {
  type Item = {
    content: string;
    author: string;
    comments: { author: string; content: string }[];
    feedSource: MomentFeedSource;
  };

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
