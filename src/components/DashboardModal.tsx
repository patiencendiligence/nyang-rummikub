import React, { useEffect, useState } from 'react';
import { BarChart3, Trophy, History, X, Target } from 'lucide-react';
import { GameRecord, ThemeMode } from '../types/game';
import { useLanguage } from '../constants/language';

interface DashboardModalProps {
  theme: ThemeMode;
  onClose: () => void;
}

export const DashboardModal: React.FC<DashboardModalProps> = ({ theme, onClose }) => {
  const isDefault = theme === 'default';
  const { language, t } = useLanguage();

  const [records, setRecords] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/records')
      .then((res) => res.json())
      .then((data) => {
        setRecords(data.records || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const totalGames = records.length;
  const totalWins = records.filter((r) => r.myRank === 1).length;
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
  const highestScore = records.reduce((max, r) => Math.max(max, r.userScore), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-2xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-hidden transition-all ${
          isDefault
            ? 'plush-cushion text-[#111111]'
            : 'rain-glass-card glass-shine text-[#222222]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#D9A63B]" />
            <h3 className={`text-lg font-black tracking-tight ${isDefault ? 'embroidered-text' : ''}`}>
              {t('dashboard')}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-black/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            className={`p-3.5 text-center transition-all ${
              isDefault ? 'plush-tile' : 'glass-capsule text-[#222222]'
            }`}
          >
            <History className="w-4 h-4 mx-auto mb-1 opacity-70" />
            <span className="text-[10px] font-black block opacity-70">{language === 'ko' ? '총 게임 수' : 'Games'}</span>
            <span className="text-lg font-black">{totalGames} {language === 'ko' ? '판' : ''}</span>
          </div>

          <div
            className={`p-3.5 text-center transition-all ${
              isDefault ? 'plush-tile' : 'glass-capsule text-[#222222]'
            }`}
          >
            <Trophy className="w-4 h-4 mx-auto mb-1 text-amber-500" />
            <span className="text-[10px] font-black block opacity-70">{language === 'ko' ? '승리 횟수' : 'Wins'}</span>
            <span className="text-lg font-black text-amber-600">{totalWins}</span>
          </div>

          <div
            className={`p-3.5 text-center transition-all ${
              isDefault ? 'plush-tile' : 'glass-capsule text-[#222222]'
            }`}
          >
            <Target className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
            <span className="text-[10px] font-black block opacity-70">{language === 'ko' ? '승률' : 'Win rate'}</span>
            <span className="text-lg font-black text-emerald-600">{winRate}%</span>
          </div>

          <div
            className={`p-3.5 text-center transition-all ${
              isDefault ? 'plush-tile' : 'glass-capsule text-[#222222]'
            }`}
          >
            <span className="text-xs font-black block mb-1 text-[#356C63]">MAX</span>
            <span className="text-[10px] font-black block opacity-70">{language === 'ko' ? '최고 획득 점수' : 'Best score'}</span>
            <span className="text-lg font-black">{highestScore}</span>
          </div>
        </div>

        {/* History Table */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 border rounded-2xl p-3 bg-black/5">
          <h4 className="text-xs font-black opacity-80 mb-1">{language === 'ko' ? '최근 플레이 경기 기록' : 'Recent games'}</h4>

          {loading ? (
            <div className="text-center py-8 text-xs font-extrabold opacity-60">
              {language === 'ko' ? '전적 기록 불러오는 중...' : 'Loading game records...'}
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-xs font-extrabold opacity-60">
              {language === 'ko' ? '저장된 게임 플레이 전적이 없습니다. 게임을 완료하면 자동으로 기록됩니다!' : 'No saved game records yet. Results are saved automatically when you finish a game!'}
            </div>
          ) : (
            records.map((rec) => (
              <div
                key={rec.id}
                className={`p-3.5 flex items-center justify-between text-xs font-bold transition-all ${
                  isDefault ? 'plush-tile' : 'glass-capsule text-[#1E3A8A]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black">{rec.date}</span>
                    <span className="text-[10px] px-2 py-0.5 font-extrabold rounded-full bg-black/10">
                      {language === 'ko' ? `방 ${rec.roomId} (${rec.playersCount}인전)` : `Room ${rec.roomId} (${rec.playersCount} players)`}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold opacity-75 block mt-0.5">
                    {language === 'ko' ? `승리자: ${rec.winnerName} • 진행시간: ${rec.durationSeconds}초` : `Winner: ${rec.winnerName} • Duration: ${rec.durationSeconds}s`}
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-black text-sm text-[#356C63]">
                    +{rec.userScore}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          className={`w-full py-3 rounded-2xl font-black text-xs text-white ${
            isDefault ? 'bg-[#356C63]' : 'glass-gel-btn'
          }`}
        >
          {language === 'ko' ? '확인 및 닫기' : 'Close'}
        </button>
      </div>
    </div>
  );
};
