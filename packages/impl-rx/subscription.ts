import { Subject, takeUntil } from 'rxjs';
import { IState } from './create-state';
import { IServerState } from './server-state';

export interface IStateSubscription {
    unsubscribe: () => void;
}

export function subscribeStateChange<T>(
    state: IState<T> | IServerState<T>,
    callback: (state: T) => any
): IStateSubscription {
    const closeState$ = new Subject<void>();
    const subscription = state.observableState
        .pipe(takeUntil(closeState$))
        .subscribe(callback);
    const unsubscribe = () => {
        subscription.unsubscribe();
        closeState$.next();
        closeState$.complete();
    };
    return { unsubscribe };
}
