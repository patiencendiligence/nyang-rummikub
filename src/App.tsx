import { useEffect, useRef, useState } from 'react';
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
import { useInvitedRoomId } from './hooks/useInvitedRoomId';
import { useAutoDeviceOrientation } from './hooks/useAutoDeviceOrientation';

export default function App() {
  // 앱인토스 미니앱에서 기기를 회전하면 화면도 같은 방향으로 자동 전환
  useAutoDeviceOrientation();

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

  // 초대 링크(웹 ?room= 또는 앱인토스 intoss:// 딥링크)로 들어온 roomId를 읽어와
  // 소켓이 연결되면 자동으로 해당 방에 입장시켜요.
  const invitedRoomId = useInvitedRoomId();
  const hasAutoJoinedRef = useRef(false);

  useEffect(() => {
    if (!invitedRoomId || hasAutoJoinedRef.current) return;
    if (!socket || currentView !== 'lobby') return;

    hasAutoJoinedRef.current = true;
    joinRoom(invitedRoomId);
  }, [invitedRoomId, socket, currentView, joinRoom]);

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
