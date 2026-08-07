import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Smile, X } from 'lucide-react';
import { ChatMessage, ThemeMode } from '../../types/game';

const EMOJIS = ['🥳', '🥲', '🤔', '😱', '😵', '👋'];

interface RoomChatProps {
  socket: Socket | null;
  roomId: string;
  nickname: string;
  theme: ThemeMode;
  onClose?: () => void;
}

export const RoomChat: React.FC<RoomChatProps> = ({
  socket,
  roomId,
  nickname,
  theme,
  onClose,
}) => {
  const isDefault = theme === 'default';
  const [roomChats, setRoomChats] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!socket) return;

    socket.on('room_chat_message', (msg: ChatMessage) => {
      setRoomChats((prev) => [...prev.slice(-15), msg]);
    });

    return () => {
      socket.off('room_chat_message');
    };
  }, [socket]);

  const handleSendEmoji = (emoji: string) => {
    if (!socket) return;
    socket.emit('send_room_chat', {
      roomId,
      nickname,
      text: emoji,
    });
  };

  return (
    <div
      className={`w-full max-w-sm flex flex-col h-[280px] overflow-hidden transition-all rounded-2xl shadow-2xl ${
        isDefault
          ? 'plush-cushion text-[#2D323E]'
          : 'rain-glass-card glass-shine text-[#1E3A8A]'
      }`}
    >
      {/* Header */}
      <div
        className={`p-2.5 border-b flex items-center justify-between font-black text-xs ${
          isDefault ? 'plush-debossed' : 'border-b border-white/60 bg-white/20'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <Smile className="w-4 h-4 text-amber-500" />
          <span>감정 이모지 선택</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/10">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-2.5 overflow-y-auto flex flex-col gap-1.5">
        {roomChats.length === 0 ? (
          <span className="text-[11px] font-bold opacity-60 text-center my-auto">
            이모지를 선택하여 감정을 표현해보세요!
          </span>
        ) : (
          roomChats.map((msg) => (
            <div
              key={msg.id}
              className={`p-1.5 px-3 rounded-xl text-xs max-w-[85%] font-bold flex items-center gap-2 ${
                msg.senderName === nickname
                  ? isDefault
                    ? 'ml-auto plush-purple-btn text-white'
                    : 'ml-auto glass-gel-btn text-white'
                  : isDefault
                  ? 'mr-auto plush-debossed text-[#2D323E]'
                  : 'mr-auto bg-white/90 text-[#1E3A8A]'
              }`}
            >
              <span className="font-black text-[10px] opacity-80">
                {msg.senderName}:
              </span>
              <span className="text-xl">{msg.text}</span>
            </div>
          ))
        )}
      </div>

      {/* Quick Emoji Buttons */}
      <div
        className={`p-2 border-t flex items-center justify-around gap-1 ${
          isDefault ? 'plush-debossed' : 'bg-white/30 border-t border-white/40'
        }`}
      >
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleSendEmoji(emoji)}
            className="text-2xl p-1 hover:scale-125 active:scale-95 transition-transform"
            title={`${emoji} 보내기`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
