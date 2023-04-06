import {
	closeStates,
	createState,
	createStates,
	exportStates,
	StateFactory,
} from './state-controller';
import { StateStore } from './state-store';
import { useState } from './use-state';
import { useStateChangedCallback } from './use-state-changed-callback';

// state types
const state1 = createState(); // any
const state2 = createState(1); // number
const state3 = createState<string>(); // string | undefined

// set/get state value
const state2_value = state2.getState(); // 1
state2.setState(2); // 2
// state2.setState(undefined) // cannot set to undefined
state3.setState(undefined); // can set to undefined

// subcribe changes
state2.subscribe((state) => console.log(state));

// state group
const states1 = createStates((create) => ({
	state1: create(),
	state2: create(1),
	state3: create<string>(),
}));
states1.state2.getState(); // 1
states1.state2.setState(2); // 2

const states1_readonly = exportStates(states1);
states1_readonly.state2.getState(); // can get
// states1_readonly.state2.setState(2) // cannot use setState
states1_readonly.state2.subscribe((state) => console.log(state)); // can subscribe

closeStates(states1); // earse all subscribers

// state store
class States2 extends StateStore<{
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
const states2 = new States2();
states2.useStates.state2.getState(); // can get
// states2.useStates.state2.setState(2) // set methods are private
states2.updateState2(2); // use public method to set states
states2.useStates.state2.subscribe((state) => console.log(state)); // can subscribe

// use state in react hook
function App() {
	const state1_state = useState(state1); // any
	useStateChangedCallback(state1, (state) => console.log(state));
}
