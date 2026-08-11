import { useState } from 'react';
import { ThemeWrapper } from './components/ThemeWrapper';
import { Header } from './components/Header';
import { LobbyView } from './components/LobbyView';
import { WaitingRoomView } from './components/WaitingRoomView';
import { GameView } from './components/GameBoard/GameView';
import { RulesModal } from './components/RulesModal';
import { DashboardModal } from './components/DashboardModal';
import { GeoBlockedView } from './components/GeoBlockedView';
import { SeoIntro } from './components/SeoIntro';
import { KickedModal } from './components/KickedModal';
import { NicknameModal } from './components/NicknameModal';
import { LanguageProvider } from './constants/language';
import { useGeoAccess } from './hooks/useGeoAccess';
import { usePersistentPreferences } from './hooks/usePersistentPreferences';
import { useRoomSession } from './hooks/useRoomSession';

export default function App() {
  const { theme, language, nickname, toggleTheme, changeLanguage, saveNickname } = usePersistentPreferences();
  const { isGeoBlocked, setIsGeoBlocked } = useGeoAccess();
  const {
    socket,
    socketId,
    currentView,
    gameState,
    kickedMessage,
    setKickedMessage,
    createRoom,
    joinRoom,
    leaveRoom,
  } = useRoomSession({
    isGeoBlocked,
    nickname,
    onGeoBlocked: () => setIsGeoBlocked(true),
  });
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  if (isGeoBlocked) {
    return <GeoBlockedView language={language} />;
  }

  return (
    <LanguageProvider language={language} setLanguage={changeLanguage}>
      <ThemeWrapper theme={theme}>
        {currentView !== 'game' && (
          <Header
            theme={theme}
            onToggleTheme={toggleTheme}
            language={language}
            onChangeLanguage={changeLanguage}
            nickname={nickname}
            onChangeNickname={() => setShowNicknameModal(true)}
            onOpenRules={() => setShowRules(true)}
            onOpenDashboard={() => setShowDashboard(true)}
          />
        )}

        <main className={currentView === 'game' ? 'h-screen overflow-hidden' : 'pb-12'}>
          {currentView === 'lobby' && (
            <>
              <LobbyView
                socket={socket}
                nickname={nickname}
                theme={theme}
                onJoinRoom={joinRoom}
                onCreateRoom={createRoom}
              />
              <SeoIntro theme={theme} />
            </>
          )}

          {currentView === 'waiting' && gameState && (
            <WaitingRoomView
              gameState={gameState}
              socket={socket}
              currentUserId={socketId}
              theme={theme}
              onLeaveRoom={leaveRoom}
            />
          )}

          {currentView === 'game' && gameState && (
            <GameView
              gameState={gameState}
              socket={socket}
              currentUserId={socketId}
              nickname={nickname}
              theme={theme}
              onReturnToLobby={leaveRoom}
            />
          )}
        </main>

        {showNicknameModal && (
          <NicknameModal
            theme={theme}
            nickname={nickname}
            onClose={() => setShowNicknameModal(false)}
            onSave={saveNickname}
          />
        )}

        {kickedMessage && (
          <KickedModal
            theme={theme}
            message={kickedMessage}
            onClose={() => setKickedMessage(null)}
          />
        )}

        {showRules && <RulesModal theme={theme} onClose={() => setShowRules(false)} />}
        {showDashboard && <DashboardModal theme={theme} onClose={() => setShowDashboard(false)} />}
      </ThemeWrapper>
    </LanguageProvider>
  );
}
