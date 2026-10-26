import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Heart,
  Sparkles,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface LocalComment {
  id: string;
  nickname: string;
  emoji: string;
  content: string;
  timestamp: string;
  likes: number;
}

const DEFAULT_COMMENTS: LocalComment[] = [
  {
    id: 'default-1',
    nickname: '댕댕이러버',
    emoji: '🐶',
    content: '친구들이 맨날 강아지상이라 했는데 AI 분석에서도 멍뭉미 91% 나왔어요 ㅋㅋㅋ 완전 신기하고 정확하네요!',
    timestamp: '방금 전',
    likes: 14,
  },
  {
    id: 'default-2',
    nickname: '시크냥이',
    emoji: '🐱',
    content: '평소에 눈매 올라갔다는 말 자주 듣는데 고양이상 84% 나왔네요 ㅎㅎ 제니 사진 넣었더니 고양이상 98% 나옴 대박!',
    timestamp: '20분 전',
    likes: 9,
  },
  {
    id: 'default-3',
    nickname: '민트초코',
    emoji: '🐾',
    content: '카메라로 셀카 바로 찍어서 테스트하니까 1초 만에 바로 나와서 꿀잼이에요! 친구들 단톡방에 바로 공유했습니다~',
    timestamp: '1시간 전',
    likes: 21,
  },
];

const EMOJI_OPTIONS = ['🐶', '🐱', '🐾', '✨', '💖', '🔥'];

interface DisqusCommentsProps {
  url?: string;
  identifier?: string;
  title?: string;
}

