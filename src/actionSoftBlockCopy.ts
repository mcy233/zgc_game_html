/** 资金 / 算力不足时点击行动的提示（与全篇吐槽风一致） */

const FUNDING_BLOCKS: { title: string; body: string }[] = [
  {
    title: '钱包在抗议',
    body: '你打开支付页面又默默关掉了——这点余额连这次行动的零头都不够。先去把助教工资、补助或神秘推销变现攒一攒，有钱了再出门浪。',
  },
  {
    title: '经费不足',
    body: '账户数字比你的睡眠还惨淡，这次行动会直接把你送进透支地狱。培养办不会替你垫钱，赚了再办正事吧。',
  },
  {
    title: '余额摇头',
    body: '你对着负数或即将变负的余额叹了口气：科研可以卷，现金流不能装没看见。等手头宽裕了再点这一下。',
  },
];

const GPU_BLOCKS: { title: string; body: string }[] = [
  {
    title: '算力告急',
    body: '集群面板一片红，你的额度连这次实验的门票都不够。下季度领补助、抠资产加成，或者先摸文献把脑子补满，再来烧卡。',
  },
  {
    title: 'GPU 说不了',
    body: '脚本还没跑起来，调度器已经礼貌地把你请出去了——算力不够就是不够。攒够额度再开炉，免得空耗理智。',
  },
  {
    title: '卡时不够',
    body: '你盯着「所需算力」和「当前余额」的鸿沟，突然理解什么叫数字暴力。先去搞点算力，别让实验死在开机界面。',
  },
];

export function pickInsufficientFundingBlock(): { title: string; body: string } {
  return FUNDING_BLOCKS[Math.floor(Math.random() * FUNDING_BLOCKS.length)]!;
}

export function pickInsufficientGpuBlock(): { title: string; body: string } {
  return GPU_BLOCKS[Math.floor(Math.random() * GPU_BLOCKS.length)]!;
}
