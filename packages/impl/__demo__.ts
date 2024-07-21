import { createState } from './state';
import { createStatesUsingDefault, createStates } from './state-store';
import { useState } from './use-state';
import { useStateChangedCallback } from './use-state-changed-callback';

// state types
const state1 = createState(); // type is any
const state2 = createState(1); // type is number
const state3 = createState<string>(); // type is string | undefined

// set/get/subscribe
const state2_value = state2.get(); // value is 1
state2.set(2); // set to 2
// state2.setState(undefined) // cannot set to undefined
state3.set(undefined); // can set to undefined
state2.subscribe((state) => console.log(state)); // subscribe changes

// create store
const store1 = createStates((create) => ({
    state1: create(1),
    state2: create('2'),
    state3: create<boolean>(true),
    state4: create(undefined),
    state5: create(), // this is unknown type
}));
const store1_state2 = store1.get('state2'); // type is string, value is '2'
const store1_state4 = store1.get('state4'); // type is unknown, value is undefined
store1.set('state3', false); // set to false
store1.set('state4', undefined); // undefined type can only be set to undefined
store1.set('state5', 1); // unknown type can be set to any value
store1.subscribe('state3', (state) => console.log(state)); // subscribe boolean changes
const store1_snap = store1.snapshot(); // snap current states
store1.close(); // earse all subscribers

// use default value to create store
const store2 = createStatesUsingDefault({
    state1: 1,
    state2: '2',
    state3: true,
    state4: undefined, // type of undefined is undefined
});
const store2_state2 = store2.get('state2'); // type is string, value is '2'
const store2_state4 = store2.get('state4'); // type is undefined
store2.set('state3', false); // set to false
store1.set('state4', undefined); // undefined type can only be set to undefined
store2.subscribe('state3', (state) => console.log(state)); // subscribe boolean changes
const store2_snap = store2.snapshot(); // snap current states
store2.close(); // earse all subscribers

// use state in react hook
function App() {
    const store1_state = useState(state1); // unknown
    useStateChangedCallback(state1, (state) => console.log(state));
}
