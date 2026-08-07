import React, { useState, useEffect } from 'react';
import { Player, ThemeMode } from '../../types/game';
import { Clock, Layers, Crown } from 'lucide-react';

interface PlayerStatusProps {
  players: Player[];
  currentTurnIndex: number;
  turnStartTime: number;
  turnTimeLimit: number; // in seconds
  tilePoolCount: number;
  theme: ThemeMode;
  currentUserId: string;
}

const CAT_AVATARS = [
  '/avatars/profile1.webp',
  '/avatars/profile2.webp',
  '/avatars/profile3.webp',
  '/avatars/profile4.webp',
];

export const PlayerStatus: React.FC<PlayerStatusProps> = ({
  players,
  currentTurnIndex,
  turnStartTime,
  turnTimeLimit,
  tilePoolCount,
  theme,
  currentUserId,
}) => {
  const isDefault = theme === 'default';

  const [timeLeft, setTimeLeft] = useState<number>(turnTimeLimit);

  useEffect(() => {
    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - turnStartTime) / 1000);
      const remaining = Math.max(0, turnTimeLimit - elapsed);
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [turnStartTime, turnTimeLimit]);

  const progressPercent = Math.min(100, Math.max(0, (timeLeft / turnTimeLimit) * 100));

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Top Bar: Timer & Tile Pool */}
      <div
        className={`p-3.5 flex items-center justify-between gap-4 transition-all ${
          isDefault
            ? 'plush-cushion !rounded-[22px] text-[#111111]'
            : 'rain-glass-card glass-shine !rounded-[22px] text-[#1E3A8A]'
        }`}
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#D9A63B]" />
          <span className="text-xs font-black">
            남은 타일 더미: <strong className="text-sm font-black">{tilePoolCount}</strong> 개
          </span>
        </div>

        {/* Turn Timer */}
        <div className="flex items-center gap-3 flex-1 max-w-xs">
          <Clock className={`w-4 h-4 ${timeLeft <= 10 ? 'text-red-500 animate-spin' : ''}`} />
          <div className="flex-1">
            <div className="flex justify-between text-[11px] font-black mb-1">
              <span>남은 시간</span>
              <span className={timeLeft <= 10 ? 'text-red-600 font-black' : ''}>
                {timeLeft}초
              </span>
            </div>
            <div className="w-full h-2.5 bg-black/10 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  timeLeft <= 10 ? 'bg-red-500' : isDefault ? 'bg-[#356C63]' : 'bg-[#3B82F6]'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Players Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {players.map((p, idx) => {
          const isTurn = idx === currentTurnIndex;
          const isSelf = p.id === currentUserId;

          return (
            <div
              key={p.id}
              className={`p-2.5 flex items-center justify-between transition-all ${
                isTurn
                  ? isDefault
                    ? 'bg-[#356C63] text-white rounded-2xl shadow-lg ring-2 ring-[#D9A63B]'
                    : 'glass-gel-btn text-white rounded-2xl ring-2 ring-[#FFFFFF]'
                  : isDefault
                  ? 'plush-tile'
                  : 'glass-capsule text-[#1E3A8A]'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <div
                  className="w-7 h-7 rounded-full shrink-0 overflow-hidden relative shadow-sm flex items-center justify-center bg-gray-200"
                  style={{
                    border: p.isHost ? '2px solid orange' : 'none',
                  }}
                >
                  <img
                    src={CAT_AVATARS[idx % CAT_AVATARS.length]}
                    alt={p.nickname}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div className="truncate">
                  <span className="font-black text-xs block truncate leading-tight">
                    {p.nickname} {isSelf && '(나)'}
                  </span>
                  <span className="text-[10px] font-bold opacity-80 block">
                    {p.hasMelded ? '등록완료 (30+)' : '미등록'}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-black text-sm block leading-none">
                  {p.hand.length}장
                </span>
                <span className="text-[9px] font-bold opacity-75">손타일</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
