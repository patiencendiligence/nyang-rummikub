import React, { FormEvent, useState } from 'react';
import { ThemeMode } from '../types/game';
import { useLanguage } from '../constants/language';

interface NicknameModalProps {
  theme: ThemeMode;
  nickname: string;
  onClose: () => void;
  onSave: (nickname: string) => boolean;
}

export const NicknameModal: React.FC<NicknameModalProps> = ({ theme, nickname, onClose, onSave }) => {
  const { language } = useLanguage();
  const [input, setInput] = useState(nickname);
  const isDefault = theme === 'default';

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (onSave(input)) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-xs p-5 shadow-2xl flex flex-col gap-3 transition-all ${isDefault ? 'plush-cushion text-[#2D323E]' : 'rain-glass-card glass-shine text-[#1E3A8A]'}`}>
        <div className="flex items-center justify-between pb-1 border-b border-black/10">
          <h3 className={`font-black text-base tracking-tight ${isDefault ? 'embroidered-text' : ''}`}>
            {language === 'ko' ? '닉네임 설정' : 'Nickname settings'}
          </h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-black/10 transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 mt-1">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={12}
            placeholder={language === 'ko' ? '닉네임 입력 (최대 12자)' : 'Enter nickname (up to 12 characters)'}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all outline-none ${isDefault ? 'plush-debossed text-[#2D323E] placeholder-[#5A6072]/60' : 'glass-debossed text-[#1E3A8A] placeholder-[#1E3A8A]/50'}`}
          />
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${isDefault ? 'plush-debossed text-[#2D323E]' : 'glass-capsule text-[#1E3A8A]'}`}>
              {language === 'ko' ? '취소' : 'Cancel'}
            </button>
            <button type="submit" className={`flex-1 py-2.5 rounded-xl text-xs font-black text-white shadow-md transition-all active:scale-95 ${isDefault ? 'plush-purple-btn' : 'glass-gel-btn'}`}>
              {language === 'ko' ? '저장' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
