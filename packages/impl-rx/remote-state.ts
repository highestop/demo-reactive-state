import { Observable, BehaviorSubject } from "rxjs"

export interface IRemoteStateService {
    register: <K, V>(token: K, setState: (state: V) => void) => void
    unregister: <K, V>(token: K, setState: (state: V) => void) => void
}

export interface IRemoteState<T = any> {
    observableState: Observable<T>
    closeState: () => void
    connectService: (service: IRemoteStateService) => void
    getValue: () => T
}

export function createRemoteState<K, V>(
    token: K
): IRemoteState<V | undefined>
export function createRemoteState<K, V>(
    token: K,
    defaultValue: V
): IRemoteState<V>
export function createRemoteState<K, V>(
    token: K,
    defaultValue?: V
): IRemoteState<V | undefined> {
    const _state$ = new BehaviorSubject<V | undefined>(defaultValue)
    const getValue = () => _state$.value
    const setValue = (nextValue: V | undefined) => _state$.next(nextValue)
    let closeState = () => {
        _state$.complete()
    }
    const connectService = (service: IRemoteStateService) => {
        service.register(token, setValue)
        closeState = () => {
            service.unregister(token, setValue)
            _state$.complete()
        }
    }
    return {
        observableState: _state$.asObservable(),
        closeState,
        connectService,
        getValue
    }
}