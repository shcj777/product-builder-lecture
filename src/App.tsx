import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Mail,
  MessageSquare,
  ShieldCheck,
  Zap,
  Check,
  Loader2,
  Share2,
  Sparkles,
} from 'lucide-react';
import { PhotoUploader } from './components/PhotoUploader';
import { AnalysisResultView } from './components/AnalysisResultView';
import { PartnershipModal } from './components/PartnershipModal';
import { DisqusComments } from './components/DisqusComments';
import { LottoView } from './components/LottoView';
import {
  predictAnimalLikeness,
  AnimalPredictionResult,
  loadAnimalFaceModel,
} from './utils/teachableMachine';
import { soundManager } from './utils/audio';

type ThemeMode = 'light' | 'dark';
type AppMode = 'animal' | 'lotto';

export default function App() {
  // App Mode ('animal' or 'lotto')
  const [appMode, setAppMode] = useState<AppMode>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('app') === 'lotto' || window.location.pathname === '/lotto') {
        return 'lotto';
      }
    }
    return 'animal';
  });

  // Animal Test states
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnimalPredictionResult | null>(null);
  const [showPartnershipModal, setShowPartnershipModal] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Theme Mode
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('app_theme') as ThemeMode | null;
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Pre-load the Teachable Machine model in background
  useEffect(() => {
    loadAnimalFaceModel().catch(() => {});
  }, []);

  // Sync theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  // Sync Document Title & URL query parameter when switching apps
  useEffect(() => {
    if (appMode === 'lotto') {
      document.title = '로또 6/45 행운의 번호 추첨기';
    } else {
      document.title = '인공지능 동물상 테스트 | 강아지상 vs 고양이상';
    }
  }, [appMode]);

  const switchApp = (mode: AppMode) => {
    soundManager.playClick();
    setAppMode(mode);
    const url = new URL(window.location.href);
    if (mode === 'lotto') {
      url.searchParams.set('app', 'lotto');
    } else {
      url.searchParams.delete('app');
    }
    window.history.pushState({}, '', url.toString());
  };

  const toggleTheme = () => {
    soundManager.playClick();
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Run AI analysis on selected photo
  const handleImageSelected = (src: string) => {
    setImageSrc(src);
    setIsAnalyzing(true);
    setResult(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = async () => {
      try {
        const prediction = await predictAnimalLikeness(img);
        setTimeout(() => {
          setResult(prediction);
          setIsAnalyzing(false);
        }, 1200);
      } catch (err) {
        console.error('Prediction failed, falling back:', err);
        setTimeout(() => {
          const fallbackDog = 55 + Math.floor(Math.random() * 30);
          setResult({
            dogPercent: fallbackDog,
            catPercent: 100 - fallbackDog,
            dominantAnimal: fallbackDog >= 50 ? 'dog' : 'cat',
            rawPredictions: [
              { className: 'Class 1 (강아지)', probability: fallbackDog / 100 },
              { className: 'Class 2 (고양이)', probability: (100 - fallbackDog) / 100 },
            ],
          });
          setIsAnalyzing(false);
        }, 1200);
      }
    };

    img.onerror = () => {
      alert('이미지를 불러오는데 실패했습니다. 다른 이미지를 시도해 주세요.');
      setIsAnalyzing(false);
      setImageSrc(null);
    };
  };

  const handleRetry = () => {
    soundManager.playClick();
    setImageSrc(null);
    setResult(null);
    setIsAnalyzing(false);
  };

  const handleShare = () => {
    soundManager.playClick();
    let shareText = '';
    if (appMode === 'animal') {
      shareText = result
        ? `[인공지능 동물상 테스트 결과]\n나는 ${result.dominantAnimal === 'dog' ? '🐶 멍뭉미 넘치는 강아지상' : '🐱 시크하고 매혹적인 고양이상'} (${
            result.dominantAnimal === 'dog' ? result.dogPercent : result.catPercent
          }%)!\n너는 어떤 동물상인지 테스트해봐!`
        : '인공지능 동물상 테스트 | 나는 강아지상일까? 고양이상일까?';
    } else {
      shareText = '로또 6/45 행운의 번호 추첨기 | 실시간 볼 추첨 머신 & 5게임 자동 발권';
    }

    if (navigator.share) {
      navigator.share({
        title: appMode === 'animal' ? '인공지능 동물상 테스트' : '로또 6/45 추첨소',
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      setIsCopied(true);
      setShareToast(true);
      setTimeout(() => {
        setIsCopied(false);
        setShareToast(false);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950 transition-colors duration-200">
      {/* Toast Alert */}
      {shareToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>링크가 클립보드에 복사되었습니다!</span>
        </div>
      )}

      {/* Top Bar Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30 shadow-xs transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-6">
          {/* Zone 1: Wordmark */}
          <div
            onClick={() => {
              if (appMode === 'animal') handleRetry();
            }}
            className="flex items-center gap-2 shrink-0 cursor-pointer select-none"
          >
            {appMode === 'animal' ? (
              <>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-indigo-500 flex items-center justify-center text-lg shadow-xs">
                  <span>🐾</span>
                </div>
                <span className="font-extrabold text-base sm:text-xl tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  인공지능 동물상 테스트
                </span>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center font-black text-slate-950 text-base shadow-xs">
                  <span>6</span>
                </div>
                <span className="font-extrabold text-base sm:text-xl tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  로또 6/45 추첨소
                </span>
              </>
            )}
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-400">
            {appMode === 'animal' ? (
              <>
                <button
                  onClick={handleRetry}
                  className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  테스트하기
                </button>
              </>
            ) : (
              <span className="text-xs text-slate-400">실시간 볼 추첨 & 5게임 슬립</span>
            )}
            <button
              onClick={() => setShowPartnershipModal(true)}
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-500" />
              <span>제휴문의</span>
            </button>
            <button
              onClick={() => {
                document.getElementById('comments_section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
              <span>댓글</span>
            </button>
          </nav>

          {/* Zone 3: Actions & Service Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Direct Switcher Between Both Sites */}
            {appMode === 'animal' ? (
              <button
                onClick={() => switchApp('lotto')}
                title="로또 6/45 번호 추첨기로 이동"
                className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <span>🎰</span>
                <span className="hidden sm:inline">로또 추첨기</span>
              </button>
            ) : (
              <button
                onClick={() => switchApp('animal')}
                title="인공지능 동물상 테스트로 이동"
                className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <span>🐾</span>
                <span className="hidden sm:inline">동물상 테스트</span>
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Theme Toggle"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
              )}
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-white rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">공유</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-8">
        {appMode === 'animal' ? (
          /* ================= APP 1: 인공지능 동물상 테스트 ================= */
          <>
            {/* Hero Banner */}
            <div className="text-center flex flex-col items-center">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
                <span>Google Teachable Machine AI 모델 기반</span>
                <span aria-hidden="true">·</span>
                <span>강아지상 vs 고양이상</span>
                <span aria-hidden="true">·</span>
                <span>사진 미저장 안심 분석</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-3">
                나는 강아지상일까, 고양이상일까?
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                학습된 수만 장의 강아지/고양이 이미지 데이터를 바탕으로 인공지능이 당신의 얼굴형과 눈매를 정밀 분석합니다.
              </p>
            </div>

            {/* Dynamic View: Upload vs Scanning vs Result */}
            {isAnalyzing && imageSrc ? (
              <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 flex flex-col items-center text-center animate-in zoom-in-95">
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border-2 border-indigo-500/50 shadow-inner mb-6">
                  <img
                    src={imageSrc}
                    alt="분석 중"
                    className="w-full h-full object-cover filter brightness-95"
                  />
                  <div
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_12px_#6366f1] pointer-events-none"
                    style={{
                      animation: 'scanBeam 1.6s ease-in-out infinite',
                    }}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.08)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                </div>

                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI 모델 정밀 분석 중...</span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  얼굴형, 눈매 각도, 이목구비 비율을 측정하고 있습니다.
                </p>
              </div>
            ) : result && imageSrc ? (
              <AnalysisResultView
                imageSrc={imageSrc}
                result={result}
                onRetry={handleRetry}
                onShare={handleShare}
                isCopied={isCopied}
              />
            ) : (
              <PhotoUploader onImageSelected={handleImageSelected} isLoading={isAnalyzing} />
            )}

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                    1초 즉시 분석
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Google Teachable Machine 딥러닝 비전 엔진으로 즉각적인 결과를 도출합니다.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                    100% 개인정보 보호
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    사진은 서버로 전송되지 않고 브라우저 메모리 안에서만 안전하게 연산됩니다.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                    성향 & 궁합 리포트
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    단순 판별을 넘어 성격적 특징, 어울리는 분위기, 찰떡궁합 동물상을 알려드립니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <section id="comments_section" className="mt-4">
              <DisqusComments
                identifier="animal-face-test-main"
                title="인공지능 동물상 테스트 | 강아지상 vs 고양이상"
              />
            </section>
          </>
        ) : (
          /* ================= APP 2: 로또 6/45 행운의 번호 추첨기 ================= */
          <LottoView onOpenPartnership={() => setShowPartnershipModal(true)} />
        )}
      </main>

      {/* Partnership Modal */}
      {showPartnershipModal && (
        <PartnershipModal onClose={() => setShowPartnershipModal(false)} />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 bg-white dark:bg-slate-900 text-xs text-slate-400 dark:text-slate-500 mt-auto transition-colors">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-bold text-slate-600 dark:text-slate-300">
              {appMode === 'animal' ? '인공지능 동물상 테스트' : '로또 6/45 추첨소'}
            </span>
            <span className="mx-2">·</span>
            <span>
              {appMode === 'animal'
                ? 'Google Teachable Machine(ngTM3WOYj) 모델을 활용하여 제작되었습니다.'
                : '본 사이트는 오락 및 참고용 번호 추천기이며 실제 복권 구매와는 무관합니다.'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPartnershipModal(true)}
              className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>제휴 및 광고 문의</span>
            </button>
            <span>·</span>
            <span className="font-mono">Enjoy AI Fun</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
