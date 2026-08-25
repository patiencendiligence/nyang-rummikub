import { Tile, TileSet, Player, GameState, TileColor } from '../types/game';
import { isValidSet, getSetPoints, isValidGroup, isValidRun } from './rummikubEngine';

export interface BotTurnResult {
  action: 'play' | 'draw';
  newBoard: TileSet[];
  newHand: Tile[];
  actionText: string;
}

/**
 * Finds all candidate valid sets (groups and runs) that can be formed from a given hand.
 */
export function findAllValidSetsFromHand(hand: Tile[]): TileSet[] {
  const candidateSets: TileSet[] = [];
  const jokers = hand.filter((t) => t.isJoker);
  const nonJokers = hand.filter((t) => !t.isJoker);

  // 1. Groups (Same number, different colors, 3 or 4 tiles)
  for (let num = 1; num <= 13; num++) {
    const tilesWithNum = nonJokers.filter((t) => t.number === num);
    // Distinct colors
    const byColor: Record<TileColor, Tile[]> = { red: [], blue: [], yellow: [], black: [] };
    tilesWithNum.forEach((t) => byColor[t.color].push(t));

    const distinctColorTiles = Object.values(byColor)
      .filter((arr) => arr.length > 0)
      .map((arr) => arr[0]);

    // 3 distinct colors without joker
    if (distinctColorTiles.length >= 3) {
      // 3-combinations
      for (let i = 0; i < distinctColorTiles.length; i++) {
        for (let j = i + 1; j < distinctColorTiles.length; j++) {
          for (let k = j + 1; k < distinctColorTiles.length; k++) {
            const set = [distinctColorTiles[i], distinctColorTiles[j], distinctColorTiles[k]];
            if (isValidGroup(set)) candidateSets.push(set);
          }
        }
      }
    }

    // 4 distinct colors without joker
    if (distinctColorTiles.length === 4) {
      if (isValidGroup(distinctColorTiles)) candidateSets.push([...distinctColorTiles]);
    }

    // 2 distinct colors + 1 joker
    if (jokers.length >= 1 && distinctColorTiles.length >= 2) {
      for (let i = 0; i < distinctColorTiles.length; i++) {
        for (let j = i + 1; j < distinctColorTiles.length; j++) {
          const set = [distinctColorTiles[i], distinctColorTiles[j], jokers[0]];
          if (isValidGroup(set)) candidateSets.push(set);
        }
      }
    }

    // 3 distinct colors + 1 joker
    if (jokers.length >= 1 && distinctColorTiles.length === 3) {
      const set = [...distinctColorTiles, jokers[0]];
      if (isValidGroup(set)) candidateSets.push(set);
    }
  }

  // 2. Runs (Same color, consecutive numbers, 3+ tiles)
  const colors: TileColor[] = ['red', 'blue', 'yellow', 'black'];
  for (const color of colors) {
    const colorTiles = nonJokers.filter((t) => t.color === color);
    const byNumber: Record<number, Tile[]> = {};
    colorTiles.forEach((t) => {
      if (!byNumber[t.number]) byNumber[t.number] = [];
      byNumber[t.number].push(t);
    });

    // Check possible runs of length 3, 4, 5
    for (let start = 1; start <= 11; start++) {
      for (let len = 3; len <= 5; len++) {
        const end = start + len - 1;
        if (end > 13) continue;

        // Try without joker
        let validRunTiles: Tile[] = [];
        let missingCount = 0;
        for (let n = start; n <= end; n++) {
          if (byNumber[n] && byNumber[n].length > 0) {
            validRunTiles.push(byNumber[n][0]);
          } else {
            missingCount++;
          }
        }

        if (missingCount === 0) {
          if (isValidRun(validRunTiles)) candidateSets.push([...validRunTiles]);
        } else if (missingCount <= jokers.length) {
          // Fill missing with jokers
          const runWithJokers = [...validRunTiles];
          for (let ji = 0; ji < missingCount; ji++) {
            runWithJokers.push(jokers[ji]);
          }
          if (isValidRun(runWithJokers)) candidateSets.push(runWithJokers);
        }
      }
    }
  }

  return candidateSets;
}

/**
 * Finds the optimal disjoint collection of sets from candidate sets.
 */
