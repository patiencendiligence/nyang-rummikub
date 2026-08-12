import React from 'react';
import { Sun, Moon, BookOpen, BarChart3, UserCheck } from 'lucide-react';
import { ThemeMode } from '../types/game';
import { Language, useLanguage } from '../constants/language';

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  language: Language;
  onChangeLanguage: (language: Language) => void;
  nickname: string;
  onChangeNickname: () => void;
  onOpenRules: () => void;
  onOpenDashboard: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  language,
  onChangeLanguage,
  nickname,
  onChangeNickname,
  onOpenRules,
  onOpenDashboard,
}) => {
  const isDefault = theme === 'default';
  const { t } = useLanguage();

  return (
    <header className="w-full px-3 py-3 sm:px-8 sticky top-0 z-40">
      <div
        className={`max-w-7xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 px-4 sm:px-5 transition-all`}
      >
        {/* Logo / Brand Title */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <div
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-sm shrink-0`}
          >
            <img
              src="/joker_cat.png"
              alt="Joker Cat"
              className="w-full h-full object-cover transform scale-110 rounded-full"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <h1 className={`font-bold text-sm sm:text-lg tracking-tight leading-tight ${isDefault ? 'text-[#2D323E]' : 'text-[#222222]'}`}>
            {t('brand')}
          </h1>
        </div>

        {/* User Controls & Navigation Actions */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Current Nickname */}
          <button
            onClick={onChangeNickname}
            className={`flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold transition-all rounded-full ${
              isDefault
                ? 'plush-pill text-[#3B4050] hover:opacity-90'
                : 'glass-capsule text-[#222222] hover:bg-white/80'
            }`}
            title={t('nicknameChange')}
          >
            <UserCheck className="w-3.5 h-3.5 text-[#5A6072]" />
            <span className="max-w-[70px] sm:max-w-[130px] truncate">{nickname || t('nicknamePlaceholder')}</span>
          </button>

          {/* Rules Modal Button */}
          <button
            onClick={onOpenRules}
            className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all ${
              isDefault
                ? 'plush-orb-btn'
                : 'glass-orb-btn'
            }`}
            title={t('rules')}
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Dashboard Stats Button */}
          <button
            onClick={onOpenDashboard}
            className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all ${
              isDefault
                ? 'plush-orb-btn'
                : 'glass-orb-btn'
            }`}
            title={t('dashboard')}
          >
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <div className={`flex items-center p-0.5 rounded-full ${isDefault ? 'plush-pill' : 'glass-capsule'}`}>
            {(['ko', 'en'] as Language[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChangeLanguage(option)}
                aria-pressed={language === option}
                className={`px-1.5 sm:px-2 py-1 rounded-full text-[10px] font-black transition-all ${
                  language === option ? (isDefault ? 'plush-purple-btn text-white' : 'glass-gel-btn text-white') : 'opacity-60'
                }`}
              >
                {option.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className={`flex items-center gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-black transition-all ${
              isDefault
                ? 'plush-purple-btn hover:scale-105 text-white'
                : 'glass-gel-btn text-white'
            }`}
            title={isDefault ? t('themeToDark') : t('themeToLight')}
          >
            {isDefault ? (
              <>
                <Moon className="w-3.5 h-3.5 text-purple-100" />
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-200" />
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
