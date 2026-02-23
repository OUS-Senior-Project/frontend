import { renderHook, act, waitFor } from '@testing-library/react';

type UseIsMobileHook = () => boolean;

const setupMatchMedia = () => {
  const listeners: Array<(event?: MediaQueryListEvent) => void> = [];
  const mql = {
    matches: false,
    media: '(max-width: 767px)',
    onchange: null,
    addEventListener: jest.fn((_event, cb) => {
      listeners.push(cb);
    }),
    removeEventListener: jest.fn((_event, cb) => {
      const index = listeners.indexOf(cb);
      if (index >= 0) listeners.splice(index, 1);
    }),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  } as unknown as MediaQueryList;

  window.matchMedia = jest.fn().mockImplementation(() => mql);

  return { listeners, mql };
};

const runUseMobileSuite = (label: string, useIsMobile: UseIsMobileHook) => {
  describe(label, () => {
    test('tracks window width changes', async () => {
      const { listeners, mql } = setupMatchMedia();

      window.innerWidth = 500;
      const { result, unmount } = renderHook(() => useIsMobile());

      await waitFor(() => expect(result.current).toBe(true));

      act(() => {
        window.innerWidth = 900;
        listeners.forEach((cb) => cb());
      });

      await waitFor(() => expect(result.current).toBe(false));

      unmount();
      expect(mql.removeEventListener).toHaveBeenCalled();
    });
  });
};

runUseMobileSuite('hooks/use-mobile', require('@/shared/hooks/useIsMobile').useIsMobile);
runUseMobileSuite(
  'shared/hooks index',
  require('@/shared/hooks').useIsMobile
);
