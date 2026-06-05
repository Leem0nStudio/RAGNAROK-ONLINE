import * as THREE from 'three';
import { Entity, GroundItem, TouchIndicator, VFXEffect, EquippedItems } from './types';
import { AnimationStateMachine } from './animationStateMachine';
import { CanvasPool } from './sceneGraph';

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
  const dist = Math.sqrt(x * x + z * z);
  
  // 1. Base rolling hills in Prontera Field style (low-frequency gentle waves)
  let height = (Math.sin(x * 0.08) * Math.cos(z * 0.08)) * 0.6 + (Math.sin(x * 0.035) * Math.cos(z * 0.035)) * 0.25;
  
  // 2. NW Hillside: a beautiful gentle exploration knoll in the Northwest (around x = -26, z = -26)
  const nwDx = x - (-26);
  const nwDz = z - (-26);
  const nwHillDist = Math.sqrt(nwDx * nwDx + nwDz * nwDz);
  if (nwHillDist < 18) {
    const factor = (18 - nwHillDist) / 18;
    height += Math.pow(factor, 2) * 2.8; // beautiful dome rise
  }
  
  // 3. Ancient Overgrown Altar plateau: Northeast corner for Baphomet Boss (around x = 48, z = -48)
  const bossDx = x - 48;
  const bossDz = z - (-48);
  const bossDist = Math.sqrt(bossDx * bossDx + bossDz * bossDz);
  if (bossDist < 25) {
    const factor = Math.max(0, (25 - bossDist) / 25);
    // Flat-topped step plateau
    height += THREE.MathUtils.lerp(0.0, 1.4, Math.sin(factor * Math.PI / 2)) + (Math.sin(x * 0.2) * Math.cos(z * 0.2)) * 0.08;
  }
  
  // 4. Exponential Mountain Ridge boundaries (dist > 42.0)
  // Sharp terrain rise to form natural towering valleys that block the view of any background void!
  if (dist > 42.0) {
    const edgeFactor = (dist - 42.0);
    const mountainRise = edgeFactor * 2.5 + Math.pow(edgeFactor, 1.95) * 0.35;
    // Craggy, sharp cleft peaks noise
    const cragNoise = (Math.sin(x * 0.4) * Math.cos(z * 0.4)) * 1.8;
    height = THREE.MathUtils.lerp(height, mountainRise + cragNoise, Math.min(1.0, (dist - 42) / 6.5));
  }
  
  // 5. Flatten Central Spawn Plaza smoothly (dist < 18.0)
  if (dist < 18.0) {
    const t = dist / 18.0;
    height = THREE.MathUtils.lerp(0.03, height, Math.pow(t, 2.5));
  }
  
  return height;
}

