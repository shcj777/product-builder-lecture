import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface PartnershipModalProps {
  onClose: () => void;
}

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xjyyygpy';

export const PartnershipModal: React.FC<PartnershipModalProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    inquiryType: '광고 / 마케팅 제휴',
    message: '',
    agreePrivacy: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.name.trim()) {
      setErrorMessage('성함 또는 회사명을 입력해 주세요.');
      return;
    }
    if (!formData.email.trim()) {
      setErrorMessage('이메일 주소를 입력해 주세요.');
      return;
    }
    if (!formData.message.trim()) {
      setErrorMessage('문의 내용을 작성해 주세요.');
      return;
    }
    if (!formData.agreePrivacy) {
      setErrorMessage('개인정보 수집 및 이용에 동의해 주세요.');
      return;
    }

    setIsSubmitting(true);
    soundManager.playClick();

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          이름_회사명: formData.name,
          이메일: formData.email,
          연락처: formData.phone || '미입력',
          문의유형: formData.inquiryType,
          문의내용: formData.message,
          제출일시: new Date().toLocaleString('ko-KR'),
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        soundManager.playMilestone();
      } else {
        const data = await response.json().catch(() => ({}));
        if (data.errors && Array.isArray(data.errors)) {
          setErrorMessage(data.errors.map((err: { message: string }) => err.message).join(', '));
        } else {
          setErrorMessage('전송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        }
      }
    } catch {
      setErrorMessage('네트워크 연결 오류가 발생했습니다. 인터넷 연결을 확인해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] transition-colors overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                제휴 및 비즈니스 문의
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                협업, 광고, 서비스 제안 등 어떤 문의든 환영합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        {isSuccess ? (
          <div className="py-10 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 animate-in zoom-in-75">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              문의가 성공적으로 전달되었습니다!
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
              소중한 제안 감사드립니다. 남겨주신 이메일({formData.email})로 영업일 기준 1~2일 내에 신속하게 답변드리겠습니다.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-white transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-3.5 my-3 pr-1">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Name / Company */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                성함 / 회사명 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 홍길동 / (주)파트너스"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* Email & Phone grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  이메일 주소 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@company.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  연락처 (선택)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="010-0000-0000"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Inquiry Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                문의 유형
              </label>
              <select
                value={formData.inquiryType}
                onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                <option value="광고 / 마케팅 제휴">광고 / 마케팅 제휴</option>
                <option value="비즈니스 솔루션 협업">비즈니스 솔루션 협업</option>
                <option value="서비스 제안 및 기능 건의">서비스 제안 및 기능 건의</option>
                <option value="버그 / 오류 제보">버그 / 오류 제보</option>
                <option value="기타 일반 문의">기타 일반 문의</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                문의 내용 <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="제휴 제안 내용이나 문의사항을 자유롭게 작성해 주세요."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-none"
              />
            </div>

            {/* Privacy Checkbox */}
            <div className="flex items-start gap-2 pt-1">
              <input
                id="agreePrivacy"
                type="checkbox"
                checked={formData.agreePrivacy}
                onChange={(e) => setFormData({ ...formData, agreePrivacy: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label
                htmlFor="agreePrivacy"
                className="text-[11px] text-slate-500 dark:text-slate-400 select-none cursor-pointer leading-tight"
              >
                원활한 문의 회신 및 응대를 위한 개인정보(이름, 이메일, 연락처) 수집 및 이용에 동의합니다.
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>전송 중...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>제휴 문의 보내기</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
