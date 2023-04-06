import { useEffect } from 'react';
import { IReadonlyStateController } from './state-controller';

export function useStateChangedCallback<T>(
    controller: IReadonlyStateController<T>,
    callback: (state: T) => void
) {
    useEffect(() => {
        const subscription = controller.subscribe(callback);
        return () => subscription();
    }, [callback]);
}
