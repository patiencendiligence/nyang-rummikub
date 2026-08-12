import { useEffect, useState } from 'react';

/**
 * 초대 링크로 들어온 roomId를 읽어옵니다.
 *
 * 1) 일반 웹 브라우저: https://nyang-rummikub.onrender.com/?room=XXXX
 * 2) 앱인토스(Toss 앱) WebView: intoss://nyang-rummikub?room=XXXX 형태의
 *    딥링크로 진입한 경우, getSchemeUri()로 진입 URI를 읽어와 room 값을 파싱합니다.
 *
 * WebView가 막 초기화된 시점에는 getSchemeUri()가 아직 빈 값을 반환할 수 있어
 * 짧은 간격(0ms / 100ms / 400ms)으로 재시도합니다.
 */
export function useInvitedRoomId(): string | null {
  const [invitedRoomId, setInvitedRoomId] = useState<string | null>(() => {
    // 일반 웹 접속: 쿼리 파라미터를 우선 확인
    return new URLSearchParams(window.location.search).get('room');
  });

  useEffect(() => {
    if (invitedRoomId) return;

    let cancelled = false;

    const parseRoomFromSchemeUri = (uri: string): string | null => {
      // intoss://nyang-rummikub?room=XXXX  또는
      // intoss-private://nyang-rummikub?_deploymentId=...&room=XXXX 형태를 모두 지원
      const queryIndex = uri.indexOf('?');
      if (queryIndex === -1) return null;
      const params = new URLSearchParams(uri.slice(queryIndex + 1));
      return params.get('room');
    };

    const tryReadSchemeUri = async () => {
      if (cancelled || invitedRoomId) return;
      try {
        const { getSchemeUri } = await import('@apps-in-toss/web-framework');
        const uri = getSchemeUri();
        if (!uri) return;
        const room = parseRoomFromSchemeUri(uri);
        if (room && !cancelled) {
          setInvitedRoomId(room);
        }
      } catch {
        // 앱인토스 WebView가 아닌 환경(일반 브라우저 등)에서는
        // getSchemeUri 호출 자체가 실패할 수 있어 무시합니다.
      }
    };

    tryReadSchemeUri();
    const retry1 = setTimeout(tryReadSchemeUri, 100);
    const retry2 = setTimeout(tryReadSchemeUri, 400);

    return () => {
      cancelled = true;
      clearTimeout(retry1);
      clearTimeout(retry2);
    };
  }, [invitedRoomId]);

  return invitedRoomId;
}
