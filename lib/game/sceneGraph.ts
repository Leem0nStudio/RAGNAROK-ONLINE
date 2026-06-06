import * as THREE from 'three';
import { Entity, GroundItem, Projectile, EquippedItems } from './types';
import { GameRenderer, getTerrainHeight } from './renderer';
import { getRockObstacles, getTreeObstacles, getPropObstacles } from './characterController';
import { useGameStore } from './state';

function paintGeometry(geo: THREE.BufferGeometry, colorHex: number): THREE.BufferGeometry {
  const color = new THREE.Color(colorHex);
  const colors: number[] = [];
  const posCount = geo.attributes.position.count;
  for (let i = 0; i < posCount; i++) {
    colors.push(color.r, color.g, color.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return geo;
}

function mergeBufferGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = new THREE.BufferGeometry();
  
  let totalVertices = 0;
  let totalIndices = 0;
  let hasColor = true;
  for (const g of geos) {
    totalVertices += g.attributes.position.count;
    if (g.index) totalIndices += g.index.count;
    if (!g.attributes.color) {
      paintGeometry(g, 0xffffff);
    }
  }
  
  const positions = new Float32Array(totalVertices * 3);
  const normals = new Float32Array(totalVertices * 3);
  const uvs = new Float32Array(totalVertices * 2);
  const colors = new Float32Array(totalVertices * 3);
  let indices: Uint32Array | null = totalIndices > 0 ? new Uint32Array(totalIndices) : null;
  
  let vOffset = 0;
  let iOffset = 0;
  
  for (const g of geos) {
    const posAttr = g.attributes.position;
    const normAttr = g.attributes.normal;
    const uvAttr = g.attributes.uv;
    const colAttr = g.attributes.color;
    
    positions.set(posAttr.array as Float32Array, vOffset * 3);
    if (normAttr) {
      normals.set(normAttr.array as Float32Array, vOffset * 3);
    }
    if (uvAttr) {
      uvs.set(uvAttr.array as Float32Array, vOffset * 2);
    }
    if (colAttr) {
      colors.set(colAttr.array as Float32Array, vOffset * 3);
    }
    
    if (g.index && indices) {
      const idxArr = g.index.array;
      for (let i = 0; i < idxArr.length; i++) {
        indices[iOffset + i] = idxArr[i] + vOffset;
      }
      iOffset += idxArr.length;
    }
    
    vOffset += posAttr.count;
  }
  
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  if (uvs.length > 0) {
    merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  }
  merged.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  if (indices) {
    merged.setIndex(new THREE.BufferAttribute(indices, 1));
  }
  
  return merged;
}

/**
 * 1. CLASE BASE VISUAL_NODE (SCENE GRAPH NODE)
 * Representa un nodo gráfico en nuestra estructura jerárquica de renderizado.
 * Desacopla la lógica estricta de simulación del grafo de visualización de Three.js.
 */
export abstract class VisualNode {
  public id: string;
  public object3D: THREE.Object3D;
  public isSleeping: boolean = false;
  public distanceToCamera: number = 0;
  protected lastTextureUpdateTime: number = 0;
  protected frameThrottleInterval: number = 16.67; // default updates at 60 FPS (~16ms)

  constructor(id: string, object3D: THREE.Object3D) {
    this.id = id;
    this.object3D = object3D;
  }

  /**
   * Método de actualización que implementa L.O.D. (Level Of Detail) y Throttling dinámico.
   * - Si está demasiado lejos (> 48m), el nodo entra en 'Sleep' y se oculta de Three.js (Frustum/Range-Culling).
   * - Si está moderadamente lejos (> 20m), reduce la tasa de actualización visual (Throttling) de 60 a 15-20 FPS.
   * - Si está cerca, se actualiza a máxima frecuencia para absoluta fluidez.
   */
  public update(dt: number, cameraPosition: THREE.Vector3, now: number) {
    const nodePos = new THREE.Vector3();
    this.object3D.getWorldPosition(nodePos);
    this.distanceToCamera = nodePos.distanceTo(cameraPosition);

    // Dynamic Loading / Frustum Distance-based Culling
    if (this.distanceToCamera > 48) {
      if (!this.isSleeping) {
        this.isSleeping = true;
        this.object3D.visible = false;
      }
      return;
    }

    if (this.isSleeping) {
      this.isSleeping = false;
      this.object3D.visible = true;
    }

    // Dynamic Frame Throttling (Optimización clave para CPU móvil)
    if (this.distanceToCamera > 24) {
      this.frameThrottleInterval = 83.33; // Throttled updates to ~12 FPS
    } else if (this.distanceToCamera > 12) {
      this.frameThrottleInterval = 33.33; // Throttled updates to ~30 FPS
    } else {
      this.frameThrottleInterval = 0; // Unthrottled smooth 60 FPS
    }

    const shouldUpdateVisuals = this.frameThrottleInterval === 0 || 
                                (now - this.lastTextureUpdateTime) >= this.frameThrottleInterval;

    this.onUpdate(dt, now, shouldUpdateVisuals);

    if (shouldUpdateVisuals) {
      this.lastTextureUpdateTime = now;
    }
  }

  protected abstract onUpdate(dt: number, now: number, updateVisuals: boolean): void;

  public dispose() {
    this.onDispose();
  }

  protected onDispose(): void {}
}

/**
 * 2. REUSABLE HTML CANVAS POOL (MOBILE PERFORMANCE)
 * Evita la violenta constante re-instanciación de elementos Canvas en el DOM 
 * que causa fugas de memoria y bloqueos de Garbage Collector en navegadores Safari de iOS.
 */
export class CanvasPool {
  private static pool: HTMLCanvasElement[] = [];
  private static inUse = new Set<HTMLCanvasElement>();

  public static getCanvas(width: number = 128, height: number = 128): HTMLCanvasElement {
    for (const canvas of this.pool) {
      if (!this.inUse.has(canvas)) {
        if (canvas.width === width && canvas.height === height) {
          this.inUse.add(canvas);
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, width, height);
          return canvas;
        }
      }
    }

    // Allocate a new canvas if none is available in the matching bounds
    const newCanvas = document.createElement('canvas');
    newCanvas.width = width;
    newCanvas.height = height;
    this.pool.push(newCanvas);
    this.inUse.add(newCanvas);
    return newCanvas;
  }

  public static releaseCanvas(canvas: HTMLCanvasElement) {
    this.inUse.delete(canvas);
  }

  public static clearAll() {
    this.pool = [];
    this.inUse.clear();
  }
}

/**
 * 3. RECYCLED OBJECT POOL FOR SPRITES AND MATERIALS
 * Almacena en caché y recicla objetos de renderizado de Three.js.
 * Evita la desubicación, recolección de basura y buffers re-confeccionados de GPU.
 */
export class RenderObjectPool {
  private spritePool: THREE.Sprite[] = [];
  private spriteMaterialPool: THREE.SpriteMaterial[] = [];
  private texturePool: Map<string, THREE.CanvasTexture[]> = new Map();
  private meshPool: Map<string, THREE.Mesh[]> = new Map();

  constructor() {}

  public getSprite(): THREE.Sprite {
    const sprite = this.spritePool.pop();
    if (sprite) {
      sprite.visible = true;
      return sprite;
    }
    const mat = this.getSpriteMaterial();
    return new THREE.Sprite(mat);
  }

  public releaseSprite(sprite: THREE.Sprite) {
    sprite.visible = false;
    if (sprite.parent) {
      sprite.parent.remove(sprite);
    }
    this.spritePool.push(sprite);
  }

  public getSpriteMaterial(): THREE.SpriteMaterial {
    const mat = this.spriteMaterialPool.pop();
    if (mat) {
      return mat;
    }
    return new THREE.SpriteMaterial({
      transparent: true,
      shadowSide: THREE.DoubleSide
    });
  }

  public releaseSpriteMaterial(material: THREE.SpriteMaterial) {
    if (material.map) {
      this.releaseTexture(material.map as THREE.CanvasTexture);
      material.map = null;
    }
    this.spriteMaterialPool.push(material);
  }

  public getTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
    const key = `${canvas.width}x${canvas.height}`;
    const list = this.texturePool.get(key);
    if (list && list.length > 0) {
      const tex = list.pop()!;
      tex.image = canvas;
      tex.needsUpdate = true;
      return tex;
    }
    const newTex = new THREE.CanvasTexture(canvas);
    newTex.minFilter = THREE.NearestFilter;
    newTex.magFilter = THREE.NearestFilter;
    return newTex;
  }

  public releaseTexture(texture: THREE.CanvasTexture) {
    const img = texture.image as HTMLCanvasElement;
    if (img) {
      CanvasPool.releaseCanvas(img);
    }
    const key = img ? `${img.width}x${img.height}` : 'unknown';
    if (!this.texturePool.has(key)) {
      this.texturePool.set(key, []);
    }
    this.texturePool.get(key)!.push(texture);
  }

  public getMesh(geometry: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
    const key = geometry.type;
    const list = this.meshPool.get(key);
    if (list && list.length > 0) {
      const mesh = list.pop()!;
      mesh.geometry = geometry;
      mesh.material = material;
      mesh.visible = true;
      return mesh;
    }
    const newMesh = new THREE.Mesh(geometry, material);
    return newMesh;
  }

  public releaseMesh(mesh: THREE.Mesh) {
    mesh.visible = false;
    if (mesh.parent) {
      mesh.parent.remove(mesh);
    }
    const key = mesh.geometry.type;
    if (!this.meshPool.has(key)) {
      this.meshPool.set(key, []);
    }
    this.meshPool.get(key)!.push(mesh);
  }

  public clearAll() {
    this.spritePool.forEach(s => {
      s.geometry.dispose();
    });
    this.spriteMaterialPool.forEach(m => m.dispose());
    this.texturePool.forEach(list => list.forEach(t => t.dispose()));
    this.meshPool.forEach(list => list.forEach(m => {
      m.geometry.dispose();
      if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
      else m.material.dispose();
    }));
    this.spritePool = [];
    this.spriteMaterialPool = [];
    this.texturePool.clear();
    this.meshPool.clear();
  }
}

/**
 * 4. ENTITY_SPRITE_NODE (ENTITY LINKING)
 * Vincula lógicamente una entidad de juego (Jugador, NPC o Monstruo) con su contraparte visual.
 */
export class EntitySpriteNode extends VisualNode {
  public entity: Entity;
  private rendererRef: GameRenderer;
  private equippedItems: EquippedItems;
  private pool: RenderObjectPool;
  private rootGroup: THREE.Group;
  private sprite: THREE.Sprite;
  private shadowMesh: THREE.Mesh | null = null;
  private ringMesh: THREE.Mesh | null = null;
  private targetRingMesh: THREE.Mesh | null = null;
  private auraSprite: THREE.Sprite | null = null;
  private bubbleSprite: THREE.Sprite | null = null;
  private hpBarGroup: THREE.Group | null = null;
  private hpBarFill: THREE.Mesh | null = null;
  private lastHitTime: number = 0;
  private originalSpriteColor = new THREE.Color(1, 1, 1);
  public playerX?: number;
  public playerZ?: number;

