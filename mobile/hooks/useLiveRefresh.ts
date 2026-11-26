import { useEffect, useRef } from 'react';
import { onChange } from '@/services/socket';

/** Calls `refetch` whenever the server announces a change to one of the given entities. */
export function useLiveRefresh(entities: string[], refetch: () => void) {
  const ref = useRef(refetch);
  ref.current = refetch;
  const key = entities.join(',');
  useEffect(() => {
    const wanted = key ? key.split(',') : [];
    return onChange((e) => { if (wanted.includes(e.entity)) ref.current(); });
  }, [key]);
}
