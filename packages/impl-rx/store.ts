import { IStateSubscription as IStateSubscription, subscribeStateChange } from "./subscription"
import { ILocalState, createLocalState } from "./local-state"
import { createRemoteState, IRemoteState, IRemoteStateService } from "./remote-state"

export interface IStoreStateData {
    [key: string]: ILocalState | IRemoteState
}

export type IStoreLocalStateKey<D extends IStoreStateData> = {
    [key in keyof D]: D[key] extends ILocalState ? key : never
}[keyof D]

export type IStoreRemoteStateKey<D extends IStoreStateData> = {
    [key in keyof D]: D[key] extends IRemoteState ? key : never
}[keyof D]

export type IStateConnectCallback<D extends IStoreStateData, K extends keyof D> = (
    state: ReturnType<D[K]['getValue']>
) => any

// store factory interface
export interface IStoreFactory {
    createLocalState: <T>() => ILocalState<T | undefined>
    createLocalStateUsingDefaultValue: <T>(defaultValue: T) => ILocalState<T>
    createRemoteState: <T, V>(token: T) => IRemoteState<V | undefined>
    createRemoteStateUsingDefaultValue: <K, V>(
        token: K,
        defaultValue: V
    ) => IRemoteState<V>
}

// store interface
interface IStoreBase<D extends IStoreStateData> {
    createStates: (factory: (store: IStoreFactory) => D) => IStoreAfterCreate<D>
    getState: <K extends keyof D>(key: K) => ReturnType<D[K]['getValue']>
    setState: <K extends IStoreLocalStateKey<D>>(key: K, state: ReturnType<D[K]['getValue']>) => void
    provideRemoteService: (service: IRemoteStateService) => void
    subscribeStateChange: <K extends keyof D>(key: K, callback: IStateConnectCallback<D, K>) => IStateSubscription
    resetStates: () => void
    closeSubscriptions: () => void
    closeStates: () => void
}

export type IStoreBeforeCreate<T extends IStoreStateData> = Pick<IStoreBase<T>, 'createStates'>

export type IStoreAfterCreate<T extends IStoreStateData> = Omit<IStoreBase<T>, 'createStates'>

type IReactiveStore<T extends IStoreStateData> = IStoreBase<T> & IStoreFactory

export class StateStore<D extends IStoreStateData> implements IReactiveStore<D> {
    private stateStore: D | null = null
    private remoteStateSet: Set<IRemoteState> = new Set()
    private subscriptionMap: { [key in keyof D]?: Set<IStateSubscription> } = {}
    private callbackMap: { [key in keyof D]?: Set<IStateConnectCallback<D, key>> } = {}
    private stateFactory: ((store: IStoreFactory) => D) | null = null

    public createStates = (factory: (store: IStoreFactory) => D) => {
        if (this.stateStore) {
            throw Error('store 只能初始化一次')
        }
        this.stateFactory = factory
        this.stateStore = this.stateFactory(this)
        return this
    }

    public resetStates = () => {
        if (!this.stateFactory) {
            throw Error('store 未初始化')
        }
        this.stateStore = this.stateFactory(this)
    }

    public provideRemoteService = (service: IRemoteStateService) => {
        if (this.remoteStateSet.size) {
            this.remoteStateSet.forEach((state) => state.connectService(service))
        }
    }

    public createLocalState = <V>() => {
        const state = createLocalState<V>()
        return state
    }

    public createLocalStateUsingDefaultValue = <V>(defaultValue: V) => {
        const state = createLocalState<V>(defaultValue)
        return state
    }

    public createRemoteState = <K, V>(token: K) => {
        const state = createRemoteState<K, V>(token)
        this.remoteStateSet.add(state)
        return state
    }

    public createRemoteStateUsingDefaultValue = <K, V>(
        token: K,
        defaultValue: V
    ) => {
        const state = createRemoteState<K, V>(token, defaultValue)
        this.remoteStateSet.add(state)
        return state
    }

    public getState = <K extends keyof D>(key: K) => {
        if (!this.stateStore) {
            throw Error('store 未初始化')
        }
        return this.stateStore[key].getValue()
    }

    public setState = <K extends IStoreLocalStateKey<D>>(key: K, state: ReturnType<D[K]['getValue']>) => {
        if (!this.stateStore) {
            throw Error('store 未初始化')
        }
        ; (this.stateStore[key] as ILocalState).setValue(state)
    }

    public subscribeStateChange = <K extends keyof D>(key: K, callback: (state: ReturnType<D[K]['getValue']>) => any): IStateSubscription => {
        if (!this.stateStore) {
            throw Error('store 未初始化')
        }
        const callbackSet = this.callbackMap[key] ?? (this.callbackMap[key] = new Set())
        callbackSet.add(callback)

        const state = this.stateStore[key]
        const connection = subscribeStateChange(state, callback)
        const connectionSet = this.subscriptionMap[key] ?? (this.subscriptionMap[key] = new Set())
        connectionSet.add(connection)

        return {
            unsubscribe: () => {
                connection.unsubscribe()
                connectionSet.delete(connection)
            }
        }
    }

    public closeSubscriptions = () => {
        Object.keys(this.subscriptionMap).forEach((key: keyof D) => {
            const connectionSet = this.subscriptionMap[key]
            if (!connectionSet) {
                return
            }
            connectionSet.forEach((connection) => connection.unsubscribe())
            connectionSet.clear()
        })
        Object.keys(this.callbackMap).forEach((key: keyof D) => {
            const callbackSet = this.callbackMap[key]
            if (!callbackSet) {
                return
            }
            callbackSet.clear()
        })
    }

    public closeStates = () => {
        this.closeSubscriptions()
        if (this.stateStore) {
            Object.keys(this.stateStore).forEach((key: keyof D) => this.stateStore![key].closeState())
        }
        this.remoteStateSet.clear()
    }

    private getSnapshot = () => {
        if (!this.stateStore) {
            console.debug('store 未初始化')
            return
        }
        const states: {
            [key in keyof D]?: {
                value: ReturnType<D[key]['getValue']>
                connections?: Set<IStateConnectCallback<D, key>>
            }
        } = {}
        Object.keys(this.stateStore).forEach((key: keyof D) => {
            const state = this.stateStore![key]
            const callbacks = this.callbackMap[key] ?? new Set()
            states[key] = {
                value: state.getValue(),
                connections: callbacks
            }
        })
        console.debug(states)
    }
}

export function createStore<T extends IStoreStateData>(): IStoreBeforeCreate<T> {
    return new StateStore<T>()
}