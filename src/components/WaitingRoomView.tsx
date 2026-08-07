import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import { Crown, Share2, UserX, Settings, Play, LogOut, CheckCircle2 } from 'lucide-react';
import { GameState, ThemeMode } from '../types/game';

interface WaitingRoomViewProps {
  gameState: GameState;
  socket: Socket | null;
  currentUserId: string;
  theme: ThemeMode;
  onLeaveRoom: () => void;
}

const CAT_AVATARS = [
  '/avatars/profile1.webp',
  '/avatars/profile2.webp',
  '/avatars/profile3.webp',
  '/avatars/profile4.webp',
];

export const WaitingRoomView: React.FC<WaitingRoomViewProps> = ({
  gameState,
  socket,
  currentUserId,
  theme,
  onLeaveRoom,
}) => {
  const isDefault = theme === 'default';
  const isHost = gameState.hostId === currentUserId;

  const [copied, setCopied] = useState(false);
  const [kickTarget, setKickTarget] = useState<{ id: string; name: string } | null>(null);

  const shareUrl = `${window.location.origin}/?room=${gameState.roomId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateSettings = (maxPlayers?: number, turnTimeLimit?: number) => {
    if (!socket || !isHost) return;
    socket.emit('update_room_settings', {
      roomId: gameState.roomId,
      settings: {
        ...(maxPlayers && { maxPlayers }),
        ...(turnTimeLimit && { turnTimeLimit }),
      },
    });
  };

  const handleConfirmKick = () => {
    if (!socket || !kickTarget || !isHost) return;
    socket.emit('kick_player', {
      roomId: gameState.roomId,
      targetPlayerId: kickTarget.id,
    });
    setKickTarget(null);
  };

  const handleStartGame = () => {
    if (!socket || !isHost) return;
    socket.emit('start_game', { roomId: gameState.roomId });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header Banner */}
      <div
        className={`p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
          isDefault
            ? 'plush-cushion !rounded-[32px] text-[#3C2E2B]'
            : 'rain-glass-card glass-shine !rounded-[32px] text-[#222222]'
        }`}
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`text-xs font-black px-3 py-1 ${
                isDefault ? 'plush-rose-badge' : 'glass-capsule text-[#222222]'
              }`}
            >
              ROOM CODE: {gameState.roomId}
            </span>
            <span className={`text-xs font-black ${isDefault ? 'text-[#6E5D57]' : 'text-[#444444]'}`}>
              ({gameState.players.length} / {gameState.settings.maxPlayers}명 대기 중)
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            게임 대기실
          </h2>
        </div>

        {/* Share Button */}
        <button
          onClick={handleCopyLink}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 font-black text-xs transition-all ${
            copied
              ? 'bg-emerald-600 text-white rounded-2xl shadow-md'
              : isDefault
              ? 'plush-rose-btn'
              : 'glass-capsule text-[#222222]'
          }`}
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> 링크 복사 완료!
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" /> 초대 링크 복사
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Participant List */}
        <div
          className={`md:col-span-2 p-5 flex flex-col gap-4 transition-all ${
            isDefault
              ? 'plush-cushion !rounded-[32px] text-[#3C2E2B]'
              : 'rain-glass-card glass-shine !rounded-[32px] text-[#1E3A8A]'
          }`}
        >
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <h3 className="font-black text-base flex items-center gap-2">
              참여자 목록 ({gameState.players.length}/{gameState.settings.maxPlayers})
            </h3>
            {isHost && <span className={`text-xs font-black ${isDefault ? 'text-[#533E75]' : 'text-[#2563EB]'}`}>👑 당신은 방장입니다</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {gameState.players.map((p, idx) => {
              const isSelf = p.id === currentUserId;

              return (
                <div
                  key={p.id}
                  className={`p-3.5 flex items-center justify-between transition-all ${
                    p.isHost
                      ? isDefault
                        ? 'plush-tile !border-[#533E75]'
                        : 'glass-gel-btn text-white'
                      : isDefault
                      ? 'plush-tile'
                      : 'glass-capsule text-[#1E3A8A]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full shrink-0 overflow-hidden relative shadow-sm flex items-center justify-center bg-gray-200"
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
                    <div>
                      <span className="font-black text-sm block leading-tight">
                        {p.nickname} {isSelf && '(나)'}
                      </span>
                      <span className="text-[10px] font-bold opacity-75">
                        {p.isHost ? '방장' : '참여자'}
                      </span>
                    </div>
                  </div>

                  {/* Kick Button */}
                  {isHost && !p.isHost && (
                    <button
                      onClick={() => setKickTarget({ id: p.id, name: p.nickname })}
                      className="p-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-600 transition-colors font-black"
                      title="강제 퇴장"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Empty player slots */}
            {Array.from({ length: gameState.settings.maxPlayers - gameState.players.length }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className={`p-3.5 rounded-2xl border-2 border-dashed flex items-center justify-center opacity-60 ${
                  isDefault ? 'border-[#C8BFAD]' : 'border-[#6FA8FF]'
                }`}
              >
                <span className="text-xs font-black">빈 자리 (초대 대기중...)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Host Settings & Action Buttons */}
        <div className="flex flex-col gap-4">
          <div
            className={`p-5 flex flex-col gap-4 transition-all ${
              isDefault
                ? 'plush-cushion !rounded-[32px] text-[#3C2E2B]'
                : 'rain-glass-card glass-shine !rounded-[32px] text-[#1E3A8A]'
            }`}
          >
            <h3 className="font-black text-sm flex items-center gap-1.5 border-b border-black/5 pb-2">
              <Settings className="w-4 h-4" /> 방 설정 {isHost ? '(방장 전용)' : ''}
            </h3>

            {/* Max Players setting */}
            <div>
              <label className="text-xs font-black block mb-1">인원 제한</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[2, 3, 4].map((num) => (
                  <button
                    key={num}
                    disabled={!isHost || num < gameState.players.length}
                    onClick={() => handleUpdateSettings(num, undefined)}
                    className={`py-1.5 rounded-xl text-xs font-black transition-all ${
                      gameState.settings.maxPlayers === num
                        ? isDefault
                          ? 'plush-rose-btn'
                          : 'glass-gel-btn text-white'
                        : isDefault
                        ? 'plush-pill text-[#533E75]'
                        : 'glass-capsule text-[#1E3A8A]'
                    } ${num < gameState.players.length ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {num}명
                  </button>
                ))}
              </div>
            </div>

            {/* Time limit setting */}
            <div>
              <label className="text-xs font-black block mb-1">턴 제한시간</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[30, 60, 90].map((sec) => (
                  <button
                    key={sec}
                    disabled={!isHost}
                    onClick={() => handleUpdateSettings(undefined, sec)}
                    className={`py-1.5 rounded-xl text-xs font-black transition-all ${
                      gameState.settings.turnTimeLimit === sec
                        ? isDefault
                          ? 'plush-rose-btn'
                          : 'glass-gel-btn text-white'
                        : isDefault
                        ? 'plush-pill text-[#533E75]'
                        : 'glass-capsule text-[#1E3A8A]'
                    }`}
                  >
                    {sec}초
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Game Start / Exit Buttons */}
          <div className="flex flex-col gap-2 mt-auto">
            {isHost ? (
              <button
                onClick={handleStartGame}
                disabled={gameState.players.length < 2}
                className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                  gameState.players.length >= 2
                    ? isDefault
                      ? 'plush-rose-btn'
                      : 'glass-gel-btn text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                {gameState.players.length < 2 ? '2명 이상 참여시 시작 가능' : '게임 시작하기'}
              </button>
            ) : (
              <div className="text-center p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black shadow-sm">
                방장이 게임을 시작하기를 기다리는 중입니다...
              </div>
            )}

            <button
              onClick={onLeaveRoom}
              className={`w-full py-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-all ${
                isDefault
                  ? 'plush-pill text-[#533E75] hover:bg-red-50 hover:text-red-600'
                  : 'glass-capsule text-[#1E3A8A] hover:bg-red-50 hover:text-red-600'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" /> 방 나가기
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal: Kick Player */}
      {kickTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div
            className={`w-full max-w-xs p-5 shadow-2xl text-center ${
              isDefault
                ? 'plush-cushion !rounded-[32px] text-[#3C2E2B]'
                : 'rain-glass-card text-[#1E3A8A]'
            }`}
          >
            <UserX className="w-10 h-10 mx-auto text-red-500 mb-2" />
            <h4 className="font-black text-base mb-1">강퇴 확인</h4>
            <p className="text-xs mb-4 font-bold opacity-80">
              <strong className="text-red-600">&apos;{kickTarget.name}&apos;</strong> 님을 내보내시겠습니까?
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setKickTarget(null)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold ${
                  isDefault ? 'plush-pill text-[#533E75]' : 'glass-capsule text-[#1E3A8A]'
                }`}
              >
                취소
              </button>
              <button
                onClick={handleConfirmKick}
                className="flex-1 py-2 rounded-xl text-xs font-black bg-red-600 text-white shadow-md"
              >
                강퇴하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
