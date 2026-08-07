import React from 'react';
import { Sun, Moon, BookOpen, BarChart3, UserCheck } from 'lucide-react';
import { ThemeMode } from '../types/game';

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  nickname: string;
  onChangeNickname: () => void;
  onOpenRules: () => void;
  onOpenDashboard: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  nickname,
  onChangeNickname,
  onOpenRules,
  onOpenDashboard,
}) => {
  const isDefault = theme === 'default';

  return (
    <header className="w-full px-4 py-4 sm:px-8 sticky top-0 z-40">
      <div
        className={`max-w-7xl mx-auto flex items-center justify-between gap-2 p-3 px-5 transition-all`}
      >
        {/* Logo / Brand Title */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
          <h1 className={`font-bold text-base sm:text-lg tracking-tight leading-tight hidden sm:block ${isDefault ? 'text-[#2D323E]' : 'text-[#222222]'}`}>
            냥루미큐브 온라인
          </h1>
        </div>

        {/* User Controls & Navigation Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Current Nickname */}
          <button
            onClick={onChangeNickname}
            className={`flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold transition-all rounded-full ${
              isDefault
                ? 'plush-pill text-[#3B4050] hover:opacity-90'
                : 'glass-capsule text-[#222222] hover:bg-white/80'
            }`}
            title="닉네임 변경"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#5A6072]" />
            <span className="max-w-[70px] sm:max-w-[130px] truncate">{nickname || '닉네임 입력'}</span>
          </button>

          {/* Rules Modal Button */}
          <button
            onClick={onOpenRules}
            className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all ${
              isDefault
                ? 'plush-orb-btn'
                : 'glass-orb-btn'
            }`}
            title="게임 룰 설명"
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
            title="전적 대시보드"
          >
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className={`flex items-center gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-black transition-all ${
              isDefault
                ? 'plush-purple-btn hover:scale-105 text-white'
                : 'glass-gel-btn text-white'
            }`}
            title={isDefault ? '플러피 모드로 전환' : '라이트 모드로 전환'}
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
