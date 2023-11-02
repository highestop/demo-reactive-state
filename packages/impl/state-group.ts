import {
    IStateControllerBase,
    IMutableStateController,
    IReadonlyStateController,
    createState,
} from './state-controller';

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
