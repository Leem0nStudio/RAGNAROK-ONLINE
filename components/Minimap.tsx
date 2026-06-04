'use client';

import React, { useRef, useEffect } from 'react';
import { useGameStore } from '@/lib/game/state';
import { getMinimapLayout, MinimapLayout } from '@/lib/game/minimapData';
import type { Entity } from '@/lib/game/types';
import { colors, radii, spacing, hudOpacity } from '@/ui/theme';

const MAP_SIZE = 80;
const MARGIN = 2;
const USABLE = MAP_SIZE - MARGIN * 2;
const DPR = 2;

function toCanvas(
  x: number, z: number,
  bounds: { xMin: number; xMax: number; zMin: number; zMax: number },
) {
  const worldW = bounds.xMax - bounds.xMin;
  const worldH = bounds.zMax - bounds.zMin;
  const s = Math.min(USABLE / worldW, USABLE / worldH);
  const cx = MARGIN + (x - bounds.xMin) * s;
  const cy = MARGIN + (z - bounds.zMin) * s;
  return { cx, cy };
}

function drawLayout(ctx: CanvasRenderingContext2D, layout: MinimapLayout) {
  const { bounds, backgroundColor, features } = layout;
  const worldW = bounds.xMax - bounds.xMin;
  const worldH = bounds.zMax - bounds.zMin;
  const s = Math.min(USABLE / worldW, USABLE / worldH);

  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);

  // Features
  for (const f of features) {
    const { cx, cy } = toCanvas(f.x, f.z, bounds);
    const pw = f.width * s;
    const ph = f.height * s;

    ctx.fillStyle = f.color;

    switch (f.type) {
      case 'road': {
        ctx.fillRect(cx - pw / 2, cy - ph / 2, pw, ph);
        break;
      }
      case 'building': {
        ctx.fillRect(cx - pw / 2, cy - ph / 2, pw, ph);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(cx - pw / 2, cy - ph / 2, pw, ph);
        break;
      }
      case 'water': {
        ctx.beginPath();
        ctx.ellipse(cx, cy, pw / 2, ph / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'park': {
        ctx.fillRect(cx - pw / 2, cy - ph / 2, pw, ph);
        break;
      }
      case 'plaza': {
        ctx.fillRect(cx - pw / 2, cy - ph / 2, pw, ph);
        break;
      }
    }
  }
}

function drawEntities(ctx: CanvasRenderingContext2D, entities: Entity[], layout: MinimapLayout) {
  for (const entity of entities) {
    const { cx, cy } = toCanvas(entity.x, entity.z, layout.bounds);

    if (entity.type === 'player') {
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (entity.type === 'boss_mvp') {
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#a855f0';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (entity.type === 'npc') {
      ctx.beginPath();
      ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#60a5fa';
      ctx.fill();
    } else if (entity.type === 'monster') {
      ctx.beginPath();
      ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
    }
  }
}

export function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const entities = useGameStore(s => s.entities);
  const currentMapId = useGameStore(s => s.currentMapId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const layout = currentMapId ? getMinimapLayout(currentMapId) : null;
    if (!layout) {
      // Fallback: empty background
      ctx.fillStyle = colors.oldPaper;
      ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);
      return;
    }

    ctx.clearRect(0, 0, MAP_SIZE, MAP_SIZE);
    drawLayout(ctx, layout);

    const entityArray = Array.isArray(entities) ? entities : [];
    drawEntities(ctx, entityArray, layout);
  }, [entities, currentMapId]);

  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: radii.md,
        border: `1px solid ${colors.darkBrown}`,
        opacity: hudOpacity.primary,
        lineHeight: 0,
      }}
    >
      <canvas
        ref={canvasRef}
        width={MAP_SIZE}
        height={MAP_SIZE}
        style={{
          width: MAP_SIZE,
          height: MAP_SIZE,
          backgroundColor: colors.overlayDark,
        }}
      />
    </div>
  );
}
