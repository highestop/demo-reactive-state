import {
    closeStates,
    createState,
    exportStates,
    IMutableStateController,
    IReadonlyStateController,
    StateFactory,
} from './state-controller';

export class StateStore<D extends { [key: string]: any }> {
    protected states: { [key in keyof D]: IMutableStateController<D[key]> };
    useStates: { [key in keyof D]: IReadonlyStateController<D[key]> };

    constructor(
        factory: (create: StateFactory) => {
            [key in keyof D]: IMutableStateController<D[key]>;
        },
        exportKeys?: (keyof D)[]
    ) {
        this.states = factory(createState);
        this.useStates = exportStates(this.states, exportKeys ?? []);
    }

    protected close() {
        closeStates(this.states);
    }
}

export function createStatesStore<D extends { [key: string]: any }>(
    factory: (create: StateFactory) => {
        [key in keyof D]: IMutableStateController<D[key]>;
    },
    exportKeys?: (keyof D)[]
) {
    const states = factory(createState);
    const useStates = exportStates(states, exportKeys ?? []);
    const close = () => closeStates(states);
    return { useStates, close };
}
