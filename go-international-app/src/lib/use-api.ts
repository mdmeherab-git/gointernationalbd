import { useCallback, useEffect, useState } from 'react';

import { ApiError } from './api';

/** Shared fetch/loading/error/refresh state for a read-only API screen —
 *  every list/detail screen in the app uses this so loading, empty, error
 *  and pull-to-refresh behave consistently (Phase 29). */
export function useApiQuery<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const result = await fetcher();
        setData(result);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Something went wrong.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    // fetcher intentionally excluded — callers pass a fresh inline fetcher
    // every render, and re-running on every render would defeat the point
    // of this hook. `deps` is the caller's own explicit re-fetch trigger,
    // so this hook can't statically know it — that's the whole point of
    // accepting it as a parameter.
    // eslint-disable-next-line react-hooks/use-memo, react-hooks/exhaustive-deps
    deps,
  );

  useEffect(() => {
    void load();
    // `deps` is a parameter, not a literal — see the comment on `load` above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    data,
    loading,
    refreshing,
    error,
    reload: () => load(false),
    refresh: () => load(true),
    setData,
  };
}
