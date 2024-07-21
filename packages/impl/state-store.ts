import { IState, createState } from './state';

type IStateStore<D extends { [key: string]: any }> = {
    [key in keyof D]: IState<D[key]>;
};

export type StateFactory = typeof createState;

export type StateStore<D extends { [key: string]: any }> = ReturnType<typeof generateStore<D>>;

export interface IStateStoreTraceOption {
    enableTracing?: boolean;
    globalId?: string;
}

export function createStates<D extends { [key: string]: any }>(
    factory: (create: StateFactory) => IStateStore<D>,
    options?: IStateStoreTraceOption
) {
    const states = factory(createState);
    return generateStore<D>(states, options);
}

export function createStatesUsingDefault<D extends { [key: string]: any }>(
    defaultStates: D,
    options?: IStateStoreTraceOption
) {
    const states = Object.keys(defaultStates).reduce((createFactory, key: keyof D) => {
        createFactory[key] = createState(defaultStates[key]);
        return createFactory;
    }, {} as IStateStore<D>);
    return generateStore<D>(states, options);
}

function generateStore<D extends { [key: string]: any }>(states: IStateStore<D>, options?: IStateStoreTraceOption) {
    const get = <K extends keyof D>(key: K): D[K] => {
        return states[key].get();
    };
    const set = <K extends keyof D>(key: K, state: D[K]) => {
        states[key].set(state);
    };
    const subscribe = <K extends keyof D>(key: K, callback: (state: D[K]) => void) => {
        return states[key].subscribe(callback);
    };
    const close = () => closeStates(states);
    const snapshot = () => getStatesSnapshot(states);

    if (options?.enableTracing) {
        Object.keys(states).forEach((key) => {
            const traceId = (options?.globalId ? `${options?.globalId}:` : '') + key;
            console.debug(traceId, states[key].get());
            states[key].subscribe((state) => console.debug(traceId, state));
        });
    }

    return { get, set, subscribe, close, snapshot };
}

function closeStates<D extends { [key: string]: any }>(states: IStateStore<D>) {
    Object.values(states).forEach((state) => state.close());
}

function getStatesSnapshot<D extends { [key: string]: any }, K extends (keyof D)[]>(states: IStateStore<D>) {
    return (Object.keys(states) as K).reduce((states, key) => {
        states[key] = states[key].get();
        return states;
    }, {} as D);
}
