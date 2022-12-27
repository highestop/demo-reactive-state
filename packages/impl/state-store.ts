import { closeStates, createState, exportStates, IStateController, IReadonlyStateController, StateFactory } from "./state-controller";

export class StateStore<D extends { [key: string]: any }> {
    protected states: { [key in keyof D]: IStateController<D[key]> }
    public useStates: { [key in keyof D]: IReadonlyStateController<D[key]> }

    constructor(
        factory: (create: StateFactory) => { [key in keyof D]: IStateController<D[key]> },
        exportKeys?: (keyof D)[]
    ) {
        this.states = factory(createState)
        this.useStates = exportStates(this.states, exportKeys ?? [])
    }

    protected close() {
        closeStates(this.states)
    }
}