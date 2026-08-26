import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { Tile, GameState, RoomSettings, ChatMessage, Player, TileSet, GameRecord } from './src/types/game';
import { generateTileDeck, isValidSet, getSetPoints } from './src/utils/rummikubEngine';
import { executeBotTurn } from './src/utils/botAi';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 1e7, // 10MB
});

const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory data stores
const activeRooms: Record<string, GameState> = {};
const turnTimeouts: Record<string, NodeJS.Timeout> = {};
const botTurnTimeouts: Record<string, NodeJS.Timeout> = {};
const lobbyMessages: ChatMessage[] = [];
const gameRecordsStore: GameRecord[] = [];

const BOT_NAMES = ['냥봇 루미', '냥봇 코코', '냥봇 미유', '냥봇 보리', '냥봇 나비', '냥봇 모찌', '냥봇 까미'];

function clearRoomTimers(roomId: string) {
  if (turnTimeouts[roomId]) {
    clearTimeout(turnTimeouts[roomId]);
    delete turnTimeouts[roomId];
  }
  if (botTurnTimeouts[roomId]) {
    clearTimeout(botTurnTimeouts[roomId]);
    delete botTurnTimeouts[roomId];
  }
}

// Helper: Check if IP is in China (CN)
function isChinaIP(ipString: string): boolean {
  if (!ipString) return false;
  // Clean IPv6 prefix
  const cleanIp = ipString.replace('::ffff:', '');
  
  // Standard local/private IP checks
  if (cleanIp === '127.0.0.1' || cleanIp === 'localhost' || cleanIp.startsWith('10.') || cleanIp.startsWith('192.168.')) {
    return false; // Local development allowed
  }

  // Simple IP range block check for known Chinese major subnets (or explicitly forced test param)
  // CN IPs often start with specific octets like 1.0.1, 14.16, 27.18, 36.96, 42.0, 58.14, 101.80, 110.72, 111.0, 112.0, 113.0, 114.80, 115.192, 116.204, 117.0, 118.0, 119.0, 120.0, 121.0, 122.0, 123.0, 124.0, 125.0, 180.96, 182.0, 183.0, 202.96, 218.0, 220.160, 221.0, 222.0, 223.0
  const octets = cleanIp.split('.').map(Number);
  if (octets.length === 4) {
    const firstTwo = `${octets[0]}.${octets[1]}`;
    const cnPrefixes = ['1.0', '14.16', '27.18', '36.96', '42.0', '58.14', '101.80', '110.72', '111.0', '112.0', '113.0', '114.80', '115.192', '116.204', '117.0', '118.0', '119.0', '120.0', '121.0', '122.0', '123.0', '124.0', '125.0', '180.96', '182.0', '183.0', '202.96', '218.0', '220.160', '221.0', '222.0', '223.0'];
    if (cnPrefixes.some(p => cleanIp.startsWith(p))) {
      return true;
    }
  }

  return false;
}

// API Routes
app.get('/api/geo-check', (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
  const countryHeader = (req.headers['cf-ipcountry'] as string) || '';
  const forceCn = req.query.force_cn === 'true';

  const isBlocked = forceCn || countryHeader.toUpperCase() === 'CN' || isChinaIP(clientIp);

  res.json({
    clientIp,
    country: countryHeader || (isBlocked ? 'CN' : 'KR/GLOBAL'),
    isBlocked,
  });
});

app.get('/api/records', (req, res) => {
  res.json({ records: gameRecordsStore });
});

