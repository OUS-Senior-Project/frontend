import { reducer } from './toast-reducer';
import type { Action, State, ToastInput, ToasterToast } from './toast-types';
import { TOAST_REMOVE_DELAY } from './toast-types';

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const listeners: Array<(state: State) => void> = [];

let count = 0;
let memoryState: State = { toasts: [] };

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) return;
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: 'REMOVE_TOAST', toastId });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(toastId, timeout);
};

const dispatch = (action: Action) => {
  if (action.type === 'DISMISS_TOAST') {
    if (action.toastId) addToRemoveQueue(action.toastId);
    else memoryState.toasts.forEach((toast) => addToRemoveQueue(toast.id));
  }
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
};

const genId = () => {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
};

export const toast = (props: ToastInput) => {
  const id = genId();
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });
  const update = (next: ToasterToast) =>
    dispatch({ type: 'UPDATE_TOAST', toast: { ...next, id } });

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });
  return { id, dismiss, update };
};

export const subscribe = (listener: (state: State) => void) => {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) listeners.splice(index, 1);
  };
};

export const getToastState = () => memoryState;

export const dismissToast = (toastId?: string) =>
  dispatch({ type: 'DISMISS_TOAST', toastId });
