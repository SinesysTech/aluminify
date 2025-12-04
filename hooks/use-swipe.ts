import { useRef, useState, useCallback } from 'react'

interface UseSwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number // Minimum distance in pixels to trigger swipe
  velocityThreshold?: number // Minimum velocity to trigger swipe
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  velocityThreshold = 0.3,
}: UseSwipeOptions = {}) {
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null)
  const [isSwiping, setIsSwiping] = useState(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    }
    setIsSwiping(true)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Prevent scrolling while swiping
    if (touchStart.current) {
      const touch = e.touches[0]
      const deltaX = Math.abs(touch.clientX - touchStart.current.x)
      const deltaY = Math.abs(touch.clientY - touchStart.current.y)

      // If horizontal movement is greater than vertical, prevent default scroll
      if (deltaX > deltaY && deltaX > 10) {
        e.preventDefault()
      }
    }
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStart.current.x
      const deltaY = touch.clientY - touchStart.current.y
      const deltaTime = Date.now() - touchStart.current.time
      const distance = Math.abs(deltaX)
      const velocity = distance / deltaTime

      // Only trigger swipe if:
      // 1. Horizontal movement is greater than vertical (more horizontal than vertical)
      // 2. Distance is greater than threshold
      // 3. Velocity is greater than velocity threshold (or distance is very large)
      if (
        Math.abs(deltaX) > Math.abs(deltaY) &&
        distance > threshold &&
        (velocity > velocityThreshold || distance > threshold * 2)
      ) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight()
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft()
        }
      }

      touchStart.current = null
      setIsSwiping(false)
    },
    [threshold, velocityThreshold, onSwipeLeft, onSwipeRight]
  )

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    isSwiping,
  }
}




