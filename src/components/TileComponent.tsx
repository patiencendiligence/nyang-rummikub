import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Tile, ThemeMode } from '../types/game';

interface TileComponentProps {
  tile: Tile;
  theme: ThemeMode;
  isSelected?: boolean;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onLongPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const TileComponent: React.FC<TileComponentProps> = ({
  tile,
  theme,
  isSelected = false,
  onClick,
  draggable = true,
  onDragStart,
  onLongPress,
  size = 'md',
}) => {
  const isDefault = theme === 'default';

  // Get color code for numbers & dots
  const getColorHex = () => {
    switch (tile.color) {
      case 'red':
        return isDefault ? '#c75575' : '#ff0000';
      case 'blue':
        return isDefault ? '#2563EB' : '#1D4ED8';
      case 'yellow':
        return isDefault ? '#e7b605' : '#ffd000';
      case 'black':
      default:
        return isDefault ? '#111111' : '#0F172A';
    }
  };

  const sizeClasses = {
    xs: 'w-4 h-6 text-[7px] rounded-sm',
    sm: 'w-[20px] h-[30px] sm:w-[30px] sm:h-[44px] text-[8px] sm:text-[11px] rounded-sm sm:rounded-lg',
    md: 'w-[24px] h-[36px] sm:w-[38px] sm:h-[54px] text-[9px] sm:text-sm rounded-md sm:rounded-xl',
    lg: 'w-[30px] h-[44px] sm:w-[46px] sm:h-[64px] text-[11px] sm:text-base rounded-lg sm:rounded-xl',
  };

  const sizeDimensions = sizeClasses[size];
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClick = useRef(false);

  const clearLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };

  const handlePointerDown = () => {
    if (!onLongPress) return;
    suppressClick.current = false;
    longPressTimer.current = setTimeout(() => {
      suppressClick.current = true;
      onLongPress();
    }, 500);
  };

  const handleClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    onClick?.();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.08, y: -2 }}
      whileTap={{ scale: 0.93 }}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={clearLongPress}
      onPointerCancel={clearLongPress}
      onPointerLeave={clearLongPress}
      draggable={draggable}
      onDragStart={onDragStart}
      className={`relative cursor-pointer select-none flex flex-col items-center justify-between p-0.5 sm:p-1 transition-all font-black ${sizeDimensions} ${
        isSelected
          ? isDefault
            ? 'ring-2 sm:ring-4 ring-[#D9A63B] shadow-xl -translate-y-1'
            : 'ring-2 sm:ring-4 ring-[#FFFFFF] shadow-xl -translate-y-1 scale-105'
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
      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shadow-sm" style={{ backgroundColor: getColorHex() }} />

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
