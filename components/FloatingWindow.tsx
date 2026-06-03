'use client';

import React from 'react';
import { UIWindow } from '@/ui/UIWindow';

interface FloatingWindowProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function FloatingWindow({ title, isOpen, onClose, children }: FloatingWindowProps) {
  return (
    <UIWindow title={title} isOpen={isOpen} onClose={onClose} type="panel" draggable className="max-w-lg">
      {children}
    </UIWindow>
  );
}
