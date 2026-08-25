import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Home, X, RotateCcw, Users, LogOut, Loader2 } from 'lucide-react';
import { GameState, Player, ThemeMode } from '../../types/game';
import { sounds } from '../../utils/sound';
import { useLanguage } from '../../constants/language';

interface GameEndModalProps {
  gameState: GameState;
  winner: Player | null;
  finalScores: Record<string, number>;
  theme: ThemeMode;
  currentUserId?: string;
  isHost: boolean;
  onRestartGame: () => void;
  onReturnToWaitingRoom: () => void;
  onReturnToLobby: () => void;
}

export const GameEndModal: React.FC<GameEndModalProps> = ({
  gameState,
  winner,
  finalScores,
  theme,
  currentUserId,
  isHost,
  onRestartGame,
  onReturnToWaitingRoom,
  onReturnToLobby,
}) => {
  const isDefault = theme === 'default';
  const { t, language } = useLanguage();
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fade-in">
          <div
            className={`relative w-full max-w-sm sm:max-w-md p-6 shadow-2xl text-center flex flex-col items-center gap-4 transition-all ${
              isDefault
                ? 'plush-cushion text-[#2D323E]'
                : 'rain-glass-card glass-shine text-[#1E3A8A]'
            }`}
          >
            {/* Top right close button */}
            <button
              onClick={() => setShowResultPopup(false)}
              className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isDefault
                  ? 'plush-debossed hover:opacity-80 text-[#2D323E]'
                  : 'glass-capsule hover:bg-white/40 text-[#1E3A8A]'
              }`}
              aria-label={language === 'ko' ? '닫기' : 'Close'}
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>

            {isIWin ? (
              <div className="flex flex-col items-center gap-3 w-full">
                <span
                  className={`text-xs font-black px-4 py-1.5 rounded-full shadow-sm tracking-wider ${
                    isDefault ? 'plush-rose-badge' : 'glass-capsule text-amber-700 bg-amber-100/90'
                  }`}
                >
                  🎉 VICTORY 🎉
                </span>
                <h3 className={`text-2xl font-black tracking-tight ${isDefault ? 'embroidered-text' : ''}`}>
                  {language === 'ko' ? '축하합니다! 승리하셨습니다!' : 'Congratulations! You won!'}
                </h3>
                <div
                  className={`w-full max-h-[260px] flex items-center justify-center overflow-hidden rounded-2xl p-3 ${
                    isDefault ? 'plush-debossed' : 'glass-debossed bg-white/30'
                  }`}
                >
                  <img
                    src="/win.png"
                    alt={language === 'ko' ? '승리' : 'Victory'}
                    className="max-h-[230px] w-auto object-contain rounded-xl drop-shadow-md transform hover:scale-105 transition-transform"
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
                <span
                  className={`text-xs font-black px-4 py-1.5 rounded-full shadow-sm tracking-wider ${
                    isDefault
                      ? 'plush-pill text-[#3B4050]'
                      : 'glass-capsule text-slate-700 bg-slate-100/90'
                  }`}
                >
                  GAME OVER
                </span>
                <h3 className={`text-2xl font-black tracking-tight text-rose-500 ${isDefault ? 'embroidered-text' : ''}`}>
                  {language === 'ko' ? '아쉽네요! 분발하세요! 🐱' : 'Good game! Better luck next time! 🐱'}
                </h3>
                <div
                  className={`w-full max-h-[260px] flex items-center justify-center overflow-hidden rounded-2xl p-3 ${
                    isDefault ? 'plush-debossed' : 'glass-debossed bg-white/30'
                  }`}
                >
                  <img
                    src="/lose.png"
                    alt={language === 'ko' ? '패배' : 'Defeat'}
                    className="max-h-[230px] w-auto object-contain rounded-xl drop-shadow-md transform hover:scale-105 transition-transform"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.dataset.triedPublic) {
                        target.dataset.triedPublic = 'true';
                        target.src = '/public/lose.png';
                      }
                    }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => setShowResultPopup(false)}
              className={`w-full py-3.5 rounded-2xl font-black text-sm text-white shadow-md transition-all active:scale-95 mt-1 ${
                isDefault ? 'plush-purple-btn' : 'glass-gel-btn'
              }`}
            >
              {language === 'ko' ? '상세 점수 보기' : 'View final scores'}
            </button>
          </div>
        </div>
      )}

      {/* Main Game End Score Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
        <div
          className={`w-full max-w-md p-6 sm:p-7 shadow-2xl text-center flex flex-col gap-5 transition-all ${
            isDefault
              ? 'plush-cushion text-[#2D323E]'
              : 'rain-glass-card glass-shine text-[#1E3A8A]'
          }`}
        >
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg shrink-0 ${
              isDefault ? 'plush-orb-btn bg-amber-400/20 text-amber-600' : 'glass-capsule text-amber-500 bg-amber-100/80'
            }`}
          >
            <Trophy className="w-9 h-9 stroke-[2.2]" />
          </div>

          <div>
            <span
              className={`text-xs font-black px-3.5 py-1 rounded-full shadow-sm mb-2 inline-block ${
                isDefault ? 'plush-rose-badge' : 'glass-capsule text-amber-800 bg-amber-200/80'
              }`}
            >
              FINAL SCORE
            </span>
            <h3 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDefault ? 'embroidered-text' : ''}`}>
              🎉 {winner?.nickname || (language === 'ko' ? '승리자' : 'Winner')} {language === 'ko' ? '승리!' : 'wins!'}
            </h3>
            <p className="text-xs sm:text-sm mt-1.5 font-bold opacity-80">
              {winner
                ? language === 'ko' ? `${winner.nickname} 님이 손의 모든 타일을 제출하여 대결에서 승리했습니다!` : `${winner.nickname} played all their tiles and won the match!`
                : language === 'ko' ? '게임이 종료되었습니다.' : 'The game has ended.'}
            </p>
          </div>

          {/* Scores Table */}
          <div
            className={`p-4 rounded-2xl text-left flex flex-col gap-2.5 transition-all ${
              isDefault ? 'plush-debossed' : 'glass-debossed bg-white/40'
            }`}
          >
            <h4 className="text-xs font-black border-b pb-2 border-black/10 opacity-75 flex items-center justify-between">
              <span>{language === 'ko' ? '최종 점수 현황' : 'Final scores'}</span>
              <span className="text-[10px] font-bold">({language === 'ko' ? '남은 타일 벌점 계산' : 'penalties from remaining tiles'})</span>
            </h4>

            {gameState.players.map((p) => {
              const score = finalScores[p.id] ?? 0;
              const isWinner = p.id === winner?.id;

              return (
                <div key={p.id} className="flex items-center justify-between text-xs sm:text-sm font-black">
                  <span className="flex items-center gap-1.5">
                    <span className="text-base">{isWinner ? '👑' : '🐾'}</span>
                    <span className={isWinner ? 'text-amber-700 font-extrabold' : ''}>
                      {p.isBot ? `🤖 ${p.nickname}` : `${p.nickname} ${p.id === currentUserId ? `(${language === 'ko' ? '나' : 'you'})` : ''}`}
                    </span>
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                    score > 0
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : score === 0
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-rose-100 text-rose-700 border border-rose-300'
                  }`}>
                    {score > 0 ? `+${score}` : score}{language === 'ko' ? ' 점' : ''}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 mt-1">
            {/* Rematch Button */}
            {isHost ? (
              <button
                onClick={onRestartGame}
                className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 text-white shadow-lg transition-all active:scale-95 ${
                  isDefault ? 'plush-purple-btn' : 'glass-gel-btn'
                }`}
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5]" /> {t('playAgain')}
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500/10 text-amber-800 text-xs font-bold">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                <span>{t('waitingForHostRestart')}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* Return to Waiting Room */}
              {isHost && (
                <button
                  onClick={onReturnToWaitingRoom}
                  className={`flex-1 py-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                    isDefault
                      ? 'plush-debossed hover:opacity-90 text-[#2D323E]'
                      : 'glass-capsule hover:bg-white/40 text-[#1E3A8A]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 stroke-[2.2]" /> {t('backToWaitingRoom')}
                </button>
              )}

              {/* Leave Room to Main Lobby */}
              <button
                onClick={onReturnToLobby}
                className={`flex-1 py-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                  isDefault
                    ? 'plush-rose-btn'
                    : 'glass-capsule text-[#222222]'
                }`}
              >
                <LogOut className="w-3.5 h-3.5 stroke-[2.2]" /> {t('leaveToLobby')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
