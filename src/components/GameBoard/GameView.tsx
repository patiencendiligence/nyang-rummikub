import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Check, Plus, RotateCcw, Smile, AlertCircle, Clock, Layers, ArrowLeft } from 'lucide-react';
import { GameState, Tile, TileSet, ThemeMode, Player, ChatMessage } from '../../types/game';
import { BoardArea } from './BoardArea';
import { PlayerHandArea } from './PlayerHandArea';
import { RoomChat } from './RoomChat';
import { GameEndModal } from './GameEndModal';
import { isValidSet, sortHand } from '../../utils/rummikubEngine';
import { sounds } from '../../utils/sound';

interface GameViewProps {
  gameState: GameState;
  socket: Socket | null;
  currentUserId: string;
  nickname: string;
  theme: ThemeMode;
  onReturnToLobby: () => void;
}

const CAT_AVATARS = [
  '/avatars/profile1.webp',
  '/avatars/profile2.webp',
  '/avatars/profile3.webp',
  '/avatars/profile4.webp',
];

const EMOJIS = ['🥳', '🥲', '🤔', '😱', '😵', '👋'];

export const GameView: React.FC<GameViewProps> = ({
  gameState,
  socket,
  currentUserId,
  nickname,
  theme,
  onReturnToLobby,
}) => {
  const isDefault = theme === 'default';

  const currentPlayer = gameState.players.find((p) => p.id === currentUserId);
  const isMyTurn = gameState.players[gameState.currentTurnIndex]?.id === currentUserId;

  // Local state for active board and player hand during turn
  const [board, setBoard] = useState<TileSet[]>(gameState.board);
  const [hand, setHand] = useState<Tile[]>(currentPlayer?.hand || []);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);

  const [showChat, setShowChat] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active floating emojis per player nickname
  const [activeEmojis, setActiveEmojis] = useState<Record<string, string>>({});

  // Timer countdown
  const turnTimeLimit = gameState.settings.turnTimeLimit || 30;
  const [timeLeft, setTimeLeft] = useState<number>(turnTimeLimit);
  const autoDrawTriggeredRef = useRef<number | null>(null);

  useEffect(() => {
    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - gameState.turnStartTime) / 1000);
      const remaining = Math.max(0, turnTimeLimit - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0 && isMyTurn && gameState.status === 'playing') {
        if (autoDrawTriggeredRef.current !== gameState.turnStartTime) {
          autoDrawTriggeredRef.current = gameState.turnStartTime;
          if (socket) {
            sounds.playDrawTile();
            socket.emit('draw_tile', { roomId: gameState.roomId });
            setSelectedTile(null);
          }
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [gameState.turnStartTime, turnTimeLimit, isMyTurn, gameState.status, gameState.roomId, socket]);

  const progressPercent = Math.min(100, Math.max(0, (timeLeft / turnTimeLimit) * 100));

  // Sync state from server on update
  useEffect(() => {
    setBoard(gameState.board);
    if (currentPlayer) {
      setHand(currentPlayer.hand);
    }
  }, [gameState, currentUserId]);

  // Turn sound alert when turn switches to me
  useEffect(() => {
    if (isMyTurn) {
      sounds.playTurnSound();
    }
  }, [gameState.currentTurnIndex]);

  useEffect(() => {
    if (!socket) return;

    socket.on('action_error', (data: { message: string }) => {
      setErrorMessage(data.message);
    });

    socket.on('room_chat_message', (msg: ChatMessage) => {
      setActiveEmojis((prev) => ({ ...prev, [msg.senderName]: msg.text }));
      setTimeout(() => {
        setActiveEmojis((prev) => {
          const next = { ...prev };
          delete next[msg.senderName];
          return next;
        });
      }, 2000);
    });

    return () => {
      socket.off('action_error');
      socket.off('room_chat_message');
    };
  }, [socket]);

  // --- Hand / Board Interaction Handlers ---
  const handleSelectHandTile = (tile: Tile) => {
    if (!isMyTurn) return;
    sounds.playTileClick();
    if (selectedTile?.id === tile.id) {
      setSelectedTile(null);
    } else {
      setSelectedTile(tile);
    }
  };

  const commitBoardChange = (nextBoard: TileSet[], nextHand: Tile[]) => {
    setHand(nextHand);
    setBoard(nextBoard);
    setSelectedTile(null);
    if (socket) {
      socket.emit('update_board', {
        roomId: gameState.roomId,
        newBoard: nextBoard,
        myHand: nextHand,
      });
    }
  };

  const findAutoSet = (tile: Tile) => {
    if (tile.isJoker) return [tile];

    const sameNumber = hand.filter((candidate) => !candidate.isJoker && candidate.number === tile.number);
    const group = sameNumber.filter(
      (candidate, index, candidates) => candidates.findIndex((item) => item.color === candidate.color) === index
    );

    const sameColor = hand
      .filter((candidate) => !candidate.isJoker && candidate.color === tile.color)
      .sort((a, b) => a.number - b.number);
    const tileIndex = sameColor.findIndex((candidate) => candidate.id === tile.id);
    let run: Tile[] = [];
    if (tileIndex >= 0) {
      let start = tileIndex;
      let end = tileIndex;
      while (start > 0 && sameColor[start].number - sameColor[start - 1].number === 1) start -= 1;
      while (end < sameColor.length - 1 && sameColor[end + 1].number - sameColor[end].number === 1) end += 1;
      run = sameColor.slice(start, end + 1);
    }

    const candidates = [group, run].filter((candidate) => candidate.length >= 3);
    return candidates.sort((a, b) => b.length - a.length)[0] || [tile];
  };

  const handleLongPressHandTile = (tile: Tile) => {
    if (!isMyTurn) return;
    const autoSet = findAutoSet(tile);
    if (autoSet.length < 3) {
      handleSelectHandTile(tile);
      return;
    }
    sounds.playTilePlace();
    const selectedIds = new Set(autoSet.map((candidate) => candidate.id));
    const nextHand = hand.filter((candidate) => !selectedIds.has(candidate.id));
    commitBoardChange([...board, autoSet], nextHand);
  };

  const handleDragStartTile = (tile: Tile, event: React.DragEvent) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/tile-id', tile.id);
    event.dataTransfer.setData('text/tile-source', 'hand');
  };

  const getDraggedTile = (tileId: string) => {
    const handTile = hand.find((tile) => tile.id === tileId);
    if (handTile) return { tile: handTile, sourceSetIndex: -1 };
    for (let setIndex = 0; setIndex < board.length; setIndex += 1) {
      const tile = board[setIndex].find((candidate) => candidate.id === tileId);
      if (tile) return { tile, sourceSetIndex: setIndex };
    }
    return null;
  };

  const handleDropTileToSet = (targetSetIndex: number, tileId: string) => {
    if (!isMyTurn) return;
    const dragged = getDraggedTile(tileId);
    if (!dragged) return;
    const nextBoard = board.map((set) => [...set]);
    if (dragged.sourceSetIndex >= 0) {
      nextBoard[dragged.sourceSetIndex] = nextBoard[dragged.sourceSetIndex].filter((tile) => tile.id !== tileId);
    }
    nextBoard[targetSetIndex] = [...nextBoard[targetSetIndex], dragged.tile];
    commitBoardChange(nextBoard.filter((set) => set.length > 0), hand.filter((tile) => tile.id !== tileId));
  };

  const handleDropTileToNewSet = (tileId: string) => {
    if (!isMyTurn) return;
    const dragged = getDraggedTile(tileId);
    if (!dragged) return;
    const nextBoard = board.map((set) => set.filter((tile) => tile.id !== tileId)).filter((set) => set.length > 0);
    commitBoardChange([...nextBoard, [dragged.tile]], hand.filter((tile) => tile.id !== tileId));
  };

  const handleDropTileToHand = (tileId: string) => {
    if (!isMyTurn) return;
    const dragged = getDraggedTile(tileId);
    if (!dragged || dragged.sourceSetIndex < 0) return;
    const nextBoard = board
      .map((set) => set.filter((tile) => tile.id !== tileId))
      .filter((set) => set.length > 0);
    commitBoardChange(nextBoard, [...hand, dragged.tile]);
  };

  const handlePlaceTileToSet = (targetSetIndex: number) => {
    if (!selectedTile || !isMyTurn) return;
    sounds.playTilePlace();

    const newHand = hand.filter((t) => t.id !== selectedTile.id);

    const newBoard = board.map((set, idx) => {
      if (idx === targetSetIndex) {
        return [...set, selectedTile];
      }
      return set;
    });

    commitBoardChange(newBoard, newHand);
  };

  const handleCreateNewSetWithTile = () => {
    if (!selectedTile || !isMyTurn) return;
    sounds.playTilePlace();

    const newHand = hand.filter((t) => t.id !== selectedTile.id);
    const newBoard = [...board, [selectedTile]];

    commitBoardChange(newBoard, newHand);
  };

  const handleTileClickOnBoard = (setIndex: number, tileIndex: number) => {
    if (!isMyTurn) return;
    sounds.playTileClick();

    const targetSet = board[setIndex];
    const tile = targetSet[tileIndex];

    const updatedSet = targetSet.filter((_, idx) => idx !== tileIndex);
    const newBoard = board.map((s, idx) => (idx === setIndex ? updatedSet : s)).filter((s) => s.length > 0);

    const newHand = [...hand, tile];

    commitBoardChange(newBoard, newHand);
  };

  // --- Turn Actions ---
  const handleEndTurn = () => {
    if (!socket || !isMyTurn) return;
    socket.emit('end_turn', {
      roomId: gameState.roomId,
      board,
      myHand: hand,
    });
  };

  const handleDrawTile = () => {
    if (!socket || !isMyTurn) return;
    sounds.playDrawTile();
    socket.emit('draw_tile', { roomId: gameState.roomId });
    setSelectedTile(null);
  };

  const handleResetBoard = () => {
    if (!socket || !isMyTurn) return;
    socket.emit('reset_turn_board', { roomId: gameState.roomId });
    setSelectedTile(null);
  };

  const handleSortByNumber = () => {
    setHand(sortHand(hand, 'number'));
  };

  const handleSortByColor = () => {
    setHand(sortHand(hand, 'color'));
  };

  const handleSendEmoji = (emoji: string) => {
    if (!socket) return;
    socket.emit('send_room_chat', {
      roomId: gameState.roomId,
      nickname,
      text: emoji,
    });
  };

  return (
    <div className="w-full h-screen max-h-screen overflow-hidden flex flex-col justify-between p-2 sm:p-3 md:p-4 max-w-[1600px] mx-auto relative select-none">
      {/* Action Error Notification Toast */}
      {errorMessage && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-bounce">
          <div className="p-3.5 rounded-2xl bg-red-600 text-white font-black text-xs shadow-2xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="px-2 py-1 bg-white/20 rounded-lg text-[10px] font-black"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Top Bar: Timer, Tile Pool, Action Text, Leave Button */}
      <div
        className={`w-full py-2 px-3 sm:px-4 rounded-[15px] flex items-center justify-between gap-2 shadow-md shrink-0 transition-all`}
      >
        {/* Left: Leave Lobby & Tile Pool Count */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onReturnToLobby}
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95 ${
              isDefault ? 'plush-orb-btn' : 'glass-capsule text-[#1E3A8A]'
            }`}
            title="대기실로 나가기"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div
            className={`flex items-center gap-1.5 text-xs font-black px-2.5 py-1 ${
              isDefault ? 'plush-pill' : 'glass-capsule text-[#1E3A8A]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span>
              남은타일 <strong className="text-amber-600 font-extrabold">{gameState.tilePool.length}</strong>
            </span>
          </div>
        </div>

        {/* Center: Timer & Turn Banner */}
        <div className="flex items-center gap-2 flex-1 max-w-xs sm:max-w-sm justify-center">
          {isMyTurn ? (
            <span className="text-[10px] sm:text-xs font-black text-[#2D323E] truncate">내 차례입니다.</span>
          ) : gameState.players[gameState.currentTurnIndex]?.isBot ? (
            <span className="text-[10px] sm:text-xs font-black text-amber-700 animate-pulse truncate">
              🤖 {gameState.players[gameState.currentTurnIndex]?.nickname} 생각 중...
            </span>
          ) : (
            <span className="text-[10px] sm:text-xs font-bold text-gray-500 truncate">
              {gameState.players[gameState.currentTurnIndex]?.nickname} 님의 차례
            </span>
          )}
          <Clock
            className={`w-4 h-4 shrink-0 ${
              timeLeft <= 10 ? 'text-red-500 animate-bounce' : 'text-amber-500'
            }`}
          />
          <div className="flex-1 max-w-[120px] sm:max-w-[180px]">
            <div
              className={`w-full h-2.5 rounded-full overflow-hidden p-0.5 ${
                isDefault ? 'plush-debossed' : 'bg-white/60 border border-white'
              }`}
            >
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  timeLeft <= 10 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <span
            className={`text-xs font-black shrink-0 ${
              timeLeft <= 10 ? 'text-rose-600 animate-pulse' : 'text-[#2D323E]'
            }`}
          >
            {timeLeft}초
          </span>
        </div>
      </div>

      {/* Main Game Stage (2 Columns:  Center Board+Rack, Right Players, Controls) */}
      <div className="flex-1 flex items-stretch gap-1 sm:gap-2 my-1 min-h-0 overflow-hidden">
        

        {/* CENTER COLUMN: Main Table Board & Bottom Rack */}
        <div className="flex-1 flex flex-col justify-between min-w-0 h-full gap-1 overflow-hidden">
          {/* Main Board Table Area */}
          <div className="flex-1 min-h-0 overflow-hidden rounded-[15px]">
            <BoardArea
              board={board}
              theme={theme}
              selectedTile={selectedTile}
              isMyTurn={isMyTurn}
              onPlaceTileToSet={handlePlaceTileToSet}
              onCreateNewSetWithTile={handleCreateNewSetWithTile}
              onTileClickOnBoard={handleTileClickOnBoard}
              onDropTileToSet={handleDropTileToSet}
              onDropTileToNewSet={handleDropTileToNewSet}
              invalidSetCount={board.filter((set) => !isValidSet(set)).length}
            />
          </div>


          {/* Bottom Player Rack Tray */}
          <div className="shrink-0">
            <PlayerHandArea
              hand={hand}
              theme={theme}
              selectedTile={selectedTile}
              onSelectTile={handleSelectHandTile}
              onSetHand={setHand}
              onLongPressTile={handleLongPressHandTile}
              onDragStartTile={handleDragStartTile}
              onDropTile={handleDropTileToHand}
              isMyTurn={isMyTurn}
              compact={true}
            />
          </div>
        </div>

        {/* RIGHT COLUMN / BOTTOM-RIGHT ACTION CONTROLS */}
        <div
          className={`w-[44px] sm:w-[60px] md:w-[76px] shrink-0 flex flex-col items-center justify-between p-0.5 sm:p-1 rounded-xl sm:rounded-2xl overflow-y-auto gap-0.5 sm:gap-1 shadow-inner transition-all ${
            isDefault ? 'plush-cushion' : 'rain-glass-card glass-shine'
          }`}
        >
          {/* Players Vertical Stack */}
          <div className="flex flex-col items-center justify-start gap-1 sm:gap-2 w-full relative">
            {gameState.players.map((p, idx) => {
              const isTurn = idx === gameState.currentTurnIndex;
              const isSelf = p.id === currentUserId;
              const currentEmoji = activeEmojis[p.nickname];

              return (
                <div key={p.id} className="flex flex-col items-center relative group w-full">
                  {/* Avatar with Turn Ring & Scale-Up Emoji Overlay */}
                  <div
                    className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full relative p-0.5 transition-all flex items-center justify-center ${
                      isTurn
                        ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-white animate-pulse scale-105'
                        : 'border border-white/60'
                    }`}
                  >
                    <img
                      src={CAT_AVATARS[idx % CAT_AVATARS.length]}
                      alt={p.nickname}
                      className="w-full h-full object-cover rounded-full bg-gray-200"
                    />

                    {/* Scale-Up Emoji Overlay directly on profile avatar size */}
                    {currentEmoji && (
                      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px] rounded-full animate-in zoom-in-50 fade-in duration-200 pointer-events-none">
                        <span className="text-base sm:text-xl md:text-2xl animate-bounce drop-shadow-lg select-none">
                          {currentEmoji}
                        </span>
                      </div>
                    )}

                    {/* Tile Count Badge */}
                    <div
                      className={`absolute -top-1 -right-1 font-black text-[6px] sm:text-[8px] px-0.5 py-0.2 rounded-full shadow-md flex items-center gap-0.5 z-10 ${
                        isDefault
                          ? 'bg-[#356C63] text-white border border-emerald-700'
                          : 'glass-capsule bg-blue-600 text-white'
                      }`}
                    >
                      <span>★</span>
                      <span>{p.hand.length}</span>
                    </div>
                  </div>

                  {/* Nickname & Melded Tag */}
                  <div className="mt-0.5 text-center w-full">
                    <span
                      className={`text-[7px] sm:text-[8px] md:text-[10px] font-black block truncate leading-tight ${
                        isTurn
                          ? isDefault
                            ? 'text-amber-700'
                            : 'text-blue-900 font-extrabold'
                          : isDefault
                          ? 'text-[#2D323E]'
                          : 'text-[#1E3A8A]'
                      }`}
                    >
                      {p.isBot ? `🤖 ${p.nickname}` : `${p.nickname} ${isSelf ? '(나)' : ''}`}
                    </span>
                    <span className="text-[6px] sm:text-[7px] font-bold opacity-70 block">
                      {p.hasMelded ? '30+' : '미등록'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Right Primary Controls: Draw +, Submit, Reset */}
          <div className="flex flex-col gap-0.5 sm:gap-1 w-full mt-auto">
            {/* Top/Upper: Sort Buttons (789 & 777) */}
            <div className="flex flex-col gap-0.5 w-full">
              <button
                onClick={handleSortByNumber}
                className={`w-full py-0.5 font-black text-[8px] sm:text-[10px] md:text-xs rounded-lg shadow transition-all active:scale-95 ${
                  isDefault ? 'plush-pill hover:bg-amber-100' : 'glass-capsule text-[#1E3A8A]'
                }`}
                title="숫자/연속 순 정렬 (789)"
              >
                789
              </button>
              <button
                onClick={handleSortByColor}
                className={`w-full py-0.5 font-black text-[8px] sm:text-[10px] md:text-xs rounded-lg shadow transition-all active:scale-95 ${
                  isDefault ? 'plush-pill hover:bg-indigo-100' : 'glass-capsule text-[#1E3A8A]'
                }`}
                title="색상/그룹 순 정렬 (777)"
              >
                777
              </button>
            </div>

            {/* Quick Emoji Reaction Cluster */}
            <div
              className={`w-full p-0.5 rounded-lg grid grid-cols-2 gap-0.5 text-center ${
                isDefault ? 'plush-debossed' : 'bg-white/40'
              }`}
            >
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendEmoji(emoji)}
                  className="text-[10px] sm:text-xs md:text-sm hover:scale-125 transition-transform active:scale-90"
                  title={`${emoji} 감정 보내기`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Draw Tile + Button */}
            <button
              disabled={!isMyTurn}
              onClick={handleDrawTile}
              className={`w-full py-1 sm:py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 font-black shadow-md transition-all active:scale-95 ${
                isMyTurn
                  ? isDefault
                    ? 'plush-purple-btn text-white animate-pulse'
                    : 'glass-gel-btn text-white animate-pulse'
                  : 'opacity-40 cursor-not-allowed'
              }`}
              title="타일 1개 가져오기 & 턴 패스"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 stroke-[3]" />
              <span className="text-[7px] sm:text-[9px] font-black tracking-tight">
                +{gameState.tilePool.length}
              </span>
            </button>

            {/* Submit Turn */}
            <button
              disabled={!isMyTurn}
              onClick={handleEndTurn}
              className={`w-full py-1 sm:py-1.5 rounded-lg font-black flex items-center justify-center gap-0.5 shadow transition-all active:scale-95 ${
                isMyTurn
                  ? isDefault
                    ? 'plush-rose-btn text-white'
                    : 'glass-gel-btn text-white'
                  : 'opacity-40 cursor-not-allowed'
              }`}
              title="등록 / Turn 완료"
            >
              <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
              <span className="text-[7px] sm:text-[9px]">등록</span>
            </button>

            {/* Reset Turn with 10px top margin and 20px bottom margin */}
            <button
              disabled={!isMyTurn}
              onClick={handleResetBoard}
              className={`w-full py-0.5 sm:py-1 rounded-lg font-black flex items-center justify-center gap-0.5 transition-all active:scale-95 mt-[10px] mb-[20px] ${
                isMyTurn
                  ? isDefault
                    ? 'plush-debossed text-[#2D323E]'
                    : 'glass-capsule text-[#1E3A8A]'
                  : 'opacity-40 cursor-not-allowed'
              }`}
              title="이번 턴의 배치 되돌리기"
            >
              <RotateCcw className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span className="text-[7px] sm:text-[9px]">리셋</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Drawer Overlay */}
      {showChat && (
        <div className="fixed bottom-14 right-4 z-50 w-80 max-w-[calc(100vw-32px)] shadow-2xl rounded-2xl overflow-hidden">
          <RoomChat
            socket={socket}
            roomId={gameState.roomId}
            nickname={nickname}
            theme={theme}
            onClose={() => setShowChat(false)}
          />
        </div>
      )}

      {/* Game End Winner Modal */}
      {gameState.status === 'ended' && (
        <GameEndModal
          gameState={gameState}
          winner={
            gameState.players.find((p) => p.id === gameState.winnerId) ||
            ({ nickname: '플레이어' } as Player)
          }
          finalScores={gameState.finalScores || {}}
          theme={theme}
          currentUserId={currentUserId}
          onReturnToLobby={onReturnToLobby}
        />
      )}
    </div>
  );
};

