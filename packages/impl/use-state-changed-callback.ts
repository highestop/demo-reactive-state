import { useEffect, useRef } from 'react';
import { IReadonlyStateController } from './state-controller';

export function useStateChangedCallback<T>(
    controller: IReadonlyStateController<T>,
    callback: (state: T) => void
) {
    const unsubscribeCallback = useRef<(() => void) | null>(null);
    if (!unsubscribeCallback.current) {
        unsubscribeCallback.current = controller.subscribe(callback);
    }
    useEffect(() => {
        return () => unsubscribeCallback.current?.();
    }, []);
}
