import React, { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  Heart, 
  Zap, 
  DollarSign, 
  Cpu, 
  BookOpen, 
  Users, 
  Coffee, 
  Moon, 
  Briefcase, 
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Trophy,
  Skull,
  Home,
  FlaskConical,
  Package,
  ShieldAlert,
  GraduationCap,
  Calendar,
  TreePine,
  Ghost,
  Palmtree,
  FileX,
  FileText,
  Star,
  Share2,
  HeartHandshake,
  ThumbsUp,
  Archive,
  HelpCircle,
  Mail,
  MapPin,
} from 'lucide-react';
import {
  GameState,
  GameLog,
  Action,
  Milestone,
  AdvisorType,
  Moment,
  LabMate,
  Asset,
  MomentFeedSource,
  GraduationHonor,
  PendingQuarterChoice,
} from './types';
import {
  INITIAL_STATE,
  ACTIONS,
  ADVISOR_PROFILES,
  SEASONS,
  ASSETS_LIBRARY,
  ADVISOR_INTERACTIONS,
  LABMATE_INTERACTIONS,
  pickRandomAssetVendorTitle,
  WRITE_PAPER_MISCONDUCT_NARRATIVES,
  rollWritePaperMisconductDelta,
  rollLiteraturePaperProgressDelta,
  rollExperimentPaperProgressDelta,
  ACTIONS_PER_QUARTER,
} from './constants';
import { POTENTIAL_ADVISOR_VISIT_OUTCOMES } from './advisorVisitContent';
import { pickLeaveLine, pickJoinLine, applySeniorFarewellGifts } from './labTurnover';
import { generateAdvisorFeedback, generateRandomEvent, generateMomentContent, generateExternalMoment } from './services/geminiService';
import { buildStudentProfile } from './studentProfileContent';
import { AssetThumb, AvatarThumb, advisorAvatarKey, labAvatarKey } from './SpriteThumbs';
import { BZA, BZA_GAME_TITLE } from './schoolBranding';
import { pickRandomQuarterChoice } from './quarterChoiceEvents';
import { pickMainTaskHintHtml } from './quarterMainTaskHints';
import { TUTORIAL_STEPS } from './onboardingContent';
import {
  SurvivalGuideModal,
  TutorialOverlay,
  LS_SURVIVAL_KEY,
  LS_TUTORIAL_KEY,
} from './Onboarding';

