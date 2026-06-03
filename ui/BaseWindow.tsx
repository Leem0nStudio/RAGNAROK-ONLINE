'use client';

import { UIWindow, type UIWindowProps } from './UIWindow';

export type BaseWindowProps = Omit<UIWindowProps, 'draggable' | 'closable'> & {
  draggable?: boolean;
  closable?: boolean;
};

export function BaseWindow(props: BaseWindowProps) {
  return (
    <UIWindow
      draggable
      closable
      defaultPosition={{ x: 52, y: 52 }}
      {...props}
    />
  );
}
