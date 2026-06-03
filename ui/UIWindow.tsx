'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { layers } from './layers';
import { colors, spacing, radii, fontSizes } from './theme';
import { useDragWindow } from './useDragWindow';

export type WindowType = 'panel' | 'dialog' | 'modal';

export interface UIWindowProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  isOpen: boolean;
  width?: number | string;
  height?: number | string;
  closable?: boolean;
  className?: string;
  headerContent?: React.ReactNode;
  footer?: React.ReactNode;
  type?: WindowType;
  draggable?: boolean;
  defaultPosition?: { x: number; y: number };
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const windowVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 12 },
};

let zCounter = 100;

export function UIWindow({
  title,
  children,
  onClose,
  isOpen,
  width = '90vw',
  height = 'auto',
  closable = true,
  className = '',
  headerContent,
  footer,
  type = 'panel',
  draggable = false,
  defaultPosition,
}: UIWindowProps) {
  const showBackdrop = type === 'dialog' || type === 'modal';
  const showingContent = type === 'modal' ? { width: '100%', maxWidth: '100%', maxHeight: '100%' } : {};
  const { pos, isDragging, nodeRef, dragHandlers, resetPosition } = useDragWindow({ initialPosition: defaultPosition });
  const dragEnabled = draggable && !showBackdrop;
  const [z, setZ] = useState(() => zCounter++);

  const bringToFront = useCallback(() => {
    zCounter++;
    setZ(zCounter);
  }, []);

  const handleHeaderPointerDown = useCallback((e: React.PointerEvent) => {
    bringToFront();
    if (dragEnabled) {
      dragHandlers.onPointerDown(e);
    }
  }, [dragEnabled, dragHandlers, bringToFront]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {showBackdrop && (
            <motion.div
              key="uiwindow-backdrop"
              className="fixed inset-0"
              style={{ backgroundColor: 'rgba(15, 10, 8, 0.55)', zIndex: layers.windows }}
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: 0.15 }}
              onClick={showBackdrop ? onClose : undefined}
            />
          )}
          {dragEnabled ? (
            <motion.div
              key="uiwindow-draggable"
              ref={nodeRef}
              className="fixed font-serif pointer-events-none"
              style={{
                zIndex: z,
                left: pos.x,
                top: pos.y,
                width: typeof width === 'number' ? width : width,
                height: typeof height === 'number' ? height : height,
                maxWidth: typeof width === 'number' ? width : 500,
                maxHeight: typeof height === 'number' ? height : '90vh',
              }}
              variants={windowVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.15 }}
              onPointerDown={bringToFront}
            >
              <WindowContent
                title={title}
                onClose={onClose}
                closable={closable}
                className={className}
                headerContent={headerContent}
                footer={footer}
                width={width}
                height={height}
                dragHandlers={{
                  onPointerDown: handleHeaderPointerDown,
                  onPointerMove: dragHandlers.onPointerMove,
                  onPointerUp: dragHandlers.onPointerUp,
                }}
                isDragging={isDragging}
              >
                {children}
              </WindowContent>
            </motion.div>
          ) : (
            <motion.div
              key="uiwindow-container"
              className="fixed inset-0 flex items-center justify-center p-2 font-serif pointer-events-none"
              style={{ zIndex: showBackdrop ? layers.windows + 1 : z }}
              variants={windowVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              onPointerDown={bringToFront}
            >
              <WindowContent
                title={title}
                onClose={onClose}
                closable={closable}
                className={className}
                headerContent={headerContent}
                footer={footer}
                width={width}
                height={height}
                showingContent={showingContent}
              >
                {children}
              </WindowContent>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

interface WindowContentProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  closable: boolean;
  className: string;
  headerContent?: React.ReactNode;
  footer?: React.ReactNode;
  width: number | string;
  height: number | string;
  showingContent?: React.CSSProperties;
  dragHandlers?: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
  };
  isDragging?: boolean;
}

function WindowContent({
  title,
  children,
  onClose,
  closable,
  className,
  headerContent,
  footer,
  width,
  height,
  showingContent,
  dragHandlers,
  isDragging,
}: WindowContentProps) {
  return (
    <div
      className={`flex flex-col overflow-hidden pointer-events-auto ${className}`}
      style={{
        width: typeof width === 'number' ? width : width,
        height: typeof height === 'number' ? height : height,
        maxWidth: typeof width === 'number' ? width : 500,
        maxHeight: typeof height === 'number' ? height : '90vh',
        backgroundColor: colors.bg.ivory,
        border: `2px solid ${colors.border.darkBrown}`,
        boxShadow: `inset 0 0 0 1px ${colors.border.bronze}, 0 4px 16px rgba(0, 0, 0, 0.35)`,
        borderRadius: radii.sm,
        ...showingContent,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="flex items-center justify-between shrink-0"
        style={{
          paddingLeft: spacing.lg,
          paddingRight: spacing.xs,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
          backgroundColor: colors.bg.parchment,
          borderBottom: `2px solid ${colors.border.darkBrown}`,
          cursor: dragHandlers ? (isDragging ? 'grabbing' : 'grab') : undefined,
          touchAction: dragHandlers ? 'none' : undefined,
        }}
        {...(dragHandlers ?? {})}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className="leading-none shrink-0"
            style={{ color: colors.border.bronze, fontSize: 10 }}
          >
            ◆
          </span>
          <h2
            className="font-bold truncate"
            style={{ fontSize: fontSizes.base, color: colors.text.nearBlack }}
          >
            {title}
          </h2>
          {headerContent}
        </div>
        {closable && onClose && (
          <button
            onClick={onClose}
            className="flex items-center justify-center shrink-0 transition-all duration-100 active:scale-95"
            style={{
              width: 56,
              height: 56,
              border: `1px solid ${colors.border.darkBrown}`,
              borderRadius: radii.sm,
              color: colors.text.darkGray,
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bar.hp;
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.borderColor = colors.bar.hp;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.text.darkGray;
              e.currentTarget.style.borderColor = colors.border.darkBrown;
            }}
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        )}
      </div>
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: spacing.lg, backgroundColor: colors.bg.ivory }}
      >
        {children}
      </div>
      {footer && (
        <div
          className="shrink-0"
          style={{
            padding: spacing.sm,
            borderTop: `2px solid ${colors.border.darkBrown}`,
            backgroundColor: colors.bg.ivory,
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
