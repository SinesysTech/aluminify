'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export type CarouselApi = {
  scrollNext: () => void
  scrollPrev: () => void
  canScrollNext: boolean
  canScrollPrev: boolean
  scrollSnapList: () => unknown[]
  selectedScrollSnap: () => number
  on: (event: string, callback: () => void) => void
  off: (event: string, callback: () => void) => void
}

interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  setApi?: (api: CarouselApi | undefined) => void
}

export const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  ({ className, setApi, ...props }, ref) => {
    const [canScrollNext, setCanScrollNext] = React.useState(false)
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)

    React.useEffect(() => {
      if (setApi) {
        setApi({
          scrollNext: () => {},
          scrollPrev: () => {},
          canScrollNext,
          canScrollPrev,
          scrollSnapList: () => [],
          selectedScrollSnap: () => 0,
          on: () => {},
          off: () => {},
        })
      }
    }, [setApi, canScrollNext, canScrollPrev])

    return (
      <div
        ref={ref}
        className={cn('relative', className)}
        {...props}
      />
    )
  }
)
Carousel.displayName = 'Carousel'

export const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex', className)}
    {...props}
  />
))
CarouselContent.displayName = 'CarouselContent'

export const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('min-w-0 shrink-0 grow-0 basis-full', className)}
    {...props}
  />
))
CarouselItem.displayName = 'CarouselItem'

