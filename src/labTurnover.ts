import type { GameState, LabMate } from './types';
import { ASSETS_LIBRARY } from './constants';

const LEAVE_TEMPLATES: ((name: string, role: string) => string)[] = [
  (n, r) =>
    `【离校】${r}${n}修满年限，工位清空那天在群里发了一句「各位后会有期」，实验室突然安静了不少。`,
  (n, r) =>
    `【离校】${n}（${r}）答辩通过，把键盘鼠标捐给组里公用库，人已经去新公司报到了。`,
  (n, r) =>
    `【离校】听说${r}${n}拿到了不错的 offer，散伙饭上大家起哄让他以后内推，场面又笑又酸。`,
  (n, r) =>
    `【离校】${n}临走前把共享盘里的文件夹都理了一遍，备注写满「给学弟学妹」，${r}身份正式杀青。`,
  (n, r) =>
    `【离校】${r}${n}拖着行李箱消失在楼道尽头，门禁照片里少了一张熟悉的面孔。`,
  (n, r) =>
    `【离校】组会名单里划掉了${n}，${r}的座位很快会被保洁贴上「待分配」标签。`,
  (n, r) =>
    `【离校】${n}（${r}）把养了四年的绿萝留给窗台，说植物比论文好带。`,
];

const JOIN_TEMPLATES: ((name: string, role: string) => string)[] = [
  (n, r) =>
    `【入组】新学期点名多了一个名字：${n}（${r}），自我介绍紧张到念错导师姓氏，全场善意憋笑。`,
  (n, r) =>
    `【入组】${n}抱着笔记本进实验室，${r}身份新鲜出炉，师兄师姐齐刷刷抬头行注目礼。`,
  (n, r) =>
    `【入组】行政老师领来${n}办门禁，${r}小声问「组里加班多吗」，没人敢接话。`,
  (n, r) =>
    `【入组】${n}（${r}）给每人分了一块家乡糕点，甜蜜攻势下很快混进了外卖拼单群。`,
  (n, r) =>
    `【入组】老板在组会上介绍${n}：「新来的${r}，大家多带带。」你默默数了数又要多回答的私聊。`,
  (n, r) =>
    `【入组】${n}的工位紧挨着打印机，${r}从此成为全组默认的「帮忙取一下纸」人选。`,
  (n, r) =>
    `【入组】${n}（${r}）第一次参加组会记了三页笔记，会后追问「我们方向到底做啥」，眼神清澈。`,
];

export function pickLeaveLine(name: string, role: string): string {
  const pick = LEAVE_TEMPLATES[Math.floor(Math.random() * LEAVE_TEMPLATES.length)];
  return pick(name, role);
}

export function pickJoinLine(name: string, role: string): string {
  const pick = JOIN_TEMPLATES[Math.floor(Math.random() * JOIN_TEMPLATES.length)];
  return pick(name, role);
}

function isSenior(m: LabMate): boolean {
  return m.role === '师兄' || m.role === '师姐';
}

/** 师兄师姐毕业且好感较高时，随机赠礼并写入 state；effectAcc 供 UI 展示数值汇总 */
export function applySeniorFarewellGifts(
  graduate: LabMate,
  state: GameState,
  effectAcc: Record<string, number>,
  story: string[]
): void {
  if (!isSenior(graduate)) return;
  if (graduate.favor < 65) return;
  if (Math.random() > 0.72) return;

  const bump = (key: string, v: number) => {
    const r = Math.round(v);
    effectAcc[key] = (effectAcc[key] || 0) + r;
  };

  type Kind = 'funding' | 'gpu' | 'paperProgress' | 'progress' | 'citations' | 'reputation' | 'sanity' | 'asset';
  const kinds: Kind[] = ['funding', 'gpu', 'paperProgress', 'progress', 'citations', 'reputation', 'sanity', 'asset'];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];

  switch (kind) {
    case 'funding': {
      const v = 800 + Math.floor(Math.random() * 2700);
      state.funding += v;
      bump('funding', v);
      story.push(
        `【赠礼】${graduate.name}私下塞你一笔「别在答辩上太寒酸」的经费，约 $${v}。`
      );
      break;
    }
    case 'gpu': {
      const v = 100 + Math.floor(Math.random() * 320);
      state.gpuCredits += v;
      bump('gpuCredits', v);
      story.push(`【赠礼】${graduate.name}把没用完的算力额度转到你名下，叮嘱别浪费在摸鱼上。`);
      break;
    }
    case 'paperProgress': {
      const v = 3 + Math.floor(Math.random() * 6);
      state.paperWritingProgress = Math.min(100, state.paperWritingProgress + v);
      bump('paperWritingProgress', v);
      story.push(
        `【赠礼】${graduate.name}拷给你一叠整理好的图表说明与段落草稿，小论文进度直接涨了一截。`
      );
      break;
    }
    case 'progress': {
      const v = 1 + Math.floor(Math.random() * 4);
      state.progress = Math.min(100, state.progress + v);
      bump('progress', v);
      story.push(`【赠礼】${graduate.name}送你手写版「答辩委员会常见刁钻问题」，阶段心里更有底了。`);
      break;
    }
    case 'citations': {
      const v = 8 + Math.floor(Math.random() * 35);
      state.citations += v;
      bump('citations', v);
      story.push(`【赠礼】${graduate.name}把合作项目里你的名字补进致谢与引用表，引用数据好看不少。`);
      break;
    }
    case 'reputation': {
      const v = 2 + Math.floor(Math.random() * 7);
      state.reputation = Math.min(100, state.reputation + v);
      bump('reputation', v);
      story.push(`【赠礼】离别饭局上${graduate.name}当众夸你靠谱，小圈子里声望涨了一点。`);
      break;
    }
    case 'sanity': {
      const v = 5 + Math.floor(Math.random() * 12);
      state.sanity = Math.min(100, state.sanity + v);
      bump('sanity', v);
      story.push(
        `【赠礼】${graduate.name}送你一本《中关村学院博士生存指南（非官方）》加两杯咖啡券，理智值小幅回血。`
      );
      break;
    }
    case 'asset': {
      const pool = ASSETS_LIBRARY.filter(a => !state.assets.some(o => o.id === a.id));
      if (pool.length === 0) {
        const v = 1200;
        state.funding += v;
        bump('funding', v);
        story.push(`【赠礼】${graduate.name}本想留你设备，仓库已满，改成现金 $${v} 让你自己买。`);
      } else {
        const a = pool[Math.floor(Math.random() * pool.length)];
        state.assets = [...state.assets, { ...a }];
        story.push(`【赠礼】${graduate.name}把自用的「${a.name}」留给你：「带着走太累，你接着用。」`);
      }
      break;
    }
  }
}
