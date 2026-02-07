import {
  TOAST_LIMIT,
  TOAST_REMOVE_DELAY,
  actionTypes,
  type Action,
  type State,
} from '@/shared/hooks/toast/toast-types';

describe('toast types module', () => {
  test('exports runtime toast constants', () => {
    expect(TOAST_LIMIT).toBe(1);
    expect(TOAST_REMOVE_DELAY).toBe(1000000);
  });

  test('exports action type names', () => {
    expect(actionTypes.ADD_TOAST).toBe('ADD_TOAST');
    expect(actionTypes.UPDATE_TOAST).toBe('UPDATE_TOAST');
    expect(actionTypes.DISMISS_TOAST).toBe('DISMISS_TOAST');
    expect(actionTypes.REMOVE_TOAST).toBe('REMOVE_TOAST');
  });

  test('Action and State types accept expected structures', () => {
    const state: State = { toasts: [] };
    const action: Action = {
      type: actionTypes.DISMISS_TOAST,
      toastId: 'toast-id',
    };

    expect(state.toasts).toHaveLength(0);
    expect(action.type).toBe('DISMISS_TOAST');
  });
});
