interface MockNowController {
  set(nowMs: number): void;
  advanceBy(deltaMs: number): void;
  restore(): void;
}

let activeNowRestore: (() => void) | null = null;

export function mockNow(initialNowMs = 0): MockNowController {
  resetMockNow();

  let nowMs = initialNowMs;
  const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => nowMs);

  const restore = () => {
    nowSpy.mockRestore();
    if (activeNowRestore === restore) {
      activeNowRestore = null;
    }
  };

  activeNowRestore = restore;

  return {
    set(nextNowMs: number) {
      nowMs = nextNowMs;
    },
    advanceBy(deltaMs: number) {
      nowMs += deltaMs;
    },
    restore,
  };
}

export function resetMockNow() {
  activeNowRestore?.();
  activeNowRestore = null;
}
