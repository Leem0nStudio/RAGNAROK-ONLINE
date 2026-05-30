import { Entity, Projectile, GroundItem, JobClass, Skill } from './types';
import { useGameStore } from './state';
import { gameAudio } from './audio';

// Command pattern definitions for modularity and multiplayer networking preparedness
export interface WorldCommand {
  type: 'player_move' | 'use_skill' | 'use_item' | 'npc_interact' | 'respawn';
  payload: any;
}

/**
 * 1. HIGH-PERFORMANCE UNIFORM GRID STATIC/DYNAMIC SPATIAL PARTITIONING
 * Divides the (x, z) coordinate plane into 8x8 meter bucketing sectors.
 * Greatly reduces expensive broad-phase search complexity from O(N^2) to near O(1) inside active areas,
 * directly targeting mobile browser processor budget savings.
 */
export class SpatialGrid {
  private cellSize: number;
  private cells: Map<string, Set<Entity>>;

  constructor(cellSize: number = 8) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  private getCellKey(x: number, z: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx},${cz}`;
  }

  // Clear all cell registers
  public clear() {
    this.cells.clear();
  }

  // Register an active entity into the grid indexes
  public insert(entity: Entity) {
    const key = this.getCellKey(entity.x, entity.z);
    if (!this.cells.has(key)) {
      this.cells.set(key, new Set());
    }
    this.cells.get(key)!.add(entity);
  }

  // Desynchronize an entity's position from the grid
  public remove(entity: Entity): boolean {
    const key = this.getCellKey(entity.x, entity.z);
    const cell = this.cells.get(key);
    if (cell) {
      const deleted = cell.delete(entity);
      if (cell.size === 0) {
        this.cells.delete(key);
      }
      return deleted;
    }
    return false;
  }

  // Highly optimal cell traversal when coordinates change
  public updateEntityPosition(entity: Entity, oldX: number, oldZ: number) {
    const oldKey = this.getCellKey(oldX, oldZ);
    const newKey = this.getCellKey(entity.x, entity.z);

    if (oldKey !== newKey) {
      const oldCell = this.cells.get(oldKey);
      if (oldCell) {
        oldCell.delete(entity);
        if (oldCell.size === 0) this.cells.delete(oldKey);
      }
      if (!this.cells.has(newKey)) {
        this.cells.set(newKey, new Set());
      }
      this.cells.get(newKey)!.add(entity);
    }
  }

  // Queries all entities situated within a query radius
  public queryRadius(centerX: number, centerZ: number, radius: number): Entity[] {
    const result: Entity[] = [];
    const minCellX = Math.floor((centerX - radius) / this.cellSize);
    const maxCellX = Math.floor((centerX + radius) / this.cellSize);
    const minCellZ = Math.floor((centerZ - radius) / this.cellSize);
    const maxCellZ = Math.floor((centerZ + radius) / this.cellSize);

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cz = minCellZ; cz <= maxCellZ; cz++) {
        const key = `${cx},${cz}`;
        const cell = this.cells.get(key);
        if (cell) {
          cell.forEach(entity => {
            const dx = entity.x - centerX;
            const dz = entity.z - centerZ;
            const distSq = dx * dx + dz * dz;
            if (distSq <= radius * radius) {
              result.push(entity);
            }
          });
        }
      }
    }
    return result;
  }
}

/**
 * 2. MODULAR WORLD RUNTIME ENGINE SIMULATION CLASS
 * Orchestrates complete physics, path tracking, AI behaviors, entity lifecycles, and combat.
 * Completely detached from Three.js graphics to maintain architectural integrity and networking flexibility.
 */
export class WorldRuntime {
  public entities: Map<string, Entity> = new Map();
  public projectiles: Projectile[] = [];
  public groundItems: GroundItem[] = [];
  
  // High performance spatial broadcaster
  public grid: SpatialGrid = new SpatialGrid(6);

  // Command buffer queue (Multiplayer/Command execution framework)
  private commandQueue: WorldCommand[] = [];

  // Callbacks for hooks out to the renderer (decoupled visualization)
  private onEntitySpawn: ((entity: Entity) => void) | null = null;
  private onEntityDespawn: ((entityId: string) => void) | null = null;
  private onCombatHit: ((attacker: Entity, target: Entity, dmg: number, isCrit: boolean, skillName?: string) => void) | null = null;
  private onLootDrop: ((item: GroundItem) => void) | null = null;
  private onAudioTrigger: ((action: string) => void) | null = null;

  constructor() {}

  // Set visual callback hooks
  public setCallbacks(hooks: {
    onEntitySpawn?: (entity: Entity) => void;
    onEntityDespawn?: (entityId: string) => void;
    onCombatHit?: (attacker: Entity, target: Entity, dmg: number, isCrit: boolean, skillName?: string) => void;
    onLootDrop?: (item: GroundItem) => void;
    onAudioTrigger?: (action: string) => void;
  }) {
    if (hooks.onEntitySpawn) this.onEntitySpawn = hooks.onEntitySpawn;
    if (hooks.onEntityDespawn) this.onEntityDespawn = hooks.onEntityDespawn;
    if (hooks.onCombatHit) this.onCombatHit = hooks.onCombatHit;
    if (hooks.onLootDrop) this.onLootDrop = hooks.onLootDrop;
    if (hooks.onAudioTrigger) this.onAudioTrigger = hooks.onAudioTrigger;
  }

  // --- ENTITY LIFECYCLE MANAGEMENT ---
  
  public getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  public getPlayer(): Entity | undefined {
    return this.getEntity('player_main');
  }

  public registerEntity(entity: Entity) {
    this.entities.set(entity.id, entity);
    this.grid.insert(entity);
    if (this.onEntitySpawn) {
      this.onEntitySpawn(entity);
    }
  }

  public deregisterEntity(id: string) {
    const entity = this.entities.get(id);
    if (entity) {
      this.grid.remove(entity);
      this.entities.delete(id);
      if (this.onEntityDespawn) {
        this.onEntityDespawn(id);
      }
    }
  }

  public clearAll() {
    this.entities.clear();
    this.projectiles = [];
    this.groundItems = [];
    this.grid.clear();
  }

  // --- ENQUEUE COMMANDS ---
  public enqueueCommand(cmd: WorldCommand) {
    this.commandQueue.push(cmd);
  }

  // --- MAIN LOOP UPDATE SIMULATION ---
  public update(dt: number, now: number) {
    // 1. Flush and execute commands sent to the runtime
    this.processCommandQueue(now);

    // 2. Clear out completely dissolved/decayed remnants
    this.reapDecayedEntities(now);

    // 3. Update spatial references of active bodies
    this.synchronizeGrid();

    // 4. Circular Collision Pushback (Resolving model crowd overlapping)
    this.resolvePhysicalOverlaps(dt);

    // 5. Run AI Decision trees (Sensors -> Behavior Trees for roamers)
    this.tickAI(now, dt);

    // 6. Projectiles Flight physics simulation and impact triggers
    this.tickProjectiles(dt);

    // 7. Ground items bouncing and loot pickups
    this.tickGroundItems(dt);
  }

  // --- PROCESS INCOMING ACTION PACKETS ---
  private processCommandQueue(now: number) {
    while (this.commandQueue.length > 0) {
      const cmd = this.commandQueue.shift()!;
      switch (cmd.type) {
        case 'player_move': {
          const player = this.getPlayer();
          if (player && player.state !== 'death') {
            player.targetX = cmd.payload.x;
            player.targetZ = cmd.payload.z;
            player.state = 'move';
          }
          break;
        }
        case 'respawn': {
          const player = this.getPlayer();
          if (player) {
            player.state = 'idle';
            player.x = 0;
            player.z = 0;
            player.currentHp = player.maxHp;
            player.currentSp = player.maxSp;
            player.targetEntityId = null;
            player.targetX = undefined;
            player.targetZ = undefined;
          }
          break;
        }
        // Easy expansion for multiplayer action validation goes here...
      }
    }
  }

  // --- COMPACT SPATIAL GRID ALIGNMENT ---
  private synchronizeGrid() {
    Array.from(this.entities.values()).forEach(entity => {
      if (entity.state === 'death') return;
      
      const lastX = (entity as any)._lastGridX ?? entity.x;
      const lastZ = (entity as any)._lastGridZ ?? entity.z;

      if (lastX !== entity.x || lastZ !== entity.z) {
        this.grid.updateEntityPosition(entity, lastX, lastZ);
        (entity as any)._lastGridX = entity.x;
        (entity as any)._lastGridZ = entity.z;
      }
    });
  }

  /**
   * 3. REALTIME CIRCULAR PENETRATION RESOLVER
   * Resolves physical collision intersections between roamers and local bodies.
   * Creates a highly organic crowding feedback where monsters bounce off and slide next to one another.
   */
  private resolvePhysicalOverlaps(dt: number) {
    const list = Array.from(this.entities.values()).filter(e => e.state !== 'death');
    const radius = 0.65; // physical envelope threshold
    const pushForce = 0.55 * (dt * 60.0);

    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        
        // NPC entities are physically locked solid static anchors
        if (a.type === 'npc' && b.type === 'npc') continue;

        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const distSq = dx * dx + dz * dz;
        const minDist = a.type === 'boss_mvp' || b.type === 'boss_mvp' ? 1.85 : (radius * 2);

        if (distSq < minDist * minDist && distSq > 0.001) {
          const dist = Math.sqrt(distSq);
          const overlap = minDist - dist;

          // Unit vectors
          const ux = dx / dist;
          const uz = dz / dist;

          // Push them apart gently
          const pushDistance = overlap * pushForce * 0.45;
          
          if (a.type !== 'npc') {
            a.x -= ux * pushDistance;
            a.z -= uz * pushDistance;
          }
          if (b.type !== 'npc') {
            b.x += ux * pushDistance;
            b.z += uz * pushDistance;
          }
        }
      }
    }
  }

  /**
   * 4. DECOUPLED MODULAR AI STATE MACHINERY
   * Updates state trees for both Monsters and NPCs.
   * - Monsters patrol, search for targets, pursue/chase aggressively, attack on sight,
   *   and panic-flee in a run-away vector with screams when HP falls below 25%.
   * - NPCs perform leisurely pacing routines around their spawn points, face the player,
   *   and display speech chat-bubbles with custom dialogue when players approach.
   */
  private tickAI(now: number, dt: number) {
    const player = this.getPlayer();
    const tickScale = dt * 60.0;

    Array.from(this.entities.values()).forEach(entity => {
      if (entity.state === 'death') return;

      // --- NPC INTERACTION AND WANDER ROUTINES ---
      if (entity.type === 'npc') {
        // Initialize NPC spawning Anchors
        if (entity.spawnX === undefined || entity.spawnZ === undefined) {
          entity.spawnX = entity.x;
          entity.spawnZ = entity.z;
          entity.npcWanderTimer = now + Math.random() * 5000 + 3000;
          entity.lastChatTime = 0;
        }

        // 1. Slow Leisure pacing checks: every few seconds, stroll around spawn point
        if (now > (entity.npcWanderTimer || 0)) {
          if (Math.random() < 0.35) {
            entity.state = 'move';
            entity.targetX = entity.spawnX + (Math.random() - 0.5) * 5;
            entity.targetZ = entity.spawnZ + (Math.random() - 0.5) * 5;
          } else {
            entity.state = 'idle';
          }
          entity.npcWanderTimer = now + 6000 + Math.random() * 9000;
        }

        // Translate slow strolling coords
        if (entity.state === 'move' && entity.targetX !== undefined && entity.targetZ !== undefined) {
          const mdx = entity.targetX - entity.x;
          const mdz = entity.targetZ - entity.z;
          const mdist = Math.sqrt(mdx * mdx + mdz * mdz);

          if (mdist > 0.35) {
            entity.facing = mdx > 0 ? 'right' : 'left';
            const strollSpeed = 0.008 * tickScale;
            entity.x += (mdx / mdist) * strollSpeed;
            entity.z += (mdz / mdist) * strollSpeed;
          } else {
            entity.state = 'idle';
            entity.targetX = undefined;
            entity.targetZ = undefined;
          }
        }

        // 2. Proximity check with player: face player and speak!
        if (player && player.state !== 'death') {
          const pdx = player.x - entity.x;
          const pdz = player.z - entity.z;
          const pdist = Math.sqrt(pdx * pdx + pdz * pdz);

          if (pdist < 3.5) {
            // Focus on player, interrupt walking path
            entity.state = 'idle';
            entity.targetX = undefined;
            entity.targetZ = undefined;
            entity.facing = pdx > 0 ? 'right' : 'left';

            // Show interactive speech bubble if timer is cool
            if (now - (entity.lastChatTime || 0) > 14000) {
              entity.lastChatTime = now;
              let dialogue = '';
              if (entity.npcType === 'kafra') {
                const phrases = [
                  "¡Bienvenido a la Corporación Kafra! Servicio con una sonrisa. 😊",
                  "¿Deseas acceder a tus ítems guardados, noble aventurero?",
                  "¡Asegura tus botines! Guarda tus ítems conmigo.",
                  "¡Kafra Clarice está siempre lista para asistirte!"
                ];
                dialogue = phrases[Math.floor(Math.random() * phrases.length)];
              } else if (entity.npcType === 'crusader_instructor') {
                const phrases = [
                  "¡Mantén la guardia alta! Un cruzado jamás muestra debilidad.",
                  "¡Prueba tus combos golpeando los dummies de entrenamiento!",
                  "¡La disciplina de acero guiará tu espada, recluta!",
                  "¡Sube tu nivel para lucir la reluciente Corona de Platino!"
                ];
                dialogue = phrases[Math.floor(Math.random() * phrases.length)];
              } else {
                dialogue = "¡Qué excelente día para aventurarse en Rune-Midgard!";
              }
              entity.sayText = dialogue;
              entity.sayTextEndTime = now + 4200; // Bubble stays active for 4.2 seconds
            }
          }
        }
        return; // Complete NPC logic
      }

      // --- MONSTER AI THINK SYSTEMS ---
      if (entity.type !== 'monster' && entity.type !== 'boss_mvp') return;

      const isStunned = entity.hitRecoveryEndTime > now;
      if (isStunned) return; // Stagger hit lock!

      // Initialize Monster spawn point Anchor
      if (entity.spawnX === undefined || entity.spawnZ === undefined) {
        entity.spawnX = entity.x;
        entity.spawnZ = entity.z;
        entity.lastChatTime = 0;
      }

      const hpPercent = entity.currentHp / entity.maxHp;
      const isMvp = entity.type === 'boss_mvp';

      // 1. COMPORTAMIENTO: HUIR (FLEE STATE)
      // Si tiene menos de 25% de vida y NO es un jefe supremo MVP, se aterroriza y huye
      const isFleeing = hpPercent < 0.25 && !isMvp;

      if (isFleeing && player && player.state !== 'death') {
        const pdx = entity.x - player.x;
        const pdz = entity.z - player.z;
        const pdist = Math.sqrt(pdx * pdx + pdz * pdz);

        // Vector de escape en el sentido contrario al jugador
        const escapeDirX = pdist > 0.01 ? pdx / pdist : (Math.random() - 0.5);
        const escapeDirZ = pdist > 0.01 ? pdz / pdist : (Math.random() - 0.5);

        entity.state = 'move';
        entity.targetX = entity.x + escapeDirX * 6;
        entity.targetZ = entity.z + escapeDirZ * 6;
        entity.facing = escapeDirX > 0 ? 'right' : 'left';

        // Corre súper rápido en pánico (velocidad de retirada acelerada)
        const runFleeSpeed = 0.045 * tickScale;
        entity.x += escapeDirX * runFleeSpeed;
        entity.z += escapeDirZ * runFleeSpeed;

        // Limita los límites del escape a un radio del mapa
        const dSpn = Math.sqrt((entity.x - entity.spawnX) ** 2 + (entity.z - entity.spawnZ) ** 2);
        if (dSpn > 22) {
          // Si huye demasiado lejos, se devuelve vagamente
          entity.x -= escapeDirX * runFleeSpeed * 1.5;
          entity.z -= escapeDirZ * runFleeSpeed * 1.5;
          entity.targetX = entity.spawnX;
          entity.targetZ = entity.spawnZ;
        }

        // Pequeño grito dramático o burbuja de pánico/susto al correr
        if (now - (entity.lastChatTime || 0) > 4000) {
          entity.lastChatTime = now;
          const screams = [
            "¡Aaaah! ¡No me pegues! 😱",
            "¡Sálvese quien pueda! 🏃💨",
            "¡Glup, glup! ¡Ayuda! 😰",
            "¡Demasiado fuerte! ¡Retirada!"
          ];
          entity.sayText = screams[Math.floor(Math.random() * screams.length)];
          entity.sayTextEndTime = now + 1800; // burbuja corta
          if (this.onAudioTrigger) this.onAudioTrigger('item_bounce'); // Sonido divertido
        }
        return; // Termina flujo fleeing
      }

      // 2. COMPORTAMIENTO: PERSEGUIR Y DETECTAR (CHASE & DECTECTION RANGE)
      // Escaneo de proximidad con alerta de agresividad
      const alertRange = isMvp ? 16 : (entity.mobType === 'pecopeco' ? 9.5 : 6);

      if (player && player.state !== 'death') {
        const dx = player.x - entity.x;
        const dz = player.z - entity.z;
        const pDist = Math.sqrt(dx * dx + dz * dz);

        // Agresión de proximidad o retalia por focus id
        const isAggro = entity.targetEntityId === player.id || pDist <= alertRange;

        if (isAggro) {
          entity.targetEntityId = player.id;
          
          // 3. COMPORTAMIENTO: ATACAR (ATTACK STATE TRIGGER)
          const attackReach = isMvp ? 2.5 : 1.5;
          if (pDist <= attackReach) {
            entity.state = 'attack';
            entity.targetX = undefined;
            entity.targetZ = undefined;
            entity.facing = dx > 0 ? 'right' : 'left';
          } else {
            // Fuera de rango de ataque pero en alerta: persecución activa
            entity.state = 'move';
            entity.targetX = player.x;
            entity.targetZ = player.z;
            entity.facing = dx > 0 ? 'right' : 'left';

            const runSpeed = (isMvp ? 0.055 : (entity.mobType === 'pecopeco' ? 0.045 : 0.026)) * tickScale;
            entity.x += (dx / pDist) * runSpeed;
            entity.z += (dz / pDist) * runSpeed;
          }
          return; // Termina persecución agro, salta patrullajes vagos
        }
      }

      // 4. COMPORTAMIENTO: PATRULLAR (STANDARD WANDERING PATROL)
      // Si sale de su radio seguro de spawn (15m), regresa a patrullar su nido
      const distFromSpawn = Math.sqrt((entity.x - entity.spawnX) ** 2 + (entity.z - entity.spawnZ) ** 2);
      if (distFromSpawn > 15.0) {
        entity.state = 'move';
        entity.targetX = entity.spawnX;
        entity.targetZ = entity.spawnZ;
      }

      const wanderTrigger = 0.008 * tickScale;
      if (Math.random() < wanderTrigger && entity.state !== 'move') {
        entity.state = 'move';
        entity.targetX = entity.spawnX + (Math.random() - 0.5) * 15;
        entity.targetZ = entity.spawnZ + (Math.random() - 0.5) * 15;
      }

      // Desplaza mob según patrulla
      if (entity.state === 'move' && entity.targetX !== undefined && entity.targetZ !== undefined) {
        const mdx = entity.targetX - entity.x;
        const mdz = entity.targetZ - entity.z;
        const mdist = Math.sqrt(mdx * mdx + mdz * mdz);

        if (mdist > 0.4e0) {
          entity.facing = mdx > 0 ? 'right' : 'left';
          const walkSpeed = 0.012 * tickScale;
          entity.x += (mdx / mdist) * walkSpeed;
          entity.z += (mdz / mdist) * walkSpeed;
        } else {
          entity.state = 'idle';
          entity.targetX = undefined;
          entity.targetZ = undefined;
        }
      }
    });
  }

  // --- PROJECTILES TICK ENGINE ---
  private tickProjectiles(dt: number) {
    const tickScale = dt * 60.0;
    
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      const target = this.entities.get(proj.targetEntityId);
      const speedScale = proj.speed * tickScale;

      if (!target || target.currentHp <= 0 || target.state === 'death') {
        proj.y -= 0.16 * speedScale;
        if (proj.y <= 0) {
          this.projectiles.splice(i, 1);
        }
        continue;
      }

      const reachOffset = target.type === 'boss_mvp' ? 1.6 : 0.85;
      const tY = target.y + reachOffset;
      const pdx = target.x - proj.x;
      const pdy = tY - proj.y;
      const pdz = target.z - proj.z;
      const pdist = Math.sqrt(pdx * pdx + pdy * pdy + pdz * pdz);

      if (pdist < speedScale * 1.35) {
        // Projectile hit resolves
        this.projectiles.splice(i, 1);
        this.applyTerminalDmg(proj, target);
      } else {
        proj.x += (pdx / pdist) * speedScale;
        proj.y += (pdy / pdist) * speedScale;
        proj.z += (pdz / pdist) * speedScale;
      }
    }
  }

  // Apply terminal projectile calculations
  private applyTerminalDmg(proj: Projectile, target: Entity) {
    const attacker = this.entities.get(proj.ownerEntityId);
    if (!attacker) return;

    target.currentHp = Math.max(0, target.currentHp - proj.damage);
    target.state = 'hit';
    target.hitRecoveryEndTime = performance.now() + 250;

    if (this.onCombatHit) {
      this.onCombatHit(attacker, target, proj.damage, proj.isCrit);
    }
  }

  // --- LOOT BOUNCES AND PICKUPS ---
  private tickGroundItems(dt: number) {
    const player = this.getPlayer();
    const tickScale = dt * 60.0;

    for (let i = this.groundItems.length - 1; i >= 0; i--) {
      const item = this.groundItems[i];

      // Physical bouncing trajectory maths
      if (item.velY !== undefined && item.velX !== undefined && item.velZ !== undefined) {
        const gravity = -0.38;
        item.velY += gravity * tickScale;

        item.x += item.velX * dt;
        item.y += item.velY * dt;
        item.z += item.velZ * dt;

        if (item.y <= 0.05) {
          item.y = 0.05;
          if (item.bounceCount !== undefined && item.bounceCount < 2) {
            item.velY = -item.velY * 0.45;
            item.velX *= 0.5;
            item.velZ *= 0.5;
            item.bounceCount++;
            if (this.onAudioTrigger) this.onAudioTrigger('item_bounce');
          } else {
            item.velY = 0;
            item.velX = 0;
            item.velZ = 0;
          }
        }
      }

      // Auto looting pickup radius detect
      if (player && player.state !== 'death') {
        const dist = Math.sqrt((item.x - player.x) ** 2 + (item.z - player.z) ** 2);
        if (dist < 1.35) {
          this.groundItems.splice(i, 1);
          if (this.onLootDrop) {
            this.onLootDrop(item);
          }
        }
      }
    }
  }

  // --- DISMISS DEAD MONSTERS AFTER DISSOLVING LAPSES ---
  private reapDecayedEntities(now: number) {
    Array.from(this.entities.values()).forEach(entity => {
      if (entity.type === 'player' || entity.type === 'npc') return;
      
      if (entity.state === 'death') {
        if (!(entity as any)._deathTimeStamp) {
          (entity as any)._deathTimeStamp = now;
        }

        const elapsedSinceDeath = now - (entity as any)._deathTimeStamp;
        if (elapsedSinceDeath > 1800) { // 1.8 seconds decay and register wipeout
          this.deregisterEntity(entity.id);
        }
      }
    });
  }
}