export const DisqusComments: React.FC<DisqusCommentsProps> = ({
  url,
  identifier = 'animal-face-test-main',
  title = '인공지능 동물상 테스트 | 강아지상 vs 고양이상',
}) => {
  // Tab: 'board' (Immediate typing) vs 'disqus' (Original Disqus widget)
  const [activeTab, setActiveTab] = useState<'board' | 'disqus'>('board');

  // Local comments state
  const [comments, setComments] = useState<LocalComment[]>(() => {
    const saved = localStorage.getItem('animal_face_comments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return DEFAULT_COMMENTS;
  });

  const [likedMap, setLikedMap] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('animal_face_comments_liked');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return {};
  });

  // Form states
  const [nickname, setNickname] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🐶');
  const [content, setContent] = useState('');
  const [showSuccessBadge, setShowSuccessBadge] = useState(false);

  // Save comments to localStorage
  useEffect(() => {
    localStorage.setItem('animal_face_comments', JSON.stringify(comments));
  }, [comments]);

  useEffect(() => {
    localStorage.setItem('animal_face_comments_liked', JSON.stringify(likedMap));
  }, [likedMap]);

  // Disqus Embed Script Loader
  useEffect(() => {
    if (activeTab !== 'disqus') return;

    const pageUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

    const win = window as unknown as {
      DISQUS?: {
        reset: (params: {
          reload: boolean;
          config?: (this: { page: { url: string; identifier: string; title: string } }) => void;
        }) => void;
      };
      disqus_config?: (this: { page: { url: string; identifier: string; title: string } }) => void;
    };

    win.disqus_config = function (this: { page: { url: string; identifier: string; title: string } }) {
      this.page.url = pageUrl;
      this.page.identifier = identifier;
      this.page.title = title;
    };

    if (win.DISQUS) {
      win.DISQUS.reset({
        reload: true,
        config: function (this: { page: { url: string; identifier: string; title: string } }) {
          this.page.url = pageUrl;
          this.page.identifier = identifier;
          this.page.title = title;
        },
      });
    } else {
      const script = document.createElement('script');
      script.src = 'https://sanghwa.disqus.com/embed.js';
      script.setAttribute('data-timestamp', String(+new Date()));
      script.async = true;
      (document.head || document.body).appendChild(script);
    }
  }, [activeTab, url, identifier, title]);

  // Handle Comment Submission
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const finalNickname = nickname.trim() || '행운의 참가자';
    const now = new Date();
    const timeStr = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const newComment: LocalComment = {
      id: `comment-${Date.now()}`,
      nickname: finalNickname,
      emoji: selectedEmoji,
      content: content.trim(),
      timestamp: timeStr,
      likes: 0,
    };

    setComments((prev) => [newComment, ...prev]);
    setContent('');
    soundManager.playMilestone();

    setShowSuccessBadge(true);
    setTimeout(() => setShowSuccessBadge(false), 2500);
  };

  // Toggle Like on comment
  const handleToggleLike = (commentId: string) => {
    soundManager.playClick();
    const isCurrentlyLiked = !!likedMap[commentId];

    setLikedMap((prev) => ({
      ...prev,
      [commentId]: !isCurrentlyLiked,
    }));

    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            likes: isCurrentlyLiked ? Math.max(0, c.likes - 1) : c.likes + 1,
          };
        }
        return c;
      })
    );
  };

  // Delete comment
  const handleDeleteComment = (commentId: string) => {
    soundManager.playClick();
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return (
    <div
      id="comments_section"
      className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 transition-colors"
    >
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              댓글 & 결과 나눔 공간
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              로그인 없이 즉시 자신의 동물상 결과나 감상평을 남겨보세요!
            </p>
          </div>
        </div>

        {/* Tab Controls: Live Board vs Disqus */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => {
              setActiveTab('board');
              soundManager.playClick();
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'board'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            🐾 실시간 후기 게시판 ({comments.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('disqus');
              soundManager.playClick();
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'disqus'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            💬 Disqus 위젯
          </button>
        </div>
      </div>

      {/* Tab 1: Live Interactive Comment Board */}
      {activeTab === 'board' && (
        <div className="flex flex-col gap-6">
          {/* Write Comment Form */}
          <form
            onSubmit={handleSubmitComment}
            className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col gap-3.5 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Nickname Input */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">닉네임</span>
                <input
                  type="text"
                  maxLength={15}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="예: 댕댕이상 (미입력시 자동)"
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44"
                />
              </div>

              {/* Emoji Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
                  동물 이모지:
                </span>
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setSelectedEmoji(emoji);
                      soundManager.playClick();
                    }}
                    className={`w-7 h-7 text-sm rounded-lg flex items-center justify-center transition-transform cursor-pointer ${
                      selectedEmoji === emoji
                        ? 'bg-white dark:bg-slate-700 shadow-xs ring-2 ring-indigo-500 scale-110'
                        : 'hover:bg-slate-200 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Textarea */}
            <div className="relative">
              <textarea
                required
                rows={3}
                maxLength={300}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="당신의 동물상 테스트 결과나 감상평을 자유롭게 남겨보세요! (예: 멍뭉미 85% 나왔습니다 ㅎㅎ)"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-colors"
              />
              <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-400 font-mono">
                {content.length}/300
              </span>
            </div>

            {/* Submit Bar */}
            <div className="flex items-center justify-between pt-1">
              {showSuccessBadge ? (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  댓글이 등록되었습니다!
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  욕설 및 비방 글은 사전 안내 없이 삭제될 수 있습니다.
                </span>
              )}

              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>댓글 등록</span>
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-3">
            {comments.map((c) => {
              const isLiked = !!likedMap[c.id];

              return (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                >
                  {/* Author Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base select-none">{c.emoji}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {c.nickname}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                        {c.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Like button */}
                      <button
                        onClick={() => handleToggleLike(c.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                          isLiked
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-200 dark:border-rose-900'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                          }`}
                        />
                        <span className="font-mono">{c.likes}</span>
                      </button>

                      {/* Delete button (if user created) */}
                      {c.id.startsWith('comment-') && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          title="삭제"
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Comment Body */}
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-6 whitespace-pre-wrap">
                    {c.content}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Official Disqus Embedded View */}
      {activeTab === 'disqus' && (
        <div>
          <div className="mb-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Disqus 위젯 사용 안내</p>
              <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                Disqus 댓글창은 제3자 쿠키 허용 및 Disqus 계정 로그인이 필요합니다. 브라우저에서 쿠키나 팝업이 차단된 경우 상단의 <b>[🐾 실시간 후기 게시판]</b> 탭을 이용하시면 로그인 없이 즉시 후기를 등록하실 수 있습니다.
              </p>
            </div>
          </div>

          <div id="disqus_thread" className="min-h-[220px]" />

          <noscript>
            Please enable JavaScript to view the{' '}
            <a href="https://disqus.com/?ref_noscript" className="text-indigo-600 underline">
              comments powered by Disqus.
            </a>
          </noscript>
        </div>
      )}
    </div>
  );
};
