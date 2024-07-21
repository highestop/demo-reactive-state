export interface IState<T, R = T> {
    set: (state: T) => void;
    get: () => R;
    subscribe: (callback: (state: R) => void) => () => void;
    close: () => void;
}

export function createState<T>(): IState<T | undefined>;
export function createState<T>(defaultValue: T): IState<T>;
export function createState<T>(defaultValue?: T): IState<T, T | undefined> {
    let currentState: T | undefined = defaultValue;
    let closed = false;
    const callbacks: Set<(state: T) => void> = new Set();
    const get = () => currentState;
    const set = (state: T) => {
        if (closed) {
            throw Error('state has been closed.');
        }
        currentState = state;
        callbacks.forEach((callback) => callback(state));
    };
    const subscribe = (callback: (state: T | undefined) => void) => {
        if (closed) {
            throw Error('state has been closed.');
        }
        callbacks.add(callback);
        callback(currentState);
        return () => callbacks.delete(callback);
    };
    const close = () => {
        callbacks.clear();
        closed = true;
    };
    return { set, get, subscribe, close };
}
