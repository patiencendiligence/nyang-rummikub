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

  const faqsKo = [
    {
      q: '냥 루미큐브 온라인은 무료인가요?',
      a: '네, 냥 루미큐브 온라인은 설치나 회원가입 없이 브라우저에서 바로 무료로 즐길 수 있는 온라인 루미큐브 게임입니다.',
    },
    {
      q: '루미큐브는 몇 명이서 할 수 있나요?',
      a: '방을 만들어 2명에서 4명까지 실시간으로 함께 플레이할 수 있습니다.',
    },
    {
      q: '루미큐브 규칙이 궁금해요.',
      a: '숫자 타일을 연속된 수열(런)이나 같은 숫자 그룹(그룹)으로 배열해, 손에 든 타일을 가장 먼저 모두 내려놓는 사람이 승리합니다. 상단의 \u0027규칙 보기\u0027 메뉴에서 자세히 확인할 수 있어요.',
    },
    {
      q: '친구를 초대해서 같이 할 수 있나요?',
      a: '방을 만든 뒤 초대 코드나 초대 링크를 친구에게 공유하면 같은 방에 입장해 함께 플레이할 수 있습니다.',
    },
  ];

  const faqsEn = [
    {
      q: 'Is Nyang Rummikub Online free?',
      a: 'Yes. You can play right in your browser for free, with no installation and no sign-up required.',
    },
    {
      q: 'How many players can join a game?',
      a: 'Create a room and play in real time with 2 to 4 players.',
    },
    {
      q: 'What are the rules of Rummikub?',
      a: 'Arrange numbered tiles into runs (consecutive sequences) or groups (same number, different colors), and be the first to lay down every tile in your hand. Check the "Rules" menu in-app for details.',
    },
    {
      q: 'Can I invite friends to my room?',
      a: 'Yes, create a room and share the invite code or invite link with friends so they can join the same room.',
    },
  ];

  if (language === 'en') {
    return (
      <section className={`max-w-7xl mx-auto px-4 sm:px-8 pb-10 mt-2 space-y-4`}>
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
        <div className={`p-6 sm:p-8 transition-all ${cardClass}`}>
          <h2 className="text-lg sm:text-xl font-bold mb-3">Frequently asked questions</h2>
          <dl className="space-y-3">
            {faqsEn.map((item) => (
              <div key={item.q}>
                <dt className="text-sm font-semibold mb-1">{item.q}</dt>
                <dd className="text-sm leading-relaxed opacity-90">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    );
  }

  return (
    <section className={`max-w-7xl mx-auto px-4 sm:px-8 pb-10 mt-2 space-y-4`}>
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
      <div className={`p-6 sm:p-8 transition-all ${cardClass}`}>
        <h2 className="text-lg sm:text-xl font-bold mb-3">자주 묻는 질문</h2>
        <dl className="space-y-3">
          {faqsKo.map((item) => (
            <div key={item.q}>
              <dt className="text-sm font-semibold mb-1">{item.q}</dt>
              <dd className="text-sm leading-relaxed opacity-90">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};