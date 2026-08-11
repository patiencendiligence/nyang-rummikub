import React from 'react';
import { ThemeMode } from '../types/game';
import { useLanguage } from '../constants/language';

interface SeoIntroProps {
  theme: ThemeMode;
}

export const SeoIntro: React.FC<SeoIntroProps> = ({ theme }) => {
  const isDefault = theme === 'default';
  const { language } = useLanguage();

  const cardClass = isDefault
    ? 'plush-cushion !rounded-[28px] text-[#2D323E]'
    : 'rain-glass-card glass-shine !rounded-[28px] text-[#222222]';

  if (language === 'en') {
    return (
      <section className={`max-w-7xl mx-auto px-4 sm:px-8 pb-10 mt-2`}>
        <div className={`p-6 sm:p-8 transition-all ${cardClass}`}>
          <h2 className="text-lg sm:text-xl font-bold mb-2">Play Rummikub online for free</h2>
          <p className="text-sm leading-relaxed opacity-90 mb-3">
            Nyang Rummikub Online lets you play the classic tile-matching game Rummikub directly in your
            browser — no installation and no sign-up required. Create a room, share the invite code with
            friends, and start a real-time multiplayer match for 2 to 4 players.
          </p>
          <p className="text-sm leading-relaxed opacity-90">
            Rummikub combines rummy and tile-matching: arrange numbered tiles into runs and groups, and be
            the first to lay down every tile in your hand to win. It's free to play, works on both desktop
            and mobile, and includes a lobby chat so you can meet other players before a game starts.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={`max-w-7xl mx-auto px-4 sm:px-8 pb-10 mt-2`}>
      <div className={`p-6 sm:p-8 transition-all ${cardClass}`}>
        <h2 className="text-lg sm:text-xl font-bold mb-2">무료 온라인 루미큐브, 설치 없이 바로 즐기기</h2>
        <p className="text-sm leading-relaxed opacity-90 mb-3">
          냥 루미큐브 온라인은 회원가입이나 프로그램 설치 없이 브라우저에서 바로 즐기는 무료 루미큐브
          게임입니다. 방을 만들고 초대 코드를 친구에게 공유하면 2~4명이 실시간으로 함께 대결할 수
          있어요. PC와 모바일 모두에서 편하게 플레이할 수 있습니다.
        </p>
        <p className="text-sm leading-relaxed opacity-90">
          루미큐브는 러미(rummy)와 타일 매칭 요소를 결합한 보드게임으로, 숫자 타일을 연속된 수열이나
          같은 숫자 그룹으로 배열해 손에 든 타일을 가장 먼저 모두 내려놓는 사람이 승리합니다. 대기실
          채팅 기능으로 게임 시작 전에 다른 플레이어들과 자유롭게 대화도 나눌 수 있어요.
        </p>
      </div>
    </section>
  );
};