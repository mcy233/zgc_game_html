/**
 * 北京中关村学院 · 叙事与界面用语锚点
 * @see https://bza.edu.cn/
 */
export const BZA = {
  name: '北京中关村学院',
  short: '中关村学院',
  /** 官网表述的科研理念 */
  triad: '极基础、极应用、极交叉',
  /** 培养侧重（概括自官网） */
  focus: '人工智能与交叉学科',
  /** 他人动态里「学院侧」作者名 */
  bulletinAuthor: '中关村学院通知',
} as const;

/** 开局第一条日志 */
export const BZA_WELCOME_LOG = `欢迎来到「${BZA.name}」AI 博士生模拟器。学院践行「${BZA.triad}」的科研理念，以项目制、超常规培养为主线——你的博士长征，从这里启程。`;

export const BZA_GAME_TITLE = `${BZA.short} · AI 博士生模拟器`;
