import * as React from 'react';
import { IStateController } from './state-controller';
import { IServerStateController } from './server-state-controller';

export function useState<T>(
	controller: IStateController<T> | IServerStateController<T>
) {
	const [state, setState] = React.useState<T>(controller.getState());
	React.useEffect(() => {
		const unsubscribe = controller.subscribe(setState);
		return () => unsubscribe();
	}, []);
	return state;
}
