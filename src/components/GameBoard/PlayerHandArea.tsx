import React, { useState } from 'react';
import { Tile, ThemeMode } from '../../types/game';
import { TileComponent } from '../TileComponent';
import { sortHand } from '../../utils/rummikubEngine';

interface PlayerHandAreaProps {
  hand: Tile[];
  theme: ThemeMode;
  selectedTile: Tile | null;
  onSelectTile: (tile: Tile) => void;
  onSetHand: (sortedHand: Tile[]) => void;
  onLongPressTile: (tile: Tile) => void;
  onDragStartTile: (tile: Tile, e: React.DragEvent) => void;
  onDropTile: (tileId: string, targetTileId?: string) => void;
  isMyTurn: boolean;
  compact?: boolean;
}

export const PlayerHandArea: React.FC<PlayerHandAreaProps> = ({
  hand,
  theme,
  selectedTile,
  onSelectTile,
  onSetHand,
  onLongPressTile,
  onDragStartTile,
  onDropTile,
  isMyTurn,
  compact = false,
}) => {
  const isDefault = theme === 'default';
  const [dragOverTileId, setDragOverTileId] = useState<string | null>(null);

  const handleSortByNumber = () => {
    onSetHand(sortHand(hand, 'number'));
  };

  const handleSortByColor = () => {
    onSetHand(sortHand(hand, 'color'));
  };

  return (
    <div className="w-full flex flex-col transition-all">
      {/* Theme Cushion Hand Tray Body */}
      <div
        className={`w-full rounded-[15px] p-1.5 sm:p-2 relative flex flex-col justify-center min-h-[108px] sm:min-h-[142px] md:min-h-[162px] max-h-[130px] sm:max-h-[165px] md:max-h-[185px] overflow-hidden shadow-xl transition-all ${
          isDefault
            ? 'plush-cushion text-[#2D323E]'
            : 'rain-glass-card glass-shine text-[#1E3A8A]'
        }`}
      >

        {/* Tray Background Drop Zone */}
        <div
          className="absolute inset-0 z-0"
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragOverTileId(null);
            const tileId = event.dataTransfer.getData('text/tile-id');
            if (tileId) onDropTile(tileId);
          }}
        />

        {/* Hand Tiles List */}
        <div className="relative z-10 flex flex-wrap items-center gap-1 sm:gap-1.5 overflow-y-auto min-h-[92px] max-h-[110px] sm:min-h-[130px] sm:max-h-[148px] md:min-h-[148px] md:max-h-[165px] px-1 py-1">
          {hand.length === 0 ? (
            <div className="w-full text-center text-[10px] sm:text-xs font-black opacity-80 py-2">
              🎉 타일을 모두 사용했습니다! (승리 조건 충족)
            </div>
          ) : (
            hand.map((tile) => {
              const isDragOverThis = dragOverTileId === tile.id;
              return (
                <div
                  key={tile.id}
                  className={`relative transition-all duration-150 rounded-lg ${
                    isDragOverThis
                      ? 'scale-110 ring-2 ring-amber-400 z-30 shadow-lg'
                      : ''
                  }`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    event.dataTransfer.dropEffect = 'move';
                    if (dragOverTileId !== tile.id) {
                      setDragOverTileId(tile.id);
                    }
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    if (dragOverTileId === tile.id) {
                      setDragOverTileId(null);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setDragOverTileId(null);
                    const draggedTileId = event.dataTransfer.getData('text/tile-id');
                    if (draggedTileId) {
                      onDropTile(draggedTileId, tile.id);
                    }
                  }}
                >
                  <TileComponent
                    tile={tile}
                    theme={theme}
                    size="md"
                    isSelected={selectedTile?.id === tile.id}
                    onClick={() => onSelectTile(tile)}
                    onLongPress={() => onLongPressTile(tile)}
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/tile-id', tile.id);
                      event.dataTransfer.setData('text/tile-source', 'hand');
                      onDragStartTile(tile, event);
                    }}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

