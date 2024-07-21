import { Observable, BehaviorSubject } from 'rxjs';

export interface IState<T, R = T> {
    $: Observable<R>;
    set: (value: T) => void;
    get: () => R;
    close: () => void;
}

export function createState<T>(): IState<T | undefined>;
export function createState<T>(defaultValue: T): IState<T>;
export function createState<T>(defaultValue?: T): IState<T | undefined> {
    const _state$ = new BehaviorSubject<T | undefined>(defaultValue);
    const get = () => _state$.value;
    const set = (value: T | undefined) => _state$.next(value);
    const close = () => _state$.complete();
    return {
        $: _state$.asObservable(),
        close,
        set,
        get,
    };
}