  constructor(entity: Entity, rootGroup: THREE.Group, sprite: THREE.Sprite, equippedItems: EquippedItems, rendererRef: GameRenderer, pool: RenderObjectPool) {
    super(entity.id, rootGroup);
    this.entity = entity;
    this.equippedItems = equippedItems;
    this.rendererRef = rendererRef;
    this.pool = pool;
    this.rootGroup = rootGroup;
    this.sprite = sprite;

    this.rootGroup.add(this.sprite);

    // Escalamientos proporcionales iniciales
    const isBoss = entity.type === 'boss_mvp';
    const scaleFactor = isBoss ? 4.9 : (entity.mobType === 'pecopeco' ? 2.5 : (entity.mobType ? 1.8 : 2.5));
    // The sprite will be scaled within the rootGroup
    this.sprite.scale.set(scaleFactor, scaleFactor, 1);

    this.createAuras();
    this.createHPBar();
  }

  private createHPBar() {
    if (this.entity.type !== 'monster' && this.entity.type !== 'boss_mvp') return;

    this.hpBarGroup = new THREE.Group();
    const isBoss = this.entity.type === 'boss_mvp';
    const width = isBoss ? 2.5 : 1.2;
    const height = isBoss ? 0.2 : 0.12;

    const bgGeo = new THREE.PlaneGeometry(width, height);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.5, transparent: true, depthWrite: false });
    const bgMesh = new THREE.Mesh(bgGeo, bgMat);
    this.hpBarGroup.add(bgMesh);

    const fillGeo = new THREE.PlaneGeometry(width - 0.05, height - 0.03);
    fillGeo.translate((width - 0.05) / -2, 0, 0); // anchor to left
    const fillMat = new THREE.MeshBasicMaterial({ color: isBoss ? 0xfc2c12 : 0x22c55e, depthWrite: false });
    this.hpBarFill = new THREE.Mesh(fillGeo, fillMat);
    this.hpBarFill.position.x = width / 2; // correct for left translation
    this.hpBarGroup.add(this.hpBarFill);

    this.hpBarGroup.position.set(0, isBoss ? 5.5 : 2.2, 0);
    this.rootGroup.add(this.hpBarGroup);
  }

  private createTargetReticleTexture(isNPC: boolean): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const center = 64;
    const r = 42;
    
    const color = isNPC ? '#0ea5e9' : '#ff3b30';

    ctx.clearRect(0, 0, 128, 128);

    // Neon Glow styling
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    
    // 1. Draw outer thin ring with dashed segments
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    
    // 4 brackets to make it look like a high-tech reticle focus lock
    for (let i = 0; i < 4; i++) {
      const startAngle = i * Math.PI / 2 + 0.15;
      const endAngle = (i + 1) * Math.PI / 2 - 0.15;
      ctx.beginPath();
      ctx.arc(center, center, r, startAngle, endAngle);
      ctx.stroke();
    }
    
    // 2. Draw 4 thick corner focus ticks
    ctx.shadowBlur = 15;
    ctx.lineWidth = 5;
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2;
      const cornerX = center + Math.cos(angle) * r;
      const cornerY = center + Math.sin(angle) * r;
      const length = 10;
      
      ctx.beginPath();
      ctx.moveTo(cornerX - Math.cos(angle) * 3, cornerY - Math.sin(angle) * 3);
      ctx.lineTo(cornerX + Math.cos(angle) * length, cornerY + Math.sin(angle) * length);
      ctx.stroke();
    }
    
    // 3. Draw a very soft inner glowing ring
    ctx.shadowBlur = 6;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(center, center, r - 8, 0, Math.PI * 2);
    ctx.stroke();
    
    // 4. Draw lock-on dots inside
    ctx.fillStyle = color;
    ctx.shadowBlur = 4;
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2 + Math.PI / 4;
      const dotX = center + Math.cos(angle) * (r - 16);
      const dotY = center + Math.sin(angle) * (r - 16);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }

  private createAuras() {
    const isPlayer = this.entity.type === 'player';
    const isNPC = this.entity.type === 'npc';
    const isBoss = this.entity.type === 'boss_mvp';

    // 1. Soft Shadow / Selection Ring
    const shadowGeo = new THREE.PlaneGeometry(1.5, 1.5);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: this.createRadialGradient(isPlayer ? 0x00ff00 : (isBoss ? 0xff0000 : 0x000000), 0.5),
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.y = 0.01; // Slightly above ground
    
    // Scale shadow
    const scale = isBoss ? 3 : (this.entity.mobType ? 1.2 : 1.5);
    this.shadowMesh.scale.set(scale, scale, 1);
    this.rootGroup.add(this.shadowMesh);

    // 2. High-quality Ring for player & boss
    if (isPlayer || isBoss) {
      const ringGeo = new THREE.RingGeometry(0.8, 0.9, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isPlayer ? 0xfbbf24 : 0xef4444, // Gold for player, red for Boss
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      this.ringMesh = new THREE.Mesh(ringGeo, ringMat);
      this.ringMesh.rotation.x = -Math.PI / 2;
      this.ringMesh.position.y = 0.015;
      this.ringMesh.scale.set(scale*0.8, scale*0.8, 1);
      this.rootGroup.add(this.ringMesh);

      // Glow behind character
      const auraMat = new THREE.SpriteMaterial({
        map: this.createRadialGradient(isPlayer ? 0xfef08a : 0x991b1b, 0.4),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      this.auraSprite = new THREE.Sprite(auraMat);
      this.auraSprite.scale.set(scale*2.5, scale*2.5, 1);
      this.auraSprite.position.set(0, scale*0.5, -0.1);
      this.rootGroup.add(this.auraSprite);
    }

    // Always create a nice high-contrast targeting ring for NPCs or monsters
    const isTargetable = this.entity.type === 'monster' || this.entity.type === 'boss_mvp' || isNPC;
    if (isTargetable) {
      const scaleVal = isBoss ? 3.0 : (this.entity.type === 'npc' ? 1.5 : (this.entity.mobType === 'poring' ? 1.0 : 1.3));
      const targetRingGeo = new THREE.PlaneGeometry(scaleVal * 2.2, scaleVal * 2.2);
      const targetRingMat = new THREE.MeshBasicMaterial({
        map: this.createTargetReticleTexture(isNPC),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.0, // hidden initially
        side: THREE.DoubleSide
      });
      this.targetRingMesh = new THREE.Mesh(targetRingGeo, targetRingMat);
      this.targetRingMesh.rotation.x = -Math.PI / 2;
      this.targetRingMesh.position.y = 0.025; // slightly above standard shadow
      this.rootGroup.add(this.targetRingMesh);
    }

    // 3. NPC Nameplates and indicators
    if (isNPC) {
      const npcType = (this.entity as any).npcType;
      const isKafra = npcType === 'kafra';
      
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      
      // Shadow/Stroke
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'black';
      
      const label = this.entity.name;
      const indicator = isKafra ? '🏠' : '⚔';
      const color = isKafra ? '#60a5fa' : '#fbbf24';

      ctx.fillText(`${indicator} ${label}`, 256 + 2, 64 + 2);
      ctx.fillText(`${indicator} ${label}`, 256 - 2, 64 - 2);

      ctx.fillStyle = color;
      ctx.fillText(`${indicator} ${label}`, 256, 64);

      const tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      const nameMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
      const nameSprite = new THREE.Sprite(nameMat);
      nameSprite.scale.set(3, 0.75, 1);
      nameSprite.position.set(0, 3.2, 0);
      
      this.rootGroup.add(nameSprite);
      
      // We store it in auraSprite just to reuse the variable for disposal
      this.auraSprite = nameSprite;
      
      // Ground indicator ring for NPC interaction (fades/pulses when near)
      const ringGeo = new THREE.RingGeometry(0.8, 0.9, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isKafra ? 0x60a5fa : 0xfbcfe8, // Soft Blue or Lilac light ring indicators
        transparent: true,
        opacity: 0.0, // hidden until player is near
        depthWrite: false,
        side: THREE.DoubleSide
      });
      this.ringMesh = new THREE.Mesh(ringGeo, ringMat);
      this.ringMesh.rotation.x = -Math.PI / 2;
      this.ringMesh.position.y = 0.015;
      this.ringMesh.scale.set(0.01, 0.01, 1);
      this.rootGroup.add(this.ringMesh);

      // Create interactive Chat Bubble Sprite above NPC
      const bubbleTex = this.createChatBubbleTexture();
      const bubbleMat = new THREE.SpriteMaterial({
        map: bubbleTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.0
      });
      this.bubbleSprite = new THREE.Sprite(bubbleMat);
      this.bubbleSprite.scale.set(0.01, 0.01, 1);
      this.bubbleSprite.position.set(0, 4.0, 0);
      this.rootGroup.add(this.bubbleSprite);
    }
  }

  private createChatBubbleTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    
    ctx.clearRect(0, 0, 128, 128);
    
    const x = 16;
    const y = 16;
    const w = 96;
    const h = 64;
    const r = 20;
    
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    
    ctx.lineTo(64 + 10, y + h);
    ctx.lineTo(64, y + h + 15);
    ctx.lineTo(64 - 10, y + h);
    
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, y, 0, y + h);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#e0f2fe');
    
    ctx.fillStyle = gradient;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    ctx.fill();
    
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Draw three interactive dots (...)
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.arc(64 - 18, y + h / 2, 5, 0, Math.PI * 2);
    ctx.arc(64, y + h / 2, 5, 0, Math.PI * 2);
    ctx.arc(64 + 18, y + h / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }

  private createRadialGradient(colorHex: number, alpha: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d')!;
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    
    const color = new THREE.Color(colorHex);
    gradient.addColorStop(0, `rgba(${Math.round(color.r*255)}, ${Math.round(color.g*255)}, ${Math.round(color.b*255)}, ${alpha})`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  protected onUpdate(dt: number, now: number, updateVisuals: boolean): void {
    // Rotations & bobbing
    if (this.ringMesh && this.entity.type !== 'npc') {
      this.ringMesh.rotation.z += dt * 0.5;
    }
    // Update target selection indicators
    if (this.targetRingMesh) {
      const store = useGameStore.getState();
      const isTargeted = store.targetEntityId === this.entity.id;
      
      const targetRingOpacity = isTargeted ? (0.75 + Math.sin(now * 0.01) * 0.2) : 0.0;
      const targetRingMat = this.targetRingMesh.material as THREE.MeshBasicMaterial;
      targetRingMat.opacity = THREE.MathUtils.lerp(targetRingMat.opacity, targetRingOpacity, 12 * dt);
      
      this.targetRingMesh.rotation.z -= dt * 2.2; // premium spin effect
      
      const targetRingScale = isTargeted ? (1.0 + Math.sin(now * 0.015) * 0.06) : 0.1;
      const currentScale = this.targetRingMesh.scale.x;
      const nextScale = THREE.MathUtils.lerp(currentScale, targetRingScale, 15 * dt);
      this.targetRingMesh.scale.set(nextScale, nextScale, 1);
    }
    if (this.auraSprite) {
      if (this.entity.type === 'npc') {
         this.auraSprite.position.y = 3.2 + Math.sin(now * 0.003) * 0.1;
      } else {
         this.auraSprite.material.opacity = 0.4 + Math.sin(now * 0.003) * 0.15;
      }
    }
    // We adjust sprite position inside group for bobbing
    const hitTimeRemaining = this.entity.hitRecoveryEndTime - now;
    const isHit = hitTimeRemaining > 0;
    
    // Hit Stagger & Flash logic
    if (isHit && this.entity.state === 'hit') {
      const staggerAmount = 0.15 * (hitTimeRemaining / 400); // Decaying stagger
      this.sprite.position.x = Math.sin(now * 0.1) * staggerAmount;
      
      if (this.lastHitTime !== this.entity.hitRecoveryEndTime) {
        this.lastHitTime = this.entity.hitRecoveryEndTime;
        // Pulse red on hit
        this.sprite.material.color.setHex(0xff3333);
      }
    } else {
      this.sprite.position.x = THREE.MathUtils.lerp(this.sprite.position.x, 0, 10 * dt);
      this.sprite.material.color.lerp(this.originalSpriteColor, 5 * dt);
    }

    this.sprite.position.y = (this.entity.type === 'boss_mvp' ? 2.0 : 0.9);

    // Update HP Bar
    if (this.hpBarGroup && this.hpBarFill) {
      const hpPercent = Math.max(0, this.entity.currentHp / this.entity.maxHp);
      this.hpBarFill.scale.x = THREE.MathUtils.lerp(this.hpBarFill.scale.x, hpPercent, 10 * dt);
      
      // Look at camera for 2D feel
      this.hpBarGroup.quaternion.copy(this.rendererRef.getScene().userData.cameraQuaternion || new THREE.Quaternion());
      
      // Hide HP bar if full or dead (optional, RO shows it if damaged)
      this.hpBarGroup.visible = this.entity.currentHp > 0 && this.entity.currentHp < this.entity.maxHp;
    }

    // Update active Chat Bubble proximity indicator for NPCs
    if (this.entity.type === 'npc' && this.bubbleSprite) {
      let withinRadius = false;
      if (this.playerX !== undefined && this.playerZ !== undefined) {
        const dx = this.entity.x - this.playerX;
        const dz = this.entity.z - this.playerZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        withinRadius = dist < 3.2; // Check if player is near NPC interaction/friendly zone
      }

      // Smooth opacity & scaling animations
      const targetOpacity = withinRadius ? 1.0 : 0.0;
      const targetScale = withinRadius ? (1.3 + Math.sin(now * 0.006) * 0.1) : 0.01;

      this.bubbleSprite.material.opacity = THREE.MathUtils.lerp(
        this.bubbleSprite.material.opacity,
        targetOpacity,
        12 * dt
      );

      const currentScale = this.bubbleSprite.scale.x;
      const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, 12 * dt);
      this.bubbleSprite.scale.set(nextScale, nextScale, 1);

      this.bubbleSprite.position.y = 4.0 + Math.sin(now * 0.004) * 0.16;

      // Also animate interaction ground ring for NPCs
      if (this.ringMesh) {
        const targetRingOpacity = withinRadius ? 0.7 : 0.0;
        const ringMat = this.ringMesh.material as THREE.MeshBasicMaterial;
        ringMat.opacity = THREE.MathUtils.lerp(ringMat.opacity, targetRingOpacity, 12 * dt);

        const targetRingScale = withinRadius ? 1.15 : 0.01;
        const currentRingScale = this.ringMesh.scale.x;
        const nextRingScale = THREE.MathUtils.lerp(currentRingScale, targetRingScale, 12 * dt);
        this.ringMesh.scale.set(nextRingScale, nextRingScale, 1);
        this.ringMesh.rotation.z += dt * 0.45; // rotate smoothly
      }
    }

    // Sincronizar posición 3D real del Grupo
    this.rootGroup.position.set(
      this.entity.x,
      this.entity.y,
      this.entity.z
    );

    // ... texturas
    if (updateVisuals) {
      let currentEquippedItems = this.equippedItems;
      if (this.entity.type === 'player') {
        try {
          const { useGameStore } = require('./state');
          currentEquippedItems = useGameStore.getState().equippedItems;
        } catch (e) {
          // fallback if require is not available in typescript bundlers
        }
      }

      const tex = this.rendererRef.createEntityTexture(this.entity, currentEquippedItems);
      if (tex) {
        // Aprovechar reciclado de texturas de Three.js
        if (this.sprite.material.map) {
          this.pool.releaseTexture(this.sprite.material.map as THREE.CanvasTexture);
        }
        this.sprite.material.map = tex;
        this.sprite.material.needsUpdate = true;
      }
    }
  }

  protected onDispose(): void {
    if (this.sprite.material) {
      this.pool.releaseSpriteMaterial(this.sprite.material);
    }
    this.pool.releaseSprite(this.sprite);

    if (this.shadowMesh) {
      this.shadowMesh.geometry.dispose();
      (this.shadowMesh.material as THREE.MeshBasicMaterial).map?.dispose();
      (this.shadowMesh.material as THREE.Material).dispose();
    }
    if (this.ringMesh) {
      this.ringMesh.geometry.dispose();
      (this.ringMesh.material as THREE.Material).dispose();
    }
    if (this.targetRingMesh) {
      this.targetRingMesh.geometry.dispose();
      (this.targetRingMesh.material as THREE.MeshBasicMaterial).map?.dispose();
      (this.targetRingMesh.material as THREE.Material).dispose();
    }
    if (this.auraSprite) {
      (this.auraSprite.material as THREE.SpriteMaterial).map?.dispose();
      (this.auraSprite.material as THREE.Material).dispose();
    }
    if (this.bubbleSprite) {
      (this.bubbleSprite.material as THREE.SpriteMaterial).map?.dispose();
      (this.bubbleSprite.material as THREE.Material).dispose();
    }
  }
}

/**
 * 5. PROJECTILE_NODE
 * Nodo visual de proyectiles (Flechas, magias).
 */
export class ProjectileNode extends VisualNode {
  public proj: Projectile;

  constructor(proj: Projectile, mesh: THREE.Object3D) {
    super(proj.id, mesh);
    this.proj = proj;
  }

  protected onUpdate(dt: number, now: number): void {
    this.object3D.position.set(this.proj.x, this.proj.y, this.proj.z);
  }

  protected onDispose(): void {
    if (this.object3D.parent) {
      this.object3D.parent.remove(this.object3D);
    }
  }
}

/**
 * 6. GROUND_ITEM_NODE
 * Representa ítems lootables tirados que brincan de forma física.
 */
export class GroundItemNode extends VisualNode {
  public item: GroundItem;

  constructor(item: GroundItem, mesh: THREE.Mesh) {
    super(item.id, mesh);
    this.item = item;
  }

  protected onUpdate(dt: number, now: number): void {
    const mesh = this.object3D as THREE.Mesh;
    if (this.item.velY !== undefined) {
      mesh.position.set(this.item.x, this.item.y, this.item.z);
    } else {
      mesh.position.set(this.item.x, 0.22 + Math.abs(Math.sin(now * 0.005)) * 0.18, this.item.z);
    }
    mesh.rotation.y += 0.015 * (dt * 60);
  }

  protected onDispose(): void {
    if (this.object3D.parent) {
      this.object3D.parent.remove(this.object3D);
    }
  }
}

/**
 * 7. HIGH-PERFORMANCE STATIC DECORATION INSTANCING SYSTEM
 * Consolida múltiples elementos idénticos (como columnas de rocas, vegetación, escombros)
 * en un solo draw call con THREE.InstancedMesh.
 * Reduce dramáticamente el overhead del driver gráfico, incrementando severamente los FPS en celulares.
 */
export class EnvironmentInstancedSystem {
  private instancedMesh: THREE.InstancedMesh | null = null;
  private grassMesh: THREE.InstancedMesh | null = null;
  private wildFlowerMesh: THREE.InstancedMesh | null = null;
  private smallRockMesh: THREE.InstancedMesh | null = null;
  private propsMesh: THREE.InstancedMesh | null = null;
  private barrelMesh: THREE.InstancedMesh | null = null;
  private signBoardMesh: THREE.InstancedMesh | null = null;
  private signPoleMesh: THREE.InstancedMesh | null = null;
  private grassPatchMesh: THREE.InstancedMesh | null = null;
  private treeTrunkMesh: THREE.InstancedMesh | null = null;
  private treeLeavesMesh: THREE.InstancedMesh | null = null;
  private dustParticles: THREE.Points | null = null;
  private dustInitialY: Float32Array | null = null;
  private clock: THREE.Clock = new THREE.Clock();

  // Ambient Life Systems
  private mushroomMesh: THREE.InstancedMesh | null = null;
  private fallingLeavesMesh: THREE.InstancedMesh | null = null;
  private fireflies: THREE.Points | null = null;
  private firefliesInitialPos: Float32Array | null = null;

  // Cache data to perform fluid, cheap wind sway animations (mobile-optimized)
  private grassPatches: { x: number, y: number, z: number, rX: number, rY: number, rZ: number, sX: number, sY: number, sZ: number }[] = [];
  private wildFlowers: { x: number, y: number, z: number, rX: number, rY: number, rZ: number, sX: number, sY: number, sZ: number }[] = [];
  private bushes: { x: number, y: number, z: number, rX: number, rY: number, rZ: number, sX: number, sY: number, sZ: number }[] = [];
  private fallingLeaves: { x: number, y: number, z: number, s: number, speedY: number, rX: number, rY: number, rZ: number, rotSpeed: number }[] = [];

  private butterflies: {
    group: THREE.Group;
    wingLeft: THREE.Mesh;
    wingRight: THREE.Mesh;
    baseX: number;
    baseY: number;
    baseZ: number;
    angle: number;
    speed: number;
    radiusX: number;
    radiusZ: number;
    heightOffset: number;
    flapSpeed: number;
  }[] = [];

  private birds: {
    group: THREE.Group;
    wingLeft: THREE.Mesh;
    wingRight: THREE.Mesh;
    angle: number;
    speed: number;
    radius: number;
    height: number;
    flapSpeed: number;
  }[] = [];

  constructor() {
    if (typeof window !== 'undefined' && !(window as any).ambientLife) {
      (window as any).ambientLife = {
        butterflies: true,
        birds: true,
        leaves: true,
        fireflies: true,
        dust: true,
        windSpeed: 1.0,
        windForce: 1.0
      };
    }
  }

  public spawnInstancedRocks(scene: THREE.Scene, rockCount: number = 25) {
    // Get synchronized obstacles coordinates from character controller
    const mapName = useGameStore.getState().currentMap || 'prontera';
    const rocks = getRockObstacles(mapName);
    const count = rocks.length;

    // Multi-part Ancient Ruined Column geometry
    const rockParts: THREE.BufferGeometry[] = [];
    
    // Column shaft drum
    const drum = new THREE.CylinderGeometry(0.44, 0.44, 1.0, 8);
    drum.translate(0, 0.5, 0); // starts at bottom y=0, goes to y=1.0
    paintGeometry(drum, 0x4c566a);
    rockParts.push(drum);

    // Column Base pedestal block
    const baseBlock = new THREE.BoxGeometry(1.05, 0.12, 1.05);
    baseBlock.translate(0, 0.06, 0);
    paintGeometry(baseBlock, 0x3b4252);
    rockParts.push(baseBlock);

    // Column Capital crown block
    const capitalBlock = new THREE.BoxGeometry(0.95, 0.1, 0.95);
    capitalBlock.translate(0, 0.95, 0);
    paintGeometry(capitalBlock, 0x3b4252);
    rockParts.push(capitalBlock);

    // Broken secondary block attached to base
    const blockFrag = new THREE.DodecahedronGeometry(0.24, 0);
    blockFrag.translate(0.55, 0.12, -0.4);
    paintGeometry(blockFrag, 0x4c566a);
    rockParts.push(blockFrag);

    const colGeo = mergeBufferGeometries(rockParts);
    const colMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.82,
      flatShading: true
    });

    // Create a high performance InstancedMesh
    this.instancedMesh = new THREE.InstancedMesh(colGeo, colMat, count);
    this.instancedMesh.castShadow = true;
    this.instancedMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const rock = rocks[i];
      const h = rock.height || 4.2;
      const radius = rock.radius * 0.85; // slight visual scale pad

      const groundH = getTerrainHeight(rock.x, rock.z);
      // Since geometry starts at flat y=0, place dummy at the floor
      dummy.position.set(rock.x, groundH, rock.z);
      dummy.scale.set(radius, h, radius);
      
      // Slight tilting rotations to make ruins look worn-out and ancient!
      dummy.rotation.set(
        Math.sin(i * 12.3) * 0.04,
        Math.cos(i * 45.6) * 3.1415,
        Math.sin(i * 34.5) * 0.04
      );
      
      dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, dummy.matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    scene.add(this.instancedMesh);

    // Spawn custom ancient structures (campfires & stone gates)
    this.spawnLandmarks(scene);

    this.spawnFoliageAndDebris(scene);
    this.spawnEnvironmentalProps(scene, rocks);
    this.spawnTrees(scene);
    this.spawnAtmosphericDust(scene);
    this.spawnButterflies(scene);
    this.spawnBirds(scene);
    this.spawnFireflies(scene);
  }

  private spawnLandmarks(scene: THREE.Scene) {
    const stoneMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      flatShading: true
    });

    const fireMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.2,
      emissive: new THREE.Color(0xff5500),
      emissiveIntensity: 1.5,
      flatShading: true
    });

    // 1. ANCIENT RUINS GATE / ARCH (Towards Baphomet Lair at x: 32, z: -32)
    const archParts: THREE.BufferGeometry[] = [];
    
    // Left Pillar stone
    const leftPillar = new THREE.BoxGeometry(0.8, 3.8, 0.8);
    leftPillar.translate(-2.4, 1.9, 0);
    paintGeometry(leftPillar, 0x4c566a);
    archParts.push(leftPillar);

    // Left Pillar base block
    const leftBase = new THREE.BoxGeometry(1.2, 0.5, 1.2);
    leftBase.translate(-2.4, 0.25, 0);
    paintGeometry(leftBase, 0x3b4252);
    archParts.push(leftBase);

    // Right Pillar stone
    const rightPillar = new THREE.BoxGeometry(0.8, 3.8, 0.8);
    rightPillar.translate(2.4, 1.9, 0);
    paintGeometry(rightPillar, 0x4c566a);
    archParts.push(rightPillar);

    // Right Pillar base block
    const rightBase = new THREE.BoxGeometry(1.2, 0.5, 1.2);
    rightBase.translate(2.4, 0.25, 0);
    paintGeometry(rightBase, 0x3b4252);
    archParts.push(rightBase);

    // Main header beam
    const lintel = new THREE.BoxGeometry(5.8, 0.7, 1.0);
    lintel.translate(0, 4.15, 0);
    paintGeometry(lintel, 0x434c5e);
    archParts.push(lintel);

    // Some broken rubble blocks at the feet
    const rubble1 = new THREE.DodecahedronGeometry(0.5, 0);
    rubble1.translate(-2.8, 0.3, 0.6);
    paintGeometry(rubble1, 0x4c566a);
    archParts.push(rubble1);

    const rubble2 = new THREE.DodecahedronGeometry(0.4, 0);
    rubble2.translate(2.6, 0.2, -0.7);
    paintGeometry(rubble2, 0x434c5e);
    archParts.push(rubble2);

    const archGeo = mergeBufferGeometries(archParts);
    archGeo.computeVertexNormals();

    const archMesh = new THREE.Mesh(archGeo, stoneMat);
    archMesh.castShadow = true;
    archMesh.receiveShadow = true;

    const archX = 32;
    const archZ = -32;
    const archY = getTerrainHeight(archX, archZ);
    archMesh.position.set(archX, archY, archZ);
    // Orient the gate diagonal facing towards Baphomet
    archMesh.rotation.set(0, Math.PI / 4, 0);
    scene.add(archMesh);

    // 2. COZY ROAD REST CAMPFIRE (At x: -12, z: 12, near crossroads)
    const campParts: THREE.BufferGeometry[] = [];
    
    // Log wood logs
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI) / 3;
      const log = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 5);
      log.rotateX(Math.PI / 2);
      log.rotateY(angle);
      log.translate(Math.cos(angle) * 0.05, 0.06, Math.sin(angle) * 0.05);
      paintGeometry(log, 0x4a2e1d);
      campParts.push(log);
    }

    // Outer stone ring
    const stoneCount = 7;
    for (let i = 0; i < stoneCount; i++) {
      const angle = (i * Math.PI * 2) / stoneCount;
      const stoneRadius = 0.35 + Math.random() * 0.05;
      const stone = new THREE.DodecahedronGeometry(0.12, 0);
      stone.translate(Math.cos(angle) * stoneRadius, 0.06, Math.sin(angle) * stoneRadius);
      paintGeometry(stone, 0x4c566a);
      campParts.push(stone);
    }

    const campGeo = mergeBufferGeometries(campParts);
    campGeo.computeVertexNormals();

    const campMesh = new THREE.Mesh(campGeo, stoneMat);
    campMesh.castShadow = true;
    campMesh.receiveShadow = true;

    const campX = -12;
    const campZ = 12;
    const campY = getTerrainHeight(campX, campZ);
    campMesh.position.set(campX, campY, campZ);
    scene.add(campMesh);

    // Glowing flame core
    const flameGeo = new THREE.ConeGeometry(0.18, 0.4, 4);
    flameGeo.translate(0, 0.24, 0);
    paintGeometry(flameGeo, 0xff5500);
    
    const flameMesh = new THREE.Mesh(flameGeo, fireMat);
    flameMesh.position.set(campX, campY, campZ);
    scene.add(flameMesh);

    // Add a warm point light at the campfire to bathe the area in cozy ambient glow!
    const campfireLight = new THREE.PointLight(0xff5500, 2.0, 6.0, 0.5);
    campfireLight.position.set(campX, campY + 0.5, campZ);
    campfireLight.castShadow = true;
    scene.add(campfireLight);
  }

  private spawnTrees(scene: THREE.Scene) {
    const mapName = useGameStore.getState().currentMap || 'prontera';
    const trees = getTreeObstacles(mapName);
    const treeCount = trees.length;
    
    // Multi-colored Pine Tree Trunk
    const trunkParts: THREE.BufferGeometry[] = [];
    const mainTrunk = new THREE.CylinderGeometry(0.24, 0.35, 3.2, 5);
    mainTrunk.translate(0, 1.6, 0);
    paintGeometry(mainTrunk, 0x4a2e1d);
    trunkParts.push(mainTrunk);

    const baseFlange = new THREE.CylinderGeometry(0.45, 0.55, 0.4, 5);
    baseFlange.translate(0, 0.2, 0);
    paintGeometry(baseFlange, 0x3a2512);
    trunkParts.push(baseFlange);

    const trunkGeo = mergeBufferGeometries(trunkParts);
    const trunkMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true });
    this.treeTrunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    this.treeTrunkMesh.castShadow = true;
    this.treeTrunkMesh.receiveShadow = true;

    // Multi-layered/tiered Spruce Tree Leaves for epic 3D depth
    const leavesParts: THREE.BufferGeometry[] = [];
    
    // Tier 1 (Bottom)
    const tier1 = new THREE.ConeGeometry(2.3, 2.0, 5);
    tier1.translate(0, 2.0, 0);
    paintGeometry(tier1, 0x15351c); // Deep forest green
    leavesParts.push(tier1);

    // Tier 2 (Middle)
    const tier2 = new THREE.ConeGeometry(1.8, 1.8, 5);
    tier2.translate(0, 3.4, 0);
    paintGeometry(tier2, 0x194223); // Vibrant mid-green
    leavesParts.push(tier2);

    // Tier 3 (Top)
    const tier3 = new THREE.ConeGeometry(1.2, 1.5, 5);
    tier3.translate(0, 4.6, 0);
    paintGeometry(tier3, 0x23522c); // Lighter top green
    leavesParts.push(tier3);

    const leavesGeo = mergeBufferGeometries(leavesParts);
    const leavesMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, flatShading: true });
    this.treeLeavesMesh = new THREE.InstancedMesh(leavesGeo, leavesMat, treeCount);
    this.treeLeavesMesh.castShadow = true;
    this.treeLeavesMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();

    for(let i=0; i<treeCount; i++) {
        const tree = trees[i];
        const groundH = getTerrainHeight(tree.x, tree.z);
        
        dummy.position.set(tree.x, groundH, tree.z);
        dummy.rotation.set(tree.rotX, tree.rotY, tree.rotZ);
        dummy.scale.set(tree.scale, tree.scale, tree.scale);
        dummy.updateMatrix();

        this.treeTrunkMesh.setMatrixAt(i, dummy.matrix);
        
        // Slightly scale leaves for unique organic ratios
        dummy.position.set(tree.x, groundH, tree.z);
        dummy.scale.set(tree.scale, tree.leavesScaleY, tree.scale);
        dummy.updateMatrix();
        this.treeLeavesMesh.setMatrixAt(i, dummy.matrix);
    }
    
    this.treeTrunkMesh.instanceMatrix.needsUpdate = true;
    this.treeLeavesMesh.instanceMatrix.needsUpdate = true;
    scene.add(this.treeTrunkMesh);
    scene.add(this.treeLeavesMesh);
  }

  private spawnAtmosphericDust(scene: THREE.Scene) {
    const particleCount = 400; // Low count for mobile performance
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const initialY = new Float32Array(particleCount);
    
    // Spread in a large volume around the playable area
    for(let i=0; i<particleCount; i++) {
        // x (-40 to 40)
        positions[i*3] = (Math.random() - 0.5) * 80;
        // y (0.5 to 15)
        const y = 0.5 + Math.random() * 14.5;
        positions[i*3+1] = y;
        initialY[i] = y;
        // z (-40 to 40)
        positions[i*3+2] = (Math.random() - 0.5) * 80;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.dustInitialY = initialY;

    // Fast particle material matching cool light fill cyan
    const material = new THREE.PointsMaterial({
        color: 0x7dd3fc, 
        size: 0.15,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    this.dustParticles = new THREE.Points(geometry, material);
    this.dustParticles.renderOrder = 99; // Render late for Additive Blending
    scene.add(this.dustParticles);
  }

  private spawnButterflies(scene: THREE.Scene) {
    const butterflyCount = 15;
    const colors = [0xff77a9, 0xffb703, 0x8ecae6, 0x9b5de5, 0x00f5d4]; // vibrant, beautiful colors
    
    for (let i = 0; i < butterflyCount; i++) {
      const bGroup = new THREE.Group();
      
      const wingLeftGeo = new THREE.PlaneGeometry(0.18, 0.15);
      wingLeftGeo.translate(0.09, 0, 0); // pivot on edge
      const wingRightGeo = new THREE.PlaneGeometry(0.18, 0.15);
      wingRightGeo.translate(-0.09, 0, 0); // pivot on edge
      
      const color = colors[i % colors.length];
      const wingMat = new THREE.MeshBasicMaterial({ 
        color, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95
      });
      
      const wingL = new THREE.Mesh(wingLeftGeo, wingMat);
      const wingR = new THREE.Mesh(wingRightGeo, wingMat);
      
      wingL.rotation.y = 0.2;
      wingR.rotation.y = -0.2;
      
      bGroup.add(wingL);
      bGroup.add(wingR);
      
      // Flight base coordinates (avoid center area)
      let baseX = (Math.random() - 0.5) * 80;
      let baseZ = (Math.random() - 0.5) * 80;
      while (Math.sqrt(baseX*baseX + baseZ*baseZ) < 18) {
        baseX = (Math.random() - 0.5) * 80;
        baseZ = (Math.random() - 0.5) * 80;
      }
      
      const baseY = getTerrainHeight(baseX, baseZ);
      
      this.butterflies.push({
        group: bGroup,
        wingLeft: wingL,
        wingRight: wingR,
        baseX,
        baseY,
        baseZ,
        angle: Math.random() * Math.PI * 2,
        speed: 1.0 + Math.random() * 1.5,
        radiusX: 1.5 + Math.random() * 3.5,
        radiusZ: 1.5 + Math.random() * 3.5,
        heightOffset: 0.5 + Math.random() * 1.2,
        flapSpeed: 20 + Math.random() * 12
      });
      
      scene.add(bGroup);
    }
  }

  private spawnBirds(scene: THREE.Scene) {
    const birdCount = 6;
    const colors = [0xffffff, 0xe5e9f0, 0x88c0d0]; // Nordic white and bluebirds
    
    for (let i = 0; i < birdCount; i++) {
      const bGroup = new THREE.Group();
      
      const wingLeftGeo = new THREE.PlaneGeometry(0.65, 0.25);
      wingLeftGeo.translate(0.325, 0, 0);
      const wingRightGeo = new THREE.PlaneGeometry(0.65, 0.25);
      wingRightGeo.translate(-0.325, 0, 0);
      
      const bodyGeo = new THREE.ConeGeometry(0.09, 0.45, 4);
      bodyGeo.rotateX(Math.PI / 2);
      
      const color = colors[i % colors.length];
      const mat = new THREE.MeshBasicMaterial({ 
        color, 
        side: THREE.DoubleSide
      });
      
      const body = new THREE.Mesh(bodyGeo, mat);
      const wingL = new THREE.Mesh(wingLeftGeo, mat);
      const wingR = new THREE.Mesh(wingRightGeo, mat);
      
      bGroup.add(body);
      bGroup.add(wingL);
      bGroup.add(wingR);
      
      this.birds.push({
        group: bGroup,
        wingLeft: wingL,
        wingRight: wingR,
        angle: Math.random() * Math.PI * 2,
        speed: 0.08 + Math.random() * 0.12,
        radius: 35.0 + Math.random() * 25.0,
        height: 12.0 + Math.random() * 6.0,
        flapSpeed: 3.5 + Math.random() * 2.5
      });
      
      scene.add(bGroup);
    }
  }

  private spawnFireflies(scene: THREE.Scene) {
    const fireflyCount = 35;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(fireflyCount * 3);
    const initialPos = new Float32Array(fireflyCount * 3);
    
    for (let i = 0; i < fireflyCount; i++) {
      let x = (Math.random() - 0.5) * 85;
      let z = (Math.random() - 0.5) * 85;
      while (Math.sqrt(x*x + z*z) < 18) {
        x = (Math.random() - 0.5) * 85;
        z = (Math.random() - 0.5) * 85;
      }
      
      const y = getTerrainHeight(x, z) + 0.4 + Math.random() * 1.5;
      
      positions[i*3] = x;
      positions[i*3+1] = y;
      positions[i*3+2] = z;
      
      initialPos[i*3] = x;
      initialPos[i*3+1] = y;
      initialPos[i*3+2] = z;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.firefliesInitialPos = initialPos;
    
    const material = new THREE.PointsMaterial({
      color: 0xebcb8b, // warm amber glowing fireflies
      size: 0.35,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    this.fireflies = new THREE.Points(geometry, material);
    scene.add(this.fireflies);
  }

  public updateParticles(dt: number = 0.016) {
      const time = this.clock.getElapsedTime();

      // Read dynamic values in real-time from window configuration
      const amb = (typeof window !== 'undefined' ? (window as any).ambientLife : null) || {
        butterflies: true,
        birds: true,
        leaves: true,
        fireflies: true,
        dust: true,
        windSpeed: 1.0,
        windForce: 1.0
      };

      const wSpeed = amb.windSpeed ?? 1.0;
      const wForce = amb.windForce ?? 1.0;

      // 1. Slow rising dust particles
      if (this.dustParticles && this.dustInitialY) {
        const isDust = amb.dust !== false;
        this.dustParticles.visible = isDust;
        if (isDust) {
          const positions = this.dustParticles.geometry.attributes.position.array as Float32Array;
          for(let i=0; i<positions.length/3; i++) {
              const ix = i*3;
              const iy = i*3 + 1;
              const iz = i*3 + 2;
              
              positions[iy] = this.dustInitialY[i] + Math.sin(time * 0.5 * wSpeed + i) * 1.5;
              positions[ix] += Math.cos(time * 0.2 * wSpeed + i) * 0.01;
              positions[iz] += Math.sin(time * 0.3 * wSpeed + i) * 0.01;
              
              if(positions[ix] > 40) positions[ix] = -40;
              if(positions[ix] < -40) positions[ix] = 40;
              if(positions[iz] > 40) positions[iz] = -40;
              if(positions[iz] < -40) positions[iz] = 40;
          }
          this.dustParticles.geometry.attributes.position.needsUpdate = true;
        }
      }

      const dummy = new THREE.Object3D();

      // 2. Wind wave sway on Grass
      if (this.grassPatchMesh && this.grassPatches.length > 0) {
        for (let i = 0; i < this.grassPatches.length; i++) {
          const gp = this.grassPatches[i];
          const windX = Math.sin(time * 2.2 * wSpeed + gp.x * 0.4 + gp.z * 0.2) * 0.12 * wForce;
          const windZ = Math.cos(time * 1.8 * wSpeed + gp.x * 0.3 + gp.z * 0.4) * 0.08 * wForce;

          dummy.position.set(gp.x, gp.y, gp.z);
          dummy.rotation.set(gp.rX + windX, gp.rY, gp.rZ + windZ);
          dummy.scale.set(gp.sX, gp.sY, gp.sZ);
          dummy.updateMatrix();
          this.grassPatchMesh.setMatrixAt(i, dummy.matrix);
        }
        this.grassPatchMesh.instanceMatrix.needsUpdate = true;
      }

      // 3. Flower nodding in the breeze
      if (this.wildFlowerMesh && this.wildFlowers.length > 0) {
        for (let i = 0; i < this.wildFlowers.length; i++) {
          const wf = this.wildFlowers[i];
          const windX = Math.sin(time * 2.0 * wSpeed + wf.x * 0.45 + wf.z * 0.25) * 0.10 * wForce;
          const windZ = Math.cos(time * 1.6 * wSpeed + wf.x * 0.35 + wf.z * 0.45) * 0.08 * wForce;

          dummy.position.set(wf.x, wf.y, wf.z);
          dummy.rotation.set(wf.rX + windX, wf.rY + windZ * 0.4, wf.rZ + windZ);
          dummy.scale.set(wf.sX, wf.sY, wf.sZ);
          dummy.updateMatrix();
          this.wildFlowerMesh.setMatrixAt(i, dummy.matrix);
        }
        this.wildFlowerMesh.instanceMatrix.needsUpdate = true;
      }

      // 4. Wind sway on Bushes
      if (this.grassMesh && this.bushes.length > 0) {
        for (let i = 0; i < this.bushes.length; i++) {
          const b = this.bushes[i];
          const windX = Math.sin(time * 1.5 * wSpeed + b.x * 0.2 + b.z * 0.1) * 0.05 * wForce;
          const windZ = Math.cos(time * 1.3 * wSpeed + b.x * 0.1 + b.z * 0.2) * 0.04 * wForce;

          dummy.position.set(b.x, b.y, b.z);
          dummy.rotation.set(b.rX + windX, b.rY, b.rZ + windZ);
          dummy.scale.set(b.sX, b.sY, b.sZ);
          dummy.updateMatrix();
          this.grassMesh.setMatrixAt(i, dummy.matrix);
        }
        this.grassMesh.instanceMatrix.needsUpdate = true;
      }

      // 5. Falling Leaves physics & respawn
      if (this.fallingLeavesMesh && this.fallingLeaves.length > 0) {
        const isLeaves = amb.leaves !== false;
        this.fallingLeavesMesh.visible = isLeaves;
        if (isLeaves) {
          for (let i = 0; i < this.fallingLeaves.length; i++) {
            const lf = this.fallingLeaves[i];
            
            lf.y -= lf.speedY * wSpeed;
            lf.x += Math.sin(time * 2.5 * wSpeed + i) * 0.015 * wForce;
            lf.z += Math.cos(time * 2.0 * wSpeed + i) * 0.015 * wForce;
            lf.rX += lf.rotSpeed * wSpeed;
            lf.rY += lf.rotSpeed * 0.4 * wSpeed;
            
            const groundLimit = getTerrainHeight(lf.x, lf.z) + 0.1;
            if (lf.y < groundLimit) {
              const trees = getTreeObstacles();
              if (trees.length > 0) {
                const randTree = trees[Math.floor(Math.random() * trees.length)];
                const radius = 0.5 + Math.random() * 1.5;
                const angle = Math.random() * Math.PI * 2;
                lf.x = randTree.x + Math.cos(angle) * radius;
                lf.z = randTree.z + Math.sin(angle) * radius;
                lf.y = getTerrainHeight(lf.x, lf.z) + 3.0 + Math.random() * 4.0;
              } else {
                lf.y = 8.0 + Math.random() * 4.0;
              }
            }
            
            dummy.position.set(lf.x, lf.y, lf.z);
            dummy.rotation.set(lf.rX, lf.rY, lf.rZ);
            dummy.scale.set(lf.s, lf.s, lf.s);
            dummy.updateMatrix();
            this.fallingLeavesMesh.setMatrixAt(i, dummy.matrix);
          }
          this.fallingLeavesMesh.instanceMatrix.needsUpdate = true;
        }
      }

      // 6. Fluttering Butterflies
      const isButterflies = amb.butterflies !== false;
      this.butterflies.forEach((b) => {
        b.group.visible = isButterflies;
        if (isButterflies) {
          b.angle += dt * b.speed * wSpeed;
          
          const localX = Math.cos(b.angle) * b.radiusX;
          const localZ = Math.sin(b.angle * 1.6) * b.radiusZ; // figure-eight flight pattern
          const targetX = b.baseX + localX;
          const targetZ = b.baseZ + localZ;
          const groundH = getTerrainHeight(targetX, targetZ);
          const targetY = groundH + b.heightOffset + Math.sin(time * 3.0 * wSpeed + b.angle) * 0.35;
          
          b.group.position.set(targetX, targetY, targetZ);
          b.group.rotation.y = -b.angle * 1.1 + Math.PI / 2;
          
          const flap = Math.sin(time * b.flapSpeed * wSpeed) * 0.85;
          b.wingLeft.rotation.z = flap;
          b.wingRight.rotation.z = -flap;
        }
      });

      // 7. Majestic Soaring Birds
      const isBirds = amb.birds !== false;
      this.birds.forEach((bird) => {
        bird.group.visible = isBirds;
        if (isBirds) {
          bird.angle += dt * bird.speed * wSpeed;
          
          const targetX = Math.cos(bird.angle) * bird.radius;
          const targetZ = Math.sin(bird.angle) * bird.radius;
          
          bird.group.position.set(targetX, bird.height + Math.sin(time * 0.4 * wSpeed) * 1.2, targetZ);
          bird.group.rotation.y = -bird.angle + Math.PI;
          
          const isGliding = Math.sin(time * 0.3 * wSpeed) > 0.4;
          const flap = isGliding ? 0.05 : Math.sin(time * bird.flapSpeed * wSpeed) * 0.4;
          bird.wingLeft.rotation.z = flap;
          bird.wingRight.rotation.z = -flap;
        }
      });

      // 8. Glowing / Breathing Fireflies
      if (this.fireflies && this.firefliesInitialPos) {
        const isFireflies = amb.fireflies !== false;
        this.fireflies.visible = isFireflies;
        if (isFireflies) {
          const positions = this.fireflies.geometry.attributes.position.array as Float32Array;
          const ffMat = this.fireflies.material as THREE.PointsMaterial;
          
          ffMat.opacity = 0.5 + Math.sin(time * 4.0 * wSpeed) * 0.4;
          
          for (let i = 0; i < positions.length / 3; i++) {
            const ix = i * 3;
            const iy = i * 3 + 1;
            const iz = i * 3 + 2;
            
            positions[ix] = this.firefliesInitialPos[ix] + Math.sin(time * 1.0 * wSpeed + i) * 0.8;
            positions[iy] = this.firefliesInitialPos[iy] + Math.cos(time * 1.8 * wSpeed + i) * 0.3;
            positions[iz] = this.firefliesInitialPos[iz] + Math.sin(time * 1.3 * wSpeed + i) * 0.8;
          }
          this.fireflies.geometry.attributes.position.needsUpdate = true;
        }
      }
  }

  private spawnEnvironmentalProps(scene: THREE.Scene, rocks: any[]) {
    // 1. Fetch deterministic prop state
    const mapName = useGameStore.getState().currentMap || 'prontera';
    const allProps = getPropObstacles(mapName);

    const crates = allProps.filter(p => p.type === 'crate');
    const barrels = allProps.filter(p => p.type === 'barrel');
    const signposts = allProps.filter(p => p.type === 'signpost');

    // 2. Instantiate meshes with accurate visual counts
    // Crates - wood block with steel bands
    const crateParts: THREE.BufferGeometry[] = [];
    const coreCrate = new THREE.BoxGeometry(0.72, 0.72, 0.72);
    paintGeometry(coreCrate, 0x8b7355); // wood core
    crateParts.push(coreCrate);
    
    // wrapping steel bands
    const band1 = new THREE.BoxGeometry(0.76, 0.15, 0.76);
    paintGeometry(band1, 0x3b4252);
    crateParts.push(band1);
    
    const band2 = new THREE.BoxGeometry(0.76, 0.76, 0.15);
    paintGeometry(band2, 0x3b4252);
    crateParts.push(band2);
    
    const band3 = new THREE.BoxGeometry(0.15, 0.76, 0.76);
    paintGeometry(band3, 0x3b4252);
    crateParts.push(band3);

    const crateGeo = mergeBufferGeometries(crateParts);
    const crateMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.92,
      flatShading: true
    });
    this.propsMesh = new THREE.InstancedMesh(crateGeo, crateMat, crates.length);
    this.propsMesh.castShadow = true;
    this.propsMesh.receiveShadow = true;

    // Barrels - bulging wood barrel with iron hoops
    const barrelParts: THREE.BufferGeometry[] = [];
    
    const segBot = new THREE.CylinderGeometry(0.3, 0.35, 0.3, 8);
    segBot.translate(0, -0.3, 0);
    paintGeometry(segBot, 0x5c4033);
    barrelParts.push(segBot);

    const segMid = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 8);
    segMid.translate(0, 0, 0);
    paintGeometry(segMid, 0x6e4b3c);
    barrelParts.push(segMid);

    const segTop = new THREE.CylinderGeometry(0.35, 0.3, 0.3, 8);
    segTop.translate(0, 0.3, 0);
    paintGeometry(segTop, 0x5c4033);
    barrelParts.push(segTop);

    const loopTop = new THREE.CylinderGeometry(0.33, 0.33, 0.05, 8);
    loopTop.translate(0, 0.2, 0);
    paintGeometry(loopTop, 0x2e3440);
    barrelParts.push(loopTop);

    const loopBot = new THREE.CylinderGeometry(0.33, 0.33, 0.05, 8);
    loopBot.translate(0, -0.2, 0);
    paintGeometry(loopBot, 0x2e3440);
    barrelParts.push(loopBot);

    const barrelGeo = mergeBufferGeometries(barrelParts);
    const barrelMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      flatShading: true
    });
    this.barrelMesh = new THREE.InstancedMesh(barrelGeo, barrelMat, barrels.length);
    this.barrelMesh.castShadow = true;
    this.barrelMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const dummyBoard = new THREE.Object3D();

    // Signboard
    const bParts: THREE.BufferGeometry[] = [];
    const bRect = new THREE.BoxGeometry(0.68, 0.32, 0.08);
    bRect.translate(-0.06, 0, 0);
    paintGeometry(bRect, 0x8b7355);
    bParts.push(bRect);

    const bTip = new THREE.ConeGeometry(0.2, 0.28, 4);
    bTip.rotateZ(Math.PI / 2);
    bTip.translate(0.34, 0, 0);
    paintGeometry(bTip, 0x8b7355);
    bParts.push(bTip);

    const boardGeo = mergeBufferGeometries(bParts);
    const boardMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true });
    this.signBoardMesh = new THREE.InstancedMesh(boardGeo, boardMat, signposts.length);
    this.signBoardMesh.castShadow = true;
    this.signBoardMesh.receiveShadow = true;

    // Signpost pole
    const pParts: THREE.BufferGeometry[] = [];
    const pStem = new THREE.CylinderGeometry(0.06, 0.06, 1.4, 5);
    pStem.translate(0, 0, 0);
    paintGeometry(pStem, 0x4a3b2c);
    pParts.push(pStem);

    const pBase = new THREE.CylinderGeometry(0.18, 0.2, 0.22, 6);
    pBase.translate(0, -0.58, 0);
    paintGeometry(pBase, 0x4c566a);
    pParts.push(pBase);

    const poleGeo = mergeBufferGeometries(pParts);
    const poleMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, flatShading: true });
    this.signPoleMesh = new THREE.InstancedMesh(poleGeo, poleMat, signposts.length);
    this.signPoleMesh.castShadow = true;
    this.signPoleMesh.receiveShadow = true;

    // Render crates
    for (let i = 0; i < crates.length; i++) {
      const c = crates[i];
      const groundH = getTerrainHeight(c.x, c.z);
      dummy.position.set(c.x, groundH + c.scale * 0.4, c.z); // sit on ground
      dummy.rotation.set(c.rotX, c.rotY, c.rotZ);
      dummy.scale.set(c.scale, c.scale, c.scale);
      dummy.updateMatrix();
      this.propsMesh.setMatrixAt(i, dummy.matrix);
    }
    this.propsMesh.count = crates.length;

    // Render barrels
    for (let i = 0; i < barrels.length; i++) {
      const b = barrels[i];
      const groundH = getTerrainHeight(b.x, b.z);
      dummy.position.set(b.x, groundH + (b.isFallen ? b.scale * 0.35 : b.scale * 0.45), b.z); 
      dummy.rotation.set(b.rotX, b.rotY, b.rotZ);
      dummy.scale.set(b.scale, b.scale, b.scale);
      dummy.updateMatrix();
      this.barrelMesh.setMatrixAt(i, dummy.matrix);
    }
    this.barrelMesh.count = barrels.length;

    // Render signposts
    for (let i = 0; i < signposts.length; i++) {
        const s = signposts[i];
        const groundH = getTerrainHeight(s.x, s.z);
        
        // Pole
        dummy.position.set(s.x, groundH + 0.7, s.z);
        dummy.rotation.set(s.rotX, s.rotY, s.rotZ);
        dummy.scale.set(1.0, 1.0, 1.0);
        dummy.updateMatrix();
        this.signPoleMesh.setMatrixAt(i, dummy.matrix);

        // Board
        dummyBoard.position.set(s.x, groundH + 1.1, s.z); // Top of the pole
        if (s.boardRotY !== undefined) {
          // Adjust board position relative to the root considering the tilt
          dummyBoard.position.add(new THREE.Vector3(
            Math.sin(s.boardRotY) * 0.05, 
            0, 
            Math.cos(s.boardRotY) * 0.05
          ));
          dummyBoard.rotation.set(s.rotX, s.boardRotY, s.rotZ + (s.boardRotZ || 0));
        } else {
          dummyBoard.rotation.set(s.rotX, s.rotY, s.rotZ);
        }
        dummyBoard.scale.set(1.0, 1.0, 1.0);
        dummyBoard.updateMatrix();
        this.signBoardMesh.setMatrixAt(i, dummyBoard.matrix);
    }
    this.signPoleMesh.count = signposts.length;
    this.signBoardMesh.count = signposts.length;

    this.propsMesh.instanceMatrix.needsUpdate = true;
    this.barrelMesh.instanceMatrix.needsUpdate = true;
    this.signBoardMesh.instanceMatrix.needsUpdate = true;
    this.signPoleMesh.instanceMatrix.needsUpdate = true;

    scene.add(this.propsMesh);
    scene.add(this.barrelMesh);
    scene.add(this.signBoardMesh);
    scene.add(this.signPoleMesh);
  }

  private spawnFoliageAndDebris(scene: THREE.Scene) {
    const count = 160;
    // CAPA 3: VEGETACIÓN (Arbustos y hierbajos de Prontera)
    const bushGeo = new THREE.DodecahedronGeometry(0.7, 0); 
    const bushMat = new THREE.MeshStandardMaterial({ 
      color: 0x2d5a27, // Beautiful forest lawn green bushes
      roughness: 0.9,
      flatShading: true
    });

    this.grassMesh = new THREE.InstancedMesh(bushGeo, bushMat, count);
    this.grassMesh.castShadow = true;
    this.grassMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    this.bushes = [];
    
    let placed = 0;
    while (placed < count) {
      const x = (Math.random() - 0.5) * 120;
      const z = (Math.random() - 0.5) * 120;
      
      if (Math.sqrt(x*x + z*z) < 18) continue;
      
      const scale = 0.4 + Math.random() * 0.55;
      const groundH = getTerrainHeight(x, z);
      
      const rotation = [
        Math.random() * Math.PI, 
        Math.random() * Math.PI, 
        Math.random() * Math.PI
      ];
      
      this.bushes.push({
        x,
        y: groundH + scale * 0.35,
        z,
        rX: rotation[0],
        rY: rotation[1],
        rZ: rotation[2],
        sX: scale,
        sY: scale * 0.8,
        sZ: scale
      });

      dummy.position.set(x, groundH + scale * 0.35, z);
      dummy.rotation.set(rotation[0], rotation[1], rotation[2]);
      dummy.scale.set(scale, scale * 0.8, scale);
      
      dummy.updateMatrix();
      this.grassMesh.setMatrixAt(placed, dummy.matrix);
      placed++;
    }

    this.grassMesh.instanceMatrix.needsUpdate = true;
    scene.add(this.grassMesh);

    // Dynamic Conical Grass Tufts (Hierba animable con variaciones)
    const grassCount = 380;
    const patchGeo = new THREE.ConeGeometry(0.28, 1.1, 3);
    patchGeo.translate(0, 0.55, 0); 
    const patchMat = new THREE.MeshStandardMaterial({
      color: 0x3d744e, // Lighter, vibrant grass tufts blending with terrain
      roughness: 0.9,
      flatShading: true
    });
    this.grassPatchMesh = new THREE.InstancedMesh(patchGeo, patchMat, grassCount);
    this.grassPatchMesh.receiveShadow = true;

    // Colores para variaciones de hierba ("hierba con variaciones")
    const grassColors = [
      0x3d744e, // verde estándar
      0x4a875c, // verde vibrante claro
      0x2e5c3e, // verde bosque profundo
      0x559e6c, // verde primavera luminoso
    ];
    
    this.grassPatches = [];
    for(let i = 0; i < grassCount; i++) {
        const x = (Math.random() - 0.5) * 130;
        const z = (Math.random() - 0.5) * 130;
        
        if (Math.sqrt(x*x + z*z) < 18) continue;

        const scale = 0.5 + Math.random() * 0.8;
        const groundH = getTerrainHeight(x, z);
        const rotY = Math.random() * Math.PI * 2;
        const rotX = (Math.random() - 0.5) * 0.3;
        const rotZ = (Math.random() - 0.5) * 0.3;

        this.grassPatches.push({
          x,
          y: groundH,
          z,
          rX: rotX,
          rY: rotY,
          rZ: rotZ,
          sX: scale,
          sY: scale,
          sZ: scale
        });

        // Aplicamos variaciones de color a la hierba instanciada
        this.grassPatchMesh.setColorAt(i, new THREE.Color(grassColors[i % grassColors.length]));

        dummy.position.set(x, groundH, z);
        dummy.rotation.set(rotX, rotY, rotZ);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        this.grassPatchMesh.setMatrixAt(i, dummy.matrix);
    }
    this.grassPatchMesh.instanceMatrix.needsUpdate = true;
    if (this.grassPatchMesh.instanceColor) this.grassPatchMesh.instanceColor.needsUpdate = true;
    scene.add(this.grassPatchMesh);

    // NEW: Wildflowers of Prontera (Glowing Red, Blue and Yellow Herbs!)
    const flowerCount = 120;
    const flowerGeo = new THREE.SphereGeometry(0.25, 4, 4);
    flowerGeo.translate(0, 0.45, 0);
    
    // Colorful wildflower stems Material list
    const flowerColors = [
      0xbf616a, // Red Herb crimson
      0xebcb8b, // Yellow Herb buttercup
      0x81a1c1, // Blue Herb cornflower
    ];
    
    this.wildFlowerMesh = new THREE.InstancedMesh(
      flowerGeo, 
      new THREE.MeshStandardMaterial({ roughness: 0.8, flatShading: true, emissiveIntensity: 0.35 }), 
      flowerCount
    );
    this.wildFlowerMesh.castShadow = true;
    this.wildFlowerMesh.receiveShadow = true;

    this.wildFlowers = [];
    for (let i = 0; i < flowerCount; i++) {
      const x = (Math.random() - 0.5) * 110;
      const z = (Math.random() - 0.5) * 110;
      
      if (Math.sqrt(x*x + z*z) < 18) continue;
      
      const groundH = getTerrainHeight(x, z);
      const col = flowerColors[i % flowerColors.length];
      
      this.wildFlowerMesh.setColorAt(i, new THREE.Color(col));
      
      const scale = 0.5 + Math.random() * 0.6;
      const rotY = Math.random() * Math.PI;

      this.wildFlowers.push({
        x,
        y: groundH,
        z,
        rX: 0,
        rY: rotY,
        rZ: 0,
        sX: scale,
        sY: scale * 1.5,
        sZ: scale
      });

      dummy.position.set(x, groundH, z);
      dummy.rotation.set(0, rotY, 0);
      dummy.scale.set(scale, scale * 1.5, scale); // tall flower buds
      dummy.updateMatrix();
      
      this.wildFlowerMesh.setMatrixAt(i, dummy.matrix);
    }
    this.wildFlowerMesh.instanceMatrix.needsUpdate = true;
    if (this.wildFlowerMesh.instanceColor) this.wildFlowerMesh.instanceColor.needsUpdate = true;
    scene.add(this.wildFlowerMesh);

    // NEW: Small visual rocks/slate pebbles scattered near forests
    const pebblesCount = 80;
    const pebbleGeo = new THREE.DodecahedronGeometry(0.42, 0);
    const pebbleMat = new THREE.MeshStandardMaterial({
      color: 0x4c566a, // Slate grey rocks matching scenery
      roughness: 0.95,
      flatShading: true
    });
    this.smallRockMesh = new THREE.InstancedMesh(pebbleGeo, pebbleMat, pebblesCount);
    this.smallRockMesh.castShadow = true;
    this.smallRockMesh.receiveShadow = true;

    for (let i = 0; i < pebblesCount; i++) {
      const x = (Math.random() - 0.5) * 120;
      const z = (Math.random() - 0.5) * 120;
      
      if (Math.sqrt(x*x + z*z) < 16) continue;
      
      const groundH = getTerrainHeight(x, z);
      const scale = 0.55 + Math.random() * 0.65;
      
      dummy.position.set(x, groundH + scale * 0.1, z);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummy.scale.set(scale, scale * 0.6, scale * 0.9);
      dummy.updateMatrix();
      
      this.smallRockMesh.setMatrixAt(i, dummy.matrix);
    }
    this.smallRockMesh.instanceMatrix.needsUpdate = true;
    scene.add(this.smallRockMesh);

    // NEW: Cute mushrooms scattered near trees and rocks (Pequeños elementos ambientales)
    const mushroomCount = 50;
    const mushroomGeo = new THREE.CylinderGeometry(0.24, 0.06, 0.45, 5);
    mushroomGeo.translate(0, 0.22, 0);
    const mushroomMat = new THREE.MeshStandardMaterial({
      color: 0xbf616a, // Spore red
      roughness: 0.9,
      flatShading: true
    });
    this.mushroomMesh = new THREE.InstancedMesh(mushroomGeo, mushroomMat, mushroomCount);
    this.mushroomMesh.castShadow = true;
    this.mushroomMesh.receiveShadow = true;

    for (let i = 0; i < mushroomCount; i++) {
        const x = (Math.random() - 0.5) * 110;
        const z = (Math.random() - 0.5) * 110;
        
        if (Math.sqrt(x*x + z*z) < 18) continue;
        
        const groundH = getTerrainHeight(x, z);
        const scale = 0.6 + Math.random() * 0.7;
        
        dummy.position.set(x, groundH, z);
        dummy.rotation.set((Math.random()-0.5)*0.15, Math.random()*Math.PI*2, (Math.random()-0.5)*0.15);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        
        this.mushroomMesh.setMatrixAt(i, dummy.matrix);
        // Colores de champiñones (algunos clásicos rojos, verdes, naranjas, turquesas)
        const mushroomColors = [0xbf616a, 0xa3be8c, 0x8fbcbb, 0xd08770];
        this.mushroomMesh.setColorAt(i, new THREE.Color(mushroomColors[i % mushroomColors.length]));
    }
    this.mushroomMesh.instanceMatrix.needsUpdate = true;
    if (this.mushroomMesh.instanceColor) this.mushroomMesh.instanceColor.needsUpdate = true;
    scene.add(this.mushroomMesh);

    // NEW: Falling Leaves from Trees (Hojas moviéndose/cayendo)
    const leavesCount = 60;
    const leafGeo = new THREE.PlaneGeometry(0.18, 0.22);
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x2e6f3d,
      side: THREE.DoubleSide,
      roughness: 0.8,
      flatShading: true
    });
    this.fallingLeavesMesh = new THREE.InstancedMesh(leafGeo, leafMat, leavesCount);

    const trees = getTreeObstacles();
    const leavesColors = [0x4a875c, 0x2e5c3e, 0xd08770, 0xbf616a];
    this.fallingLeaves = [];
    
    for (let i = 0; i < leavesCount; i++) {
      let lX = (Math.random() - 0.5) * 80;
      let lZ = (Math.random() - 0.5) * 80;
      let lY = 4.0 + Math.random() * 4.0;
      
      if (trees.length > 0) {
        const randTree = trees[i % trees.length];
        const radius = 0.5 + Math.random() * 1.5;
        const angle = Math.random() * Math.PI * 2;
        lX = randTree.x + Math.cos(angle) * radius;
        lZ = randTree.z + Math.sin(angle) * radius;
        lY = getTerrainHeight(lX, lZ) + 3.0 + Math.random() * 4.0;
      }
      
      const s = 0.6 + Math.random() * 0.6;
      this.fallingLeaves.push({
        x: lX,
        y: lY,
        z: lZ,
        s,
        speedY: 0.015 + Math.random() * 0.015,
        rX: Math.random() * Math.PI,
        rY: Math.random() * Math.PI,
        rZ: Math.random() * Math.PI,
        rotSpeed: 0.01 + Math.random() * 0.03
      });
      
      this.fallingLeavesMesh.setColorAt(i, new THREE.Color(leavesColors[i % leavesColors.length]));
      
      dummy.position.set(lX, lY, lZ);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      this.fallingLeavesMesh.setMatrixAt(i, dummy.matrix);
    }
    this.fallingLeavesMesh.instanceMatrix.needsUpdate = true;
    if (this.fallingLeavesMesh.instanceColor) this.fallingLeavesMesh.instanceColor.needsUpdate = true;
    scene.add(this.fallingLeavesMesh);
  }

  public destroy(scene: THREE.Scene) {
    if (this.instancedMesh) {
      scene.remove(this.instancedMesh);
      this.instancedMesh.geometry.dispose();
      if (Array.isArray(this.instancedMesh.material)) {
        this.instancedMesh.material.forEach(m => m.dispose());
      } else {
        this.instancedMesh.material.dispose();
      }
      this.instancedMesh = null;
    }
    if (this.grassMesh) {
      scene.remove(this.grassMesh);
      this.grassMesh.geometry.dispose();
      if (Array.isArray(this.grassMesh.material)) {
        this.grassMesh.material.forEach(m => m.dispose());
      } else {
        this.grassMesh.material.dispose();
      }
      this.grassMesh = null;
    }
    if (this.propsMesh) {
      scene.remove(this.propsMesh);
      this.propsMesh.geometry.dispose();
      if (Array.isArray(this.propsMesh.material)) {
        this.propsMesh.material.forEach(m => m.dispose());
      } else {
        this.propsMesh.material.dispose();
      }
      this.propsMesh = null;
    }
    if (this.barrelMesh) {
      scene.remove(this.barrelMesh);
      this.barrelMesh.geometry.dispose();
      if (Array.isArray(this.barrelMesh.material)) {
        this.barrelMesh.material.forEach(m => m.dispose());
      } else {
        this.barrelMesh.material.dispose();
      }
      this.barrelMesh = null;
    }
    if (this.signBoardMesh) {
      scene.remove(this.signBoardMesh);
      this.signBoardMesh.geometry.dispose();
      if (Array.isArray(this.signBoardMesh.material)) {
        this.signBoardMesh.material.forEach(m => m.dispose());
      } else {
        this.signBoardMesh.material.dispose();
      }
      this.signBoardMesh = null;
    }
    if (this.signPoleMesh) {
      scene.remove(this.signPoleMesh);
      this.signPoleMesh.geometry.dispose();
      if (Array.isArray(this.signPoleMesh.material)) {
        this.signPoleMesh.material.forEach(m => m.dispose());
      } else {
        this.signPoleMesh.material.dispose();
      }
      this.signPoleMesh = null;
    }
    if (this.dustParticles) {
      scene.remove(this.dustParticles);
      this.dustParticles.geometry.dispose();
      (this.dustParticles.material as THREE.Material).dispose();
      this.dustParticles = null;
    }
    if (this.grassPatchMesh) {
      scene.remove(this.grassPatchMesh);
      this.grassPatchMesh.geometry.dispose();
      (this.grassPatchMesh.material as THREE.Material).dispose();
      this.grassPatchMesh = null;
    }
    if (this.treeTrunkMesh) {
      scene.remove(this.treeTrunkMesh);
      this.treeTrunkMesh.geometry.dispose();
      (this.treeTrunkMesh.material as THREE.Material).dispose();
      this.treeTrunkMesh = null;
    }
    if (this.treeLeavesMesh) {
      scene.remove(this.treeLeavesMesh);
      this.treeLeavesMesh.geometry.dispose();
      (this.treeLeavesMesh.material as THREE.Material).dispose();
      this.treeLeavesMesh = null;
    }
    if (this.wildFlowerMesh) {
      scene.remove(this.wildFlowerMesh);
      this.wildFlowerMesh.geometry.dispose();
      (this.wildFlowerMesh.material as THREE.Material).dispose();
      this.wildFlowerMesh = null;
    }
    if (this.smallRockMesh) {
      scene.remove(this.smallRockMesh);
      this.smallRockMesh.geometry.dispose();
      (this.smallRockMesh.material as THREE.Material).dispose();
      this.smallRockMesh = null;
    }
    if (this.mushroomMesh) {
      scene.remove(this.mushroomMesh);
      this.mushroomMesh.geometry.dispose();
      (this.mushroomMesh.material as THREE.Material).dispose();
      this.mushroomMesh = null;
    }
    if (this.fallingLeavesMesh) {
      scene.remove(this.fallingLeavesMesh);
      this.fallingLeavesMesh.geometry.dispose();
      (this.fallingLeavesMesh.material as THREE.Material).dispose();
      this.fallingLeavesMesh = null;
    }
    if (this.fireflies) {
      scene.remove(this.fireflies);
      this.fireflies.geometry.dispose();
      (this.fireflies.material as THREE.Material).dispose();
      this.fireflies = null;
    }
    this.butterflies.forEach(b => {
      scene.remove(b.group);
      b.wingLeft.geometry.dispose();
      (b.wingLeft.material as THREE.Material).dispose();
      b.wingRight.geometry.dispose();
      (b.wingRight.material as THREE.Material).dispose();
    });
    this.butterflies = [];
    this.birds.forEach(bird => {
      scene.remove(bird.group);
      bird.wingLeft.geometry.dispose();
      (bird.wingLeft.material as THREE.Material).dispose();
      bird.wingRight.geometry.dispose();
      (bird.wingRight.material as THREE.Material).dispose();
      bird.group.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    this.birds = [];
  }
}

/**
 * 8. GERENTE PRINCIPAL DE GRAFO DE ESCENA Y ENTITY LINKING (VISUAL_SCENE_GRAPH)
 * Centraliza la administración de nodos de visualización, object pooling global,
 * ordenamiento de render y LodUpdates.
 */
export class VisualSceneGraph {
  public nodes: Map<string, VisualNode> = new Map();
  public pool: RenderObjectPool = new RenderObjectPool();
  public instancedEnvironment: EnvironmentInstancedSystem = new EnvironmentInstancedSystem();
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public clearDynamicNodes() {
    const toRemove: string[] = [];
    this.nodes.forEach((node, id) => {
      // Keep main player alive to avoid needing to re-link completely.
      // Wait actually, relinking is fine if we dispose it properly, but better to keep it
      // if changeMap relinks it, we would get duplication if we didn't dispose.
      if (id === 'player_main') return;
      node.dispose();
      toRemove.push(id);
    });
    
    toRemove.forEach(id => this.nodes.delete(id));
  }

  public clearAll() {
    this.nodes.forEach(node => node.dispose());
    this.nodes.clear();
    this.pool.clearAll();
    this.instancedEnvironment.destroy(this.scene);
    CanvasPool.clearAll();
  }

  /**
   * Vincula una entidad de juego agregándola dinámicamente al Scene Graph corporativo.
   */
  public linkEntity(entity: Entity, equippedItems: EquippedItems, rendererRef: GameRenderer) {
    if (this.nodes.has(entity.id)) return;

    const group = new THREE.Group();
    const sprite = this.pool.getSprite();
    this.scene.add(group);

    const node = new EntitySpriteNode(entity, group, sprite, equippedItems, rendererRef, this.pool);
    this.nodes.set(entity.id, node);
  }

  /**
   * Desvincula una entidad retirando sus recursos hacia las piscinas de reciclaje.
   */
  public unlinkEntity(id: string) {
    const node = this.nodes.get(id) as EntitySpriteNode;
    if (node) {
      if (node.object3D instanceof THREE.Group) {
        this.scene.remove(node.object3D);
        // Will dispose in node.dispose()
      }
      node.dispose();
      this.nodes.delete(id);
    }
  }

  /**
   * Actualiza todos los nodos del scene-graph con su nivel de detalle correspondiente.
   */
  public updateGraph(dt: number, cameraPosition: THREE.Vector3, now: number, playerX?: number, playerZ?: number) {
    this.instancedEnvironment.updateParticles(dt);
    this.nodes.forEach(node => {
      if (node instanceof EntitySpriteNode) {
        node.playerX = playerX;
        node.playerZ = playerZ;
      }
      node.update(dt, cameraPosition, now);
    });
  }
}
