import React from 'react';
import { ThemeMode } from '../types/game';
import { useLanguage } from '../constants/language';

interface KickedModalProps {
  theme: ThemeMode;
  message: string;
  onClose: () => void;
}

export const KickedModal: React.FC<KickedModalProps> = ({ theme, message, onClose }) => {
  const { language } = useLanguage();
  const isDefault = theme === 'default';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-xs p-5 text-center shadow-2xl flex flex-col items-center gap-2 ${isDefault ? 'plush-cushion text-[#2D323E]' : 'rain-glass-card glass-shine text-[#1E3A8A]'}`}>
        <span className="text-3xl block animate-bounce">🚫</span>
        <h4 className="font-extrabold text-base text-red-500">{language === 'ko' ? '방 퇴장 알림' : 'Removed from room'}</h4>
        <p className="text-xs font-bold opacity-80 mb-2">{message}</p>
        <button onClick={onClose} className={`w-full py-2.5 rounded-xl font-black text-xs text-white shadow-md transition-all active:scale-95 ${isDefault ? 'plush-rose-btn' : 'glass-gel-btn'}`}>
          {language === 'ko' ? '확인' : 'OK'}
        </button>
      </div>
    </div>
  );
};
