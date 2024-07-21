import { useEffect, useState as _useState } from 'react';
import { IState } from './state';

export function useState<T>(controller: IState<T>) {
    const [state, setState] = _useState<T>(controller.get());
    useEffect(() => {
        const unsubscribe = controller.subscribe(setState);
        return unsubscribe;
    }, []);
    return state;
}
