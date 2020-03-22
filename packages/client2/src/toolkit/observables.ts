import { useEffect, useState } from 'react'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

export function useObservable<T>(observable: Observable<T>): [T | undefined, any | undefined] {
  const [value, setValue] = useState<T | undefined>(undefined);
  const [error, setError] = useState<any | undefined>(undefined);

  useEffect(() => {
    const subscription = observable.pipe(tap(v => setValue(v), e => setError(e))).subscribe();
    return () => subscription.unsubscribe();
  }, [observable]);

  return [value, error];
}
