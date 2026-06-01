import * as THREE from 'three';
import { Entity, GroundItem, Projectile, EquippedItems } from './types';
import { GameRenderer } from './renderer';
import { getRockObstacles } from './characterController';

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
      tex.minFilter = THREE.LinearFilter;
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
 * 7. HIGH-PERFORMANCE STATIC DECORATION INSTANCING SYSTEM
 * Consolida múltiples elementos idénticos (como columnas de rocas, vegetación, escombros)
 * en un solo draw call con THREE.InstancedMesh.
 * Reduce dramáticamente el overhead del driver gráfico, incrementando severamente los FPS en celulares.
 */
export class EnvironmentInstancedSystem {
  private instancedMesh: THREE.InstancedMesh | null = null;
  private grassMesh: THREE.InstancedMesh | null = null;
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

  constructor() {}

  public spawnInstancedRocks(scene: THREE.Scene, rockCount: number = 25) {
    // Get synchronized obstacles coordinates from character controller
    const rocks = getRockObstacles();
    const count = rocks.length;

    // Define geography geometry and premium material styling
    const colGeo = new THREE.CylinderGeometry(0.5, 0.6, 1, 8);
    const colMat = new THREE.MeshStandardMaterial({
      color: 0x4c566a, // Slate Rock Columns grey (matching Nordic theme)
      roughness: 0.82
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

      dummy.position.set(rock.x, h / 2, rock.z);
      dummy.scale.set(radius, h, radius);
      
      // Slight tilting rotations to make ruins look worn-out and ancient!
      dummy.rotation.set(
        Math.sin(i * 12.3) * 0.062,
        Math.cos(i * 45.6) * 3.1415,
        Math.sin(i * 34.5) * 0.062
      );
      
      dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, dummy.matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    scene.add(this.instancedMesh);

    this.spawnFoliageAndDebris(scene);
    this.spawnEnvironmentalProps(scene, rocks);
    this.spawnTrees(scene);
    this.spawnAtmosphericDust(scene);
  }

  private spawnTrees(scene: THREE.Scene) {
    const treeCount = 120; // High density forest border
    
    // Pine tree trunk
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 3, 5);
    trunkGeo.translate(0, 1.5, 0);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9, flatShading: true });
    this.treeTrunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    this.treeTrunkMesh.castShadow = true;
    this.treeTrunkMesh.receiveShadow = true;

