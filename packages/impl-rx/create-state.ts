import { Observable, BehaviorSubject } from 'rxjs';

export interface IState<T = any> {
	observableState: Observable<T>;
	closeState: () => void;
	setState: (value: T) => void;
	getState: () => T;
}

export function createState<T>(): IState<T | undefined>;
export function createState<T>(defaultValue: T): IState<T>;
export function createState<T>(defaultValue?: T): IState<T | undefined> {
	const _state$ = new BehaviorSubject<T | undefined>(defaultValue);
	const getState = () => _state$.value;
	const setState = (value: T | undefined) => _state$.next(value);
	const closeState = () => _state$.complete();
	return {
		observableState: _state$.asObservable(),
		closeState,
		setState,
		getState,
	};
}
