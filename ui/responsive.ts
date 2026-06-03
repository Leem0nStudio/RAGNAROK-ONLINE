'use client';

import { useState, useEffect } from 'react';

export const breakpoints = {
  mobileSmall: 320,
  mobile: 360,
  mobileLarge: 420,
  tablet: 500,
} as const;

export type BreakpointKey = keyof typeof breakpoints;

export function getBreakpoint(width: number): BreakpointKey {
  if (width < breakpoints.mobile) return 'mobileSmall';
  if (width < breakpoints.mobileLarge) return 'mobile';
  if (width < breakpoints.tablet) return 'mobileLarge';
  return 'tablet';
}

export function isMobile(width: number): boolean {
  return width < breakpoints.tablet;
}

export function useResponsive() {
  const [width, setWidth] = useState(() => {
    if (typeof window === 'undefined') return breakpoints.mobile;
    return window.innerWidth;
  });

  useEffect(() => {
    let frameId: number;
    const handleResize = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => setWidth(window.innerWidth));
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
    };
  }, []);

  const breakpoint = getBreakpoint(width);
  const isMobileView = width < breakpoints.tablet;

  return { width, breakpoint, isMobileView };
}
