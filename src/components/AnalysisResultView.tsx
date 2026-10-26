import React, { useEffect } from 'react';
import {
  RotateCcw,
  Share2,
  Sparkles,
  Heart,
  Check,
  Award,
  Users,
  Compass,
  MessageSquare,
} from 'lucide-react';
import { AnimalPredictionResult, ANIMAL_PROFILES } from '../utils/teachableMachine';
import { soundManager } from '../utils/audio';
import { fireConfetti } from '../utils/confetti';

interface AnalysisResultViewProps {
  imageSrc: string;
  result: AnimalPredictionResult;
  onRetry: () => void;
  onShare: () => void;
  isCopied: boolean;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({
  imageSrc,
  result,
  onRetry,
  onShare,
  isCopied,
}) => {
  const profile = ANIMAL_PROFILES[result.dominantAnimal];
  const isDog = result.dominantAnimal === 'dog';

  // Fire celebratory fanfare & confetti on mount
  useEffect(() => {
    soundManager.playFanfare();
    fireConfetti();
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center animate-in zoom-in-95 duration-300">
      {/* Top Main Result Card */}
      <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 sm:p-8 flex flex-col items-center text-center transition-colors">
        {/* Dominant Animal Tag & Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              isDog
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                : 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700'
            }`}
          >
            {profile.badge}
          </span>
        </div>

        {/* User Photo with Animal Glow Ring */}
        <div className="relative mb-5 group">
          <div
            className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full p-1.5 shadow-xl transition-transform group-hover:scale-105 duration-300 ${
              isDog
                ? 'bg-gradient-to-tr from-amber-400 to-amber-200 ring-4 ring-amber-400/30'
                : 'bg-gradient-to-tr from-indigo-500 to-purple-400 ring-4 ring-indigo-500/30'
            }`}
          >
            <img
              src={imageSrc}
              alt="분석 대상 사진"
              className="w-full h-full rounded-full object-cover bg-slate-100 dark:bg-slate-800"
            />
          </div>

          {/* Floating Emoji Badge */}
          <div className="absolute -bottom-1 -right-1 w-12 h-12 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-2xl select-none animate-bounce">
            {profile.emoji}
          </div>
        </div>

        {/* Title & Tagline */}
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-2">
          {profile.title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
          {profile.tagline}
        </p>

        {/* Likeness Percentage Comparison Gauge */}
        <div className="w-full max-w-lg bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 mb-6 transition-colors">
          <div className="flex items-center justify-between text-xs font-black mb-2">
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <span>🐶 강아지상</span>
              <span className="font-mono text-base">{result.dogPercent}%</span>
            </span>

            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <span className="font-mono text-base">{result.catPercent}%</span>
              <span>고양이상 🐱</span>
            </span>
          </div>

          {/* Dual Progress Bar */}
          <div className="w-full h-3.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700 ease-out"
              style={{ width: `${result.dogPercent}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-700 ease-out"
              style={{ width: `${result.catPercent}%` }}
            />
          </div>
        </div>

        {/* Detailed Personality Card */}
        <div className="w-full text-left bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 mb-6">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>성향 & 특징 분석</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {profile.description}
            </p>
          </div>

          {/* 4 Bullet Traits */}
          <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            {profile.traits.map((trait, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{trait}</span>
              </div>
            ))}
          </div>

          {/* Celebrities & Chemistry Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                대표 닮은꼴 연예인
              </span>
              <p className="text-slate-500 dark:text-slate-400 leading-tight">
                {profile.celebrityExamples.join(', ')} 등
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                찰떡궁합 동물상
              </span>
              <p className="text-slate-500 dark:text-slate-400 leading-tight">
                {profile.matchChemistry}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onRetry}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>다른 사진으로 다시하기</span>
          </button>

          <button
            onClick={onShare}
            className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-500/20"
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>결과 복사 완료!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>결과 공유하기</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              document.getElementById('comments_section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-amber-500" />
            <span>댓글에 자랑하기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
