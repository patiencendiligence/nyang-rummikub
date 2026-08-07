import { useState, useEffect, useCallback, FormEvent } from 'react';
import { io, Socket } from 'socket.io-client';
import { ThemeWrapper } from './components/ThemeWrapper';
import { Header } from './components/Header';
import { LobbyView } from './components/LobbyView';
import { WaitingRoomView } from './components/WaitingRoomView';
import { GameView } from './components/GameBoard/GameView';
import { RulesModal } from './components/RulesModal';
import { DashboardModal } from './components/DashboardModal';
import { GeoBlockedView } from './components/GeoBlockedView';
import { ThemeMode, GameState, RoomSettings } from './types/game';

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('rummikub_theme') as ThemeMode) || 'default';
  });

  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem('rummikub_nickname') || `플레이어${Math.floor(100 + Math.random() * 900)}`;
  });

  const [showNickModal, setShowNickModal] = useState(false);
  const [newNickInput, setNewNickInput] = useState('');

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isGeoBlocked, setIsGeoBlocked] = useState(false);

  // View Routing & Room State
  const [currentView, setCurrentView] = useState<'lobby' | 'waiting' | 'game'>('lobby');
  const [gameState, setGameState] = useState<GameState | null>(null);

  // Modals
  const [showRules, setShowRules] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [kickedMessage, setKickedMessage] = useState<string | null>(null);

  // Theme Toggle
  const handleToggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'default' ? 'dark' : 'default';
    setTheme(nextTheme);
    localStorage.setItem('rummikub_theme', nextTheme);
  };

  // Nickname Update
  const handleSaveNickname = (e: FormEvent) => {
    e.preventDefault();
    if (!newNickInput.trim()) return;
    setNickname(newNickInput.trim());
    localStorage.setItem('rummikub_nickname', newNickInput.trim());
    setShowNickModal(false);
  };

  // GeoIP Check on Mount
  useEffect(() => {
    fetch('/api/geo-check')
      .then((res) => res.json())
      .then((data) => {
        if (data.isBlocked) {
          setIsGeoBlocked(true);
        }
      })
      .catch(() => {
        // Fallback allow
      });
  }, []);

  // Socket Connection Setup
  useEffect(() => {
    if (isGeoBlocked) return;

    const newSocket = io({
      transports: ['websocket', 'polling'],
    });

    setSocket(newSocket);

    newSocket.on('geo_blocked', () => {
      setIsGeoBlocked(true);
    });

    newSocket.on('room_joined', (data: { roomId: string; gameState: GameState }) => {
      setGameState(data.gameState);
      if (data.gameState.status === 'playing') {
        setCurrentView('game');
      } else {
        setCurrentView('waiting');
      }
    });

    newSocket.on('room_updated', (updatedState: GameState) => {
      setGameState(updatedState);
      if (updatedState.status === 'playing') {
        setCurrentView('game');
      } else if (updatedState.status === 'waiting') {
        setCurrentView('waiting');
      }
    });

    newSocket.on('game_started', (startedState: GameState) => {
      setGameState(startedState);
      setCurrentView('game');
    });

    newSocket.on('kicked_from_room', (data: { message: string }) => {
      setKickedMessage(data.message);
      setGameState(null);
      setCurrentView('lobby');
    });

    newSocket.on('room_error', (data: { message: string }) => {
      alert(data.message);
    });

    // Check URL room search param (e.g., ?room=CODE)
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      newSocket.emit('join_room', {
        roomId: roomParam.toUpperCase(),
        nickname,
      });
    }

    return () => {
      newSocket.disconnect();
    };
  }, [isGeoBlocked]);

  // Actions
  const handleCreateRoom = useCallback(
    (settings: RoomSettings) => {
      if (!socket) return;
      socket.emit('create_room', { nickname, settings });
    },
    [socket, nickname]
  );

  const handleJoinRoom = useCallback(
    (roomId: string) => {
      if (!socket) return;
      socket.emit('join_room', { roomId, nickname });
    },
    [socket, nickname]
  );

  const handleLeaveRoom = useCallback(() => {
    if (!socket) return;
    socket.emit('leave_room');
    setGameState(null);
    setCurrentView('lobby');
    // Clear URL param
    window.history.replaceState({}, document.title, window.location.pathname);
  }, [socket]);

  if (isGeoBlocked) {
    return <GeoBlockedView />;
  }

  return (
    <ThemeWrapper theme={theme}>
      {currentView !== 'game' && (
        <Header
          theme={theme}
          onToggleTheme={handleToggleTheme}
          nickname={nickname}
          onChangeNickname={() => {
            setNewNickInput(nickname);
            setShowNickModal(true);
          }}
          onOpenRules={() => setShowRules(true)}
          onOpenDashboard={() => setShowDashboard(true)}
        />
      )}

      <main className={currentView === 'game' ? 'h-screen overflow-hidden' : 'pb-12'}>
        {currentView === 'lobby' && (
          <LobbyView
            socket={socket}
            nickname={nickname}
            theme={theme}
            onJoinRoom={handleJoinRoom}
            onCreateRoom={handleCreateRoom}
          />
        )}

        {currentView === 'waiting' && gameState && (
          <WaitingRoomView
            gameState={gameState}
            socket={socket}
            currentUserId={socket?.id || ''}
            theme={theme}
            onLeaveRoom={handleLeaveRoom}
          />
        )}

        {currentView === 'game' && gameState && (
          <GameView
            gameState={gameState}
            socket={socket}
            currentUserId={socket?.id || ''}
            nickname={nickname}
            theme={theme}
            onReturnToLobby={handleLeaveRoom}
          />
        )}
      </main>

      {/* Nickname Edit Modal */}
      {showNickModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-xs p-5 shadow-2xl flex flex-col gap-3 transition-all ${
              theme === 'default'
                ? 'plush-cushion text-[#2D323E]'
                : 'rain-glass-card glass-shine text-[#1E3A8A]'
            }`}
          >
            <div className="flex items-center justify-between pb-1 border-b border-black/10">
              <h3 className={`font-black text-base tracking-tight ${theme === 'default' ? 'embroidered-text' : ''}`}>
                닉네임 설정
              </h3>
              <button
                type="button"
                onClick={() => setShowNickModal(false)}
                className="p-1 rounded-lg hover:bg-black/10 transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveNickname} className="space-y-3 mt-1">
              <input
                type="text"
                value={newNickInput}
                onChange={(e) => setNewNickInput(e.target.value)}
                maxLength={12}
                placeholder="닉네임 입력 (최대 12자)"
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all outline-none ${
                  theme === 'default'
                    ? 'plush-debossed text-[#2D323E] placeholder-[#5A6072]/60'
                    : 'glass-debossed text-[#1E3A8A] placeholder-[#1E3A8A]/50'
                }`}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNickModal(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
                    theme === 'default'
                      ? 'plush-debossed text-[#2D323E]'
                      : 'glass-capsule text-[#1E3A8A]'
                  }`}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black text-white shadow-md transition-all active:scale-95 ${
                    theme === 'default' ? 'plush-purple-btn' : 'glass-gel-btn'
                  }`}
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kicked Alert Modal */}
      {kickedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-xs p-5 text-center shadow-2xl flex flex-col items-center gap-2 ${
              theme === 'default'
                ? 'plush-cushion text-[#2D323E]'
                : 'rain-glass-card glass-shine text-[#1E3A8A]'
            }`}
          >
            <span className="text-3xl block animate-bounce">🚫</span>
            <h4 className="font-extrabold text-base text-red-500">방 퇴장 알림</h4>
            <p className="text-xs font-bold opacity-80 mb-2">{kickedMessage}</p>
            <button
              onClick={() => setKickedMessage(null)}
              className={`w-full py-2.5 rounded-xl font-black text-xs text-white shadow-md transition-all active:scale-95 ${
                theme === 'default' ? 'plush-rose-btn' : 'glass-gel-btn'
              }`}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRules && <RulesModal theme={theme} onClose={() => setShowRules(false)} />}

      {/* Dashboard Modal */}
      {showDashboard && (
        <DashboardModal theme={theme} onClose={() => setShowDashboard(false)} />
      )}
    </ThemeWrapper>
  );
}
