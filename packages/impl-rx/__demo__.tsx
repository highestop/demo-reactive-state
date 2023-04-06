import { IStoreFactory, createStore } from "./store"
import { useStoreContext } from "./use-store-context"

// define states
const storeFactory = (store: IStoreFactory) => ({
    a: store.createLocalState<string>(),
    b: store.createLocalStateUsingDefaultValue<string>('1'),
    c: store.createRemoteState<'c', string>('c')
})

// build store
export const store = createStore<ReturnType<typeof storeFactory>>().createStates(storeFactory)
export const { useState, useSetState } = useStoreContext(store)

/////

// get state from store by key
const aValue: string | undefined = store.getState('a')
const bValue: string = store.getState('b')

// set state in store, only for reactive state, not remote state
store.setState('a', 'a')
// store.setState('c', 'c') // shouldn't set state 'c' because it's remote

// subscribe to state change
const connection = store.subscribeStateChange('a', (v) => console.log(v))
connection.unsubscribe()

// close all subscriptions
store.closeSubscriptions()

// reset all states
store.resetStates()

// close all states
store.closeStates()

/////

// use in hook
function useStateHook() {
    const aState = useState('a')
    const bState = useState('b')

    const aSetState = useSetState('a')
    // const cSetState = useSetState('c') // cannot set state 'c' because it's remote

    return null
}