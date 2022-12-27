import { Observable, BehaviorSubject } from "rxjs"

export interface ILocalState<T = any> {
    observableState: Observable<T>
    closeState: () => void
    setValue: (value: T) => void
    getValue: () => T
}

export function createLocalState<T>(): ILocalState<T | undefined>
export function createLocalState<T>(defaultValue: T): ILocalState<T>
export function createLocalState<T>(defaultValue?: T): ILocalState<T | undefined> {
    const _state$ = new BehaviorSubject<T | undefined>(defaultValue)
    const getValue = () => _state$.value
    const setValue = (value: T | undefined) => _state$.next(value)
    const closeState = () => _state$.complete()
    return {
        observableState: _state$.asObservable(),
        closeState,
        setValue,
        getValue,
    }
}