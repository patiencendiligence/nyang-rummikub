import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Home, X } from 'lucide-react';
import { GameState, Player, ThemeMode } from '../../types/game';
import { sounds } from '../../utils/sound';

interface GameEndModalProps {
  gameState: GameState;
  winner: Player | null;
  finalScores: Record<string, number>;
  theme: ThemeMode;
  currentUserId?: string;
  onReturnToLobby: () => void;
}

export const GameEndModal: React.FC<GameEndModalProps> = ({
  gameState,
  winner,
  finalScores,
  theme,
  currentUserId,
  onReturnToLobby,
}) => {
  const isDefault = theme === 'default';
  const [showResultPopup, setShowResultPopup] = useState(true);

  const isIWin = Boolean(
    currentUserId &&
      (currentUserId === winner?.id || currentUserId === gameState.winnerId)
  );

  useEffect(() => {
    if (isIWin) {
      sounds.playWinSound();
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore if confetti fails
      }
    }
  }, [isIWin]);

  return (
    <>
      {/* Result Image Layer Popup */}
      {showResultPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div
            className={`relative w-full max-w-sm sm:max-w-md p-6 rounded-3xl border shadow-2xl text-center flex flex-col items-center gap-4 ${
              isDefault
                ? 'bg-[#F4F0E6] border-[#D8D0C4] text-[#111111]'
                : 'bg-[#EAF4FF] border-[#6FA8FF] text-[#1E3A8A]'
            }`}
          >
            {/* Top right close button */}
            <button
              onClick={() => setShowResultPopup(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-current transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>

            {isIWin ? (
              <div className="flex flex-col items-center gap-3 w-full">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-500 text-white shadow-sm">
                  VICTORY
                </span>
                <div className="w-full max-h-[280px] flex items-center justify-center overflow-hidden rounded-2xl bg-black/5 p-3">
                  <img
                    src="/win.png"
                    alt="승리"
                    className="max-h-[250px] w-auto object-contain rounded-xl drop-shadow-md"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.dataset.triedPublic) {
                        target.dataset.triedPublic = 'true';
                        target.src = '/public/win.png';
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 w-full">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-600 text-white shadow-sm">
                  GAME OVER
                </span>
                <div className="w-full max-h-[280px] flex items-center justify-center overflow-hidden rounded-2xl bg-black/5 p-3">
                  <img
                    src="/lose.png"
                    alt="패배"
                    className="max-h-[250px] w-auto object-contain rounded-xl drop-shadow-md"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.dataset.triedPublic) {
                        target.dataset.triedPublic = 'true';
                        target.src = '/public/lose.png';
                      }
                    }}
                  />
                </div>
                <p className="text-2xl font-black text-rose-600 tracking-tight mt-1">
                  분발하세요!
                </p>
              </div>
            )}

            <button
              onClick={() => setShowResultPopup(false)}
              className={`w-full py-3.5 rounded-2xl font-black text-sm text-white shadow-md transition-all active:scale-95 mt-2 ${
                isDefault
                  ? 'bg-[#356C63] hover:bg-[#2A5750]'
                  : 'bg-[#4E8EF2] hover:bg-[#3B72D4]'
              }`}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Main Game End Score Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
        <div
          className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl text-center flex flex-col gap-5 ${
            isDefault
              ? 'bg-[#F4F0E6] border-[#D8D0C4] text-[#111111]'
              : 'bg-[#EAF4FF] border-[#6FA8FF] text-[#1E3A8A]'
          }`}
        >
          <div className="w-16 h-16 rounded-full bg-[#D9A63B] text-white flex items-center justify-center mx-auto shadow-lg">
            <Trophy className="w-9 h-9" />
          </div>

          <div>
            <span className="text-xs font-black px-3 py-1 rounded-full bg-[#D9A63B] text-white mb-2 inline-block">
              GAME OVER
            </span>
            <h3 className="text-2xl font-black">
              🎉 {winner?.nickname || '승리자'} 승리!
            </h3>
            <p className="text-xs mt-1 opacity-80">
              손에 있는 모든 타일을 정합한 조합으로 제출하였습니다!
            </p>
          </div>

          {/* Scores Table */}
          <div
            className={`p-4 rounded-2xl border text-left flex flex-col gap-2 ${
              isDefault ? 'bg-[#EFE7D8] border-[#D8D0C4]' : 'bg-white border-[#6FA8FF]'
            }`}
          >
            <h4 className="text-xs font-extrabold border-b pb-1.5 opacity-75">
              최종 점수 현황 (남은 타일 벌점 계산)
            </h4>

            {gameState.players.map((p) => {
              const score = finalScores[p.id] ?? 0;
              const isWinner = p.id === winner?.id;

              return (
                <div key={p.id} className="flex items-center justify-between text-xs font-extrabold">
                  <span className="flex items-center gap-1.5">
                    {isWinner ? '👑' : '•'} {p.nickname}
                  </span>
                  <span className={score > 0 ? 'text-emerald-600 font-black' : 'text-red-500'}>
                    {score > 0 ? `+${score}` : score} 점
                  </span>
                </div>
              );
            })}
          </div>

          <button
            onClick={onReturnToLobby}
            className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 text-white shadow-md transition-all active:scale-95 ${
              isDefault ? 'bg-[#356C63]' : 'bg-[#4E8EF2]'
            }`}
          >
            <Home className="w-4 h-4" /> 대기실로 돌아가기
          </button>
        </div>
      </div>
    </>
  );
};
