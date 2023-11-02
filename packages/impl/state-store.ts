import {
    createState,
    IMutableStateController,
    IReadonlyStateController,
} from './state-controller';
import { closeStates, exportStates, StateFactory } from './state-group';

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
