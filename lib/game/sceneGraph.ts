import * as THREE from 'three';
import { Entity, GroundItem, Projectile, HeadgearId } from './types';
import { GameRenderer } from './renderer';

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
  private headgear: HeadgearId;
  private pool: RenderObjectPool;

  constructor(entity: Entity, sprite: THREE.Sprite, headgear: HeadgearId, rendererRef: GameRenderer, pool: RenderObjectPool) {
    super(entity.id, sprite);
    this.entity = entity;
    this.headgear = headgear;
    this.rendererRef = rendererRef;
    this.pool = pool;

    // Escalamientos proporcionales iniciales
    const isBoss = entity.type === 'boss_mvp';
    const scaleFactor = isBoss ? 4.9 : (entity.mobType === 'pecopeco' ? 2.5 : (entity.mobType ? 1.8 : 2.5));
    sprite.scale.set(scaleFactor, scaleFactor, 1);
  }

  protected onUpdate(dt: number, now: number, updateVisuals: boolean): void {
    const sprite = this.object3D as THREE.Sprite;

    // Sincronizar posición 3D real
    sprite.position.set(
      this.entity.x,
      this.entity.y + (this.entity.type === 'boss_mvp' ? 2.0 : 0.9),
      this.entity.z
    );

    // Actualizar textura de manera controlada/throttled
    if (updateVisuals) {
      let currentHeadgear = this.headgear;
      if (this.entity.type === 'player') {
        try {
          const { useGameStore } = require('./state');
          currentHeadgear = useGameStore.getState().headgear;
        } catch (e) {
          // fallback if require is not available in typescript bundlers
        }
      }

      const tex = this.rendererRef.createEntityTexture(this.entity, currentHeadgear);
      if (tex) {
        // Aprovechar reciclado de texturas de Three.js
        if (sprite.material.map) {
          this.pool.releaseTexture(sprite.material.map as THREE.CanvasTexture);
        }
        sprite.material.map = tex;
        sprite.material.needsUpdate = true;
      }
    }
  }

  protected onDispose(): void {
    const sprite = this.object3D as THREE.Sprite;
    if (sprite.material) {
      this.pool.releaseSpriteMaterial(sprite.material);
    }
    this.pool.releaseSprite(sprite);
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

  constructor() {}

  public spawnInstancedRocks(scene: THREE.Scene, rockCount: number = 25) {
    // Definir la geometría y material común para las rocas
    const colGeo = new THREE.CylinderGeometry(0.5, 0.6, 1, 8);
    const colMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Slate Columns color
      roughness: 0.8
    });

    // Crear InstancedMesh única
    this.instancedMesh = new THREE.InstancedMesh(colGeo, colMat, rockCount);
    this.instancedMesh.castShadow = true;
    this.instancedMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < rockCount; i++) {
      // Ubicaciones pseudoaleatorias repetibles
      let rx = (Math.sin(i * 123.4) * 0.5 + 0.5) * 140 - 70;
      let rz = (Math.cos(i * 567.8) * 0.5 + 0.5) * 140 - 70;
      
      // Evitar spawneo encima de portal de spawn (0,0)
      if (Math.abs(rx) < 8 && Math.abs(rz) < 8) {
        rx += 12;
        rz += 12;
      }

      const h = 2.4 + (Math.sin(i * 99) * 0.5 + 0.5) * 4.2; // Altura variable del pilar

      dummy.position.set(rx, h / 2, rz);
      dummy.scale.set(1.0 + Math.sin(i) * 0.2, h, 1.0 + Math.cos(i) * 0.2);
      dummy.rotation.set((Math.sin(i * 10) * 0.08), (Math.cos(i) * 3), (Math.sin(i) * 0.08));
      
      dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, dummy.matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    scene.add(this.instancedMesh);
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
  public linkEntity(entity: Entity, headgear: HeadgearId, rendererRef: GameRenderer) {
    if (this.nodes.has(entity.id)) return;

    const sprite = this.pool.getSprite();
    this.scene.add(sprite);

    const node = new EntitySpriteNode(entity, sprite, headgear, rendererRef, this.pool);
    this.nodes.set(entity.id, node);
  }

  /**
   * Desvincula una entidad retirando sus recursos hacia las piscinas de reciclaje.
   */
  public unlinkEntity(id: string) {
    const node = this.nodes.get(id);
    if (node) {
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
