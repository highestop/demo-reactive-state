export interface IStateControllerBase<T = any, R = T> {
    setState: (state: T) => void;
    getState: () => R;
    subscribe: (callback: (state: T) => void) => () => void;
    close: () => void;
}

export type IMutableStateController<T = any, R = T> = Pick<
    IStateControllerBase<T, R>,
    'setState' | 'getState' | 'subscribe' | 'close'
>;

export type IReadonlyStateController<T, R = T> = Pick<
    IStateControllerBase<T, R>,
    'getState' | 'subscribe' | 'close'
>;

export function createState<T = any>(): IMutableStateController<T | undefined>;
export function createState<T>(defaultValue: T): IMutableStateController<T>;
export function createState<T>(
    defaultValue?: T
): IMutableStateController<T, T | undefined> {
    let currentState: T | undefined = defaultValue;
    let closed = false;
    const callbacks: Set<(state: T) => void> = new Set();
    const getState = () => currentState;
    const setState = (state: T) => {
        if (closed) {
            throw Error('State 已经被关闭');
        }
        currentState = state;
        callbacks.forEach((callback) => callback(state));
    };
    const subscribe = (callback: (state: T) => void) => {
        if (closed) {
            throw Error('State 已经被关闭');
        }
        callbacks.add(callback);
        return () => callbacks.delete(callback);
    };
    const close = () => {
        callbacks.clear();
        closed = true;
    };
    return { setState, getState, subscribe, close };
}
