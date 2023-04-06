import {
	IStateSubscription as IStateSubscription,
	subscribeStateChange,
} from './subscription';
import { IState, createState } from './create-state';
import {
	createServerState,
	IServerState,
	IServerStateService,
} from './server-state';

export interface IStoreStateData {
	[key: string]: IState | IServerState;
}

export type IStoreStateKey<D extends IStoreStateData> = {
	[key in keyof D]: D[key] extends IState ? key : never;
}[keyof D];

export type IStoreServerStateKey<D extends IStoreStateData> = {
	[key in keyof D]: D[key] extends IServerState ? key : never;
}[keyof D];

export type IStateConnectCallback<
	D extends IStoreStateData,
	K extends keyof D
> = (state: ReturnType<D[K]['getState']>) => any;

// store factory interface
export interface IStoreFactory {
	createLocalState: <T>() => IState<T | undefined>;
	createLocalStateUsingDefaultValue: <T>(defaultValue: T) => IState<T>;
	createRemoteState: <T, V>(token: T) => IServerState<V | undefined>;
	createRemoteStateUsingDefaultValue: <K, V>(
		token: K,
		defaultValue: V
	) => IServerState<V>;
}

// store interface
interface IStoreBase<D extends IStoreStateData> {
	createStates: (
		factory: (store: IStoreFactory) => D
	) => IStoreAfterCreate<D>;
	getState: <K extends keyof D>(key: K) => ReturnType<D[K]['getState']>;
	setState: <K extends IStoreStateKey<D>>(
		key: K,
		state: ReturnType<D[K]['getState']>
	) => void;
	connectServer: (service: IServerStateService) => void;
	subscribeStateChange: <K extends keyof D>(
		key: K,
		callback: IStateConnectCallback<D, K>
	) => IStateSubscription;
	resetStates: () => void;
	closeSubscriptions: () => void;
	closeStates: () => void;
}

export type IStoreBeforeCreate<T extends IStoreStateData> = Pick<
	IStoreBase<T>,
	'createStates'
>;

export type IStoreAfterCreate<T extends IStoreStateData> = Omit<
	IStoreBase<T>,
	'createStates'
>;

type IStateStore<T extends IStoreStateData> = IStoreBase<T> & IStoreFactory;

export class StateStore<D extends IStoreStateData> implements IStateStore<D> {
	private stateStore: D | null = null;
	private remoteStateSet: Set<IServerState> = new Set();
	private subscriptionMap: { [key in keyof D]?: Set<IStateSubscription> } =
		{};
	private callbackMap: {
		[key in keyof D]?: Set<IStateConnectCallback<D, key>>;
	} = {};
	private stateFactory: ((store: IStoreFactory) => D) | null = null;

	public createStates = (factory: (store: IStoreFactory) => D) => {
		if (this.stateStore) {
			throw Error('store cannot be inited agian');
		}
		this.stateFactory = factory;
		this.stateStore = this.stateFactory(this);
		return this;
	};

	public resetStates = () => {
		if (!this.stateFactory) {
			throw Error('store has not been inited');
		}
		this.stateStore = this.stateFactory(this);
	};

	public connectServer = (service: IServerStateService) => {
		if (this.remoteStateSet.size) {
			this.remoteStateSet.forEach((state) =>
				state.connectService(service)
			);
		}
	};

	public createLocalState = <V>() => {
		const state = createState<V>();
		return state;
	};

	public createLocalStateUsingDefaultValue = <V>(defaultValue: V) => {
		const state = createState<V>(defaultValue);
		return state;
	};

	public createRemoteState = <K, V>(token: K) => {
		const state = createServerState<K, V>(token);
		this.remoteStateSet.add(state);
		return state;
	};

	public createRemoteStateUsingDefaultValue = <K, V>(
		token: K,
		defaultValue: V
	) => {
		const state = createServerState<K, V>(token, defaultValue);
		this.remoteStateSet.add(state);
		return state;
	};

	public getState = <K extends keyof D>(key: K) => {
		if (!this.stateStore) {
			throw Error('store has not been inited');
		}
		return this.stateStore[key].getState();
	};

	public setState = <K extends IStoreStateKey<D>>(
		key: K,
		state: ReturnType<D[K]['getState']>
	) => {
		if (!this.stateStore) {
			throw Error('store has not been inited');
		}
		(this.stateStore[key] as IState).setState(state);
	};

	public subscribeStateChange = <K extends keyof D>(
		key: K,
		callback: (state: ReturnType<D[K]['getState']>) => any
	): IStateSubscription => {
		if (!this.stateStore) {
			throw Error('store has not been inited');
		}
		const callbackSet =
			this.callbackMap[key] ?? (this.callbackMap[key] = new Set());
		callbackSet.add(callback);

		const state = this.stateStore[key];
		const connection = subscribeStateChange(state, callback);
		const connectionSet =
			this.subscriptionMap[key] ??
			(this.subscriptionMap[key] = new Set());
		connectionSet.add(connection);

		return {
			unsubscribe: () => {
				connection.unsubscribe();
				connectionSet.delete(connection);
			},
		};
	};

	public closeSubscriptions = () => {
		Object.keys(this.subscriptionMap).forEach((key: keyof D) => {
			const connectionSet = this.subscriptionMap[key];
			if (!connectionSet) {
				return;
			}
			connectionSet.forEach((connection) => connection.unsubscribe());
			connectionSet.clear();
		});
		Object.keys(this.callbackMap).forEach((key: keyof D) => {
			const callbackSet = this.callbackMap[key];
			if (!callbackSet) {
				return;
			}
			callbackSet.clear();
		});
	};

	public closeStates = () => {
		this.closeSubscriptions();
		if (this.stateStore) {
			Object.keys(this.stateStore).forEach((key: keyof D) =>
				this.stateStore![key].closeState()
			);
		}
		this.remoteStateSet.clear();
	};

	public getSnapshot = () => {
		if (!this.stateStore) {
			console.debug('store has not been inited');
			return;
		}
		const states: {
			[key in keyof D]?: {
				value: ReturnType<D[key]['getState']>;
				connections?: Set<IStateConnectCallback<D, key>>;
			};
		} = {};
		Object.keys(this.stateStore).forEach((key: keyof D) => {
			const state = this.stateStore![key];
			const callbacks = this.callbackMap[key] ?? new Set();
			states[key] = {
				value: state.getState(),
				connections: callbacks,
			};
		});
		console.debug(states);
	};
}

export function createStore<
	T extends IStoreStateData
>(): IStoreBeforeCreate<T> {
	return new StateStore<T>();
}
