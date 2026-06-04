import * as THREE from 'three';
import { useGameStore } from './state';
import { GameRenderer } from './renderer';
import { gameAudio } from './audio';
import { WorldRuntime } from './worldRuntime';
import { VisualSceneGraph, VisualNode, EntitySpriteNode, CanvasPool } from './sceneGraph';
import { RPGCharacterController } from './characterController';
import { 
  Entity, GroundItem, TouchIndicator, InteractibleDef,
  InputBufferItem, JoystickState, HeadgearId, Projectile, EquipmentSlot, JobClass, InventoryItem
} from './types';
import { rollLoot } from './lootTables';
import { LANDMARKS } from './quests';
import {
  MapLoader, PropLibrary, VegetationSystem, LandmarkSystem,
  LightingManager, MobileOptimizer, DebugPanel, AtmosphereSystem
} from './terrain';
import { MapManager } from './map/MapManager';
import { PortalManager } from './map/PortalManager';
import { MapAudioManager } from './map/MapAudioManager';
import { MAP_INDEX } from './map/worldMaps';
import { NPC_INDEX } from './map/NPCRegistry';
import { getInteractiblesForMap, buildInteractibleEntity } from './map/InteractibleRegistry';
import { CityLifeSystem, getPronteraWalkers } from './city';
import { AmbientParticleSystem, getParticleSourcesForMap } from './ambient/AmbientParticles';
import { getWalkersForMap } from './ambient/ZoneWalkers';
import type { MapDefinition } from './map/types';

export class RagnarokEngine {
  // THREE.js Core
  private container: HTMLDivElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private animationId: number | null = null;
  private isDestroyed = false;

  // World Runtime engine simulator
  private worldRuntime!: WorldRuntime;

  // Render wrapper and helper
  private gameRenderer!: GameRenderer;
  private sceneGraph!: VisualSceneGraph;
  private charController!: RPGCharacterController;

  // Epicearth Terrain Systems
  private propLibrary!: PropLibrary;
  private vegetationSystem!: VegetationSystem;
  private landmarkSystem!: LandmarkSystem;
  private lightingManager!: LightingManager;
  private mapLoader!: MapLoader;
  private mobileOptimizer!: MobileOptimizer;
  private debugPanel!: DebugPanel;
  private atmosphereSystem!: AtmosphereSystem;
  private cityLife!: CityLifeSystem;
  private ambientParticles!: AmbientParticleSystem;
  private portalManager!: PortalManager;
  private mapManager!: MapManager;
  private mapAudioManager = new MapAudioManager();

  // Simulation Entities
  private playerEntity!: Entity;
  private monsters: Entity[] = [];
  private currentZoneMonsterIds: Set<string> = new Set();
  private currentMapNpcIds: Set<string> = new Set();
  private currentMapInteractibleIds: Set<string> = new Set();
  private groundItems: GroundItem[] = [];
  private npcs: Entity[] = [];
  private interactibles: InteractibleDef[] = [];
  private projectiles: Projectile[] = [];
  private interactingNpcId: string | null = null;
  private activeCast: { skillId: string; skillName: string; durationMs: number; elapsedMs: number; targetEntityId: string | null; color: string } | null = null;
  private battleModeEndTime = 0;

  // Visual Lists
  private activeEffects: { id: string; type: string; mesh: THREE.Object3D; age: number; maxAge: number; x: number; z: number }[] = [];
  private floatingTexts: { id: string; text: string; color: string; size: number; x: number; y: number; z: number; velX: number; velY: number; velZ: number; age: number; maxAge: number }[] = [];
  private touchIndicators: { id: string; data: TouchIndicator; mesh: THREE.Mesh }[] = [];

  private static readonly MONSTER_STATS: Record<string, {
    name: string; maxHp: number; exp: number; jobExp: number; size: number;
    isBoss?: boolean; aggressive?: boolean;
    flee: number; def: number; attack: number;
  }> = {
    poring: { name: 'Poring Pink', maxHp: 80, exp: 12, jobExp: 10, size: 1.0, flee: 5, def: 2, attack: 18 },
    pecopeco: { name: 'PecoPeco Runner', maxHp: 380, exp: 90, jobExp: 75, size: 1.3, aggressive: true, flee: 30, def: 15, attack: 45 },
    lunatic: { name: 'Lunático Saltarín', maxHp: 55, exp: 8, jobExp: 6, size: 0.8, flee: 8, def: 1, attack: 12 },
    fabre: { name: 'Fabre Alado', maxHp: 140, exp: 28, jobExp: 22, size: 0.9, flee: 14, def: 6, attack: 22 },
    chonchon: { name: 'Chonchon Zumbador', maxHp: 160, exp: 32, jobExp: 25, size: 0.9, flee: 16, def: 8, attack: 24 },
    savage_baby: { name: 'Savage Bebé', maxHp: 320, exp: 75, jobExp: 60, size: 1.2, aggressive: true, flee: 22, def: 12, attack: 38 },
    picky: { name: 'Picky Hambriento', maxHp: 250, exp: 55, jobExp: 42, size: 1.0, flee: 12, def: 5, attack: 30 },
    pupa: { name: 'Pupa Dormilona', maxHp: 110, exp: 18, jobExp: 14, size: 0.8, flee: 6, def: 10, attack: 8 },
    mandragora: { name: 'Mandrágora Gigante ★', maxHp: 2500, exp: 400, jobExp: 320, size: 2.0, isBoss: true, aggressive: true, flee: 35, def: 28, attack: 120 },
    drainliar: { name: 'Drainliar Sombrío', maxHp: 350, exp: 65, jobExp: 50, size: 0.9, aggressive: true, flee: 28, def: 8, attack: 42 },
    spore: { name: 'Spore Venenoso', maxHp: 280, exp: 50, jobExp: 38, size: 1.0, flee: 10, def: 12, attack: 35 },
    will_o_wisp: { name: 'Fuego Fatuo', maxHp: 200, exp: 55, jobExp: 42, size: 0.7, flee: 35, def: 4, attack: 48 },
    argiope: { name: 'Argiope Tejedora', maxHp: 500, exp: 80, jobExp: 60, size: 1.3, aggressive: true, flee: 20, def: 18, attack: 50 },
    shining_plant: { name: 'Planta Radiante', maxHp: 400, exp: 70, jobExp: 55, size: 1.1, flee: 8, def: 20, attack: 38 },
    stalker: { name: 'Acechador de Sombras', maxHp: 320, exp: 75, jobExp: 58, size: 0.8, aggressive: true, flee: 40, def: 6, attack: 55 },
    master_drainliar: { name: 'Drainliar Supremo ★', maxHp: 4000, exp: 600, jobExp: 480, size: 2.5, isBoss: true, aggressive: true, flee: 45, def: 22, attack: 110 },
    dark_guardian: { name: 'Guardia Oscuro ★★', maxHp: 6000, exp: 1000, jobExp: 800, size: 2.8, isBoss: true, aggressive: true, flee: 55, def: 35, attack: 150 },
  };

  private effectMeshes: Record<string, THREE.Object3D> = {};
  private _cameraTarget = new THREE.Vector3();
  private groundItemMeshes: Record<string, THREE.Mesh> = {};
  private projectileMeshes: Record<string, THREE.Object3D> = {};

  // Timing Accumulator for Fixed Tick
  private accumulator = 0.0;
  private readonly fixedTimeStep = 1 / 60; // 60 FPS Fixed ticks simulation

  // Raycasting & Pointer variables
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  // Screen shake
  private screenShakeIntensity = 0.0;

