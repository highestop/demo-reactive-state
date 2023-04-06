import { Observable, BehaviorSubject } from "rxjs"

export interface IServerStateService {
    register: <K, V>(token: K, setState: (state: V) => void) => void
    unregister: <K, V>(token: K, setState: (state: V) => void) => void
}

export interface IServerState<T = any> {
    observableState: Observable<T>
    closeState: () => void
    connectService: (service: IServerStateService) => void
    getState: () => T
}

export function createServerState<K, V>(
    token: K
): IServerState<V | undefined>
export function createServerState<K, V>(
    token: K,
    defaultValue: V
): IServerState<V>
export function createServerState<K, V>(
    token: K,
    defaultValue?: V
): IServerState<V | undefined> {
    const _state$ = new BehaviorSubject<V | undefined>(defaultValue)
    const getState = () => _state$.value
    const setValue = (nextValue: V | undefined) => _state$.next(nextValue)
    let closeState = () => {
        _state$.complete()
    }
    const connectService = (service: IServerStateService) => {
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
        getState
    }
}