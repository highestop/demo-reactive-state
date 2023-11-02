import { createState } from './state-controller';
import { closeStates, createStates, exportStates } from './state-group';
import { StateStore } from './state-store';
import { useState } from './use-state';
import { useStateChangedCallback } from './use-state-changed-callback';

// state types
const state1 = createState(); // type is any
const state2 = createState(1); // type is number
const state3 = createState<string>(); // type is string | undefined

// set/get state value
const state2_value = state2.getState(); // value is 1
state2.setState(2); // set to 2
// state2.setState(undefined) // cannot set to undefined
state3.setState(undefined); // can set to undefined

// subscribe changes
state2.subscribe((state) => console.log(state));

// state group
const states1 = createStates((create) => ({
    state1: create(),
    state2: create(1),
    state3: create<string>(),
}));
states1.state2.getState(); // value is 1
states1.state2.setState(2); // set to 2

const states1_readonly = exportStates(states1);
states1_readonly.state2.getState(); // can get
// states1_readonly.state2.setState(2) // cannot be set
states1_readonly.state2.subscribe((state) => console.log(state)); // can be subscribed

closeStates(states1); // earse all subscribers

// state store
class StatesStore extends StateStore<{
    state1: any;
    state2: number;
    state3: string | undefined;
}> {
    constructor() {
        super((create) => ({
            state1: create(),
            state2: create(1),
            state3: create<string>(),
        }));
    }
    updateState2(state: number) {
        this.states.state2.setState(state);
    }
}
const statesStore = new StatesStore();
statesStore.useStates.state2.getState(); // can get
// states2.useStates.state2.setState(2) // set methods are private
statesStore.updateState2(2); // can be set
statesStore.useStates.state2.subscribe((state) => console.log(state)); // can be subscribed

// use state in react hook
function App() {
    const state1_state = useState(state1); // any
    useStateChangedCallback(state1, (state) => console.log(state));
}
