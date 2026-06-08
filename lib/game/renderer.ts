import * as THREE from 'three';
import { Entity, GroundItem, TouchIndicator, HeadgearId, VFXEffect, EquippedItems, StatusEffect } from './types';
import { AnimationStateMachine } from './animationStateMachine';
import { CanvasPool } from './sceneGraph';
import { useGameStore } from './state';

const imageCache: Record<string, HTMLImageElement> = {};
const imageLoadingStatus: Record<string, 'loading' | 'loaded' | 'failed'> = {};

function getOrLoadCachedImage(url: string): HTMLImageElement | null {
  if (typeof window === 'undefined') {
    return null;
  }
  if (imageLoadingStatus[url] === 'loaded') {
    return imageCache[url];
  }
  if (imageLoadingStatus[url] === 'loading' || imageLoadingStatus[url] === 'failed') {
    return null;
  }

  imageLoadingStatus[url] = 'loading';
  const img = new window.Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  img.onload = () => {
    imageCache[url] = img;
    imageLoadingStatus[url] = 'loaded';
  };
  img.onerror = () => {
    if (url.includes('jsdelivr.net')) {
      const fallbackUrl = 'https://raw.githubusercontent.com/Leem0nStudio/Epic-Front/main/public/assets/sprites/sprite_acolyte_idle_64.png';
      const fbImg = new window.Image();
      fbImg.crossOrigin = 'anonymous';
      fbImg.src = fallbackUrl;
      fbImg.onload = () => {
        imageCache[url] = fbImg;
        imageLoadingStatus[url] = 'loaded';
      };
      fbImg.onerror = () => {
        imageLoadingStatus[url] = 'failed';
      };
    } else {
      imageLoadingStatus[url] = 'failed';
    }
  };
  return null;
}

// Helper to calculate terrain elevation height in 3D world space (used for terrain geometry, trees, props and characters)
export function getTerrainHeight(x: number, z: number): number {
  const mapName = useGameStore.getState().currentMap || 'prontera';
  const dist = Math.sqrt(x * x + z * z);
  
  if (mapName === 'prontera') {
    // Large city center, walls at radius ~85
    // Create gate openings on main roads (X and Z axes)
    const isMainRoad = Math.abs(x) < 12 || Math.abs(z) < 12;
    
    if (dist < 80) return 0.2;
    if (dist >= 80 && dist < 90 && !isMainRoad) return 0.2 + (dist - 80) * 0.8; // City wall rise
    
    // Road level or outside wall
    return (Math.sin(x * 0.08) * Math.cos(z * 0.08)) * 0.4 + 0.8;
  }
  
  // Field maps designs
  let height = 0;


  if (mapName === 'prt_fild01') {
    // Spring: Rolling hills
    height = (Math.sin(x * 0.1) * Math.cos(z * 0.1)) * 1.2 + (Math.sin(x * 0.05) * Math.cos(z * 0.05)) * 0.5;
    
    // Dungeon Exit Platform Physics Alignment
    const platDx = x - 0;
    const platDz = z - (-45);
    const platDist = Math.sqrt(platDx * platDx + platDz * platDz);
    if (Math.abs(platDx) < 5.5 && Math.abs(platDz) < 5.5) {
      height = Math.max(height, 2.0); // Platform height
    } else if (Math.abs(platDx) < 5.5 && platDz > -39.5 && platDz < -35) {
      // Stair rise (z from -39.5 to -35)
      const t = 1.0 - (platDz - (-39.5)) / 4.5;
      height = Math.max(height, t * 2.0);
    }
  } else if (mapName === 'prt_fild02') {
    // Autumn: Flat with plateau
    height = (Math.sin(x * 0.05) * Math.cos(z * 0.05)) * 0.4;
    const plateauDx = x - 20;
    const plateauDz = z - 20;
    const plateauDist = Math.sqrt(plateauDx * plateauDx + plateauDz * plateauDz);
    if (plateauDist < 15) {
      height += Math.max(0, (15 - plateauDist) / 15) * 4;
    }
  } else if (mapName === 'prt_fild03') {
    // Forest: Dense small humps
    height = (Math.sin(x * 0.3) * Math.sin(z * 0.3)) * 0.8 + (Math.cos(x * 0.1) * Math.cos(z * 0.1)) * 1.0;
  } else if (mapName === 'prt_fild04') {
    // Highlands: Sharp ridges
    height = (Math.sin(x * 0.1) * Math.cos(z * 0.1)) * 1.5;
    const bossDx = x - 30;
    const bossDz = z - (-30);
    const bossDist = Math.sqrt(bossDx * bossDx + bossDz * bossDz);
    if (bossDist < 20) {
      const factor = Math.max(0, (20 - bossDist) / 20);
      height += Math.pow(factor, 2) * 5; // Boss arena rise
    }
    } else if (mapName === 'prt_maze01') {
    // Dungeon: Payon Cave Style (Rooms and narrow corridors)
    const centerDist = Math.sqrt(x * x + z * z);
    
    // Room logic: Centers and corners
    const roomRadius = 12;
    const roomC = roomRadius - centerDist;
    const roomNW = roomRadius - Math.sqrt((x + 35)**2 + (z - 35)**2);
    const roomNE = roomRadius - Math.sqrt((x - 35)**2 + (z - 35)**2);
    const roomSW = roomRadius - Math.sqrt((x + 35)**2 + (z + 35)**2);
    const roomSE = roomRadius - Math.sqrt((x - 35)**2 + (z + 35)**2);
    
    // Narrow Corridors (Inner cross + outer ring)
    const innerCross = Math.min(Math.abs(x), Math.abs(z)) < 3.5 && Math.abs(x) < 45 && Math.abs(z) < 45;
    const outerRing = Math.abs(Math.max(Math.abs(x), Math.abs(z)) - 35) < 3.5 && Math.abs(x) < 45 && Math.abs(z) < 45;
    
    // Wall Noise for organic feel
    const wallNoise = (Math.sin(x * 0.6) * Math.cos(z * 0.6)) * 2.5;
    
    const onFloor = Math.max(roomC, roomNW, roomNE, roomSW, roomSE, 
                             innerCross ? 1 : -1, 
                             outerRing ? 1 : -1);
    
    if (onFloor + wallNoise * 0.15 > 0) {
      // Floor (Slightly uneven cave ground)
      height = 0.1 + (Math.sin(x * 1.5) * Math.cos(z * 1.5)) * 0.05;
    } else {
      // Walls: Lowered to 3.8m for maximum visibility while keeping cavern feel
      height = 3.8 + wallNoise;
    }
  }

  // Common boundary mountains (radius based on map type)
  const mountainLimit = mapName === 'prontera' ? 90.0 : 42.0;
  if (dist > mountainLimit) {
    const edgeFactor = (dist - mountainLimit);
    const mountainRise = edgeFactor * 3.0;
    const cragNoise = (Math.sin(x * 0.4) * Math.cos(z * 0.4)) * 2.0;
    height = THREE.MathUtils.lerp(height, mountainRise + cragNoise, Math.min(1.0, (dist - mountainLimit) / 6.0));
  }
  
  // Smooth spawn
  if (dist < 12.0) {
    const t = dist / 12.0;
    height = THREE.MathUtils.lerp(0.05, height, Math.pow(t, 2));
  }
  
  return height;
}

/**
 * Robust Walkability / Collision Detection System
 * Checks if a given coordinate is safely navigable for players and entities.
 * Includes height-based checks, boundary enclosures, and object collision.
 */
export function isPositionWalkable(x: number, z: number): boolean {
  const mapName = useGameStore.getState().currentMap || 'prontera';
  const h = getTerrainHeight(x, z);
  const distSq = x * x + z * z;
  const dist = Math.sqrt(distSq);

  // 1. Map Global Boundaries (Radius clamping)
  const mountainLimit = mapName === 'prontera' ? 88.0 : 45.0;
  if (dist > mountainLimit) return false;

  // 2. Map-Specific Walkability Constraints
  if (mapName === 'prt_maze01') {
    // Dungeon Obstacles: walls are h > 1.2 (slightly more relaxed floor)
    if (h > 1.2) return false;
    // Outer boundary for maze
    if (Math.abs(x) > 52 || Math.abs(z) > 52) return false;
    return true;
  }

  if (mapName === 'prontera') {
    // Prontera Fountain / Central Plaza (radius 6.5m)
    if (dist < 6.5) return false;

    // Pedestal checks
    if (dist < 2.5) return false;

    // Gate/House logic
    // Kafra Area (approx 12, -45)
    if (Math.abs(x - 12) < 3.5 && Math.abs(z - (-45)) < 3.5) return false;
    // Training Instructor (-15, 20)
    if (Math.abs(x - (-15)) < 3.5 && Math.abs(z - 20) < 3.5) return false;
  }

  // 3. Field Terrain Slope/Height Limits
  // Block climbing too high on boundary hills
  if (h > 5.5) return false;

  return true;
}

