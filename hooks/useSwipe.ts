import React, { useState, useCallback } from 'react';

interface SwipeInput {
  onSwipedLeft: () => void;
  onSwipedRight: () => void;
}

interface SwipeOutput {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

const MIN_SWIPE_DISTANCE = 50;

export const useSwipe = (input: SwipeInput): SwipeOutput => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    // Ignore multi-touch gestures to avoid conflict with pinch-to-zoom
    if (e.touches.length > 1) {
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }
    setTouchEnd(null); // otherwise the swipe is fired even with a single touch
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    // Only track movement for single touches
    if (e.touches.length > 1) {
      return;
    }
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > MIN_SWIPE_DISTANCE;
    const isRightSwipe = distance < -MIN_SWIPE_DISTANCE;

    if (isLeftSwipe) {
      input.onSwipedLeft();
    } else if (isRightSwipe) {
      input.onSwipedRight();
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, input]);
  
  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};
