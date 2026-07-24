import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface IPaginatedResponse<T> {
  data: T[];
  lastKey?: string;
}

interface IUsePaginatedFetchOptions {
  enabled?: boolean;
  errorMessage?: string;
}

interface IUsePaginatedFetchResult<T> {
  data: T[];
  setData: Dispatch<SetStateAction<T[]>>;
  lastKey: string | undefined;
  loading: boolean;
  error: string;
  setError: Dispatch<SetStateAction<string>>;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function usePaginatedFetch<T>(
  path: string,
  { enabled = true, errorMessage = 'Failed to load data' }: IUsePaginatedFetchOptions = {}
): IUsePaginatedFetchResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [lastKey, setLastKey] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    try {
      const res = await apiFetch<IPaginatedResponse<T>>(path);
      setData(res.data);
      setLastKey(res.lastKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : errorMessage);
    } finally {
      setLoading(false);
    }
  }, [path, errorMessage]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    apiFetch<IPaginatedResponse<T>>(path)
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
        setLastKey(res.lastKey);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : errorMessage);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path, enabled, errorMessage]);

  const loadMore = useCallback(async () => {
    if (!lastKey) return;
    try {
      const res = await apiFetch<IPaginatedResponse<T>>(
        `${path}${path.includes('?') ? '&' : '?'}lastKey=${lastKey}`
      );
      setData((prev) => [...prev, ...res.data]);
      setLastKey(res.lastKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : errorMessage);
    }
  }, [path, lastKey, errorMessage]);

  return { data, setData, lastKey, loading, error, setError, loadMore, refetch };
}
