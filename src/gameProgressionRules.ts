import type { GameState } from './types';

/** 每学期（2 个季度）至少完成的「校园与讲坛」次数（博士第 1–2 学年） */
export const SEMINAR_REQUIRED_PER_SEMESTER = 6;
/** 每连续 2 个季度内文献调研「达标」次数 */
export const LITERATURE_REQUIRED_PER_TWO_QUARTERS = 4;

/** 当前季度内，向前看最多两季的文献调研总数（含本季已累计） */
export function getLiteratureSupportFactor(state: GameState): number {
  const q = state.quarter;
  const arr = state.literatureReviewByQuarter ?? [];
  if (q <= 1) return Math.min(1, (arr[0] ?? 0) / LITERATURE_REQUIRED_PER_TWO_QUARTERS);
  const sum = (arr[q - 2] ?? 0) + (arr[q - 1] ?? 0);
  return Math.min(1, sum / LITERATURE_REQUIRED_PER_TWO_QUARTERS);
}

/** 课题组氛围：导师 + 全体同门好感总和 → 科研与团队类行动的阶段进度倍率 */
export function getLabAtmosphereProgressMultiplier(state: GameState): number {
  if (!state.hasAdvisor) return 1;
  let sum = state.advisorFavor;
  for (const m of state.labMates) sum += m.favor;
  const max = 100 + 100 * state.labMates.length;
  const t = max > 0 ? sum / max : 0.5;
  return 0.82 + 0.28 * Math.min(1, Math.max(0, t));
}

export function relationMoodLabel(favor: number): string {
  if (favor < 25) return '冷淡';
  if (favor < 50) return '点头之交';
  if (favor < 75) return '友好';
  return '热情';
}

export function ensureQuarterStatArray(arr: number[] | undefined, minLength: number): number[] {
  const a = [...(arr ?? [])];
  while (a.length < minLength) a.push(0);
  return a;
}

export function bumpQuarterStat(arr: number[], quarter: number, delta: number): number[] {
  const next = ensureQuarterStatArray(arr, quarter);
  const i = quarter - 1;
  next[i] = (next[i] ?? 0) + delta;
  return next;
}

export const EXPERIMENT_LIT_WEAK_LINES = [
  'Loss 曲线忽上忽下，你盯着 TensorBoard 发呆，完全不知道模型在学什么。',
  '实验日志里全是 NaN 与玄学 seed，你怀疑自己和数据总有一个在撒谎。',
  '对照组与实验组纠缠不清，你感觉自己像在炼丹而不是在做科研。',
];

export function pickExperimentWeakLiteratureLine(): string {
  return EXPERIMENT_LIT_WEAK_LINES[Math.floor(Math.random() * EXPERIMENT_LIT_WEAK_LINES.length)]!;
}

const COLD_LAB_LINES = [
  '课题组走廊里碰见你，大家低头划手机假装没看见——冷场压得你理智发紧。',
  '组会散场没人约饭，你突然意识到自己在这个屋里像空气。',
  '同门群聊里你发链接半天没人接话，尴尬得想退群又不敢。',
];

export function pickColdLabAtmosphereLine(): string {
  return COLD_LAB_LINES[Math.floor(Math.random() * COLD_LAB_LINES.length)]!;
}
