import * as THREE from 'three';

export class DebugPanel {
  private dom: HTMLDivElement | null = null;
  private visible = false;
  private frameTimes: number[] = [];
  private lastFrameTime = performance.now();
  private onToggle?: (visible: boolean) => void;

  constructor(onToggle?: (visible: boolean) => void) {
    this.onToggle = onToggle;
    this.create();
    this.bindKeys();
  }

  private create() {
    this.dom = document.createElement('div');
    this.dom.id = 'epicearth-debug';
    this.dom.style.cssText = [
      'position:fixed', 'top:8px', 'left:8px',
      'font-family:monospace', 'font-size:12px',
      'color:#0f0', 'background:rgba(0,0,0,0.75)',
      'padding:8px 12px', 'border-radius:4px',
      'z-index:9999', 'pointer-events:none',
      'display:none', 'white-space:pre',
      'line-height:1.5', 'min-width:200px',
    ].join(';');
    document.body.appendChild(this.dom);
  }

  private bindKeys() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F3') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  toggle() {
    this.visible = !this.visible;
    if (this.dom) this.dom.style.display = this.visible ? 'block' : 'none';
    this.onToggle?.(this.visible);
  }

  update(
    renderer: THREE.WebGLRenderer | undefined,
    stats: {
      activeChunks: number;
      poolChunks: number;
      totalProps: number;
      totalTrees: number;
      totalLandmarks: number;
      mobileProfile: string;
      fps: number;
      currentZone?: string;
    }
  ) {
    if (!this.visible || !this.dom) return;

    const now = performance.now();
    this.frameTimes.push(now - this.lastFrameTime);
    if (this.frameTimes.length > 60) this.frameTimes.shift();
    this.lastFrameTime = now;

    const avgMs = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const maxMs = Math.max(...this.frameTimes);
    const p99Ms = this.frameTimes.slice().sort((a, b) => a - b)[Math.floor(this.frameTimes.length * 0.99)] || 0;

    let calls = 0, triangles = 0, textures = 0;
    if (renderer) {
      const info = renderer.info;
      calls = info.render?.calls ?? 0;
      triangles = info.render?.triangles ?? 0;
      textures = info.memory?.textures ?? 0;
    }

    const mem = (performance as any).memory;
    const memStr = mem ? `${(mem.usedJSHeapSize / 1048576).toFixed(1)}MB` : 'N/A';

    this.dom.textContent = [
      `FPS: ${stats.fps.toFixed(1)}  (avg ${(1000/avgMs).toFixed(0)})`,
      `Frame: ${avgMs.toFixed(1)}ms  max ${maxMs.toFixed(1)}  p99 ${p99Ms.toFixed(1)}`,
      `Draw: ${calls} calls  ${triangles} tris`,
      `Tex: ${textures}  Mem: ${memStr}`,
      `Chunks: ${stats.activeChunks} active  ${stats.poolChunks} pool`,
      `Props: ${stats.totalProps}  Trees: ${stats.totalTrees}  Landmarks: ${stats.totalLandmarks}`,
      `Profile: ${stats.mobileProfile}`,
      stats.currentZone ? `Zone: ${stats.currentZone}` : '',
      `[F3] toggle`,
    ].join('\n');
  }

  destroy() {
    if (this.dom && this.dom.parentNode) {
      this.dom.parentNode.removeChild(this.dom);
    }
    this.dom = null;
  }
}
