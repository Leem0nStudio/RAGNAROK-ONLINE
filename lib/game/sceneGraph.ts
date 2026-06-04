import * as THREE from 'three';
import { Entity, GroundItem, Projectile, EquippedItems } from './types';
import { GameRenderer } from './renderer';
import { RockObstacle } from './characterController';

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
      shadowSide: THREE.DoubleSide,
      alphaTest: 0.5
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
    newTex.minFilter = THREE.NearestMipmapNearestFilter;
    newTex.magFilter = THREE.NearestFilter;
    newTex.generateMipmaps = true;
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
  private auraSprite: THREE.Sprite | null = null;

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
      tex.minFilter = THREE.NearestFilter;
      tex.magFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      const nameMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
      const nameSprite = new THREE.Sprite(nameMat);
      nameSprite.scale.set(3, 0.75, 1);
      nameSprite.position.set(0, 3.2, 0);
      
      this.rootGroup.add(nameSprite);
      
      // We store it in auraSprite just to reuse the variable for disposal
      this.auraSprite = nameSprite;
      
      // Little vertical bounce will be added in onUpdate
    }
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
    if (this.ringMesh) {
      this.ringMesh.rotation.z += dt * 0.5;
    }
    if (this.auraSprite) {
      if (this.entity.type === 'npc') {
         this.auraSprite.position.y = 3.2 + Math.sin(now * 0.003) * 0.1;
      } else {
         this.auraSprite.material.opacity = 0.4 + Math.sin(now * 0.003) * 0.15;
      }
    }
    // We adjust sprite position inside group for bobbing
    this.sprite.position.y = (this.entity.type === 'boss_mvp' ? 2.0 : 0.9);

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
    if (this.auraSprite) {
      (this.auraSprite.material as THREE.SpriteMaterial).map?.dispose();
      (this.auraSprite.material as THREE.Material).dispose();
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
 * 7. GERENTE PRINCIPAL DE GRAFO DE ESCENA Y ENTITY LINKING (VISUAL_SCENE_GRAPH)
 * Centraliza la administración de nodos de visualización, object pooling global,
 * ordenamiento de render y LodUpdates.
 */
export class VisualSceneGraph {
  public nodes: Map<string, VisualNode> = new Map();
  public pool: RenderObjectPool = new RenderObjectPool();
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public clearAll() {
    this.nodes.forEach(node => node.dispose());
    this.nodes.clear();
    this.pool.clearAll();
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
      }
      node.dispose();
      this.nodes.delete(id);
    }
  }

  /**
   * Actualiza todos los nodos del scene-graph con su nivel de detalle correspondiente.
   */
  public updateGraph(dt: number, cameraPosition: THREE.Vector3, now: number) {
    this.nodes.forEach(node => {
      node.update(dt, cameraPosition, now);
    });
  }
}
