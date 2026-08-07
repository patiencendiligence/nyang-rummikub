import React from 'react';
import { ThemeMode } from '../types/game';

interface ThemeWrapperProps {
  theme: ThemeMode;
  children: React.ReactNode;
}

export const ThemeWrapper: React.FC<ThemeWrapperProps> = ({ theme, children }) => {
  const isDefault = theme === 'default';

  return (
    <div
      style={{
        backgroundColor: isDefault ? '#E6E9F0' : '#5A7CA8',
        color: '#222222',
      }}
      className={`min-h-screen w-full font-sans transition-colors duration-300 relative overflow-x-hidden ${
        isDefault
          ? 'felt-bg-texture selection:bg-[#e2e2e2] selection:text-white'
          : 'rain-glass-bg-texture selection:bg-[#2563EB] selection:text-white'
      }`}
    >
      {/* Background Ambient Layers */}
      {!isDefault && (
        /* Image 1: Water Glass Sky Blue Ambient Highlights */
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-[#FFFFFF] rounded-full blur-3xl opacity-60" />
          <div className="absolute top-1/3 -right-20 w-96 h-96 bg-[#3B82F6] rounded-full blur-3xl opacity-25" />
          <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-[#93C5FD] rounded-full blur-3xl opacity-40" />
        </div>
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
};
