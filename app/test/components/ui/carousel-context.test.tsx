import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  useCarousel,
  useCarouselState,
  type CarouselProps,
} from '@/shared/ui/carousel-context';
import { __emblaApiMock, __setEmblaApi } from 'embla-carousel-react';

function HookProbe(props: CarouselProps) {
  const state = useCarouselState(props);
  return (
    <div>
      <button type="button" onClick={state.scrollPrev}>
        Prev
      </button>
      <button type="button" onClick={state.scrollNext}>
        Next
      </button>
    </div>
  );
}

describe('carousel context hook', () => {
  afterEach(() => {
    __setEmblaApi(__emblaApiMock);
    __emblaApiMock.on.mockImplementation(() => undefined as any);
    __emblaApiMock.off.mockClear();
  });

  test('throws when useCarousel is used outside a provider', () => {
    function Probe() {
      useCarousel();
      return null;
    }

    expect(() => render(<Probe />)).toThrow(
      'useCarousel must be used within a <Carousel />'
    );
  });

  test('handles undefined api and missing setApi without crashing', () => {
    __setEmblaApi(undefined);

    expect(() => render(<HookProbe />)).not.toThrow();
    fireEvent.click(screen.getByText('Prev'));
    fireEvent.click(screen.getByText('Next'));
  });

  test('registers and cleans embla listeners when api exists', () => {
    __emblaApiMock.on.mockImplementation((event: string, cb: (api: unknown) => void) => {
      if (event === 'select' || event === 'reInit') {
        cb(__emblaApiMock);
      }
      return undefined as any;
    });

    const setApi = jest.fn();
    const { unmount } = render(<HookProbe orientation="vertical" setApi={setApi} />);

    expect(setApi).toHaveBeenCalledWith(__emblaApiMock);
    expect(__emblaApiMock.on).toHaveBeenCalledWith('reInit', expect.any(Function));
    expect(__emblaApiMock.on).toHaveBeenCalledWith('select', expect.any(Function));

    unmount();

    expect(__emblaApiMock.off).toHaveBeenCalledWith('select', expect.any(Function));
    expect(__emblaApiMock.off).toHaveBeenCalledWith('reInit', expect.any(Function));
  });
});
