import type { AdvisorType } from './types';

/** 未拜师时「拜访导师」的随机叙事 + 在基础拜访之外的额外数值（基础：-$200、-20 精力、+15×favorGainRate 印象） */
export type PotentialAdvisorVisitOutcome = {
  text: string;
  bonus?: {
    reputation?: number;
    sanity?: number;
    progress?: number;
    misconduct?: number;
  };
};

export const POTENTIAL_ADVISOR_VISIT_OUTCOMES: Record<AdvisorType, PotentialAdvisorVisitOutcome[]> = {
  MICROMANAGER: [
    {
      text: '你在门口对了三遍汇报提纲才敢敲门。导师抬头扫了眼进度表，当场给你排了「本周可验收」的三项清单——压力大，但至少知道该往哪使劲。',
      bonus: { progress: 3, sanity: -5 },
    },
    {
      text: '他一边回邮件一边听你讲 idea，每隔三十秒插一句「落地路径呢」。散场时你发现自己的笔记本上写满了待办，像领了一份迷你项目章程。',
      bonus: { progress: 3, reputation: 1 },
    },
    {
      text: '组里白板写满了甘特图色块。导师把你的问题归类进「阻塞项」，顺手拉了一位师兄下午对接——你被卷得明明白白，但也确实少走了弯路。',
      bonus: { progress: 6, sanity: -3 },
    },
    {
      text: '你本想聊文献，对方直接打开共享屏幕过你的实验记录。几处标注红得刺眼，不过临走前他说：「改完这版，下周能进组会主线。」',
      bonus: { progress: 3 },
    },
    {
      text: '秘书提醒「还剩八分钟」。你用五分钟讲问题、三分钟听反馈，节奏像答辩预演。出门时长舒一口气：短，但信息密度惊人。',
      bonus: { reputation: 2, sanity: -4 },
    },
    {
      text: '他提到学院最近在抓培养过程留痕，叮嘱你邮件往来写清楚假设与结论。「不是为难你，是保护你。」你莫名觉得这句挺踏实。',
      bonus: { sanity: 5, progress: 3 },
    },
  ],
  GHOST: [
    {
      text: '办公室漆黑，只有门缝里贴着一张便签：「外出交流，材料放桌上。」你把一页问题清单压在键盘下，像给树洞投了封信。',
      bonus: { sanity: -3 },
    },
    {
      text: '深夜收到一封两字的回信：「在读。」附件是一串arxiv链接，跨度从2018到上周。你苦笑一下，还是点开第一篇。',
      bonus: { reputation: 1, progress: 3 },
    },
    {
      text: '走廊偶遇，对方拎着行李箱说「下周再细聊」。三句话里有两句是「你先跑着」，剩下一句是「卡住了再叫我」——人走了，方向却意外清晰了一点。',
      bonus: { progress: 6 },
    },
    {
      text: '视频会议里背景是机场广播。导师戴着耳机点头，说「这个方向可以，你先写个一页纸综述我飞机上扫一眼」。你当晚就把摘要憋出来了。',
      bonus: { progress: 3, sanity: 4 },
    },
    {
      text: '你发了三封邮件才凑齐一次回复。对方只批了四个字：「先做 ablation。」你盯着屏幕发呆半分钟，然后默默打开了实验脚本。',
      bonus: { progress: 3 },
    },
    {
      text: '研究生秘书转述：老师让你找隔壁组某某对接。你扑了个空，却在茶水间听了一耳朵相关课题的八卦，意外拼上了拼图的一角。',
      bonus: { reputation: 2, sanity: 2 },
    },
  ],
  SUPPORTIVE: [
    {
      text: '一进门先被问「吃饭了吗」，热水递到手边。你们从课题聊到作息，导师认真记下了你卡住的点，说「别急，我们分步拆」。',
      bonus: { sanity: 8, progress: 3 },
    },
    {
      text: '你没有准备得很充分，对方却耐心听完，还帮你把问题重述成「可执行的三句话」。出门时你觉得肩上的石头轻了一半。',
      bonus: { sanity: 10, progress: 3 },
    },
    {
      text: '聊到焦虑，导师分享了自己博三崩溃又爬起来的糗事。笑完以后他补了一句：「你现在走得比我当年稳。」你鼻子有点酸。',
      bonus: { sanity: 12, reputation: 1 },
    },
    {
      text: '他翻了你打印的笔记，圈出两处「这里其实可以问得更锋利」。没有批评，只有「下次组会你可以试着这样切入」。',
      bonus: { progress: 6, reputation: 1 },
    },
    {
      text: '临走前塞给你一小包茶包：「熬夜可以，别只喝速溶。」你嘴上吐槽像妈妈，心里却记下了。',
      bonus: { sanity: 6 },
    },
    {
      text: '你提到怕选错方向，对方说：「选错了也能改，最怕的是不动。」这句话你一路默念回宿舍。',
      bonus: { sanity: 7, progress: 3 },
    },
  ],
  CELEBRITY: [
    {
      text: '等候区坐满了人。轮到你时，导师边看手表边听你三十秒电梯陈述，然后丢给你一句「这个story可以，去和某某课题组对齐一下数据口径」。',
      bonus: { reputation: 3, progress: 3 },
    },
    {
      text: '办公室门口排着合影的访客。你趁间隙递上问题，他扫了一眼说：「这题要站在领域叙事里答。」随手在白板画了个圈，你赶紧拍照。',
      bonus: { progress: 6, reputation: 2 },
    },
    {
      text: '学术报告散场后你在侧门拦住他。对方签名式地肯定了切入点，又提醒「引用要压住争议文献」——话少，但每句都像审稿意见。',
      bonus: { reputation: 2, progress: 3 },
    },
    {
      text: '秘书严格控场：「还有两分钟。」你用一分钟讲问题，他用一分钟改了你PPT首页的标题词——瞬间「高级」了一个档次。',
      bonus: { progress: 3, sanity: 3 },
    },
    {
      text: '他刚下会，语音里带着疲惫，还是回你说：「idea不新，但交叉角度有趣，写短点投workshop先刷脸。」你立刻有了下一步。',
      bonus: { progress: 3, reputation: 1 },
    },
    {
      text: '走廊里被同行打招呼打断三次。导师抱歉地冲你笑笑，转手把你介绍给一位青年老师：「具体实现你跟他，我盯方向。」你意外多了一条线。',
      bonus: { reputation: 3, sanity: 2 },
    },
  ],
};
