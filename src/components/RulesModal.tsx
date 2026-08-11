import React from 'react';
import { BookOpen, X, Check, AlertTriangle } from 'lucide-react';
import { ThemeMode } from '../types/game';
import { useLanguage } from '../constants/language';

interface RulesModalProps {
  theme: ThemeMode;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ theme, onClose }) => {
  const isDefault = theme === 'default';
  const { language } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-2xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-hidden transition-all ${
          isDefault
            ? 'plush-cushion text-[#111111]'
            : 'rain-glass-card glass-shine text-[#222222]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#356C63]" />
            <h3 className={`text-lg font-black tracking-tight ${isDefault ? 'embroidered-text' : ''}`}>
              {language === 'ko' ? '루미큐브 공식 게임 룰 가이드' : 'Official Rummikub rules'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-black/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 text-xs leading-relaxed pr-1">
          {/* Tile Composition */}
          <div
            className={`p-4 transition-all ${
              isDefault ? 'plush-tile' : 'glass-capsule text-[#222222]'
            }`}
          >
            <h4 className="font-black text-sm mb-1 text-[#356C63] flex items-center gap-1.5">
              <Check className="w-4 h-4" /> 1. {language === 'ko' ? '타일 구성 (총 106개)' : 'Tile set (106 tiles)'}
            </h4>
            <p className="font-extrabold">
              {language === 'ko' ? '• 숫자 타일 104개: 4가지 색상의 1~13번 타일이 각각 2세트씩 존재합니다.' : '• 104 number tiles: two sets of numbers 1-13 in four colors.'}
            </p>
            <p className="mt-1 font-black text-[#D9A63B]">
              {language === 'ko' ? '• 고양이 조커 타일 2개: 어떤 색상/숫자로든 자유롭게 대체 사용 가능합니다!' : '• 2 cat joker tiles: jokers can replace any color or number!'}
            </p>
          </div>

          {/* Valid Sets */}
          <div
            className={`p-4 transition-all ${
              isDefault ? 'plush-tile' : 'glass-capsule text-[#222222]'
            }`}
          >
            <h4 className="font-black text-sm mb-1 text-[#356C63] flex items-center gap-1.5">
              <Check className="w-4 h-4" /> 2. {language === 'ko' ? '타일 조합의 종류 (최소 3개 이상)' : 'Valid sets (at least 3 tiles)'}
            </h4>
            <div className="space-y-2 mt-2">
              <div className="p-2.5 rounded-xl bg-black/5 font-bold">
                <strong className="block text-[#4B4E86]">■ Group (기둥/그룹):</strong>
                {language === 'ko' ? '숫자는 같고 색상은 모두 다른 3개 또는 4개의 조합입니다.' : 'Three or four tiles with the same number and different colors.'}
              </div>
              <div className="p-2.5 rounded-xl bg-black/5 font-bold">
                <strong className="block text-[#356C63]">■ Run (연속/런):</strong>
                {language === 'ko' ? '같은 색상의 연속된 숫자 3개 이상 조합입니다.' : 'Three or more consecutive numbers in the same color.'}
              </div>
            </div>
          </div>

          {/* Initial Meld 30 points rule */}
          <div
            className={`p-4 transition-all ${
              isDefault ? 'plush-tile' : 'glass-capsule text-[#222222]'
            }`}
          >
            <h4 className="font-black text-sm mb-1 text-[#C76455] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> 3. {language === 'ko' ? '첫 등록 규칙' : 'Initial meld rule'}
            </h4>
            <p className="font-extrabold">
              {language === 'ko' ? '• 첫 제출은 손타일만 사용해 합이 30점 이상인 올바른 조합이어야 합니다.' : '• Your first play must be valid sets totaling at least 30 points using only tiles from your hand.'}
            </p>
            <p className="mt-1 font-bold">
              {language === 'ko' ? '• 첫 등록 전에는 바닥 타일을 재배치할 수 없습니다. 등록하지 못하면 타일 1개를 가져옵니다.' : '• Before your initial meld, you cannot rearrange tiles on the table. Draw one tile if you cannot play.'}
            </p>
          </div>

          {/* Re-arranging */}
          <div
            className={`p-4 transition-all ${
              isDefault ? 'plush-tile' : 'glass-capsule text-[#222222]'
            }`}
          >
            <h4 className="font-black text-sm mb-1 text-[#356C63] flex items-center gap-1.5">
              <Check className="w-4 h-4" /> 4. {language === 'ko' ? '바닥 타일 재배치 및 승리 조건' : 'Rearranging tiles and winning'}
            </h4>
            <p className="font-extrabold">
              {language === 'ko' ? '• 첫 등록 후에는 매 턴 바닥 타일을 재배치해 새로운 조합을 만들 수 있습니다.' : '• After your initial meld, rearrange table tiles each turn to create new valid sets.'}
            </p>
            <p className="mt-1 font-black">
              {language === 'ko' ? '• 손의 모든 타일을 가장 먼저 비운 플레이어가 승리합니다!' : '• The first player to empty their rack wins (Rummikub!).'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className={`w-full py-3 rounded-2xl font-black text-xs text-white ${
            isDefault ? 'bg-[#356C63]' : 'glass-gel-btn'
          }`}
        >
          {language === 'ko' ? '이해했습니다' : 'Got it'}
        </button>
      </div>
    </div>
  );
};
