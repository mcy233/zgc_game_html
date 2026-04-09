import type { PendingQuarterChoice } from './types';

/**
 * 季度伊始待玩家抉择的事件：仅玩家选择后结算，与自动生效的第一类事件分开触发。
 * deltas 为对当前状态的增量（可正可负），在 App 内做 clamp。
 */
export const QUARTER_CHOICE_SCENARIOS: PendingQuarterChoice[] = [
  {
    title: '服务器维护前的数据备份',
    description:
      '科研学部通知：算力平台即将停机维护。你的实验 checkpoint 还没完全同步到合规存储，得立刻做决定。',
    options: [
      {
        id: 'backup_cloud',
        label: '购买短期合规云存储打包上传',
        hint: '花钱换规范，降低合规风险',
        outcomeText:
          '你咬牙开了合规云盘，把 checkpoint 连夜打包上传。教务抽查名单里暂时看不到你的名字，心里踏实了一点。',
        deltas: { funding: -450, misconduct: -7, sanity: 4 },
      },
      {
        id: 'backup_local',
        label: '只拷到个人移动硬盘了事',
        hint: '省钱，但若被抽查解释不清',
        outcomeText:
          '移动硬盘里塞满了实验，平台日志却对不上号。你知道这在审计话术里叫「解释成本」，只能祈祷本季无人点名。',
        deltas: { funding: 0, misconduct: 10, reputation: -3 },
      },
      {
        id: 'backup_script',
        label: '通宵手写同步脚本省云费',
        hint: '不花钱，但透支精力与睡眠',
        outcomeText:
          '脚本跑到凌晨四点终于没报错，你趴在桌上眯了两小时。白天组会时脑子像浆糊，但账户余额确实没动。',
        deltas: { funding: 0, energy: -28, sanity: -14, misconduct: -4, health: -6 },
      },
    ],
  },
  {
    title: '预印本抢先还是再验？',
    description:
      '合作者催你先把工作挂 arXiv「占坑」，但你心里清楚还有两组对照实验没跑稳。',
    options: [
      {
        id: 'arxiv_rush',
        label: '先挂预印本抢首发',
        hint: '声望上去，审查风险也上去',
        outcomeText:
          'arXiv 上新了一条你的工作。朋友圈有人转发庆祝，也有人截图圈出 Related Work 里那条含糊的引用——你只能装作没看见。',
        deltas: { reputation: 6, misconduct: 9, advisorFavor: -4 },
      },
      {
        id: 'arxiv_wait',
        label: '压两周把实验补全再发',
        hint: '稳妥降嫌疑，可能被别人抢先',
        outcomeText:
          '对照补完那两周，你删掉了预印本页面上预备已久的草稿链接。刊发会晚一点，但底气足了不少。',
        deltas: { reputation: -3, misconduct: -8, sanity: -5, energy: -12 },
      },
      {
        id: 'arxiv_boss',
        label: '拉上导师一起拍板再发',
        hint: '好感与责任共担，时间成本高',
        outcomeText:
          '导师在邮件里帮你分摊了决策责任。定稿时间拖了一周，好在邮件链可以证明「不是学生一个人拍的板」。',
        deltas: { advisorFavor: 8, energy: -10, sanity: -3, misconduct: -3 },
      },
    ],
  },
  {
    title: '课题组「横向」杂活邀约',
    description:
      '导师问你能不能帮合作企业赶一版演示 Demo，有劳务费，但会挤占你论文时间。',
    options: [
      {
        id: 'gig_full',
        label: '接全包，多赚点',
        hint: '现金多，身心与合规压力都大',
        outcomeText:
          '企业演示如期上线，银行卡多了一笔可观的进账，但大论文的目录已经两周没动过，你心里清楚这笔账迟早要还。',
        deltas: { funding: 1200, misconduct: 7, health: -8, sanity: -10, progress: -4 },
      },
      {
        id: 'gig_light',
        label: '只做最小可行版本',
        hint: '收入一般，但守住主线进度',
        outcomeText:
          '你只交付了可点亮的界面，需求方啧了一声也算签收。主线实验还能照常排进本周计划，算折中胜利。',
        deltas: { funding: 450, reputation: 2, energy: -12, misconduct: 2 },
      },
      {
        id: 'gig_decline',
        label: '婉拒，专心毕业',
        hint: '没钱换清静，导师可能微词',
        outcomeText:
          '导师回了个「理解」，语气比你想象得淡。你趁机把断档的章节一口气续上了，穷一点但清静。',
        deltas: { funding: 0, advisorFavor: -6, sanity: 8, misconduct: -2, progress: 3 },
      },
    ],
  },
  {
    title: '匿名问卷：培养满意度',
    description:
      '学院教务发来匿名问卷。有人传说填「非常满意」的组下季度算力配额会好看一点——真假未知。',
    options: [
      {
        id: 'survey_glow',
        label: '全选好评并写小作文',
        hint: '赌一把资源，心里略虚',
        outcomeText:
          '问卷提交成功的回执弹出来时，你盯着那句「感谢反馈」出神——像拿到了一张算力彩票，又像在台账上留了一个过于光鲜的签名。',
        deltas: { gpuCredits: 120, misconduct: 4, sanity: -4 },
      },
      {
        id: 'survey_honest',
        label: '如实填写，包括吐槽排课',
        hint: '心里痛快，可能啥也没有',
        outcomeText:
          '教务系统里多了一条语气克制的吐槽，据说不会追溯到组。算力池没给你额外甜头，但至少今晚睡得着。',
        deltas: { sanity: 10, reputation: 2, gpuCredits: -40 },
      },
      {
        id: 'survey_skip',
        label: '拖到截止前随便点完',
        hint: '中庸：小幅省心也小幅风险',
        outcomeText:
          '截止日期前五分钟你在手机上乱点一通，既不痛快也不踏实，像什么都没发生——又好像什么都可能发生。',
        deltas: { sanity: 3, energy: -5, misconduct: 1 },
      },
    ],
  },
  {
    title: '开源代码开源到什么程度？',
    description:
      '审稿人要求公开代码。完整开源最体面，但里面混着未清洗的数据路径和内部脚本。',
    options: [
      {
        id: 'oss_full',
        label: '整理后完整开源',
        hint: '声望高，整理成本与泄密风险',
        outcomeText:
          '仓库公开那天 star 数涨得挺好看。花出去的整理费和时间证明你是认真的——接下来只能硬扛复现邮件。',
        deltas: { reputation: 5, funding: -200, energy: -18, misconduct: -5 },
      },
      {
        id: 'oss_partial',
        label: '只放推理脚本与权重',
        hint: '折中，可能被追问可复现性',
        outcomeText:
          '审稿邮件里「代码在哪里」暂时消停了。你知道那堆数据路径的坑还没填完，下一轮意见里可能还会冒出来。',
        deltas: { reputation: 1, misconduct: 3, sanity: -4 },
      },
      {
        id: 'oss_delay',
        label: '申请延期，先拖一轮',
        hint: '缓一口气，审稿印象略差',
        outcomeText:
          '补实验与开源申请多了一趟往返，审稿周期又被拉长一轮。你先喘口气，把锅甩给「流程」。',
        deltas: { sanity: 6, reputation: -4, advisorFavor: -3 },
      },
    ],
  },
];

export function pickRandomQuarterChoice(): PendingQuarterChoice {
  const i = Math.floor(Math.random() * QUARTER_CHOICE_SCENARIOS.length);
  return QUARTER_CHOICE_SCENARIOS[i];
}
