import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bookmark,
  Trophy,
  Filter,
  Layers,
  BarChart3,
  Share2,
  RefreshCw,
  Info,
  Check,
} from 'lucide-react';
import { LottoBall } from './LottoBall';
import { LiveDrawMachine } from './LiveDrawMachine';
import { FiveGameTicket } from './FiveGameTicket';
import { NumberCustomizer } from './NumberCustomizer';
import { SimulationModal } from './SimulationModal';
import { SavedNumbersModal } from './SavedNumbersModal';
import {
  GenerationOptions,
  LottoGame,
  generateFiveGames,
  generateSingleLotto,
  calculateLottoStats,
} from '../utils/lotto';
import { soundManager } from '../utils/audio';

type ActiveViewTab = 'machine' | 'ticket' | 'custom' | 'stats';

interface LottoViewProps {
  onOpenPartnership: () => void;
}

export const LottoView: React.FC<LottoViewProps> = ({ onOpenPartnership }) => {
  const [activeTab, setActiveTab] = useState<ActiveViewTab>('machine');
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  // Filter & Generation options
  const [options, setOptions] = useState<GenerationOptions>(() => {
    const saved = localStorage.getItem('lotto_options');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return {
      mode: 'balanced',
      includeNumbers: [],
      excludeNumbers: [],
    };
  });

  // Current single live draw
  const [currentDraw, setCurrentDraw] = useState<{ numbers: number[]; bonus: number } | null>(() => {
    const saved = localStorage.getItem('lotto_last_draw');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return null;
  });

  // 5 Games Ticket
  const [fiveGames, setFiveGames] = useState<LottoGame[]>(() => {
    const saved = localStorage.getItem('lotto_five_games');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return generateFiveGames({
      mode: 'balanced',
      includeNumbers: [],
      excludeNumbers: [],
    });
  });

  // Saved Games in Storage
  const [savedGames, setSavedGames] = useState<LottoGame[]>(() => {
    const saved = localStorage.getItem('lotto_saved_games');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('lotto_options', JSON.stringify(options));
  }, [options]);

  useEffect(() => {
    if (currentDraw) {
      localStorage.setItem('lotto_last_draw', JSON.stringify(currentDraw));
    }
  }, [currentDraw]);

  useEffect(() => {
    localStorage.setItem('lotto_five_games', JSON.stringify(fiveGames));
  }, [fiveGames]);

  useEffect(() => {
    localStorage.setItem('lotto_saved_games', JSON.stringify(savedGames));
  }, [savedGames]);

  const handleRegenerateAllFiveGames = () => {
    soundManager.playFanfare();
    const newGames = generateFiveGames(options);
    setFiveGames(newGames);
  };

  const handleRerollSingleGame = (gameId: string) => {
    soundManager.playBallPop(2);
    setFiveGames((prev) =>
      prev.map((g) => {
        if (g.id === gameId) {
          const { numbers, bonus } = generateSingleLotto(options);
          return {
            ...g,
            numbers,
            bonus,
          };
        }
        return g;
      })
    );
  };

  const handleToggleSaveGame = (game: LottoGame) => {
    const exists = savedGames.some((g) => g.id === game.id);
    if (exists) {
      setSavedGames((prev) => prev.filter((g) => g.id !== game.id));
      soundManager.playClick();
    } else {
      setSavedGames((prev) => [game, ...prev]);
      soundManager.playMilestone();
    }
  };

  const isGameSaved = (gameId: string) => savedGames.some((g) => g.id === gameId);

  const referenceNumbers = currentDraw ? currentDraw.numbers : fiveGames[0]?.numbers || [1, 2, 3, 4, 5, 6];
  const stats = calculateLottoStats(referenceNumbers);

  const handleShare = () => {
    const shareText = currentDraw
      ? `[로또 6/45 추천 번호]\n당첨번호: ${currentDraw.numbers.join(', ')} + 보너스: ${currentDraw.bonus}`
      : `[로또 6/45 추천 5게임]\n${fiveGames.map((g) => `${g.label}: ${g.numbers.join(', ')}`).join('\n')}`;

    if (navigator.share) {
      navigator.share({
        title: '로또 6/45 행운의 번호 추첨기',
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      setShareToast(true);
      soundManager.playClick();
      setTimeout(() => setShareToast(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Toast Notification */}
      {shareToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>추천 번호가 클립보드에 복사되었습니다!</span>
        </div>
      )}

      {/* Intro Subtitle & Official Color Legend */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>동행복권 6/45 규격</span>
            <span aria-hidden="true">·</span>
            <span>1등 확률 1/8,145,060</span>
            <span aria-hidden="true">·</span>
            <span>황금 밸런스 통계 알고리즘</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            로또 6/45 행운의 번호 추첨기
          </h1>
        </div>

        {/* Color Legend (Official) */}
        <div className="flex items-center gap-1.5 flex-wrap self-start md:self-auto text-[11px] font-bold">
          <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            1~10 노랑
          </span>
          <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/70 text-sky-900 dark:text-sky-300 border border-sky-300 dark:border-sky-700">
            11~20 파랑
          </span>
          <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/70 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
            21~30 빨강
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            31~40 회색
          </span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            41~45 초록
          </span>
        </div>
      </div>

      {/* Tab Controls Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('machine')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'machine'
              ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>생생 볼 추첨</span>
        </button>

        <button
          onClick={() => setActiveTab('ticket')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'ticket'
              ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span>5게임 일괄 발권</span>
        </button>

        <button
          onClick={() => setActiveTab('custom')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'custom'
              ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Filter className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
          <span>고정수·제외수 필터</span>
          {(options.includeNumbers.length > 0 || options.excludeNumbers.length > 0) && (
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'stats'
              ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span>번호 통계 분석</span>
        </button>
      </div>

      {/* Tab 1: Live Machine Draw View */}
      {activeTab === 'machine' && (
        <div className="flex flex-col items-center gap-6">
          <LiveDrawMachine
            options={options}
            savedDraw={currentDraw}
            onDrawComplete={(numbers, bonus) => {
              setCurrentDraw({ numbers, bonus });
            }}
          />

          <div className="w-full max-w-lg flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
            <span className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              현재 설정: {options.mode === 'balanced' ? '황금 밸런스 필터 적용' : '완전 무작위'}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSavedModal(true)}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                <span>보관함 ({savedGames.length})</span>
              </button>
              <span>·</span>
              <button
                onClick={() => setShowSimulationModal(true)}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>당첨 맞춰보기 →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 5-Game Ticket View */}
      {activeTab === 'ticket' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">자동 5게임 세트</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                한 번에 5개의 추천 번호 조합(A~E)을 확인하고 개별 재생성할 수 있습니다.
              </p>
            </div>

            <button
              onClick={handleRegenerateAllFiveGames}
              className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>5게임 새로 뽑기</span>
            </button>
          </div>

          <FiveGameTicket
            games={fiveGames}
            onRerollGame={handleRerollSingleGame}
            onSaveGame={handleToggleSaveGame}
            isSaved={isGameSaved}
          />
        </div>
      )}

      {/* Tab 3: Custom Inclusions/Exclusions */}
      {activeTab === 'custom' && (
        <div className="flex flex-col gap-4">
          <NumberCustomizer options={options} onChangeOptions={setOptions} />
        </div>
      )}

      {/* Tab 4: Deep Statistical Analysis */}
      {activeTab === 'stats' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col gap-6 transition-colors">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
              추첨 번호 통계 분석 리포트
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              현재 생성된 번호({referenceNumbers.join(', ')})의 세부 통계 지표입니다.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">총합계 (Sum)</span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-1">
                {stats.sum}
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">적정 구간: 100~180</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">홀수 : 짝수</span>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                {stats.oddCount} : {stats.evenCount}
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">황금 비율: 3:3 또는 2:4</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">저번호 : 고번호</span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-1">
                {stats.lowCount} : {stats.highCount}
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">기준: 22 이하 / 23 이상</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">연속 번호 쌍</span>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
                {stats.consecutivePairs}쌍
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">권장: 0~1쌍</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">분석 대상 번호</span>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {referenceNumbers.map((num) => (
                <LottoBall key={num} number={num} size="md" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Simulation Modal */}
      {showSimulationModal && (
        <SimulationModal
          currentDraw={currentDraw}
          fiveGames={fiveGames}
          onClose={() => setShowSimulationModal(false)}
        />
      )}

      {/* Saved Numbers Modal */}
      {showSavedModal && (
        <SavedNumbersModal
          savedGames={savedGames}
          onRemoveGame={(id) => setSavedGames((prev) => prev.filter((g) => g.id !== id))}
          onClearAll={() => setSavedGames([])}
          onClose={() => setShowSavedModal(false)}
        />
      )}
    </div>
  );
};
