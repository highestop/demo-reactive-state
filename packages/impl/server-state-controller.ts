export type ServerStateToken = string;
export type ServerStateTokenTypeMap = { [token: ServerStateToken]: any };

export interface IServerStateService {
	register: <K, V>(token: K, setState: (state: V) => void) => void;
	unregister: <K, V>(token: K, setState: (state: V) => void) => void;
	getCurrentState: <K, V>(token: K, defaultValue?: V) => V;
}

export interface IServerStateController<T, R = T> {
	getState: () => R;
	connect: (service: IServerStateService) => void;
	subscribe: (callback: (state: T) => void) => () => void;
	close: () => void;
}

function createServerState<T extends ServerStateToken>(
	token: T
): IServerStateController<
	ServerStateTokenTypeMap[T],
	ServerStateTokenTypeMap[T] | undefined
>;
function createServerState<T extends ServerStateToken>(
	token: T,
	defaultValue: ServerStateTokenTypeMap[T]
): IServerStateController<ServerStateTokenTypeMap[T] | undefined>;
function createServerState<T extends ServerStateToken>(
	token: T,
	defaultValue?: ServerStateTokenTypeMap[T]
): IServerStateController<ServerStateTokenTypeMap[T] | undefined> {
	let service: IServerStateService | null = null;
	let closed = false;
	const callbacks: Set<
		(state: ServerStateTokenTypeMap[T] | undefined) => void
	> = new Set();
	const getState = () => {
		if (service) {
			return service.getCurrentState(token, defaultValue);
		}
		return defaultValue;
	};
	const setState = (state: ServerStateTokenTypeMap[T] | undefined) => {
		if (closed) {
			throw Error('ReactiveState 已经被关闭');
		}
		callbacks.forEach((callback) => callback(state));
	};
	const subscribe = (
		callback: (state: ServerStateTokenTypeMap[T] | undefined) => void
	) => {
		if (closed) {
			throw Error('ReactiveState 已经被关闭');
		}
		callbacks.add(callback);
		return () => callbacks.delete(callback);
	};
	const connect = (_service: IServerStateService) => {
		if (closed) {
			throw Error('ReactiveState 已经被关闭');
		}
		service = _service;
		service.register(token, setState);
	};
	const close = () => {
		if (service) {
			service.unregister(token, setState);
		}
		callbacks.clear();
		closed = true;
	};
	return { connect, getState, subscribe, close };
}

export function createServerStates<
	D extends {
		[key in ServerStateToken]?:
			| IServerStateController<ServerStateTokenTypeMap[key]>
			| IServerStateController<ServerStateTokenTypeMap[key] | undefined>;
	}
>(factory: (createState: typeof createServerState) => D): D {
	return factory(createServerState);
}

export function connectServerStates<
	D extends {
		[key in ServerStateToken]?:
			| IServerStateController<ServerStateTokenTypeMap[key]>
			| IServerStateController<ServerStateTokenTypeMap[key] | undefined>;
	}
>(controllers: D, service: IServerStateService) {
	Object.values(controllers).forEach((controller) =>
		controller?.connect(service)
	);
}

export function closeServerStates<
	D extends {
		[key in ServerStateToken]?:
			| IServerStateController<ServerStateTokenTypeMap[key]>
			| IServerStateController<ServerStateTokenTypeMap[key] | undefined>;
	}
>(controllers: D) {
	Object.values(controllers).forEach((controller) => controller?.close());
}
