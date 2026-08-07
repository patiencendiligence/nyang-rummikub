import React from 'react';
import { BookOpen, X, Check, AlertTriangle } from 'lucide-react';
import { ThemeMode } from '../types/game';

interface RulesModalProps {
  theme: ThemeMode;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ theme, onClose }) => {
  const isDefault = theme === 'default';

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
              루미큐브 공식 게임 룰 가이드
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
              <Check className="w-4 h-4" /> 1. 타일 구성 (총 106개)
            </h4>
            <p className="font-extrabold">
              • 숫자 타일 104개: 4가지 색상(빨강, 파랑, 노랑, 검정)의 1~13번 타일이 각각 2세트씩 존재합니다.
            </p>
            <p className="mt-1 font-black text-[#D9A63B]">
              • 고양이 조커 타일 2개: 귀여운 고양이 사진이 들어간 조커 타일입니다. 어떤 색상/숫자로든 자유롭게 대체 사용 가능합니다!
            </p>
          </div>

          {/* Valid Sets */}
          <div
            className={`p-4 transition-all ${
              isDefault ? 'plush-tile' : 'glass-capsule text-[#222222]'
            }`}
          >
            <h4 className="font-black text-sm mb-1 text-[#356C63] flex items-center gap-1.5">
              <Check className="w-4 h-4" /> 2. 타일 조합의 종류 (최소 3개 이상)
            </h4>
            <div className="space-y-2 mt-2">
              <div className="p-2.5 rounded-xl bg-black/5 font-bold">
                <strong className="block text-[#4B4E86]">■ Group (기둥/그룹):</strong>
                숫자는 같고, 색상은 모두 다른 타일 3개 또는 4개의 조합 (예: 빨강7 + 파랑7 + 검정7)
              </div>
              <div className="p-2.5 rounded-xl bg-black/5 font-bold">
                <strong className="block text-[#356C63]">■ Run (연속/런):</strong>
                색상은 같고, 연속된 숫자 3개 이상의 조합 (예: 파랑3 + 파랑4 + 파랑5)
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
              <AlertTriangle className="w-4 h-4" /> 3. 첫 등록 (Initial Meld) 규칙
            </h4>
            <p className="font-extrabold">
              • 각 플레이어의 첫 번째 제출은 자신의 손타일만 사용하여 **합이 30점 이상**이 되는 올바른 조합을 내놓아야 합니다.
            </p>
            <p className="mt-1 font-bold">
              • 첫 등록을 완료하기 전에는 바닥에 있는 기존 타일을 가져오거나 재배치할 수 없습니다. 등록을 하지 못할 경우 타일 더미에서 1개를 가져옵니다.
            </p>
          </div>

          {/* Re-arranging */}
          <div
            className={`p-4 transition-all ${
              isDefault ? 'plush-tile' : 'glass-capsule text-[#222222]'
            }`}
          >
            <h4 className="font-black text-sm mb-1 text-[#356C63] flex items-center gap-1.5">
              <Check className="w-4 h-4" /> 4. 바닥 타일 재배치 및 승리 조건
            </h4>
            <p className="font-extrabold">
              • 첫 등록 완료 후, 턴마다 바닥에 있는 타일을 쪼개거나 덧붙여 새로운 정합 조합을 완성할 수 있습니다.
            </p>
            <p className="mt-1 font-black">
              • 가장 먼저 손에 든 모든 타일을 깔끔하게 비운 플레이어가 승리(Rummikub!)합니다.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className={`w-full py-3 rounded-2xl font-black text-xs text-white ${
            isDefault ? 'bg-[#356C63]' : 'glass-gel-btn'
          }`}
        >
          이해했습니다
        </button>
      </div>
    </div>
  );
};
