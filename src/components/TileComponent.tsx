import React from 'react';
import { motion } from 'motion/react';
import { Tile, ThemeMode } from '../types/game';

interface TileComponentProps {
  tile: Tile;
  theme: ThemeMode;
  isSelected?: boolean;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const TileComponent: React.FC<TileComponentProps> = ({
  tile,
  theme,
  isSelected = false,
  onClick,
  draggable = true,
  onDragStart,
  size = 'md',
}) => {
  const isDefault = theme === 'default';

  // Get color code for numbers & dots
  const getColorHex = () => {
    switch (tile.color) {
      case 'red':
        return isDefault ? '#C76455' : '#EF4444';
      case 'blue':
        return isDefault ? '#2563EB' : '#1D4ED8';
      case 'yellow':
        return isDefault ? '#D97706' : '#D97706';
      case 'black':
      default:
        return isDefault ? '#111111' : '#0F172A';
    }
  };

  const sizeClasses = {
    sm: 'w-9 h-13 text-xs rounded-xl',
    md: 'w-12 h-16 text-base rounded-2xl',
    lg: 'w-14 h-20 text-xl rounded-2xl',
  };

  const sizeDimensions = sizeClasses[size];

  return (
    <motion.div
      whileHover={{ scale: 1.08, y: -4 }}
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      className={`relative cursor-pointer select-none flex flex-col items-center justify-between p-1.5 transition-all font-black ${sizeDimensions} ${
        isSelected
          ? isDefault
            ? 'ring-4 ring-[#D9A63B] shadow-2xl -translate-y-1.5'
            : 'ring-4 ring-[#FFFFFF] shadow-2xl -translate-y-1.5 scale-105'
          : ''
      } ${
        isDefault
          ? 'plush-tile text-[#111111]'
          : 'glass-tile text-[#222222]'
      }`}
      style={{
        touchAction: 'manipulation',
      }}
    >
      {/* Top indicator dot or water shine */}
      <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: getColorHex() }} />

      {/* Main Tile Value or Cat Joker */}
      {tile.isJoker ? (
        <div className="flex flex-col items-center justify-center my-auto w-full h-full">
          <div className="relative w-full h-full max-w-[85%] max-h-[85%] rounded-full overflow-hidden border-2 border-[#D9A63B] shadow-md bg-amber-50">
            <img
              src="/joker_cat.png"
              alt="Joker Cat"
              className="w-full h-full object-cover transform scale-110"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <span className="text-[9px] leading-none font-black tracking-tighter text-[#D9A63B] mt-0.5">
            JOKER
          </span>
        </div>
      ) : (
        <div
          className={`my-auto font-black tracking-tighter ${
            isDefault ? 'embroidered-text' : 'drop-shadow-[0_2px_4px_rgba(255,255,255,0.9)]'
          }`}
          style={{ color: getColorHex() }}
        >
          {tile.number}
        </div>
      )}

      {/* Bottom Color Bar / Pill */}
      <div
        className="w-full h-1.5 rounded-full shadow-inner"
        style={{ backgroundColor: getColorHex() }}
      />
    </motion.div>
  );
};
