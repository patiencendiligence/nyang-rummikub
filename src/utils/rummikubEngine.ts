import { Tile, TileColor, TileSet } from '../types/game';

// 104 numbered tiles (1-13 x 4 colors x 2 copies) + 2 Jokers = 106 tiles
export function generateTileDeck(): Tile[] {
  const colors: TileColor[] = ['red', 'blue', 'yellow', 'black'];
  const tiles: Tile[] = [];

  colors.forEach((color) => {
    for (let num = 1; num <= 13; num++) {
      // Copy 1
      tiles.push({
        id: `${color}-${num}-1`,
        number: num,
        color,
        isJoker: false,
      });
      // Copy 2
      tiles.push({
        id: `${color}-${num}-2`,
        number: num,
        color,
        isJoker: false,
      });
    }
  });

  // 2 Joker tiles
  tiles.push({
    id: 'joker-cat-1',
    number: 0,
    color: 'black',
    isJoker: true,
  });
  tiles.push({
    id: 'joker-cat-2',
    number: 0,
    color: 'red',
    isJoker: true,
  });

  return shuffleDeck(tiles);
}

export function shuffleDeck<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Checks if a set forms a valid Group:
 * - 3 or 4 tiles
 * - Same number (or Joker wildcards)
 * - All different colors
 */
export function isValidGroup(set: Tile[]): boolean {
  if (set.length < 3 || set.length > 4) return false;

  const nonJokers = set.filter((t) => !t.isJoker);
  if (nonJokers.length === 0) return true; // All jokers (rare, but valid)

  // All non-jokers must have the same number
  const targetNum = nonJokers[0].number;
  if (!nonJokers.every((t) => t.number === targetNum)) return false;

  // Colors of non-jokers must be distinct
  const colors = nonJokers.map((t) => t.color);
  const uniqueColors = new Set(colors);
  if (uniqueColors.size !== nonJokers.length) return false;

  return true;
}

/**
 * Checks if a set forms a valid Run:
 * - 3 or more tiles
 * - Same color
 * - Consecutive numbers
 */
export function isValidRun(set: Tile[]): boolean {
  if (set.length < 3 || set.length > 13) return false;

  const nonJokers = set.filter((t) => !t.isJoker);
  if (nonJokers.length === 0) return true; // All jokers

  // All non-jokers must have the same color
  const targetColor = nonJokers[0].color;
  if (!nonJokers.every((t) => t.color === targetColor)) return false;

  // Solve sequence with jokers
  return canFormRunSequence(set);
}

function canFormRunSequence(set: Tile[]): boolean {
  // Sort non-jokers by number
  const nonJokers = set.filter((t) => !t.isJoker).sort((a, b) => a.number - b.number);
  const jokerCount = set.filter((t) => t.isJoker).length;

  if (nonJokers.length === 0) return true;

  // Check if non-jokers contain duplicate numbers
  for (let i = 0; i < nonJokers.length - 1; i++) {
    if (nonJokers[i].number === nonJokers[i + 1].number) {
      return false; // Duplicate number in a run is invalid
    }
  }

  // Try all possible starting numbers for the run (between max(1, minNum - jokers) and minNum)
  const minNum = nonJokers[0].number;
  const maxNum = nonJokers[nonJokers.length - 1].number;

  const runLength = set.length;

  for (let start = Math.max(1, maxNum - runLength + 1); start <= minNum; start++) {
    const end = start + runLength - 1;
    if (end > 13) continue;

    // Check if all non-jokers fit in this sequence [start ... end]
    let jokersNeeded = 0;
    const nonJokerNums = new Set(nonJokers.map((t) => t.number));

    for (let num = start; num <= end; num++) {
      if (!nonJokerNums.has(num)) {
        jokersNeeded++;
      }
    }

    if (jokersNeeded <= jokerCount) {
      return true;
    }
  }

  return false;
}

export function isValidSet(set: Tile[]): boolean {
  if (set.length < 3) return false;
  return isValidGroup(set) || isValidRun(set);
}

/**
 * Calculates point value of a valid set.
 * If set contains a joker, resolves what number the joker represents.
 */
export function getSetPoints(set: Tile[]): number {
  if (!isValidSet(set)) return 0;

  if (isValidGroup(set)) {
    const nonJoker = set.find((t) => !t.isJoker);
    const num = nonJoker ? nonJoker.number : 13;
    return num * set.length;
  }

  // Run
  const nonJokers = set.filter((t) => !t.isJoker).sort((a, b) => a.number - b.number);
  const jokerCount = set.filter((t) => t.isJoker).length;

  if (nonJokers.length === 0) return 30; // Jokers default

  const minNum = nonJokers[0].number;
  const maxNum = nonJokers[nonJokers.length - 1].number;
  const runLength = set.length;

  for (let start = Math.max(1, maxNum - runLength + 1); start <= minNum; start++) {
    const end = start + runLength - 1;
    if (end > 13) continue;

    let jokersNeeded = 0;
    const nonJokerNums = new Set(nonJokers.map((t) => t.number));

    for (let num = start; num <= end; num++) {
      if (!nonJokerNums.has(num)) {
        jokersNeeded++;
      }
    }

    if (jokersNeeded <= jokerCount) {
      // Sum numbers from start to end
      let sum = 0;
      for (let num = start; num <= end; num++) sum += num;
      return sum;
    }
  }

  // Fallback
  return set.reduce((sum, t) => sum + (t.isJoker ? 10 : t.number), 0);
}

export function sortHand(hand: Tile[], by: 'color' | 'number'): Tile[] {
  const colorOrder: Record<TileColor, number> = {
    red: 1,
    blue: 2,
    yellow: 3,
    black: 4,
  };

  return [...hand].sort((a, b) => {
    if (a.isJoker && !b.isJoker) return 1;
    if (!a.isJoker && b.isJoker) return -1;
    if (a.isJoker && b.isJoker) return 0;

    if (by === 'number') {
      if (a.number !== b.number) return a.number - b.number;
      return colorOrder[a.color] - colorOrder[b.color];
    } else {
      // By color
      if (a.color !== b.color) return colorOrder[a.color] - colorOrder[b.color];
      return a.number - b.number;
    }
  });
}
