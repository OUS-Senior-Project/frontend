import { render, screen, fireEvent } from '@testing-library/react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { __emblaApiMock, __setEmblaApi } from 'embla-carousel-react';

describe('Carousel', () => {
  test('throws when used outside provider', () => {
    expect(() => render(<CarouselContent />)).toThrow(
      'useCarousel must be used within a <Carousel />'
    );
  });

  test('handles keyboard navigation and orientation', () => {
    __emblaApiMock.canScrollPrev.mockReturnValue(true);
    __emblaApiMock.canScrollNext.mockReturnValue(false);
    __emblaApiMock.on.mockImplementation((event: string, cb: (api?: unknown) => void) => {
      if (event === 'select') {
        cb(undefined);
      }
      return undefined as any;
    });
    const setApi = jest.fn();

    const { container, rerender } = render(
      <Carousel setApi={setApi}>
        <CarouselContent>
          <CarouselItem>Slide</CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    );

    expect(setApi).toHaveBeenCalled();

    const region = screen.getByRole('region');
    fireEvent.keyDown(region, { key: 'ArrowLeft' });
    fireEvent.keyDown(region, { key: 'ArrowRight' });

    expect(__emblaApiMock.scrollPrev).toHaveBeenCalled();
    expect(__emblaApiMock.scrollNext).toHaveBeenCalled();

    const prevButton = screen.getByText('Previous slide').closest('button');
    const nextButton = screen.getByText('Next slide').closest('button');
    expect(prevButton).not.toBeDisabled();
    expect(nextButton).toBeDisabled();

    const outer = container.querySelector('[data-slot="carousel-content"]');
    const inner = outer?.firstElementChild as HTMLElement;
    expect(inner.className).toContain('-ml-4');

    rerender(
      <Carousel orientation={null as any} opts={{ axis: 'y' }}>
        <CarouselContent>
          <CarouselItem>Vertical</CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    );

    const verticalOuter = container.querySelector('[data-slot="carousel-content"]');
    const verticalInner = verticalOuter?.firstElementChild as HTMLElement;
    expect(verticalInner.className).toContain('-mt-4');

    rerender(
      <Carousel orientation={'' as any}>
        <CarouselContent>
          <CarouselItem>Horizontal Fallback</CarouselItem>
        </CarouselContent>
      </Carousel>
    );

    const horizontalOuter = container.querySelector('[data-slot="carousel-content"]');
    const horizontalInner = horizontalOuter?.firstElementChild as HTMLElement;
    expect(horizontalInner.className).toContain('-ml-4');

    __emblaApiMock.on.mockImplementation(() => undefined as any);
  });

  test('gracefully handles missing carousel api', () => {
    __setEmblaApi(undefined);
    expect(() =>
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>No API</CarouselItem>
          </CarouselContent>
        </Carousel>
      )
    ).not.toThrow();
    __setEmblaApi(__emblaApiMock);
  });
});
