import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Plus, Users, Send, MessageSquare, Play, Wifi, Droplets } from 'lucide-react';
import { ThemeMode, RoomSettings, ChatMessage } from '../types/game';

interface LobbyViewProps {
  socket: Socket | null;
  nickname: string;
  theme: ThemeMode;
  onJoinRoom: (roomId: string) => void;
  onCreateRoom: (settings: RoomSettings) => void;
}

interface RoomItem {
  roomId: string;
  playersCount: number;
  maxPlayers: number;
  hostName: string;
  status: string;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  socket,
  nickname,
  theme,
  onJoinRoom,
  onCreateRoom,
}) => {
  const isDefault = theme === 'default';

  const [roomsList, setRoomsList] = useState<RoomItem[]>([]);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Room settings state
  const [maxPlayersOption, setMaxPlayersOption] = useState<number>(4);
  const [timeLimitOption, setTimeLimitOption] = useState<number>(60);

  // Ephemeral Lobby Chat state
  const [chatInput, setChatInput] = useState('');
  const [lobbyChats, setLobbyChats] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!socket) return;

    // Request initial list and chats
    socket.emit('get_rooms_list');
    socket.emit('get_lobby_chats');

    socket.on('rooms_list_update', (rooms: RoomItem[]) => {
      setRoomsList(rooms);
    });

    socket.on('lobby_chat_update', (chats: ChatMessage[]) => {
      setLobbyChats(chats);
    });

    return () => {
      socket.off('rooms_list_update');
      socket.off('lobby_chat_update');
    };
  }, [socket]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;
    socket.emit('send_lobby_chat', { nickname, text: chatInput.trim() });
    setChatInput('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRoom({
      maxPlayers: maxPlayersOption,
      turnTimeLimit: timeLimitOption,
      initialMeldPoints: 30,
    });
    setShowCreateModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-8 flex flex-col lg:flex-row gap-6">
      {/* Left Column: Banner, Join Input, Room List */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Banner Card */}
        <div className="flex flex-row sm:items-center justify-between gap-4 relative z-10 ">
          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold mb-3 ${
                isDefault ? 'plush-rose-badge' : 'glass-capsule text-[#222222]'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" /> 실시간 멀티플레이어
            </span>
            <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDefault ? 'text-[#2D323E]' : 'text-[#222222]'}`}>
              함께 즐기는 루미큐브
            </h2>
            <p className={`text-xs sm:text-sm mt-1.5 font-medium max-w-md ${isDefault ? 'text-[#5A6072]' : 'text-[#222222]'}`}>
              고유 방 코드를 친구를 초대하거나 대기 중인 방에 접속해 실시간으로 대결을 시작하세요!
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm shrink-0 transition-all ${
              isDefault
                ? 'plush-rose-btn'
                : 'glass-gel-btn'
            }`}
          >
            <Plus className="w-5 h-5 stroke-[3]" /> 방 만들기
          </button>
        </div>


        {/* Room Code Input Box */}
        <div
          className={`p-4 w-full flex flex-col sm:flex-row items-center gap-3 transition-all ${
            isDefault ? 'plush-cushion !rounded-[28px]' : 'rain-glass-card glass-shine !rounded-[28px]'
          }`}
        >
          <input
            type="text"
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            placeholder="방 코드 6자리 입력 (예: RUM123)"
            maxLength={8}
            className={`flex-1 w-full px-5 py-3.5 rounded-2xl text-sm font-bold outline-none tracking-wider transition-all ${
              isDefault
                ? 'plush-debossed text-[#2D323E] placeholder-[#8C93A4]'
                : 'glass-input text-[#222222] placeholder-[#555555]'
            }`}
          />
          <button
            onClick={() => roomCodeInput && onJoinRoom(roomCodeInput.trim())}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm shrink-0 transition-all ${
              isDefault
                ? 'plush-rose-btn'
                : 'glass-gel-btn'
            }`}
          >
            입장하기
          </button>
        </div>

        {/* Active Waiting Rooms List */}
        <div>
          <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDefault ? 'text-[#2D323E]' : 'text-[#222222]'}`}>
            <Users className="w-4 h-4" /> 대기 중인 방 목록 ({roomsList.length})
          </h3>

          {roomsList.length === 0 ? (
            <div
              className={`p-10 text-center flex flex-col items-center justify-center transition-all ${
                isDefault
                  ? 'plush-cushion !rounded-[32px] text-[#2D323E]'
                  : 'rain-glass-card glass-shine !rounded-[32px] text-[#222222]'
              }`}
            >
              {/* Central Water Drop / Emblem */}
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-inner ${
                  isDefault ? 'plush-orb-btn text-[#3B4050]' : 'glass-capsule text-[#222222]'
                }`}
              >
                <Droplets className="w-6 h-6" />
              </div>
              <p className={`font-bold text-sm ${isDefault ? 'text-[#2D323E]' : 'text-[#222222]'}`}>
                현재 생성된 대기 방이 없습니다.
              </p>
              <p className={`text-xs font-semibold mt-1 ${isDefault ? 'text-[#5A6072]' : 'text-[#444444]'}`}>
                상단의 &apos;방 만들기&apos; 버튼으로 새로운 방을 생성해 보세요!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roomsList.map((room) => (
                <div
                  key={room.roomId}
                  className={`p-4.5 flex items-center justify-between gap-3 transition-all hover:scale-[1.01] ${
                    isDefault
                      ? 'plush-cushion !rounded-[24px]'
                      : 'rain-glass-card glass-shine !rounded-[24px]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base">{room.roomId}</span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isDefault ? 'plush-pill text-[#3B4050]' : 'glass-capsule text-[#222222]'
                        }`}
                      >
                        {room.hostName}의 방
                      </span>
                    </div>
                    <p className={`text-xs font-semibold mt-1 ${isDefault ? 'text-[#5A6072]' : 'text-[#444444]'}`}>
                      인원: {room.playersCount} / {room.maxPlayers} 명
                    </p>
                  </div>

                  <button
                    onClick={() => onJoinRoom(room.roomId)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isDefault
                        ? 'plush-rose-btn'
                        : 'glass-gel-btn'
                    }`}
                  >
                    참여
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Ephemeral Lobby Chat */}
      <div className="w-full lg:w-80 flex flex-col">
        <div
          className={`flex-1 flex flex-col h-[520px] overflow-hidden transition-all ${
            isDefault
              ? 'plush-cushion !rounded-[32px]'
              : 'rain-glass-card glass-shine !rounded-[32px]'
          }`}
        >
          {/* Chat Header */}
          <div className="p-4 border-b border-black/5 font-bold text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className={`w-4 h-4 ${isDefault ? 'text-[#3B4050]' : 'text-[#222222]'}`} />
              <span className={isDefault ? 'text-[#2D323E]' : 'text-[#222222]'}>대기실 광장 채팅</span>
            </div>
            <span
              className={`text-[10px] px-2.5 py-0.5 font-bold ${
                isDefault
                  ? 'plush-rose-badge'
                  : 'glass-pink-badge'
              }`}
            >
              채널성
            </span>
          </div>

          {/* Chat Messages Log */}
          <div
            className={`m-3 p-3 flex-1 rounded-2xl overflow-y-auto flex flex-col gap-2 transition-all ${
              isDefault
                ? 'plush-debossed'
                : 'bg-white/40 border border-white/60 shadow-inner'
            }`}
          >
            {lobbyChats.length === 0 ? (
              <div className="m-auto text-center p-4">
                <p className={`text-xs font-semibold ${isDefault ? 'text-[#8A90A0]' : 'text-[#444444]'}`}>
                  대기 메시지가 없습니다. 자유롭게 대화를 나누어 보세요!
                </p>
              </div>
            ) : (
              lobbyChats.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2.5 rounded-2xl text-xs max-w-[88%] font-semibold ${
                    msg.senderName === nickname
                      ? isDefault
                        ? 'ml-auto plush-purple-btn text-white rounded-br-none shadow-sm'
                        : 'ml-auto glass-gel-btn text-white rounded-br-none'
                      : isDefault
                      ? 'mr-auto plush-pill text-[#2D323E] rounded-bl-none'
                      : 'mr-auto bg-white/90 border border-white/80 text-[#222222] rounded-bl-none'
                  }`}
                >
                  <span className="font-bold text-[10px] block opacity-80 mb-0.5">
                    {msg.senderName}
                  </span>
                  <span>{msg.text}</span>
                </div>
              ))
            )}
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSendChat} className="p-3 border-t border-black/5 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="대기실 채팅 메시지..."
              maxLength={100}
              className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs font-bold outline-none ${
                isDefault
                  ? 'plush-debossed text-[#2D323E] placeholder-[#8C93A4]'
                  : 'glass-input text-[#222222] placeholder-[#555555]'
              }`}
            />
            <button
              type="submit"
              className={`w-9 h-9 flex items-center justify-center rounded-full font-bold transition-all shrink-0 ${
                isDefault ? 'plush-rose-btn' : 'glass-gel-btn'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </form>
        </div>
      </div>

      {/* Modal: Create Room */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-md p-6 shadow-2xl transition-all ${
              isDefault
                ? 'plush-cushion !rounded-[32px] text-[#3C2E2B]'
                : 'rain-glass-card glass-shine !rounded-[32px] text-[#222222]'
            }`}
          >
            <h3 className="text-xl font-black mb-4 flex items-center gap-2">
              <Play className={`w-5 h-5 ${isDefault ? 'text-[#533E75]' : 'text-[#222222]'}`} /> 새 게임 방 만들기
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Max Players selection */}
              <div>
                <label className="block text-xs font-black mb-1.5 opacity-90">
                  최대 참여 인원 (2~4명)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 3, 4].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setMaxPlayersOption(num)}
                      className={`py-2 rounded-xl font-black text-sm transition-all ${
                        maxPlayersOption === num
                          ? isDefault
                            ? 'plush-rose-btn'
                            : 'glass-gel-btn'
                          : isDefault
                          ? 'plush-pill text-[#533E75]'
                          : 'glass-capsule text-[#222222]'
                      }`}
                    >
                      {num}명
                    </button>
                  ))}
                </div>
              </div>

              {/* Turn Time limit selection */}
              <div>
                <label className="block text-xs font-black mb-1.5 opacity-90">
                  턴 제한 시간
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 90].map((sec) => (
                    <button
                      type="button"
                      key={sec}
                      onClick={() => setTimeLimitOption(sec)}
                      className={`py-2 rounded-xl font-black text-sm transition-all ${
                        timeLimitOption === sec
                          ? isDefault
                            ? 'plush-rose-btn'
                            : 'glass-gel-btn'
                          : isDefault
                          ? 'plush-pill text-[#533E75]'
                          : 'glass-capsule text-[#222222]'
                      }`}
                    >
                      {sec}초
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs ${
                    isDefault ? 'plush-pill text-[#533E75]' : 'glass-capsule text-[#222222]'
                  }`}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs text-white shadow-md ${
                    isDefault ? 'plush-rose-btn' : 'glass-gel-btn'
                  }`}
                >
                  생성하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
