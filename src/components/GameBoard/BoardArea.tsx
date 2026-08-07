import React from 'react';
import { TileSet, Tile, ThemeMode } from '../../types/game';
import { TileComponent } from '../TileComponent';
import { isValidSet } from '../../utils/rummikubEngine';
import { Plus } from 'lucide-react';

interface BoardAreaProps {
  board: TileSet[];
  theme: ThemeMode;
  selectedTile: Tile | null;
  onPlaceTileToSet: (setIndex: number) => void;
  onCreateNewSetWithTile: () => void;
  onTileClickOnBoard: (setIndex: number, tileIndex: number) => void;
}

export const BoardArea: React.FC<BoardAreaProps> = ({
  board,
  theme,
  selectedTile,
  onPlaceTileToSet,
  onCreateNewSetWithTile,
  onTileClickOnBoard,
}) => {
  const isDefault = theme === 'default';

  return (
    <div
      className={`w-full h-full min-h-[340px] sm:min-h-[420px] p-3 sm:p-5 flex flex-col justify-between relative transition-all ${
        isDefault
          ? 'plush-cushion'
          : 'rain-glass-card glass-shine'
      }`}
    >
      <div className="text-[11px] font-black uppercase tracking-wider opacity-80 mb-2 flex items-center justify-between">
        <span className={isDefault ? 'embroidered-text' : ''}>
          테이블 타일 조합 ({board.length}개 조합)
        </span>
        {selectedTile && (
          <span className="text-[#D9A63B] font-black animate-pulse">
            선택된 타일을 배치할 영역이나 새 조합 영역을 터치하세요!
          </span>
        )}
      </div>

      {/* Board Sets Grid */}
      <div className="flex-1 flex flex-wrap content-start gap-2.5 sm:gap-3 min-h-[280px] overflow-y-auto pb-6">
        {board.length === 0 ? (
          <div className="w-full my-auto text-center opacity-70 py-12">
            <p className="text-sm font-black">테이블에 배치된 타일 조합이 없습니다.</p>
            <p className="text-xs font-bold mt-1">
              손에 있는 타일(3개 이상 올바른 조합 또는 30점 이상)을 등록해 보세요!
            </p>
          </div>
        ) : (
          board.map((set, setIndex) => {
            const valid = isValidSet(set);

            return (
              <div
                key={`set-${setIndex}`}
                onClick={() => selectedTile && onPlaceTileToSet(setIndex)}
                className={`p-2 flex items-center gap-1 transition-all ${
                  valid
                    ? isDefault
                      ? 'plush-tile !rounded-2xl'
                      : 'glass-capsule text-[#1E3A8A]'
                    : 'bg-red-100 border-2 border-red-500 rounded-2xl text-red-700 animate-pulse'
                }`}
              >
                {set.map((tile, tileIndex) => (
                  <TileComponent
                    key={tile.id}
                    tile={tile}
                    theme={theme}
                    size="sm"
                    onClick={() => onTileClickOnBoard(setIndex, tileIndex)}
                  />
                ))}

                {!valid && (
                  <span className="text-[10px] font-black text-red-600 px-1">
                    [무효]
                  </span>
                )}
              </div>
            );
          })
        )}

        {/* Drop zone to create a brand new set */}
        {selectedTile && (
          <button
            onClick={onCreateNewSetWithTile}
            className={`p-3 rounded-2xl border-2 border-dashed flex items-center justify-center gap-1.5 font-black text-xs transition-all ${
              isDefault
                ? 'border-[#356C63] text-[#356C63] bg-[#F4F0E6] hover:bg-[#356C63] hover:text-white'
                : 'border-white text-white glass-gel-btn'
            }`}
          >
            <Plus className="w-4 h-4" /> 새 조합으로 등록
          </button>
        )}
      </div>
    </div>
  );
};