export class GameRenderer {
  private scene: THREE.Scene;
  private vfxInstances: VFXEffect[] = [];

  // High-performance raycasting members cached to prevent GC overhead
  private _raycaster = new THREE.Raycaster();
  private _rayOrigin = new THREE.Vector3();
  private _rayDir = new THREE.Vector3(0, -1, 0);

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public mapMeshes: THREE.Object3D[] = [];

  public clearGroundMap() {
    this.mapMeshes.forEach(mesh => {
      this.scene.remove(mesh);
      if ((mesh as any).geometry) (mesh as any).geometry.dispose();
      if ((mesh as any).material) {
        if (Array.isArray((mesh as any).material)) {
          (mesh as any).material.forEach((m: any) => m.dispose());
        } else {
          (mesh as any).material.dispose();
        }
      }
    });
    this.mapMeshes = [];
    (this as any)._plazaCrystal = undefined;
    (this as any)._dungeonPortal = undefined;
    (this as any)._dungeonPortalCore = undefined;
  }

  /**
   * HIGH-PRECISION RAYCASTING-BASED HEIGHT QUERY
   * Casts a ray downwards to determine the exact Y height of the active scene walkable meshes.
   */
  public getRaycastHeight(x: number, z: number): number | null {
    if (!this.mapMeshes || this.mapMeshes.length === 0) return null;

    // Fast-filter the map meshes down to tagged walkable surface structures
    const walkableMeshes = this.mapMeshes.filter(m => (m as any).isWalkableSurface);
    if (walkableMeshes.length === 0) return null;

    // Trace down from high above
    this._rayOrigin.set(x, 150, z);
    this._raycaster.set(this._rayOrigin, this._rayDir);

    const intersects = this._raycaster.intersectObjects(walkableMeshes, true);
    if (intersects.length > 0) {
      return intersects[0].point.y;
    }

    return null;
  }

  createGroundMap() {
    this.clearGroundMap();
    const mapName = useGameStore.getState().currentMap || 'prontera';
    
    // Scale plane based on map size
    const size = mapName === 'prontera' ? 300 : 200;
    const segments = mapName === 'prontera' ? 150 : 100;
    const groundGeo = new THREE.PlaneGeometry(size, size, segments, segments);
    
    const pos = groundGeo.attributes.position;
    const colors = [];
    
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const zPlane = pos.getY(i);
      const distFromCenter = Math.sqrt(x * x + zPlane * zPlane);
      
      const height = getTerrainHeight(x, zPlane);
      pos.setZ(i, height);

      let r, g, b;

      // Map-specific color palettes
      if (mapName === 'prontera') {
        // City colors: Cobblestones and paths
        const isRoad = Math.abs(x) < 8 || Math.abs(zPlane) < 8;
        if (isRoad) {
          r = 0.35; g = 0.35; b = 0.38; // Clean stone road
        } else {
          r = 0.25; g = 0.4; b = 0.22; // City grass
        }
        
        // Cobblestone detail
        const noise = Math.sin(x * 1) * Math.cos(zPlane * 1);
        if (isRoad && noise > 0) {
          r += 0.05; g += 0.05; b += 0.05;
        }

      } else if (mapName === 'prt_fild01') {
        // Spring: Lush green
        r = 0.2 + Math.sin(x * 0.2) * 0.05;
        g = 0.5 + Math.cos(zPlane * 0.2) * 0.08;
        b = 0.2 + Math.sin(zPlane * 0.1) * 0.03;
        
        // Flower patches
        if (Math.sin(x * 0.8) * Math.cos(zPlane * 0.8) > 0.8) {
          r = 0.9; g = 0.8; b = 0.3; // Yellow flowers
        }
      } else if (mapName === 'prt_fild02') {
        // Autumn: Golden/Dry
        r = 0.5 + Math.sin(x * 0.1) * 0.05;
        g = 0.42 + Math.cos(zPlane * 0.1) * 0.05;
        b = 0.2;
      } else if (mapName === 'prt_fild03') {
        // Forest: Dark damp green
        r = 0.12;
        g = 0.28 + Math.sin(x * 0.15) * 0.05;
        b = 0.15;
      } else if (mapName === 'prt_fild04') {
        // Highlands: Rocky gray-green
        r = 0.35 + Math.sin(x * 0.3) * 0.02;
        g = 0.38 + Math.cos(zPlane * 0.3) * 0.02;
        b = 0.32;
        
        // Boss arena plateau color
        const bossDx = x - 30;
        const bossDz = zPlane - (-30);
        const bossDist = Math.sqrt(bossDx * bossDx + bossDz * bossDz);
        if (bossDist < 18) {
          r = 0.25; g = 0.25; b = 0.28; // Dark gray stone
          if (bossDist < 15 && Math.sin(x * 0.8) * Math.cos(zPlane * 0.8) > 0) {
             r = 0.2; g = 0.2; b = 0.22;
          }
        }
      } else if (mapName === 'prt_maze01') {
        // Payon Cave: Deep Blue-Gray Rock
        const isWall = height > 1.0;
        if (isWall) {
          // Craggy blue-tinted cave walls
          const wallNoise = Math.sin(x * 1.2) * Math.cos(zPlane * 1.2);
          r = 0.06 + wallNoise * 0.01; 
          g = 0.07 + wallNoise * 0.01; 
          b = 0.12 + wallNoise * 0.02;
        } else {
          r = 0.12; g = 0.13; b = 0.18; // Damp stone floor
          const dampness = Math.sin(x * 3.0) * Math.cos(zPlane * 3.0);
          if (dampness > 0.6) {
            r += 0.02; g += 0.02; b += 0.04; // Damp reflection spots
          }
          if (Math.sin(x * 0.5) * Math.cos(zPlane * 0.5) > 0.6) {
            r = 0.08; g = 0.08; b = 0.12; // Cracks
          }
        }
      } else {
        r = 0.2; g = 0.4; b = 0.2;
      }

      // Border mountains
      if (distFromCenter > 42.0 && mapName !== 'prontera') {
        const factor = Math.min(1.0, (distFromCenter - 42.0) / 10.0);
        r = THREE.MathUtils.lerp(r, 0.3, factor);
        g = THREE.MathUtils.lerp(g, 0.32, factor);
        b = THREE.MathUtils.lerp(b, 0.35, factor);
      } else if (distFromCenter > 80 && mapName === 'prontera') {
        const factor = Math.min(1.0, (distFromCenter - 80) / 10.0);
        r = THREE.MathUtils.lerp(r, 0.4, factor);
        g = THREE.MathUtils.lerp(g, 0.4, factor);
        b = THREE.MathUtils.lerp(b, 0.42, factor);
      }

      colors.push(r, g, b);
    }
    
    groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    groundGeo.computeVertexNormals();
    
    const groundMat = new THREE.MeshStandardMaterial({
      roughness: mapName === 'prt_maze01' ? 0.6 : 0.9,
      metalness: mapName === 'prt_maze01' ? 0.1 : 0.0,
      vertexColors: true,
    });
    
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    (ground as any).isWalkableSurface = true;
    this.scene.add(ground);
    this.mapMeshes.push(ground);
    
    if (mapName === 'prontera') {
      // Scale Prontera portals
      const edge = 95.0;
      
      // Central decorations
      this.createPronteraDecorations();
    }
    