// Socket.IO real-time handlers
io.on('connection', (socket) => {
  const clientIp = (socket.handshake.headers['x-forwarded-for'] as string) || socket.handshake.address || '';
  const countryHeader = (socket.handshake.headers['cf-ipcountry'] as string) || '';
  
  if (countryHeader.toUpperCase() === 'CN' || isChinaIP(clientIp)) {
    socket.emit('geo_blocked', { message: 'Access Restricted in China (CN) region.' });
    socket.disconnect(true);
    return;
  }

  // --- Lobby Chat ---
  socket.on('send_lobby_chat', (data: { nickname: string; text: string }) => {
    if (!data.text.trim()) return;
    const msg: ChatMessage = {
      id: `lmsg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      senderId: socket.id,
      senderName: data.nickname || '익명',
      text: data.text.trim(),
      timestamp: Date.now(),
    };
    lobbyMessages.push(msg);
    if (lobbyMessages.length > 50) lobbyMessages.shift(); // Keep recent 50
    io.emit('lobby_chat_update', lobbyMessages);
  });

  socket.on('get_lobby_chats', () => {
    socket.emit('lobby_chat_update', lobbyMessages);
  });

  // --- Room Management ---
  socket.on('get_rooms_list', () => {
    const roomsList = Object.values(activeRooms)
      .filter((r) => r.status === 'waiting')
      .map((r) => ({
        roomId: r.roomId,
        playersCount: r.players.length,
        maxPlayers: r.settings.maxPlayers,
        hostName: r.players.find((p) => p.isHost)?.nickname || 'Host',
        status: r.status,
      }));
    socket.emit('rooms_list_update', roomsList);
  });

  socket.on('create_room', (data: { nickname: string; settings: RoomSettings }) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const hostPlayer: Player = {
      id: socket.id,
      nickname: data.nickname || '방장',
      isHost: true,
      isReady: true,
      hand: [],
      hasMelded: false,
      score: 0,
      isTurn: false,
      connected: true,
    };

    const newRoom: GameState = {
      roomId,
      status: 'waiting',
      settings: {
        maxPlayers: data.settings?.maxPlayers || 4,
        turnTimeLimit: data.settings?.turnTimeLimit || 60,
        initialMeldPoints: 30,
      },
      hostId: socket.id,
      players: [hostPlayer],
      currentTurnIndex: 0,
      turnStartTime: Date.now(),
      board: [],
      boardInitialSnapshot: [],
      playerHandsSnapshot: {},
      tilePool: [],
      lastActionText: '방이 생성되었습니다.',
      winnerId: null,
    };

    activeRooms[roomId] = newRoom;
    socket.join(roomId);
    socket.emit('room_joined', { roomId, gameState: newRoom });
    broadcastRoomsList();
  });

  socket.on('join_room', (data: { roomId: string; nickname: string }) => {
    const roomCode = data.roomId?.toUpperCase();
    const room = activeRooms[roomCode];

    if (!room) {
      socket.emit('room_error', { message: '존재하지 않는 방 코드입니다.' });
      return;
    }

    if (room.status !== 'waiting') {
      socket.emit('room_error', { message: '이미 게임이 진행 중이거나 종료된 방입니다.' });
      return;
    }

    if (room.players.length >= room.settings.maxPlayers) {
      socket.emit('room_error', { message: '인원이 초과되어 입장이 불가능합니다.' });
      return;
    }

    // Check if player already in room
    const existing = room.players.find((p) => p.id === socket.id);
    if (!existing) {
      const newPlayer: Player = {
        id: socket.id,
        nickname: data.nickname || `플레이어${room.players.length + 1}`,
        isHost: false,
        isReady: true,
        hand: [],
        hasMelded: false,
        score: 0,
        isTurn: false,
        connected: true,
      };
      room.players.push(newPlayer);
    }

    socket.join(roomCode);
    io.to(roomCode).emit('room_updated', room);
    socket.emit('room_joined', { roomId: roomCode, gameState: room });
    broadcastRoomsList();
  });

  socket.on('update_room_settings', (data: { roomId: string; settings: Partial<RoomSettings> }) => {
    const room = activeRooms[data.roomId];
    if (!room || room.hostId !== socket.id) return;

    if (data.settings.maxPlayers && data.settings.maxPlayers >= room.players.length) {
      room.settings.maxPlayers = data.settings.maxPlayers;
    }
    if (data.settings.turnTimeLimit) {
      room.settings.turnTimeLimit = data.settings.turnTimeLimit;
    }

    io.to(data.roomId).emit('room_updated', room);
    broadcastRoomsList();
  });

  socket.on('kick_player', (data: { roomId: string; targetPlayerId: string }) => {
    const room = activeRooms[data.roomId];
    if (!room || room.hostId !== socket.id) return;

    const targetIndex = room.players.findIndex((p) => p.id === data.targetPlayerId);
    if (targetIndex !== -1 && data.targetPlayerId !== socket.id) {
      const kicked = room.players.splice(targetIndex, 1)[0];
      io.to(data.targetPlayerId).emit('kicked_from_room', { message: '방장에 의해 강퇴되었습니다.' });
      const targetSocket = io.sockets.sockets.get(data.targetPlayerId);
      if (targetSocket) targetSocket.leave(data.roomId);

      room.lastActionText = `${kicked.nickname} 님이 강퇴되었습니다.`;
      io.to(data.roomId).emit('room_updated', room);
      broadcastRoomsList();
    }
  });

  // --- Rummikub Gameplay Handlers ---
  socket.on('start_game', (data: { roomId: string }) => {
    const room = activeRooms[data.roomId];
    if (!room || room.hostId !== socket.id) return;
    if (room.players.length < 2) {
      socket.emit('room_error', { message: '최소 2명 이상 참여해야 게임을 시작할 수 있습니다.' });
      return;
    }

    startGameForRoom(room);
  });

  socket.on('restart_game', (data: { roomId: string }) => {
    const room = activeRooms[data.roomId];
    if (!room) return;
    if (room.hostId !== socket.id && !room.players.some((p) => p.id === socket.id && p.isHost)) return;

    startGameForRoom(room);
  });

  socket.on('return_to_waiting_room', (data: { roomId: string }) => {
    const room = activeRooms[data.roomId];
    if (!room) return;
    if (room.hostId !== socket.id && !room.players.some((p) => p.id === socket.id && p.isHost)) return;

    clearRoomTimers(room.roomId);
    room.status = 'waiting';
    room.board = [];
    room.boardInitialSnapshot = [];
    room.playerHandsSnapshot = {};
    room.tilePool = [];
    room.winnerId = null;
    room.currentTurnIndex = 0;
    room.players.forEach((p) => {
      p.hand = [];
      p.hasMelded = false;
      p.isTurn = false;
    });
    room.lastActionText = '대기실로 돌아왔습니다. 준비 후 게임을 시작하세요!';

    io.to(room.roomId).emit('room_updated', room);
    broadcastRoomsList();
  });

  socket.on('play_with_bots', (data: { roomId: string }) => {
    const room = activeRooms[data.roomId];
    if (!room || room.hostId !== socket.id) return;
    if (room.status !== 'waiting') return;

    const neededBots = Math.max(0, room.settings.maxPlayers - room.players.length);
    const botsToAdd = room.players.length === 1 && neededBots === 0 ? 1 : neededBots;

    const existingNames = new Set(room.players.map((p) => p.nickname));
    const availableBotNames = BOT_NAMES.filter((name) => !existingNames.has(name));

    for (let i = 0; i < botsToAdd; i++) {
      const botName = availableBotNames[i % availableBotNames.length] || `냥봇 ${i + 1}`;
      const botPlayer: Player = {
        id: `bot-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
        nickname: botName,
        isHost: false,
        isReady: true,
        hand: [],
        hasMelded: false,
        score: 0,
        isTurn: false,
        connected: true,
        isBot: true,
      };
      room.players.push(botPlayer);
    }

    startGameForRoom(room);
  });

  socket.on('update_board', (data: { roomId: string; newBoard: TileSet[]; myHand: Tile[] }) => {
    const room = activeRooms[data.roomId];
    if (!room || room.status !== 'playing') return;

    const currentPlayer = room.players[room.currentTurnIndex];
    if (!currentPlayer || currentPlayer.id !== socket.id) return;

    room.board = data.newBoard;
    currentPlayer.hand = data.myHand;

    io.to(data.roomId).emit('room_updated', room);
  });

  socket.on('update_hand_order', (data: { roomId: string; myHand: Tile[] }) => {
    const room = activeRooms[data.roomId];
    if (!room || room.status !== 'playing') return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player || !Array.isArray(data.myHand)) return;

    // Check validity of hand tiles
    const currentHandIds = new Set(player.hand.map((t) => t.id));
    if (data.myHand.length === player.hand.length && data.myHand.every((t) => currentHandIds.has(t.id))) {
      player.hand = data.myHand;
      // If player hasn't modified board during their turn yet, update snapshot as well
      if (room.players[room.currentTurnIndex]?.id === socket.id && room.playerHandsSnapshot[player.id]?.length === player.hand.length) {
        room.playerHandsSnapshot[player.id] = JSON.parse(JSON.stringify(player.hand));
      }
    }
  });

  socket.on('reset_turn_board', (data: { roomId: string }) => {
    const room = activeRooms[data.roomId];
    if (!room || room.status !== 'playing') return;

    const currentPlayer = room.players[room.currentTurnIndex];
    if (!currentPlayer || currentPlayer.id !== socket.id) return;

    // Reset board & current player hand to snapshot
    room.board = JSON.parse(JSON.stringify(room.boardInitialSnapshot));
    if (room.playerHandsSnapshot[currentPlayer.id]) {
      currentPlayer.hand = JSON.parse(JSON.stringify(room.playerHandsSnapshot[currentPlayer.id]));
    }

    io.to(data.roomId).emit('room_updated', room);
  });

  socket.on('end_turn', (data: { roomId: string; board: TileSet[]; myHand: Tile[] }) => {
    const room = activeRooms[data.roomId];
    if (!room || room.status !== 'playing') return;

    const currentPlayer = room.players[room.currentTurnIndex];
    if (!currentPlayer || currentPlayer.id !== socket.id) return;

    // Validate ALL sets on the board
    const allSetsValid = data.board.every((set) => isValidSet(set));
    if (!allSetsValid) {
      socket.emit('action_error', { message: '바닥에 올바르지 않은 타일 조합이 있습니다. (그룹 또는 연속 3개 이상)' });
      return;
    }

    const initialHandCount = room.playerHandsSnapshot[currentPlayer.id]?.length || 14;
    const tilesPlayedCount = initialHandCount - data.myHand.length;

    if (tilesPlayedCount <= 0) {
      socket.emit('action_error', { message: '최소 1개 이상의 타일을 제출해야 합니다. 타일을 낼 수 없다면 타일 가져오기를 누르세요.' });
      return;
    }

    // Check Initial Meld rule if player has not melded yet
    if (!currentPlayer.hasMelded) {
      // Find new sets played from hand
      const newSets = data.board.filter((s) => !room.boardInitialSnapshot.some((oldS) => isSameSet(oldS, s)));
      const meldPoints = newSets.reduce((sum, s) => sum + getSetPoints(s), 0);

      if (meldPoints < room.settings.initialMeldPoints) {
        socket.emit('action_error', {
          message: `첫 등록은 30점 이상의 신규 조합을 제출해야 합니다! (현재 제출 점수: ${meldPoints}점)`,
        });
        return;
      }
      currentPlayer.hasMelded = true;
    }

    // Update player hand & board
    currentPlayer.hand = data.myHand;
    room.board = data.board;

    // Check Win condition (empty hand)
    if (currentPlayer.hand.length === 0) {
      finishGame(room, currentPlayer);
      return;
    }

    // Advance turn
    advanceTurn(room, `${currentPlayer.nickname} 님이 타일을 내고 차례를 마쳤습니다.`);
  });

  socket.on('draw_tile', (data: { roomId: string }) => {
    const room = activeRooms[data.roomId];
    if (!room || room.status !== 'playing') return;

    const currentPlayer = room.players[room.currentTurnIndex];
    if (!currentPlayer || currentPlayer.id !== socket.id) return;

    // Reset board if modified
    room.board = JSON.parse(JSON.stringify(room.boardInitialSnapshot));
    if (room.playerHandsSnapshot[currentPlayer.id]) {
      currentPlayer.hand = JSON.parse(JSON.stringify(room.playerHandsSnapshot[currentPlayer.id]));
    }

    // Draw 1 tile from pool if available
    if (room.tilePool.length > 0) {
      const drawnTile = room.tilePool.pop()!;
      currentPlayer.hand.push(drawnTile);
      advanceTurn(room, `${currentPlayer.nickname} 님이 타일을 1개 가져왔습니다.`);
    } else {
      // Tile pool is empty -> calculate winner by lowest tile count
      const winner = getLowestTileCountPlayer(room);
      finishGame(
        room,
        winner,
        `타일 더미가 모두 소진되어 남은 타일 수가 가장 적은 ${winner.nickname} 님이 승리하였습니다!`
      );
    }
  });

  socket.on('timeout_turn', (data: { roomId: string }) => {
    const room = activeRooms[data.roomId];
    if (!room || room.status !== 'playing') return;

    // Verify turn elapsed with tolerance for client-server clock drift
    const elapsed = Date.now() - room.turnStartTime;
    const limitMs = (room.settings.turnTimeLimit || 30) * 1000;
    if (elapsed >= limitMs - 1000) {
      handleTurnTimeout(room);
    }
  });

  // --- Room In-Game Chat ---
  socket.on('send_room_chat', (data: { roomId: string; nickname: string; text: string }) => {
    if (!data.text.trim()) return;
    const msg: ChatMessage = {
      id: `rmsg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      senderId: socket.id,
      senderName: data.nickname || '플레이어',
      text: data.text.trim(),
      timestamp: Date.now(),
    };
    io.to(data.roomId).emit('room_chat_message', msg);
  });

  // --- Leave / Disconnection Handling ---
  socket.on('leave_room', () => {
    handlePlayerLeave(socket.id);
  });

  socket.on('disconnect', () => {
    handlePlayerLeave(socket.id);
  });
});

function handlePlayerLeave(socketId: string) {
  Object.values(activeRooms).forEach((room) => {
    const pIndex = room.players.findIndex((p) => p.id === socketId);
    if (pIndex === -1) return;

    const leavingPlayer = room.players[pIndex];

    if (room.status === 'waiting') {
      room.players.splice(pIndex, 1);
      if (room.players.length === 0) {
        delete activeRooms[room.roomId];
      } else if (leavingPlayer.isHost) {
        room.players[0].isHost = true;
        room.hostId = room.players[0].id;
      }
      io.to(room.roomId).emit('room_updated', room);
    } else if (room.status === 'playing') {
      // Remove player from active room
      room.players.splice(pIndex, 1);
      delete room.playerHandsSnapshot[leavingPlayer.id];

      // Reassign host if needed
      if (leavingPlayer.isHost && room.players.length > 0) {
        room.players[0].isHost = true;
        room.hostId = room.players[0].id;
      }

      // Check remaining active players
      if (room.players.length < 2) {
        if (room.players.length === 1) {
          const soleWinner = room.players[0];
          finishGame(
            room,
            soleWinner,
            `${leavingPlayer.nickname} 님의 퇴장으로 최소 인원(2명) 미만이 되어 ${soleWinner.nickname} 님이 최종 승리하였습니다!`,
            leavingPlayer
          );
        } else {
          delete activeRooms[room.roomId];
        }
      } else {
        // 2 or more players remain -> Re-adjust turn index and continue
        const wasCurrentTurn = pIndex === room.currentTurnIndex;

        if (pIndex < room.currentTurnIndex) {
          room.currentTurnIndex = Math.max(0, room.currentTurnIndex - 1);
        }
        if (room.currentTurnIndex >= room.players.length) {
          room.currentTurnIndex = 0;
        }

        if (wasCurrentTurn) {
          // Reset board to initial turn snapshot
          room.board = JSON.parse(JSON.stringify(room.boardInitialSnapshot));
          const nextPlayer = room.players[room.currentTurnIndex];
          if (room.playerHandsSnapshot[nextPlayer.id]) {
            nextPlayer.hand = JSON.parse(JSON.stringify(room.playerHandsSnapshot[nextPlayer.id]));
          }
        }

        room.players.forEach((p, idx) => {
          p.isTurn = idx === room.currentTurnIndex;
        });

        room.turnStartTime = Date.now();
        room.lastActionText = `${leavingPlayer.nickname} 님이 퇴장하였습니다. (인원 재조정: ${room.players.length}명) ${
          room.players[room.currentTurnIndex].nickname
        } 님의 차례입니다.`;

        io.to(room.roomId).emit('room_updated', room);
        scheduleTurnTimeout(room);
        checkAndTriggerBotTurn(room);
      }
    }
    broadcastRoomsList();
  });
}

function startGameForRoom(room: GameState) {
  const deck = generateTileDeck(); // 106 tiles
  room.status = 'playing';
  room.board = [];
  room.winnerId = null;

  // Deal 14 tiles to each player
  const handsSnapshot: Record<string, Tile[]> = {};
  room.players.forEach((player, idx) => {
    player.hand = deck.splice(0, 14);
    player.hasMelded = false;
    player.isTurn = idx === 0;
    handsSnapshot[player.id] = [...player.hand];
  });

  room.tilePool = deck;
  room.currentTurnIndex = 0;
  room.turnStartTime = Date.now();
  room.boardInitialSnapshot = [];
  room.playerHandsSnapshot = handsSnapshot;
  room.lastActionText = `${room.players[0].nickname} 님의 차례입니다.`;

  io.to(room.roomId).emit('game_started', room);
  scheduleTurnTimeout(room);
  checkAndTriggerBotTurn(room);
  broadcastRoomsList();
}

function advanceTurn(room: GameState, actionText: string) {
  try {
    if (!room.players || room.players.length === 0) return;

    let nextIndex = (room.currentTurnIndex + 1) % room.players.length;
    if (isNaN(nextIndex) || nextIndex < 0 || nextIndex >= room.players.length) {
      nextIndex = 0;
    }

    room.players.forEach((p, idx) => {
      p.isTurn = idx === nextIndex;
    });

    room.currentTurnIndex = nextIndex;
    room.turnStartTime = Date.now();
    room.boardInitialSnapshot = JSON.parse(JSON.stringify(room.board || []));

    // Save hand snapshot for everyone
    const handsSnapshot: Record<string, Tile[]> = {};
    room.players.forEach((p) => {
      handsSnapshot[p.id] = JSON.parse(JSON.stringify(p.hand || []));
    });
    room.playerHandsSnapshot = handsSnapshot;

    const nextPlayerName = room.players[nextIndex]?.nickname || '다음 플레이어';
    room.lastActionText = `${actionText} ${nextPlayerName} 님의 차례입니다.`;

    io.to(room.roomId).emit('room_updated', room);
    scheduleTurnTimeout(room);
    checkAndTriggerBotTurn(room);
  } catch (err) {
    console.error('Error in advanceTurn:', err);
  }
}

function checkAndTriggerBotTurn(room: GameState) {
  if (botTurnTimeouts[room.roomId]) {
    clearTimeout(botTurnTimeouts[room.roomId]);
    delete botTurnTimeouts[room.roomId];
  }

  if (room.status !== 'playing' || !room.players || room.players.length === 0) return;

  if (room.currentTurnIndex < 0 || room.currentTurnIndex >= room.players.length) {
    room.currentTurnIndex = 0;
  }

  const currentPlayer = room.players[room.currentTurnIndex];
  if (!currentPlayer || !currentPlayer.isBot) return;

  // Bot makes move after a realistic human-like delay (1000ms - 1800ms)
  const delay = 1000 + Math.floor(Math.random() * 800);
  const turnStartTime = room.turnStartTime;

  botTurnTimeouts[room.roomId] = setTimeout(() => {
    try {
      const activeRoom = activeRooms[room.roomId];
      if (!activeRoom || activeRoom.status !== 'playing') return;
      if (activeRoom.turnStartTime !== turnStartTime) return;

      const activeBot = activeRoom.players[activeRoom.currentTurnIndex];
      if (!activeBot || activeBot.id !== currentPlayer.id) return;

      const botResult = executeBotTurn(activeBot, activeRoom);

      if (botResult.action === 'play') {
        if (!activeBot.hasMelded) {
          activeBot.hasMelded = true;
        }
        activeBot.hand = botResult.newHand;
        activeRoom.board = botResult.newBoard;

        // Check win
        if (activeBot.hand.length === 0) {
          finishGame(activeRoom, activeBot);
          return;
        }

        advanceTurn(activeRoom, botResult.actionText);
      } else {
        // Draw tile
        if (activeRoom.tilePool.length > 0) {
          const drawnTile = activeRoom.tilePool.pop()!;
          activeBot.hand.push(drawnTile);
          advanceTurn(activeRoom, `${activeBot.nickname} 님이 타일을 1개 가져왔습니다.`);
        } else {
          const winner = getLowestTileCountPlayer(activeRoom);
          finishGame(
            activeRoom,
            winner,
            `타일 더미가 모두 소진되어 남은 타일 수가 가장 적은 ${winner.nickname} 님이 승리하였습니다!`
          );
        }
      }
    } catch (botErr) {
      console.error('Error in bot turn execution:', botErr);
      const activeRoom = activeRooms[room.roomId];
      if (activeRoom && activeRoom.status === 'playing') {
        handleTurnTimeout(activeRoom, `${currentPlayer.nickname} 님이 타일을 1개 가져왔습니다.`);
      }
    }
  }, delay);
}

function handleTurnTimeout(room: GameState, reason?: string) {
  try {
    if (room.status !== 'playing' || !room.players || room.players.length === 0) return;

    if (room.currentTurnIndex < 0 || room.currentTurnIndex >= room.players.length) {
      room.currentTurnIndex = 0;
    }

    const currentPlayer = room.players[room.currentTurnIndex];
    if (!currentPlayer) return;

    // Reset board & current player hand to snapshot if they made unsubmitted changes
    room.board = JSON.parse(JSON.stringify(room.boardInitialSnapshot || []));
    if (room.playerHandsSnapshot && room.playerHandsSnapshot[currentPlayer.id]) {
      currentPlayer.hand = JSON.parse(JSON.stringify(room.playerHandsSnapshot[currentPlayer.id]));
    }

    if (room.tilePool.length > 0) {
      const drawnTile = room.tilePool.pop()!;
      currentPlayer.hand.push(drawnTile);
      advanceTurn(room, reason || `${currentPlayer.nickname} 님이 시간 초과로 타일을 1개 가져왔습니다.`);
    } else {
      const winner = getLowestTileCountPlayer(room);
      finishGame(
        room,
        winner,
        `타일 더미가 모두 소진되어 남은 타일 수가 가장 적은 ${winner.nickname} 님이 승리하였습니다!`
      );
    }
  } catch (err) {
    console.error('Error in handleTurnTimeout:', err);
  }
}

function scheduleTurnTimeout(room: GameState) {
  if (turnTimeouts[room.roomId]) {
    clearTimeout(turnTimeouts[room.roomId]);
    delete turnTimeouts[room.roomId];
  }

  if (room.status !== 'playing') return;

  const limitMs = (room.settings.turnTimeLimit || 30) * 1000 + 300;
  const turnStartTime = room.turnStartTime;

  turnTimeouts[room.roomId] = setTimeout(() => {
    const activeRoom = activeRooms[room.roomId];
    if (!activeRoom || activeRoom.status !== 'playing') return;
    if (activeRoom.turnStartTime !== turnStartTime) return;

    handleTurnTimeout(activeRoom);
  }, limitMs);
}

// Watchdog interval: Check active rooms every 1 second to ensure no turn gets stuck past time limit
setInterval(() => {
  const now = Date.now();
  Object.values(activeRooms).forEach((room) => {
    if (room.status === 'playing') {
      const limitMs = (room.settings.turnTimeLimit || 30) * 1000;
      if (now - room.turnStartTime >= limitMs + 1000) {
        handleTurnTimeout(room);
      }
    }
  });
}, 1000);

function getLowestTileCountPlayer(room: GameState): Player {
  if (room.players.length === 0) return room.players[0];
  let bestWinner = room.players[0];
  for (let i = 1; i < room.players.length; i++) {
    const p = room.players[i];
    if (p.hand.length < bestWinner.hand.length) {
      bestWinner = p;
    } else if (p.hand.length === bestWinner.hand.length) {
      const scoreP = p.hand.reduce((sum, t) => sum + (t.isJoker ? 30 : t.number), 0);
      const scoreBest = bestWinner.hand.reduce((sum, t) => sum + (t.isJoker ? 30 : t.number), 0);
      if (scoreP < scoreBest) {
        bestWinner = p;
      }
    }
  }
  return bestWinner;
}

function finishGame(room: GameState, winner: Player, customReason?: string, leftPlayer?: Player) {
  clearRoomTimers(room.roomId);
  room.status = 'ended';
  room.winnerId = winner.id;

  const finalScores: Record<string, number> = {};
  let totalPenaltyPoints = 0;

  room.players.forEach((p) => {
    if (p.id === winner.id) return;
    // Calculate penalty: sum of tiles in hand (Joker = -30 points)
    const penalty = p.hand.reduce((sum, tile) => sum + (tile.isJoker ? 30 : tile.number), 0);
    finalScores[p.id] = -penalty;
    totalPenaltyPoints += penalty;
  });

  if (leftPlayer) {
    const penalty = leftPlayer.hand ? leftPlayer.hand.reduce((sum, tile) => sum + (tile.isJoker ? 30 : tile.number), 0) : 30;
    const forfeitPenalty = Math.max(penalty, 30);
    finalScores[leftPlayer.id] = -forfeitPenalty;
    totalPenaltyPoints += forfeitPenalty;
  }

  finalScores[winner.id] = totalPenaltyPoints;
  room.finalScores = finalScores;
  room.lastActionText = customReason || `🎉 ${winner.nickname} 님이 승리하였습니다!`;

  // Create record
  const record: GameRecord = {
    id: `rec-${Date.now()}`,
    date: new Date().toLocaleDateString('ko-KR'),
    roomId: room.roomId,
    playersCount: room.players.length + (leftPlayer ? 1 : 0),
    winnerName: winner.nickname,
    userScore: totalPenaltyPoints,
    durationSeconds: Math.floor((Date.now() - room.turnStartTime) / 1000),
    myRank: 1,
  };
  gameRecordsStore.unshift(record);

  io.to(room.roomId).emit('game_ended', { room, winner, finalScores });
  io.to(room.roomId).emit('room_updated', room);
  broadcastRoomsList();
}

function broadcastRoomsList() {
  const roomsList = Object.values(activeRooms)
    .filter((r) => r.status === 'waiting')
    .map((r) => ({
      roomId: r.roomId,
      playersCount: r.players.length,
      maxPlayers: r.settings.maxPlayers,
      hostName: r.players.find((p) => p.isHost)?.nickname || 'Host',
      status: r.status,
    }));
  io.emit('rooms_list_update', roomsList);
}

function isSameSet(setA: TileSet, setB: TileSet): boolean {
  if (setA.length !== setB.length) return false;
  const idsA = setA.map((t) => t.id).sort().join(',');
  const idsB = setB.map((t) => t.id).sort().join(',');
  return idsA === idsB;
}

// Start Server with Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
