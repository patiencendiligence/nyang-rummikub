import React from 'react';
import { Tile, ThemeMode } from '../../types/game';
import { TileComponent } from '../TileComponent';
import { sortHand } from '../../utils/rummikubEngine';

interface PlayerHandAreaProps {
  hand: Tile[];
  theme: ThemeMode;
  selectedTile: Tile | null;
  onSelectTile: (tile: Tile) => void;
  onSetHand: (sortedHand: Tile[]) => void;
  isMyTurn: boolean;
  compact?: boolean;
}

export const PlayerHandArea: React.FC<PlayerHandAreaProps> = ({
  hand,
  theme,
  selectedTile,
  onSelectTile,
  onSetHand,
  isMyTurn,
  compact = false,
}) => {
  const isDefault = theme === 'default';

  const handleSortByNumber = () => {
    onSetHand(sortHand(hand, 'number'));
  };

  const handleSortByColor = () => {
    onSetHand(sortHand(hand, 'color'));
  };

  return (
    <div className="w-full flex flex-col gap-1.5 transition-all">
      {/* Header bar (only if not compact) */}
      {!compact && (
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className={`font-black text-xs ${isDefault ? 'text-white' : 'text-[#1E3A8A]'}`}>
              내 타일 받침대
            </span>
            <span className="text-[11px] px-2 py-0.5 font-black rounded-full bg-amber-500 text-white shadow-sm">
              {hand.length}개
            </span>
            {isMyTurn && (
              <span className="text-[11px] font-black text-amber-300 animate-pulse">
                ★ 내 차례입니다!
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSortByNumber}
              className="px-2.5 py-1 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow transition-all active:scale-95"
            >
              789 (연속)
            </button>
            <button
              onClick={handleSortByColor}
              className="px-2.5 py-1 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow transition-all active:scale-95"
            >
              777 (그룹)
            </button>
          </div>
        </div>
      )}

      {/* Theme Cushion Hand Tray Body */}
      <div
        className={`w-full rounded-xl sm:rounded-2xl p-1 sm:p-2 relative flex flex-col justify-center min-h-[52px] sm:min-h-[80px] max-h-[85px] sm:max-h-[125px] overflow-hidden shadow-xl transition-all ${
          isDefault
            ? 'plush-cushion text-[#2D323E]'
            : 'rain-glass-card glass-shine text-[#1E3A8A]'
        }`}
      >
        <div className="text-[8px] sm:text-[10px] font-extrabold opacity-30 absolute top-0.5 right-2 tracking-widest pointer-events-none select-none">
          Rummikub
        </div>

        {/* Hand Tiles List */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 overflow-y-auto max-h-[75px] sm:max-h-[110px] pr-0.5 py-0.5">
          {hand.length === 0 ? (
            <div className="w-full text-center text-[10px] sm:text-xs font-black opacity-80 py-2">
              🎉 타일을 모두 사용했습니다! (승리 조건 충족)
            </div>
          ) : (
            hand.map((tile) => (
              <TileComponent
                key={tile.id}
                tile={tile}
                theme={theme}
                size={compact ? 'sm' : 'md'}
                isSelected={selectedTile?.id === tile.id}
                onClick={() => onSelectTile(tile)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

