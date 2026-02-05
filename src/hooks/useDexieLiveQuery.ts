import { liveQuery } from "dexie";
import { useEffect, useMemo, useState } from "react";

export function useDexieLiveQuery<T>(factory: () => T | Promise<T>, initial: T) {
  const observable = useMemo(() => liveQuery(factory), [factory]);
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const subscription = observable.subscribe({
      next: (value) => {
        if (!mounted) return;
        setData(value);
        setLoading(false);
      },
      error: (err) => {
        if (!mounted) return;
        setError(err);
        setLoading(false);
      },
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [observable]);

  return { data, loading, error };
}
