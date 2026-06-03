import * as THREE from 'three';

export interface Waypoint {
  x: number;
  z: number;
  pauseMs: number;
}

export interface CityWalkerDef {
  id: string;
  npcType: 'guardia' | 'comerciante' | 'ciudadano' | 'nino';
  name: string;
  route: Waypoint[];
  speed: number;
}

interface ActiveWalker {
  def: CityWalkerDef;
  sprite: THREE.Sprite;
  currentWaypointIndex: number;
  movingForward: boolean;
  paused: boolean;
  pauseTimer: number;
  prevX: number;
  prevZ: number;
}

const NPCTYPE_COLORS: Record<string, { body: string; accent: string; size: number }> = {
  guardia: { body: '#cc3333', accent: '#ddcc44', size: 1.0 },
  comerciante: { body: '#8b5e3c', accent: '#d4a574', size: 1.0 },
  ciudadano: { body: '#3a7abd', accent: '#e8d8b0', size: 1.0 },
  nino: { body: '#e8637a', accent: '#f0d050', size: 0.65 },
};

export class CityLifeSystem {
  private scene: THREE.Scene;
  private walkers: ActiveWalker[] = [];
  private textureCanvas = document.createElement('canvas');
  private ctx = this.textureCanvas.getContext('2d')!;
  private mapId: string | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.textureCanvas.width = 64;
    this.textureCanvas.height = 64;
  }

  loadWalkers(defs: CityWalkerDef[], mapId: string): void {
    this.unloadWalkers();
    this.mapId = mapId;
    for (const def of defs) {
      const start = def.route[0];
      const sprite = this.createWalkerSprite(def);
      sprite.position.set(start.x, 0.05, start.z);
      this.scene.add(sprite);
      this.walkers.push({
        def,
        sprite,
        currentWaypointIndex: 0,
        movingForward: true,
        paused: true,
        pauseTimer: start.pauseMs / 1000,
        prevX: start.x,
        prevZ: start.z,
      });
    }
  }

  unloadWalkers(): void {
    for (const w of this.walkers) {
      this.scene.remove(w.sprite);
      disposeSprite(w.sprite);
    }
    this.walkers = [];
    this.mapId = null;
  }

  tick(dt: number): void {
    if (this.walkers.length === 0) return;
    for (const w of this.walkers) {
      const route = w.def.route;
      if (route.length < 2) continue;

      if (w.paused) {
        w.pauseTimer -= dt;
        if (w.pauseTimer <= 0) {
          w.paused = false;
          w.currentWaypointIndex = this.getNextIndex(w);
        }
        continue;
      }

      const target = route[w.currentWaypointIndex];
      const dx = target.x - w.sprite.position.x;
      const dz = target.z - w.sprite.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.3) {
        w.paused = true;
        w.pauseTimer = target.pauseMs / 1000;
        w.prevX = target.x;
        w.prevZ = target.z;
      } else {
        const speed = w.def.speed * dt;
        const step = Math.min(speed, dist);
        w.sprite.position.x += (dx / dist) * step;
        w.sprite.position.z += (dz / dist) * step;

        w.sprite.position.y = 0.05 + Math.sin(performance.now() * 0.008) * 0.06;

        if (Math.abs(dx) > 0.1 || Math.abs(dz) > 0.1) {
          const baseScale = w.def.npcType === 'nino' ? 0.65 : 1.0;
          w.sprite.scale.x = (dx > 0 ? 1 : -1) * baseScale;
        }
      }
    }
  }

  getHeightAt(x: number, z: number): number {
    return 0;
  }

  getCurrentMapId(): string | null {
    return this.mapId;
  }

  dispose(): void {
    this.unloadWalkers();
  }

  private getNextIndex(w: ActiveWalker): number {
    const route = w.def.route;
    if (w.movingForward) {
      const next = w.currentWaypointIndex + 1;
      if (next >= route.length) {
        w.movingForward = false;
        return route.length - 2;
      }
      return next;
    } else {
      const next = w.currentWaypointIndex - 1;
      if (next < 0) {
        w.movingForward = true;
        return 1;
      }
      return next;
    }
  }

  private createWalkerSprite(def: CityWalkerDef): THREE.Sprite {
    const colors = NPCTYPE_COLORS[def.npcType] || NPCTYPE_COLORS.ciudadano;
    const canvas = this.textureCanvas;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, 64, 64);

    const cx = 32;
    const bodyColor = colors.body;
    const accentColor = colors.accent;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(cx, 60, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    if (def.npcType === 'guardia') {
      // Helmet
      ctx.fillStyle = accentColor;
      ctx.fillRect(cx - 6, 10, 12, 8);
      ctx.fillStyle = bodyColor;
      ctx.fillRect(cx - 3, 10, 6, 3);
      // Body (armor)
      ctx.fillStyle = bodyColor;
      ctx.fillRect(cx - 8, 18, 16, 20);
      // Belt
      ctx.fillStyle = accentColor;
      ctx.fillRect(cx - 8, 32, 16, 3);
      // Legs
      ctx.fillStyle = '#444';
      ctx.fillRect(cx - 7, 38, 5, 10);
      ctx.fillRect(cx + 2, 38, 5, 10);
      // Boots
      ctx.fillStyle = '#333';
      ctx.fillRect(cx - 8, 46, 7, 3);
      ctx.fillRect(cx + 1, 46, 7, 3);
      // Shoulder pauldrons
      ctx.fillStyle = accentColor;
      ctx.fillRect(cx - 11, 18, 4, 6);
      ctx.fillRect(cx + 7, 18, 4, 6);
      // Spear
      ctx.fillStyle = '#888';
      ctx.fillRect(cx + 10, 6, 2, 40);
      ctx.fillStyle = '#ccc';
      ctx.beginPath();
      ctx.moveTo(cx + 11, 4);
      ctx.lineTo(cx + 7, 12);
      ctx.lineTo(cx + 15, 12);
      ctx.closePath();
      ctx.fill();
    } else if (def.npcType === 'comerciante') {
      // Hat
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.ellipse(cx, 14, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - 6, 8, 12, 7);
      // Body (robe)
      ctx.fillStyle = bodyColor;
      ctx.fillRect(cx - 9, 18, 18, 22);
      // Pack on back (visible as bump on right)
      ctx.fillStyle = '#6b4a2e';
      ctx.fillRect(cx + 9, 20, 8, 14);
      // Belt pouch
      ctx.fillStyle = accentColor;
      ctx.fillRect(cx - 3, 34, 6, 4);
      // Legs
      ctx.fillStyle = '#6b5a4a';
      ctx.fillRect(cx - 7, 40, 5, 8);
      ctx.fillRect(cx + 2, 40, 5, 8);
      // Boots
      ctx.fillStyle = '#4a3a2a';
      ctx.fillRect(cx - 8, 46, 7, 3);
      ctx.fillRect(cx + 1, 46, 7, 3);
    } else if (def.npcType === 'nino') {
      // Small body
      const s = 0.7;
      // Hair
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(cx, 18 * s, 8 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(cx, 21 * s, 6 * s, 0, Math.PI * 2);
      ctx.fill();
      // Body (shirt)
      ctx.fillStyle = bodyColor;
      ctx.fillRect(cx - 7 * s, 25 * s, 14 * s, 14 * s);
      // Arms
      ctx.fillStyle = '#e8c8a0';
      ctx.fillRect(cx - 10 * s, 26 * s, 4 * s, 8 * s);
      ctx.fillRect(cx + 6 * s, 26 * s, 4 * s, 8 * s);
      // Legs
      ctx.fillStyle = '#3a6a9a';
      ctx.fillRect(cx - 6 * s, 39 * s, 5 * s, 8 * s);
      ctx.fillRect(cx + 1 * s, 39 * s, 5 * s, 8 * s);
      // Shoes
      ctx.fillStyle = '#eee';
      ctx.fillRect(cx - 7 * s, 46 * s, 6 * s, 2 * s);
      ctx.fillRect(cx + 1 * s, 46 * s, 6 * s, 2 * s);
    } else {
      // Ciudadano
      // Hair
      ctx.fillStyle = '#5a3a2a';
      ctx.beginPath();
      ctx.arc(cx, 16, 8, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.fillStyle = '#e8c8a0';
      ctx.beginPath();
      ctx.arc(cx, 20, 6, 0, Math.PI * 2);
      ctx.fill();
      // Body (tunic)
      ctx.fillStyle = bodyColor;
      ctx.fillRect(cx - 8, 24, 16, 18);
      // Belt
      ctx.fillStyle = accentColor;
      ctx.fillRect(cx - 8, 36, 16, 3);
      // Arms
      ctx.fillStyle = '#e8c8a0';
      ctx.fillRect(cx - 11, 26, 4, 12);
      ctx.fillRect(cx + 7, 26, 4, 12);
      // Legs
      ctx.fillStyle = '#5a4a3a';
      ctx.fillRect(cx - 7, 42, 5, 8);
      ctx.fillRect(cx + 2, 42, 5, 8);
      // Shoes
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(cx - 8, 48, 7, 3);
      ctx.fillRect(cx + 1, 48, 7, 3);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const size = NPCTYPE_COLORS[def.npcType]?.size ?? 1.0;
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(size * 1.5, size * 2.5, 1);
    return sprite;
  }
}

function disposeSprite(sprite: THREE.Sprite): void {
  sprite.material.map?.dispose();
  sprite.material.dispose();
}
