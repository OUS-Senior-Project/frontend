import { act, renderHook } from '@testing-library/react';
import * as hooksToast from '@/shared/hooks/useToast';
import * as uiToast from '@/shared/ui/use-toast';

const runToastSuite = (
  label: string,
  mod: typeof hooksToast | typeof uiToast
) => {
  describe(label, () => {
    test('adds, updates, dismisses, and removes toasts', () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => mod.useToast());

      let toastInstance: { update: (props: any) => void; dismiss: () => void } | null = null;
      act(() => {
        toastInstance = mod.toast({ title: 'Hello', description: 'World' });
      });

      expect(result.current.toasts).toHaveLength(1);
      const activeToast = result.current.toasts[0];
      expect(activeToast.open).toBe(true);

      act(() => {
        toastInstance?.update({ id: activeToast.id, title: 'Updated' } as any);
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        toastInstance?.dismiss();
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.toasts).toHaveLength(0);
      jest.useRealTimers();
    });

    test('dismiss without id closes all toasts and uses remove queue', () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => mod.useToast());

      act(() => {
        mod.toast({ title: 'One' });
        mod.toast({ title: 'Two' });
      });

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.toasts[0]?.open).toBe(false);

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.toasts).toHaveLength(0);
      jest.useRealTimers();
    });

    test('dismiss with id ignores duplicate queue entries', () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => mod.useToast());

      act(() => {
        mod.toast({ title: 'Duplicate' });
      });

      const id = result.current.toasts[0]?.id;
      act(() => {
        result.current.dismiss(id);
        result.current.dismiss(id);
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.toasts).toHaveLength(0);
      jest.useRealTimers();
    });

    test('dismiss with id only closes matching toast', () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => mod.useToast());

      act(() => {
        mod.toast({ title: 'First' });
        mod.toast({ title: 'Second' });
      });

      const [second, first] = result.current.toasts;
      act(() => {
        result.current.dismiss(first?.id);
      });

      expect(second?.open).toBe(true);

      act(() => {
        jest.runAllTimers();
      });

      jest.useRealTimers();
    });

    test('onOpenChange closes toast when set to false', () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => mod.useToast());

      act(() => {
        mod.toast({ title: 'OpenChange' });
      });

      const toast = result.current.toasts[0];
      act(() => {
        toast?.onOpenChange?.(false);
      });

      expect(result.current.toasts[0]?.open).toBe(false);
      jest.useRealTimers();
    });

    test('reducer handles remove without id', () => {
      const state = { toasts: [{ id: '1', open: true } as any] };
      const next = mod.reducer(state, { type: 'REMOVE_TOAST' });
      expect(next.toasts).toHaveLength(0);
    });

    test('reducer updates existing toast', () => {
      const state = {
        toasts: [
          { id: '1', open: true, title: 'A' } as any,
          { id: '2', open: true, title: 'C' } as any,
        ],
      };
      const next = mod.reducer(state, {
        type: 'UPDATE_TOAST',
        toast: { id: '1', title: 'B' },
      });
      expect(next.toasts[0].title).toBe('B');
      expect(next.toasts[1].title).toBe('C');
    });

    test('reducer dismisses only matching toast', () => {
      jest.useFakeTimers();
      const state = {
        toasts: [
          { id: '1', open: true } as any,
          { id: '2', open: true } as any,
        ],
      };
      const next = mod.reducer(state, {
        type: 'DISMISS_TOAST',
        toastId: '1',
      });
      expect(next.toasts[0].open).toBe(false);
      expect(next.toasts[1].open).toBe(true);
      jest.runAllTimers();
      jest.useRealTimers();
    });
  });
};

runToastSuite('hooks/use-toast', hooksToast);
runToastSuite('components/ui/use-toast', uiToast);