  // Active Touches tracking for MULTITOUCH & JOYSTICK
  private activeTouchPoints: Map<number, { startX: number; startY: number; currentX: number; currentY: number; isJoystick: boolean }> = new Map();
  private joystickTouchId: number | null = null;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.initThree();
    this.initWorld();
    this.setupTouchListeners();
    this.setupKeyboardListeners();
    this.animate();
    useGameStore.getState().loadGame();
  }

  // --- UI/HUD Helper Methods ---
  public getMinimapData() {
    const store = useGameStore.getState();
    const currentMapId = store.currentMapId;
    const waypoints: { x: number; z: number }[] = [];
    store.activeQuests.forEach(qId => {
      const progress = store.questProgress[qId];
      if (!progress) return;
      progress.forEach(obj => {
        if (obj.location && obj.current < obj.count && obj.location.mapId === currentMapId) {
          waypoints.push({ x: obj.location.x, z: obj.location.z });
        }
      });
    });
    const currentMap = this.mapManager.getCurrentMap();
    return {
      player: { x: this.playerEntity.x, z: this.playerEntity.z },
      monsters: this.monsters.map(m => ({ x: m.x, z: m.z })),
      waypoints,
      mapId: currentMap?.id ?? null,
      mapName: currentMap?.name ?? null,
      regionId: null,
      regionName: null,
      exits: currentMap ? currentMap.portals.map(p => ({
        x: p.position.x, z: p.position.z,
        targetMapId: p.targetMapId,
        targetMapName: ''
      })) : [],
    };
  }

  private initThree() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Cielo azul media mañana
    this.scene.fog = new THREE.FogExp2(0xc8d8c8, 0.012); // Niebla clara de pradera

    // FOV 40°: compresión isométrica sin perder el horizonte
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    // Altura 9.0, distancia 13.0: horizonte visible, bordes de chunk fuera del encuadre
    this.camera.position.set(0, 9.0, 13.0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Clear container and append
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    this.gameRenderer = new GameRenderer(this.scene);
    this.sceneGraph = new VisualSceneGraph(this.scene);

    // Dynamic resizing
    window.addEventListener('resize', this.handleResize);

    // Lighting now handled by LightingManager in initTerrain()
    // (ambient + directional + hemisphere + fill created there)
  }

  private handleResize = () => {
    if (!this.container || this.isDestroyed) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private setupKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'e' || e.key === 'E') {
        // Priority 1: activate portal if near one
        this.mapManager.activatePortal();

        // Priority 2: talk to nearby NPC
        const store = useGameStore.getState();
        if (store.nearbyNpcId) {
          const npc = this.npcs.find(n => n.id === store.nearbyNpcId);
          if (npc) {
            this.openNpcDialogue(npc);
          }
        }
      }
    });
  }

  // --- 2. GAME WORLD ENTITIES SPAWNER SETUP ---
  private initWorld() {
    // 1. Init Epicearth terrain system (replaces old ground map)
    this.initTerrain();

    // 2. Spawn local Player initial coordinates
    const curStore = useGameStore.getState();
    this.playerEntity = {
      id: 'player_main',
      name: 'Rookie Hero',
      type: 'player',
      job: curStore.jobClass,
      currentHp: curStore.stats.maxHp,
      currentSp: curStore.stats.maxSp,
      maxHp: curStore.stats.maxHp,
      maxSp: curStore.stats.maxSp,
      facing: 'right',
      x: 0,
      y: 0,
      z: 0,
      state: 'idle',
      targetEntityId: null,
      hitRecoveryEndTime: 0,
      animationTimer: 0,
      animationFrame: 0,
      activeEffects: []
    };

    useGameStore.setState({
      currentHp: this.playerEntity.currentHp,
      currentSp: this.playerEntity.currentSp
    });

    this.charController = new RPGCharacterController(this.playerEntity, this.scene);
    const entryMapDef = MAP_INDEX['prontera_city'];
    if (entryMapDef) {
      this.charController.setMapDimensions(entryMapDef.width, entryMapDef.height);
    }

    // 2.5 Init MapManager — world entry = prontera_city
    const entryMap = MAP_INDEX['prontera_city'];
    if (entryMap) {
      this.mapManager.onMapLoadCallback = (mapDef) => {
        this.loadMapContent(mapDef);
        if (this.charController) {
          this.charController.setMapDimensions(mapDef.width, mapDef.height);
        }
        // Place player at map's first spawn point
        const spawn = mapDef.spawns[0];
        if (spawn && this.playerEntity) {
          this.playerEntity.x = spawn.position.x;
          this.playerEntity.z = spawn.position.z;
          this.playerEntity.y = this.getGroundHeight(spawn.position.x, spawn.position.z);
        }
      };
      void this.mapManager.init('prontera_city', 'south_gate_spawn');
    }

    // Instantiate and register active simulation bodies inside spatial buckets
    this.worldRuntime = new WorldRuntime();
    this.worldRuntime.registerEntity(this.playerEntity);
    this.npcs.forEach(n => this.worldRuntime.registerEntity(n));
    this.monsters.forEach(m => this.worldRuntime.registerEntity(m));

    // Set callback to sync audio from runtime updates
    this.worldRuntime.setCallbacks({
      onAudioTrigger: (action) => {
        if (action === 'item_bounce') {
          gameAudio.playItemPickup();
        }
      }
    });

    // Sync render billboards
    this.updateBillboards();
  }

  private despawnCurrentMonsters() {
    if (this.currentZoneMonsterIds.size === 0) return;
    this.monsters = this.monsters.filter(m => {
      if (this.currentZoneMonsterIds.has(m.id)) {
        this.sceneGraph.unlinkEntity(m.id);
        return false;
      }
      return true;
    });
    this.currentZoneMonsterIds.clear();
  }

  private spawnMapMonsters(mapDef: MapDefinition) {
    if (!mapDef.monsters || mapDef.monsters.length === 0) return;
    let idCounter = 0;
    for (const entry of mapDef.monsters) {
      const stats = RagnarokEngine.MONSTER_STATS[entry.monsterId];
      if (!stats) continue;
      const x = entry.position.x;
      const z = entry.position.z;
      const id = `mob_map_${mapDef.id}_${idCounter++}_${Date.now()}`;
      const mob: Entity = {
        id,
        name: stats.name,
        type: stats.isBoss ? 'boss_mvp' : 'monster',
        mobType: entry.monsterId as Entity['mobType'],
        x, y: 0, z,
        spawnX: x, spawnZ: z,
        spawnMapId: mapDef.id,
        facing: Math.random() > 0.5 ? 'right' : 'left',
        state: 'idle',
        currentHp: stats.maxHp,
        currentSp: 10,
        maxHp: stats.maxHp,
        maxSp: 10,
        targetEntityId: null,
        hitRecoveryEndTime: 0,
        animationTimer: 0,
        animationFrame: 0,
        activeEffects: [],
      };
      this.monsters.push(mob);
      this.currentZoneMonsterIds.add(id);
      this.worldRuntime?.registerEntity(mob);
      this.sceneGraph?.linkEntity(mob, {}, this.gameRenderer);
    }
  }

  /** Load terrain, environment, monsters, NPCs, and interactibles for a map */
  private loadMapContent(mapDef: MapDefinition) {
    this.applyMapEnvironment(mapDef);
    this.despawnCurrentMonsters();
    this.spawnMapMonsters(mapDef);
    this.spawnNPCsForMap(mapDef);
    this.spawnInteractiblesForMap(mapDef.id);
    const zoneWalkers = getWalkersForMap(mapDef.id);
    if (zoneWalkers) {
      this.cityLife.loadWalkers(zoneWalkers, mapDef.id);
    } else if (mapDef.id === 'prontera_city') {
      this.cityLife.loadWalkers(getPronteraWalkers(), mapDef.id);
    } else {
      this.cityLife.unloadWalkers();
    }

    this.ambientParticles.loadMap(mapDef.id, getParticleSourcesForMap(mapDef.id));
  }

  /** Apply lighting, atmosphere, and audio for a given map */
  private applyMapEnvironment(mapDef: MapDefinition) {
    this.lightingManager.applyLightingForBiome(mapDef.biome);
    if (this.atmosphereSystem) {
      this.atmosphereSystem.applyMapAmbient(mapDef.biome);
    }
    this.mapAudioManager.crossfadeTo(mapDef.music);
  }

  private spawnNPCsForMap(mapDef: MapDefinition) {
    this.despawnCurrentNPCs();
    // Build NPCs from MapDefinition using registry for metadata
    for (const spawn of mapDef.npcs) {
      const regDef = NPC_INDEX[spawn.npcId];
      const id = spawn.npcId; // Use registry ID directly (e.g. npc_kafra)
      const entity: Entity = {
        id,
        name: regDef?.name ?? spawn.npcId,
        npcType: regDef?.npcType ?? 'quest_giver',
        type: 'npc',
        x: spawn.position.x, y: 0, z: spawn.position.z,
        spawnX: spawn.position.x, spawnZ: spawn.position.z,
        spawnMapId: mapDef.id,
        facing: regDef?.facing ?? 'down',
        state: 'idle',
        targetEntityId: null,
        hitRecoveryEndTime: 0,
        animationTimer: 0,
        animationFrame: 0,
        currentHp: 0, currentSp: 0, maxHp: 0, maxSp: 0,
        activeEffects: [],
      };
      this.npcs.push(entity);
      this.currentMapNpcIds.add(entity.id);
    }
  }

  private despawnCurrentNPCs() {
    if (this.currentMapNpcIds.size === 0) return;
    this.npcs = this.npcs.filter(n => {
      if (this.currentMapNpcIds.has(n.id)) {
        this.sceneGraph.unlinkEntity(n.id);
        return false;
      }
      return true;
    });
    this.currentMapNpcIds.clear();
  }

  private spawnInteractiblesForMap(mapId: string) {
    this.despawnCurrentInteractibles();
    const defs = getInteractiblesForMap(mapId);
    for (const def of defs) {
      const entity = buildInteractibleEntity(def);
      this.interactibles.push(entity);
      this.currentMapInteractibleIds.add(entity.id);
    }
  }

  private despawnCurrentInteractibles() {
    if (this.currentMapInteractibleIds.size === 0) return;
    this.interactibles = this.interactibles.filter(n => !this.currentMapInteractibleIds.has(n.id));
    this.currentMapInteractibleIds.clear();
  }

  // --- 3. INPUT PORTER DELEGATOR & ADVANCED TOUCH CONTROLS ---
  private setupTouchListeners() {
    const el = this.renderer.domElement;

    // Prevent scrolling or zooming bounce behavior on mobile
    const preventDefault = (e: Event) => {
      if (e.cancelable) e.preventDefault();
    };
    el.addEventListener('touchstart', preventDefault, { passive: false });
    el.addEventListener('touchmove', preventDefault, { passive: false });

    // TOUCH START EVENT (Handles joysticks initiation and raycast targeting)
    el.addEventListener('touchstart', (e: TouchEvent) => {
      const rect = el.getBoundingClientRect();
      const store = useGameStore.getState();

      const changedTouches = Array.from(e.changedTouches);
      changedTouches.forEach((t) => {
        const touchX = t.clientX - rect.left;
        const touchY = t.clientY - rect.top;

        // Determine if this touch is on the Left half (Joystick zone) and screen joystick helper is enabled
        const isLeftZone = touchX < rect.width * 0.45;
        const wantsJoystick = store.isJoystickEnabled && isLeftZone && this.joystickTouchId === null;

        if (wantsJoystick) {
          // Bind Joystick anchor center
          this.joystickTouchId = t.identifier;
          this.activeTouchPoints.set(t.identifier, {
            startX: touchX,
            startY: touchY,
            currentX: touchX,
            currentY: touchY,
            isJoystick: true
          });

          // Trigger state
          store.updateJoystick({
            isActive: true,
            startX: touchX,
            startY: touchY,
            currentX: touchX,
            currentY: touchY,
            distance: 0,
            angle: 0,
            normalizedX: 0,
            normalizedY: 0
          });
        } else {
          // This is a targeting / coordinate touch action (Right zone or standard screen clicks)
          this.activeTouchPoints.set(t.identifier, {
            startX: touchX,
            startY: touchY,
            currentX: touchX,
            currentY: touchY,
            isJoystick: false
          });

          // Translate standard touch coords to raycaster coordinates for Raycast clicks
          this.triggerScreenTouchRaycast(touchX, touchY, rect.width, rect.height, 'touch');
        }
      });
    }, { passive: false });

    // TOUCH MOVE DRAG EVENT
    el.addEventListener('touchmove', (e: TouchEvent) => {
      const rect = el.getBoundingClientRect();
      const store = useGameStore.getState();

      Array.from(e.touches).forEach((t) => {
        const touchX = t.clientX - rect.left;
        const touchY = t.clientY - rect.top;

        const info = this.activeTouchPoints.get(t.identifier);
        if (info) {
          info.currentX = touchX;
          info.currentY = touchY;

          if (info.isJoystick) {
            // Update Virtual Joystick Math vector!
            const dx = touchX - info.startX;
            const dy = touchY - info.startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxRadius = 60; // drag boundary radius limit
            const clampedDist = Math.min(distance, maxRadius);

            const angle = Math.atan2(dy, dx);
            const normX = (clampedDist * Math.cos(angle)) / maxRadius;
            const normY = -(clampedDist * Math.sin(angle)) / maxRadius; // invert Y for standard game coordinates

            store.updateJoystick({
              currentX: info.startX + Math.cos(angle) * clampedDist,
              currentY: info.startY + Math.sin(angle) * clampedDist,
              distance: clampedDist,
              angle: angle,
              normalizedX: normX,
              normalizedY: normY
            });
          }
        }
      });
    }, { passive: false });

    // TOUCH END
    el.addEventListener('touchend', (e: TouchEvent) => {
      const store = useGameStore.getState();

      Array.from(e.changedTouches).forEach((t) => {
        if (t.identifier === this.joystickTouchId) {
          // Drop joystick anchors
          this.joystickTouchId = null;
          store.updateJoystick({
            isActive: false,
            normalizedX: 0,
            normalizedY: 0,
            distance: 0
          });
        }
        this.activeTouchPoints.delete(t.identifier);
      });
    }, { passive: false });

    // DESKTOP CURSOR CLICKS HANDLING AS FALLBACK
    el.addEventListener('mousedown', (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const store = useGameStore.getState();

      // If dragging visual joystick on desktop clicks (uncommon fallback)
      const touchX = e.clientX - rect.left;
      const touchY = e.clientY - rect.top;

      this.triggerScreenTouchRaycast(touchX, touchY, rect.width, rect.height, 'mouse');
    });
  }

  // Raycasts touch vectors from screen to Three.js environment coordinates
  private triggerScreenTouchRaycast(screenX: number, screenY: number, width: number, height: number, triggerSrc: 'touch' | 'mouse') {
    if (this.playerEntity.state === 'death') return;

    // Convert pixel to normalized device coordinates (NDC) -1 to 1
    const ndcX = (screenX / width) * 2 - 1;
    const ndcY = -(screenY / height) * 2 + 1;

    this.mouse.set(ndcX, ndcY);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 1. Check intersection with MOB SPRITES first for targeting/combat!
    const spriteArray = Array.from(this.sceneGraph.nodes.values())
      .filter(node => node.id !== 'player_main' && node instanceof EntitySpriteNode)
      .map(node => node.object3D);

    const mobHits = this.raycaster.intersectObjects(spriteArray, true);
    if (mobHits.length > 0) {
      const selectedSprite = mobHits[0].object;
      
      // Walk up parent chain: the hit sprite is a child of EntitySpriteNode's rootGroup
      let hitRoot = selectedSprite.parent;
      let matchedNode: EntitySpriteNode | undefined;
      for (const node of Array.from(this.sceneGraph.nodes.values())) {
        if (node.object3D === hitRoot && node instanceof EntitySpriteNode) {
          matchedNode = node;
          break;
        }
      }

      if (matchedNode && matchedNode.entity.currentHp > 0) {
        if (matchedNode.entity.type === 'monster') {
          // ENQUEUE COMBAT TARGET IN BUFFER INTERFACES
          this.bufferOrEnqueueAction({
            type: 'target',
            targetId: matchedNode.entity.id
          });

          // Spawn visual double-ring lock on the targeted monster
          this.addTouchIndicatorInstance(matchedNode.entity.x, matchedNode.entity.z, 'target');
          return; // Targeted! bypass terrain clicks mapping
        } else if (matchedNode.entity.type === 'npc') {
          // WALK TO FRIENDLY NPC AND INITIATE CONVERSATION
          this.bufferOrEnqueueAction({
            type: 'move',
            coords: { x: matchedNode.entity.x, z: matchedNode.entity.z }
          });

          this.interactingNpcId = matchedNode.entity.id;

          // Spawn locked-on circle beneath the friendly NPC
          this.addTouchIndicatorInstance(matchedNode.entity.x, matchedNode.entity.z, 'target');
          useGameStore.getState().addCombatLog(`Caminando hacia ${matchedNode.entity.name}...`, 'system');
          return;
        }
      }
    }

    // 2. Clicked terrain plane to initiate custom path movement / item looting
    const testPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const worldPoint = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(testPlane, worldPoint)) {
      
      // Let's check proximity to items on ground first
      let clickedItem: GroundItem | null = null;
      for (const item of this.groundItems) {
        const dist = Math.sqrt((item.x - worldPoint.x) ** 2 + (item.z - worldPoint.z) ** 2);
        if (dist < 1.8) {
          clickedItem = item;
          break;
        }
      }

      const store = useGameStore.getState();

      if (clickedItem) {
        // Walk towards loot drop box
        this.bufferOrEnqueueAction({
          type: 'move',
          coords: { x: clickedItem.x, z: clickedItem.z }
        });
        
        // Spawn loot visual indication
        this.addTouchIndicatorInstance(clickedItem.x, clickedItem.z, 'skill');
      } else {
        // Standard walk trigger point!
        this.bufferOrEnqueueAction({
          type: 'move',
          coords: { x: worldPoint.x, z: worldPoint.z }
        });

        // Spawn RO ripple click arrows indicators
        this.addTouchIndicatorInstance(worldPoint.x, worldPoint.z, 'move');
      }
    }
  }

  // --- 4. ADVANCED INPUT BUFFER ENGINE ---
  // Enqueues action in buffer or executes instantly, adhering to fixed simulation frames
  private bufferOrEnqueueAction(action: Omit<InputBufferItem, 'id' | 'timestamp' | 'expiresAt'>) {
    const store = useGameStore.getState();

    // Check if player is stunned, hitting animation recov, or busy
    const now = performance.now();
    const canDoInstantly = this.playerEntity.state !== 'hit' && this.playerEntity.hitRecoveryEndTime < now;

    if (canDoInstantly) {
      this.executeGameAction(action);
    } else {
      // Buffer action queue for smooth input buffering responsiveness
      store.addToInputBuffer(action);
    }
  }

  // Pure state modification delegator based on buffered item type
  private executeGameAction(item: Omit<InputBufferItem, 'id' | 'timestamp' | 'expiresAt'>) {
    const store = useGameStore.getState();

    if (item.type === 'move' && item.coords) {
      // Cancel active casting if we move manually!
      if (this.activeCast) {
        const spellName = this.activeCast.skillName;
        this.activeCast = null;
        useGameStore.setState({ activeCast: null });
        this.floatingTextSpawner('CANCELLED', '#94a3b8', 1.0, this.playerEntity.x, 2.5, this.playerEntity.z);
        store.addCombatLog(`¡[${spellName}] cancelado por movimiento!`, 'system');
        gameAudio.playFail();
      }

      // Begin custom route movement heading
      this.playerEntity.targetX = item.coords.x;
      this.playerEntity.targetZ = item.coords.z;
      this.playerEntity.state = 'move';
      
      // If we move, break existing auto target lock occasionally to feel reactive
      if (!this.playerEntity.targetEntityId) {
        store.setTarget(null);
      }
    } else if (item.type === 'target' && item.targetId) {
      const mob = this.monsters.find(m => m.id === item.targetId);
      if (mob && mob.currentHp > 0) {
        this.playerEntity.targetEntityId = mob.id;
        // Face mob
        this.playerEntity.facing = mob.x < this.playerEntity.x ? 'left' : 'right';

        const mobLevel = Math.max(1, Math.floor(Math.sqrt(mob.maxHp * 0.3)));
        store.setTarget(mob.id, mob.name, mob.currentHp, mob.maxHp, mobLevel, mob.type === 'boss_mvp' ? 'boss_mvp' : 'monster');
        store.addCombatLog(`Target lock: enfocando en [${mob.name}] (LV ${mobLevel})`, 'system');
      }
    } else if (item.type === 'skill' && item.skillId) {
      this.triggerSkillCastExecution(item.skillId);
    }
  }

  // Process the queue buffer items
  private tickInputBuffer(now: number) {
    const store = useGameStore.getState();
    const queue = store.bufferingQueue;
    if (queue.length === 0) return;

    // Reject expired input items from buffer
    const activeValidItems = queue.filter(item => item.expiresAt > now);
    if (activeValidItems.length !== queue.length) {
      useGameStore.setState({ bufferingQueue: activeValidItems });
    }

    if (activeValidItems.length === 0) return;

    // Check if hero state allows consuming next action
    const isPlayerCapable = this.playerEntity.state !== 'hit' && this.playerEntity.hitRecoveryEndTime < now;
    if (isPlayerCapable) {
      // Extract oldest action queue item
      const nextAction = activeValidItems[0];
      this.executeGameAction(nextAction);
      
      // Remove consumed item
      store.removeFromInputBuffer(nextAction.id);
    }
  }

  // --- 5. CAST SKILLS INTERFACE CHASSIS ---
  private triggerSkillCastExecution(skillId: string) {
    const store = useGameStore.getState();
    const skill = store.skills.find(s => s.id === skillId);
    if (!skill) return;

    // Verify SP cost
    if (this.playerEntity.currentSp < skill.spCost) {
      store.addCombatLog(`¡Sin SP para lanzar ${skill.name}! Requiere ${skill.spCost} SP.`, 'system');
      gameAudio.playFail();
      return;
    }

    // Cooldown verification (additional backup check)
    const now = performance.now();
    const lastCast = skill.lastCastTime || 0;
    if (now - lastCast < skill.cooldown) {
      const remaining = Math.ceil((skill.cooldown - (now - lastCast)) / 100) / 10;
      store.addCombatLog(`¡[${skill.name}] está recargando! Restan ${remaining}s.`, 'system');
      return;
    }

    // Determine target coordinates or target lock
    let tx = this.playerEntity.x;
    let tz = this.playerEntity.z;
    let targetMob: Entity | undefined;

    if (this.playerEntity.targetEntityId) {
      targetMob = this.monsters.find(m => m.id === this.playerEntity.targetEntityId);
      if (targetMob && targetMob.currentHp > 0) {
        tx = targetMob.x;
        tz = targetMob.z;
      }
    }

    // Proportional range checking
    const distToTarget = Math.sqrt((tx - this.playerEntity.x) ** 2 + (tz - this.playerEntity.z) ** 2);
    if (targetMob && distToTarget > skill.range) {
      // Pathfind / walk closer to target automatically!
      this.playerEntity.targetX = tx;
      this.playerEntity.targetZ = tz;
      this.playerEntity.state = 'move';
      store.addCombatLog(`[${skill.name}] fuera de rango. Acercándose...`, 'system');
      return; // Stop casting trigger, try again next frame
    }

    // Check if the skill has a cast time configuration
    const castTime = skill.castTime || 0;
    if (castTime > 0) {
      if (this.activeCast) {
        store.addCombatLog(`¡Ya estás chanteando un hechizo!`, 'system');
        return; // Already casting!
      }

      // Spend SP at casting start
      this.playerEntity.currentSp -= skill.spCost;
      skill.lastCastTime = now;

      // Face target
      if (targetMob) {
        this.playerEntity.facing = targetMob.x < this.playerEntity.x ? 'left' : 'right';
      }

      // Interrupt any active move path
      this.playerEntity.targetX = undefined;
      this.playerEntity.targetZ = undefined;
      this.playerEntity.state = 'cast';

      // Record active cast details
      this.activeCast = {
        skillId,
        skillName: skill.name,
        durationMs: castTime,
        elapsedMs: 0,
        targetEntityId: targetMob ? targetMob.id : null,
        color: skill.color
      };

      // Set state in the Zustand store
      useGameStore.setState({
        activeCast: {
          skillId,
          skillName: skill.name,
          durationMs: castTime,
          elapsedMs: 0,
          color: skill.color
        },
        currentSp: this.playerEntity.currentSp
      });

      store.addCombatLog(`Chanteando [${skill.name}]... ¡Tiempo de casteo: ${(castTime / 1000).toFixed(1)}s!`, 'skill');
      return;
    }

    // Successfully initiating instant skill cast!
    this.playerEntity.currentSp -= skill.spCost;
    skill.lastCastTime = now;
    this.completeSkillExecution(skillId, targetMob ? targetMob.id : null);
  }

  // Handle active chanting increments
  private tickActiveCasting(dt: number) {
    if (!this.activeCast) return;

    this.activeCast.elapsedMs += dt * 1000;
    const progress = Math.min(1.0, this.activeCast.elapsedMs / this.activeCast.durationMs);

    useGameStore.setState({
      activeCast: {
        ...this.activeCast,
        elapsedMs: this.activeCast.elapsedMs
      }
    });

    if (this.activeCast.elapsedMs >= this.activeCast.durationMs) {
      const skillId = this.activeCast.skillId;
      const targetId = this.activeCast.targetEntityId;

      this.activeCast = null;
      useGameStore.setState({ activeCast: null });

      this.completeSkillExecution(skillId, targetId);
    }
  }

  // Trigger Combat State / Battle Mode lasting 5 seconds
  private triggerBattleMode(now: number) {
    this.battleModeEndTime = now + 5000;
    useGameStore.setState({ battleMode: true });
  }

  // Core impact execution when a skill succeeds instantly or finishes chanting
  private completeSkillExecution(skillId: string, customTargetId: string | null) {
    const store = useGameStore.getState();
    const skill = store.skills.find(s => s.id === skillId);
    if (!skill) return;

    // Locate target
    let targetMob: Entity | undefined;
    const targetId = customTargetId || this.playerEntity.targetEntityId;
    if (targetId) {
      targetMob = this.monsters.find(m => m.id === targetId);
    }

    let tx = this.playerEntity.x;
    let tz = this.playerEntity.z;
    if (targetMob && targetMob.currentHp > 0) {
      tx = targetMob.x;
      tz = targetMob.z;
    }

    const now = performance.now();

    // Set animation pose
    this.playerEntity.state = 'attack';
    this.playerEntity.hitRecoveryEndTime = now + 400; // Attack posture lock lasts 400ms

    // Enter battle mode (combat state)
    this.triggerBattleMode(now);

    // Trigger visual spell effects and audio synthesized notes
    gameAudio.playSkillCast();
    const fxMesh = this.gameRenderer.createSkillVisualMesh(skillId, tx, tz, 0.05);
    
    this.activeEffects.push({
      id: `fx_skill_${Math.random()}_${now}`,
      type: skillId,
      mesh: fxMesh,
      age: 0,
      maxAge: skillId === 'thunder_storm' ? 45 : 25,
      x: tx,
      z: tz
    });

    // Execute direct combat impacts
    if (skillId === 'heal') {
      // Heal player
      const healAmt = Math.floor(this.playerEntity.maxHp * 0.35 + store.stats.int * 14);
      this.playerEntity.currentHp = Math.min(this.playerEntity.maxHp, this.playerEntity.currentHp + healAmt);
      this.floatingTextSpawner(`+${healAmt}`, '#10b981', 1.8, this.playerEntity.x, 2.5, this.playerEntity.z);
      store.addCombatLog(`Lanzado Heal: +${healAmt} HP recuperados.`, 'heal');
      gameAudio.playHeal();
    } else if (targetMob && targetMob.currentHp > 0) {
      // Offensive skill impacts
      let multiplier = 2.0;
      let logColor: 'skill' | 'system' = 'skill';

      if (skillId === 'bash') multiplier = 4.0 + (store.stats.str * 0.02);
      if (skillId === 'double_strafe') multiplier = 3.5 + (store.stats.dex * 0.035);
      if (skillId === 'sonic_blow') multiplier = 6.0 + (store.stats.str * 0.03);
      if (skillId === 'grimtooth') multiplier = 3.0;
      if (skillId === 'holy_light') multiplier = 2.8 + (store.stats.int * 0.03);
      if (skillId === 'falcon_strike') multiplier = 4.5; // blitz beat ignores defense!

      const useMatk = skillId === 'holy_light';
      const baseStat = useMatk ? store.stats.matk : store.stats.atk;
      const rawDmg = Math.floor((baseStat || 0) * multiplier);
      const randOffset = Math.floor((Math.random() - 0.5) * rawDmg * 0.15);
      const isCrit = !useMatk && Math.random() < (store.stats.luk * 0.005 + 0.05);

      let mobDef = 2;
      if (targetMob && targetMob.mobType) {
        const stats = RagnarokEngine.MONSTER_STATS[targetMob.mobType];
        if (stats) mobDef = stats.def;
      }

      let damage = Math.max(10, rawDmg + randOffset - (skillId === 'falcon_strike' ? 0 : mobDef));
      if (isCrit) damage = Math.floor(damage * 1.5);
      damage = Math.floor(damage);

      if (skillId === 'double_strafe') {
        const halfDmg = Math.floor(damage / 2);
        this.spawnProjectile('arrow', this.playerEntity, targetMob, halfDmg, isCrit);
        setTimeout(() => {
          if (!this.isDestroyed && targetMob && targetMob.currentHp > 0) {
            this.spawnProjectile('arrow', this.playerEntity, targetMob, halfDmg, isCrit);
          }
        }, 180);
        store.addCombatLog(`¡Lanzado ${skill.name}! Disparando flechas de proyectil en ráfaga doble...`, logColor);
      } else if (skillId === 'holy_light') {
        this.spawnProjectile('holy_light', this.playerEntity, targetMob, damage, isCrit);
        store.addCombatLog(`¡Lanzado ${skill.name}! Proyectil sagrado de luz divina en camino...`, logColor);
      } else {
        // Melee / Area instant skills damage application
        targetMob.currentHp = Math.max(0, targetMob.currentHp - damage);
        targetMob.state = 'hit';
        targetMob.hitRecoveryEndTime = now + 350;

        // Float flying damage texts
        this.floatingTextSpawner(
          isCrit ? `★ CRIT ${damage} ★` : `${damage}`, 
          isCrit ? '#f59e0b' : '#38bdf8', 
          isCrit ? 1.5 : 1.0, 
          targetMob.x, 2.2, targetMob.z
        );

        // Play impact audio notes
        gameAudio.playHit();
        this.screenShakeIntensity = isCrit ? 0.45 : 0.14;
        if (isCrit) this.floatingTextSpawner('¡BOOM!', '#f59e0b', 1.5, targetMob.x, 2.8, targetMob.z);

        store.addCombatLog(`¡Lanzado ${skill.name}! Daño propinado: ${damage} HP a [${targetMob.name}].`, logColor);

        // Target update inside state
        store.updateTargetHp(targetMob.currentHp);

        // If dead trigger rewards EXP and loot drops
        if (targetMob.currentHp <= 0) {
          this.reapMonsterRewards(targetMob);
        }
      }
    }

    // Reset store state HUD instantly
    store.setPlayerHpSp(this.playerEntity.currentHp, this.playerEntity.currentSp);
  }

  // --- 6. TICK MONSTER LOGIC & COMBAT ---
  private tickAutoCombat(now: number, dt: number) {
    const store = useGameStore.getState();

    // AUTO-BATTLE: If no target, find the nearest monster in range
    if (store.autoBattle && !this.playerEntity.targetEntityId) {
        const nearestMonster = this.monsters
            .filter(m => m.currentHp > 0)
            .reduce((nearest, m) => {
                const distSq = (m.x - this.playerEntity.x) ** 2 + (m.z - this.playerEntity.z) ** 2;
                if (!nearest || distSq < nearest.distSq) {
                    return { monster: m, distSq };
                }
                return nearest;
            }, null as { monster: Entity, distSq: number } | null);
            
        if (nearestMonster && nearestMonster.distSq < 20 * 20) {
            // Target found!
            this.bufferOrEnqueueAction({
                type: 'target',
                targetId: nearestMonster.monster.id
            });
            this.playerEntity.targetEntityId = nearestMonster.monster.id;
        }
    }

    // Increment player animation timer
    this.playerEntity.animationTimer += dt;

    if (this.playerEntity.state === 'death' || !this.playerEntity.targetEntityId) return;

    const targetMob = this.monsters.find(m => m.id === this.playerEntity.targetEntityId);
    if (!targetMob || targetMob.currentHp <= 0) {
      useGameStore.setState({ targetEntityId: null });
      this.playerEntity.targetEntityId = null;
      return;
    }

    const dist = Math.sqrt((targetMob.x - this.playerEntity.x) ** 2 + (targetMob.z - this.playerEntity.z) ** 2);
    
    // Proportional standard physical reach range
    const isSniper = store.jobClass === 'Sniper';
    const physicalReach = isSniper ? 9.0 : 2.2;

    if (dist <= physicalReach) {
      // Check Attack Speed cooldown (ASPD).
      // RO formula ASPD interval: msCooldown = 1000 * (1.6 - (aspd * 0.008))
      const attackTimerCooldown = Math.max(250, 1000 * (2.2 - (store.stats.aspd * 0.01)));

      if (this.playerEntity.animationTimer > attackTimerCooldown * 0.001) {
        // Attack posture triggers!
        this.playerEntity.state = 'attack';
        this.playerEntity.animationTimer = 0;
        this.playerEntity.hitRecoveryEndTime = now + 300;

        // Enter Battle mode!
        this.triggerBattleMode(now);

        // Lookup monster flee/def from MONSTER_STATS
        const mobStats = targetMob?.mobType ? RagnarokEngine.MONSTER_STATS[targetMob.mobType] : null;
        const mobFlee = mobStats?.flee ?? (targetMob?.type === 'boss_mvp' ? 55 : 5);
        const mobDef = mobStats?.def ?? (targetMob?.type === 'boss_mvp' ? 55 : 2);

        const hitChance = Math.min(1.0, Math.max(0.15, (store.stats.hit - mobFlee + 100) / 200));
        const isHitSucceeded = Math.random() < hitChance;

        if (isHitSucceeded) {
          const rawDmg = store.stats.atk;
          const randOffset = Math.floor((Math.random() - 0.5) * rawDmg * 0.15);
          const isCrit = Math.random() < (store.stats.luk * 0.005 + 0.05);

          let damage = Math.floor(rawDmg + randOffset - mobDef);
          if (isCrit) damage = Math.floor(damage * 1.5);
          damage = Math.max(5, damage);

          if (isSniper) {
            // Sniper fires real-time arrow projectile!
            this.spawnProjectile('arrow', this.playerEntity, targetMob, damage, isCrit);
            store.addCombatLog(`Disparas flecha: ${damage} daño en camino a [${targetMob.name}].`, 'monster_hit');
            store.triggerPlayerAttackPulse();
          } else {
            // Melee instant hit!
            targetMob.currentHp = Math.max(0, targetMob.currentHp - damage);
            targetMob.state = 'hit';
            targetMob.hitRecoveryEndTime = now + 400; // soft hit lock

            this.floatingTextSpawner(
              isCrit ? `★ ${damage} ★` : `${damage}`, 
              isCrit ? '#f59e0b' : '#ef4444', 
              isCrit ? 1.5 : 1.0, 
              targetMob.x, 2.0, targetMob.z
            );

            gameAudio.playHit();
            this.screenShakeIntensity = isCrit ? 0.22 : 0.08;
            store.triggerPlayerAttackPulse();

            store.addCombatLog(`Atacas físicamente: ${damage} daño infligido a [${targetMob.name}].`, 'monster_hit');
            store.updateTargetHp(targetMob.currentHp);

            if (targetMob.currentHp <= 0) {
              this.reapMonsterRewards(targetMob);
            }
          }
        } else {
          // Missed attack!
          this.floatingTextSpawner('MISS', '#94a3b8', 1.0, targetMob.x, 2.0, targetMob.z);
          store.addCombatLog(`Atacas y fallas: golpe esquivado por [${targetMob.name}].`, 'system');
        }
      }
    } else {
      // Target is far, auto-route walk closer to target
      this.playerEntity.targetX = targetMob.x;
      this.playerEntity.targetZ = targetMob.z;
      this.playerEntity.state = 'move';
    }
  }

  // Reap experience base, job levels, and physics loot drops on dead monsters
  private reapMonsterRewards(mob: Entity) {
    const store = useGameStore.getState();
    mob.state = 'death';
    this.playerEntity.targetEntityId = null;
    store.setTarget(null);

    // Give EXP reward points from MONSTER_STATS
    const mobStats = mob.mobType ? RagnarokEngine.MONSTER_STATS[mob.mobType] : null;
    const expBase = mobStats ? mobStats.exp : (mob.type === 'boss_mvp' ? 5000 : 15);
    const expJob = mobStats ? mobStats.jobExp : (mob.type === 'boss_mvp' ? 3500 : 12);

    // Level up visual triggered internally
    const curLevel = store.stats.level;
    const curJobLvl = store.stats.jobLevel;

    store.addExp(expBase, expJob);

    // Grab updated stats reference from global Zustand instance after edit
    const updatedStore = useGameStore.getState();
    const isLeveledUpCombined = updatedStore.stats.level > curLevel || updatedStore.stats.jobLevel > curJobLvl;

    if (isLeveledUpCombined) {
      gameAudio.playLevelUp();
      store.addCombatLog(`✨ ¡PROGRESO NIVEL UP! Has alcanzado Base: ${updatedStore.stats.level} / Job: ${updatedStore.stats.jobLevel} ✨`, 'system');
      
      // Floating level up banner
      this.floatingTextSpawner('★ LEVEL UP ★', '#eab308', 2.2, this.playerEntity.x, 3.2, this.playerEntity.z);

      // Golden fireworks glow cylindrical columns
      const upMesh = this.gameRenderer.createSkillVisualMesh('level_up', this.playerEntity.x, this.playerEntity.z, 0.05);
      this.activeEffects.push({
        id: `fx_lvl_${Math.random()}`,
        type: 'level_up',
        mesh: upMesh,
        age: 0,
        maxAge: 40,
        x: this.playerEntity.x,
        z: this.playerEntity.z
      });

      // Recover player to pristine max stats
      this.playerEntity.currentHp = updatedStore.stats.maxHp;
      this.playerEntity.currentSp = updatedStore.stats.maxSp;
      updatedStore.setPlayerHpSp(this.playerEntity.currentHp, this.playerEntity.currentSp);
    }

    // Zeny drop
    const zenyDrop = mobStats ? Math.floor(Math.random() * (mob.type === 'boss_mvp' ? 200 : 8)) + (mob.type === 'boss_mvp' ? 50 : 2) : 2;
    store.addZeny(zenyDrop);

    // Track quest kill progress
    if (mob.mobType) {
      const mobTypeStr = mob.mobType;
      store.activeQuests.forEach(qId => {
        const progress = store.questProgress[qId];
        if (!progress) return;
        progress.forEach((obj, idx) => {
          if ((obj.type === 'kill' && obj.mobType === mobTypeStr) || 
              (obj.type === 'kill' && !obj.mobType && obj.count > 0)) {
            setTimeout(() => {
              if (this.isDestroyed) return;
              const current = useGameStore.getState();
              current.updateQuestProgress(qId, idx, 1);
            }, 50);
          }
        });
      });
    }

    // Reap loot — collect drop names for notification
    const drops = this.spawnLoot(mob);

    // Floating kill rewards (3D text above corpse)
    this.floatingTextSpawner(`+${expBase} EXP`, '#eab308', 1.2, mob.x, 2.8, mob.z);
    this.floatingTextSpawner(`+${zenyDrop} Zeny`, '#f59e0b', 1.0, mob.x, 2.2, mob.z);

    // Loot feed notification
    const lootLines: string[] = [];
    if (!isLeveledUpCombined) {
      lootLines.push(`+${expBase} EXP, +${expJob} Job`);
    }
    lootLines.push(`+${zenyDrop} Zeny`);
    drops.forEach(d => lootLines.push(`${d.name} x${d.quantity}`));
    store.addLootNotification(lootLines);

    setTimeout(() => {
      if (this.isDestroyed) return;
      this.respawnMonster(mob.id, mob.mobType);
    }, 6000 + Math.random() * 8000);
  }

  private respawnMonster(id: string, customMobType?: string) {
    if (this.isDestroyed) return;
    const index = this.monsters.findIndex(m => m.id === id);
    if (index === -1) return;

    const type: string = customMobType || 'poring';
    const stats = RagnarokEngine.MONSTER_STATS[type] || RagnarokEngine.MONSTER_STATS['poring'];
    const oldMob = this.monsters[index];
    const spawnMapId = oldMob.spawnMapId ?? useGameStore.getState().currentMapId ?? undefined;

    const spawnX = oldMob.spawnX ?? oldMob.x;
    const spawnZ = oldMob.spawnZ ?? oldMob.z;

    // Respawn at fixed spawn position (new arch)
    const x = spawnX + (Math.random() - 0.5) * 4;
    const z = spawnZ + (Math.random() - 0.5) * 4;

    this.monsters[index] = {
      id: id,
      name: stats.name,
      type: stats.isBoss ? 'boss_mvp' : 'monster',
      mobType: type as any,
      x, y: 0, z,
      facing: Math.random() > 0.5 ? 'right' : 'left',
      state: 'idle',
      currentHp: stats.maxHp,
      currentSp: 10,
      maxHp: stats.maxHp,
      maxSp: 10,
      targetEntityId: null,
      hitRecoveryEndTime: 0,
      animationTimer: 0,
      animationFrame: 0,
      spawnX: x, spawnZ: z,
      spawnMapId,
    };

    // Unlink old decayed node and link newly spawned monster instance
    this.sceneGraph.unlinkEntity(id);
    this.sceneGraph.linkEntity(this.monsters[index], {}, this.gameRenderer);

    if (stats.isBoss) {
      useGameStore.getState().addCombatLog(`★ ¡ALERTA! El Boss ${stats.name} ha respawneado ★`, 'mvp');
    }
  }

  private spawnLoot(mob: Entity): { name: string; quantity: number }[] {
    const isMvp = mob.type === 'boss_mvp';
    const totalDrops = isMvp ? 3 : 1;
    const items: { name: string; quantity: number }[] = [];

    for (let d = 0; d < totalDrops; d++) {
      const mobType = mob.mobType || 'poring';
      const result = rollLoot(mobType);
      if (!result) continue;

      const loot: GroundItem = {
        id: `loot_${Math.random()}_${Date.now()}_${d}`,
        name: result.name,
        itemId: result.itemId,
        x: mob.x + (Math.random() - 0.5) * 3,
        z: mob.z + (Math.random() - 0.5) * 3,
        y: 0.2,
        quantity: result.quantity,
        rarity: result.rarity as 'common' | 'rare' | 'epic',
        spawnTime: Date.now(),
        ownerId: this.playerEntity.id,
        velX: (Math.random() - 0.5) * 6,
        velY: 8 + Math.random() * 8,
        velZ: (Math.random() - 0.5) * 6,
        bounceCount: 0
      };

      this.groundItems.push(loot);
      const mesh = this.gameRenderer.spawnDropItemMesh(loot);
      this.groundItemMeshes[loot.id] = mesh;

      items.push({ name: result.name, quantity: result.quantity });
    }
    return items;
  }

  private tickLootSystem(now: number, dt: number) {
      for (let i = this.groundItems.length - 1; i >= 0; i--) {
          const item = this.groundItems[i];
          
          // Ownership timer: after 10s it can be picked up by anyone
          if (now - item.spawnTime > 10000) {
              item.ownerId = undefined;
          }

          // Despawn after 60s
          if (now - item.spawnTime > 60000) {
              this.groundItems.splice(i, 1);
              const mesh = this.groundItemMeshes[item.id];
              if (mesh) {
                  this.scene.remove(mesh);
                  delete this.groundItemMeshes[item.id];
              }
              continue;
          }
      }
  }

  // Spawns flying physics projectile
  spawnProjectile(type: Projectile['type'], owner: Entity, target: Entity, damage: number, isCrit: boolean) {
    const id = `proj_${Math.random()}_${Date.now()}`;
    const projectile: Projectile = {
      id,
      type,
      x: owner.x,
      y: owner.y + 1.1, // launch from center bow height
      z: owner.z,
      speed: type === 'arrow' ? 0.38 : 0.28,
      targetEntityId: target.id,
      ownerEntityId: owner.id,
      damage,
      isCrit,
      spawnTime: Date.now(),
      height: 1.1
    };
    this.projectiles.push(projectile);
  }

  private impactProjectile(proj: Projectile, target: Entity) {
    const store = useGameStore.getState();

    // Damage calculations
    target.currentHp = Math.max(0, target.currentHp - proj.damage);
    target.state = 'hit';
    target.hitRecoveryEndTime = Date.now() + 180;

    // Trigger visual popup numbers
    const isMvp = target.type === 'boss_mvp';
    const numColor = proj.isCrit ? '#fdeb3a' : (target.type === 'player' ? '#f43f5e' : '#38bdf8');
    const scaleFactor = proj.isCrit ? 1.5 : 1.0;
    
    this.floatingTextSpawner(
      `${proj.isCrit ? '⭐ ' : ''}${Math.round(proj.damage)}`,
      numColor,
      scaleFactor,
      target.x,
      target.y + (isMvp ? 2.0 : 1.25),
      target.z
    );

    // Screen shaking feedback
    this.screenShakeIntensity = proj.isCrit ? 0.32 : 0.08;

    gameAudio.playHit();

    // Redraw target animations texture
    this.gameRenderer.createEntityTexture(target, {});

    // Sync HUD stores
    if (store.targetEntityId === target.id) {
      store.updateTargetHp(target.currentHp);
    }

    if (target.currentHp <= 0) {
      // Award experience and roll loot chances
      if (target.type !== 'player') {
        this.reapMonsterRewards(target);
      } else {
        this.executePlayerDeathState();
      }
    }
  }

  private openNpcDialogue(npc: Entity) {
    const store = useGameStore.getState();

    // Track talk quest objectives
    store.activeQuests.forEach(qId => {
      const progress = store.questProgress[qId];
      if (!progress) return;
      progress.forEach((obj, idx) => {
        if (obj.type === 'talk' && obj.targetId === npc.id) {
          store.updateQuestProgress(qId, idx, 1);
        }
      });
    });

    // Handle quest giver NPCs
    if (npc.npcType === 'quest_giver' || npc.npcType === 'guard') {
      const npcQuests = store.quests.filter(q => q.npcGiverId === npc.id && (q.state === 'available' || q.state === 'active'));
      const text = npcQuests.length > 0 
        ? `¡Saludos! ${npc.name}. ¿En qué puedo ayudarte?`
        : 'No tengo misiones para ti ahora. ¡Vuelve más tarde!';
      const options = npcQuests.filter(q => q.state === 'available').map(q => ({
        label: `📜 ${q.name}: ${q.description.substring(0, 40)}${q.description.length > 40 ? '...' : ''}`,
        actionParam: `quest_accept_${q.id}`
      }));
      if (npcQuests.length > 0) {
        const activeQ = npcQuests.find(q => q.state === 'active');
        if (activeQ) {
          const progress = store.questProgress[activeQ.id];
          if (progress) {
            const detail = progress.map((o, i) => `${o.description}: ${o.current}/${o.count}`).join(', ');
            options.unshift({ label: `📋 Progreso: ${detail}`, actionParam: 'close' });
          }
        }
      }
      options.push({ label: 'Cerrar conversación', actionParam: 'close' });
      store.setNpcDialogue({
        npcId: npc.id,
        npcName: npc.name,
        npcType: 'quest_giver',
        text,
        options
      });
      gameAudio.playItemPickup();
      return;
    }
    
    if (npc.npcType === 'kafra') {
      store.setNpcDialogue({
        npcId: npc.id,
        npcName: npc.name,
        npcType: 'kafra',
        text: '¡Hola aventurero! Bienvenido a los servicios premium de la Corporación Kafra en Prontera. ¿Cómo te gustaría que te asista hoy?',
        options: [
          { label: 'Otorga bendiciones divinas (AGI & Blessing Speed buffs)', actionParam: 'buffs' },
          { label: 'Heal: Restaurar HP/SP y recargar Red Potions', actionParam: 'heal' },
          { label: 'Pedir un paquete de Red Potions gratis (+15 pociones)', actionParam: 'buy_potions' },
          { label: '🛒 Abrir tienda', actionParam: 'open_shop' },
          { label: 'Cerrar conversación', actionParam: 'close' }
        ]
      });
    } else if (npc.npcType === 'skill_trainer' || npc.npcType === 'crusader_instructor') {
      const playerJob = store.jobClass;
      const jobLvl = store.stats.jobLevel;
      
      let dialogText = '¡Firme soldado! Quien domina la espada domina el campo de batalla. ¿Te interesa cambiar de clase de trabajo para estudiar nuevas destrezas de combate?';
      let options: { label: string; actionParam: string }[] = [];

      if (playerJob === 'Novice') {
        if (jobLvl >= 10) {
          dialogText = 'Veo que has entrenado duro como Novice. ¡Estás listo para tu primer intercambio de clase! ¿Qué camino eliges?';
          options = [
            { label: 'Convertirme en Swordsman (Espadachín)', actionParam: 'class_swordsman' },
            { label: 'Convertirme en Mage (Mago)', actionParam: 'class_mage' },
            { label: 'Convertirme en Archer (Arquero)', actionParam: 'class_archer' },
            { label: 'Convertirme en Acolyte (Acólito)', actionParam: 'class_acolyte' },
            { label: 'Convertirme en Merchant (Mercader)', actionParam: 'class_merchant' },
            { label: 'Convertirme en Thief (Ladrón)', actionParam: 'class_thief' }
          ];
        } else {
          dialogText = `Veo potencial en ti, pero aún eres un Novice inexperto (Job Lv ${jobLvl}/10). Regresa cuando alcances el Nivel de Job 10 para tu primera especialización.`;
        }
      } else if (['Swordsman', 'Mage', 'Archer', 'Acolyte', 'Merchant', 'Thief'].includes(playerJob)) {
        if (jobLvl >= 40) {
          dialogText = `¡Impresionante! Has dominado el arte del ${playerJob}. Es hora de tu segunda evolución.`;
          if (playerJob === 'Swordsman') options.push({ label: 'Ascender a Knight (Caballero)', actionParam: 'class_knight' });
          if (playerJob === 'Mage') options.push({ label: 'Ascender a Wizard (Mago)', actionParam: 'class_wizard' });
          if (playerJob === 'Archer') options.push({ label: 'Ascender a Hunter (Cazador)', actionParam: 'class_hunter' });
          if (playerJob === 'Acolyte') options.push({ label: 'Ascender a Priest (Sacerdote)', actionParam: 'class_priest' });
          if (playerJob === 'Merchant') options.push({ label: 'Ascender a Blacksmith (Herrero)', actionParam: 'class_blacksmith' });
          if (playerJob === 'Thief') options.push({ label: 'Ascender a Assassin (Asesino)', actionParam: 'class_assassin' });
        } else {
          dialogText = `Estás progresando como ${playerJob}, pero necesitas llegar al Job Lv 40 para tu siguiente evolución. ¡Sigue cazando monstruos!`;
        }
      } else {
        dialogText = `¡Saludos, ${playerJob}! Tu poder es ya legendario en estas tierras. Por ahora no tengo más enseñanzas para tu rango.`;
      }

      options.push({ label: 'Cerrar conversación', actionParam: 'close' });

      store.setNpcDialogue({
        npcId: npc.id,
        npcName: npc.name,
        npcType: 'crusader_instructor',
        text: dialogText,
        options: options
      });
    } else if (npc.npcType === 'shop') {
      // Shop NPCs open shop directly
      store.openShop();
      store.setNpcDialogue(null);
    }
    
    gameAudio.playItemPickup(); // dialogue chiming sound
  }

  handleNpcAction(npcId: string, actionParam: string) {
    const store = useGameStore.getState();
    
    // Always clear dialogue first
    store.setNpcDialogue(null);

    if (actionParam === 'close') {
      store.addCombatLog('Conversación finalizada.', 'system');
      return;
    }

    if (actionParam === 'open_shop') {
      store.openShop();
      store.addCombatLog('🛒 Abriste la tienda.', 'system');
      return;
    }

    if (actionParam.startsWith('quest_accept_')) {
      const questId = actionParam.replace('quest_accept_', '');
      store.acceptQuest(questId);
      return;
    }

    if (actionParam === 'buffs') {
      // Award divine buffs to the player: Aggi/Blessing
      gameAudio.playHeal();
      store.addCombatLog('✨ ¡La Kafra Clarice te ha bendecido con Increase AGI y Blessing! Muévete mucho más rápido.', 'system');
      
      // Spawns spell visual rise
      const fxMesh = this.gameRenderer.createSkillVisualMesh('heal', this.playerEntity.x, this.playerEntity.z, 0.05);
      this.activeEffects.push({
        id: `effect_kafrabuff_${Math.random()}`,
        type: 'heal',
        mesh: fxMesh,
        age: 0,
        maxAge: 45,
        x: this.playerEntity.x,
        z: this.playerEntity.z
      });

      // Add Buffs to Zustand Store
      store.addBuff({
        id: 'increase_agi',
        name: 'Increase AGI',
        durationMs: 40000,
        maxDurationMs: 40000,
        icon: '👟',
        description: '+20 AGI! Velocidad de movimiento y ASPD aumentados.',
        stats: { agi: 20 },
      });
      store.recalculateStats();

      store.addBuff({
        id: 'blessing',
        name: 'Blessing',
        durationMs: 40000,
        maxDurationMs: 40000,
        icon: '✝',
        description: '+20 STR/INT/DEX! ATK, curas y casteo acelerados.'
      });

      store.addBuff({
        id: 'blessing',
        name: 'Blessing',
        durationMs: 40000,
        maxDurationMs: 40000,
        icon: '✝',
        description: '+20 STR/INT/DEX! ATK, curas y casteo acelerados.',
        stats: { str: 20, int: 20, dex: 20 },
      });
      store.recalculateStats();
      this.playerEntity.maxHp = store.stats.maxHp;
      this.playerEntity.maxSp = store.stats.maxSp;
    }

    if (actionParam === 'heal') {
      // Full repair HP/SP and award potions
      gameAudio.playHeal();
      store.addCombatLog('💖 ¡Kafra Clarice ha restaurado tu HP/SP por completo y te ha provisto de elixires de Prontera! 💖', 'system');
      
      this.playerEntity.currentHp = this.playerEntity.maxHp;
      this.playerEntity.currentSp = this.playerEntity.maxSp;
      store.setPlayerHpSp(this.playerEntity.currentHp, this.playerEntity.currentSp);

      const fxMesh = this.gameRenderer.createSkillVisualMesh('heal', this.playerEntity.x, this.playerEntity.z, 0.05);
      this.activeEffects.push({
        id: `effect_kafraheal_${Math.random()}`,
        type: 'heal',
        mesh: fxMesh,
        age: 0,
        maxAge: 45,
        x: this.playerEntity.x,
        z: this.playerEntity.z
      });

      const updatedInventory = store.inventory.map(item => {
        if (item.id === 'red_potion') {
          return { ...item, quantity: 15 };
        }
        return item;
      });
      useGameStore.setState({ inventory: updatedInventory });
    }

    if (actionParam === 'buy_potions') {
      gameAudio.playItemPickup();
      store.addCombatLog('🛒 Has reabastecido tu inventario con +15 Red Potions de la Kafra Clarice.', 'loot');
      
      const updatedInventory = store.inventory.map(item => {
        if (item.id === 'red_potion') {
          return { ...item, quantity: item.quantity + 15 };
        }
        return item;
      });
      useGameStore.setState({ inventory: updatedInventory });
    }

    // Change Class handlers
    if (actionParam.startsWith('class_')) {
      const selectedClass = actionParam.replace('class_', '').split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') as JobClass;
      
      // Special mappings for display names to JobClass keys
      const classMap: Record<string, JobClass> = {
        'Lord Knight': 'Lord Knight',
        'High Priest': 'High Priest',
        'Assassin Cross': 'Assassin Cross',
        'Sniper': 'Sniper',
        'Swordsman': 'Swordsman',
        'Mage': 'Mage',
        'Archer': 'Archer',
        'Knight': 'Knight',
        'Wizard': 'Wizard',
        'Hunter': 'Hunter'
      };

      const finalJob = classMap[selectedClass] || selectedClass;

      if (finalJob) {
        store.setJobClass(finalJob);
        this.playerEntity.job = finalJob;
        
        // Update stats and HP/SP
        this.playerEntity.maxHp = store.stats.maxHp;
        this.playerEntity.maxSp = store.stats.maxSp;
        this.playerEntity.currentHp = this.playerEntity.maxHp;
        this.playerEntity.currentSp = this.playerEntity.maxSp;

        store.setPlayerHpSp(this.playerEntity.currentHp, this.playerEntity.currentSp);

        store.addCombatLog(`✨ ¡Felicidades! Ahora eres un ${finalJob}. ✨`, 'system');
        
        // Flash beautiful Level Up visual sparkles!
        const fxMesh = this.gameRenderer.createSkillVisualMesh('level_up', this.playerEntity.x, this.playerEntity.z, 0.05);
        this.activeEffects.push({
          id: `levelup_${Math.random()}`,
          type: 'level_up',
          mesh: fxMesh,
          age: 0,
          maxAge: 60,
          x: this.playerEntity.x,
          z: this.playerEntity.z
        });

        gameAudio.playHeal();
        store.addCombatLog(`⚔ ¡Has cambiado tu clase de trabajo a ${selectedClass}! Nuevas habilidades asignadas.`, 'system');
        
        // Change texture to reflect new job class colors
        this.gameRenderer.createEntityTexture(this.playerEntity, store.equippedItems);
      }
    }
  }

  // --- 7. RETALIATING MONSTER AI INTELLIGENCE ---
  private tickMonsterSystem(now: number, dt: number) {
    if (this.playerEntity.state === 'death') {
      // Clear all roar targets
      this.monsters.forEach(m => { m.state = 'idle'; m.targetEntityId = null; });
      return;
    }

    const tickScale = dt * 60.0;

    this.monsters.forEach((mob) => {
      if (mob.currentHp <= 0) return;
      
      mob.animationTimer += dt;

      // De-aggro: clear target if too far or time since last hit > 8s
      if (mob.targetEntityId) {
        const distToPlayer = Math.sqrt((this.playerEntity.x - mob.x) ** 2 + (this.playerEntity.z - mob.z) ** 2);
        const visionLimit = mob.type === 'boss_mvp' ? 16.0 : 6.0;
        if (distToPlayer > visionLimit * 3) {
          mob.targetEntityId = null;
          mob.state = 'idle';
        }
      }

      const dist = Math.sqrt((this.playerEntity.x - mob.x) ** 2 + (this.playerEntity.z - mob.z) ** 2);
      
      // Lookup stats from MONSTER_STATS
      const mobStats = mob.mobType ? RagnarokEngine.MONSTER_STATS[mob.mobType] : null;
      const visionLimit = mob.type === 'boss_mvp' ? 16.0 : 6.0;
      const isAggressive = mobStats?.aggressive ?? (mob.type === 'boss_mvp');

      if (dist <= visionLimit && (isAggressive || mob.targetEntityId)) {
        mob.targetEntityId = 'player_main';
        
        // Attack range of monsters
        const combatReach = mob.type === 'boss_mvp' ? 2.8 : 1.8;

        if (dist <= combatReach) {
          // Attack player
          mob.state = 'attack';
          const isBoss = mob.type === 'boss_mvp';
          const rechargeCooldown = isBoss ? 450 : 1200;

          if (mob.animationTimer > rechargeCooldown * 0.001) {
            mob.animationTimer = 0;
            // Strike damage calculation
            const store = useGameStore.getState();
            const hitScore = 150 + (mobStats?.attack ?? (isBoss ? 120 : 15));
            const fleeScore = store.stats.flee;

            const dodgePercent = Math.min(0.95, Math.max(0.05, (fleeScore - hitScore + 100) / 200));
            const playerEvaded = Math.random() < dodgePercent;

            if (playerEvaded) {
              // Miss!
              this.floatingTextSpawner('FLEE', '#94a3b8', 1.0, this.playerEntity.x, 2.0, this.playerEntity.z);
              store.addCombatLog(`[${mob.name}] te ataca y evades su golpe (FLEE).`, 'system');
            } else {
              // Pierce impact damage
              const strikeAtk = mobStats?.attack ?? (isBoss ? 850 : 18);
              const randVariation = Math.floor((Math.random() - 0.5) * strikeAtk * 0.1);
              let rawDmg = strikeAtk + randVariation - (store.stats.def * 0.15);
              
              let finalDmg = Math.floor(Math.max(1, rawDmg));
              
              this.playerEntity.currentHp = Math.max(0, this.playerEntity.currentHp - finalDmg);
              this.playerEntity.state = 'hit';
              this.playerEntity.hitRecoveryEndTime = now + 240; // temporary hitlock stun stagger frame

              // Trigger combat state / battle mode timeout
              this.triggerBattleMode(now);

              // Check and resolve casting interrupt
              if (this.activeCast) {
                const castSpellName = this.activeCast.skillName;
                this.activeCast = null;
                useGameStore.setState({ activeCast: null });

                this.floatingTextSpawner('INTERRUPTED!', '#ef4444', 1.0, this.playerEntity.x, 2.5, this.playerEntity.z);
                store.addCombatLog(`¡[${castSpellName}] es interrumpido por el golpe de [${mob.name}]!`, 'system');
                gameAudio.playFail();
              }

              this.floatingTextSpawner(`${finalDmg}`, '#f43f5e', isBoss ? 1.5 : 1.0, this.playerEntity.x, 2.0, this.playerEntity.z);
              gameAudio.playHit();

              store.addCombatLog(`¡[${mob.name}] te propina un golpe brutal! Pierdes ${finalDmg} HP.`, 'player_hit');

              // Sync store state
              store.setPlayerHpSp(this.playerEntity.currentHp, this.playerEntity.currentSp);

              if (this.playerEntity.currentHp <= 0) {
                this.executePlayerDeathState();
              }
            }
          }
        }
      }
    });
  }

  // Handle player death
  private executePlayerDeathState() {
    this.playerEntity.state = 'death';
    this.playerEntity.targetEntityId = null;
    this.playerEntity.targetX = undefined;
    this.playerEntity.targetZ = undefined;

    const store = useGameStore.getState();
    store.setTarget(null);
    store.addCombatLog('☠ ¡HAS CAÍDO EN COMBAT! Escribe "Vivir de nuevo" o haz click en Revivir instantáneamente ☠', 'player_hit');
    gameAudio.playFail();
  }

  // Respawn / resurrect player
  revivePlayer() {
    const store = useGameStore.getState();

    const currentMapId = store.currentMapId || 'prontera_city';
    const currentMap = MAP_INDEX[currentMapId];
    let spawnX = 32;
    let spawnZ = 32;
    if (currentMap && currentMap.spawns.length > 0) {
      const firstSpawn = currentMap.spawns[0];
      spawnX = firstSpawn.position.x;
      spawnZ = firstSpawn.position.z;
    }

    this.playerEntity.state = 'idle';
    this.playerEntity.x = spawnX;
    this.playerEntity.z = spawnZ;
    this.playerEntity.y = 0;
    this.playerEntity.targetX = undefined;
    this.playerEntity.targetZ = undefined;
    this.playerEntity.targetEntityId = null;
    this.playerEntity.currentHp = store.stats.maxHp;
    this.playerEntity.currentSp = store.stats.maxSp;

    store.setPlayerHpSp(this.playerEntity.currentHp, this.playerEntity.currentSp);
    store.setTarget(null);
    store.addCombatLog(`✨ Has revivido en ${currentMap?.name ?? 'Prontera'}. ¡A batallar! ✨`, 'system');
    gameAudio.playHeal();
  }

  // --- 8. TICK GENERAL COORDINATES MANAGEMENT ---
  private tickCoordinates(dt: number) {
    if (this.playerEntity.state === 'death') return;

    const store = useGameStore.getState();
    const tickScale = dt * 60.0;

    // Recovers HP/SP smoothly scaling
    const hpRegenRate = (0.04 + store.stats.vit * 0.011) * tickScale;
    this.playerEntity.currentHp = Math.min(this.playerEntity.maxHp, this.playerEntity.currentHp + hpRegenRate);

    const spRegenRate = (0.018 + store.stats.int * 0.006) * tickScale;
    this.playerEntity.currentSp = Math.min(this.playerEntity.maxSp, this.playerEntity.currentSp + spRegenRate);

    // Sync state
    store.setPlayerHpSp(this.playerEntity.currentHp, this.playerEntity.currentSp);

    // Buff decay intervals simulation
    if (store.activeBuffs.length > 0) {
      const dtMs = dt * 1000;
      let updatedBuffs = store.activeBuffs.map(b => {
        return { ...b, durationMs: b.durationMs - dtMs };
      });

      const expired = updatedBuffs.filter(b => b.durationMs <= 0);
      updatedBuffs = updatedBuffs.filter(b => b.durationMs > 0);

      if (expired.length > 0) {
        expired.forEach(e => {
          store.addCombatLog(`⏳ El buff [${e.name}] ha expirado.`, 'system');
        });

        expired.forEach(e => store.removeBuff(e.id));
        store.recalculateStats();
        this.playerEntity.maxHp = store.stats.maxHp;
        this.playerEntity.maxSp = store.stats.maxSp;
      }

      useGameStore.setState({ activeBuffs: updatedBuffs });
    }

    // Simulate physics-governed Projectiles movement
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      let target: Entity | undefined;
      if (this.playerEntity.id === proj.targetEntityId) {
        target = this.playerEntity;
      } else {
        target = this.monsters.find(m => m.id === proj.targetEntityId);
      }

      const speedScale = proj.speed * tickScale;

      if (!target || target.currentHp <= 0 || target.state === 'death') {
        proj.y -= 0.15 * speedScale;
        if (proj.y <= 0) {
          this.projectiles.splice(i, 1);
        }
        continue;
      }

      const targetHeightOffset = target.type === 'boss_mvp' ? 1.6 : (target.type === 'player' ? 1.15 : 0.85);
      const tY = target.y + targetHeightOffset;
      const pdx = target.x - proj.x;
      const pdy = tY - proj.y;
      const pdz = target.z - proj.z;
      const pdist = Math.sqrt(pdx * pdx + pdy * pdy + pdz * pdz);

      if (pdist < speedScale * 1.25) {
        this.impactProjectile(proj, target);
        this.projectiles.splice(i, 1);
      } else {
        proj.x += (pdx / pdist) * speedScale;
        proj.y += (pdy / pdist) * speedScale;
        proj.z += (pdz / pdist) * speedScale;
      }
    }

    // LOOT GRABBING: Auto pickups items when player coordinates step over them
    this.groundItems.forEach((item, index) => {
      // Simulate physical drop bouncy leaps with gravity acceleration
      if (item.velY !== undefined && item.velX !== undefined && item.velZ !== undefined) {
        const gravityAcc = -0.38;
        item.velY += gravityAcc * tickScale;

        item.x += item.velX * dt;
        item.y += item.velY * dt;
        item.z += item.velZ * dt;

        // Ground collision bounce boundary
        if (item.y <= 0.05) {
          item.y = 0.05;
          if (item.bounceCount !== undefined && item.bounceCount < 2) {
            item.velY = -item.velY * 0.45; // reverse leap velocity with loss multiplier
            item.velX *= 0.5;
            item.velZ *= 0.5;
            item.bounceCount++;
            gameAudio.playItemPickup(); // pleasant drop collision sound
          } else {
            item.velY = 0;
            item.velX = 0;
            item.velZ = 0;
          }
        }
      }

      // --- LOOT GRABBING ---
      if (this.attemptGrabLoot(item, index)) {
        // Item was grabbed, return to skip rest of loop logic
        return;
      }
    });

    // --- RPG CHARACTER CONTROLLER DESIGN INTEGRATION ---
    const isMovingInput = (store.isJoystickEnabled && store.joystick.isActive) ||
                          (this.playerEntity.targetX !== undefined && this.playerEntity.targetZ !== undefined);

  // --- HELPER METHODS ---



    // Cancel active casting if we move manually!
    if (isMovingInput && this.activeCast) {
      const spellName = this.activeCast.skillName;
      this.activeCast = null;
      useGameStore.setState({ activeCast: null });
      this.floatingTextSpawner('CANCELLED', '#94a3b8', 1.0, this.playerEntity.x, 2.5, this.playerEntity.z);
      store.addCombatLog(`¡[${spellName}] cancelado por movimiento!`, 'system');
      gameAudio.playFail();
      this.interactingNpcId = null; // abort dialogues
    }

    // Check proximity interaction trigger limit for locking-on friendly NPC
    if (this.interactingNpcId) {
      const npc = this.npcs.find(n => n.id === this.interactingNpcId);
      if (npc) {
        const distanceToNpc = Math.sqrt((npc.x - this.playerEntity.x) ** 2 + (npc.z - this.playerEntity.z) ** 2);
        if (distanceToNpc < 1.95) {
          // Arrived near NPC, halt movement coordinates ticking
          this.playerEntity.state = 'idle';
          this.playerEntity.targetX = undefined;
          this.playerEntity.targetZ = undefined;
          this.playerEntity.facing = (npc.x > this.playerEntity.x) ? 'right' : 'left';
          
          if (this.charController) {
            this.charController.vx = 0;
            this.charController.vz = 0;
          }

          this.interactingNpcId = null;

          // Instantly summon conversation dialog elements!
          this.openNpcDialogue(npc);
          return;
        }
      }
    }

    // Check proximity to interactibles (torches, inscriptions)
    for (const interactible of this.interactibles) {
      if (interactible.activated) continue;
      const dist = Math.sqrt((interactible.x - this.playerEntity.x) ** 2 + (interactible.z - this.playerEntity.z) ** 2);
      if (dist < 1.5) {
        interactible.activated = true;
        this.floatingTextSpawner(`🔶 ${interactible.label}`, '#fbbf24', 1.0, interactible.x, 2.5, interactible.z);
        store.addCombatLog(`Interactuaste con: ${interactible.label}`, 'system');
        // Update quest objectives that reference this interactible
        store.activeQuests.forEach(qId => {
          const progress = store.questProgress[qId];
          if (!progress) return;
          progress.forEach((obj, idx) => {
            if (obj.interactId === interactible.id && obj.current < obj.count) {
              store.updateQuestProgress(qId, idx, 1);
            }
          });
        });
      }
    }

    // Execute character controller physics simulation with inertia, boundary & obstacle collision
    if (this.charController) {
      // Sync dynamic obstacles from terrain
      if (this.mapLoader) {
        this.charController.syncObstacles(this.mapLoader.getCollisionCells());
      }

      const isCastingOrAttacking = this.activeCast !== null || this.playerEntity.state === 'attack';
      const lockedTargetId = this.playerEntity.targetEntityId;
      const lockedTargetMob = lockedTargetId ? (this.monsters.find(m => m.id === lockedTargetId) || null) : null;

      this.charController.updateMovement(dt, tickScale, isCastingOrAttacking, lockedTargetMob);
      this.playerEntity.y = this.getGroundHeight(this.playerEntity.x, this.playerEntity.z);
    }
  }

  private getGroundHeight(x: number, z: number): number {
    if (this.mapLoader) {
      return this.mapLoader.getHeightAt(x, z);
    }
    return 0;
  }

  // Spawns damage numeric popups floating up
  private floatingTextSpawner(text: string, color: string, scaleSize: number, x: number, y: number, z: number) {
    const id = `dmg_${Math.random()}_${Date.now()}`;
    const txtInstance = {
      id,
      text,
      color,
      size: scaleSize,
      x, y, z,
      velX: (Math.random() - 0.5) * 0.065,
      velY: 0.16 + Math.random() * 0.08,
      velZ: (Math.random() - 0.5) * 0.065,
      age: 0,
      maxAge: 38
    };

    this.floatingTexts.push(txtInstance);
  }

  private addTouchIndicatorInstance(x: number, z: number, type: TouchIndicator['type']) {
    const id = `indic_${Math.random()}`;
    const data: TouchIndicator = {
      id,
      x,
      y: 0.05,
      z,
      age: 0,
      maxAge: type === 'target' ? 120 : 22, // target stays longer while focused on mobs
      type
    };

    // Instantiate mesh representation mapping
    const mesh = this.gameRenderer.spawnTouchIndicator(data);
    this.touchIndicators.push({ id, data, mesh });
  }

  // --- 9. SYNCHRONIZE THREE.JS VISUAL BILLBOARDS ---
  private updateBillboards() {
    const store = useGameStore.getState();
    const cameraPos = this.camera.position;
    const now = performance.now();

    // Link dynamic entities into the Scene Graph on demand if they aren't already registered
    this.sceneGraph.linkEntity(this.playerEntity, store.equippedItems, this.gameRenderer);
    this.monsters.forEach(m => this.sceneGraph.linkEntity(m, {}, this.gameRenderer));
    this.npcs.forEach(n => this.sceneGraph.linkEntity(n, {}, this.gameRenderer));

    // Update entire Scene Graph including dynamic LOD range-culling & frame throttling
    this.sceneGraph.updateGraph(this.fixedTimeStep, cameraPos, now);

    // 2. Update ground physical falling items
    this.groundItems.forEach((item) => {
      let mesh = this.groundItemMeshes[item.id];
      if (!mesh) {
        mesh = this.gameRenderer.spawnDropItemMesh(item);
        this.groundItemMeshes[item.id] = mesh;
      }
      if (item.velY !== undefined) {
        mesh.position.set(item.x, item.y, item.z);
      } else {
        mesh.position.set(item.x, 0.22 + Math.abs(Math.sin(now * 0.005)) * 0.18, item.z);
      }
      mesh.rotation.y += 0.015;
    });

    // Clean up expired items
    Object.keys(this.groundItemMeshes).forEach((key) => {
      if (!this.groundItems.some(i => i.id === key)) {
        const mesh = this.groundItemMeshes[key];
        if (mesh) {
          this.scene.remove(mesh);
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) mesh.material.forEach((m: any) => m.dispose());
          else mesh.material.dispose();
        }
        delete this.groundItemMeshes[key];
      }
    });

    // 3. Update projectile meshes
    this.projectiles.forEach((proj) => {
      let mesh = this.projectileMeshes[proj.id];
      if (!mesh) {
        mesh = this.gameRenderer.spawnProjectileMesh(proj.type, proj.x, proj.y, proj.z);
        this.projectileMeshes[proj.id] = mesh;
      }
      mesh.position.set(proj.x, proj.y, proj.z);
    });

    // Wipe any redundant projectile meshes that represent destroyed projectiles
    Object.keys(this.projectileMeshes).forEach((key) => {
      if (!this.projectiles.some(p => p.id === key)) {
        const mesh = this.projectileMeshes[key];
        if (mesh) {
          this.scene.remove(mesh);
          mesh.traverse((node: any) => {
            if (node.geometry) node.geometry.dispose();
            if (node.material) {
              if (Array.isArray(node.material)) node.material.forEach((m: any) => m.dispose());
              else node.material.dispose();
            }
          });
        }
        delete this.projectileMeshes[key];
      }
    });
  }

  // --- 10. DYNAMIC TICK RUNTIMES AND CLEAN UPS SYSTEMS ---
  private fixedTick(now: number, dt: number) {
    // 1. Queue Input Buffer consumption ticker
    this.tickInputBuffer(now);

    // 2. Coordinates walking translation
    this.tickCoordinates(dt);

    // 2.25 MapManager portal detection
    if (this.playerEntity) {
      const currentMap = this.mapManager.getCurrentMap();
      if (currentMap) {
        this.mapManager.update(this.playerEntity.x, this.playerEntity.z, currentMap.portals);
      }
    }

    // 2.3 NPC proximity detection (for "Press E to talk" prompt)
    if (this.playerEntity) {
      this.updateNpcProximity();
    }

    // 2.35 Process pending NPC action from UI
    const store = useGameStore.getState();
    if (store.pendingNpcAction) {
      const action = store.pendingNpcAction;
      const npcId = store.npcDialogue?.npcId ?? store.nearbyNpcId ?? this.interactingNpcId ?? '';
      store.setPendingNpcAction(null);
      if (npcId) {
        this.handleNpcAction(npcId, action);
      }
    }

    // 2.5 Active casting ticking and completion resolver
    this.tickActiveCasting(dt);

    // 2.7 Battle mode combat state decay
    if (useGameStore.getState().battleMode && now > this.battleModeEndTime) {
      useGameStore.setState({ battleMode: false });
    }

    // 2.9 Run World Runtime simulation for real-time spatial organization & physical crowd pushing
    if (this.worldRuntime) {
      this.worldRuntime.update(dt, now);
      // Sync player effects to store
      const player = this.worldRuntime.getPlayer();
      if (player && player.activeEffects) {
        useGameStore.getState().setStatusEffects(player.activeEffects);
      }
      // Align simulated 2D positions of dynamic entities to Three.js ground heights
      this.monsters.forEach(m => {
        m.y = this.getGroundHeight(m.x, m.z);
      });
      this.npcs.forEach(n => {
        n.y = this.getGroundHeight(n.x, n.z);
      });
    }

    // 2.95 City Life walker NPCs
    if (this.cityLife) {
      this.cityLife.tick(dt);
    }

    // 3. Auto physical combat ticker
    this.tickAutoCombat(now, dt);

    // 3.5 Loot System ticker
    this.tickLootSystem(now, dt);

    // 4. Roaming monster behaviors and retaliating AI loop
    this.tickMonsterSystem(now, dt);

    // 5. Epicearth terrain systems
    if (this.lightingManager) {
      this.lightingManager.update();
    }

    // 6. Landmark discovery
    this.tickLandmarkDiscovery();

    // 7. Quest objective hooks (explore, survive, reach)
    this.tickQuestObjectives(dt);

    // 8. Compute and sync player status for HUD
    this.syncPlayerStatus(now);
  }

  private syncPlayerStatus(now: number) {
    const p = this.playerEntity;
    const store = useGameStore.getState();
    let status: import('./types').PlayerStatus = 'normal';

    if (!p || p.state === 'death' || p.currentHp <= 0) {
      status = 'dead';
    } else if (p.state === 'hit' && p.hitRecoveryEndTime > now) {
      status = 'stunned';
    } else if (this.activeCast !== null) {
      status = 'casting';
    } else if (p.activeEffects && p.activeEffects.some(e => e.type === 'burn')) {
      status = 'poisoned';
    } else if (store.battleMode) {
      status = 'combat';
    } else if (store.activeBuffs.length > 0) {
      status = 'buffed';
    }

    if (store.playerStatus !== status) {
      store.setPlayerStatus(status);
    }
  }

  private updateNpcProximity() {
    if (!this.playerEntity) return;
    const px = this.playerEntity.x;
    const pz = this.playerEntity.z;
    let closestNpc: Entity | null = null;
    let closestDist = 3.5;

    for (const npc of this.npcs) {
      const dist = Math.sqrt((npc.x - px) ** 2 + (npc.z - pz) ** 2);
      if (dist < closestDist) {
        closestDist = dist;
        closestNpc = npc;
      }
    }

    const store = useGameStore.getState();
    const currentId = store.nearbyNpcId;
    const newId = closestNpc?.id ?? null;
    if (currentId !== newId) {
      store.setNearbyNpc(newId, closestNpc?.name ?? null);
    }
  }

  private questSurvivalTimers: Record<string, number> = {};
  private questCheckCounter = 0;
  private tickQuestObjectives(dt: number) {
    this.questCheckCounter++;
    if (this.questCheckCounter % 30 !== 0) return; // Every ~0.5s

    const store = useGameStore.getState();
    const px = this.playerEntity.x;
    const pz = this.playerEntity.z;

    store.activeQuests.forEach(qId => {
      const progress = store.questProgress[qId];
      if (!progress) return;
      progress.forEach((obj, idx) => {
        if (obj.type === 'explore' && obj.location && !obj.interactId) {
          const dist = Math.sqrt((obj.location.x - px) ** 2 + (obj.location.z - pz) ** 2);
          if (dist < 6 && obj.current < obj.count) {
            store.updateQuestProgress(qId, idx, 1);
          }
        }
        if (obj.type === 'survive' && obj.location) {
          const dist = Math.sqrt((obj.location.x - px) ** 2 + (obj.location.z - pz) ** 2);
          if (dist < 12) {
            const timerKey = `${qId}_${idx}`;
            this.questSurvivalTimers[timerKey] = (this.questSurvivalTimers[timerKey] || 0) + dt * 30;
            if (this.questSurvivalTimers[timerKey] >= 5.0 && obj.current < obj.count) {
              store.updateQuestProgress(qId, idx, 1);
              this.questSurvivalTimers[timerKey] = 0;
            }
          } else {
            this.questSurvivalTimers[`${qId}_${idx}`] = 0;
          }
        }
        if (obj.type === 'reach') {
          if (store.stats.level >= obj.count && obj.current < obj.count) {
            store.updateQuestProgress(qId, idx, obj.count);
          }
        }
      });
    });
  }

  private landmarkCheckCounter = 0;
  private tickLandmarkDiscovery() {
    this.landmarkCheckCounter++;
    if (this.landmarkCheckCounter % 30 !== 0) return;
    const store = useGameStore.getState();
    const currentMapId = store.currentMapId;
    if (!currentMapId) return;
    const px = this.playerEntity.x;
    const pz = this.playerEntity.z;
    for (const lm of LANDMARKS) {
      if (lm.mapId !== currentMapId) continue;
      if (store.discoveredLandmarks.includes(lm.id)) continue;
      const dist = Math.sqrt((lm.x - px) ** 2 + (lm.z - pz) ** 2);
      if (dist < 6) {
        store.discoverLandmark(lm.id);
        this.floatingTextSpawner(`📍 ${lm.name}`, '#38bdf8', 1.5, px, 3.5, pz);
      }
    }
  }

  private renderTick(delta: number, timeSec: number) {
    // 0. Update VFX rendering
    this.gameRenderer.tickVFX(delta);

    // Decay camera shake smoothly
    if (this.screenShakeIntensity > 0) {
      this.screenShakeIntensity *= Math.pow(0.1, delta);
    }

    // 1. Process custom touch arrows indicators
    this.touchIndicators.forEach((indObj, index) => {
      const data = indObj.data;
      const mesh = indObj.mesh;

      data.age += delta * 60; // progress frame ticker

      if (data.type === 'move') {
        const progress = data.age / data.maxAge;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = 1.0 - progress;
        // Expand ring outward
        mesh.scale.set(1 + progress * 2.8, 1 + progress * 2.8, 1);
      } else if (data.type === 'target') {
        // Red revolving crosshair around targeted mob!
        mesh.rotation.z += 0.03;
        
        // Ping-pong expand circle scale pulsating
        const scaleFreq = 1.0 + Math.sin(performance.now() * 0.01) * 0.15;
        mesh.scale.set(scaleFreq * 1.5, scaleFreq * 1.5, 1);

        // Keep revolving track locked coordinates under mobile monster
        const focusedMob = this.monsters.find(m => m.id === this.playerEntity.targetEntityId);
        if (focusedMob && focusedMob.currentHp > 0) {
          mesh.position.set(focusedMob.x, 0.05, focusedMob.z);
        } else {
          // Monster dead, expire indicator instantly
          data.age = data.maxAge;
        }
      }

      if (data.age >= data.maxAge) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        this.touchIndicators.splice(index, 1);
      }
    });

    // 2. Proportional physics tickers on Floating numeric damage text popups
    this.floatingTexts.forEach((txt, index) => {
      txt.age += delta * 60; // age ticking
      const frameScale = delta * 60;

      // Parabolic velocity dragging vectors
      txt.x += txt.velX * frameScale;
      txt.y += txt.velY * frameScale;
      txt.z += txt.velZ * frameScale;

      txt.velY -= 0.0125 * frameScale; // pulls down gravitationally

      let sprite = this.effectMeshes[txt.id] as THREE.Sprite | undefined;
      if (!sprite) {
        const canvas = CanvasPool.getCanvas(160, 48);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 160, 48);
          ctx.font = `bold ${Math.floor(26 * txt.size)}px monospace`;
          ctx.textAlign = 'center';
          ctx.fillStyle = txt.color;
          // Outline for extreme readability
          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 4;
          ctx.strokeText(txt.text, 80, 32);
          ctx.fillText(txt.text, 80, 32);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.NearestFilter;
        tex.magFilter = THREE.NearestFilter;
        tex.generateMipmaps = false;
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        sprite = new THREE.Sprite(mat);
        sprite.scale.set(3, 1, 1);
        this.scene.add(sprite);
        this.effectMeshes[txt.id] = sprite;
      }

      sprite.position.set(txt.x, txt.y, txt.z);

      // Pop animation: 1.0 → 1.2 → 1.0 over lifetime (peaks at 20%)
      const t = txt.age / txt.maxAge;
      const popPeak = 0.2;
      const scalePop = t < popPeak
        ? 1.0 + 0.2 * (t / popPeak)
        : 1.0 + 0.2 * (1.0 - (t - popPeak) / (1.0 - popPeak));
      sprite.scale.set(3 * scalePop, 1 * scalePop, 1);

      if (txt.age >= txt.maxAge) {
        this.scene.remove(sprite);
        sprite.material.map?.dispose();
        sprite.material.dispose();
        delete this.effectMeshes[txt.id];
        this.floatingTexts.splice(index, 1);
      }
    });

    // 3. Process active spell structures meshes AGE
    this.activeEffects.forEach((fx, index) => {
      fx.age += delta * 60;
      const progress = fx.age / fx.maxAge;

      const mesh = fx.mesh;

      if (fx.type === 'heal') {
        const ring = mesh.children[0] as THREE.Mesh;
        if (ring) {
          (ring.material as THREE.Material).opacity = (1 - progress) * 0.7;
          ring.scale.set(1 + progress * 2.1, 1 + progress * 2.1, 1);
        }
        // Rising sparkle lines
        mesh.children.slice(1).forEach((lineObj) => {
          lineObj.position.y += 0.035 * (delta * 60);
          (lineObj as any).material.opacity = (1 - progress) * 0.65;
        });
      } else if (fx.type === 'bash' || fx.type === 'sonic_blow') {
        const slash = mesh.children[0] as THREE.Mesh;
        if (slash) {
          (slash.material as THREE.Material).opacity = (1 - progress) * 0.85;
          slash.rotation.z += 0.12 * (delta * 60);
          slash.scale.set(1 + progress, 1 + progress, 1);
        }
      } else if (fx.type === 'thunder_storm') {
        mesh.rotation.y += 0.05 * (delta * 60);
        const cyl = mesh.children[0] as THREE.Mesh;
        if (cyl) {
          (cyl.material as THREE.Material).opacity = (1 - progress) * 0.5;
          cyl.scale.set(1 + progress * 0.4, 1, 1 + progress * 0.4);
        }
      } else if (fx.type === 'level_up') {
        const points = mesh.children[0] as THREE.Points;
        if (points) {
          (points.material as THREE.Material).opacity = 1 - progress;
          points.position.y += 0.065 * (delta * 60);
        }
      }

      if (fx.age >= fx.maxAge) {
        this.scene.remove(mesh);
        // Deep clean nested geometries
        mesh.traverse((node: any) => {
          if (node.geometry) node.geometry.dispose();
          if (node.material) {
            if (Array.isArray(node.material)) node.material.forEach((m: any) => m.dispose());
            else node.material.dispose();
          }
        });
        this.activeEffects.splice(index, 1);
      }
    });

    // 4. Render Billboards updates
    this.updateBillboards();

    // 4a. Epicearth vegetation wind animation
    if (this.vegetationSystem) {
      this.vegetationSystem.updateWind(delta);
    }

    // 4a2. Animate water surfaces
    if (this.mapLoader) {
      this.mapLoader.updateWater(timeSec);
    }

    // 4a3. Update ambient particles (dust, petals, leaves)
    if (this.atmosphereSystem) {
      this.atmosphereSystem.update(delta, this.camera.position);
    }

    // 4a4. Update ambient life particles (torch flames, dust motes, fireflies)
    if (this.ambientParticles) {
      this.ambientParticles.update(delta);
    }

    // 5. Dynamic Camera follows character position with fixed offset + screen shake!
    const shakeOffsetX = (Math.random() - 0.5) * this.screenShakeIntensity * 3.5;
    const shakeOffsetY = (Math.random() - 0.5) * this.screenShakeIntensity * 3.5;

    const targetState = useGameStore.getState().targetEntityId != null;
    // Dynamic zoom based on combat (slightly zoomed out for better spatial awareness, zoomed in for exploration)
    const baseZoomY = targetState ? 11 : 9.0;
    const baseZoomZ = targetState ? 16 : 13.0;

    this._cameraTarget.set(
      this.playerEntity.x + shakeOffsetX,
      this.playerEntity.y + baseZoomY + shakeOffsetY,
      this.playerEntity.z + baseZoomZ
    );
    this.camera.position.lerp(this._cameraTarget, 0.08);

    // Leve inclinación al correr (cámara dinámica)
    const store = useGameStore.getState();
    const joy = store.joystick;
    const tiltAngle = joy.isActive && joy.distance > 10 ? joy.normalizedX * 2.0 : 0;
    this.camera.lookAt(
      this.playerEntity.x + tiltAngle * 0.3,
      this.playerEntity.y + 1.2,
      this.playerEntity.z
    );

    // 6. Mobile Optimizer frame recording
    if (this.mobileOptimizer) {
      this.mobileOptimizer.recordFrameTime(delta);
    }

    // 6a. Debug panel overlay
    if (this.debugPanel) {
      const profile = this.mobileOptimizer?.getProfile();
      const mapName = useGameStore.getState().currentMapName ?? '—';
      this.debugPanel.update(this.renderer, {
        totalProps: this.propLibrary?.getTotalInstances() ?? 0,
        totalTrees: this.vegetationSystem?.getTotalInstances() ?? 0,
        totalLandmarks: this.landmarkSystem?.getLandmarkCount() ?? 0,
        mobileProfile: profile ? `${profile.targetFPS}fps ${profile.lowPower ? 'low' : 'high'}` : 'N/A',
        fps: delta > 0 ? 1 / delta : 0,
        currentZone: mapName,
      });
    }

    // Standard high-render tick pipeline draws Three.js frames
    try {
      this.renderer.render(this.scene, this.camera);
    } catch (e) {
      console.error('[Epicearth] render() crashed:', e);
      // Log scene contents for debugging
      const objects: string[] = [];
      this.scene.traverse((obj: any) => {
        const matType = obj.material?.type || 'none';
        const recvShadow = obj.receiveShadow;
        objects.push(`${obj.type} "${obj.name || ''}" mat:${matType} receiveShadow:${recvShadow} castShadow:${obj.castShadow}`);
      });
      console.error('[Epicearth] Scene objects:', objects);
      // Disable shadows as last resort fallback
      this.renderer.shadowMap.enabled = false;
    }
  }

  private initTerrain() {
    this.propLibrary = new PropLibrary(this.scene);
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    this.vegetationSystem = new VegetationSystem(this.scene, isMobile);
    this.landmarkSystem = new LandmarkSystem(this.scene);
    this.lightingManager = new LightingManager(this.scene, isMobile);
    this.mapLoader = new MapLoader(
      this.scene,
      this.propLibrary,
      this.vegetationSystem,
      this.landmarkSystem
    );
    this.mobileOptimizer = new MobileOptimizer(this.renderer);
    this.debugPanel = new DebugPanel();
    this.atmosphereSystem = new AtmosphereSystem(this.scene);
    this.cityLife = new CityLifeSystem(this.scene);
    this.ambientParticles = new AmbientParticleSystem(this.scene);
    this.portalManager = new PortalManager();
    this.mapManager = new MapManager(this.mapLoader, this.portalManager);

    this.mobileOptimizer.onProfileChange = (profile) => {
      this.vegetationSystem.setMobile(profile.lowPower);
      this.lightingManager.setMobile(profile.lowPower);
      if (profile.lowPower && this.atmosphereSystem) {
        this.atmosphereSystem.clear();
      }
    };
  }

  // CORE TICK FRAME CONTROLLER
  private animate() {
    if (this.isDestroyed) return;
    this.animationId = requestAnimationFrame(() => this.animate());

    const now = performance.now();
    // Cap maximum threshold frame jump (ignores sudden freeze lags)
    const delta = Math.min(this.clock.getDelta(), 0.15);
    const secs = now * 0.001;

    this.accumulator += delta;

    // --- GAME ENGINE DETECTS FIXED TICKS FOR SIMULATION ---
    while (this.accumulator >= this.fixedTimeStep) {
      this.fixedTick(now, this.fixedTimeStep);
      this.accumulator -= this.fixedTimeStep;
    }

    // --- RENDER TICK CYCLE (HIGH REFRESH SMOOTH RENDER AT FULL SPEED) ---
    this.renderTick(delta, secs);
  }

  // Resets player progress: wipes save data and reloads the page
  resetGame() {
    try {
      localStorage.removeItem('ragnarok_sandbox_save');
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }
    window.location.reload();
  }

  // Deep memory clean up
  destroy() {
    this.isDestroyed = true;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    window.removeEventListener('resize', this.handleResize);
    
    if (this.sceneGraph) {
      this.sceneGraph.clearAll();
    }

    if (this.charController) {
      this.charController.destroy();
    }

    // Dispose Epicearth terrain systems
    if (this.mapLoader) {
      this.mapLoader.dispose();
    }
    if (this.propLibrary) {
      this.propLibrary.dispose();
    }
    if (this.vegetationSystem) {
      this.vegetationSystem.dispose();
    }
    if (this.landmarkSystem) {
      this.landmarkSystem.dispose();
    }
    if (this.lightingManager) {
      this.lightingManager.dispose();
    }
    if (this.mobileOptimizer) {
      this.mobileOptimizer.dispose();
    }
    if (this.debugPanel) {
      this.debugPanel.destroy();
    }
    if (this.cityLife) {
      this.cityLife.dispose();
    }
    if (this.ambientParticles) {
      this.ambientParticles.unload();
    }

    // Dispose Three.js render targets and resources
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  private attemptGrabLoot(item: GroundItem, index: number): boolean {
    if (!useGameStore.getState().autoPickupEnabled) return false;
    
    const dist = Math.sqrt((item.x - this.playerEntity.x) ** 2 + (item.z - this.playerEntity.z) ** 2);
    if (dist < 1.35) {
        const store = useGameStore.getState();
        // Grab!
        store.addLootNotification([`${item.name} x${item.quantity}`]);

        const itemId = item.itemId;
        let type: 'equipment' | 'consumable' | 'material' | 'card' = 'material';
        let slot: EquipmentSlot | undefined;
        let stats: InventoryItem['stats'] | undefined;

        // Consumables
        if (['red_potion', 'orange_potion', 'yellow_potion', 'blue_potion', 'white_potion', 'green_potion', 'awakening_potion'].includes(itemId)) {
          type = 'consumable';
        }
        // Equipment drops
        else if (itemId === 'iron_sword') { type = 'equipment'; slot = 'rightHand'; stats = { atk: 18 }; }
        else if (itemId === 'rare_armor') { type = 'equipment'; slot = 'body'; stats = { def: 25 }; }
        else if (itemId === 'training_sword') { type = 'equipment'; slot = 'rightHand'; stats = { atk: 5 }; }
        else if (itemId === 'ring_of_life') { type = 'equipment'; slot = 'accessory'; stats = { hp: 25 }; }
        else if (itemId === 'leather_armor') { type = 'equipment'; slot = 'body'; stats = { def: 8 }; }
        else if (itemId === 'wing_boots') { type = 'equipment'; slot = 'body'; stats = { spd: 3, def: 1 }; }
        else if (itemId === 'cat_whisker') { type = 'equipment'; slot = 'accessory'; stats = { flee: 3 }; }
        else if (itemId === 'poring_ear') { type = 'equipment'; slot = 'head'; stats = { luk: 1 }; }
        else if (itemId === 'apple_of_the_sun') { type = 'equipment'; slot = 'accessory'; stats = { atk: 3 }; }
        else if (itemId === 'training_amulet') { type = 'equipment'; slot = 'accessory'; stats = { def: 3 }; }
        else if (itemId === 'copper_armor') { type = 'equipment'; slot = 'body'; stats = { def: 14 }; }
        else if (itemId === 'lunatic_tail') { type = 'equipment'; slot = 'head'; stats = { agi: 1 }; }
        else if (itemId === 'chonchon_ear') { type = 'equipment'; slot = 'head'; stats = { int: 1 }; }
        else if (itemId === 'picky_beak') { type = 'equipment'; slot = 'head'; stats = { dex: 1 }; }
        else if (itemId === 'pecopeco_hat') { type = 'equipment'; slot = 'head'; stats = { agi: 1, def: 1 }; }
        else if (itemId === 'savage_tail') { type = 'equipment'; slot = 'head'; stats = { str: 1 }; }
        else if (itemId === 'mandragora_crown') { type = 'equipment'; slot = 'head'; stats = { hp: 50 }; }
        else if (itemId === 'cotton_shirt') { type = 'equipment'; slot = 'body'; stats = { def: 3 }; }
        else if (itemId === 'feather_brooch') { type = 'equipment'; slot = 'accessory'; stats = { spd: 2 }; }
        else if (itemId === 'leather_boots') { type = 'equipment'; slot = 'body'; stats = { spd: 2, def: 1 }; }
        // Bosque Umbrío equipment drops
        else if (itemId === 'bat_hood') { type = 'equipment'; slot = 'head'; stats = { agi: 2 }; }
        else if (itemId === 'spore_cap') { type = 'equipment'; slot = 'head'; stats = { int: 1, def: 1 }; }
        else if (itemId === 'wisp_circlet') { type = 'equipment'; slot = 'head'; stats = { matk: 2 }; }
        else if (itemId === 'shadow_veil') { type = 'equipment'; slot = 'head'; stats = { flee: 3 }; }
        else if (itemId === 'ancient_crown') { type = 'equipment'; slot = 'head'; stats = { hp: 100, def: 2 }; }
        else if (itemId === 'shadow_robe') { type = 'equipment'; slot = 'body'; stats = { def: 12, flee: 3 }; }
        else if (itemId === 'silk_armor') { type = 'equipment'; slot = 'body'; stats = { def: 16, spd: 1 }; }
        else if (itemId === 'ancient_plate') { type = 'equipment'; slot = 'body'; stats = { def: 22, hp: 50 }; }
        else if (itemId === 'shadow_blade') { type = 'equipment'; slot = 'rightHand'; stats = { atk: 28, agi: 2 }; }
        else if (itemId === 'nature_staff') { type = 'equipment'; slot = 'rightHand'; stats = { atk: 12, matk: 28 }; }
        else if (itemId === 'ancient_bow') { type = 'equipment'; slot = 'rightHand'; stats = { atk: 24, dex: 2 }; }
        else if (itemId === 'bat_ring') { type = 'equipment'; slot = 'accessory'; stats = { flee: 5 }; }
        else if (itemId === 'wisp_amulet') { type = 'equipment'; slot = 'accessory'; stats = { matk: 5 }; }
        else if (itemId === 'ancient_seal') { type = 'equipment'; slot = 'accessory'; stats = { def: 5, hp: 50 }; }
        else if (itemId.endsWith('_card')) { type = 'card'; }

        // Add to inventory store dynamically
        const existingItem = store.inventory.find(i => i.id === itemId);
        let updatedInventory;
        
        if (existingItem) {
          updatedInventory = store.inventory.map(i =>
            i.id === itemId ? { ...i, quantity: i.quantity + item.quantity } : i
          );
        } else {
          updatedInventory = [...store.inventory, {
            id: itemId,
            name: item.name,
            quantity: item.quantity,
            type,
            slot,
            stats
          }];
        }

        useGameStore.setState({ inventory: updatedInventory });

        // Wipe mesh representation from stage
        const mesh = this.groundItemMeshes[item.id];
        if (mesh) {
          this.scene.remove(mesh);
          delete this.groundItemMeshes[item.id];
        }

        this.groundItems.splice(index, 1);
        gameAudio.playItemPickup();
        return true;
    }
    return false;
  }
}
