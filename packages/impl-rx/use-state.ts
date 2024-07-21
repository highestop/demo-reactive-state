import { useObservableState } from 'observable-hooks';
import { IState } from './create-state';

export function useState<T, S extends IState<T>>(state: S) {
    return useObservableState(state.$, state.get());
}