    this.createPortals(mapName);
    this.createEnvironmentDetails(mapName);
  }

  createEnvironmentDetails(mapName: string) {
    // Dungeon atmosphere
    if (mapName === 'prt_maze01') {
      const dLight = this.scene.children.find(c => c instanceof THREE.DirectionalLight) as THREE.DirectionalLight;
      if (dLight) dLight.intensity = 0.5;
      const aLight = this.scene.children.find(c => c instanceof THREE.AmbientLight) as THREE.AmbientLight;
      if (aLight) aLight.intensity = 0.3;
      this.scene.fog = new THREE.FogExp2(0x020617, 0.025);
      
      // Fixed Torches in dungeon (placed on corner islands)
      const torchLocs = [
          {x: 0, z: 12}, {x: 0, z: -12}, {x: 12, z: 0}, {x: -12, z: 0}, // Around center
          {x: -40, z: 50}, {x: -30, z: 40}, // TL island
          {x: 40, z: 50}, {x: 30, z: 40},   // TR island
          {x: -40, z: -50}, {x: -30, z: -40}, // BL island
          {x: 40, z: -50}, {x: 30, z: -40}    // BR island
      ];
      torchLocs.forEach(loc => {
          const torchGroup = new THREE.Group();
          const stickGeo = new THREE.BoxGeometry(0.3, 2, 0.3);
          const stickMat = new THREE.MeshStandardMaterial({ color: 0x451a03 });
          const stick = new THREE.Mesh(stickGeo, stickMat);
          stick.position.y = 1;
          torchGroup.add(stick);
          
          const flameGeo = new THREE.SphereGeometry(0.5, 8, 8);
          const flameMat = new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff0000, emissiveIntensity: 2.5 });
          const flame = new THREE.Mesh(flameGeo, flameMat);
          flame.position.y = 2.2;
          torchGroup.add(flame);
          
          const tLight = new THREE.PointLight(0xffa500, 3, 12);
          tLight.position.set(0, 2.5, 0);
          torchGroup.add(tLight);
          
          const groundH = getTerrainHeight(loc.x, loc.z);
          if (groundH > -5) {
            torchGroup.position.set(loc.x, groundH, loc.z);
            this.scene.add(torchGroup);
            this.mapMeshes.push(torchGroup);
          }
      });

      // Stalactites (hanging from the upper walls)
      const stalactiteMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.9, metalness: 0.2 });
      for (let i = 0; i < 40; i++) {
        const sx = (Math.random() - 0.5) * 110;
        const sz = (Math.random() - 0.5) * 110;
        const sh = getTerrainHeight(sx, sz);
        if (sh > 2.5) { // On wall sections
          const stalGroup = new THREE.Group();
          const count = 1 + Math.floor(Math.random() * 3);
          for (let j = 0; j < count; j++) {
            const coneGeo = new THREE.ConeGeometry(0.25 + Math.random() * 0.4, 1.2 + Math.random() * 1.5, 6);
            const cone = new THREE.Mesh(coneGeo, stalactiteMat);
            cone.rotation.x = Math.PI; // Point down
            cone.position.set((Math.random() - 0.5) * 2.5, 3.8, (Math.random() - 0.5) * 2.5);
            stalGroup.add(cone);
          }
          this.scene.add(stalGroup);
          this.mapMeshes.push(stalGroup);
          stalGroup.position.set(sx, 0, sz);
        }
      }

      // Ambient Dust Particles
      const particleCount = 200;
      const dustGeo = new THREE.BufferGeometry();
      const dustPos = [];
      for (let i = 0; i < particleCount; i++) {
        dustPos.push((Math.random() - 0.5) * 120, Math.random() * 8, (Math.random() - 0.5) * 120);
      }
      dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dustPos, 3));
      const dustMat = new THREE.PointsMaterial({
        color: 0x94a3b8,
        size: 0.15,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
      });
      const dustPoints = new THREE.Points(dustGeo, dustMat);
      this.scene.add(dustPoints);
      this.mapMeshes.push(dustPoints);
      (this as any)._dustParticles = dustPoints; // Store for animation
    } else {
      const dLight = this.scene.children.find(c => c instanceof THREE.DirectionalLight) as THREE.DirectionalLight;
      if (dLight) dLight.intensity = 1.0;
      const aLight = this.scene.children.find(c => c instanceof THREE.AmbientLight) as THREE.AmbientLight;
      if (aLight) aLight.intensity = 0.7;
      this.scene.fog = null;
    }

    if (mapName === 'prontera') {
      // Prontera Fountain
      const fountainGroup = new THREE.Group();
      fountainGroup.position.set(0, 0.2, 0);
      
      const basinGeo = new THREE.CylinderGeometry(8, 9, 1.2, 16);
      const basinMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
      const basin = new THREE.Mesh(basinGeo, basinMat);
      fountainGroup.add(basin);

      const waterGeo = new THREE.CircleGeometry(7.5, 16);
      const waterMat = new THREE.MeshStandardMaterial({ 
        color: 0x38bdf8, 
        transparent: true, 
        opacity: 0.6,
        metalness: 0.8,
        roughness: 0.1
      });
      const water = new THREE.Mesh(waterGeo, waterMat);
      water.rotation.x = -Math.PI / 2;
      water.position.y = 0.5;
      fountainGroup.add(water);

      const statueGeo = new THREE.CylinderGeometry(0.5, 0.8, 5, 8);
      const statueMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1 });
      const statue = new THREE.Mesh(statueGeo, statueMat);
      statue.position.y = 2.5;
      fountainGroup.add(statue);

      this.scene.add(fountainGroup);
      this.mapMeshes.push(fountainGroup);

      // Houses placeholders
      const houseGeo = new THREE.BoxGeometry(10, 8, 10);
      const houseMat = new THREE.MeshStandardMaterial({ color: 0x94716b });
      const roofGeo = new THREE.ConeGeometry(8, 6, 4);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x991b1b });

      const addHouse = (x: number, z: number, rotation = 0, isDungeon = false) => {
        const hGroup = new THREE.Group();
        
        // Custom branding for dungeon entrance
        const baseMat = isDungeon ? new THREE.MeshStandardMaterial({ color: 0x4c1d95, emissive: 0x2e1065, emissiveIntensity: 0.2 }) : houseMat;
        const topMat = isDungeon ? new THREE.MeshStandardMaterial({ color: 0x1e1b4b }) : roofMat;

        const base = new THREE.Mesh(houseGeo, baseMat);
        base.position.y = 4;
        hGroup.add(base);
        const roof = new THREE.Mesh(roofGeo, topMat);
        roof.position.y = 11;
        roof.rotation.y = Math.PI / 4;
        hGroup.add(roof);
        const h = getTerrainHeight(x, z);
        hGroup.position.set(x, h, z);
        hGroup.rotation.y = rotation;
        this.scene.add(hGroup);
        this.mapMeshes.push(hGroup);

        if (isDungeon) {
           // Add a sign/banner
           const signGeo = new THREE.BoxGeometry(0.2, 2.5, 4);
           const signMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
           const sign = new THREE.Mesh(signGeo, signMat);
           sign.position.set(-5.2, 5, 0);
           hGroup.add(sign);
        }
      };

      addHouse(30, 30, Math.PI / 6);
      addHouse(-30, 30, -Math.PI / 4);
      addHouse(30, -30, Math.PI / 3);
      addHouse(-30, -30, -Math.PI / 5);
      
      addHouse(50, 10, Math.PI / 2, true); // Dungeon House
      addHouse(-50, -10, -Math.PI / 2);
    } else if (mapName === 'prt_fild01') {
      // Dungeon Exit Platform at (0, -45)
      const platformGeo = new THREE.BoxGeometry(10, 2, 10);
      const platformMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
      const platform = new THREE.Mesh(platformGeo, platformMat);
      platform.position.set(0, 1, -45);
      (platform as any).isWalkableSurface = true;
      this.scene.add(platform);
      this.mapMeshes.push(platform);
      
      // Stairs (simple boxes)
      for (let i = 0; i < 4; i++) {
        const stepGeo = new THREE.BoxGeometry(10, 0.5, 1);
        const step = new THREE.Mesh(stepGeo, platformMat);
        step.position.set(0, 0.25 + i * 0.5, -45 + 5.5 + i);
        (step as any).isWalkableSurface = true;
        this.scene.add(step);
        this.mapMeshes.push(step);
      }
      
      // Entrance Arch
      const archGroup = new THREE.Group();
      const colGeo = new THREE.BoxGeometry(1, 6, 1);
      const col1 = new THREE.Mesh(colGeo, platformMat);
      col1.position.set(-4, 3, 0);
      const col2 = new THREE.Mesh(colGeo, platformMat);
      col2.position.set(4, 3, 0);
      const beamGeo = new THREE.BoxGeometry(10, 1, 1);
      const beam = new THREE.Mesh(beamGeo, platformMat);
      beam.position.set(0, 6, 0);
      archGroup.add(col1, col2, beam);
      archGroup.position.set(0, 1, -45);
      this.scene.add(archGroup);
      this.mapMeshes.push(archGroup);

    } else {
      // Map-specific foliage
      const treeCount = mapName === 'prt_fild03' ? 25 : 12; 
      const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 4, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03 });
      
      const foliageColors = {
        'prt_fild01': 0x16a34a,
        'prt_fild02': 0xd97706,
        'prt_fild03': 0x064e3b,
        'prt_fild04': 0x4b5563
      };
      
      const leafColor = foliageColors[mapName as keyof typeof foliageColors] || 0x16a34a;
      const leafGeo = new THREE.SphereGeometry(3, 8, 8);
      const leafMat = new THREE.MeshStandardMaterial({ color: leafColor });

      const getFieldHeight = (x: number, z: number) => {
        const dist = Math.sqrt(x * x + z * z);
        if (dist < 12.0) return 0.05; 
        if (dist > 42.0) return (dist - 42.0) * 3.0; 
        
        if (mapName === 'prt_fild01') {
          return (Math.sin(x * 0.1) * Math.cos(z * 0.1)) * 1.2 + (Math.sin(x * 0.05) * Math.cos(z * 0.05)) * 0.5;
        }
        if (mapName === 'prt_fild02') {
          let h = (Math.sin(x * 0.05) * Math.cos(z * 0.05)) * 0.4;
          const plateauDist = Math.sqrt((x-20)**2 + (z-20)**2);
          if (plateauDist < 15) h += Math.max(0, (15 - plateauDist) / 15) * 4;
          return h;
        }
        if (mapName === 'prt_fild03') {
          return (Math.sin(x * 0.3) * Math.sin(z * 0.3)) * 0.8 + (Math.cos(x * 0.1) * Math.cos(z * 0.1)) * 1.0;
        }
        if (mapName === 'prt_fild04') {
          let h = (Math.sin(x * 0.1) * Math.cos(z * 0.1)) * 1.5;
          const bossDist = Math.sqrt((x-30)**2 + (z+30)**2);
          if (bossDist < 20) h += Math.pow(Math.max(0, (20 - bossDist)/20), 2) * 5;
          return h;
        }
        return 0;
      };

      for (let i = 0; i < treeCount; i++) {
        const tx = (Math.random() - 0.5) * 80;
        const tz = (Math.random() - 0.5) * 80;
        if (Math.abs(tx) < 10 && Math.abs(tz) < 10) continue; 

        const treeGroup = new THREE.Group();
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 2;
        treeGroup.add(trunk);
        
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.y = 5;
        treeGroup.add(leaf);
        
        const h = getFieldHeight(tx, tz); 
        treeGroup.position.set(tx, h, tz);
        this.scene.add(treeGroup);
        this.mapMeshes.push(treeGroup);
      }
    }
  }

  createPronteraDecorations() {
    // 7. Mystic Sapphire Crystal and Pedestal
    const crystalGeo = new THREE.OctahedronGeometry(1.2, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x81a1c1,
      emissive: 0x5e81ac,
      transparent: true,
      opacity: 0.85
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.set(0, 3.5, 0);
    this.scene.add(crystal);
    this.mapMeshes.push(crystal);
    
    const pedestalGeo = new THREE.CylinderGeometry(1.5, 2.0, 2.0, 8);
    const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x4c566a });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.set(0, 1, 0);
    this.scene.add(pedestal);
    this.mapMeshes.push(pedestal);
    
    (this as any)._plazaCrystal = crystal;

    // Starting Point Platform
    const startGeo = new THREE.CircleGeometry(6, 32);
    const startMat = new THREE.MeshStandardMaterial({
      color: 0x88c0d0,
      transparent: true,
      opacity: 0.15,
      depthWrite: false
    });
    const startMesh = new THREE.Mesh(startGeo, startMat);
    startMesh.rotation.x = -Math.PI / 2;
    startMesh.position.set(0, 0.05, 8);
    this.scene.add(startMesh);
    this.mapMeshes.push(startMesh);

    // Decorative pillars around the starting point
    const pillarGeo = new THREE.CylinderGeometry(0.5, 0.6, 4, 8);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x4c566a });
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const px = Math.cos(angle) * 7;
      const pz = Math.sin(angle) * 7 + 8;
      const p = new THREE.Mesh(pillarGeo, pillarMat);
      p.position.set(px, getTerrainHeight(px, pz) + 2, pz);
      p.castShadow = true;
      this.scene.add(p);
      this.mapMeshes.push(p);
    }
  }

  createPortals(mapName: string) {
    const warpRingGeo = new THREE.TorusGeometry(2.5, 0.3, 12, 32);
    const warpRingMat = new THREE.MeshBasicMaterial({
      color: 0x4fc3f7,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const warpColumnGeo = new THREE.CylinderGeometry(2, 2.2, 40, 16, 1, true);
    const warpColumnMat = new THREE.MeshBasicMaterial({
      color: 0x81d4fa,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const coreGeo = new THREE.CircleGeometry(2.2, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const createWarp = (px: number, pz: number, isDungeon = false) => {
      const group = new THREE.Group();
      
      const pColor = isDungeon ? 0xa855f7 : 0x4fc3f7; // Purple for dungeon, Blue for field
      const sColor = isDungeon ? 0xd8b4fe : 0x81d4fa;

      const warpRingMat = new THREE.MeshBasicMaterial({
        color: pColor,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });

      const warpColumnMat = new THREE.MeshBasicMaterial({
        color: sColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isDungeon ? 0.4 : 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const ring = new THREE.Mesh(warpRingGeo, warpRingMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.1;
      group.add(ring);

      const ring2 = ring.clone();
      ring2.scale.set(0.7, 0.7, 1);
      ring2.position.y = 0.15;
      group.add(ring2);

      if (isDungeon) {
        // Extra pulsing outer ring for dungeon
        const ring3 = ring.clone();
        ring3.scale.set(1.4, 1.4, 1);
        ring3.position.y = 0.05;
        group.add(ring3);
      }

      const pillar = new THREE.Mesh(warpColumnGeo, warpColumnMat);
      pillar.position.y = 20;
      group.add(pillar);

      const core = new THREE.Mesh(coreGeo, coreMat);
      core.rotation.x = -Math.PI / 2;
      core.position.y = 0.08;
      group.add(core);

      const portalLight = new THREE.PointLight(sColor, isDungeon ? 3.0 : 1.5, 15);
      portalLight.position.set(0, 2, 0);
      group.add(portalLight);

      group.position.set(px, getTerrainHeight(px, pz), pz);
      
      this.scene.add(group);
      this.mapMeshes.push(group);
      (group as any).isROPortal = true;
    };

    if (mapName === 'prontera') {
      const edge = 78.0;
      createWarp(0, -edge);
      createWarp(0, edge);
      createWarp(edge, 0);
      createWarp(-edge, 0);
      
      // Dungeon Entry House Warp at (50, 10) - Enhanced
      createWarp(50, 10, true);
    } else if (mapName === 'prt_maze01') {
      // Dungeon Exit Warp (back to field)
      createWarp(35, 35, false);
      // Back to Prontera
      createWarp(-35, -35, true);
    } else if (mapName === 'prt_fild01') {
      createWarp(0, 47.5); // Back to Prontera
      createWarp(0, -45, true); // To Dungeon
    } else {
      const edge = 47.5;
      if (mapName === 'prt_fild02') createWarp(0, -edge);
      else if (mapName === 'prt_fild03') createWarp(-edge, 0);
      else if (mapName === 'prt_fild04') createWarp(edge, 0);
    }
  }

  // Creates the billboard sprite canvas/texture for entities dynamically!
  // This lets us draw beautiful 2D pixel-style designs on the fly using HTML Cannvases.
  createEntityTexture(entity: Entity, equippedItems: EquippedItems) {
    const canvas = CanvasPool.getCanvas(256, 256);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = false; // Disable smoothing to keep pixel art crisp!

    // Draw background placeholder or sprite
    ctx.clearRect(0, 0, 256, 256);
    
    ctx.save();
    ctx.scale(2, 2);

    const f = entity.animationFrame;

    // 1. Lazy initialize the animation state machine
    if (!entity.animMachine) {
      entity.animMachine = new AnimationStateMachine(entity.state as any);
    } else {
      const forceTransition = entity.animMachine.currentState === 'death' && entity.state !== 'death';
      entity.animMachine.transitionTo(entity.state as any, forceTransition);
    }

    // 2. Calculate dynamic delta time per rendering pass for fluid animations
    const nowTimestamp = performance.now();
    const lastUpdateTimestamp = (entity as any)._lastAnimUpdateTime || nowTimestamp;
    const renderDt = Math.min(0.08, (nowTimestamp - lastUpdateTimestamp) / 1000);
    (entity as any)._lastAnimUpdateTime = nowTimestamp;

    // 3. Update state machine
    entity.animMachine.update(renderDt || 0.016);

    const metrics = entity.animMachine.getMetrics();
    ctx.globalAlpha = metrics.opacity;

    if (entity.type === 'player') {
      // Draw standard cute Ragnarok Lord Knight / High Priest style sprite
      ctx.fillStyle = '#f8fafc'; // pale white outfit body
      
      // Face facing directions flipping
      const flip = entity.facing === 'left' ? -1 : 1;
      
      // Draw shadow base oval on the floor (always grounded)
      ctx.save();
      ctx.translate(64, 64);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 48, 22, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Transform matrices with dynamic squash-and-stretch and spring physics!
      ctx.save();
      const pScale = 96 / 70; // Target height 96 from baseline 70
      ctx.translate(64, 64 + metrics.visualOffsetY);
      // Adjust pivot so baseline at Y=42 on canvas stays grounded
      ctx.translate(0, 42 * (1 - pScale)); 
      ctx.scale(flip * metrics.scaleX * pScale, metrics.scaleY * pScale);
      ctx.rotate(metrics.rotation);

      const bounceY = 0; // Handed off and fully handled by physical matrix translation!
      const hitColor = entity.state === 'hit' ? '#ef4444' : undefined;

      let drewCustomSprite = false;
      // We want to use the high-quality pixel art sprite for all player classes to look good!
      if (true) {
        let spriteUrl = 'https://raw.githubusercontent.com/Leemonztuff/gameassets/main/Characters/F/1/acolyte_.png'; // default
        if (entity.job === 'Lord Knight' || entity.job === 'Knight') spriteUrl = 'https://raw.githubusercontent.com/Leemonztuff/gameassets/main/Characters/F/2-1/knight_.png';
        else if (entity.job === 'High Priest' || entity.job === 'Priest') spriteUrl = 'https://raw.githubusercontent.com/Leemonztuff/gameassets/main/Characters/F/2-1/priest_.png';
        else if (entity.job === 'Swordsman') spriteUrl = 'https://raw.githubusercontent.com/Leemonztuff/gameassets/main/Characters/F/1/swordman_.png';
        else if (entity.job === 'Assassin Cross' || entity.job === 'Thief') spriteUrl = 'https://raw.githubusercontent.com/Leemonztuff/gameassets/main/Characters/F/1/thief_.png';
        else if (entity.job === 'Mage') spriteUrl = 'https://raw.githubusercontent.com/Leemonztuff/gameassets/main/Characters/F/1/mage_.png';
        else if (entity.job === 'Wizard') spriteUrl = 'https://raw.githubusercontent.com/Leemonztuff/gameassets/main/Characters/F/2-1/wizard_.png';
        else if (entity.job === 'Archer' || entity.job === 'Sniper') spriteUrl = 'https://raw.githubusercontent.com/Leemonztuff/gameassets/main/Characters/F/1/archer_.png';
        else if (entity.job === 'Novice') spriteUrl = 'https://raw.githubusercontent.com/Leem0nStudio/assets-lab/main/spr/PYR/novice/F/01/front/novice.png';

        const spriteImg = getOrLoadCachedImage(spriteUrl);
        if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
          const sw = spriteImg.naturalWidth;
          const sh = spriteImg.naturalHeight;
          if (spriteUrl.includes('novice.png')) {
            // Precision crop of the full-body novice portrait from Leem0nStudio asset repo (1024x1024)
            // Fully optimized scale to prevent canvas clipping and maintain character scale proportions
            const sx = 355;
            const sy = 55;
            const cropW = 372;
            const cropH = 936;

            const drawH = 72; // Optimized scale to align perfectly with other job classes (e.g. Knight/Priest @ 70) and prevent top clipping
            const drawW = Math.round(drawH * (cropW / cropH));
            const drawX = -drawW / 2;
            const drawY = 42 - drawH;

            ctx.drawImage(
              spriteImg,
              sx, sy, cropW, cropH,
              drawX, drawY,
              drawW, drawH
            );

            if (hitColor) {
              ctx.save();
              ctx.globalCompositeOperation = 'source-atop';
              ctx.fillStyle = 'rgba(239, 68, 68, 0.65)';
              ctx.fillRect(drawX, drawY, drawW, drawH);
              ctx.restore();
            }
          } else if (sw > 300) {
            // The image is 500x500 containing a high-res single standing sprite.
            const sx = 138;
            const sy = 12;
            const cropW = 184;
            const cropH = 480;

            const drawH = 70;
            const drawW = Math.round(drawH * (cropW / cropH)); // ~27px wide
            const drawX = -drawW / 2;
            const drawY = 42 - drawH; // -28px top

            ctx.drawImage(
              spriteImg,
              sx, sy, cropW, cropH,
              drawX, drawY,
              drawW, drawH
            );

            if (hitColor) {
              ctx.save();
              ctx.globalCompositeOperation = 'source-atop';
              ctx.fillStyle = 'rgba(239, 68, 68, 0.65)';
              ctx.fillRect(drawX, drawY, drawW, drawH);
              ctx.restore();
            }
          } else {
             // It's a nicely packed 256x256 sprite
             const drawH = 80;
             const drawW = 80;
             const drawX = -drawW / 2;
             const drawY = 42 - drawH + 10; // offset slightly down
             ctx.drawImage(spriteImg, 0, 0, sw, sh, drawX, drawY, drawW, drawH);
             
             if (hitColor) {
               ctx.save();
               ctx.globalCompositeOperation = 'source-atop';
               ctx.fillStyle = 'rgba(239, 68, 68, 0.65)';
               ctx.fillRect(drawX, drawY, drawW, drawH);
               ctx.restore();
             }
          }

          drewCustomSprite = true;
        }
      }

      // Body Layer: Armor or default outfit
      if (!drewCustomSprite) {
        if (equippedItems.body) {
          ctx.fillStyle = '#525252'; // Steel plate base
        } else {
          const jobColors: Record<string, string> = {
            'Lord Knight': '#dc2626',
            'High Priest': '#10b981',
            'Assassin Cross': '#7c3aed',
            'Sniper': '#0ea5e9',
            'Swordsman': '#fbbf24',
            'Mage': '#6366f1',
            'Archer': '#a855f7',
            'Knight': '#ea580c',
            'Wizard': '#4338ca',
            'Hunter': '#1d4ed8',
            'Novice': '#94a3b8'
          };
          ctx.fillStyle = hitColor || jobColors[entity.job || 'Novice'] || '#0ea5e9';
        }
        ctx.beginPath();
        ctx.moveTo(-16, 40);
        ctx.lineTo(16, 40);
        ctx.lineTo(8, 0 - bounceY);
        ctx.lineTo(-8, 0 - bounceY);
        ctx.closePath();
        ctx.fill();
      }

      // Right Hand Layer: Weapon
      ctx.strokeStyle = equippedItems.rightHand ? '#f59e0b' : '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-20, 20 - bounceY);
      ctx.lineTo(-20, -10 - bounceY);
      ctx.stroke();

      if (!drewCustomSprite) {
        // Cute head circles
        ctx.fillStyle = hitColor || '#fbcfe8'; // peach/skin
        ctx.beginPath();
        ctx.arc(0, -14 - bounceY, 14, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(4, -15 - bounceY, 2, 0, Math.PI * 2);
        ctx.arc(-4, -15 - bounceY, 2, 0, Math.PI * 2);
        ctx.fill();

        // Hair (Ragnarok spiky yellow wig!)
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(-16, -20 - bounceY);
        ctx.lineTo(-10, -32 - bounceY);
        ctx.lineTo(0, -25 - bounceY);
        ctx.lineTo(10, -32 - bounceY);
        ctx.lineTo(16, -20 - bounceY);
        ctx.closePath();
        ctx.fill();
      }

      // Equippable Headgear Layer!
      if (equippedItems.head) {
        const headgear = equippedItems.head.name; // assuming name corresponds to some ID or logic
        ctx.fillStyle = headgear === 'Goggles' ? '#334155' :
                        headgear === 'Magician Hat' ? '#4f46e5' :
                        headgear === 'Bunny Band' ? '#ffffff' : '#f59e0b'; // crown

        if (headgear === 'Bunny Band') {
          // Bunny ears!
          ctx.beginPath();
          ctx.ellipse(-8, -36 - bounceY, 5, 12, -0.2, 0, Math.PI * 2);
          ctx.ellipse(8, -36 - bounceY, 5, 12, 0.2, 0, Math.PI * 2);
          ctx.fill();
          // Ear pink inner
          ctx.fillStyle = '#fda4af';
          ctx.beginPath();
          ctx.ellipse(-8, -35 - bounceY, 2, 8, -0.2, 0, Math.PI * 2);
          ctx.ellipse(8, -35 - bounceY, 2, 8, 0.2, 0, Math.PI * 2);
          ctx.fill();
        } else if (headgear === 'Ragnarok Crown') {
          // Glorious Golden Crown
          ctx.beginPath();
          ctx.moveTo(-12, -26 - bounceY);
          ctx.lineTo(-14, -36 - bounceY);
          ctx.lineTo(-6, -30 - bounceY);
          ctx.lineTo(0, -42 - bounceY);
          ctx.lineTo(6, -30 - bounceY);
          ctx.lineTo(14, -36 - bounceY);
          ctx.lineTo(12, -26 - bounceY);
          ctx.closePath();
          ctx.fill();
          // Crown jewel rubies!
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, -34 - bounceY, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (headgear === 'Magician Hat') {
          // Tall blue wizard hat
          ctx.beginPath();
          ctx.moveTo(-16, -26 - bounceY);
          ctx.lineTo(16, -26 - bounceY);
          ctx.lineTo(8, -44 - bounceY);
          ctx.lineTo(-6, -42 - bounceY);
          ctx.closePath();
          ctx.fill();
        } else if (headgear === 'Goggles') {
          // Cool steam goggles overlay
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-12, -22 - bounceY, 24, 7);
          ctx.fillStyle = '#38bdf8'; // glowing blue glass lenses
          ctx.beginPath();
          ctx.arc(-5, -18 - bounceY, 4, 0, Math.PI * 2);
          ctx.arc(5, -18 - bounceY, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();

    } else if (entity.type === 'npc') {
      // Draw signature Ragnarok style high-contrast custom NPC characters
      const flip = entity.facing === 'left' ? -1 : 1;
      ctx.save();
      ctx.translate(64, 64);
      ctx.scale(flip, 1);

      const bounceY = Math.abs(Math.sin(performance.now() * 0.005)) * 4.5; // soft idle breathing

      // Shadow base
      ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 48, 20, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      let spriteUrl = '';
      if (entity.npcType === 'kafra') {
        spriteUrl = 'https://raw.githubusercontent.com/Leem0nStudio/assets-lab/main/spr/NPC/magician_Idle.png';
      } else if (entity.npcType === 'crusader_instructor') {
        spriteUrl = 'https://raw.githubusercontent.com/Leem0nStudio/assets-lab/main/spr/NPC/samurai.png';
      }
      
      let drewCustomSprite = false;
      if (spriteUrl) {
        const spriteImg = getOrLoadCachedImage(spriteUrl);
        if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
          const sw = spriteImg.naturalWidth;
          const sh = spriteImg.naturalHeight;
          
          if (spriteUrl.includes('magician_Idle.png')) {
            // Precision crop of the full-body magician portrait
            const sx = 278;
            const sy = 110;
            const sWidth = 1424;
            const sHeight = 1872;
            
            const drawH = 96; // Render slightly larger for amazing visibility
            const drawW = Math.round(drawH * (sWidth / sHeight));
            const drawX = -drawW / 2;
            const drawY = 42 - drawH - bounceY;
            ctx.drawImage(spriteImg, sx, sy, sWidth, sHeight, drawX, drawY, drawW, drawH);
            drewCustomSprite = true;
          } else if (spriteUrl.includes('samurai.png')) {
            // Precision crop of the full-body samurai portrait
            const sx = 407;
            const sy = 47;
            const sWidth = 1255;
            const sHeight = 1935;
            
            const drawH = 96; // Render slightly larger for amazing visibility
            const drawW = Math.round(drawH * (sWidth / sHeight));
            const drawX = -drawW / 2;
            const drawY = 42 - drawH - bounceY;
            ctx.drawImage(spriteImg, sx, sy, sWidth, sHeight, drawX, drawY, drawW, drawH);
            drewCustomSprite = true;
          } else {
            const drawH = 80;
            const drawW = 80;
            const drawX = -drawW / 2;
            const drawY = 42 - drawH + 10 - bounceY;
            ctx.drawImage(spriteImg, 0, 0, sw, sh, drawX, drawY, drawW, drawH);
            drewCustomSprite = true;
          }
        }
      }

      if (!drewCustomSprite) {
        if (entity.npcType === 'kafra') {
          // Kafra Clarice: Elegant apron blue maid wear, white headband ribbon, fiery orange hair
          // Dress apron
          ctx.fillStyle = '#1e3a8a'; // Royal velvet blue
          ctx.beginPath();
          ctx.moveTo(-14, 40);
          ctx.lineTo(14, 40);
          ctx.lineTo(8, 0 - bounceY);
          ctx.lineTo(-8, 0 - bounceY);
          ctx.closePath();
          ctx.fill();

          // White front corset lace-overlay
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(-8, 40);
          ctx.lineTo(8, 40);
          ctx.lineTo(5, 12 - bounceY);
          ctx.lineTo(-5, 12 - bounceY);
          ctx.closePath();
          ctx.fill();

          // Shoulder straps
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-6, 12 - bounceY);
          ctx.lineTo(-8, 0 - bounceY);
          ctx.moveTo(6, 12 - bounceY);
          ctx.lineTo(8, 0 - bounceY);
          ctx.stroke();

          // Peach skin texture head
          ctx.fillStyle = '#fbcfe8';
          ctx.beginPath();
          ctx.arc(0, -10 - bounceY, 11, 0, Math.PI * 2);
          ctx.fill();

          // Beautiful Orange hairdo with bangs
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(-14, -13 - bounceY);
          ctx.lineTo(-11, -23 - bounceY);
          ctx.lineTo(0, -17 - bounceY);
          ctx.lineTo(11, -23 - bounceY);
          ctx.lineTo(14, -13 - bounceY);
          ctx.closePath();
          ctx.fill();

          // Maid headband
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-8, -22 - bounceY, 16, 4);
          ctx.beginPath();
          ctx.arc(-8, -20 - bounceY, 3, 0, Math.PI * 2);
          ctx.arc(8, -20 - bounceY, 3, 0, Math.PI * 2);
          ctx.fill();

          // Smiling anime eyes
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(3, -11 - bounceY, 1.5, 0, Math.PI * 2);
          ctx.arc(-3, -11 - bounceY, 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Blush cheeks
          ctx.fillStyle = 'rgba(244, 63, 94, 0.6)';
          ctx.beginPath();
          ctx.arc(-6, -8 - bounceY, 2.5, 0, Math.PI * 2);
          ctx.arc(6, -8 - bounceY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Swordsman Trainer Kurt: Metallic shining iron plates on a massive crusader red cape
          // Red cape
          ctx.fillStyle = '#be123c'; 
          ctx.beginPath();
          ctx.moveTo(-18, 42);
          ctx.lineTo(18, 42);
          ctx.lineTo(0, -2 - bounceY);
          ctx.closePath();
          ctx.fill();

          // Heavy steel iron plate chest armor
          ctx.fillStyle = '#cbd5e1'; 
          ctx.beginPath();
          ctx.moveTo(-13, 40);
          ctx.lineTo(13, 40);
          ctx.lineTo(9, 1 - bounceY);
          ctx.lineTo(-9, 1 - bounceY);
          ctx.closePath();
          ctx.fill();

          // Golden cross design
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(-2.5, 12 - bounceY, 5, 14);
          ctx.fillRect(-6.5, 16 - bounceY, 13, 4.5);

          // Neck protection neckplate
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(-6, 0 - bounceY, 12, 4);

          // Peach face/head
          ctx.fillStyle = '#fbcfe8';
          ctx.beginPath();
          ctx.arc(0, -10 - bounceY, 11, 0, Math.PI * 2);
          ctx.fill();

          // Heavy Iron Helmet
          ctx.fillStyle = '#475569'; // steel armor helmet
          ctx.beginPath();
          ctx.moveTo(-12, -15 - bounceY);
          ctx.lineTo(-8, -25 - bounceY);
          ctx.lineTo(0, -21 - bounceY);
          ctx.lineTo(8, -25 - bounceY);
          ctx.lineTo(12, -15 - bounceY);
          ctx.closePath();
          ctx.fill();

          // Helm plume
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.ellipse(0, -26 - bounceY, 4, 8, 0.45, 0, Math.PI * 2);
          ctx.fill();

          // Visor slit
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-6, -13 - bounceY, 12, 3);
        }
      }

      ctx.restore();
    } else {
      // This is a Monster Mob sprite
      const flip = entity.facing === 'left' ? -1 : 1;
      const hitColor = entity.state === 'hit' ? '#ef4444' : undefined;
      const isDead = entity.state === 'death';

      // 1. Draw flat shadow on the floor (always grounded)
      ctx.save();
      ctx.translate(64, 64);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.beginPath();
      ctx.ellipse(0, 48, entity.type === 'boss_mvp' ? 40 : 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Render Mob Health Bar directly above the mob
      if (entity.type === 'monster' || entity.type === 'boss_mvp') {
          const hpPercent = Math.max(0, entity.currentHp / entity.maxHp);
          ctx.save();
          ctx.translate(64, 32); // Positioned above the mob
          
          // HP Bar
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-20, 0, 40, 6);
          ctx.fillStyle = hpPercent > 0.6 ? '#22c55e' : hpPercent > 0.3 ? '#eab308' : '#ef4444';
          ctx.fillRect(-19, 1, 38 * hpPercent, 4);

          // Status Effects icons
          const effects = entity.activeEffects;
          if (effects && effects.length > 0) {
            effects.forEach((eff, i) => {
                ctx.fillStyle = eff.type === 'haste' ? '#f59e0b' : eff.type === 'might' ? '#ef4444' : '#6366f1';
                ctx.beginPath();
                ctx.arc(i * 12 - (effects.length * 6) + 6, 12, 4, 0, Math.PI * 2);
                ctx.fill();
            });
          }
          ctx.restore();
      }

      // 2. Translate, Scale and Rotate body according to spring meters
      ctx.save();
      ctx.translate(64, 64 + metrics.visualOffsetY);
      ctx.scale(flip * metrics.scaleX, metrics.scaleY);
      ctx.rotate(metrics.rotation);

      const bounceY = 0; 
      const squashIdx = 1.0; 

      if (entity.mobType === 'poring' || entity.mobType === 'eclipse' || entity.mobType === 'mastering') {
         // PORING VARIANTS
         let color = '#fda4af'; // Default Poring pink
         if (entity.mobType === 'eclipse') color = '#fb923c'; // Orange Poring
         if (entity.mobType === 'mastering') color = '#f472b6'; // Hot pink Poring
         
         ctx.fillStyle = hitColor || color;
         ctx.beginPath();
         const s = entity.mobType === 'mastering' ? 2.2 : 1.0;
         ctx.ellipse(0, 24 - bounceY, 24 * s * squashIdx, 20 * s / squashIdx, 0, 0, Math.PI * 2);
         ctx.fill();

        if (!isDead) {
          ctx.fillStyle = 'rgba(244, 63, 94, 0.5)';
          ctx.beginPath();
          ctx.arc(-12 * s, 26 * s - bounceY, 4 * s, 0, Math.PI * 2);
          ctx.arc(12 * s, 26 * s - bounceY, 4 * s, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(-7 * s, 20 * s - bounceY, 2.5 * s, 0, Math.PI * 2);
          ctx.arc(7 * s, 20 * s - bounceY, 2.5 * s, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2 * s;
          ctx.beginPath();
          ctx.arc(0, 24 * s - bounceY, 3 * s, 0, Math.PI);
          ctx.stroke();
        }
      } else if (entity.mobType === 'poporing' || entity.mobType === 'dragon_fly') {
        // GREEN SQUISHY POPORING! (With small toxic leaf crown)
        let color = '#4ade80';
        if (entity.mobType === 'dragon_fly') color = '#60a5fa'; // Blue Poporing
        
        ctx.fillStyle = hitColor || color;
        ctx.beginPath();
        const squashIdx = isDead ? 0.4 : 1.05;
        ctx.ellipse(0, 24 - bounceY, 24 * squashIdx, 20 / squashIdx, 0, 0, Math.PI * 2);
        ctx.fill();

        if (!isDead) {
          // Leaf hat!
          ctx.fillStyle = '#15803d'; 
          ctx.beginPath();
          ctx.ellipse(0, 4 - bounceY, 5, 10, 0.4, 0, Math.PI * 2);
          ctx.fill();

          // Beaded eyes & smile
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(-7, 20 - bounceY, 2.5, 0, Math.PI * 2);
          ctx.arc(7, 20 - bounceY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (entity.mobType === 'pecopeco') {
        // PECOPECO: A fast running desert ostrich yellow bird
        ctx.fillStyle = hitColor || '#fbbf24'; // ostrich golden amber yellow
        
        // Large round body
        ctx.beginPath();
        ctx.arc(0, 20 - bounceY, 18, 0, Math.PI * 2);
        ctx.fill();

        // Long spidery stick bird legs
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-6, 32);
        ctx.lineTo(-10 + (bounceY * 0.4), 48);
        ctx.moveTo(6, 32);
        ctx.lineTo(8 - (bounceY * 0.4), 48);
        ctx.stroke();

        if (!isDead) {
          // Ostrich plume neck
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(8, 12 - bounceY);
          ctx.lineTo(24, -12 - bounceY);
          ctx.lineTo(16, -15 - bounceY);
          ctx.closePath();
          ctx.fill();

          // Beak!
          ctx.fillStyle = '#dc2626'; // flaming red beak
          ctx.beginPath();
          ctx.moveTo(20, -14 - bounceY);
          ctx.lineTo(32, -8 - bounceY);
          ctx.lineTo(22, -4 - bounceY);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        // MONSTROUS BAPHOMET (The Ragnarok Signature Goat Devil Boss MVP!)
        ctx.fillStyle = hitColor || '#1e293b'; // demonic dark navy-black shadow
        
        // Tall colossal devil body
        ctx.beginPath();
        ctx.moveTo(-24, 40);
        ctx.lineTo(24, 40);
        ctx.lineTo(16, -20 - bounceY);
        ctx.lineTo(-16, -20 - bounceY);
        ctx.closePath();
        ctx.fill();

        // Giant curved goat ivory skull horns!
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 5;
        ctx.beginPath();
        // Left curving sweeping horn
        ctx.moveTo(-12, -20 - bounceY);
        ctx.quadraticCurveTo(-38, -36 - bounceY, -26, -6 - bounceY);
        // Right curving sweeping horn
        ctx.moveTo(12, -20 - bounceY);
        ctx.quadraticCurveTo(38, -36 - bounceY, 26, -6 - bounceY);
        ctx.stroke();

        // Massive terrifying scythe stick!
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(24, 45);
        ctx.lineTo(24, -40 - bounceY); // handle shaft staff
        ctx.stroke();

        // Blade of scythe
        ctx.fillStyle = '#38bdf8'; // neon blue scythe blade
        ctx.beginPath();
        ctx.moveTo(24, -36 - bounceY);
        ctx.lineTo(-24, -48 - bounceY);
        ctx.lineTo(24, -22 - bounceY);
        ctx.closePath();
        ctx.fill();

        // Red glowing demonic eyes of the MVP boss
        if (!isDead) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(-6, -11 - bounceY, 3, 0, Math.PI * 2);
          ctx.arc(6, -11 - bounceY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    // Render floating speech chat bubbles if entity has active sayText parameter
    if (entity.sayText && entity.sayTextEndTime && entity.sayTextEndTime > performance.now()) {
      ctx.save();
      ctx.globalAlpha = 1.0; // make speech bubbles fully opaque and clear over background
      
      // Determine font style
      ctx.font = 'bold 9px Arial, Helvetica, sans-serif';
      const text = entity.sayText;
      
      // Split text into lines of max 18 characters
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      words.forEach(w => {
        if ((currentLine + ' ' + w).length > 20) {
          lines.push(currentLine.trim());
          currentLine = w;
        } else {
          currentLine = currentLine + ' ' + w;
        }
      });
      if (currentLine) {
        lines.push(currentLine.trim());
      }

      // Calculate width and height of bubble box
      let maxLineWidth = 0;
      lines.forEach(l => {
        const metrics = ctx.measureText(l);
        if (metrics.width > maxLineWidth) {
          maxLineWidth = metrics.width;
        }
      });

      const paddingX = 6;
      const paddingY = 4;
      const lineHeight = 11;
      const bubbleWidth = Math.min(116, Math.max(36, maxLineWidth + paddingX * 2));
      const bubbleHeight = lines.length * lineHeight + paddingY * 2;
      
      // Chat bubble position: centered horizontally, at the top of the canvas
      const x = 64 - bubbleWidth / 2;
      const y = 6; // near the top boundary
      
      // Rounded bubble corners & fill drawing
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = '#0ea5e9'; // RAG style sky blue borders!
      ctx.lineWidth = 1.5;
      
      const r = 5; // corner radius
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + bubbleWidth - r, y);
      ctx.quadraticCurveTo(x + bubbleWidth, y, x + bubbleWidth, y + r);
      ctx.lineTo(x + bubbleWidth, y + bubbleHeight - r);
      ctx.quadraticCurveTo(x + bubbleWidth, y + bubbleHeight, x + bubbleWidth - r, y + bubbleHeight);
      
      // Arrow indicator pointing down to head
      ctx.lineTo(64 + 4, y + bubbleHeight);
      ctx.lineTo(64, y + bubbleHeight + 4);
      ctx.lineTo(64 - 4, y + bubbleHeight);
      
      ctx.lineTo(x + r, y + bubbleHeight);
      ctx.quadraticCurveTo(x, y + bubbleHeight, x, y + bubbleHeight - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      
      ctx.fill();
      ctx.stroke();
      
      // Draw text lines
      ctx.fillStyle = '#0f172a'; // slate blue dark text
      ctx.textAlign = 'center';
      lines.forEach((l, idx) => {
        ctx.fillText(l, 64, y + paddingY + 8 + idx * lineHeight);
      });
      
      ctx.restore();
    }
    
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    return texture;
  }

  // Visual effects mesh generator helper
  spawnTouchIndicator(touch: TouchIndicator) {
    const geo = new THREE.RingGeometry(0.15, 0.45, 16);
    const color = touch.type === 'move' ? 0x0ea5e9 : // Blue move ring click
                  touch.type === 'target' ? 0xf43f5e : 0xeab308; // Red target ring, Yellow skill crosshair
    
    const mat = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(touch.x, 0.05, touch.z);
    this.scene.add(mesh);
    return mesh;
  }

  // Create physical visual drop on the floor
  spawnDropItemMesh(item: GroundItem): THREE.Mesh {
    const geo = new THREE.BoxGeometry(0.5, 0.5, 0.1);
    const mat = new THREE.MeshStandardMaterial({
      color: item.itemId === 'mvp_coin' ? 0xf59e0b : 0xf43f5e, // gold for coins, red for potion boxes
      metalness: 0.7,
      roughness: 0.2
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(item.x, 0.25, item.z);
    mesh.castShadow = true;
    this.scene.add(mesh);
    return mesh;
  }

  // Spawn visual spell meshes on character triggers
  createSkillVisualMesh(type: string, x: number, z: number, y: number): THREE.Object3D {
    const spellGroup = new THREE.Group();

    if (type === 'heal') {
      // Golden circle with rising cylinders
      const circleGeo = new THREE.RingGeometry(0.2, 1.4, 32);
      const circleMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(circleGeo, circleMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.04;
      spellGroup.add(ring);

      // Sparkly rising lines
      const lineGeo = new THREE.CylinderGeometry(0.04, 0.04, 3, 4);
      const lineMat = new THREE.MeshBasicMaterial({
        color: 0xa7f3d0,
        transparent: true,
        opacity: 0.6
      });
      for (let i = 0; i < 6; i++) {
        const line = new THREE.Mesh(lineGeo, lineMat);
        const theta = (i / 6) * Math.PI * 2;
        line.position.set(Math.cos(theta) * 0.9, 1.5, Math.sin(theta) * 0.9);
        spellGroup.add(line);
      }
    } else if (type === 'bash' || type === 'sonic_blow') {
      // Sweeping sharp slashing red/purple sword crescent mesh!
      const slashGeo = new THREE.RingGeometry(0.5, 2.0, 16, 1, 0, Math.PI * 1.2);
      const slashMat = new THREE.MeshBasicMaterial({
        color: type === 'bash' ? 0xf59e0b : 0x8b5cf6, // orange for bash, purple slash for sonic blow
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide
      });
      const slash = new THREE.Mesh(slashGeo, slashMat);
      slash.position.y = 1.0;
      slash.rotation.y = Math.random() * Math.PI;
      spellGroup.add(slash);
    } else if (type === 'thunder_storm') {
      // Towering lightning high-voltage clouds cylinders columns
      const cylGeo = new THREE.CylinderGeometry(1.5, 1.8, 12, 16);
      const cylMat = new THREE.MeshBasicMaterial({
        color: 0x0ea5e9, // lightning electric blue
        transparent: true,
        opacity: 0.45,
        wireframe: true
      });
      const cyl = new THREE.Mesh(cylGeo, cylMat);
      cyl.position.y = 6.0;
      spellGroup.add(cyl);
    } else if (type === 'level_up') {
      // Golden fireworks flare particle ring!
      const pCount = 50;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 2;
        pos[i * 3 + 1] = Math.random() * 4;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        color: 0xeab308, // Pure golden level up shimmer!
        size: 0.25,
        transparent: true,
        opacity: 0.9
      });
      const points = new THREE.Points(geo, mat);
      spellGroup.add(points);
    }

    spellGroup.position.set(x, y, z);
    this.scene.add(spellGroup);
    return spellGroup;
  }

  // Draw flying physics projectile meshes in Three.js
  spawnProjectileMesh(type: string, x: number, y: number, z: number): THREE.Object3D {
    const projGroup = new THREE.Group();
    if (type === 'arrow') {
      // Glow yellow streak cylinder representant
      const geo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6);
      const mat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = Math.PI / 2; // Lie flat aligned
      projGroup.add(mesh);
    } else if (type === 'holy_light') {
      // Golden bright magical sphere
      const geo = new THREE.SphereGeometry(0.24, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const mesh = new THREE.Mesh(geo, mat);
      projGroup.add(mesh);

      const ringGeo = new THREE.RingGeometry(0.1, 0.4, 8);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      projGroup.add(ring);
    } else if (type === 'poison_dart') {
      // Toxic green glowing orb
      const geo = new THREE.SphereGeometry(0.18, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
      const mesh = new THREE.Mesh(geo, mat);
      projGroup.add(mesh);
    } else {
      // dark_energy orb
      const geo = new THREE.SphereGeometry(0.32, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
      const mesh = new THREE.Mesh(geo, mat);
      projGroup.add(mesh);
    }
    projGroup.position.set(x, y, z);
    this.scene.add(projGroup);
    return projGroup;
  }

  // --- VFX SYSTEM ---
  
  spawnHitFlash(x: number, y: number, z: number) {
    const geo = new THREE.SphereGeometry(0.5, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    this.vfxInstances.push({ id: `vfx_${Math.random()}`, type: 'hit_flash', mesh, age: 0, maxAge: 10, speed: 0, active: true });
  }

  spawnDamageNumber(x: number, y: number, z: number, damage: number) {
    // Basic canvas for damage number (optimized)
    const canvas = CanvasPool.getCanvas(64, 64);
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(damage.toString(), 20, 40);
    }
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(x, y + 1.5, z);
    sprite.userData = { canvas }; // Store local canvas reference for pool release
    this.scene.add(sprite);
    this.vfxInstances.push({ id: `vfx_${Math.random()}`, type: 'damage_number', mesh: sprite, age: 0, maxAge: 30, speed: 0.05, active: true });
  }

  tickVFX(dt: number) {
    // Animate ambient dust particles if they exist
    if ((this as any)._dustParticles) {
      const dust = (this as any)._dustParticles as THREE.Points;
      const positions = dust.geometry.attributes.position.array as Float32Array;
      const time = performance.now() * 0.001;
      
      for (let i = 0; i < positions.length / 3; i++) {
        // Slow drifting motion
        positions[i * 3] += Math.sin(time * 0.2 + i) * 0.005;
        positions[i * 3 + 1] -= 0.002; // slow fall
        positions[i * 3 + 2] += Math.cos(time * 0.2 + i) * 0.005;
        
        // Reset particles that go too low
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = 8.0;
        }
      }
      dust.geometry.attributes.position.needsUpdate = true;
    }

    for (let i = this.vfxInstances.length - 1; i >= 0; i--) {
      const vfx = this.vfxInstances[i];
      vfx.age++;
      
      if (vfx.type === 'damage_number') {
        vfx.mesh.position.y += vfx.speed;
        (vfx.mesh as THREE.Sprite).material.opacity -= 0.03;
      } else if (vfx.type === 'hit_flash') {
        (vfx.mesh as THREE.Mesh).scale.multiplyScalar(0.9);
      }

      if (vfx.age >= vfx.maxAge) {
        this.scene.remove(vfx.mesh);
        
        // Clean up resources to prevent memory leaks and release canvas back to pool
        if (vfx.mesh instanceof THREE.Sprite) {
          if (vfx.mesh.userData && vfx.mesh.userData.canvas) {
            CanvasPool.releaseCanvas(vfx.mesh.userData.canvas);
          }
          if (vfx.mesh.material) {
            if (vfx.mesh.material.map) {
              vfx.mesh.material.map.dispose();
            }
            vfx.mesh.material.dispose();
          }
        } else if (vfx.mesh instanceof THREE.Mesh) {
          if (vfx.mesh.geometry) vfx.mesh.geometry.dispose();
          if (vfx.mesh.material) {
            if (Array.isArray(vfx.mesh.material)) {
              vfx.mesh.material.forEach((m) => m.dispose());
            } else {
              vfx.mesh.material.dispose();
            }
          }
        }

        this.vfxInstances.splice(i, 1);
      }
    }
  }
}
