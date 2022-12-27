import { Subject, takeUntil } from "rxjs"
import { ILocalState } from "./local-state"
import { IRemoteState } from "./remote-state"

export interface IStateSubscription {
    unsubscribe: () => void
}

export function subscribeStateChange<T>(
    state: ILocalState<T> | IRemoteState<T>,
    callback: (state: T) => any
): IStateSubscription {
    const closeState$ = new Subject<void>()
    const subscription = state.observableState.pipe(takeUntil(closeState$)).subscribe(callback)
    const unsubscribe = () => {
        subscription.unsubscribe()
        closeState$.next()
        closeState$.complete()
    }
    return { unsubscribe }
}