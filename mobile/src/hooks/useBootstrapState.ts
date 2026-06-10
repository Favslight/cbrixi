import { useEffect, useState } from 'react';

import { storage } from '../services/storage';

type BootstrapState = {
  loading: boolean;
  onboardingSeen: boolean;
  hasToken: boolean;
};

export function useBootstrapState() {
  const [state, setState] = useState<BootstrapState>({
    loading: true,
    onboardingSeen: false,
    hasToken: false,
  });

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        const [onboardingSeen, userToken, adminToken] = await Promise.all([
          storage.getString(storage.keys.onboardingSeen),
          storage.getString(storage.keys.userToken),
          storage.getString(storage.keys.adminToken),
        ]);

        if (!isMounted) {
          return;
        }

        setState({
          loading: false,
          onboardingSeen: onboardingSeen === 'true',
          hasToken: Boolean(userToken || adminToken),
        });
      } catch {
        if (!isMounted) {
          return;
        }

        setState({
          loading: false,
          onboardingSeen: false,
          hasToken: false,
        });
      }
    }

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