export class GameRenderer {
  private scene: THREE.Scene;
  private vfxInstances: VFXEffect[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  // Helper to draw a beautifully structured, zoned fantasy map (like classic Ragnarok Online fields)
  createGroundMap() {
    // CAPA 1: TERRENO BASE SEAMLESS Y CONTINUO DE CALIDAD CELESTIAL
    // Generamos un plano de gran resolución para evitar bordes o polígonos ásperos
    const groundGeo = new THREE.PlaneGeometry(200, 200, 160, 160);
    
    const pos = groundGeo.attributes.position;
    const colors = [];
    
    // Configuración de direcciones de caminos para cálculo procedimental continuo
    const pathDirections = [
      { dx: 1.0, dz: 1.0 },   // Sureste (Prontera Field)
      { dx: -1.0, dz: -1.0 }, // Noroeste (Monte Praderas)
      { dx: 0, dz: -1.4 },    // Norte (Montañas Cresta)
      { dx: 0, dz: 1.4 }      // Sur (Paso del Pantano)
    ];

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const zPlane = pos.getY(i); // getY corresponde a la coordenada Z antes de rotar
      const distFromCenter = Math.sqrt(x * x + zPlane * zPlane);
      
      const height = getTerrainHeight(x, zPlane);
      pos.setZ(i, height); // Aplica altura Y local

      // 1. BASE: Césped variado estilo Campo de Prontera con ruido multifrecuencia orgánico
      const grassNoise1 = Math.sin(x * 0.12) * Math.cos(zPlane * 0.12);
      const grassNoise2 = Math.sin(x * 0.35) * Math.sin(zPlane * 0.28);
      const grassNoise3 = Math.sin(x * 0.85) * Math.cos(zPlane * 0.85);
      
      let baseR = 0.22 + grassNoise1 * 0.035 + grassNoise2 * 0.015 + grassNoise3 * 0.01;
      let baseG = 0.44 + grassNoise1 * 0.055 + grassNoise2 * 0.035 + grassNoise3 * 0.015;
      let baseB = 0.24 + grassNoise1 * 0.025 + grassNoise2 * 0.010 + grassNoise3 * 0.008;

      // Parches de tréboles verde esmeralda brillante
      const cloverNoise = Math.sin(x * 0.65) * Math.cos(zPlane * 0.65);
      if (cloverNoise > 0.62) {
        baseR = THREE.MathUtils.lerp(baseR, 0.24, 0.55);
        baseG = THREE.MathUtils.lerp(baseG, 0.54, 0.55);
        baseB = THREE.MathUtils.lerp(baseB, 0.28, 0.55);
      }

      // Parches de dientes de león silvestres amarillos dorados
      const dandelionNoise = Math.sin((x + 12) * 0.95) * Math.sin((zPlane - 8) * 0.95);
      if (dandelionNoise > 0.84) {
        baseR = THREE.MathUtils.lerp(baseR, 0.76, 0.45);
        baseG = THREE.MathUtils.lerp(baseG, 0.70, 0.45);
        baseB = THREE.MathUtils.lerp(baseB, 0.26, 0.45);
      }

      // Efecto suelo seco o campos otoñales en franja
      const dryFieldNoise = Math.cos((x - 25) * 0.05) * Math.sin((zPlane + 35) * 0.07);
      if (dryFieldNoise > 0.44) {
        baseR += dryFieldNoise * 0.035;
        baseG += dryFieldNoise * 0.012;
        baseB -= dryFieldNoise * 0.018;
      }

      // 2. MONTAÑAS DE LOS LÍMITES: Transición a piedra musgosa y risco oscuro en cercanías del límite (dist > 42)
      if (distFromCenter > 42.0) {
        const mountainFactor = Math.min(1.0, (distFromCenter - 42.0) / 38.0);
        // Colores de risco gris pedregoso
        const rockR = 0.32 + Math.sin(x * 0.25) * 0.03;
        const rockG = 0.34 + Math.cos(zPlane * 0.25) * 0.03;
        const rockB = 0.35 + Math.sin(x * 0.15) * 0.02;
        
        baseR = THREE.MathUtils.lerp(baseR, rockR, mountainFactor);
        baseG = THREE.MathUtils.lerp(baseG, rockG, mountainFactor);
        baseB = THREE.MathUtils.lerp(baseB, rockB, mountainFactor);

        // Sombras en fisuras escarpadas
        if (Math.sin(x * 0.32) * Math.cos(zPlane * 0.32) > 0.18) {
          baseR *= 0.75;
          baseG *= 0.80;
          baseB *= 0.75;
        }
      }

      // 3. CAMINOS DE TIERRA: Cálculo de cercanía procedimental continua y mezcla suave
      let minDistToRoadSq = Infinity;
      for (let sIdx = 0; sIdx < pathDirections.length; sIdx++) {
        const dir = pathDirections[sIdx];
        // Muestreamos puntos de la curva sinusoidemente continua del camino
        for (let step = 0; step <= 28; step++) {
          const progress = 14.0 + step * 1.5;
          const wave = Math.sin(progress * 0.22) * 1.6;
          
          let pathX = dir.dx * progress;
          let pathZ = dir.dz * progress;
          if (dir.dx !== 0 && dir.dz !== 0) {
            pathX += -dir.dz * wave * 0.5;
            pathZ += dir.dx * wave * 0.5;
          } else if (dir.dx === 0) {
            pathX += wave;
          } else {
            pathZ += wave;
          }
          
          const dx_ = x - pathX;
          const dz_ = zPlane - pathZ;
          const dSq = dx_ * dx_ + dz_ * dz_;
          if (dSq < minDistToRoadSq) {
            minDistToRoadSq = dSq;
          }
        }
      }

      const distToRoad = Math.sqrt(minDistToRoadSq);
      
      // Color tierra arcillosa cálida de Prontera
      const roadR = 0.45 + Math.sin(x * 12) * Math.cos(zPlane * 12) * 0.022;
      const roadG = 0.36 + Math.sin(x * 12) * Math.cos(zPlane * 12) * 0.016;
      const roadB = 0.27 + Math.sin(x * 12) * Math.cos(zPlane * 12) * 0.012;

      // Suavizado e interpolación de los bordes del camino de tierra
      const pathAlpha = 1.0 - THREE.MathUtils.smoothstep(distToRoad, 1.5, 3.4);
      
      let finalR = THREE.MathUtils.lerp(baseR, roadR, pathAlpha);
      let finalG = THREE.MathUtils.lerp(baseG, roadG, pathAlpha);
      let finalB = THREE.MathUtils.lerp(baseB, roadB, pathAlpha);

      // 4. PLAZA CENTRAL (Cobblestones): Coloreado de adoquines integrados (reemplaza planos superpuestos)
      if (distFromCenter < 16.5) {
        const plazaAlpha = 1.0 - THREE.MathUtils.smoothstep(distFromCenter, 15.0, 16.5);
        
        // Patrón modular de ladrillos tallados en vertex colors
        const brickPattern = Math.sin(x * 0.8) * Math.cos(zPlane * 0.8) > 0;
        const cobblestoneR = 0.28 + (brickPattern ? 0.03 : -0.03);
        const cobblestoneG = 0.32 + (brickPattern ? 0.03 : -0.03);
        const cobblestoneB = 0.38 + (brickPattern ? 0.02 : -0.02);

        // Borde rúnico del perímetro (frost blue runic gem trim)
        if (distFromCenter >= 15.4 && distFromCenter <= 16.4) {
          const gemIntensity = 1.0 - Math.abs(distFromCenter - 15.9) / 0.5;
          const runeR = 0.48;
          const runeG = 0.68;
          const runeB = 0.82;
          finalR = THREE.MathUtils.lerp(finalR, runeR, plazaAlpha * gemIntensity);
          finalG = THREE.MathUtils.lerp(finalG, runeG, plazaAlpha * gemIntensity);
          finalB = THREE.MathUtils.lerp(finalB, runeB, plazaAlpha * gemIntensity);
        } else {
          finalR = THREE.MathUtils.lerp(finalR, cobblestoneR, plazaAlpha);
          finalG = THREE.MathUtils.lerp(finalG, cobblestoneG, plazaAlpha);
          finalB = THREE.MathUtils.lerp(finalB, cobblestoneB, plazaAlpha);
        }
      }

      // 5. SANTUARIO DEL BOSS / ALTAR (Noreste): Altar integrado y círculo de runas
      const distToBossLair = Math.sqrt((x - 48) ** 2 + (zPlane - (-48)) ** 2);
      if (distToBossLair < 25.0) {
        const bossAltarAlpha = 1.0 - THREE.MathUtils.smoothstep(distToBossLair, 23.0, 25.0);
        
        // Piedra basáltica oscura tallada
        const bossStonePattern = Math.sin(x * 0.7) * Math.cos(zPlane * 0.7) > 0;
        const bossStoneR = 0.20 + (bossStonePattern ? 0.025 : -0.025);
        const bossStoneG = 0.22 + (bossStonePattern ? 0.025 : -0.025);
        const bossStoneB = 0.26 + (bossStonePattern ? 0.020 : -0.020);

        // Círculo rúnico rústico esmeralda (glowing mossy rune circle)
        if (distToBossLair >= 23.4 && distToBossLair <= 24.4) {
          const bossRuneIntensity = 1.0 - Math.abs(distToBossLair - 23.9) / 0.5;
          const bossRuneR = 0.45;
          const bossRuneG = 0.68;
          const bossRuneB = 0.41;
          finalR = THREE.MathUtils.lerp(finalR, bossRuneR, bossAltarAlpha * bossRuneIntensity);
          finalG = THREE.MathUtils.lerp(finalG, bossRuneG, bossAltarAlpha * bossRuneIntensity);
          finalB = THREE.MathUtils.lerp(finalB, bossRuneB, bossAltarAlpha * bossRuneIntensity);
        } else {
          finalR = THREE.MathUtils.lerp(finalR, bossStoneR, bossAltarAlpha);
          finalG = THREE.MathUtils.lerp(finalG, bossStoneG, bossAltarAlpha);
          finalB = THREE.MathUtils.lerp(finalB, bossStoneB, bossAltarAlpha);
        }
      }

      colors.push(finalR, finalG, finalB);
    }
    
    groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    groundGeo.computeVertexNormals();
    
    const groundMat = new THREE.MeshStandardMaterial({
      roughness: 0.94,
      metalness: 0.0,
      vertexColors: true, // Habilita el mezclado rústico, orgánico y continuo por vértices
    });
    
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.scene.add(ground);
    
    // NOTA DE ARQUITECTURA: Se han eliminado por completo "detailMesh", "plaza", "border",
    // "pathMesh", "volcanicPatch" y "brimstone" correspondientes a planos 2D separados y flotantes,
    // garantizando un terreno continuo libre de parpadeos ("flickering"), vacíos blancos, terreno flotante o repeticiones.

    // 6. Runic Portal Disc at Central Plaza (0, 0) - Efecto mágico flotante seguro holográfico
    const portalGeo = new THREE.RingGeometry(2.5, 3.0, 32);
    const portalMat = new THREE.MeshBasicMaterial({
      color: 0x88c0d0, // Portal azulado gélido
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45
    });
    const portal = new THREE.Mesh(portalGeo, portalMat);
    portal.rotation.x = -Math.PI / 2;
    portal.position.set(0, 0.06, 0); // Ligeramente levantado y plano
    this.scene.add(portal);
    
    // 7. Mystic Sapphire Crystal and Pedestal (Center plaza)
    const crystalGeo = new THREE.OctahedronGeometry(1.2, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x81a1c1,
      emissive: 0x5e81ac,
      roughness: 0.05,
      metalness: 0.95,
      transparent: true,
      opacity: 0.85
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.set(0, 3.5, -4.5);
    crystal.castShadow = true;
    this.scene.add(crystal);
    
    const pedestalGeo = new THREE.CylinderGeometry(0.75, 1.0, 2.0, 8);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x4c566a,
      roughness: 0.65
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.set(0, 1.04, -4.5);
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    this.scene.add(pedestal);
    
    // Keep reference to animate crystal in render tick
    (this as any)._plazaCrystal = crystal;
    
    // 8. Overgrown Relic Portal Gateway (Snug at Baphomet's moss-plateau)
    const torusGeo = new THREE.TorusGeometry(2.3, 0.22, 16, 100);
    const torusMat = new THREE.MeshBasicMaterial({
      color: 0x5e81ac, // deep north twilight blue ring
      transparent: true,
      opacity: 0.85
    });
    const dungeonPortal = new THREE.Mesh(torusGeo, torusMat);
    dungeonPortal.position.set(48, getTerrainHeight(48, -48) + 2.6, -48); 
    dungeonPortal.rotation.y = Math.PI / 4; // oriented diagonally
    this.scene.add(dungeonPortal);
    
    // Black core vortex inside the portal torus
    const coreGeo = new THREE.RingGeometry(0, 2.0, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x2e3440, // dark charcoal black abyss
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.copy(dungeonPortal.position);
    coreMesh.rotation.copy(dungeonPortal.rotation);
    this.scene.add(coreMesh);
    
    // Keep reference to animate
    (this as any)._dungeonPortal = dungeonPortal;
    (this as any)._dungeonPortalCore = coreMesh;
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
        else if (entity.job === 'Novice') spriteUrl = 'https://raw.githubusercontent.com/Leemonztuff/gameassets/main/Characters/novice_f.png';

        const spriteImg = getOrLoadCachedImage(spriteUrl);
        if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
          const sw = spriteImg.naturalWidth;
          const sh = spriteImg.naturalHeight;
          if (sw > 300) {
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
      if (entity.npcType === 'kafra') spriteUrl = 'https://raw.githubusercontent.com/Leemonztuff/gameassets/main/Characters/F/1/merchant_.png';
      else if (entity.npcType === 'crusader_instructor') spriteUrl = 'https://raw.githubusercontent.com/Leemonztuff/gameassets/main/Characters/F/2-1/knight_.png';
      
      let drewCustomSprite = false;
      if (spriteUrl) {
        const spriteImg = getOrLoadCachedImage(spriteUrl);
        if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
             const sw = spriteImg.naturalWidth;
             const sh = spriteImg.naturalHeight;
             const drawH = 80;
             const drawW = 80;
             const drawX = -drawW / 2;
             const drawY = 42 - drawH + 10 - bounceY; // offset slightly down
             ctx.drawImage(spriteImg, 0, 0, sw, sh, drawX, drawY, drawW, drawH);
             drewCustomSprite = true;
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

      const bounceY = 0; // Completely offloaded to spring-damper matrix transform!
      const squashIdx = 1.0; // Handled dynamically in physics metrics scaling!

      if (entity.mobType === 'poring') {
         // CUTE JELLY PINK PORING! (A bouncing squishy blob)
         ctx.fillStyle = hitColor || '#fda4af'; // light rosy pink
         ctx.beginPath();
         // Squishy scaling
         ctx.ellipse(0, 24 - bounceY, 24 * squashIdx, 20 / squashIdx, 0, 0, Math.PI * 2);
         ctx.fill();

        // Blush cheeks
        if (!isDead) {
          ctx.fillStyle = 'rgba(244, 63, 94, 0.5)';
          ctx.beginPath();
          ctx.arc(-12, 26 - bounceY, 4, 0, Math.PI * 2);
          ctx.arc(12, 26 - bounceY, 4, 0, Math.PI * 2);
          ctx.fill();

          // Black beaded eyes
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(-7, 20 - bounceY, 2.5, 0, Math.PI * 2);
          ctx.arc(7, 20 - bounceY, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Cute smile
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 24 - bounceY, 3, 0, Math.PI);
          ctx.stroke();
        }
      } else if (entity.mobType === 'poporing') {
        // GREEN SQUISHY POPORING! (With small toxic leaf crown)
        ctx.fillStyle = hitColor || '#4ade80'; // soft poison green
        ctx.beginPath();
        const squashIdx = isDead ? 0.4 : 1.05;
        ctx.ellipse(0, 24 - bounceY, 24 * squashIdx, 20 / squashIdx, 0, 0, Math.PI * 2);
        ctx.fill();

        if (!isDead) {
          // Leaf hat!
          ctx.fillStyle = '#15803d'; // dark leaf
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
    this.scene.add(sprite);
    this.vfxInstances.push({ id: `vfx_${Math.random()}`, type: 'damage_number', mesh: sprite, age: 0, maxAge: 30, speed: 0.05, active: true });
  }

  tickVFX(dt: number) {
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
        this.vfxInstances.splice(i, 1);
      }
    }
  }
}
