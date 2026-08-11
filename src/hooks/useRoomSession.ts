import { useCallback, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, RoomSettings } from '../types/game';

type CurrentView = 'lobby' | 'waiting' | 'game';

interface UseRoomSessionOptions {
  isGeoBlocked: boolean;
  nickname: string;
  onGeoBlocked: () => void;
}

export const useRoomSession = ({ isGeoBlocked, nickname, onGeoBlocked }: UseRoomSessionOptions) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketId, setSocketId] = useState('');
  const [currentView, setCurrentView] = useState<CurrentView>('lobby');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [kickedMessage, setKickedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isGeoBlocked) return;

    const roomSocket = io({ transports: ['websocket', 'polling'] });
    setSocket(roomSocket);

    const updateRoomView = (nextGameState: GameState) => {
      setGameState(nextGameState);
      if (nextGameState.status === 'playing') {
        setCurrentView('game');
      } else if (nextGameState.status === 'waiting') {
        setCurrentView('waiting');
      }
    };

    roomSocket.on('connect', () => setSocketId(roomSocket.id || ''));
    roomSocket.on('disconnect', () => setSocketId(''));
    roomSocket.on('geo_blocked', onGeoBlocked);
    roomSocket.on('room_joined', (data: { gameState: GameState }) => updateRoomView(data.gameState));
    roomSocket.on('room_updated', updateRoomView);
    roomSocket.on('game_started', (startedState: GameState) => {
      setGameState(startedState);
      setCurrentView('game');
    });
    roomSocket.on('kicked_from_room', (data: { message: string }) => {
      setKickedMessage(data.message);
      setGameState(null);
      setCurrentView('lobby');
    });
    roomSocket.on('room_error', (data: { message: string }) => alert(data.message));

    const roomParam = new URLSearchParams(window.location.search).get('room');
    if (roomParam) {
      roomSocket.emit('join_room', { roomId: roomParam.toUpperCase(), nickname });
    }

    return () => {
      roomSocket.disconnect();
      setSocket(null);
      setSocketId('');
    };
  }, [isGeoBlocked]);

  const createRoom = useCallback((settings: RoomSettings) => {
    socket?.emit('create_room', { nickname, settings });
  }, [nickname, socket]);

  const joinRoom = useCallback((roomId: string) => {
    socket?.emit('join_room', { roomId, nickname });
  }, [nickname, socket]);

  const leaveRoom = useCallback(() => {
    if (!socket) return;
    socket.emit('leave_room');
    setGameState(null);
    setCurrentView('lobby');
    window.history.replaceState({}, document.title, window.location.pathname);
  }, [socket]);

  return {
    socket,
    socketId,
    currentView,
    gameState,
    kickedMessage,
    setKickedMessage,
    createRoom,
    joinRoom,
    leaveRoom,
  };
};
