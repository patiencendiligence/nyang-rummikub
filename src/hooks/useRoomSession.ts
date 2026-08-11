import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, RoomSettings } from '../types/game';

type CurrentView = 'lobby' | 'waiting' | 'game';
type PendingRoomAction = { event: 'create_room' | 'join_room'; payload: object };

const DEFAULT_PRODUCTION_SOCKET_URL = 'https://nyang-rummikub.onrender.com';

const getSocketUrl = () => {
  const viteEnv = (import.meta as ImportMeta & {
    env?: { VITE_SOCKET_URL?: string; DEV?: boolean };
  }).env;
  if (viteEnv?.VITE_SOCKET_URL) return viteEnv.VITE_SOCKET_URL;
  if (viteEnv?.DEV) return window.location.origin;
  return DEFAULT_PRODUCTION_SOCKET_URL;
};

interface UseRoomSessionOptions {
  isGeoBlocked: boolean;
  nickname: string;
  onGeoBlocked: () => void;
}

export const useRoomSession = ({ isGeoBlocked, nickname, onGeoBlocked }: UseRoomSessionOptions) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState('');
  const [currentView, setCurrentView] = useState<CurrentView>('lobby');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [kickedMessage, setKickedMessage] = useState<string | null>(null);
  const pendingRoomActions = useRef<PendingRoomAction[]>([]);

  useEffect(() => {
    if (isGeoBlocked) return;

    const roomSocket = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    setSocket(roomSocket);

    const updateRoomView = (nextGameState: GameState) => {
      setGameState(nextGameState);
      if (nextGameState.status === 'playing') {
        setCurrentView('game');
      } else if (nextGameState.status === 'waiting') {
        setCurrentView('waiting');
      }
    };

    roomSocket.on('connect', () => {
      setSocketId(roomSocket.id || '');
      setIsConnected(true);
      pendingRoomActions.current.forEach(({ event, payload }) => roomSocket.emit(event, payload));
      pendingRoomActions.current = [];
    });
    roomSocket.on('disconnect', () => {
      setSocketId('');
      setIsConnected(false);
    });
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
      setIsConnected(false);
    };
  }, [isGeoBlocked]);

  const createRoom = useCallback((settings: RoomSettings) => {
    const payload = { nickname, settings };
    if (!socket) {
      pendingRoomActions.current.push({ event: 'create_room', payload });
    } else if (socket.connected) {
      socket.emit('create_room', payload);
    } else {
      socket.once('connect', () => socket.emit('create_room', payload));
    }
    return true;
  }, [nickname, socket]);

  const joinRoom = useCallback((roomId: string) => {
    const payload = { roomId, nickname };
    if (!socket) {
      pendingRoomActions.current.push({ event: 'join_room', payload });
    } else if (socket.connected) {
      socket.emit('join_room', payload);
    } else {
      socket.once('connect', () => socket.emit('join_room', payload));
    }
    return true;
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
    isConnected,
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
