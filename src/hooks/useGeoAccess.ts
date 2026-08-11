import { useEffect, useState } from 'react';

export const useGeoAccess = () => {
  const [isGeoBlocked, setIsGeoBlocked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetch('/api/geo-check')
      .then((response) => response.json())
      .then((data: { isBlocked?: boolean }) => {
        if (isMounted && data.isBlocked) setIsGeoBlocked(true);
      })
      .catch(() => {
        // Network failures keep access open, matching the previous fallback.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { isGeoBlocked, setIsGeoBlocked };
};
