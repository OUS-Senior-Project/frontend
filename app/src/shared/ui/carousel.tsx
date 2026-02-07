'use client';

import * as React from 'react';
import { cn } from '@/shared/utils/cn';
import { CarouselContext, type CarouselApi, type CarouselProps, useCarouselState } from './carousel-context';
export { CarouselContent, CarouselItem } from './carousel-viewport';
export { CarouselNext, CarouselPrevious } from './carousel-controls';

export function Carousel({
  orientation = 'horizontal',
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & CarouselProps) {
  const { api, carouselRef, canScrollNext, canScrollPrev, scrollNext, scrollPrev } = useCarouselState({ orientation, opts, plugins, setApi });
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollPrev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollNext();
    }
  }, [scrollPrev, scrollNext]);

  return (
    <CarouselContext.Provider value={{ carouselRef, api, opts, orientation: orientation || (opts?.axis === 'y' ? 'vertical' : 'horizontal'), scrollPrev, scrollNext, canScrollPrev, canScrollNext }}>
      <div onKeyDownCapture={handleKeyDown} className={cn('relative', className)} role="region" aria-roledescription="carousel" data-slot="carousel" {...props}>
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

export type { CarouselApi };