export function findBestDisjointSets(candidateSets: TileSet[]): TileSet[] {
  if (candidateSets.length === 0) return [];

  let bestSets: TileSet[] = [];
  let maxPoints = 0;

  function isDisjoint(chosen: TileSet[], candidate: TileSet): boolean {
    const usedIds = new Set(chosen.flatMap((s) => s.map((t) => t.id)));
    return candidate.every((t) => !usedIds.has(t.id));
  }

  function search(index: number, current: TileSet[]) {
    const totalPoints = current.reduce((sum, s) => sum + getSetPoints(s), 0);
    if (totalPoints > maxPoints || (totalPoints === maxPoints && current.length > bestSets.length)) {
      maxPoints = totalPoints;
      bestSets = [...current];
    }

    for (let i = index; i < candidateSets.length; i++) {
      if (isDisjoint(current, candidateSets[i])) {
        current.push(candidateSets[i]);
        search(i + 1, current);
        current.pop();
      }
    }
  }

  // Sort candidate sets by points descending
  const sorted = [...candidateSets].sort((a, b) => getSetPoints(b) - getSetPoints(a));
  search(0, []);

  return bestSets;
}

/**
 * Executes a full turn for a Bot Player.
 */
export function executeBotTurn(botPlayer: Player, gameState: GameState): BotTurnResult {
  const hand = [...botPlayer.hand];
  const board = JSON.parse(JSON.stringify(gameState.board)) as TileSet[];
  const initialMeldPoints = gameState.settings.initialMeldPoints || 30;

  // Case 1: Initial meld required
  if (!botPlayer.hasMelded) {
    const candidateSets = findAllValidSetsFromHand(hand);
    const disjointSets = findBestDisjointSets(candidateSets);
    const totalPoints = disjointSets.reduce((sum, s) => sum + getSetPoints(s), 0);

    if (totalPoints >= initialMeldPoints) {
      const usedIds = new Set(disjointSets.flatMap((s) => s.map((t) => t.id)));
      const newHand = hand.filter((t) => !usedIds.has(t.id));
      const newBoard = [...board, ...disjointSets];

      return {
        action: 'play',
        newBoard,
        newHand,
        actionText: `${botPlayer.nickname} 님이 ${totalPoints}점으로 첫 등록을 마쳤습니다!`,
      };
    }

    // Cannot make 30 points -> Draw a tile
    return {
      action: 'draw',
      newBoard: board,
      newHand: hand,
      actionText: `${botPlayer.nickname} 님이 타일을 1개 가져왔습니다.`,
    };
  }

  // Case 2: Already melded -> Can add to existing board sets OR play new sets from hand
  let currentBoard: TileSet[] = JSON.parse(JSON.stringify(board));
  let currentHand: Tile[] = [...hand];
  let playedAny = false;

  // 1) Try attaching tiles from hand to existing board sets
  for (let sIdx = 0; sIdx < currentBoard.length; sIdx++) {
    const targetSet = currentBoard[sIdx];

    for (let hIdx = currentHand.length - 1; hIdx >= 0; hIdx--) {
      const tile = currentHand[hIdx];

      // Try appending tile to end
      const appended = [...targetSet, tile];
      if (isValidSet(appended)) {
        currentBoard[sIdx] = appended;
        currentHand.splice(hIdx, 1);
        playedAny = true;
        continue;
      }

      // Try prepending tile to start
      const prepended = [tile, ...targetSet];
      if (isValidSet(prepended)) {
        currentBoard[sIdx] = prepended;
        currentHand.splice(hIdx, 1);
        playedAny = true;
        continue;
      }

      // Try sorting if run or group
      const sorted = [...targetSet, tile].sort((a, b) => a.number - b.number);
      if (isValidSet(sorted)) {
        currentBoard[sIdx] = sorted;
        currentHand.splice(hIdx, 1);
        playedAny = true;
        continue;
      }
    }
  }

  // 2) Try making new valid sets from remaining hand
  const candidateSets = findAllValidSetsFromHand(currentHand);
  const disjointSets = findBestDisjointSets(candidateSets);

  if (disjointSets.length > 0) {
    const usedIds = new Set(disjointSets.flatMap((s) => s.map((t) => t.id)));
    currentHand = currentHand.filter((t) => !usedIds.has(t.id));
    currentBoard = [...currentBoard, ...disjointSets];
    playedAny = true;
  }

  // If played at least one tile
  if (playedAny && currentHand.length < hand.length) {
    const tilesPlayedCount = hand.length - currentHand.length;
    return {
      action: 'play',
      newBoard: currentBoard,
      newHand: currentHand,
      actionText: `${botPlayer.nickname} 님이 타일 ${tilesPlayedCount}개를 내려놓았습니다.`,
    };
  }

  // Cannot play anything -> Draw tile
  return {
    action: 'draw',
    newBoard: board,
    newHand: hand,
    actionText: `${botPlayer.nickname} 님이 타일을 1개 가져왔습니다.`,
  };
}
