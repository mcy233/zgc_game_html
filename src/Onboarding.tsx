import React, { useLayoutEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import {
  SURVIVAL_GUIDE_META,
  SURVIVAL_SECTIONS,
  type TutorialStep,
} from './onboardingContent';

export const LS_SURVIVAL_KEY = 'zgc_bza_survival_ack_v1';
export const LS_TUTORIAL_KEY = 'zgc_bza_tutorial_done_v1';

type HoleRect = { top: number; left: number; width: number; height: number };

function DimWithHole({ hole }: { hole: HoleRect }) {
  const { top, left, width, height } = hole;
  return (
    <>
      <div className="absolute inset-x-0 top-0 bg-black/60" style={{ height: top }} />
      <div className="absolute left-0 bg-black/60" style={{ top, width: left, height }} />
      <div
        className="absolute bg-black/60"
        style={{ top, left: left + width, right: 0, height }}
      />
      <div
        className="absolute inset-x-0 bg-black/60"
        style={{ top: top + height, bottom: 0 }}
      />
    </>
  );
}

export function SurvivalGuideModal({
  open,
  onClose,
  onUnderstood,
  showTourPrompt,
  onStartTourFromModal,
}: {
  open: boolean;
  onClose: () => void;
  onUnderstood: () => void;
  showTourPrompt?: boolean;
  onStartTourFromModal?: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="survival-guide-title"
    >
      <div className="relative w-full max-w-lg max-h-[min(88vh,720px)] flex flex-col rounded-2xl border border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 shadow-2xl overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          aria-label="关闭"
        >
          <X size={20} />
        </button>
        <div className="shrink-0 px-6 pt-6 pb-4 border-b border-cyan-500/25">
          <h2 id="survival-guide-title" className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {SURVIVAL_GUIDE_META.title}
          </h2>
          <p className="text-sm text-cyan-300/90 mt-1 font-medium">{SURVIVAL_GUIDE_META.subtitle}</p>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 text-sm text-slate-200 scrollbar-hide">
          {SURVIVAL_SECTIONS.map((sec) => (
            <section key={sec.heading}>
              <h3 className="text-cyan-400 font-bold text-sm mb-2 pb-1 border-b border-cyan-500/35">{sec.heading}</h3>
              {sec.paragraphs?.map((p, i) => (
                <p
                  key={i}
                  className="mb-2 leading-relaxed text-slate-300"
                  dangerouslySetInnerHTML={{ __html: p }}
                />
              ))}
              {sec.bullets && (
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  {sec.bullets.map((b, i) => (
                    <li key={i} dangerouslySetInnerHTML={{ __html: b }} />
                  ))}
                </ul>
              )}
              {sec.highlight?.map((h, i) => (
                <p
                  key={i}
                  className="mt-2 text-amber-200/90 text-xs leading-relaxed border-l-2 border-amber-500/50 pl-3"
                >
                  {h}
                </p>
              ))}
            </section>
          ))}
        </div>
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          {showTourPrompt && onStartTourFromModal && (
            <button
              type="button"
              onClick={onStartTourFromModal}
              className="order-2 sm:order-1 sm:mr-auto px-4 py-2 rounded-xl text-sm font-bold text-sky-300 hover:text-white hover:bg-white/5 text-left sm:text-center"
            >
              开始界面导览
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="order-1 sm:order-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white"
          >
            稍后
          </button>
          <button
            type="button"
            onClick={onUnderstood}
            className="order-3 px-5 py-2 rounded-xl text-sm font-bold bg-sky-600 text-white hover:bg-sky-500"
          >
            我已了解
          </button>
        </div>
      </div>
    </div>
  );
}

export function TutorialOverlay({
  open,
  steps,
  stepIndex,
  onNext,
  onPrev,
  onSkip,
  onClose,
}: {
  open: boolean;
  steps: TutorialStep[];
  stepIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onClose: () => void;
}) {
  const step = steps[stepIndex];
  const [hole, setHole] = useState<HoleRect | null>(null);
  const [cardStyle, setCardStyle] = useState<React.CSSProperties>({});

  const measure = useCallback(() => {
    if (!open || !step) {
      setHole(null);
      setCardStyle({
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: 'min(92vw, 400px)',
      });
      return;
    }
    if (!step.highlightId) {
      setHole(null);
      setCardStyle({
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: 'min(92vw, 400px)',
      });
      return;
    }
    let el = document.getElementById(step.highlightId);
    if (!el && step.highlightId === 'onb-team-advisor-card') {
      el = document.getElementById('onb-main-body');
    }
    if (!el) {
      setHole(null);
      setCardStyle({
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: 'min(92vw, 400px)',
      });
      return;
    }
    const r = el.getBoundingClientRect();
    const pad = 8;
    const h: HoleRect = {
      top: r.top - pad,
      left: r.left - pad,
      width: r.width + pad * 2,
      height: r.height + pad * 2,
    };
    setHole(h);
    const approxCardH = 220;
    const spaceBelow = window.innerHeight - (h.top + h.height);
    let top = h.top + h.height + 14;
    if (spaceBelow < approxCardH && h.top > approxCardH + 32) {
      top = h.top - approxCardH - 14;
    }
    top = Math.max(12, Math.min(top, window.innerHeight - approxCardH - 12));
    let left = h.left + h.width / 2 - 200;
    const maxW = Math.min(400, window.innerWidth - 24);
    left = Math.max(12, Math.min(left, window.innerWidth - maxW - 12));
    setCardStyle({
      position: 'fixed',
      top,
      left,
      width: maxW,
      maxWidth: 'min(92vw, 400px)',
      transform: 'none',
    });
  }, [open, step]);

  useLayoutEffect(() => {
    measure();
    const raf = requestAnimationFrame(measure);
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [measure, stepIndex]);

  if (!open || !step) return null;

  const total = steps.length;
  const displayStep = stepIndex + 1;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === total - 1;

  return (
    <div className="fixed inset-0 z-[110] pointer-events-auto" role="dialog" aria-modal="true">
      <div className="absolute inset-0">
        {hole ? <DimWithHole hole={hole} /> : <div className="absolute inset-0 bg-black/60" />}
        {hole && (
          <div
            className="fixed pointer-events-none rounded-xl ring-2 ring-sky-400 ring-offset-2 ring-offset-transparent shadow-[0_0_0_1px_rgba(56,189,248,0.35)] z-[111]"
            style={{
              top: hole.top,
              left: hole.left,
              width: hole.width,
              height: hole.height,
            }}
          />
        )}
      </div>

      <div
        className="fixed z-[112] bg-slate-900 border border-slate-600/90 rounded-2xl shadow-2xl p-5 text-slate-100 pointer-events-auto"
        style={cardStyle}
      >
        <div className="flex justify-between items-start gap-2 mb-3">
          <h3 className="text-lg font-bold text-white pr-6">{step.title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 -mt-1 -mr-1"
            aria-label="关闭导览"
          >
            <X size={18} />
          </button>
        </div>
        <p
          className="text-sm text-slate-300 leading-relaxed mb-5"
          dangerouslySetInnerHTML={{ __html: step.body }}
        />
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-700">
          <span className="text-[11px] font-mono text-slate-500">
            第 {displayStep} / {total} 步
          </span>
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={onSkip}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
            >
              跳过
            </button>
            <button
              type="button"
              onClick={onPrev}
              disabled={isFirst}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none"
            >
              上一步
            </button>
            <button
              type="button"
              onClick={onNext}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-sky-600 text-white hover:bg-sky-500"
            >
              {isLast ? '完成' : '下一步'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
