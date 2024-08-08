# demo-reactive-state

Sometimes we might think how hard and complex it would be to create and manage a single or a bunch of reactive state(s) which can be reponsive for React. It turns out to be very simple :)

The reason why I choose `useState` with `useEffect` instead of `useSyncExternalStore` to build this demo is the main difference behind this word `sync` (actually `flushSync`): the state updating from externalStore cannot be scheduled by React (cannot be batch updated with other `setState` changes), so they alwasy re-render first and individually. This can cause quite big and unexpected affect.
