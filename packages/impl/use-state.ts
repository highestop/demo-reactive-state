import { useRef, useEffect, useState as _useState } from 'react';
import { IMutableStateController } from './state-controller';

export function useState<T>(
    controller: IMutableStateController<T>
) {
    const [state, setState] = _useState<T>(controller.getState());
    const unsubscribeCallback = useRef<(() => void) | null>(null);
    if (!unsubscribeCallback.current) {
        unsubscribeCallback.current = controller.subscribe(setState);
    }
    useEffect(() => {
        return () => unsubscribeCallback.current?.();
    }, []);
    return state;
}
