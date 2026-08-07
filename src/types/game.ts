export type TileColor = 'red' | 'blue' | 'yellow' | 'black';

export interface Tile {
  id: string; // Unique ID (e.g., 'red-7-1', 'joker-cat-1')
  number: number; // 1-13 for standard tiles, 0 for Joker
  color: TileColor;
  isJoker: boolean;
}

export type TileSet = Tile[];

export interface Player {
  id: string; // Socket ID
  nickname: string;
  isHost: boolean;
  isReady: boolean;
  hand: Tile[];
  hasMelded: boolean; // Initial meld (>= 30 points) completed
  score: number;
  isTurn: boolean;
  connected: boolean;
  ip?: string;
  country?: string;
}

export interface RoomSettings {
  maxPlayers: number; // 2, 3, or 4
  turnTimeLimit: number; // in seconds (e.g., 30, 60, 90)
  initialMeldPoints: number; // default 30
}

export type GameStatus = 'waiting' | 'playing' | 'ended';

export interface GameState {
  roomId: string;
  status: GameStatus;
  settings: RoomSettings;
  hostId: string;
  players: Player[];
  currentTurnIndex: number;
  turnStartTime: number; // timestamp
  board: TileSet[]; // Sets currently on table
  boardInitialSnapshot: TileSet[]; // Snapshot at turn start for reset
  playerHandsSnapshot: Record<string, Tile[]>; // Hand snapshot for reset
  tilePool: Tile[]; // Remaining tiles in deck
  lastActionText: string;
  winnerId: string | null;
  finalScores?: Record<string, number>;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface GameRecord {
  id: string;
  date: string;
  roomId: string;
  playersCount: number;
  winnerName: string;
  userScore: number;
  durationSeconds: number;
  myRank: number;
}

export type ThemeMode = 'default' | 'dark'; // 'default' = Plush, 'dark' = Rain Glassmorphism
