import React from 'react';
import { TileSet, Tile, ThemeMode } from '../../types/game';
import { TileComponent } from '../TileComponent';
import { isValidSet } from '../../utils/rummikubEngine';

interface BoardAreaProps {
  board: TileSet[];
  theme: ThemeMode;
  selectedTile: Tile | null;
  isMyTurn: boolean;
  onPlaceTileToSet: (setIndex: number) => void;
  onCreateNewSetWithTile: () => void;
  onTileClickOnBoard: (setIndex: number, tileIndex: number) => void;
  onDropTileToSet: (setIndex: number, tileId: string) => void;
  onDropTileToNewSet: (tileId: string) => void;
  invalidSetCount: number;
}

export const BoardArea: React.FC<BoardAreaProps> = ({
  board,
  theme,
  selectedTile,
  isMyTurn,
  onPlaceTileToSet,
  onCreateNewSetWithTile,
  onTileClickOnBoard,
  onDropTileToSet,
  onDropTileToNewSet,
  invalidSetCount,
}) => {
  const isDefault = theme === 'default';

  return (
    <div
      className={`w-full h-full p-2 sm:p-3 flex flex-col justify-between relative transition-all overflow-hidden rounded-[15px] ${
        isDefault
          ? 'plush-cushion'
          : 'rain-glass-card glass-shine'
      }`}
    >
      {invalidSetCount > 0 && (
        <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider opacity-80 mb-1 flex items-center justify-between shrink-0">
          <span className="text-red-600 font-black animate-pulse">
            무효 조합 {invalidSetCount}개
          </span>
        </div>
      )}

      {/* Board Sets Grid */}
      <div
        className="flex-1 min-h-0 flex flex-wrap content-start gap-1 sm:gap-2 overflow-y-auto pb-2 rounded-[15px]"
        onClick={() => selectedTile && onCreateNewSetWithTile()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const tileId = event.dataTransfer.getData('text/tile-id');
          if (tileId) onDropTileToNewSet(tileId);
        }}
      >
        {board.length === 0 ? (
          isMyTurn ? (
            <div className="w-full h-full min-h-[180px] my-auto flex items-center justify-center border border-dashed border-[#2D323E]/40 rounded-[15px] text-center opacity-80 py-6">
              <p className="text-xs sm:text-sm font-black text-[#2D323E]">여기에 타일 놓기</p>
            </div>
          ) : (
            <div className="w-full my-auto text-center opacity-70 py-6">
              <p className="text-xs sm:text-sm font-black">테이블에 배치된 타일 조합이 없습니다.</p>
              <p className="text-[10px] sm:text-xs font-bold mt-0.5">
                손에 있는 타일(3개 이상 올바른 조합 또는 30점 이상)을 등록해 보세요!
              </p>
            </div>
          )
        ) : (
          board.map((set, setIndex) => {
            const valid = isValidSet(set);

            return (
              <div
                key={`set-${setIndex}`}
                onClick={(event) => {
                  event.stopPropagation();
                  if (selectedTile) onPlaceTileToSet(setIndex);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const tileId = event.dataTransfer.getData('text/tile-id');
                  if (tileId) onDropTileToSet(setIndex, tileId);
                }}
                className={`p-0.5 sm:p-1 flex items-center gap-0.5 transition-all ${
                  valid
                    ? isDefault
                      ? 'plush-tile !rounded-[5px]'
                      : 'glass-capsule text-[#1E3A8A] !rounded-[5px]'
                    : 'bg-red-100 border border-red-500 rounded-[5px] text-red-700 animate-pulse'
                }`}
              >
                {set.map((tile, tileIndex) => (
                  <TileComponent
                    key={tile.id}
                    tile={tile}
                    theme={theme}
                    size="sm"
                    onClick={() => onTileClickOnBoard(setIndex, tileIndex)}
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/tile-id', tile.id);
                      event.dataTransfer.setData('text/tile-source', 'board');
                    }}
                  />
                ))}

                {!valid && (
                  <span className="text-[9px] font-black text-red-600 px-0.5">
                    [무효]
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
