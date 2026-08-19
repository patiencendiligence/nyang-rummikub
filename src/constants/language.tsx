import React, { createContext, useContext } from 'react';

export type Language = 'ko' | 'en';

type TranslationKey =
  | 'brand' | 'nicknamePlaceholder' | 'nicknameChange' | 'rules' | 'dashboard'
  | 'themeToDark' | 'themeToLight' | 'multiplayer' | 'lobbyTitle' | 'lobbyDescription'
  | 'createRoom' | 'roomCodePlaceholder' | 'join' | 'waitingRooms' | 'noRooms'
  | 'createRoomHint' | 'roomOf' | 'players' | 'participate' | 'lobbyChat' | 'channel'
  | 'noChat' | 'chatPlaceholder' | 'newGameRoom' | 'maxPlayers' | 'turnTime'
  | 'cancel' | 'create' | 'waitingRoom' | 'copyInvite' | 'copied' | 'participants'
  | 'host' | 'you' | 'participant' | 'emptySlot' | 'roomSettings' | 'hostOnly'
  | 'startGame' | 'needPlayers' | 'waitingHost' | 'leaveRoom' | 'kick' | 'kickConfirm'
  | 'confirm' | 'nicknameSettings' | 'nicknameInput' | 'save' | 'kicked' | 'close';

const translations: Record<Language, Record<TranslationKey, string>> = {
  ko: {
    brand: '냥루미큐브', nicknamePlaceholder: '닉네임 입력', nicknameChange: '닉네임 변경', rules: '게임 룰 설명', dashboard: '전적 대시보드',
    themeToDark: '다크 모드로 전환', themeToLight: '라이트 모드로 전환', multiplayer: '실시간 멀티플레이어', lobbyTitle: '함께 즐기는 루미큐브',
    lobbyDescription: '고유 방 코드를 친구를 초대하거나 대기 중인 방에 접속해 실시간으로 대결을 시작하세요!', createRoom: '방 만들기', roomCodePlaceholder: '방 코드 6자리 입력 (예: RUM123)', join: '입장하기', waitingRooms: '대기 중인 방 목록', noRooms: '현재 생성된 대기 방이 없습니다.', createRoomHint: "상단의 '방 만들기' 버튼으로 새로운 방을 생성해 보세요!", roomOf: '의 방', players: '인원', participate: '참여', lobbyChat: '대기실 광장 채팅', channel: '채널성', noChat: '대기 메시지가 없습니다. 자유롭게 대화를 나누어 보세요!', chatPlaceholder: '대기실 채팅 메시지...', newGameRoom: '새 게임 방 만들기', maxPlayers: '최대 참여 인원 (2~4명)', turnTime: '턴 제한 시간', cancel: '취소', create: '생성하기', waitingRoom: '게임 대기실', copyInvite: '초대 링크 복사', copied: '링크 복사 완료!', participants: '참여자 목록', host: '방장', you: '나', participant: '참여자', emptySlot: '빈 자리 (초대 대기중...)', roomSettings: '방 설정', hostOnly: '방장 전용', startGame: '게임 시작하기', needPlayers: '2명 이상 참여시 시작 가능', waitingHost: '방장이 게임을 시작하기를 기다리는 중입니다...', leaveRoom: '방 나가기', kick: '강제 퇴장', kickConfirm: '님을 내보내시겠습니까?', confirm: '확인', nicknameSettings: '닉네임 설정', nicknameInput: '닉네임 입력 (최대 12자)', save: '저장', kicked: '방 퇴장 알림', close: '닫기',
  },
  en: {
    brand: 'Nyang Rummikub', nicknamePlaceholder: 'Enter nickname', nicknameChange: 'Change nickname', rules: 'Game rules', dashboard: 'Stats dashboard',
    themeToDark: 'Switch to dark mode', themeToLight: 'Switch to light mode', multiplayer: 'REAL-TIME MULTIPLAYER', lobbyTitle: 'Play Rummikub together',
    lobbyDescription: 'Invite friends with a room code or join a waiting room to start a real-time match!', createRoom: 'Create room', roomCodePlaceholder: 'Enter 6-character room code (e.g. RUM123)', join: 'Join', waitingRooms: 'Waiting rooms', noRooms: 'There are no waiting rooms.', createRoomHint: "Create a new room with the 'Create room' button above.", roomOf: "'s room", players: 'Players', participate: 'Join', lobbyChat: 'Lobby chat', channel: 'LIVE', noChat: 'No messages yet. Start a conversation!', chatPlaceholder: 'Write a lobby message...', newGameRoom: 'Create a new game room', maxPlayers: 'Maximum players (2-4)', turnTime: 'Turn time limit', cancel: 'Cancel', create: 'Create', waitingRoom: 'Game waiting room', copyInvite: 'Copy invite link', copied: 'Invite link copied!', participants: 'Participants', host: 'Host', you: 'you', participant: 'Player', emptySlot: 'Empty slot (waiting for invite...)', roomSettings: 'Room settings', hostOnly: 'host only', startGame: 'Start game', needPlayers: 'At least 2 players are required', waitingHost: 'Waiting for the host to start the game...', leaveRoom: 'Leave room', kick: 'Kick player', kickConfirm: ' do you want to remove this player?', confirm: 'OK', nicknameSettings: 'Nickname settings', nicknameInput: 'Enter nickname (up to 12 characters)', save: 'Save', kicked: 'Removed from room', close: 'Close',
  },
};

const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void; t: (key: TranslationKey) => string } | null>(null);

export const LanguageProvider: React.FC<{ language: Language; setLanguage: (language: Language) => void; children: React.ReactNode }> = ({ language, setLanguage, children }) => (
  <LanguageContext.Provider value={{ language, setLanguage, t: (key) => translations[language][key] }}>
    {children}
  </LanguageContext.Provider>
);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