    // Pine tree leaves (cone)
    const leavesGeo = new THREE.ConeGeometry(2, 5, 5);
    leavesGeo.translate(0, 4.5, 0);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.8, flatShading: true });
    this.treeLeavesMesh = new THREE.InstancedMesh(leavesGeo, leavesMat, treeCount);
    this.treeLeavesMesh.castShadow = true;
    this.treeLeavesMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();

    for(let i=0; i<treeCount; i++) {
        // Place trees mostly around the outer ring to frame the scene
        const angle = Math.random() * Math.PI * 2;
        // Inner radius 20, outer 70 (so they enclose the arena)
        const radius = 22 + Math.sqrt(Math.random()) * 50; 
        
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        const scale = 0.8 + Math.random() * 0.7; // Variable heights
        
        dummy.position.set(x, 0, z);
        dummy.rotation.set(
            (Math.random()-0.5)*0.1, 
            Math.random()*Math.PI*2, 
            (Math.random()-0.5)*0.1
        );
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();

        this.treeTrunkMesh.setMatrixAt(i, dummy.matrix);
        
        // Slightly wiggle the leaves independent of trunk but same pos
        dummy.position.set(x, 0, z);
        dummy.scale.set(scale, scale* (0.9 + Math.random()*0.3), scale);
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

  public updateParticles() {
      if (!this.dustParticles || !this.dustInitialY) return;
      
      const time = this.clock.getElapsedTime();
      const positions = this.dustParticles.geometry.attributes.position.array as Float32Array;
      
      for(let i=0; i<positions.length/3; i++) {
          const ix = i*3;
          const iy = i*3 + 1;
          const iz = i*3 + 2;
          
          // Slow rise and fall 
          positions[iy] = this.dustInitialY[i] + Math.sin(time * 0.5 + i) * 1.5;
          // Very slight horizontal drift
          positions[ix] += Math.cos(time * 0.2 + i) * 0.01;
          positions[iz] += Math.sin(time * 0.3 + i) * 0.01;
          
          // Wrap around if drifted too far out of typical view
          if(positions[ix] > 40) positions[ix] = -40;
          if(positions[ix] < -40) positions[ix] = 40;
          if(positions[iz] > 40) positions[iz] = -40;
          if(positions[iz] < -40) positions[iz] = 40;
      }
      this.dustParticles.geometry.attributes.position.needsUpdate = true;
  }

  private spawnEnvironmentalProps(scene: THREE.Scene, rocks: any[]) {
    const crateCount = 65;
    const barrelCount = 45;

    // Crates - Weathered wood
    const crateGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const crateMat = new THREE.MeshStandardMaterial({
      color: 0x8b7355, // Weathered wood
      roughness: 0.95,
      flatShading: true
    });
    this.propsMesh = new THREE.InstancedMesh(crateGeo, crateMat, crateCount);
    this.propsMesh.castShadow = true;
    this.propsMesh.receiveShadow = true;

    // Barrels
    const barrelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.9, 8);
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x5c4033, // Darker wood
      roughness: 0.85,
      flatShading: true
    });
    this.barrelMesh = new THREE.InstancedMesh(barrelGeo, barrelMat, barrelCount);
    this.barrelMesh.castShadow = true;
    this.barrelMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const dummyBoard = new THREE.Object3D();

    const signpostCount = 18;
    
    // Signboard
    const boardGeo = new THREE.BoxGeometry(0.9, 0.35, 0.08);
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.95 });
    this.signBoardMesh = new THREE.InstancedMesh(boardGeo, boardMat, signpostCount);
    this.signBoardMesh.castShadow = true;
    this.signBoardMesh.receiveShadow = true;

    // Signpost pole
    const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.4, 5);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x4a3b2c, roughness: 0.9 });
    this.signPoleMesh = new THREE.InstancedMesh(poleGeo, poleMat, signpostCount);
    this.signPoleMesh.castShadow = true;
    this.signPoleMesh.receiveShadow = true;

    const placedProps: {x: number, z: number, radius: number}[] = [];

    // Density-based placement heuristic
    const getPointNearRock = (propRadius: number): {x: number, z: number} | null => {
      if (rocks.length === 0) return {x: (Math.random()-0.5)*100, z: (Math.random()-0.5)*100};
      
      for (let attempts = 0; attempts < 15; attempts++) {
        // Weight selection: tend to pick rocks closer to center/earlier in list
        const rockIdx = Math.floor(Math.pow(Math.random(), 1.5) * rocks.length);
        const rock = rocks[rockIdx];
        
        const angle = Math.random() * Math.PI * 2;
        // Clustering: place near the rock, but allow slight spread
        const distance = rock.radius + propRadius + 0.1 + Math.random() * 1.8; 
        
        const candidateX = rock.x + Math.cos(angle) * distance;
        const candidateZ = rock.z + Math.sin(angle) * distance;
        
        // Keep clear of central plaza
        if (Math.sqrt(candidateX*candidateX + candidateZ*candidateZ) < 18) continue;
        
        // Prevent clipping with any rock
        let collidesWithRock = false;
        for (const r of rocks) {
            const dx = candidateX - r.x;
            const dz = candidateZ - r.z;
            const dist = Math.sqrt(dx*dx + dz*dz);
            if (dist < r.radius + propRadius - 0.15) { // tiny intersection allowed for blending
                collidesWithRock = true;
                break;
            }
        }
        if (collidesWithRock) continue;
        
        // Prevent clipping with other props
        let collidesWithProp = false;
        for (const p of placedProps) {
            const dx = candidateX - p.x;
            const dz = candidateZ - p.z;
            const dist = Math.sqrt(dx*dx + dz*dz);
            if (dist < p.radius + propRadius + 0.1) {
                collidesWithProp = true;
                break;
            }
        }
        if (collidesWithProp) continue;
        
        // Valid spot
        placedProps.push({x: candidateX, z: candidateZ, radius: propRadius});
        return {x: candidateX, z: candidateZ};
      }
      return null;
    };

    // Hide a matrix instance by scaling it to 0
    const hideMatrix = (mesh: THREE.InstancedMesh, index: number) => {
        dummy.scale.set(0,0,0);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
    };

    // Spawn crates
    let actualCrates = 0;
    for (let i = 0; i < crateCount; i++) {
        const scale = 0.7 + Math.random() * 0.5;
        const pt = getPointNearRock(0.4 * scale);
        if (!pt) {
            hideMatrix(this.propsMesh, i);
            continue;
        }
        actualCrates++;
        dummy.position.set(pt.x, scale * 0.4, pt.z); // sit on ground
        dummy.rotation.set(
            (Math.random() - 0.5) * 0.15, // slight tilt
            Math.random() * Math.PI * 2, 
            (Math.random() - 0.5) * 0.15
        );
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        this.propsMesh.setMatrixAt(i, dummy.matrix);
    }
    this.propsMesh.count = actualCrates;

    // Spawn barrels
    let actualBarrels = 0;
    for (let i = 0; i < barrelCount; i++) {
        const scale = 0.8 + Math.random() * 0.3;
        const pt = getPointNearRock(0.35 * scale);
        if (!pt) {
            hideMatrix(this.barrelMesh, i);
            continue;
        }
        actualBarrels++;
        const isFallen = Math.random() > 0.65; // 35% chance to be fallen
        dummy.position.set(pt.x, isFallen ? scale * 0.35 : scale * 0.45, pt.z); 
        dummy.rotation.set(
            isFallen ? Math.PI / 2 : (Math.random() - 0.5) * 0.05, 
            Math.random() * Math.PI * 2, 
            isFallen ? Math.random() * Math.PI : 0
        );
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        this.barrelMesh.setMatrixAt(i, dummy.matrix);
    }
    this.barrelMesh.count = actualBarrels;

    // Spawn signposts
    let actualSigns = 0;
    for (let i = 0; i < signpostCount; i++) {
        const pt = getPointNearRock(0.6); // larger footprint for signposts
        if (!pt) {
            hideMatrix(this.signPoleMesh, i);
            hideMatrix(this.signBoardMesh, i);
            continue;
        }
        actualSigns++;
        const baseRotationY = Math.random() * Math.PI * 2;
        const tilt = (Math.random() - 0.5) * 0.2;
        
        // Pole
        dummy.position.set(pt.x, 0.7, pt.z);
        dummy.rotation.set(tilt, baseRotationY, tilt);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        this.signPoleMesh.setMatrixAt(i, dummy.matrix);

        // Board
        dummyBoard.position.set(pt.x, 1.1, pt.z); // Top of the pole
        const boardTiltY = baseRotationY + (Math.random() - 0.5) * 0.3; // Board can be slightly crooked
        const boardTiltZ = (Math.random() - 0.5) * 0.15;
        // Adjust board position relative to the root considering the tilt
        dummyBoard.position.add(new THREE.Vector3(
          Math.sin(boardTiltY) * 0.05, 
          0, 
          Math.cos(boardTiltY) * 0.05
        ));
        dummyBoard.rotation.set(tilt, boardTiltY, tilt + boardTiltZ);
        dummyBoard.scale.set(1, 1, 1);
        dummyBoard.updateMatrix();
        this.signBoardMesh.setMatrixAt(i, dummyBoard.matrix);
    }
    this.signPoleMesh.count = actualSigns;
    this.signBoardMesh.count = actualSigns;

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
    const count = 150;
    // CAPA 3: VEGETACIÓN (Arbustos y hierbajos)
    // Low poly foliage/bushes geometry
    const bushGeo = new THREE.DodecahedronGeometry(0.7, 0); 
    const bushMat = new THREE.MeshStandardMaterial({ 
      color: 0x245a3a, // Deep forest green
      roughness: 0.9,
      flatShading: true
    });

    this.grassMesh = new THREE.InstancedMesh(bushGeo, bushMat, count);
    this.grassMesh.castShadow = true;
    this.grassMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    
    // Seeded random placement scatter algorithm for bushes
    let placed = 0;
    while (placed < count) {
      // Scatter over a roughly 100x100 area
      const x = (Math.random() - 0.5) * 120;
      const z = (Math.random() - 0.5) * 120;
      
      // Keep clear of the exact center plaza spawn (Radius 18)
      if (Math.sqrt(x*x + z*z) < 18) continue;
      
      const scale = 0.4 + Math.random() * 0.6;
      
      // Sink slightly into the ground
      dummy.position.set(x, scale * 0.4, z);
      dummy.rotation.set(
        Math.random() * Math.PI, 
        Math.random() * Math.PI, 
        Math.random() * Math.PI
      );
      dummy.scale.set(scale, scale * 0.8, scale);
      
      dummy.updateMatrix();
      this.grassMesh.setMatrixAt(placed, dummy.matrix);
      placed++;
    }

    this.grassMesh.instanceMatrix.needsUpdate = true;
    scene.add(this.grassMesh);

    // Pequeños mechones de hierba (Hierba alta rala para añadir textura al suelo)
    const grassCount = 350;
    const patchGeo = new THREE.ConeGeometry(0.3, 1.2, 3);
    patchGeo.translate(0, 0.6, 0); // Origin at the bottom
    const patchMat = new THREE.MeshStandardMaterial({
      color: 0x2e6b45, // Lighter green mixed with base
      roughness: 0.9,
      flatShading: true
    });
    this.grassPatchMesh = new THREE.InstancedMesh(patchGeo, patchMat, grassCount);
    this.grassPatchMesh.receiveShadow = true;
    
    for(let i = 0; i < grassCount; i++) {
        const x = (Math.random() - 0.5) * 130;
        const z = (Math.random() - 0.5) * 130;
        
        if (Math.sqrt(x*x + z*z) < 18) continue;

        const scale = 0.5 + Math.random() * 0.8;
        dummy.position.set(x, 0, z);
        dummy.rotation.set((Math.random()-0.5)*0.3, Math.random()*Math.PI*2, (Math.random()-0.5)*0.3);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        this.grassPatchMesh.setMatrixAt(i, dummy.matrix);
    }
    this.grassPatchMesh.instanceMatrix.needsUpdate = true;
    scene.add(this.grassPatchMesh);
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
  public updateGraph(dt: number, cameraPosition: THREE.Vector3, now: number) {
    this.instancedEnvironment.updateParticles();
    this.nodes.forEach(node => {
      node.update(dt, cameraPosition, now);
    });
  }
}
