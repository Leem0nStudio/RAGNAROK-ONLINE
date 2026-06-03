'use client';

import React, { useCallback } from 'react';
import { useButtonState } from './buttonState';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus } from 'lucide-react';
import { layers } from './layers';
import { colors, spacing, radii, fontSizes } from './theme';
import { MOTION } from './motions';
import { useDragWindow } from './useDragWindow';

export type WindowType = 'panel' | 'dialog' | 'modal';

export interface UIWindowProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  onFocus?: () => void;
  isOpen: boolean;
  zIndex?: number;
  width?: number | string;
  height?: number | string;
  closable?: boolean;
  minimizable?: boolean;
  className?: string;
  headerContent?: React.ReactNode;
  footer?: React.ReactNode;
  type?: WindowType;
  draggable?: boolean;
  defaultPosition?: { x: number; y: number };
}



export function UIWindow({
  title,
  children,
  onClose,
  onMinimize,
  onFocus,
  isOpen,
  zIndex,
  width = '90vw',
  height = 'auto',
  closable = true,
  minimizable = false,
  className = '',
  headerContent,
  footer,
  type = 'panel',
  draggable = false,
  defaultPosition,
}: UIWindowProps) {
  const showBackdrop = type === 'dialog' || type === 'modal';
  const showingContent = type === 'modal' ? { width: '100%', maxWidth: '100%', maxHeight: '100%' } : {};
  const { pos, isDragging, nodeRef, dragHandlers } = useDragWindow({ initialPosition: defaultPosition });
  const dragEnabled = draggable && !showBackdrop;
  const backdrop = useButtonState();
  const effectiveZ = zIndex || (layers.windows + 1);

  const bringToFront = useCallback(() => {
    if (onFocus) {
      onFocus();
    }
  }, [onFocus]);

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
              className="fixed inset-0 cursor-pointer"
              style={{
                backgroundColor: colors.overlayWindow,
                zIndex: layers.windows,
                opacity: backdrop.hovered ? 0.85 : 1,
              }}
              variants={MOTION.backdrop.variants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={MOTION.backdrop.transition}
              onClick={showBackdrop ? onClose : undefined}
              onMouseEnter={backdrop.onMouseEnter}
              onMouseLeave={backdrop.onMouseLeave}
            />
          )}
          {dragEnabled ? (
            <motion.div
              key="uiwindow-draggable"
              ref={nodeRef}
              className="fixed font-sans pointer-events-none"
              style={{
                zIndex: effectiveZ,
                left: pos.x,
                top: pos.y,
                width: typeof width === 'number' ? width : width,
                height: typeof height === 'number' ? height : height,
                maxWidth: typeof width === 'number' ? width : 500,
                maxHeight: typeof height === 'number' ? height : '90vh',
              }}
              variants={MOTION.window.variants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={MOTION.window.transition}
              onPointerDown={bringToFront}
            >
              <WindowContent
                title={title}
                onClose={onClose}
                onMinimize={onMinimize}
                closable={closable}
                minimizable={minimizable}
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
              className="fixed inset-0 flex items-center justify-center font-sans pointer-events-none"
              style={{
                zIndex: showBackdrop ? layers.windows + 1 : effectiveZ,
                paddingTop: 'var(--hud-gap-top, 12px)',
                paddingBottom: 'var(--hud-gap-bottom, 12px)',
                paddingLeft: 'var(--hud-gap-left, 12px)',
                paddingRight: 'var(--hud-gap-right, 12px)',
              }}
              variants={MOTION.windowSpring.variants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={MOTION.windowSpring.transition}
              onPointerDown={bringToFront}
            >
              <WindowContent
                title={title}
                onClose={onClose}
                onMinimize={onMinimize}
                closable={closable}
                minimizable={minimizable}
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
  onMinimize?: () => void;
  closable: boolean;
  minimizable: boolean;
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
  onMinimize,
  closable,
  minimizable,
  className,
  headerContent,
  footer,
  width,
  height,
  showingContent,
  dragHandlers,
  isDragging,
}: WindowContentProps) {
  const close = useButtonState();
  return (
    <div
      className={`flex flex-col overflow-hidden pointer-events-auto ${className}`}
      style={{
        width: typeof width === 'number' ? width : width,
        height: typeof height === 'number' ? height : height,
        maxWidth: typeof width === 'number' ? width : 500,
        maxHeight: typeof height === 'number' ? height : '90vh',
        backgroundColor: colors.ivory,
        border: `2px solid ${colors.darkBrown}`,
        boxShadow: `inset 0 0 0 1px ${colors.bronze}, 0 4px 16px ${colors.overlayMedium}`,
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
          backgroundColor: colors.parchment,
          borderBottom: `2px solid ${colors.darkBrown}`,
          cursor: dragHandlers ? (isDragging ? 'grabbing' : 'grab') : undefined,
          touchAction: dragHandlers ? 'none' : undefined,
        }}
        {...(dragHandlers ?? {})}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className="leading-none shrink-0"
            style={{ color: colors.bronze, fontSize: fontSizes.secondary }}
          >
            ◆
          </span>
          <h2
            className="font-bold truncate"
            style={{ fontSize: fontSizes.title, color: colors.textPrimary }}
          >
            {title}
          </h2>
          {headerContent}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {minimizable && onMinimize && (
            <button
              onClick={onMinimize}
              className="flex items-center justify-center transition-all duration-100 active:scale-95"
              style={{
                width: 56,
                height: 56,
                border: `1px solid ${colors.darkBrown}`,
                borderRadius: radii.sm,
                color: colors.textSecondary,
                backgroundColor: 'transparent',
              }}
            >
              <Minus size={20} strokeWidth={2.5} />
            </button>
          )}
          {closable && onClose && (
            <button
              onClick={onClose}
              className="flex items-center justify-center transition-all duration-100 active:scale-95"
              style={{
                width: 56,
                height: 56,
                border: `1px solid ${close.hovered ? colors.hp : colors.darkBrown}`,
                borderRadius: radii.sm,
                color: close.hovered ? colors.textWhite : colors.textSecondary,
                backgroundColor: close.hovered ? colors.hp : 'transparent',
              }}
              onMouseEnter={close.onMouseEnter}
              onMouseLeave={close.onMouseLeave}
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: spacing.lg, backgroundColor: colors.ivory }}
      >
        {children}
      </div>
      {footer && (
        <div
          className="shrink-0"
          style={{
            padding: spacing.sm,
            borderTop: `2px solid ${colors.darkBrown}`,
            backgroundColor: colors.ivory,
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
