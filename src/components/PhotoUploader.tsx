import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, ShieldCheck, Sparkles, Image as ImageIcon, X, RefreshCw } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface PhotoUploaderProps {
  onImageSelected: (imageSrc: string) => void;
  isLoading: boolean;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  onImageSelected,
  isLoading,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일(JPG, PNG 등)을 선택해 주세요.');
      return;
    }
    soundManager.playClick();
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onImageSelected(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Camera handling
  const startCamera = async () => {
    soundManager.playClick();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch {
      alert('카메라 권한을 얻을 수 없습니다. 파일 업로드 기능을 이용해 주세요.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    soundManager.playClick();
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontal for natural mirror selfie
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    stopCamera();
    onImageSelected(dataUrl);
  };

  // Generate instant test sample photos using HTML5 Canvas
  const loadSample = (type: 'dog' | 'cat') => {
    soundManager.playClick();
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Gradient Background
    const grad = ctx.createLinearGradient(0, 0, 400, 400);
    if (type === 'dog') {
      grad.addColorStop(0, '#fef3c7');
      grad.addColorStop(1, '#fde68a');
    } else {
      grad.addColorStop(0, '#e0e7ff');
      grad.addColorStop(1, '#c7d2fe');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 400);

    // Cute character avatar
    ctx.font = '160px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type === 'dog' ? '🐶' : '🐱', 200, 180);

    // Label on sample
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = type === 'dog' ? '#92400e' : '#3730a3';
    ctx.fillText(type === 'dog' ? '멍뭉미 대표 샘플' : '시크냥 대표 샘플', 200, 310);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('인공지능 즉시 테스트용', 200, 345);

    onImageSelected(canvas.toDataURL('image/png'));
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Live Camera View Mode */}
      {isCameraActive ? (
        <div className="w-full bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col items-center relative overflow-hidden animate-in zoom-in-95">
          <button
            onClick={stopCamera}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-800/80 text-white flex items-center justify-center hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative w-full aspect-square max-w-sm rounded-2xl overflow-hidden bg-black mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            {/* Guide Face Frame */}
            <div className="absolute inset-8 rounded-full border-2 border-dashed border-white/40 pointer-events-none flex items-center justify-center">
              <span className="text-[11px] text-white/70 bg-black/40 px-2 py-0.5 rounded-full">
                얼굴을 중앙에 맞춰주세요
              </span>
            </div>
          </div>

          <button
            onClick={capturePhoto}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold rounded-2xl text-sm flex items-center gap-2 shadow-lg cursor-pointer transition-all"
          >
            <Camera className="w-5 h-5" />
            <span>사진 촬영하기</span>
          </button>
        </div>
      ) : (
        /* Drag & Drop Upload Zone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`w-full bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all flex flex-col items-center shadow-sm cursor-pointer ${
            isDragging
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          {/* Icon Circle */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-amber-400 p-0.5 mb-5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center text-4xl">
              <span>🐶 🐱</span>
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 mb-2">
            얼굴 사진을 올리거나 촬영하세요
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
            컴퓨터나 스마트폰의 사진을 끌어다 놓거나 클릭하여 선택할 수 있습니다.
          </p>

          {/* Action Buttons Inside Zone */}
          <div
            className="flex items-center gap-2.5 flex-wrap justify-center mb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Upload className="w-4 h-4" />
              <span>사진 파일 선택</span>
            </button>

            <button
              onClick={startCamera}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>실시간 카메라 촬영</span>
            </button>
          </div>

          {/* Privacy Trust Banner */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>사진은 서버에 저장되지 않고 오직 브라우저 내부에서만 안전하게 분석됩니다.</span>
          </div>
        </div>
      )}

      {/* Quick Test Samples */}
      <div className="w-full mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            사진이 없으신가요? 1초 샘플로 바로 테스트:
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadSample('dog')}
            className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 text-amber-900 dark:text-amber-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>🐶 강아지상 샘플</span>
          </button>

          <button
            onClick={() => loadSample('cat')}
            className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 text-indigo-900 dark:text-indigo-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>🐱 고양이상 샘플</span>
          </button>
        </div>
      </div>
    </div>
  );
};
