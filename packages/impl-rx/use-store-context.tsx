import { useEffect, useState } from 'react'
import { IStoreStateData, IStoreAfterCreate, IStoreStateKey } from './store'

export function useStoreContext<T extends IStoreStateData>(store: IStoreAfterCreate<T>) {
    const getState = <K extends keyof T>(key: K) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [state, setState] = useState(store.getState(key))
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
            const { unsubscribe } = store.subscribeStateChange(key, setState)
            return () => unsubscribe()
        }, [])
        return state
    }
    const setState =
        <K extends IStoreStateKey<T>>(key: K) =>
            (state: ReturnType<T[K]['getState']>) =>
                store.setState(key, state)
    return {
        useState: getState,
        useSetState: setState
    }
}
