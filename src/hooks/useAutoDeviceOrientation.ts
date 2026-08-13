import { useEffect } from 'react';

/**
 * 앱인토스(Toss 앱) 미니앱 환경에서 기기를 가로/세로로 회전하면
 * 화면도 자동으로 같은 방향으로 전환되도록 동기화해요.
 *
 * 앱인토스 WebView는 기본적으로 화면 방향이 고정돼 있어서,
 * `setDeviceOrientation`으로 매번 "현재 기기가 어느 방향인지"에 맞춰
 * 직접 방향을 지정해줘야 해요. (자동 회전 옵션이 별도로 없음)
 * 참고: https://developers-apps-in-toss.toss.im/documentation/common/screen/properties
 *
 * 일반 웹 브라우저에서는 `getOperationalEnvironment()`가 실패하므로
 * 아무 동작도 하지 않고 브라우저의 기본 반응형 레이아웃을 그대로 사용해요.
 */
export function useAutoDeviceOrientation() {
  useEffect(() => {
    let isTossApp = true;
    let cleanupMediaQuery: (() => void) | undefined;

    const syncOrientation = async (
      setDeviceOrientation: (options: { type: 'portrait' | 'landscape' }) => Promise<void>,
      isLandscape: boolean
    ) => {
      try {
        await setDeviceOrientation({ type: isLandscape ? 'landscape' : 'portrait' });
      } catch {
        // 방향 전환 실패는 무시하고 다음 회전 이벤트를 기다려요.
      }
    };

    (async () => {
      try {
        const { getOperationalEnvironment, setDeviceOrientation } = await import(
          '@apps-in-toss/web-framework'
        );
        getOperationalEnvironment(); // 앱인토스 WebView가 아니면 여기서 throw됨

        // 진입 시점의 기기 방향으로 즉시 동기화
        const isLandscape = window.innerWidth > window.innerHeight;
        syncOrientation(setDeviceOrientation, isLandscape);

        // orientationchange 이벤트 (가장 안정적)
        const handleOrientationChange = () => {
          const isLandscapeNow = window.innerWidth > window.innerHeight;
          syncOrientation(setDeviceOrientation, isLandscapeNow);
        };

        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', handleOrientationChange);
        
        cleanupMediaQuery = () => {
          window.removeEventListener('orientationchange', handleOrientationChange);
          window.removeEventListener('resize', handleOrientationChange);
        };
      } catch {
        // 일반 브라우저(앱인토스 WebView 아님) - 아무 것도 하지 않아요.
        isTossApp = false;
      }
    })();

    return () => {
      cleanupMediaQuery?.();
      if (!isTossApp) return;
    };
  }, []);
}