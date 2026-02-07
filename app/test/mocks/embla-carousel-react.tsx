import * as React from 'react';

let api = {
  canScrollPrev: jest.fn(() => false),
  canScrollNext: jest.fn(() => true),
  scrollPrev: jest.fn(),
  scrollNext: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

const useEmblaCarousel = jest.fn((_opts?: unknown, _plugins?: unknown) => {
  const ref = React.createRef<HTMLDivElement>();
  return [ref, api] as const;
});

export default useEmblaCarousel;
export type UseEmblaCarouselType = ReturnType<typeof useEmblaCarousel>;
export const __emblaApiMock = api;
export const __setEmblaApi = (nextApi: typeof api | undefined) => {
  api = nextApi as typeof api;
};
