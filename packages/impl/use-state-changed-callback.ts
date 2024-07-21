import { useEffect } from 'react';
import { IState } from './state';

export function useStateChangedCallback<T>(controller: IState<T>, callback: (state: T) => void) {
    useEffect(() => {
        const unsubscribe = controller.subscribe(callback);
        return unsubscribe;
    }, []);
}
