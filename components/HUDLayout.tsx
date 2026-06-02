'use client';

import React from 'react';

interface HUDLayoutProps {
  topLeft?: React.ReactNode;
  topRight?: React.ReactNode;
  bottomLeft?: React.ReactNode;
  bottomRight?: React.ReactNode;
}

export function HUDLayout({ topLeft, topRight, bottomLeft, bottomRight }: HUDLayoutProps) {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none p-4">
      {/* Top-Left Zone */}
      <div className="absolute top-4 left-4 pointer-events-auto">
        {topLeft}
      </div>

      {/* Top-Right Zone */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        {topRight}
      </div>

      {/* Bottom-Left Zone */}
      <div className="absolute bottom-4 left-4 pointer-events-auto">
        {bottomLeft}
      </div>

      {/* Bottom-Right Zone */}
      <div className="absolute bottom-4 right-4 pointer-events-auto">
        {bottomRight}
      </div>
    </div>
  );
}
