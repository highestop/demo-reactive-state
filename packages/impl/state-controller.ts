export interface IStateController<T = any, R = T> {
    setState: (state: T) => void
    getState: () => R
    subscribe: (callback: (state: T) => void) => () => void
    close: () => void
}

export type IReadonlyStateController<T, R = T> = Omit<IStateController<T, R>, 'setState'>

export function createState<T = any>(): IStateController<T | undefined>
export function createState<T>(defaultValue: T): IStateController<T>
export function createState<T>(defaultValue?: T): IStateController<T, T | undefined> {
    let currentState: T | undefined = defaultValue
    const callbacks: Set<(state: T) => void> = new Set()
    const getState = () => currentState
    const setState = (state: T) => {
        currentState = state
        callbacks.forEach((callback) => callback(state))
    }
    const subscribe = (callback: (state: T) => void) => {
        callbacks.add(callback)
        return () => callbacks.delete(callback)
    }
    const close = () => callbacks.clear()
    return { setState, getState, subscribe, close }
}

export type StateFactory = typeof createState

export function createStates<D extends { [key: string]: IStateController }>(
    factory: (create: StateFactory) => D
): D {
    return factory(createState)
}

export function closeStates<D extends { [key: string]: IStateController }>(controllers: D) {
    Object.values(controllers).forEach((controller) => controller.close())
}

export function exportStates<D extends { [key: string]: IStateController<any> }, K extends (keyof D)[]>(
    controllers: D,
    keys?: K
) {
    const _keys = keys ?? (Object.keys(controllers) as K)
    return _keys.reduce((states, key) => {
        states[key] = controllers[key]
        return states
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    }, {} as { [key in K[number]]: IReadonlyStateController<ReturnType<D[key]['getState']>> })
}