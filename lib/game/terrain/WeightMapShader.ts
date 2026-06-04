import * as THREE from 'three';

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform sampler2D uWeightMap;
uniform sampler2D uAtlas;
uniform vec2 uBiomeTiles[4];

varying vec2 vUv;

const float TILES_PER_ROW = 4.0;
const float WEIGHT_MAP_SIZE = 32.0;
const float HALF_TEXEL = 0.5 / 32.0;

vec4 sampleTile(float tileIndex, vec2 uv) {
  float tx = mod(tileIndex, TILES_PER_ROW);
  float ty = floor(tileIndex / TILES_PER_ROW);
  vec2 tileUV = vec2(
    (tx + uv.x) / TILES_PER_ROW,
    (ty + uv.y) / TILES_PER_ROW
  );
  return texture2D(uAtlas, tileUV);
}

void main() {
  vec2 cellCoord = floor(vUv * WEIGHT_MAP_SIZE) + 0.5;
  vec2 weightUV = cellCoord / WEIGHT_MAP_SIZE;
  vec4 weights = texture2D(uWeightMap, weightUV);

  vec2 cellUV = fract(vUv * WEIGHT_MAP_SIZE);

  float totalBlend = weights.r + weights.g + weights.b + weights.a;

  vec4 color = vec4(0.0);
  if (totalBlend < 0.01) {
    color = sampleTile(uBiomeTiles[0].x, cellUV);
  } else {
    float accumulated = 0.0;
    for (int i = 0; i < 4; i++) {
      float w = 0.0;
      if (i == 0) { w = weights.r; }
      else if (i == 1) { w = weights.g; }
      else if (i == 2) { w = weights.b; }
      else { w = weights.a; }
      if (w >= 0.01) {
        float tileIdx = uBiomeTiles[i].x;
        float blend = w / max(0.001, 1.0 - accumulated);
        vec4 tileColor = sampleTile(tileIdx, cellUV);
        color = mix(color, tileColor, blend);
        accumulated += w;
      }
    }
    if (accumulated < 0.01) {
      color = sampleTile(uBiomeTiles[0].x, cellUV);
    }
  }

  gl_FragColor = vec4(color.rgb, 1.0);
}
`;

export class WeightMapShader {
  static createMaterial(
    weightMap: THREE.DataTexture,
    atlas: THREE.Texture,
    biomeTiles: [number, number, number, number]
  ): THREE.ShaderMaterial {
    weightMap.minFilter = THREE.NearestFilter;
    weightMap.magFilter = THREE.NearestFilter;

    const tileVecs = biomeTiles.map(t => new THREE.Vector2(t, 0));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uWeightMap: { value: weightMap },
        uAtlas: { value: atlas },
        uBiomeTiles: { value: tileVecs },
      },
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
    });
    return mat;
  }

  static generateWeightMap(biome: string): THREE.DataTexture {
    const size = 32;
    const data = new Uint8Array(size * size * 4);

    const biomeTileSets: Record<string, [number, number, number, number]> = {
      grassland: [0, 4, 8, 12],
      forest: [0, 4, 1, 8],
      desert: [8, 12, 4, 0],
      swamp: [1, 4, 0, 8],
      volcanic: [12, 8, 4, 0],
      snow: [4, 0, 8, 12],
      dungeon: [8, 12, 4, 1],
    };

    const rng = mulberry32(hashStr(biome));

    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        const idx = (z * size + x) * 4;

        const n1 = fbm(x / size, z / size, rng);
        const n2 = fbm(x / size * 2 + 10, z / size * 2 + 10, rng);

        const rd = clamp01(n1);
        const gr = clamp01(n2) * 0.4;

        if (rd < 0.35) {
          data[idx] = floorToU8(0.7 + gr);
          data[idx + 1] = floorToU8(0.2 + gr * 0.5);
          data[idx + 2] = floorToU8(gr * 0.5);
          data[idx + 3] = 0;
        } else if (rd < 0.65) {
          data[idx] = floorToU8(0.3 + gr);
          data[idx + 1] = floorToU8(0.5 + gr);
          data[idx + 2] = floorToU8(0.1);
          data[idx + 3] = floorToU8(gr * 0.3);
        } else if (rd < 0.85) {
          data[idx] = floorToU8(0.1);
          data[idx + 1] = floorToU8(0.4 + gr);
          data[idx + 2] = floorToU8(0.3 + gr);
          data[idx + 3] = 0;
        } else {
          data[idx] = floorToU8(gr * 0.3);
          data[idx + 1] = floorToU8(0.1);
          data[idx + 2] = floorToU8(0.3 + gr * 0.5);
          data[idx + 3] = floorToU8(0.4 + gr);
        }

        const pathDist = createPaths(x, z, size);
        if (pathDist < 1.5) {
          data[idx] = 0;
          data[idx + 1] = floorToU8(0.8);
          data[idx + 2] = floorToU8(0.2);
          data[idx + 3] = 0;
        }
      }
    }

    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.needsUpdate = true;
    return tex;
  }
}

function floorToU8(v: number): number {
  return Math.max(0, Math.min(255, Math.floor(v * 255)));
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i); h |= 0;
  }
  return h;
}

function fbm(x: number, z: number, rng: () => number): number {
  let v = 0;
  let a = 0.5;
  for (let i = 0; i < 3; i++) {
    v += a * (Math.sin(x * (4 << i) + z * (7 << i) + rng() * 6.283) * 0.5 + 0.5);
    a *= 0.5;
  }
  return v - 0.5;
}

function createPaths(x: number, z: number, size: number): number {
  const cx = x - size / 2;
  const cz = z - size / 2;
  const paths = [
    { a: 0, b: 0, angle: 0 },
    { a: 0, b: 0, angle: Math.PI / 2 },
  ];
  let minDist = Infinity;
  for (const p of paths) {
    const dx = cx - p.a;
    const dz = cz - p.b;
    const projected = dx * Math.cos(p.angle) + dz * Math.sin(p.angle);
    const perp = Math.sqrt(
      (dx - projected * Math.cos(p.angle)) ** 2 +
      (dz - projected * Math.sin(p.angle)) ** 2
    );
    minDist = Math.min(minDist, Math.abs(perp));
  }
  return minDist;
}
