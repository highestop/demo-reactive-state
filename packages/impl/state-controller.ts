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

export type IMutableStateControllerGroup<
    D extends { [key: string]: IStateControllerBase }
> = {
    [key in keyof D]: IMutableStateController<ReturnType<D[key]['getState']>>;
};

export type IReadonlyStateControllerGroup<
    D extends { [key: string]: IStateControllerBase },
    K extends keyof D = keyof D
> = {
    [key in K]: IReadonlyStateController<ReturnType<D[key]['getState']>>;
};

export type StateFactory = typeof createState;

export interface ICreateStatesTraceOption {
    enableTracing?: boolean;
    globalId?: string;
}

export function createStates<
    D extends { [key: string]: IMutableStateController }
>(
    factory: (create: StateFactory) => D,
    options?: ICreateStatesTraceOption
): IMutableStateControllerGroup<D> {
    const states = factory(createState);
    if (options?.enableTracing) {
        Object.keys(states).forEach((key) => {
            const traceId =
                (options?.globalId ? `${options?.globalId}:` : '') + key;
            console.debug(traceId, states[key].getState());
            states[key].subscribe((state) => console.debug(traceId, state));
        });
    }
    return states;
}

export function closeStates<
    D extends { [key: string]: IMutableStateController }
>(controllers: D) {
    Object.values(controllers).forEach((controller) => controller.close());
}

export function exportStates<
    D extends { [key: string]: IMutableStateController },
    K extends (keyof D)[]
>(controllers: D, keys?: K) {
    const _keys = keys ?? (Object.keys(controllers) as K);
    return _keys.reduce((states, key) => {
        states[key] = controllers[key];
        return states;
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    }, {} as IReadonlyStateControllerGroup<D, K[number]>);
}

export function getStatesSnapshot<
    D extends { [key: string]: IStateControllerBase },
    K extends (keyof D)[]
>(controllers: D) {
    return (Object.keys(controllers) as K).reduce((states, key) => {
        states[key] = controllers[key].getState();
        return states;
    }, {} as { [key in keyof D]: ReturnType<D[key]['getState']> });
}

export type IStateControllerCollection<D extends { [key: string]: any }> = {
    [key in keyof D]: IStateControllerBase<D[key]>;
};

export function createStatesCollection<D extends { [key: string]: any }>(
    states: D
) {
    return Object.keys(states).reduce((createFactory, key: keyof D) => {
        createFactory[key] = createState(states[key]);
        return createFactory;
    }, {} as IStateControllerCollection<D>);
}
