'use client';

import { type Transition, type Variants } from 'motion/react';

export function createMotionConfig(
  variants: Variants,
  transition: Transition,
) {
  return { variants, transition } as const;
}

export const MOTION = {
  window: createMotionConfig(
    {
      hidden: { opacity: 0, scale: 0.95, y: 12 },
      visible: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.95, y: 12 },
    },
    { duration: 0.15, ease: 'easeOut' },
  ),
  windowSpring: createMotionConfig(
    {
      hidden: { opacity: 0, scale: 0.95, y: 12 },
      visible: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.95, y: 12 },
    },
    { type: 'spring', stiffness: 400, damping: 28 },
  ),
  tooltip: createMotionConfig(
    {
      hidden: { opacity: 0, y: 4 },
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 4 },
    },
    { duration: 0.1, ease: 'easeOut' },
  ),
  notification: createMotionConfig(
    {
      hidden: { opacity: 0, y: -20, scale: 0.9 },
      visible: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -20, scale: 0.9 },
    },
    { duration: 0.25, ease: 'easeOut' },
  ),
  fadeSlide: createMotionConfig(
    {
      hidden: { opacity: 0, x: -10 },
      visible: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 10 },
    },
    { duration: 0.15, ease: 'easeOut' },
  ),
  scaleFade: createMotionConfig(
    {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.8 },
    },
    { duration: 0.12, ease: 'easeOut' },
  ),
  backdrop: createMotionConfig(
    {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
    { duration: 0.2, ease: 'easeOut' },
  ),
} as const;

export type MotionKey = keyof typeof MOTION;
