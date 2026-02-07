'use client';

import * as React from 'react';
import { reducer } from './toast/toast-reducer';
import { dismissToast, getToastState, subscribe, toast } from './toast/toast-store';

export function useToast() {
  const [state, setState] = React.useState(getToastState());

  React.useEffect(() => subscribe(setState), []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dismissToast(toastId),
  };
}

export { reducer, toast };
