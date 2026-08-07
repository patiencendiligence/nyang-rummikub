import React from 'react';
import { ShieldAlert, Globe } from 'lucide-react';

export const GeoBlockedView: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#1E293B] text-white">
      <div className="max-w-md w-full p-8 rounded-3xl bg-slate-800 border border-slate-700 shadow-2xl text-center flex flex-col gap-5">
        <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto border border-red-500/30">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div>
          <span className="text-[11px] font-black px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 mb-2 inline-block">
            ACCESS RESTRICTED / 접속 제한
          </span>
          <h2 className="text-2xl font-black tracking-tight">
            해당 지역에서는 접속이 제한됩니다
          </h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            보안 정책에 의해 해당 IP 네트워크 대역(중국 지역 / CN)에서의 서비스 이용이 제한되어 있습니다.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700 text-left text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-200 border-b border-slate-700 pb-2">
            <Globe className="w-4 h-4 text-sky-400" />
            <span>지역 기반 보안 차단 정책 안내</span>
          </div>
          <p>• 해당 정책은 불법 자동화 매크로 차단 및 서버 보안 유지를 위한 정책입니다.</p>
          <p>• 서비스 문의 또는 허용 IP 요청은 담당자 이메일로 전달해 주세요.</p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 rounded-2xl font-bold text-xs bg-slate-700 hover:bg-slate-600 transition-colors text-white"
        >
          페이지 새로고침
        </button>
      </div>
    </div>
  );
};