const StatBar = ({ icon: Icon, label, value, color, max = 100, suffix = "" }: { icon: any, label: string, value: number, color: string, max?: number, suffix?: string }) => (
  <div className="flex flex-col gap-1 w-full">
    <div className="flex justify-between text-[10px] font-mono uppercase opacity-70">
      <span className="flex items-center gap-1"><Icon size={10} /> {label}</span>
      <span>{Math.round(value)}{suffix}/{max}{suffix}</span>
    </div>
    <div className="h-1.5 bg-black/10 rounded-full overflow-hidden border border-black/5">
      <motion.div 
        className={`h-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        transition={{ type: 'spring', stiffness: 50 }}
      />
    </div>
  </div>
);

type Tab = 'HOME' | 'DAILY' | 'RESEARCH' | 'TEAM' | 'ASSETS';
type RightTab = 'LOGS' | 'MOMENTS';
/** 竖屏 / 窄屏下底栏切换的三大分区 */
type LayoutZone = 'ARCHIVE' | 'MAIN' | 'FEED';

/** 事件弹窗「影响」列表：英文 state 字段 → 中文 */
const STAT_LABELS: Record<string, string> = {
  sanity: '理智值',
  health: '健康值',
  energy: '精力值',
  reputation: '学术声望',
  misconduct: '学术不端嫌疑',
  funding: '资金',
  gpuCredits: '算力',
  progress: '阶段进度',
  paperWritingProgress: '论文撰写进度',
  submittedPapers: '待审核投稿',
  papersPublished: '已发表论文',
  citations: '引用量',
  credits: '学分',
  advisorFavor: '导师好感度',
  labMateFavor: '同门好感度',
  quarter: '季度',
  year: '学年',
  projectQuarters: '入组季度数',
  walksThisQuarter: '本季校园漫步',
  actionsThisQuarter: '本季已用行动',
  advisorJoinedQuarter: '拜师季度',
  proposalFinishedQuarter: '开题完成季度',
  actionsSinceExternalMoment: '距他人动态计数',
  externalMomentThreshold: '他人动态阈值',
  sanityCostMultiplier: '理智消耗倍率',
  healthCostMultiplier: '健康消耗倍率',
  energyGainMultiplier: '精力恢复倍率',
  progressGainMultiplier: '进度获取倍率',
  reputationGainMultiplier: '声望获取倍率',
  gpuGainPerQuarter: '每季额外算力',
  fundingGainPerQuarter: '每季额外资金',
  mentorImpressionGain: '导师印象（好感积累）',
};

/** 兼容 PascalCase / camelCase 字段名 */
function effectStatLabel(key: string): string {
  if (STAT_LABELS[key]) return STAT_LABELS[key];
  const normalized = key.charAt(0).toLowerCase() + key.slice(1);
  return STAT_LABELS[normalized] || key;
}

/** 弹窗中展示的数值一律取整，避免浮点误差长串 */
function formatEffectDisplayValue(val: number): string {
  if (typeof val !== 'number' || Number.isNaN(val)) return String(val);
  return String(Math.round(val));
}

function roundEffectRecord(effect: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(effect)) {
    if (typeof v === 'number' && !Number.isNaN(v)) out[k] = Math.round(v);
  }
  return out;
}

function computeGraduationHonor(papers: number, reputation: number): GraduationHonor {
  if (papers >= 6 && reputation >= 88) return 'MYTHIC';
  if (papers >= 5 && reputation >= 82) return 'LEGEND';
  if (papers >= 4 && reputation >= 72) return 'STAR';
  if (papers >= 3 || reputation >= 78) return 'MERIT';
  if (papers <= 2 && reputation < 65) return 'SCRAPE';
  return 'PASS';
}

function graduationEnding(
  honor: GraduationHonor,
  papers: number,
  rep: number
): { title: string; body: string; accent: string } {
  const stats = `你最终以 ${papers} 篇发表论文、学术声望 ${rep} 走过答辩。`;
  switch (honor) {
    case 'MYTHIC':
      return {
        title: '神话级出站',
        body:
          stats +
          ' 成果与声望兼具，委员会几乎是在为你的下一站教职或顶尖实验室席位预热；走廊里有人小声问你是不是要申人才计划。',
        accent: 'text-violet-500',
      };
    case 'LEGEND':
      return {
        title: '高光毕业',
        body:
          stats +
          ' 履历亮眼，导师在组里把你树成标杆；学术圈里你的名字开始和某个方向绑在一起，不再是「某某的学生」。',
        accent: 'text-amber-500',
      };
    case 'STAR':
      return {
        title: '优秀博士',
        body: stats + ' 已稳稳超过大多数同届，博士帽戴得理直气壮；博后、大厂研究院或教职 track，你都有得挑。',
        accent: 'text-emerald-500',
      };
    case 'MERIT':
      return {
        title: '称职博士',
        body: stats + ' 论文与声望都在中上水平，不算明星选手但也绝非凡人；只有你自己知道这一路有多硬扛过来。',
        accent: 'text-teal-600',
      };
    case 'PASS':
      return {
        title: '标准毕业',
        body: stats + ' 达到委员会底线之上，帽子拿到了，头发也真的少了一圈；往后人生继续徐徐展开。',
        accent: 'text-slate-600',
      };
    case 'SCRAPE':
      return {
        title: '惊险过关',
        body:
          stats +
          ' 评委的眉头皱得能夹死蚊子，好在有惊无险；你发誓短期内不想再听到「创新点不足」这五个字。',
        accent: 'text-orange-600',
      };
  }
}

function failureGameOverCopy(m: Milestone): { title: string; body: string } {
  switch (m) {
    case '学术不端退学':
      return { title: '学术生涯终结', body: '学术不端是学术界的红线。调查坐实后，你已无法回头。' };
    case '身心崩溃退学':
      return {
        title: '学术生涯终结',
        body: '关键指标跌至谷底，你已精疲力竭，身心都需要长久休整，学籍难以为继。',
      };
    case '无导师退学':
      return { title: '学术生涯终结', body: '规定时限内无人接收你为徒，培养程序无法继续，你只能黯然离开。' };
    case '开题拖延退学':
      return {
        title: '学术生涯终结',
        body: '开题阶段拖得过长，学院认定你难以匹配项目制培养节奏，劝离培养计划。',
      };
    case '中期拖延退学':
      return {
        title: '学术生涯终结',
        body: '中期考核久拖不决，导师与学院对你失去耐心，学制之路就此中断。',
      };
    case '延毕退学':
      return {
        title: '未按时毕业',
        body: '培养年限用尽仍未完成答辩要求。按规定办理延毕或退学，这段在中关村学院的博士马拉松未能冲线。',
      };
    default:
      return {
        title: '学术生涯终结',
        body: '学业已无法继续。校园权限停用那天，你盯着空荡荡的实验台发了很久呆。',
      };
  }
}

/** 下一次插入「他人动态」所需行动次数，均匀随机 ∈ [4, 11]（略拉长间隔） */
function randomExternalMomentThreshold(): number {
  return 4 + Math.floor(Math.random() * 8);
}

type PaperReviewDetail = {
  submitted: number;
  accepted: number;
  rejected: number;
  lines: string[];
  delta: {
    sanity: number;
    reputation: number;
    funding: number;
    papersPublished: number;
    health: number;
    energy: number;
    citations: number;
    progress: number;
    advisorFavor: number;
  };
};

/**
 * 第一类随机事件合并到 state：仅 0～100 类指标截断；资金/算力/引用等只作下限 0，不得 cap 到 100（否则会出现「季度补助到账后变 $100」）。
 */
function applyQuarterRandomEventEffect(merged: GameState, effect: Record<string, number>): void {
  const clamp100 = new Set([
    'sanity',
    'health',
    'energy',
    'misconduct',
    'reputation',
    'advisorFavor',
    'progress',
    'paperWritingProgress',
  ]);
  for (const [rawKey, delta] of Object.entries(effect)) {
    if (typeof delta !== 'number' || Number.isNaN(delta)) continue;
    if (!(rawKey in merged)) continue;
    const cur = (merged as unknown as Record<string, number>)[rawKey];
    if (typeof cur !== 'number') continue;
    let next = cur + delta;
    if (clamp100.has(rawKey)) {
      next = Math.min(100, Math.max(0, next));
    } else if (rawKey === 'credits') {
      next = Math.min(30, Math.max(0, next));
    } else if (
      rawKey === 'funding' ||
      rawKey === 'gpuCredits' ||
      rawKey === 'citations' ||
      rawKey === 'papersPublished' ||
      rawKey === 'submittedPapers'
    ) {
      next = Math.max(0, next);
    }
    (merged as unknown as Record<string, number>)[rawKey] = next;
  }
}

function computePaperReview(submitted: number, hasAdvisor: boolean): PaperReviewDetail {
  let accepted = 0;
  for (let i = 0; i < submitted; i++) {
    if (Math.random() > 0.52) accepted++;
  }
  const rejected = submitted - accepted;
  const lines: string[] = [`上个季度你共投稿 ${submitted} 篇论文。`];
  const delta = {
    sanity: 0,
    reputation: 0,
    funding: 0,
    papersPublished: accepted,
    health: 0,
    energy: 0,
    citations: 0,
    progress: 0,
    advisorFavor: 0,
  };

  if (accepted > 0) {
    lines.push(`${accepted} 篇被录用。`);
    delta.sanity += accepted * 14;
    delta.reputation += accepted * 9;
    delta.citations += accepted * (12 + Math.floor(Math.random() * 26));
    delta.advisorFavor += accepted * 4;
    delta.progress += accepted * 3;
    if (hasAdvisor) {
      const party = accepted * (350 + Math.floor(Math.random() * 220));
      delta.funding -= party;
      lines.push(`实验室惯例：中稿要请客庆祝，你花费了 $${party}。`);
    }
  }
  if (rejected > 0) {
    lines.push(`${rejected} 篇被拒稿。`);
    delta.sanity -= rejected * 12;
    delta.reputation -= rejected * 4;
    delta.health -= rejected * 3;
    delta.energy -= rejected * 8;
    delta.advisorFavor -= rejected * 2;
  }
  if (accepted > 0 && rejected > 0) {
    lines.push('有悲有喜，审稿意见让你体验了一把情绪过山车。');
  }
  return { submitted, accepted, rejected, lines, delta };
}

export default function App() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<Tab>('HOME');
  const [rightTab, setRightTab] = useState<RightTab>('LOGS');
  const [layoutZone, setLayoutZone] = useState<LayoutZone>('MAIN');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [paperReviewDetail, setPaperReviewDetail] = useState<PaperReviewDetail | null>(null);
  const [currentEvent, setCurrentEvent] = useState<{ title: string; description: string; effect: any } | null>(null);
  const [isAssetOfferModalOpen, setIsAssetOfferModalOpen] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [advisorMessage, setAdvisorMessage] = useState<string>(
    `欢迎来到${BZA.short}。项目制培养节奏紧，先稳住心态，再谈「${BZA.triad}」。`
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<{ type: 'ACTION' | 'WALK' | 'SLACK' | 'OUTING' | 'RETRACT', data?: any } | null>(null);
  const [isQuarterChoiceOpen, setIsQuarterChoiceOpen] = useState(false);
  /** 与当前列表顶部动态 id 比对，用于朋友圈未读红点 */
  const lastSeenTopMomentIdRef = useRef<string | null>(null);
  /** 季度总结本次打开时抽一条「培养主线」，关闭后清空；避免同一轮重渲染反复抽签 */
  const [summaryMainTaskHtml, setSummaryMainTaskHtml] = useState<string | null>(null);
  const summaryModalWasOpenRef = useRef(false);

  useLayoutEffect(() => {
    if (isSummaryModalOpen && !summaryModalWasOpenRef.current) {
      setSummaryMainTaskHtml(pickMainTaskHintHtml(state));
    }
    if (!isSummaryModalOpen) {
      setSummaryMainTaskHtml(null);
    }
    summaryModalWasOpenRef.current = isSummaryModalOpen;
  }, [isSummaryModalOpen, state]);

  const hasUnreadMoments =
    state.moments.length > 0 && state.moments[0].id !== lastSeenTopMomentIdRef.current;

  const [showSurvivalGuide, setShowSurvivalGuide] = useState(false);
  const [survivalFromMenu, setSurvivalFromMenu] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialIndex, setTutorialIndex] = useState(0);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);

  const tutorialSteps = useMemo(
    () => TUTORIAL_STEPS.filter((s) => s.id !== 'advisor' || state.hasAdvisor),
    [state.hasAdvisor]
  );

  const studentProfile = useMemo(
    () => buildStudentProfile(state),
    [
      state.milestone,
      state.quarter,
      state.papersPublished,
      state.citations,
      state.hasAdvisor,
      state.advisorType,
      state.year,
      state.reputation,
      state.credits,
      state.submittedPapers,
      state.sanity,
      state.misconduct,
      state.advisorName,
      state.season,
    ]
  );

  useEffect(() => {
    try {
      if (!localStorage.getItem(LS_SURVIVAL_KEY)) {
        setSurvivalFromMenu(false);
        setShowSurvivalGuide(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!showTutorial) return;
    const step = tutorialSteps[tutorialIndex];
    if (!step) return;
    if (step.layoutZone) setLayoutZone(step.layoutZone);
    if (step.activeTab) setActiveTab(step.activeTab as Tab);
    if (step.rightTab) setRightTab(step.rightTab as RightTab);
  }, [showTutorial, tutorialIndex, tutorialSteps]);

  useEffect(() => {
    if (showTutorial && tutorialIndex >= tutorialSteps.length && tutorialSteps.length > 0) {
      setTutorialIndex(Math.max(0, tutorialSteps.length - 1));
    }
  }, [showTutorial, tutorialIndex, tutorialSteps.length]);

  const acknowledgeSurvival = () => {
    try {
      localStorage.setItem(LS_SURVIVAL_KEY, '1');
    } catch {
      /* ignore */
    }
    setShowSurvivalGuide(false);
    try {
      if (!localStorage.getItem(LS_TUTORIAL_KEY)) {
        setTutorialIndex(0);
        setShowTutorial(true);
      }
    } catch {
      setTutorialIndex(0);
      setShowTutorial(true);
    }
  };

  const closeSurvivalOnly = () => {
    setShowSurvivalGuide(false);
  };

  const startTourFromModal = () => {
    setShowSurvivalGuide(false);
    setTutorialIndex(0);
    setShowTutorial(true);
  };

  const finishTour = () => {
    try {
      localStorage.setItem(LS_TUTORIAL_KEY, '1');
    } catch {
      /* ignore */
    }
    setShowTutorial(false);
  };

  const handleTutorialNext = () => {
    if (tutorialIndex >= tutorialSteps.length - 1) {
      finishTour();
    } else {
      setTutorialIndex((i) => i + 1);
    }
  };

  const handleTutorialPrev = () => {
    setTutorialIndex((i) => Math.max(0, i - 1));
  };

  useEffect(() => {
    if (rightTab === 'MOMENTS' && state.moments.length > 0) {
      lastSeenTopMomentIdRef.current = state.moments[0].id;
    }
  }, [rightTab, state.moments]);

  useEffect(() => {
    if (!isSummaryModalOpen && state.pendingQuarterChoice && !isGameOver) {
      setIsQuarterChoiceOpen(true);
    }
  }, [isSummaryModalOpen, state.pendingQuarterChoice, isGameOver]);

  const addLog = useCallback((message: string, type: GameLog['type'] = 'INFO') => {
    setState(prev => ({
      ...prev,
      logs: [{ quarter: prev.quarter, message, type }, ...prev.logs].slice(0, 50)
    }));
  }, []);

  const addMoment = useCallback(async (eventTitle?: string, currentState?: GameState) => {
    const targetState = currentState || state;
    const { content, comments } = await generateMomentContent(targetState, eventTitle);
    const newMoment: Moment = {
      id: Math.random().toString(36).substr(2, 9),
      quarter: targetState.quarter,
      content,
      comments,
      author: "我",
      likes: Math.floor(Math.random() * 10),
      hasInteracted: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      feedSource: 'SELF',
    };
    setState(prev => ({
      ...prev,
      moments: [newMoment, ...prev.moments].slice(0, 20)
    }));
  }, [state]);

  /** 每次消耗季度行动后调用：累计 4~11 次（随机阈值）则插入一条他人朋友圈 */
  const tickExternalMomentAfterAction = useCallback((prev: GameState, newState: GameState) => {
    const threshold = prev.externalMomentThreshold;
    const nextCount = prev.actionsSinceExternalMoment + 1;
    if (nextCount >= threshold) {
      newState.actionsSinceExternalMoment = 0;
      newState.externalMomentThreshold = randomExternalMomentThreshold();
      const snap = { ...newState };
      queueMicrotask(() => {
        void generateExternalMoment(snap).then((data) => {
          const newMoment: Moment = {
            id: Math.random().toString(36).slice(2, 11),
            quarter: snap.quarter,
            content: data.content,
            author: data.author,
            likes: Math.floor(Math.random() * 18),
            comments: data.comments,
            hasInteracted: false,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            feedSource: data.feedSource,
          };
          setState((p) => ({
            ...p,
            moments: [newMoment, ...p.moments].slice(0, 30),
          }));
        });
      });
    } else {
      newState.actionsSinceExternalMoment = nextCount;
      newState.externalMomentThreshold = threshold;
    }
  }, []);

  const checkGameOver = useCallback((newState: GameState) => {
    if (newState.sanity <= 0 || newState.health <= 0 || newState.energy <= 0 || newState.reputation <= 0) {
      let reason = "你身心崩溃，无法继续学业，只得离开中关村学院的培养轨道。";
      if (newState.energy <= 0) reason = "你精力彻底耗尽，在实验室晕倒被送往医院，学籍难以为继。";
      if (newState.reputation <= 0) reason = "你的学术声望跌至谷底，再难承担学院对 AI 领军人才的期待。";
      addLog(reason, "DANGER");
      setIsGameOver(true);
      setState(prev => ({ ...prev, milestone: '身心崩溃退学' }));
    } else if (newState.misconduct >= 100) {
      addLog("你的学术不端行为被举报并证实。你被开除了。", "DANGER");
      setIsGameOver(true);
      setState(prev => ({ ...prev, milestone: '学术不端退学' }));
    }
    /* 超时未毕业：在 nextQuarter 中已写入 milestone「延毕退学」并结算，此处不再重复判定 */
  }, [addLog]);

  const applyQuarterChoice = useCallback(
    (scenarioTitle: string, opt: PendingQuarterChoice['options'][number]) => {
      setState(prev => {
        const s: GameState = { ...prev, pendingQuarterChoice: undefined };
        const d = opt.deltas;
        if (d.funding !== undefined) s.funding = Math.max(0, s.funding + d.funding);
        if (d.gpuCredits !== undefined) s.gpuCredits = Math.max(0, s.gpuCredits + d.gpuCredits);
        if (d.misconduct !== undefined) s.misconduct = Math.min(100, Math.max(0, s.misconduct + d.misconduct));
        if (d.reputation !== undefined) s.reputation = Math.min(100, Math.max(0, s.reputation + d.reputation));
        if (d.sanity !== undefined) s.sanity = Math.min(100, Math.max(0, s.sanity + d.sanity));
        if (d.health !== undefined) s.health = Math.min(100, Math.max(0, s.health + d.health));
        if (d.energy !== undefined) s.energy = Math.min(100, Math.max(0, s.energy + d.energy));
        if (d.advisorFavor !== undefined) s.advisorFavor = Math.min(100, Math.max(0, s.advisorFavor + d.advisorFavor));
        if (d.progress !== undefined) s.progress = Math.min(100, Math.max(0, s.progress + d.progress));
        queueMicrotask(() => checkGameOver(s));
        return s;
      });
      addLog(`你选择了「${opt.label}」。`, 'INFO');

      const effectFromChoice: Record<string, number> = {};
      for (const [k, v] of Object.entries(opt.deltas)) {
        if (typeof v === 'number' && !Number.isNaN(v) && v !== 0) {
          effectFromChoice[k] = Math.round(v);
        }
      }

      setCurrentEvent({
        title: `${scenarioTitle} · 结果`,
        description: opt.outcomeText,
        effect: roundEffectRecord(effectFromChoice),
      });
      setIsQuarterChoiceOpen(false);
      setIsEventModalOpen(true);
    },
    [addLog, checkGameOver]
  );

  const nextQuarter = async () => {
    setIsLoading(true);

    const prDetail = state.submittedPapers > 0 ? computePaperReview(state.submittedPapers, state.hasAdvisor) : null;
    setPaperReviewDetail(prDetail);

    setState(prev => {
      const pb = prDetail?.delta ?? {
        sanity: 0,
        reputation: 0,
        funding: 0,
        papersPublished: 0,
        health: 0,
        energy: 0,
        citations: 0,
        progress: 0,
        advisorFavor: 0,
      };
      let transitionMessage: string | undefined;
      const nextQ = prev.quarter + 1;
      const nextY = Math.ceil(nextQ / 4);
      const nextS = SEASONS[(nextQ - 1) % 4];
      
      const newState = {
        ...prev,
        quarter: nextQ,
        year: nextY,
        season: nextS,
        actionsThisQuarter: 0,
        walksThisQuarter: 0,
        interactionsThisQuarter: [],
        submittedPapers: 0, // Reset after review
        papersPublished: prev.papersPublished + pb.papersPublished,
        reputation: Math.min(100, Math.max(0, prev.reputation + pb.reputation)),
        sanity: Math.max(0, Math.min(100, prev.sanity + pb.sanity)),
        funding: Math.max(0, prev.funding + pb.funding + 3000), // Base allocation + 论文事件
        citations: prev.citations + pb.citations,
        health: Math.max(0, Math.min(100, prev.health + pb.health)),
        progress: Math.min(100, Math.max(0, prev.progress + pb.progress)),
        advisorFavor: Math.min(100, Math.max(0, prev.advisorFavor + pb.advisorFavor)),
        gpuCredits: prev.gpuCredits + 500,
        pendingQuarterChoice: undefined,
        logs: [
          ...(prDetail
            ? [
                {
                  quarter: prev.quarter,
                  message: prDetail.lines.join(' '),
                  type: (prDetail.accepted > 0 ? 'SUCCESS' : prDetail.rejected > 0 ? 'WARNING' : 'INFO') as GameLog['type'],
                } as GameLog,
              ]
            : []),
          { quarter: nextQ, message: `校历进入第 ${nextY} 年 ${nextS}（${BZA.short}）。`, type: 'INFO' } as GameLog,
          ...prev.logs
        ]
      };

      // Asset Per-Quarter Effects
      newState.assets.forEach(asset => {
        if (asset.effect.gpuGainPerQuarter) newState.gpuCredits += asset.effect.gpuGainPerQuarter;
        if (asset.effect.fundingGainPerQuarter) newState.funding += asset.effect.fundingGainPerQuarter;
      });

      // Asset Offer Logic（神秘商人 · 随机身份）
      const availableAssets = ASSETS_LIBRARY.filter(a => !newState.assets.find(owned => owned.id === a.id));
      if (availableAssets.length > 0) {
        const randomAsset = availableAssets[Math.floor(Math.random() * availableAssets.length)];
        newState.pendingAssetOffer = randomAsset;
        newState.assetVendorTitle = pickRandomAssetVendorTitle();
      } else {
        newState.pendingAssetOffer = undefined;
        newState.assetVendorTitle = undefined;
      }
      
      if (newState.hasAdvisor) {
        newState.projectQuarters += 1;
        newState.quarterLabNotice = undefined;

        const isAutumnStart = (newState.quarter - 1) % 4 === 0;
        const updatedLabMates = newState.labMates.map(mate => {
          let newYear = mate.year;
          let newStatus = mate.status;
          if (isAutumnStart) newYear += 1;
          const statuses = ['正在改论文', '在跑实验', '在摸鱼', '在写开题', '在准备答辩', '在帮导师干活'];
          if (Math.random() < 0.3) {
            newStatus = statuses[Math.floor(Math.random() * statuses.length)];
          }
          return { ...mate, year: newYear, status: newStatus };
        });

        const graduates = updatedLabMates.filter(m => m.year > 4);
        const labStory: string[] = [];
        const labEffect: Record<string, number> = {};

        if (isAutumnStart) {
          for (const g of graduates) {
            addLog(`${g.name}（博四）顺利毕业了，实验室少了一位大佬。`, "INFO");
            labStory.push(pickLeaveLine(g.name, g.role));
            applySeniorFarewellGifts(g, newState, labEffect, labStory);
          }
        } else if (graduates.length > 0) {
          graduates.forEach(g => addLog(`${g.name}（博四）顺利毕业了，实验室少了一位大佬。`, "INFO"));
        }

        newState.labMates = updatedLabMates.filter(m => m.year <= 4);

        if (isAutumnStart) {
          const surnames = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫', '蒋', '沈'];
          const given = ['傲天', '婉清', '子轩', '诗涵', '景行', '予安', '思远', '梓豪', '若溪', '明澈', '书昀', '承宇', '知夏', '砚秋'];
          const isMale = Math.random() > 0.5;
          const fullName = surnames[Math.floor(Math.random() * surnames.length)] + given[Math.floor(Math.random() * given.length)];
          const newMate: LabMate = {
            id: Math.random().toString(36).substr(2, 9),
            name: fullName,
            role: isMale ? '师弟' : '师妹',
            year: 1,
            status: '刚入学，一脸清纯',
            favor: 50,
          };
          newState.labMates.push(newMate);
          addLog(`实验室迎来了新成员：${newMate.name}（${newMate.role}）。`, "SUCCESS");
          labStory.push(pickJoinLine(newMate.name, newMate.role));
          if (labStory.length > 0) {
            const cleaned = roundEffectRecord(labEffect);
            newState.quarterLabNotice = {
              title: '新学期·实验室人事',
              description: labStory.join('\n\n'),
              effect: Object.fromEntries(Object.entries(cleaned).filter(([, v]) => v !== 0)),
            };
          }
        }
      }

      // Recover some stats
      newState.energy = 100;
      newState.sanity = Math.min(100, newState.sanity + 10);
      newState.health = Math.min(100, newState.health + 5);

      // Milestone transitions
      if (newState.progress >= 100) {
      if (newState.milestone === '课程学习') {
        if (newState.credits < 30) {
          transitionMessage = "培养系统里学分未达标，教务与培养办暂不放行下一阶段——在中关村学院，课表和项目一样不能拖。";
          newState.progress = 99;
        } else if (!newState.hasAdvisor) {
          transitionMessage = "学分修满了，进度也够了，但你还是个'孤儿'。快去找个导师收留你，否则没法开题！";
          newState.progress = 99;
        } else {
          newState.milestone = '开题准备';
          newState.progress = 0;
          transitionMessage = "恭喜完成课程学习阶段。接下来进入开题准备——项目制培养里，这才是「极应用」的真正热身。";
        }
      } else if (newState.milestone === '开题准备') {
        if (newState.quarter < (newState.advisorJoinedQuarter || 0) + 2) {
          transitionMessage = "加入导师门下不满半年，还不允许开题。导师说你还太嫩，再沉淀沉淀。";
          newState.progress = 99;
        } else {
          newState.milestone = '中期考核';
          newState.progress = 0;
          newState.proposalFinishedQuarter = newState.quarter;
          transitionMessage = "开题报告通过！导师说你的技术路线「饼画得又大又圆」，接下来要在学院的项目节奏里把它烤熟。";
        }
      } else if (newState.milestone === '中期考核') {
        if (newState.quarter < (newState.proposalFinishedQuarter || 0) + 4) {
          transitionMessage = "开题不满一年，还不允许进行中期考核。导师让你再磨练磨练。";
          newState.progress = 99;
        } else if (newState.papersPublished < 1) {
          transitionMessage = "中期考核需要至少发表 1 篇论文。你的成果呢？难道都写在梦里了？";
          newState.progress = 99;
        } else {
          newState.milestone = '论文撰写';
          newState.progress = 0;
          transitionMessage = "中期考核顺利通过！离学院学位要求又近一步，虽然头发又少了一圈。大论文开写，别辜负「极交叉」三个字。";
        }
      } else if (newState.milestone === '论文撰写') {
        newState.milestone = '毕业答辩';
        newState.progress = 0;
        transitionMessage = "大论文初稿居然写完了，堪称医学奇迹。准备迎接学院学位与答辩相关程序的考验吧！";
      } else if (newState.milestone === '毕业答辩') {
        if (newState.reputation < 60) {
          transitionMessage = "学术声望偏低，答辩环节难以体现学院对 AI 领军人才的期待。多产出、多交流，别让大家觉得你在「混项目」。";
          newState.progress = 99;
        } else if (newState.papersPublished < 2) {
          transitionMessage = "毕业答辩需要至少发表 2 篇论文。你还差一点火候，再去实验室搬会儿砖吧。";
          newState.progress = 99;
        } else {
          newState.milestone = '顺利毕业';
          newState.graduationHonor = computeGraduationHonor(newState.papersPublished, newState.reputation);
          setIsGameOver(true);
          transitionMessage = `答辩通过！你完成了在${BZA.short}这一段项目制博士旅程。恭喜你，博士！`;
        }
      }
    }

    if (transitionMessage) {
      addLog(transitionMessage, "SUCCESS");
    }

    // Expulsion Checks
    if (newState.year > 1 && !newState.hasAdvisor) {
      addLog(`第一学年已结束，你仍未进入任何导师项目团队。按${BZA.short}培养规定，无法继续注册学籍。`, "DANGER");
      newState.milestone = '无导师退学';
      setIsGameOver(true);
    } else if (newState.milestone === '开题准备' && newState.advisorJoinedQuarter > 0 && newState.quarter > newState.advisorJoinedQuarter + 6) {
      addLog("开题准备阶段远超学院建议时长，项目推进评估未通过，劝退处理。", "DANGER");
      newState.milestone = '开题拖延退学';
      setIsGameOver(true);
    } else if (newState.milestone === '中期考核' && newState.proposalFinishedQuarter > 0 && newState.quarter > newState.proposalFinishedQuarter + 8) {
      addLog("中期考核节点严重滞后，导师组与学院培养办对你失去继续培养的信心，劝退处理。", "DANGER");
      newState.milestone = '中期拖延退学';
      setIsGameOver(true);
    } else if (newState.quarter > 16 && newState.milestone !== '顺利毕业') {
      addLog(`培养年限已满，你未完成毕业答辩与学位要求。按${BZA.short}规定办理延毕或退学相关程序。`, "DANGER");
      newState.milestone = '延毕退学';
      setIsGameOver(true);
    }

    if (Math.random() < 0.4) {
      void generateRandomEvent(newState).then(event => {
        const eff = event.effect
          ? roundEffectRecord(event.effect as Record<string, number>)
          : undefined;
        setCurrentEvent({ ...event, effect: eff });
        setIsEventModalOpen(true);
        if (event.effect) {
          setState(s => {
            const merged = { ...s };
            applyQuarterRandomEventEffect(merged, roundEffectRecord(event.effect as Record<string, number>));
            return merged;
          });
        }
        if (Math.random() < 0.8) {
          addMoment(event.title, newState);
        }
      });
    } else if (Math.random() < 0.3) {
      addMoment(undefined, newState);
    }

    if (newState.hasAdvisor) {
      void generateAdvisorFeedback(newState).then(feedback => setAdvisorMessage(feedback));
    }

    checkGameOver(newState);

    const terminalMilestones: Milestone[] = [
      '学术不端退学',
      '身心崩溃退学',
      '无导师退学',
      '开题拖延退学',
      '中期拖延退学',
      '延毕退学',
      '顺利毕业',
    ];
    if (!terminalMilestones.includes(newState.milestone) && Math.random() < 0.38) {
      newState.pendingQuarterChoice = pickRandomQuarterChoice();
    }

    addLog(`校历进入第 ${newState.year} 年 ${newState.season}。获得本季度培养资源补助（${BZA.short}）。`, "INFO");
    setIsQuarterChoiceOpen(false);
    setIsSummaryModalOpen(true);
    if (newState.pendingAssetOffer) {
      setIsAssetOfferModalOpen(true);
    }
    setIsLoading(false);

    return newState;
  });
  };

  const buyAsset = (asset: Asset) => {
    if (state.funding < asset.price) {
      addLog("资金不足，无法购买此资产。", "WARNING");
      return;
    }
    setState(prev => ({
      ...prev,
      funding: prev.funding - asset.price,
      assets: [...prev.assets, asset],
      pendingAssetOffer: undefined,
      assetVendorTitle: undefined,
    }));
    addLog(`成功购买资产：${asset.name}。`, "SUCCESS");
    setIsAssetOfferModalOpen(false);
  };

  const sellAsset = (asset: Asset) => {
    setState(prev => ({
      ...prev,
      funding: prev.funding + asset.sellPrice,
      assets: prev.assets.filter(a => a.id !== asset.id)
    }));
    addLog(`成功出售资产：${asset.name}，获得 $${asset.sellPrice}。`, "INFO");
  };

  const handleAction = (action: Action, force: boolean = false) => {
    if (state.actionsThisQuarter >= ACTIONS_PER_QUARTER) {
      addLog(`本季度行动次数已达上限（${ACTIONS_PER_QUARTER} 次）。请进入下个季度。`, "WARNING");
      return;
    }

    const profile = ADVISOR_PROFILES[state.advisorType];
    
    // Asset Effects
    let sanityCostMod = 1;
    let healthCostMod = 1;
    let progressGainMod = 1;

    state.assets.forEach(asset => {
      if (asset.effect.sanityCostMultiplier) sanityCostMod *= asset.effect.sanityCostMultiplier;
      if (asset.effect.healthCostMultiplier) healthCostMod *= asset.effect.healthCostMultiplier;
      if (asset.effect.progressGainMultiplier) progressGainMod *= asset.effect.progressGainMultiplier;
    });

    if (state.hasAdvisor && state.advisorFavor > 80) {
      sanityCostMod *= 0.7;
    }

    const sanityCost = action.sanityCost * sanityCostMod;
    const healthCost = action.healthCost * healthCostMod;

    // Risk Check：任意关键指标在本次消耗后将 ≤0（含「透支」）均弹出确认
    if (!force) {
      const sanLoss = sanityCost > 0 ? sanityCost : 0;
      const hpLoss = healthCost > 0 ? healthCost : 0;
      const enLoss = action.energyCost > 0 ? action.energyCost : 0;
      const willDie =
        (sanLoss > 0 && state.sanity - sanLoss <= 0) ||
        (hpLoss > 0 && state.health - hpLoss <= 0) ||
        (enLoss > 0 && state.energy - enLoss <= 0) ||
        (state.reputation <= 0 && action.category !== 'RESEARCH');

      if (willDie) {
        setWarningMessage("警告：执行此操作将使你的某项关键指标降至 0 或以下（包括透支），你可能会直接「Go Die」！确定要冒险吗？");
        setPendingAction({ type: 'ACTION', data: action });
        setIsWarningModalOpen(true);
        return;
      }
    }

    executeAction(action, sanityCost, healthCost, progressGainMod);
  };

  const executeAction = async (action: Action, sanityCost: number, healthCost: number, progressGainMod: number) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 600));

    const profile = ADVISOR_PROFILES[state.advisorType];
    const progressMult = state.hasAdvisor ? profile.progressMultiplier : 1.0;

    /** 论文撰写：概率触发学术不端嫌疑，增量以 5 为均值小幅波动；叙事与弹窗文案一致 */
    const writePaperMisconductHit = action.id === 'write_paper' && Math.random() < 0.28;
    const writePaperMisconductDelta = writePaperMisconductHit ? rollWritePaperMisconductDelta() : 0;
    const writePaperMisconductLine = writePaperMisconductHit
      ? WRITE_PAPER_MISCONDUCT_NARRATIVES[Math.floor(Math.random() * WRITE_PAPER_MISCONDUCT_NARRATIVES.length)]
      : '';
    /** 出差报告：会场风评对嫌疑的加减，预先掷骰以便写入影响列表 */
    let conferenceOutcome: { dMisconduct: number; dReputation: number } | null = null;
    const literaturePaperDelta =
      action.id === 'literature_review' && state.hasAdvisor ? rollLiteraturePaperProgressDelta() : 0;
    const experimentPaperDelta =
      action.id === 'run_experiments' && state.hasAdvisor ? rollExperimentPaperProgressDelta() : 0;

    if (action.id === 'conference_trip') {
      if (Math.random() < 0.52) {
        if (Math.random() < 0.58) {
          const cut = 6 + Math.floor(Math.random() * 9);
          conferenceOutcome = { dMisconduct: -cut, dReputation: 1 + Math.floor(Math.random() * 3) };
        } else {
          const add = 6 + Math.floor(Math.random() * 11);
          conferenceOutcome = { dMisconduct: add, dReputation: 0 };
        }
      }
    }

    setState(prev => {
      const newState = { ...prev };
      const profileInner = ADVISOR_PROFILES[prev.advisorType];
      
      if (action.labMateFavorGain) {
        newState.labMates = newState.labMates.map(mate => ({
          ...mate,
          favor: Math.min(100, mate.favor + (action.labMateFavorGain || 0))
        }));
      }

      newState.energy = Math.max(0, prev.energy - action.energyCost);
      newState.sanity = Math.max(0, prev.sanity - sanityCost);
      newState.health = Math.max(0, prev.health - healthCost);
      newState.funding = prev.funding - action.fundingCost + action.fundingGain;
      newState.gpuCredits = Math.max(0, prev.gpuCredits - action.gpuCost);
      newState.actionsThisQuarter += 1;
      
      if (action.creditGain) newState.credits += action.creditGain;
      if (action.misconductChange) newState.misconduct = Math.min(100, Math.max(0, newState.misconduct + action.misconductChange));

      const progressMultInner = prev.hasAdvisor ? profileInner.progressMultiplier : 1.0;
      newState.progress = Math.min(100, newState.progress + (action.progressGain * progressMultInner * progressGainMod));
      
      if (prev.hasAdvisor) {
        newState.advisorFavor = Math.min(100, Math.max(0, newState.advisorFavor + (action.favorGain * profileInner.favorMultiplier)));
      } else if (action.favorGain > 0) {
        (Object.keys(newState.potentialAdvisors) as AdvisorType[]).forEach(type => {
          const rate = ADVISOR_PROFILES[type].favorGainRate;
          newState.potentialAdvisors[type] = Math.min(100, newState.potentialAdvisors[type] + (action.favorGain * rate * 0.5));
        });
      }

      if (action.category === 'RESEARCH') {
        newState.reputation += 1;
        if (action.id === 'conference_trip') newState.reputation += 10;

        if (action.id === 'write_paper') {
          const writingGain = 20 * progressGainMod;
          newState.paperWritingProgress += writingGain;
          
          if (writePaperMisconductHit && writePaperMisconductDelta > 0) {
            newState.misconduct = Math.min(100, newState.misconduct + writePaperMisconductDelta);
            addLog(`${writePaperMisconductLine} 学术不端嫌疑 +${writePaperMisconductDelta}。`, 'WARNING');
          }

          if (newState.paperWritingProgress >= 100) {
            newState.submittedPapers += 1;
            newState.paperWritingProgress = 0;
            newState.logs = [
              {
                quarter: prev.quarter,
                message: `论文撰写完成！稿件已进入「投稿审核中」，下季度进入新季度时将公布审稿结果。`,
                type: 'SUCCESS',
              },
              ...prev.logs,
            ];
          }
        }

        if (action.id === 'literature_review' && literaturePaperDelta > 0 && prev.hasAdvisor) {
          newState.paperWritingProgress = Math.min(100, newState.paperWritingProgress + literaturePaperDelta);
          if (newState.paperWritingProgress >= 100) {
            newState.submittedPapers += 1;
            newState.paperWritingProgress = 0;
            newState.logs = [
              {
                quarter: prev.quarter,
                message: `论文撰写完成！稿件已进入「投稿审核中」，下季度进入新季度时将公布审稿结果。`,
                type: 'SUCCESS',
              },
              ...newState.logs,
            ];
          }
        }

        if (action.id === 'run_experiments' && experimentPaperDelta > 0 && prev.hasAdvisor) {
          newState.paperWritingProgress = Math.min(100, newState.paperWritingProgress + experimentPaperDelta);
          if (newState.paperWritingProgress >= 100) {
            newState.submittedPapers += 1;
            newState.paperWritingProgress = 0;
            newState.logs = [
              {
                quarter: prev.quarter,
                message: `论文撰写完成！稿件已进入「投稿审核中」，下季度进入新季度时将公布审稿结果。`,
                type: 'SUCCESS',
              },
              ...newState.logs,
            ];
          }
        }

        if (action.id === 'conference_trip' && conferenceOutcome) {
          newState.misconduct = Math.min(100, Math.max(0, newState.misconduct + conferenceOutcome.dMisconduct));
          if (conferenceOutcome.dReputation > 0) {
            newState.reputation = Math.min(100, newState.reputation + conferenceOutcome.dReputation);
          }
          if (conferenceOutcome.dMisconduct < 0) {
            const cut = -conferenceOutcome.dMisconduct;
            queueMicrotask(() =>
              addLog(
                `出差报告：你在会场报告或海报交流里应对得体，同行私下评价不错，冲淡了此前的质疑。学术不端嫌疑 -${cut}。`,
                'SUCCESS'
              )
            );
          } else {
            const add = conferenceOutcome.dMisconduct;
            queueMicrotask(() =>
              addLog(
                `出差报告：现场有人追问实验细节，你应答含糊被传开，圈子里多了些不利揣测。学术不端嫌疑 +${add}。`,
                'WARNING'
              )
            );
          }
        }
      }

      if (Math.random() < 0.065) {
        queueMicrotask(() => addMoment(undefined, newState));
      }

      if (action.id === 'college_activity') {
        newState.reputation += 2;
      }

      const committed = newState;
      queueMicrotask(() => checkGameOver(committed));
      tickExternalMomentAfterAction(prev, newState);
      return newState;
    });

    const desc = action.descriptions ? action.descriptions[Math.floor(Math.random() * action.descriptions.length)] : action.description;
    addLog(desc);
    addLog(`执行：${action.label}`);

    const effect: Record<string, number> = {};
    if (action.energyCost) effect.energy = -Math.round(action.energyCost);
    if (sanityCost) effect.sanity = -Math.round(sanityCost);
    if (action.healthCost) effect.health = -Math.round(action.healthCost);
    if (action.fundingCost) effect.funding = -Math.round(action.fundingCost);
    if (action.gpuCost) effect.gpuCredits = -Math.round(action.gpuCost);
    if (action.progressGain)
      effect.progress = Math.round(action.progressGain * progressMult * progressGainMod);
    if (action.favorGain) effect.advisorFavor = Math.round(action.favorGain * profile.favorMultiplier);
    if (action.fundingGain) effect.funding = (effect.funding || 0) + Math.round(action.fundingGain);
    if (action.creditGain) effect.credits = Math.round(action.creditGain);
    if (action.labMateFavorGain) effect.labMateFavor = Math.round(action.labMateFavorGain);

    let misconductDisplay = 0;
    if (action.misconductChange) misconductDisplay += Math.round(action.misconductChange);
    if (writePaperMisconductHit) misconductDisplay += writePaperMisconductDelta;
    if (conferenceOutcome) misconductDisplay += conferenceOutcome.dMisconduct;
    if (misconductDisplay !== 0) effect.misconduct = misconductDisplay;

    if (action.id === 'conference_trip') {
      effect.reputation = (effect.reputation || 0) + 1 + 10;
      if (conferenceOutcome && conferenceOutcome.dReputation > 0) {
        effect.reputation += conferenceOutcome.dReputation;
      }
    }

    if (literaturePaperDelta > 0) effect.paperWritingProgress = literaturePaperDelta;
    if (experimentPaperDelta > 0) effect.paperWritingProgress = experimentPaperDelta;

    const randomDesc = action.descriptions && action.descriptions.length > 0 
      ? action.descriptions[Math.floor(Math.random() * action.descriptions.length)]
      : action.description;

    const eventDescription =
      action.id === 'write_paper' && writePaperMisconductHit && writePaperMisconductLine
        ? `${randomDesc}\n\n${writePaperMisconductLine}`
        : randomDesc;

    setCurrentEvent({
      title: action.label,
      description: eventDescription,
      effect: roundEffectRecord(effect),
    });
    setIsEventModalOpen(true);
    setIsLoading(false);
  };

  // Self-Regulation Actions
  const handleCampusWalk = (force: boolean = false) => {
    if (state.actionsThisQuarter >= ACTIONS_PER_QUARTER) {
      addLog("本季度行动次数已达上限。", "WARNING");
      return;
    }
    if (state.walksThisQuarter >= 3) {
      addLog("本季度校园漫步次数已达上限。", "WARNING");
      return;
    }
    setState(prev => {
      const newState = {
        ...prev,
        walksThisQuarter: prev.walksThisQuarter + 1,
        actionsThisQuarter: prev.actionsThisQuarter + 1,
        sanity: Math.min(100, prev.sanity + 10),
        health: Math.min(100, prev.health + 5),
        energy: Math.min(100, prev.energy + 15),
      };
      
      const walkDescs = [
        "在中关村学院园区里散了散步，心情舒畅了些。远处工地与玻璃楼同框，你突然觉得论文也不是那么难写。",
        "从教学楼晃到报告厅楼下，落叶纷飞，你思考人生意义，最后发现还是干饭最有意义。",
        "绕着操场走了几圈，看着挥汗跑步的同学，你感叹年轻真好，不像你已经老死在 GPU 前面。",
        "在公共自习区门口坐了一会儿，看进进出出的博士生，你觉得自己像一个学术幽灵。"
      ];
      let mainDesc = walkDescs[Math.floor(Math.random() * walkDescs.length)];
      
      let extraDesc = "";
      // Extra Event: Meet someone
      if (Math.random() < 0.2) {
        const gain = 5;
        newState.reputation = Math.min(100, newState.reputation + gain);
        extraDesc = ` 路上偶遇学院一位做战略报告的老师，礼貌寒暄几句，对方对你印象不错。学术声望微增。`;
      }

      if (!prev.hasAdvisor) {
        (Object.keys(newState.potentialAdvisors) as AdvisorType[]).forEach(type => {
          const rate = ADVISOR_PROFILES[type].favorGainRate;
          newState.potentialAdvisors[type] = Math.min(100, newState.potentialAdvisors[type] + (2 * rate));
        });
      }

      setCurrentEvent({
        title: "校园漫步",
        description: mainDesc + extraDesc,
        effect: { sanity: 10, health: 5, energy: 15, reputation: extraDesc ? 5 : 0 }
      });
      setIsEventModalOpen(true);

      tickExternalMomentAfterAction(prev, newState);
      return newState;
    });
  };

  const handleInteraction = (personId: string, isAdvisor: boolean = false) => {
    if (state.actionsThisQuarter >= ACTIONS_PER_QUARTER) {
      addLog("本季度行动次数已达上限。", "WARNING");
      return;
    }
    if (state.interactionsThisQuarter.includes(personId)) {
      addLog("本季度已经和该成员互动过了。", "WARNING");
      return;
    }
    if (state.energy < 10) {
      addLog("精力不足，无法进行互动。", "WARNING");
      return;
    }

    const interactions = isAdvisor ? ADVISOR_INTERACTIONS : LABMATE_INTERACTIONS;
    const interaction = interactions[Math.floor(Math.random() * interactions.length)];
    const text = interaction.texts[Math.floor(Math.random() * interaction.texts.length)];
    const eff = interaction.effect as Record<string, number>;
    
    setState(prev => {
      const newState = { ...prev };
      newState.actionsThisQuarter += 1;
      newState.energy = Math.max(0, prev.energy + (eff.energy ?? -5));
      newState.sanity = Math.min(100, Math.max(0, prev.sanity + (eff.sanity || 0)));
      newState.health = Math.min(100, Math.max(0, prev.health + (eff.health || 0)));
      newState.funding = Math.max(0, prev.funding + (eff.funding || 0));
      newState.progress = Math.min(100, Math.max(0, prev.progress + (eff.progress || 0)));
      newState.reputation = Math.min(100, Math.max(0, prev.reputation + (eff.reputation || 0)));
      newState.paperWritingProgress = Math.min(100, Math.max(0, prev.paperWritingProgress + (eff.paperWritingProgress || 0)));
      newState.gpuCredits = Math.max(0, prev.gpuCredits + (eff.gpuCredits || 0));
      
      if (isAdvisor) {
        newState.advisorFavor = Math.min(100, Math.max(0, prev.advisorFavor + (eff.advisorFavor || 0)));
      } else {
        newState.labMates = prev.labMates.map(m => m.id === personId ? { ...m, favor: Math.min(100, m.favor + (eff.labMateFavor || 0)) } : m);
      }
      
      newState.interactionsThisQuarter = [...prev.interactionsThisQuarter, personId];
      tickExternalMomentAfterAction(prev, newState);
      return newState;
    });

    setCurrentEvent({
      title: interaction.label,
      description: text,
      effect: roundEffectRecord(interaction.effect as Record<string, number>),
    });
    setIsEventModalOpen(true);
  };

  const handleSlackOff = (force: boolean = false) => {
    if (state.actionsThisQuarter >= ACTIONS_PER_QUARTER) {
      addLog("本季度行动次数已达上限。", "WARNING");
      return;
    }
    if (!force) {
      if (state.sanity - 5 <= 0 || state.health - 2 <= 0) {
        setWarningMessage("警告：虽然摸鱼很爽，但你现在的身体状况已经经不起任何折腾了（理智或健康将降至 0 及以下），确定要冒险吗？");
        setPendingAction({ type: 'SLACK' });
        setIsWarningModalOpen(true);
        return;
      }
    }
    setState(prev => {
      const newState = {
        ...prev,
        actionsThisQuarter: prev.actionsThisQuarter + 1,
        energy: Math.min(100, prev.energy + 40),
        sanity: Math.max(0, prev.sanity - 5),
        health: Math.max(0, prev.health - 2),
      };

      const slackDescs = [
        "打开了游戏，刷起了短视频。虽然内心充满罪恶感，但多巴胺的分泌让你暂时忘记了导师的催促。",
        "在工位上盯着天花板发呆，脑子里全是中午吃什么的终极哲学问题。",
        "偷偷溜出实验室去喝了杯奶茶，感觉灵魂得到了短暂的救赎。",
        "在宿舍里睡了个昏天黑地的午觉，醒来后发现天都黑了，罪恶感爆棚。"
      ];
      let mainDesc = slackDescs[Math.floor(Math.random() * slackDescs.length)];

      let extraDesc = "";
      // Extra Event: Caught by advisor
      if (prev.hasAdvisor && Math.random() < 0.15) {
        const loss = 10;
        newState.advisorFavor = Math.max(0, newState.advisorFavor - loss);
        extraDesc = " 糟糕！摸鱼的时候碰上导师查岗，导师叹了口气：'崽啊，老师对你很失望。' 导师好感度下降。";
      } else if (Math.random() < 0.1) {
        newState.sanity = Math.min(100, newState.sanity + 10);
        extraDesc = " 刷到了一个超级好笑的视频，理智值额外恢复了。";
      }

      setCurrentEvent({
        title: "摆烂摸鱼",
        description: mainDesc + extraDesc,
        effect: { energy: 40, sanity: extraDesc.includes('恢复') ? 5 : -5, health: -2, advisorFavor: extraDesc.includes('失望') ? -10 : 0 }
      });
      setIsEventModalOpen(true);

      tickExternalMomentAfterAction(prev, newState);
      return newState;
    });
  };

  const handleOuting = (force: boolean = false) => {
    if (state.actionsThisQuarter >= ACTIONS_PER_QUARTER) {
      addLog("本季度行动次数已达上限。", "WARNING");
      return;
    }
    const cost = 500;
    const energyCost = 30;
    if (state.funding < cost || state.energy < energyCost) {
      addLog("资金或精力不足以支持外出游玩。", "WARNING");
      return;
    }
    if (!force) {
      if (state.energy - energyCost <= 0) {
        setWarningMessage("警告：你已经累得快走不动路了，强行出去玩可能使精力降至 0 及以下，确定吗？");
        setPendingAction({ type: 'OUTING' });
        setIsWarningModalOpen(true);
        return;
      }
    }
    setState(prev => {
      const newState = {
        ...prev,
        funding: prev.funding - cost,
        energy: prev.energy - energyCost,
        actionsThisQuarter: prev.actionsThisQuarter + 1,
        sanity: Math.min(100, prev.sanity + 25),
        health: Math.min(100, prev.health + 15),
      };

      const outingDescs = [
        "去看了场电影，吃了一顿大餐。外面的世界如此精彩，让你产生了一种想要退学去打工的冲动。",
        "去郊外爬了次山，呼吸着新鲜空气，你感觉肺里的学术灰尘都被洗干净了。",
        "逛了一整天商场，虽然钱包空了，但心情确实变好了不少。",
        "去参加了一场漫展，看着满目的二次元，你觉得现实世界还是很有趣的。"
      ];
      let mainDesc = outingDescs[Math.floor(Math.random() * outingDescs.length)];

      let extraDesc = "";
      // Extra Event: Inspiration
      if (Math.random() < 0.15) {
        newState.progress = Math.min(100, newState.progress + 6);
        extraDesc = " 在外出的路上突然灵光一闪，想到了困扰已久的实验难题！科研进度增加。";
      }

      if (!prev.hasAdvisor) {
        (Object.keys(newState.potentialAdvisors) as AdvisorType[]).forEach(type => {
          const rate = ADVISOR_PROFILES[type].favorGainRate;
          newState.potentialAdvisors[type] = Math.min(100, newState.potentialAdvisors[type] + (5 * rate));
        });
      }

      setCurrentEvent({
        title: "外出游玩",
        description: mainDesc + extraDesc,
        effect: { funding: -500, energy: -30, sanity: 25, health: 15, progress: extraDesc ? 6 : 0 }
      });
      setIsEventModalOpen(true);

      tickExternalMomentAfterAction(prev, newState);
      return newState;
    });
  };

  const handleRetractPaper = (force: boolean = false) => {
    if (state.actionsThisQuarter >= ACTIONS_PER_QUARTER) {
      addLog("本季度行动次数已达上限。", "WARNING");
      return;
    }
    if (state.papersPublished <= 0) {
      addLog("你还没有发表过论文，无法撤稿。", "WARNING");
      return;
    }
    if (!force) {
      if (state.reputation - 20 <= 0) {
        setWarningMessage("警告：撤稿会使学术声望降至 0 或以下，你将被学术界永久封杀，确定要这样做吗？");
        setPendingAction({ type: 'RETRACT' });
        setIsWarningModalOpen(true);
        return;
      }
    }
    setState(prev => {
      const newState = {
        ...prev,
        papersPublished: prev.papersPublished - 1,
        misconduct: Math.max(0, prev.misconduct - 30),
        reputation: Math.max(0, prev.reputation - 20),
        actionsThisQuarter: prev.actionsThisQuarter + 1,
      };

      setCurrentEvent({
        title: "撤稿止损",
        description: "你发现论文中的数据存在严重问题，连夜联系编辑撤稿。虽然名声扫地，但至少保住了最后的底线。",
        effect: { papersPublished: -1, misconduct: -30, reputation: -20 }
      });
      setIsEventModalOpen(true);

      tickExternalMomentAfterAction(prev, newState);
      return newState;
    });
  };

  const likeMomentCopy = (src?: MomentFeedSource, author?: string): { title: string; desc: string; gain: number } => {
    const gain = 1 + Math.floor(Math.random() * 4);
    switch (src) {
      case 'COLLEGE':
        return {
          title: '点赞 · 学院动态',
          desc: `你给「${author ?? BZA.bulletinAuthor}」点了个赞。中关村学院的行政通知也能刷出存在感，心里莫名踏实了一点。理智值 +${gain}。`,
          gain,
        };
      case 'PEER':
        return {
          title: '点赞 · 同届同学',
          desc: `你给同届「${author ?? '同学'}」点了赞。peer pressure 少了一点点，同温层取暖成功。理智值 +${gain}。`,
          gain,
        };
      case 'OTHER_LAB':
        return {
          title: '点赞 · 隔壁课题组',
          desc: `你给「${author ?? '隔壁组'}」点了赞。围观别人的实验室 drama，自己的焦虑好像被稀释了。理智值 +${gain}。`,
          gain,
        };
      case 'ADVISOR':
        return {
          title: '点赞 · 导师朋友圈',
          desc: `你秒赞了导师「${author ?? '导师'}」的动态。求生欲拉满，顺便给自己一点心理安慰。理智值 +${gain}。`,
          gain,
        };
      case 'SELF':
      default:
        return {
          title: '点赞 · 自己的动态',
          desc: '你给自己的动态补了一个赞（自我关怀版）。理智值 +' + gain + '。',
          gain,
        };
    }
  };

  const interactWithMoment = (momentId: string) => {
    const moment = state.moments.find(m => m.id === momentId);
    if (!moment || moment.hasInteracted) return;

    const src: MomentFeedSource = moment.feedSource ?? (moment.author === '我' ? 'SELF' : 'PEER');
    const { title, desc, gain } = likeMomentCopy(src, moment.author);

    setState(prev => {
      const newMoments = prev.moments.map(m => {
        if (m.id === momentId) {
          return { ...m, likes: m.likes + 1, hasInteracted: true };
        }
        return m;
      });

      return {
        ...prev,
        moments: newMoments,
        sanity: Math.min(100, prev.sanity + gain),
      };
    });

    setCurrentEvent({
      title,
      description: desc,
      effect: { sanity: gain },
    });
    setIsEventModalOpen(true);
  };

  const selectAdvisor = (type: AdvisorType) => {
    const profile = ADVISOR_PROFILES[type];
    
    // Check favor requirement
    if (state.potentialAdvisors[type] < 100) {
      addLog(`${profile.label}对你还不够了解。请继续通过拜访或科研活动积累好感度（需达到100%）。`, "WARNING");
      return;
    }

    // Check requirements
    if (profile.requirements.reputation && state.reputation < profile.requirements.reputation) {
      addLog(`声望不足！${profile.label}要求声望达到 ${profile.requirements.reputation}。`, "WARNING");
      return;
    }
    if (profile.requirements.credits && state.credits < profile.requirements.credits) {
      addLog(`学分不足！${profile.label}要求学分达到 ${profile.requirements.credits}。`, "WARNING");
      return;
    }
    if (profile.requirements.papers && state.papersPublished < profile.requirements.papers) {
      addLog(`论文不足！${profile.label}要求至少发表 ${profile.requirements.papers} 篇论文。`, "WARNING");
      return;
    }

    // Initialize Lab Mates
    const initialLabMates: LabMate[] = [
      { id: '1', name: '张傲天', role: '师兄', year: 3, status: '正在改论文', favor: 50 },
      { id: '2', name: '李婉清', role: '师姐', year: 2, status: '在跑实验', favor: 50 },
      { id: '3', name: '王德发', role: '师弟', year: 1, status: '在摸鱼', favor: 50 },
    ];

    setState(prev => ({
      ...prev,
      hasAdvisor: true,
      advisorType: type,
      advisorName: `${profile.label}导师`,
      advisorJoinedQuarter: prev.quarter,
      advisorFavor: 100, // Start with full favor since they joined
      milestone: prev.milestone === '课程学习' || prev.milestone === '导师选择' ? '开题准备' : prev.milestone,
      projectQuarters: 0,
      labMates: initialLabMates,
      logs: [{ quarter: prev.quarter, message: `成功拜入${profile.label}门下。研究项目启动。`, type: 'SUCCESS' }, ...prev.logs]
    }));
    addLog(`导师风格：${profile.description}`);
  };

  const visitPotentialAdvisor = (type: AdvisorType) => {
    if (state.actionsThisQuarter >= ACTIONS_PER_QUARTER) {
      addLog("本季度行动次数已达上限。", "WARNING");
      return;
    }
    const cost = 200;
    const energyCost = 20;
    if (state.funding < cost || state.energy < energyCost) {
      addLog("资金或精力不足以拜访导师。", "WARNING");
      return;
    }
    const profile = ADVISOR_PROFILES[type];
    const pool = POTENTIAL_ADVISOR_VISIT_OUTCOMES[type];
    const outcome = pool[Math.floor(Math.random() * pool.length)]!;
    const favorDelta = Math.round(15 * profile.favorGainRate);
    const bonus = outcome.bonus ?? {};

    setState(prev => {
      const newPotential = { ...prev.potentialAdvisors };
      newPotential[type] = Math.min(100, newPotential[type] + favorDelta);
      const next: GameState = {
        ...prev,
        funding: prev.funding - cost,
        energy: prev.energy - energyCost,
        actionsThisQuarter: prev.actionsThisQuarter + 1,
        potentialAdvisors: newPotential,
        sanity: Math.min(100, Math.max(0, prev.sanity + (bonus.sanity ?? 0))),
        reputation: Math.min(100, Math.max(0, prev.reputation + (bonus.reputation ?? 0))),
        progress: Math.min(100, Math.max(0, prev.progress + (bonus.progress ?? 0))),
        misconduct: Math.min(100, Math.max(0, prev.misconduct + (bonus.misconduct ?? 0))),
        logs: [
          {
            quarter: prev.quarter,
            message: `拜访了${profile.label}：${outcome.text.slice(0, 48)}${outcome.text.length > 48 ? '…' : ''}`,
            type: 'SUCCESS',
          },
          ...prev.logs,
        ],
      };
      tickExternalMomentAfterAction(prev, next);
      return next;
    });

    const effect: Record<string, number> = {
      funding: -cost,
      energy: -energyCost,
      mentorImpressionGain: favorDelta,
    };
    if (bonus.sanity) effect.sanity = bonus.sanity;
    if (bonus.reputation) effect.reputation = bonus.reputation;
    if (bonus.progress) effect.progress = bonus.progress;
    if (bonus.misconduct) effect.misconduct = bonus.misconduct;

    setCurrentEvent({
      title: `拜访 · ${profile.label}`,
      description: outcome.text,
      effect: roundEffectRecord(effect),
    });
    setIsEventModalOpen(true);
    addLog(`拜访了${profile.label}。`, 'SUCCESS');
  };


  return (
    <div className="min-h-dvh min-h-[100svh] flex flex-col bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-black selection:text-white">
      {/* Top Navigation Bar */}
      <header
        id="onb-header"
        className="shrink-0 bg-white border-b border-black/5 px-3 sm:px-6 py-3 lg:py-4 sticky top-0 z-30 backdrop-blur-md bg-white/80"
      >
        <div className="max-w-7xl mx-auto flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-between sm:items-center">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="bg-black text-white p-1.5 sm:p-2 rounded-lg shrink-0">
              <GraduationCap size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold tracking-tight truncate">
                {BZA_GAME_TITLE}{' '}
                <span className="text-[10px] sm:text-xs font-normal opacity-40">v2.3</span>
              </h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] sm:text-[10px] font-mono uppercase tracking-wider opacity-50">
                <span className="flex items-center gap-1"><Calendar size={10} className="sm:w-3 sm:h-3" /> 第 {state.year} 年 {state.season}</span>
                <span className="hidden sm:inline">•</span>
                <span>季度 {state.quarter}/16</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-6 justify-between sm:justify-end">
            <div className="flex gap-3 sm:gap-4 flex-1 sm:flex-initial justify-between sm:justify-end">
              <div className="text-right">
                <p className="text-[9px] sm:text-[10px] font-mono uppercase opacity-40">资金</p>
                <p className="text-sm sm:text-base font-bold text-emerald-600">${state.funding.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] sm:text-[10px] font-mono uppercase opacity-40">算力</p>
                <p className="text-sm sm:text-base font-bold text-blue-600">{state.gpuCredits}</p>
              </div>
              <div className="text-right border-l border-black/5 pl-3 sm:pl-4">
                <p className="text-[9px] sm:text-[10px] font-mono uppercase opacity-40">季度行动</p>
                <p className="text-sm sm:text-base font-bold text-amber-600">
                  {ACTIONS_PER_QUARTER - state.actionsThisQuarter}{' '}
                  <span className="text-[10px] opacity-30">/ {ACTIONS_PER_QUARTER}</span>
                </p>
              </div>
            </div>
            <button 
              onClick={nextQuarter}
              disabled={isLoading || isGameOver}
              className="shrink-0 bg-black text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm hover:bg-gray-800 transition-all disabled:opacity-30 flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              {isLoading ? "处理中..." : "进入下个季度"}
            </button>
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setHelpMenuOpen((v) => !v)}
                className="p-2 rounded-full border border-black/10 text-gray-500 hover:text-black hover:bg-black/5 transition-colors"
                aria-expanded={helpMenuOpen}
                aria-haspopup="menu"
                title="帮助：入学须知与界面导览"
              >
                <HelpCircle size={20} strokeWidth={2} />
              </button>
              {helpMenuOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-[29] cursor-default bg-transparent"
                    aria-label="关闭菜单"
                    onClick={() => setHelpMenuOpen(false)}
                  />
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-1 z-40 w-40 rounded-xl border border-black/10 bg-white shadow-lg py-1 text-left"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full px-3 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-black/5"
                      onClick={() => {
                        setSurvivalFromMenu(true);
                        setShowSurvivalGuide(true);
                        setHelpMenuOpen(false);
                      }}
                    >
                      入学须知
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full px-3 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-black/5"
                      onClick={() => {
                        setTutorialIndex(0);
                        setShowTutorial(true);
                        setHelpMenuOpen(false);
                      }}
                    >
                      界面导览
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主体：横屏 lg 三列；竖屏窄屏单区 + 底栏切换 */}
      <div className="flex-1 flex flex-col min-h-0 w-full max-w-7xl mx-auto lg:px-6 pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
        <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 lg:gap-8 gap-0 px-3 sm:px-4 lg:px-0 py-3 lg:py-6 w-full min-w-0">
        {/* 左：档案（状态、自我调节、导师卡片） */}
        <div
          id="onb-archive-column"
          className={`flex flex-col gap-4 sm:gap-6 lg:col-span-3 min-h-0 overflow-y-auto lg:overflow-visible scrollbar-hide ${
            layoutZone !== 'ARCHIVE' ? 'max-lg:hidden' : ''
          }`}
        >
          <p className="hidden lg:block text-[10px] font-mono uppercase opacity-40 tracking-wider px-1">档案</p>
          <div
            id="onb-stats-card"
            className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-black/5 flex flex-col gap-5"
          >
            <h2 className="text-xs font-mono uppercase opacity-40 flex items-center gap-2"><ShieldAlert size={14} /> 个人状态</h2>
            <StatBar icon={Brain} label="理智值" value={state.sanity} color="bg-indigo-500" />
            <StatBar icon={Heart} label="健康值" value={state.health} color="bg-rose-500" />
            <StatBar icon={Zap} label="精力值" value={state.energy} color="bg-amber-400" />
            <StatBar icon={ShieldAlert} label="学术不端嫌疑" value={state.misconduct} color="bg-red-600" />
            
            <div className="pt-4 border-t border-black/5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-2 rounded-xl border border-black/5">
                  <p className="text-[8px] font-mono uppercase opacity-40">发表论文</p>
                  <p className="text-sm font-bold flex items-center gap-1"><BookOpen size={12} /> {state.papersPublished}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl border border-black/5">
                  <p className="text-[8px] font-mono uppercase opacity-40">学术声望</p>
                  <p className="text-sm font-bold flex items-center gap-1"><Star size={12} className="text-yellow-500" /> {state.reputation}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-mono uppercase opacity-40">当前阶段</span>
                  <span className="text-xs font-bold px-2 py-0.5 bg-black text-white rounded-md">{state.milestone}</span>
                </div>
                <StatBar icon={BookOpen} label="阶段进度" value={state.progress} color="bg-blue-600" suffix="%" />
                <div className="mt-3 space-y-3">
                  {state.milestone === '课程学习' || state.credits < 30 ? (
                    <StatBar icon={CheckCircle2} label="修读学分" value={state.credits} max={30} color="bg-emerald-500" />
                  ) : null}
                  {state.hasAdvisor && (
                    <div className="space-y-2">
                      <StatBar icon={FileText} label="论文撰写进度" value={state.paperWritingProgress} color="bg-purple-500" suffix="%" />
                      {state.submittedPapers > 0 && (
                        <p className="text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
                          投稿审核中：{state.submittedPapers} 篇（下季度点击「进入下个季度」将公布审稿结果）
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Self-Regulation Section */}
          <div
            id="onb-self-reg"
            className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-black/5 flex flex-col gap-4"
          >
            <h2 className="text-xs font-mono uppercase opacity-40 flex items-center gap-2"><HeartHandshake size={14} /> 自我调节</h2>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={handleCampusWalk}
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all text-xs font-bold"
              >
                <span className="flex items-center gap-2"><TreePine size={14} /> 校园漫步</span>
                <span className="opacity-60">{state.walksThisQuarter}/3</span>
              </button>
              <button 
                onClick={handleSlackOff}
                className="flex items-center justify-between p-3 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all text-xs font-bold"
              >
                <span className="flex items-center gap-2"><Ghost size={14} /> 摆烂摸鱼</span>
                <span className="opacity-60">∞</span>
              </button>
              <button 
                onClick={handleOuting}
                className="flex items-center justify-between p-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all text-xs font-bold"
              >
                <span className="flex items-center gap-2"><Palmtree size={14} /> 外出游玩</span>
                <span className="opacity-60">$500</span>
              </button>
              <button 
                onClick={handleRetractPaper}
                className="flex items-center justify-between p-3 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all text-xs font-bold"
              >
                <span className="flex items-center gap-2"><FileX size={14} /> 撤稿止损</span>
                <span className="opacity-60">论文-1</span>
              </button>
            </div>
          </div>

          {state.hasAdvisor && (
            <div
              id="onb-advisor"
              className="bg-black text-white p-4 sm:p-6 rounded-3xl shadow-xl flex flex-col gap-4"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <AvatarThumb
                    spriteKey={advisorAvatarKey(state.advisorType)}
                    frameClassName="w-11 h-11 border-white/20"
                  />
                  <h2 className="text-[10px] font-mono uppercase opacity-40 leading-tight">
                    导师：{state.advisorName}
                  </h2>
                </div>
                <Users size={16} className="opacity-40 shrink-0" />
              </div>
              <p className="text-xs italic opacity-70 leading-relaxed">"{advisorMessage}"</p>
              <StatBar icon={CheckCircle2} label="好感度" value={state.advisorFavor} color="bg-emerald-400" />
            </div>
          )}
        </div>

        {/* 中：主页（子 Tab：首页 / 日常 / 科研…） */}
        <div
          className={`flex flex-col gap-4 sm:gap-6 lg:col-span-6 min-h-0 overflow-y-auto lg:overflow-visible scrollbar-hide ${
            layoutZone !== 'MAIN' ? 'max-lg:hidden' : ''
          }`}
        >
          <p className="hidden lg:block text-[10px] font-mono uppercase opacity-40 tracking-wider px-1">主页</p>
          {/* Tabs */}
          <div
            id="onb-tab-bar"
            className="flex bg-white p-1.5 rounded-2xl border border-black/5 shadow-sm overflow-x-auto scrollbar-hide shrink-0"
          >
            {[
              { id: 'HOME', label: '首页', icon: Home },
              { id: 'DAILY', label: '日常', icon: Coffee },
              { id: 'RESEARCH', label: '科研', icon: FlaskConical },
              { id: 'TEAM', label: '团队', icon: Users },
              { id: 'ASSETS', label: '资产', icon: Package },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`shrink-0 min-w-[4.5rem] sm:flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-0 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === tab.id ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-black hover:bg-black/5'
                }`}
              >
                <tab.icon size={14} className="sm:w-4 sm:h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div id="onb-main-body" className="flex-1 min-h-0 lg:min-h-[500px]">
            <AnimatePresence mode="wait">
              {activeTab === 'HOME' && (
                <motion.div 
                  id="onb-home-card"
                  key="home"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm flex flex-col gap-8"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                    <AvatarThumb spriteKey="player" frameClassName="w-24 h-24 border-2 border-black/5 shadow-inner shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl sm:text-2xl font-bold leading-snug">{studentProfile.headline}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        第 {state.year} 学年 · {state.season} · {state.milestone} · {BZA.focus}
                      </p>
                      <div className="mt-3 flex flex-col gap-1 text-[11px] text-gray-500 font-mono">
                        <span className="flex items-center gap-2 min-w-0">
                          <Mail size={12} className="shrink-0 opacity-50" />
                          <span className="truncate">{studentProfile.contactEmail}</span>
                        </span>
                        <span className="flex items-center gap-2 min-w-0">
                          <MapPin size={12} className="shrink-0 opacity-50" />
                          <span>{studentProfile.contactRoom}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <h4 className="text-xs font-mono uppercase opacity-40 border-b border-black/5 pb-2">个人简介</h4>
                    <p className="text-base sm:text-lg leading-relaxed text-gray-800">{studentProfile.intro}</p>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="rounded-2xl bg-slate-50 border border-black/5 border-l-4 border-l-blue-500 p-4">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-blue-700/90 mb-2">研究兴趣与工作</p>
                        <ul className="text-sm text-gray-700 space-y-1.5 list-disc pl-4 leading-relaxed">
                          {studentProfile.researchBullets.map((line, i) => (
                            <li key={i}>{line}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-2xl bg-slate-50 border border-black/5 border-l-4 border-l-amber-500 p-4">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-amber-800/90 mb-2">课题组与合作</p>
                        <ul className="text-sm text-gray-700 space-y-1.5 list-disc pl-4 leading-relaxed">
                          {studentProfile.labDiaryBullets.map((line, i) => (
                            <li key={i}>{line}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-black/[0.03] border border-black/5 p-4">
                      <p className="text-[10px] font-mono uppercase opacity-40 mb-2">主要成就</p>
                      <p className="text-sm text-gray-800 leading-relaxed">{studentProfile.achievements}</p>
                    </div>

                    <div className="relative py-4 px-2">
                      <span className="pointer-events-none select-none text-5xl sm:text-6xl text-black/[0.07] font-serif leading-none absolute left-0 top-1">
                        &ldquo;
                      </span>
                      <p className="text-center text-sm sm:text-base italic text-gray-600 leading-relaxed px-6 sm:px-10">
                        {studentProfile.quote}
                      </p>
                      <span className="pointer-events-none select-none text-5xl sm:text-6xl text-black/[0.07] font-serif leading-none absolute right-0 bottom-0">
                        &rdquo;
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-black/5 p-4 rounded-2xl text-center">
                      <p className="text-[10px] font-mono uppercase opacity-40">已发表</p>
                      <p className="text-2xl font-bold">{state.papersPublished}</p>
                    </div>
                    <div className="bg-black/5 p-4 rounded-2xl text-center">
                      <p className="text-[10px] font-mono uppercase opacity-40">引用量</p>
                      <p className="text-2xl font-bold">{state.citations}</p>
                    </div>
                    <div className="bg-black/5 p-4 rounded-2xl text-center">
                      <p className="text-[10px] font-mono uppercase opacity-40">学分</p>
                      <p className="text-2xl font-bold">{state.credits}/30</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {(activeTab === 'DAILY' || activeTab === 'RESEARCH' || activeTab === 'TEAM' || activeTab === 'ASSETS') && (
                <motion.div 
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 gap-4"
                >
                  {activeTab === 'TEAM' && !state.hasAdvisor ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(Object.keys(ADVISOR_PROFILES) as AdvisorType[]).map(type => {
                        const profile = ADVISOR_PROFILES[type];
                        const favor = state.potentialAdvisors[type];
                        const canJoin = favor >= 100;
                        return (
                          <div key={type} className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex flex-col gap-4">
                            <div className="flex justify-between items-start gap-3">
                              <div className="min-w-0">
                                <h4 className="font-bold text-lg">{profile.label}</h4>
                                <p className="text-xs text-gray-500 mt-1">{profile.description}</p>
                              </div>
                              <AvatarThumb
                                spriteKey={advisorAvatarKey(type)}
                                frameClassName="w-14 h-14"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-[10px] font-mono uppercase opacity-40">准入要求</p>
                              <div className="flex flex-wrap gap-2">
                                {profile.requirements.reputation && (
                                  <span className={`text-[10px] px-2 py-0.5 rounded ${state.reputation >= profile.requirements.reputation ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    声望 ≥ {profile.requirements.reputation}
                                  </span>
                                )}
                                {profile.requirements.credits && (
                                  <span className={`text-[10px] px-2 py-0.5 rounded ${state.credits >= profile.requirements.credits ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    学分 ≥ {profile.requirements.credits}
                                  </span>
                                )}
                                {profile.requirements.papers && (
                                  <span className={`text-[10px] px-2 py-0.5 rounded ${state.papersPublished >= profile.requirements.papers ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    论文 ≥ {profile.requirements.papers}
                                  </span>
                                )}
                              </div>
                            </div>

                            <StatBar icon={HeartHandshake} label="意向好感度" value={favor} color="bg-amber-400" />

                            <div className="flex gap-2 mt-2">
                              <button 
                                onClick={() => visitPotentialAdvisor(type)}
                                className="flex-1 py-2 bg-black/5 hover:bg-black/10 text-black rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                              >
                                <Coffee size={14} /> 拜访求教 ($200)
                              </button>
                              <button 
                                onClick={() => selectAdvisor(type)}
                                disabled={!canJoin}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${canJoin ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                              >
                                申请加入
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <>
                      {activeTab === 'TEAM' && (
                        <div className="flex flex-col gap-4 mb-4">
                          {state.hasAdvisor && (
                            <>
                              <p className="text-[10px] font-mono uppercase opacity-40 tracking-wider">导师</p>
                              <div className="w-full bg-white p-5 rounded-2xl border border-indigo-200/80 shadow-md ring-1 ring-indigo-100">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-2">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
                                    <AvatarThumb
                                      spriteKey={advisorAvatarKey(state.advisorType)}
                                      frameClassName="w-14 h-14 border-indigo-200"
                                    />
                                    <div className="flex flex-col gap-1 min-w-0">
                                    <span className="text-base font-bold text-indigo-700 flex items-center gap-2">
                                      <GraduationCap size={18} className="shrink-0" /> {state.advisorName}（导师）
                                    </span>
                                    <span className="text-[10px] opacity-50">你的学术引路人 · 每季度可互动 1 次，消耗 1 次行动与少量精力</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleInteraction('advisor', true)}
                                    disabled={state.interactionsThisQuarter.includes('advisor') || state.actionsThisQuarter >= ACTIONS_PER_QUARTER}
                                    className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                      state.interactionsThisQuarter.includes('advisor')
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                                    }`}
                                  >
                                    {state.interactionsThisQuarter.includes('advisor') ? '本季已互动' : '随机互动'}
                                  </button>
                                </div>
                                <p className="text-[10px] text-gray-500 mb-3 leading-relaxed">
                                  每次互动会进入一小段日常科研剧情（例如汇报、讨论、吃饭、申请资源等），也可能牵动你的状态与资源。
                                </p>
                                <StatBar icon={HeartHandshake} label="导师好感度" value={state.advisorFavor} color="bg-indigo-400" />
                              </div>
                              <div className="border-t border-black/10 pt-4">
                                <p className="text-[10px] font-mono uppercase opacity-40 tracking-wider mb-3">同门师兄弟</p>
                              </div>
                            </>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {state.labMates.map(mate => {
                              const title = mate.year > state.year ? (mate.role.includes('姐') || mate.role.includes('妹') ? '师姐' : '师兄') : 
                                            mate.year < state.year ? (mate.role.includes('姐') || mate.role.includes('妹') ? '师妹' : '师弟') : '同级';
                              return (
                                <div key={mate.id} className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
                                  <div className="flex justify-between items-start mb-2 gap-2">
                                    <div className="flex items-start gap-3 min-w-0">
                                      <AvatarThumb spriteKey={labAvatarKey(mate.role)} frameClassName="w-11 h-11" />
                                      <div className="flex flex-col min-w-0">
                                      <span className="text-sm font-bold">{mate.name}（{title}）</span>
                                      <span className="text-[10px] opacity-50">博士 {mate.year} 年级 · 每季度每人可互动 1 次</span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleInteraction(mate.id, false)}
                                      disabled={state.interactionsThisQuarter.includes(mate.id) || state.actionsThisQuarter >= ACTIONS_PER_QUARTER}
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                        state.interactionsThisQuarter.includes(mate.id) 
                                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                                      }`}
                                    >
                                      {state.interactionsThisQuarter.includes(mate.id) ? '本季已互动' : '随机互动'}
                                    </button>
                                  </div>
                                  <div className="mb-2">
                                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">{mate.status}</span>
                                  </div>
                                  <StatBar icon={HeartHandshake} label="好感度" value={mate.favor} color="bg-emerald-400" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {activeTab === 'ASSETS' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {state.assets.length === 0 ? (
                            <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed border-black/10 flex flex-col items-center justify-center text-center">
                              <Package size={48} className="opacity-10 mb-4" />
                              <p className="text-gray-400">
                                你目前没有任何资产。每季度初「神秘商人」可能登门推销限定好物，留意弹窗即可。
                              </p>
                            </div>
                          ) : (
                            state.assets.map(asset => (
                              <div key={asset.id} className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex flex-col gap-4">
                                <div className="flex gap-4 items-start">
                                  <div className="w-24 h-24 shrink-0 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 border border-black/5 overflow-hidden flex items-center justify-center">
                                    <AssetThumb assetId={asset.id} />
                                  </div>
                                  <div className="flex-1 min-w-0 flex justify-between items-start gap-2">
                                    <div>
                                      <h4 className="font-bold text-lg">{asset.name}</h4>
                                      <p className="text-xs text-gray-500 mt-1">{asset.description}</p>
                                    </div>
                                    <span className="text-[10px] px-2 py-1 bg-black text-white rounded-full uppercase font-mono shrink-0">{asset.type}</span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center mt-auto pt-4 border-t border-black/5">
                                  <span className="text-sm font-bold text-emerald-600">回收价: ${asset.sellPrice}</span>
                                  <button 
                                    onClick={() => sellAsset(asset)}
                                    className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all"
                                  >
                                    出售
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                      {ACTIONS.filter(a => a.category === activeTab).map(action => (
                        <button
                          key={action.id}
                          onClick={() => handleAction(action)}
                          disabled={isGameOver}
                          className="group bg-white p-5 rounded-2xl border border-black/5 shadow-sm hover:border-black hover:shadow-md transition-all text-left flex justify-between items-center"
                        >
                          <div className="flex-1">
                            <h4 className="font-bold text-lg">{action.label}</h4>
                            <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-2">
                              {action.energyCost > 0 && <span className="text-[10px] font-mono bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md flex items-center gap-1"><Zap size={10} /> {action.energyCost}</span>}
                              {action.gpuCost > 0 && <span className="text-[10px] font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md flex items-center gap-1"><Cpu size={10} /> {action.gpuCost}</span>}
                            </div>
                            <div className="flex gap-2">
                              {action.progressGain > 0 && <span className="text-[10px] font-mono bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">进度 +{action.progressGain}%</span>}
                              {action.creditGain && <span className="text-[10px] font-mono bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md">学分 +{action.creditGain}</span>}
                            </div>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

        {/* 右：动态（学术日志 + 朋友圈） */}
        <div
          className={`flex flex-col gap-4 sm:gap-6 lg:col-span-3 min-h-0 overflow-y-auto lg:overflow-visible scrollbar-hide ${
            layoutZone !== 'FEED' ? 'max-lg:hidden' : ''
          }`}
        >
          <p className="hidden lg:flex items-center gap-2 text-[10px] font-mono uppercase opacity-40 tracking-wider px-1">
            动态
            {hasUnreadMoments && (
              <span className="inline-flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white shrink-0" title="朋友圈有新动态" />
            )}
          </p>
          <div className="flex bg-white p-1 rounded-xl border border-black/5 shadow-sm shrink-0">
            <button 
              onClick={() => setRightTab('LOGS')}
              className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${rightTab === 'LOGS' ? 'bg-black text-white' : 'text-gray-400'}`}
            >
              学术日志
            </button>
            <button 
              type="button"
              onClick={() => setRightTab('MOMENTS')}
              className={`relative flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${rightTab === 'MOMENTS' ? 'bg-black text-white' : 'text-gray-400'}`}
            >
              朋友圈
              {hasUnreadMoments && (
                <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white pointer-events-none" aria-hidden />
              )}
            </button>
          </div>

          <section
            id="onb-feed-panel"
            className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-black/5 flex flex-col gap-4 flex-1 min-h-[min(480px,65dvh)] lg:flex-none lg:h-[600px] lg:min-h-0"
          >
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 pr-2 scrollbar-hide">
              <AnimatePresence mode="wait">
                {rightTab === 'LOGS' ? (
                  <motion.div 
                    key="logs-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-3"
                  >
                    {state.logs.map((log, i) => (
                      <motion.div
                        key={`${log.quarter}-${i}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-3 rounded-xl text-[11px] border-l-4 ${
                          log.type === 'DANGER' ? 'bg-rose-50 border-rose-500 text-rose-700' :
                          log.type === 'WARNING' ? 'bg-amber-50 border-amber-500 text-amber-700' :
                          log.type === 'SUCCESS' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' :
                          'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        <div className="flex justify-between mb-1 opacity-50 font-mono">
                          <span>第 {log.quarter} 季度</span>
                        </div>
                        {log.message}
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="moments-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-4"
                  >
                    {state.moments.length === 0 && (
                      <div className="text-center py-10 opacity-30 flex flex-col items-center gap-2">
                        <Share2 size={32} />
                        <p className="text-xs">还没有朋友圈动态</p>
                      </div>
                    )}
                    {state.moments.map((moment) => (
                      <motion.div
                        key={moment.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-50 p-4 rounded-2xl border border-black/5"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold ${moment.author === '我' ? 'bg-black' : 'bg-indigo-500'}`}>
                            {moment.author[0]}
                          </div>
                          <span className="text-[10px] font-bold">{moment.author}</span>
                          <span className="text-[10px] opacity-30 ml-auto">{moment.timestamp}</span>
                        </div>
                        <p className="text-xs leading-relaxed mb-3">{moment.content}</p>
                        
                        {moment.comments && moment.comments.length > 0 && (
                          <div className="mb-3 space-y-2 bg-black/5 p-2 rounded-xl">
                            {moment.comments.map((comment, idx) => (
                              <div key={idx} className="text-[10px] leading-tight">
                                <span className="font-bold text-blue-600">{comment.author}: </span>
                                <span className="text-gray-600">{comment.content}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-3 border-t border-black/5 pt-2">
                          <button 
                            onClick={() => interactWithMoment(moment.id)}
                            disabled={moment.hasInteracted}
                            className={`flex items-center gap-1 text-[10px] transition-all ${moment.hasInteracted ? 'text-rose-500 font-bold' : 'text-gray-400 hover:text-black'}`}
                          >
                            <ThumbsUp size={12} className={moment.hasInteracted ? 'fill-current' : ''} /> {moment.likes}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
        </main>
      </div>

      {/* 竖屏 / 窄屏底栏：档案 | 主页 | 动态 */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-black/10 bg-white/95 backdrop-blur-md pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] shadow-[0_-6px_24px_rgba(0,0,0,0.06)]"
        aria-label="主分区切换"
      >
        <div className="max-w-lg mx-auto flex">
          {(
            [
              { zone: 'ARCHIVE' as const, label: '档案', Icon: Archive },
              { zone: 'MAIN' as const, label: '主页', Icon: Home },
              { zone: 'FEED' as const, label: '动态', Icon: MessageSquare },
            ] as const
          ).map(({ zone, label, Icon }) => (
            <button
              key={zone}
              type="button"
              onClick={() => setLayoutZone(zone)}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-t-lg transition-colors ${
                layoutZone === zone ? 'text-black bg-black/5' : 'text-gray-400 active:bg-black/5'
              }`}
            >
              <span className="relative inline-flex">
                <Icon size={20} strokeWidth={layoutZone === zone ? 2.25 : 2} />
                {zone === 'FEED' && hasUnreadMoments && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" aria-hidden />
                )}
              </span>
              <span className="text-[10px] font-bold">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Modals (Event, Game Over) - Same as before but with updated text */}
      <AnimatePresence>
        {isEventModalOpen && currentEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-[40px] max-w-md w-full shadow-2xl border border-black/10 flex flex-col gap-6"
            >
              <div className="flex items-center gap-3 text-amber-500">
                <AlertCircle size={32} />
                <h2 className="text-2xl font-bold tracking-tight italic font-serif">{currentEvent.title}</h2>
              </div>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{currentEvent.description}</p>
              
              {currentEvent.effect && Object.keys(currentEvent.effect).length > 0 && (
                <div className="bg-black/5 p-4 rounded-2xl flex flex-col gap-2">
                  <p className="text-[10px] font-mono uppercase opacity-40 mb-1">影响</p>
                  {Object.entries(currentEvent.effect).map(([key, val]: [string, any]) => (
                    <div key={key} className="flex justify-between text-xs font-mono">
                      <span>{effectStatLabel(key)}</span>
                      <span className={val > 0 ? 'text-emerald-600' : val < 0 ? 'text-rose-600' : 'text-gray-400'}>
                        {Number(val) > 0 ? '+' : ''}
                        {formatEffectDisplayValue(Number(val))}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={() => setIsEventModalOpen(false)}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-colors"
              >
                继续
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isQuarterChoiceOpen && state.pendingQuarterChoice && (
          <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-[40px] max-w-md w-full shadow-2xl border border-indigo-200/90 flex flex-col gap-5 max-h-[90dvh] overflow-y-auto"
            >
              <div className="flex items-start gap-3 text-indigo-600">
                <ShieldAlert size={28} className="shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h2 className="text-xl font-bold tracking-tight text-black">{state.pendingQuarterChoice.title}</h2>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{state.pendingQuarterChoice.description}</p>
              <p className="text-[10px] text-gray-400 font-mono">三选一，请权衡收益与代价。</p>
              <div className="flex flex-col gap-3">
                {state.pendingQuarterChoice.options.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => applyQuarterChoice(state.pendingQuarterChoice!.title, opt)}
                    className="text-left p-4 rounded-2xl border border-black/10 bg-gray-50 hover:bg-indigo-50/80 hover:border-indigo-200 transition-colors"
                  >
                    <p className="font-bold text-sm text-black">{opt.label}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{opt.hint}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSummaryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-[40px] max-w-md w-full shadow-2xl border border-black/10 flex flex-col gap-6"
            >
              <div className="flex items-center gap-3 text-black">
                <Calendar size={32} />
                <h2 className="text-2xl font-bold tracking-tight italic font-serif">季度总结</h2>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600 leading-relaxed">
                  第 {state.year} 年 {state.season} 开始了。
                </p>
                {summaryMainTaskHtml ? (
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-indigo-700/85 mb-2">
                      培养主线
                    </p>
                    <p
                      className="text-sm text-gray-800 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: summaryMainTaskHtml }}
                    />
                  </div>
                ) : null}
                {state.quarterLabNotice && (
                  <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl flex flex-col gap-3">
                    <p className="text-[10px] font-mono uppercase opacity-50 text-amber-900">
                      {state.quarterLabNotice.title}
                    </p>
                    <p className="text-sm text-amber-950/90 whitespace-pre-wrap leading-relaxed">
                      {state.quarterLabNotice.description}
                    </p>
                    {Object.keys(state.quarterLabNotice.effect).length > 0 && (
                      <div className="border-t border-amber-200/60 pt-2 flex flex-col gap-1.5">
                        <p className="text-[10px] font-mono uppercase opacity-40 text-amber-900">人事相关数值变动</p>
                        {Object.entries(state.quarterLabNotice.effect).map(([key, val]) => {
                          const n = Number(val);
                          return (
                          <div key={key} className="flex justify-between text-xs font-mono">
                            <span>{effectStatLabel(key)}</span>
                            <span
                              className={
                                n > 0 ? 'text-emerald-600' : n < 0 ? 'text-rose-600' : 'text-gray-400'
                              }
                            >
                              {n > 0 ? '+' : ''}
                              {formatEffectDisplayValue(n)}
                            </span>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {paperReviewDetail && (
                  <div className="bg-violet-50 border border-violet-200/80 p-4 rounded-2xl flex flex-col gap-2">
                    <p className="text-[10px] font-mono uppercase opacity-50 text-violet-800">论文投稿审核（上季度）</p>
                    <p className="text-sm font-bold text-violet-950">
                      投稿 {paperReviewDetail.submitted} 篇 · 录用 {paperReviewDetail.accepted} · 拒稿 {paperReviewDetail.rejected}
                    </p>
                    <ul className="text-xs text-violet-900/90 space-y-1 list-disc pl-4">
                      {paperReviewDetail.lines.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="bg-black/5 p-4 rounded-2xl flex flex-col gap-3">
                  <p className="text-[10px] font-mono uppercase opacity-40">本季度资源变动</p>
                  <div className="flex justify-between text-xs font-mono">
                    <span>季度补助</span>
                    <span className="text-emerald-600">+$3,000</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span>基础算力</span>
                    <span className="text-blue-600">+500</span>
                  </div>
                  {state.assets.map(asset => (
                    <React.Fragment key={asset.id}>
                      {asset.effect.gpuGainPerQuarter && (
                        <div className="flex justify-between text-xs font-mono">
                          <span>{asset.name}额外算力</span>
                          <span className="text-blue-600">+{asset.effect.gpuGainPerQuarter}</span>
                        </div>
                      )}
                      {asset.effect.fundingGainPerQuarter && (
                        <div className="flex justify-between text-xs font-mono">
                          <span>{asset.name}额外资金</span>
                          <span className="text-emerald-600">+${asset.effect.fundingGainPerQuarter}</span>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                  <div className="border-t border-black/5 pt-2 flex justify-between text-xs font-mono font-bold">
                    <span>精力恢复</span>
                    <span className="text-amber-600">重置为 100</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  setIsSummaryModalOpen(false);
                  setPaperReviewDetail(null);
                  setState(s => ({ ...s, quarterLabNotice: undefined }));
                }}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-colors"
              >
                开始新季度
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGameOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white p-12 rounded-[50px] max-w-lg w-full shadow-2xl text-center flex flex-col gap-8"
            >
              {state.milestone === '顺利毕业' && state.graduationHonor ? (
                (() => {
                  const ge = graduationEnding(
                    state.graduationHonor,
                    state.papersPublished,
                    state.reputation
                  );
                  return (
                    <>
                      <div className={`flex justify-center ${ge.accent}`}>
                        <Trophy size={80} />
                      </div>
                      <h2 className="text-4xl font-bold italic font-serif">{ge.title}</h2>
                      <p className="text-gray-600 leading-relaxed">{ge.body}</p>
                      <p className="text-xs font-mono text-black/40">{BZA.short} · 博士学位 · 已授予</p>
                    </>
                  );
                })()
              ) : state.milestone === '顺利毕业' ? (
                <>
                  <div className="flex justify-center text-emerald-500">
                    <Trophy size={80} />
                  </div>
                  <h2 className="text-4xl font-bold italic font-serif">顺利毕业！</h2>
                  <p className="text-gray-600">
                    你拿到了博士学位，完成了在{BZA.short}这一段主攻 AI 的培养旅程。头发少了一些，但你是带着学院「{BZA.triad}」烙印出门的专家了。
                  </p>
                </>
              ) : (
                (() => {
                  const fe = failureGameOverCopy(state.milestone);
                  return (
                    <>
                      <div className="flex justify-center text-rose-500">
                        <Skull size={80} />
                      </div>
                      <h2 className="text-4xl font-bold italic font-serif">{fe.title}</h2>
                      <p className="text-gray-600 leading-relaxed">{fe.body}</p>
                    </>
                  );
                })()
              )}

              <div className="grid grid-cols-2 gap-4 text-left bg-black/5 p-6 rounded-3xl">
                <div>
                  <p className="text-[10px] font-mono uppercase opacity-40">历经季度</p>
                  <p className="text-2xl font-bold">{state.quarter}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase opacity-40">发表论文</p>
                  <p className="text-2xl font-bold">{state.papersPublished}</p>
                </div>
              </div>

              <button 
                onClick={() => window.location.reload()}
                className="w-full py-5 bg-black text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-colors"
              >
                重新开始
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isWarningModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 rounded-3xl max-w-md w-full shadow-2xl flex flex-col gap-6"
            >
              <div className="flex items-center gap-4 text-rose-600">
                <ShieldAlert size={32} />
                <h3 className="text-xl font-bold">高风险警告</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">{warningMessage}</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setIsWarningModalOpen(false);
                    setPendingAction(null);
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={() => {
                    setIsWarningModalOpen(false);
                    if (pendingAction) {
                      if (pendingAction.type === 'ACTION') handleAction(pendingAction.data, true);
                      if (pendingAction.type === 'WALK') handleCampusWalk(true);
                      if (pendingAction.type === 'SLACK') handleSlackOff(true);
                      if (pendingAction.type === 'OUTING') handleOuting(true);
                      if (pendingAction.type === 'RETRACT') handleRetractPaper(true);
                    }
                    setPendingAction(null);
                  }}
                  className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors"
                >
                  确定冒险
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isAssetOfferModalOpen && state.pendingAssetOffer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[40px] overflow-hidden shadow-2xl border border-black/5"
            >
              <div className="p-8 flex flex-col items-center text-center gap-6">
                <AvatarThumb
                  spriteKey="merchant"
                  frameClassName="w-20 h-20 border-amber-200/80 shadow-md"
                  className="ring-2 ring-amber-100"
                />
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-amber-700/70 mb-1">神秘商人</p>
                  <h2 className="text-2xl font-bold tracking-tight">
                    「{state.assetVendorTitle ?? '路过的推销者'}」
                  </h2>
                  <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                    “嘿，同学！我看你骨骼惊奇，这件宝贝肯定适合你……”
                  </p>
                </div>
                
                <div className="w-full bg-gray-50 p-6 rounded-3xl border border-black/5 text-left">
                  <div className="flex justify-between items-start mb-2 gap-3">
                    <div className="w-16 h-16 shrink-0 rounded-2xl overflow-hidden border border-black/10 bg-white flex items-center justify-center">
                      <AssetThumb assetId={state.pendingAssetOffer.id} />
                    </div>
                    <div className="flex-1 min-w-0 flex justify-between items-start gap-2">
                    <h3 className="font-bold text-lg">{state.pendingAssetOffer.name}</h3>
                    <span className="text-[10px] px-2 py-1 bg-black text-white rounded-full uppercase font-mono shrink-0">{state.pendingAssetOffer.type}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{state.pendingAssetOffer.description}</p>
                  <div className="flex justify-between items-center pt-4 border-t border-black/5">
                    <span className="text-sm font-mono opacity-50">售价</span>
                    <span className="text-xl font-bold text-emerald-600">${state.pendingAssetOffer.price}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs font-mono opacity-50">当前余额</span>
                    <span className={`text-sm font-bold ${state.funding < state.pendingAssetOffer.price ? 'text-rose-500' : 'text-gray-700'}`}>
                      ${state.funding.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <button 
                    onClick={() => {
                      const who = state.assetVendorTitle ?? '神秘商人';
                      setIsAssetOfferModalOpen(false);
                      setState(prev => ({
                        ...prev,
                        pendingAssetOffer: undefined,
                        assetVendorTitle: undefined,
                      }));
                      addLog(`你拒绝了「${who}」的推销。对方嘀咕着消失在楼道里。`, "INFO");
                    }}
                    className="py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-bold transition-all"
                  >
                    不需要
                  </button>
                  <button 
                    onClick={() => buyAsset(state.pendingAssetOffer!)}
                    disabled={state.funding < state.pendingAssetOffer.price}
                    className={`py-4 rounded-2xl font-bold shadow-lg transition-all ${
                      state.funding < state.pendingAssetOffer.price 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-black hover:bg-gray-800 text-white shadow-black/10'
                    }`}
                  >
                    {state.funding < state.pendingAssetOffer.price ? '资金不足' : '立即购买'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SurvivalGuideModal
        open={showSurvivalGuide}
        onClose={closeSurvivalOnly}
        onUnderstood={acknowledgeSurvival}
        showTourPrompt={survivalFromMenu}
        onStartTourFromModal={startTourFromModal}
      />
      <TutorialOverlay
        open={showTutorial}
        steps={tutorialSteps}
        stepIndex={tutorialIndex}
        onNext={handleTutorialNext}
        onPrev={handleTutorialPrev}
        onSkip={finishTour}
        onClose={() => setShowTutorial(false)}
      />
    </div>
  );
}
