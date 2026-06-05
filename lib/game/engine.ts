import * as THREE from 'three';
import { useGameStore } from './state';
import { ITEM_DATABASE } from './inventory';
import { GameRenderer, getTerrainHeight } from './renderer';
import { gameAudio } from './audio';
import { WorldRuntime } from './worldRuntime';
import { VisualSceneGraph, VisualNode, EntitySpriteNode } from './sceneGraph';
import { RPGCharacterController } from './characterController';
import { 
  Entity, GroundItem, TouchIndicator, 
  InputBufferItem, JoystickState, HeadgearId, Projectile, EquipmentSlot, JobClass
} from './types';

// Helper to safely trigger light haptic tactile feedback on mobile web browsers supporting navigator.vibrate
function triggerHaptic(pattern: number | number[]) {
  if (typeof window !== 'undefined' && window.navigator && typeof window.navigator.vibrate === 'function') {
    try {
      window.navigator.vibrate(pattern);
    } catch (e) {
      // Ignore security/sandbox/user-interaction constraints
    }
  }
}

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

  // Simulation Entities
  public playerEntity!: Entity;
  private monsters: Entity[] = [];
  private groundItems: GroundItem[] = [];
  private npcs: Entity[] = [];
  private projectiles: Projectile[] = [];
  private interactingNpcId: string | null = null;
  private activeCast: { skillId: string; skillName: string; durationMs: number; elapsedMs: number; targetEntityId: string | null; color: string } | null = null;
  private battleModeEndTime = 0;

  // Visual Lists
  private activeEffects: { id: string; type: string; mesh: THREE.Object3D; age: number; maxAge: number; x: number; z: number }[] = [];
  private floatingTexts: { id: string; text: string; color: string; size: number; x: number; y: number; z: number; velX: number; velY: number; velZ: number; age: number; maxAge: number }[] = [];
  private touchIndicators: { id: string; data: TouchIndicator; mesh: THREE.Mesh }[] = [];

  // Map of meshes representing entities on stage
  private entityMeshes: Record<string, THREE.Sprite> = {};
  private effectMeshes: Record<string, THREE.Object3D> = {};
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
  private activeTouchPoints: Map<number, { startX: number; startY: number; currentX: number; currentY: number; isJoystick: boolean; isGesture: boolean; startTime: number }> = new Map();
  private joystickTouchId: number | null = null;
  private initialPinchDistance: number | null = null;
  private initialCameraZoom: number = 1.0;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.initThree();
    this.initWorld();
    this.setupTouchListeners();
    this.animate();
    useGameStore.getState().loadGame();
    useGameStore.getState().registerEngine(this);
  }

  // --- UI/HUD Helper Methods ---
  public getMinimapData() {
    return {
      player: { x: this.playerEntity.x, z: this.playerEntity.z },
      monsters: this.monsters.map(m => ({ x: m.x, z: m.z }))
    };
  }

  private initThree() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1c); // Deep twilight slate
    this.scene.fog = new THREE.FogExp2(0x0a0f1c, 0.022); // Increased fog density for atmospheric depth

    // Tighter FOV for better mobile focus
    this.camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 1000);
    // Ragnarok signature high angle 3/4 isometric perspective - closer for mobile
    this.camera.position.set(0, 7.5, 11.5);

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

    // Ambient Lighting - slightly reduced for higher directional contrast
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    this.scene.add(ambientLight);

    // Cinematic rim lighting setup (Warm/Cool contrast)
    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.3); // Warm sunlight/moon offset
    dirLight.position.set(25, 45, -15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 100;
    // Tighter shadow bounds for crisper resolution
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    dirLight.shadow.bias = -0.001; // Reduce shadow acne
    this.scene.add(dirLight);

    // Secondary fill light for color depth
    const fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.4); // Cool cyan fill
    fillLight.position.set(-20, 15, 25);
    this.scene.add(fillLight);
  }

  private handleResize = () => {
    if (!this.container || this.isDestroyed) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  // --- 2. GAME WORLD ENTITIES SPAWNER SETUP ---
  private initWorld() {
    // 1. Draw glowing grid grasslands
    this.gameRenderer.createGroundMap();

    // Instanced High-Performance Rocks (Unified Single Draw Call for all rocks/columns)
    this.sceneGraph.instancedEnvironment.spawnInstancedRocks(this.scene, 30);

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

    // 3. Populate roaming Monsters
    this.spawnRoamers();

    // 4. Populate stable friendly NPCs
    this.spawnNPCs();

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

  // Helper method to segment monster territories into logical progression areas (like classic Ragnarok maps)
  private getTerritoryCoordinates(type: 'poring' | 'poporing' | 'pecopeco' | 'boss_mvp'): { x: number, z: number } {
    let x = 0;
    let z = 0;
    if (type === 'poring') {
      // Southeast quadrant (Novice Fields): Porings patrol here peacefully
      x = 14 + Math.random() * 24;
      z = 14 + Math.random() * 24;
    } else if (type === 'poporing') {
      // South / Southwest grasslands: Poporings patrol
      x = -14 - Math.random() * 24;
      z = 14 + Math.random() * 24;
    } else if (type === 'pecopeco') {
      // Northwest wind prairies: fast aggressive PecoPeco runners chase targets here
      x = -14 - Math.random() * 24;
      z = -14 - Math.random() * 24;
    } else {
      // Northeast Volcanic Caldera: Baphomet nest around (32, -32)
      x = 24 + Math.random() * 14;
      z = -24 - Math.random() * 14;
    }

    // Safety radius scaling clamp for playable arena integration (radius max 44)
    const dist = Math.sqrt(x*x + z*z);
    if (dist > 44) {
      x = (x / dist) * 44;
      z = (z / dist) * 44;
    }
    return { x, z };
  }

  private spawnNPCs() {
    this.npcs = [
      {
        id: 'npc_kafra',
        name: 'Kafra Merchant ★ Clarice',
        type: 'npc',
        npcType: 'kafra',
        x: -3,
        y: 0,
        z: -2, // centered, welcoming near the spawn gate
        facing: 'right',
        state: 'idle',
        currentHp: 100,
        currentSp: 100,
        maxHp: 100,
        maxSp: 100,
        targetEntityId: null,
        hitRecoveryEndTime: 0,
        animationTimer: 0,
        animationFrame: 0
      },
      {
        id: 'npc_crusader',
        name: 'Job Master ★ Freya',
        type: 'npc',
        npcType: 'crusader_instructor',
        x: 4,
        y: 0,
        z: 4, // trainings yard quadrant
        facing: 'left',
        state: 'idle',
        currentHp: 100,
        currentSp: 100,
        maxHp: 100,
        maxSp: 100,
        targetEntityId: null,
        hitRecoveryEndTime: 0,
        animationTimer: 0,
        animationFrame: 0
      }
    ];
  }

  private spawnRoamers() {
    const mobTypes: ('poring' | 'poporing' | 'pecopeco')[] = ['poring', 'poporing', 'pecopeco'];
    const mobConfigs = {
      poring: { name: 'Poring Pink', maxHp: 80, exp: 12, jobExp: 10, size: 1.0 },
      poporing: { name: 'Poporing Tox', maxHp: 190, exp: 35, jobExp: 28, size: 1.1 },
      pecopeco: { name: 'PecoPeco Runner', maxHp: 380, exp: 90, jobExp: 75, size: 1.3 }
    };

    // Spawn 12 roamer minions
    for (let i = 0; i < 12; i++) {
      const type = mobTypes[i % mobTypes.length];
      const conf = mobConfigs[type];
      const coords = this.getTerritoryCoordinates(type);

      const mob: Entity = {
        id: `mob_minion_${i}_${Date.now()}`,
        name: conf.name,
        type: 'monster',
        mobType: type,
        x: coords.x,
        y: 0,
        z: coords.z,
        facing: Math.random() > 0.5 ? 'right' : 'left',
        state: 'idle',
        currentHp: conf.maxHp,
        currentSp: 10,
        maxHp: conf.maxHp,
        maxSp: 10,
        targetEntityId: null,
        hitRecoveryEndTime: 0,
        animationTimer: 0,
        animationFrame: 0,
        activeEffects: []
      };
      this.monsters.push(mob);
    }

    // Spawn BOSS MVP Baphomet!
    this.spawnBossMvp();
  }

  private spawnBossMvp() {
    const baphometCoords = this.getTerritoryCoordinates('boss_mvp');
    const baphomet: Entity = {
      id: 'baphomet_mvp_boss',
      name: 'BAPHOMET ★ MVP',
      type: 'boss_mvp',
      x: baphometCoords.x,
      y: 0,
      z: baphometCoords.z,
      facing: 'left',
      state: 'idle',
      currentHp: 48000,
      currentSp: 1000,
      maxHp: 48000,
      maxSp: 1000,
      targetEntityId: null,
      hitRecoveryEndTime: 0,
      animationTimer: 0,
      animationFrame: 0
    };
    this.monsters.push(baphomet);

    useGameStore.getState().addCombatLog('★ ¡ALERTA! El Boss MVP Baphomet ha invocado su presencia en el mapa ★', 'mvp');
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
            isJoystick: true,
            isGesture: false,
            startTime: Date.now()
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
            isJoystick: false,
            isGesture: false,
            startTime: Date.now()
          });
        }
      });

      // Handle multi-touch initial pinch distance
      if (e.touches.length === 2 && !this.joystickTouchId) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        this.initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
        this.initialCameraZoom = store.cameraZoom;
        
        // Mark both as gestures to prevent tap triggers
        Array.from(e.touches).forEach(t => {
          const info = this.activeTouchPoints.get(t.identifier);
          if (info) info.isGesture = true;
        });
      } else {
        this.initialPinchDistance = null;
      }
    }, { passive: false });

    // TOUCH MOVE DRAG EVENT
    el.addEventListener('touchmove', (e: TouchEvent) => {
      const rect = el.getBoundingClientRect();
      const store = useGameStore.getState();

      // PINCH TO ZOOM HANDLING (2 Fingers)
      if (e.touches.length === 2 && this.initialPinchDistance !== null && !this.joystickTouchId) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        const currentDist = Math.sqrt(dx * dx + dy * dy);
        
        const zoomFactor = currentDist / this.initialPinchDistance;
        const newZoom = Math.max(0.4, Math.min(2.5, this.initialCameraZoom * zoomFactor));
        store.setCameraZoom(newZoom);
        
        return; // Multi-touch zoom overrides other moves
      }

      Array.from(e.touches).forEach((t) => {
        const touchX = t.clientX - rect.left;
        const touchY = t.clientY - rect.top;

        const info = this.activeTouchPoints.get(t.identifier);
        if (info) {
          const prevX = info.currentX;
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
          } else if (e.touches.length === 1) {
            // CAMERA LATERAL SWIPE ROTATION (1 Finger swipe)
            const deltaX = touchX - prevX;
            const totalDx = Math.abs(touchX - info.startX);
            
            // If horizontal movement threshold met, rotate camera
            if (totalDx > 10 || info.isGesture) {
              info.isGesture = true;
              const rotationSensitivity = 0.5;
              const newAngle = (store.cameraAngleY || 0) + deltaX * rotationSensitivity;
              store.setCameraAngleY(newAngle);
            }
          }
        }
      });
    }, { passive: false });

    // TOUCH END
    el.addEventListener('touchend', (e: TouchEvent) => {
      const rect = el.getBoundingClientRect();
      const store = useGameStore.getState();

      Array.from(e.changedTouches).forEach((t) => {
        const info = this.activeTouchPoints.get(t.identifier);
        
        if (info) {
          const touchX = t.clientX - rect.left;
          const touchY = t.clientY - rect.top;
          const duration = Date.now() - info.startTime;
          const distFromStart = Math.sqrt(Math.pow(touchX - info.startX, 2) + Math.pow(touchY - info.startY, 2));

          // TAP DETECTION: Not a joystick, not a multi-finger pinch, not a long drag/swipe
          if (!info.isJoystick && !info.isGesture && duration < 300 && distFromStart < 20) {
            this.triggerScreenTouchRaycast(touchX, touchY, rect.width, rect.height, 'touch');
          }

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
        }
      });

      if (e.touches.length < 2) {
        this.initialPinchDistance = null;
      }
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

    const mobHits = this.raycaster.intersectObjects(spriteArray);
    if (mobHits.length > 0) {
      const selectedSprite = mobHits[0].object;
      
      let matchedNode: EntitySpriteNode | undefined;
      for (const node of Array.from(this.sceneGraph.nodes.values())) {
        if (node.object3D === selectedSprite && node instanceof EntitySpriteNode) {
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

        store.setTarget(mob.id, mob.name, mob.currentHp, mob.maxHp);
        store.addCombatLog(`Target lock: enfocando en [${mob.name}] LV: 45.`, 'system');
      }
    } else if (item.type === 'skill' && item.skillId) {
      this.triggerSkillCastExecution(item.skillId);
    } else if (item.type === 'potion') {
      store.drinkPotion();
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

    // Weight penalty check (90% limit prevents skills and attacks!)
    const weightInfo = store.getWeightInfo();
    if (weightInfo.percent >= 90.0) {
      store.addCombatLog(`❌ Peso excesivo para combate (${weightInfo.percent.toFixed(1)}%). No puedes usar habilidades ni atacar.`, 'system');
      gameAudio.playFail();
      return;
    }

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

      const rawDmg = Math.floor(store.stats.atk * multiplier);
      const randOffset = Math.floor((Math.random() - 0.5) * rawDmg * 0.15);
      const isCrit = Math.random() < (store.stats.luk * 0.005 + 0.05);

      let mobDef = 2;
      if (targetMob) {
        if (targetMob.type === 'boss_mvp') {
          mobDef = 55;
        } else if (targetMob.mobType === 'pecopeco') {
          mobDef = 15;
        } else if (targetMob.mobType === 'poporing') {
          mobDef = 10;
        } else if (targetMob.mobType === 'poring') {
          mobDef = 2;
        }
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
          isCrit ? 1.8 : 1.35, 
          targetMob.x, 2.2, targetMob.z
        );

        // Play impact audio notes
        gameAudio.playHit();
        this.screenShakeIntensity = isCrit ? 0.45 : 0.14;
        triggerHaptic(isCrit ? [25, 30, 25] : 18);
        if (isCrit) this.floatingTextSpawner('¡BOOM!', '#f59e0b', 2.0, targetMob.x, 2.8, targetMob.z);

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

    // Weight penalty check (90% limit stops combat entirely!)
    const weightInfo = store.getWeightInfo();
    const isOverencumbered = weightInfo.percent >= 90.0;
    if (isOverencumbered) {
      this.playerEntity.animationTimer += dt;
      return;
    }

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

        // Perform combat attack math calculations
        let mobFlee = 5;
        let mobDef = 2;
        if (targetMob) {
          if (targetMob.type === 'boss_mvp') {
            mobFlee = 55;
            mobDef = 55;
          } else if (targetMob.mobType === 'pecopeco') {
            mobFlee = 30;
            mobDef = 15;
          } else if (targetMob.mobType === 'poporing') {
            mobFlee = 18;
            mobDef = 10;
          } else if (targetMob.mobType === 'poring') {
            mobFlee = 5;
            mobDef = 2;
          }
        }

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
            triggerHaptic(12); // Short snappy vibration on trigger release
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
              isCrit ? 1.6 : 1.25, 
              targetMob.x, 2.0, targetMob.z
            );

            gameAudio.playHit();
            this.screenShakeIntensity = isCrit ? 0.22 : 0.08;
            triggerHaptic(isCrit ? [20, 30, 20] : 15); // Light tactile pulse on hit
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

    // Give EXP reward points
    const expBase = mob.type === 'boss_mvp' ? 12000 : (mob.mobType === 'poring' ? 15 : mob.mobType === 'poporing' ? 45 : 120);
    const expJob = mob.type === 'boss_mvp' ? 9500 : (mob.mobType === 'poring' ? 12 : mob.mobType === 'poporing' ? 36 : 95);

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
    } else {
      store.addCombatLog(`Matas a [${mob.name}]. +${expBase} EXP base, +${expJob} EXP job.`, 'system');
    }

    // Reap loot
    this.spawnLoot(mob);

    // Respawn roamer mob timer
    setTimeout(() => {
      this.respawnMonster(mob.id, mob.mobType);
    }, 6000 + Math.random() * 8000);
  }

  // Respawn a dead monster
  private respawnMonster(id: string, customMobType?: any) {
    if (this.isDestroyed) return;
    const index = this.monsters.findIndex(m => m.id === id);
    if (index === -1) return;

    const type = customMobType || 'poring';
    const coords = this.getTerritoryCoordinates(type as any);

    const maxHps = { poring: 80, poporing: 190, pecopeco: 380, boss_mvp: 48000 };
    const h = maxHps[type as keyof typeof maxHps] || 100;

    this.monsters[index] = {
      id: id,
      name: type === 'boss_mvp' ? 'BAPHOMET ★ MVP' : (type === 'poring' ? 'Poring Pink' : type === 'poporing' ? 'Poporing Tox' : 'PecoPeco Runner'),
      type: type === 'boss_mvp' ? 'boss_mvp' : 'monster',
      mobType: type as any,
      x: coords.x,
      y: 0,
      z: coords.z,
      facing: Math.random() > 0.5 ? 'right' : 'left',
      state: 'idle',
      currentHp: h,
      currentSp: 10,
      maxHp: h,
      maxSp: 10,
      targetEntityId: null,
      hitRecoveryEndTime: 0,
      animationTimer: 0,
      animationFrame: 0
    };

    // Unlink old decayed node and link newly spawned monster instance
    this.sceneGraph.unlinkEntity(id);
    this.sceneGraph.linkEntity(this.monsters[index], {}, this.gameRenderer);

    if (type === 'boss_mvp') {
      useGameStore.getState().addCombatLog('★ ¡ALERTA! El Boss MVP Baphomet ha respawneado en el mapa ★', 'mvp');
    }
  }

  private spawnLoot(mob: Entity) {
    const store = useGameStore.getState();
    const isMvp = mob.type === 'boss_mvp';
    const mobType = isMvp ? 'boss_mvp' : mob.mobType;
    if (!mobType) return;

    const drops = store.lootTables[mobType] || [];
    let dropIndex = 0;

    drops.forEach((drop) => {
      const roll = Math.random();
      if (roll <= drop.chance) {
        const itemTemplate = ITEM_DATABASE[drop.itemId];
        if (!itemTemplate) return;

        let quantity = 1;
        if (itemTemplate.type === 'material' && itemTemplate.id !== 'mvp_coin') {
          quantity = Math.floor(Math.random() * 3) + 1;
        }

        const rarityMapped = itemTemplate.rarity === 'normal' ? 'common' : itemTemplate.rarity;

        const loot: GroundItem = {
          id: `loot_${Math.random()}_${Date.now()}_${dropIndex}`,
          name: itemTemplate.name,
          itemId: itemTemplate.id,
          x: mob.x + (Math.random() - 0.5) * 3,
          z: mob.z + (Math.random() - 0.5) * 3,
          y: 0.2,
          quantity: quantity,
          rarity: rarityMapped,
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
        dropIndex++;

        store.addCombatLog(
          `[Loot Drop] ${rarityMapped.toUpperCase()}: ¡Cayó ${loot.name} x${quantity}! (${(drop.chance * 100).toFixed(1)}%)`,
          rarityMapped === 'epic' ? 'mvp' : 'loot'
        );
      }
    });
  }

  // Dummy placeholder to ignore original single spawn code
  private spawnLootSingleIgnored(mob: Entity) {
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
    if (owner.type === 'player') {
      triggerHaptic(10); // Snappy release vibration
    }
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

    // Trigger haptic feedback on projectile impact
    if (target.type === 'player') {
      triggerHaptic([35, 30, 35]); // heavy stagger touch effect
    } else if (proj.ownerEntityId === this.playerEntity.id) {
      triggerHaptic(proj.isCrit ? [20, 30, 20] : 12); // subtle confirmation hit
    }

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
    
    if (npc.npcType === 'kafra') {
      store.setNpcDialogue({
        npcId: npc.id,
        npcName: npc.name,
        npcType: 'kafra',
        text: '¡Hola aventurero! Bienvenida a los servicios de la Corporación Kafra. ¿Cómo te gustaría que te asista hoy?',
        options: [
          { label: 'Otorga bendiciones divinas (AGI & Blessing buffs)', actionParam: 'buffs' },
          { label: 'Heal: Restaurar HP/SP y recargar Red Potions', actionParam: 'heal' },
          { label: 'Pedir paquete de Red Potions gratis (+15 pociones)', actionParam: 'buy_potions' },
          { label: 'Cerrar conversación', actionParam: 'close' }
        ]
      });
    } else if (npc.npcType === 'crusader_instructor') {
      const playerJob = store.jobClass;
      const jobLvl = store.stats.jobLevel;
      
      let dialogText = '¡Atención guerrera! El verdadero poder viene de elegir tu camino. ¿Te interesa cambiar de clase para aprender nuevas habilidades?';
      let options: { label: string; actionParam: string }[] = [];

      if (playerJob === 'Novice') {
        if (jobLvl >= 10) {
          dialogText = 'Veo que has entrenado duro como Novice. ¡Estás listo para tu primer intercambio de clase! ¿Qué camino eliges?';
          options = [
            { label: 'Convertirme en Swordsman (Espadachín)', actionParam: 'class_swordsman' },
            { label: 'Convertirme en Mage (Mago)', actionParam: 'class_mage' },
            { label: 'Convertirme en Archer (Arquero)', actionParam: 'class_archer' }
          ];
        } else {
          dialogText = `Veo potencial en ti, pero aún eres un Novice inexperto (Job Lv ${jobLvl}/10). Regresa cuando alcances el Nivel de Job 10 para tu primera especialización.`;
        }
      } else if (['Swordsman', 'Mage', 'Archer'].includes(playerJob)) {
        if (jobLvl >= 40) {
          dialogText = `¡Impresionante! Has dominado el arte del ${playerJob}. Es hora de tu segunda evolución.`;
          if (playerJob === 'Swordsman') options.push({ label: 'Ascender a Knight (Caballero)', actionParam: 'class_knight' });
          if (playerJob === 'Mage') options.push({ label: 'Ascender a Wizard (Mago)', actionParam: 'class_wizard' });
          if (playerJob === 'Archer') options.push({ label: 'Ascender a Hunter (Cazador)', actionParam: 'class_hunter' });
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
        description: '+20 AGI! Velocidad de movimiento y ASPD aumentados.'
      });

      store.addBuff({
        id: 'blessing',
        name: 'Blessing',
        durationMs: 40000,
        maxDurationMs: 40000,
        icon: '✝',
        description: '+20 STR/INT/DEX! ATK, curas y casteo acelerados.'
      });

      // Apply modifiers directly to character stats
      const baseStats = store.stats;
      store.updateStats({
        agi: baseStats.agi + 20,
        str: baseStats.str + 20,
        int: baseStats.int + 20,
        dex: baseStats.dex + 20
      });
      
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

      // Max out Red potions to 15
      store.setPotCount(15);
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
      store.setPotCount(store.potCount + 15);
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

      const dist = Math.sqrt((this.playerEntity.x - mob.x) ** 2 + (this.playerEntity.z - mob.z) ** 2);
      
      // Target player if hit, or if Aggresive boss (Baphomet has massive vision sense!)
      const visionLimit = mob.type === 'boss_mvp' ? 16.0 : 6.0;
      const isAggressive = mob.type === 'boss_mvp' || mob.mobType === 'pecopeco';

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
            const hitScore = 150 + (isBoss ? 120 : 15);
            const fleeScore = store.stats.flee;

            const dodgePercent = Math.min(0.95, Math.max(0.05, (fleeScore - hitScore + 100) / 100));
            const playerEvaded = Math.random() < dodgePercent;

            if (playerEvaded) {
              // Miss!
              this.floatingTextSpawner('FLEE', '#94a3b8', 1.0, this.playerEntity.x, 2.0, this.playerEntity.z);
              store.addCombatLog(`[${mob.name}] te ataca y evades su golpe (FLEE).`, 'system');
            } else {
              // Pierce impact damage
              const strikeAtk = isBoss ? 850 : (mob.mobType === 'pecopeco' ? 45 : 18);
              const randVariation = Math.floor((Math.random() - 0.5) * strikeAtk * 0.1);
              let rawDmg = strikeAtk + randVariation - (store.stats.def * 0.15);
              
              let finalDmg = Math.floor(Math.max(1, rawDmg));
              
              this.playerEntity.currentHp = Math.max(0, this.playerEntity.currentHp - finalDmg);
              this.playerEntity.state = 'hit';
              this.playerEntity.hitRecoveryEndTime = now + 240; // temporary hitlock stun stagger frame
              triggerHaptic(isBoss ? [45, 40, 45] : [30, 30, 30]); // Heavy tactile feed on damage

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

              this.floatingTextSpawner(`${finalDmg}`, '#f43f5e', isBoss ? 1.55 : 1.15, this.playerEntity.x, 2.0, this.playerEntity.z);
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
    
    this.playerEntity.state = 'idle';
    this.playerEntity.x = 0;
    this.playerEntity.z = 0;
    this.playerEntity.y = 0;
    this.playerEntity.targetX = undefined;
    this.playerEntity.targetZ = undefined;
    this.playerEntity.targetEntityId = null;
    this.playerEntity.currentHp = store.stats.maxHp;
    this.playerEntity.currentSp = store.stats.maxSp;

    store.setPlayerHpSp(this.playerEntity.currentHp, this.playerEntity.currentSp);
    store.setTarget(null);
    store.addCombatLog('✨ Has revivido en las coordenadas centrales de Prontera. ¡A batallar! ✨', 'system');
    gameAudio.playHeal();
  }

  // --- 8. TICK GENERAL COORDINATES MANAGEMENT ---
  private tickCoordinates(dt: number) {
    if (this.playerEntity.state === 'death') return;

    const store = useGameStore.getState();
    const tickScale = dt * 60.0;

    // Recovers HP/SP smoothly scaling, subject to weight capacity restrictions (<50.0%)
    const weightInfo = store.getWeightInfo();
    const canRegen = weightInfo.percent < 50.0;

    if (canRegen) {
      const hpRegenRate = (0.04 + store.stats.vit * 0.011) * tickScale;
      this.playerEntity.currentHp = Math.min(this.playerEntity.maxHp, this.playerEntity.currentHp + hpRegenRate);

      const spRegenRate = (0.018 + store.stats.int * 0.006) * tickScale;
      this.playerEntity.currentSp = Math.min(this.playerEntity.maxSp, this.playerEntity.currentSp + spRegenRate);
    }

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

    // Execute character controller physics simulation with inertia, boundary & obstacle collision
    if (this.charController) {
      const isCastingOrAttacking = this.activeCast !== null || this.playerEntity.state === 'attack';
      const lockedTargetId = this.playerEntity.targetEntityId;
      const lockedTargetMob = lockedTargetId ? (this.monsters.find(m => m.id === lockedTargetId) || null) : null;

      this.charController.updateMovement(dt, tickScale, isCastingOrAttacking, lockedTargetMob);
      this.playerEntity.y = this.getGroundHeight(this.playerEntity.x, this.playerEntity.z);
    }
  }

  private getGroundHeight(x: number, z: number): number {
    return getTerrainHeight(x, z);
  }

  // Spawns damage numeric popups floating up
  public floatingTextSpawner(text: string, color: string, scaleSize: number, x: number, y: number, z: number) {
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
    this.sceneGraph.updateGraph(this.fixedTimeStep, cameraPos, now, this.playerEntity.x, this.playerEntity.z);

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
        mesh = (this.gameRenderer as any).spawnProjectileMesh(proj.type, proj.x, proj.y, proj.z);
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

    // 3. Auto physical combat ticker
    this.tickAutoCombat(now, dt);

    // 3.5 Loot System ticker
    this.tickLootSystem(now, dt);

    // 4. Roaming monster behaviors and retaliating AI loop
    this.tickMonsterSystem(now, dt);
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

      let sprite = this.effectMeshes[txt.id] as any;
      if (!sprite) {
        // Dynamically create floating text sprite texture
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 48;
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
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        sprite = new THREE.Sprite(mat);
        sprite.scale.set(3, 1, 1);
        this.scene.add(sprite);
        this.effectMeshes[txt.id] = sprite;
      }

      sprite.position.set(txt.x, txt.y, txt.z);

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

    // 4b. Animate Custom Map Decorations (Rotating/hovering plaza crystal and pulsing abyssal portal)
    if (this.gameRenderer) {
      if ((this.gameRenderer as any)._plazaCrystal) {
        (this.gameRenderer as any)._plazaCrystal.rotation.y = timeSec * 0.45;
        (this.gameRenderer as any)._plazaCrystal.position.y = 3.5 + Math.sin(timeSec * 1.6) * 0.16;
      }
      if ((this.gameRenderer as any)._dungeonPortal && (this.gameRenderer as any)._dungeonPortalCore) {
        (this.gameRenderer as any)._dungeonPortal.rotation.z = timeSec * 1.1;
        (this.gameRenderer as any)._dungeonPortalCore.scale.setScalar(0.93 + Math.abs(Math.sin(timeSec * 2.8)) * 0.15);
      }
    }

    // 5. Dynamic Camera follows character position with fixed offset + screen shake!
    const shakeOffsetX = (Math.random() - 0.5) * this.screenShakeIntensity * 3.5;
    const shakeOffsetY = (Math.random() - 0.5) * this.screenShakeIntensity * 3.5;

    const gameStore = useGameStore.getState();
    const cameraZoom = gameStore.cameraZoom ?? 1.0;
    const cameraAngleYDeg = gameStore.cameraAngleY ?? 0;
    const cameraOffsetZ = gameStore.cameraOffsetZ ?? 2.2;

    const targetState = gameStore.targetEntityId != null;
    // Dynamic zoom based on combat (slightly zoomed out for better spatial awareness, zoomed in for exploration)
    const baseZoomY = targetState ? 10 : 7.5;
    const baseZoomZ = targetState ? 14 : 11.5;

    // Apply scaling factor based on zoom (smaller zoom value = zooms out, larger zoom value = zooms in)
    const zoomMultiplier = 1 / cameraZoom;
    const zoomY = baseZoomY * zoomMultiplier;
    const zoomZ = baseZoomZ * zoomMultiplier;

    // Convert rotation angle around Y-axis to radians
    const theta = (cameraAngleYDeg * Math.PI) / 180;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    // Calculate dynamic camera following target
    const targetCamX = this.playerEntity.x + zoomZ * sinT + shakeOffsetX;
    const targetCamY = this.playerEntity.y + zoomY + shakeOffsetY;
    const targetCamZ = this.playerEntity.z + zoomZ * cosT;

    // Smooth camera interpolation for dynamic zoom & tracking
    this.camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.08);

    // Align the look-at shift offset with the camera's rotation angle
    const lookX = this.playerEntity.x + cameraOffsetZ * sinT;
    const lookY = this.playerEntity.y + 1.2;
    const lookZ = this.playerEntity.z + cameraOffsetZ * cosT;

    this.camera.lookAt(lookX, lookY, lookZ);

    // Standard high-render tick pipeline draws Three.js frames
    this.renderer.render(this.scene, this.camera);
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
        const itemId = item.itemId;

        // Add to inventory store using our new slot-based action!
        const addResult = store.addItemSlot(itemId, item.quantity);
        if (addResult.added <= 0) {
          return false; // Backpack is completely full, leave on ground!
        }

        // --- 3D Flying Text Visual Notification ---
        const color = item.rarity === 'epic' ? '#f59e0b' : (item.rarity === 'rare' ? '#38bdf8' : '#e2e8f0');
        this.floatingTextSpawner(`+${addResult.added} ${item.name}`, color, 1.25, this.playerEntity.x, 2.3, this.playerEntity.z);

        // Adjust Red Potion quick tally counter
        if (itemId === 'red_potion') {
          const totalNewPots = store.inventory
            .filter(i => i.id === 'red_potion')
            .reduce((acc, curr) => acc + curr.quantity, 0);
          store.setPotCount(totalNewPots);
        }

        if (addResult.added < item.quantity) {
          // Partially picked up! Adjust remainder on ground
          item.quantity -= addResult.added;
          store.addCombatLog(`Recogidos parcialmente x${addResult.added} de la pila. Quedan x${item.quantity} en tierra.`, 'system');
          return false;
        }

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
