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
uniform vec4 uPalette[5];
uniform vec2 uChunkOffset;
uniform float uTileSize;

varying vec2 vUv;

const float TILES_PER_ROW = 4.0;

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
  vec2 worldUV = vUv * 32.0;
  vec2 cellUV = fract(worldUV);
  ivec2 cell = ivec2(floor(worldUV));

  vec4 weights = texelFetch(uWeightMap, cell, 0);
  float tiles[4];
  tiles[0] = weights.r * 15.0;
  tiles[1] = weights.g * 15.0;
  tiles[2] = weights.b * 15.0;
  tiles[3] = weights.a * 15.0;

  vec4 color = vec4(0.0);
  float total = 0.0;

  for (int i = 0; i < 4; i++) {
    float idx = tiles[i];
    if (idx < 0.5) continue;
    float blend = (i == 0) ? weights.r : (i == 1) ? weights.g : (i == 2) ? weights.b : weights.a;
    if (i > 0) {
      float prevTotal = total;
      blend = blend / (1.0 - prevTotal);
    }
    vec4 tileColor = sampleTile(idx, cellUV);
    color = mix(color, tileColor, blend);
    total += blend;
  }

  if (total < 0.01) {
    color = sampleTile(0.0, cellUV);
  }

  vec2 paletteUV = vec2(color.r, color.g);
  vec4 paletteColor = uPalette[0];
  paletteColor = mix(paletteColor, uPalette[1], color.b);
  paletteColor.rgb = mix(paletteColor.rgb, color.rgb, 0.7);

  gl_FragColor = vec4(paletteColor.rgb, 1.0);
}
`;

export class WeightMapShader {
  static createMaterial(
    weightMap: THREE.DataTexture,
    atlas: THREE.Texture,
    palette: number[],
    chunkOffset: [number, number]
  ): THREE.ShaderMaterial {
    weightMap.minFilter = THREE.NearestFilter;
    weightMap.magFilter = THREE.NearestFilter;

    const paletteVec4 = palette.map(c => new THREE.Vector4(
      ((c >> 24) & 0xff) / 255,
      ((c >> 16) & 0xff) / 255,
      ((c >> 8) & 0xff) / 255,
      (c & 0xff) / 255
    ));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uWeightMap: { value: weightMap },
        uAtlas: { value: atlas },
        uPalette: { value: paletteVec4 },
        uChunkOffset: { value: new THREE.Vector2(chunkOffset[0], chunkOffset[1]) },
        uTileSize: { value: 0.25 },
      },
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
    });
    // Prevent Three.js from injecting shadow-related uniforms into ShaderMaterial
    mat.fog = false;
    mat.lights = false;
    return mat;
  }

  static generateWeightMap(biome: string): THREE.DataTexture {
    const size = 32;
    const data = new Uint8Array(size * size * 4);

    const biomePresets: Record<string, [number, number, number, number]> = {
      grassland: [0, 4, 8, 12],
      forest: [0, 4, 1, 8],
      desert: [8, 12, 4, 0],
      swamp: [1, 4, 0, 8],
      volcanic: [12, 8, 4, 0],
      snow: [4, 0, 8, 12],
      dungeon: [8, 12, 4, 1],
    };

    const tiles = biomePresets[biome] || biomePresets.grassland;
    const rng = mulberry32(hashStr(biome));

    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        const idx = (z * size + x) * 4;
        const baseNoise = fbm(x / size, z / size, rng);

        if (baseNoise < -0.2) {
          data[idx] = tiles[0] / 15;
          data[idx + 1] = tiles[1] / 15;
          data[idx + 2] = 0;
          data[idx + 3] = 0;
        } else if (baseNoise < 0.1) {
          data[idx] = tiles[1] / 15;
          data[idx + 1] = tiles[0] / 15;
          data[idx + 2] = 0;
          data[idx + 3] = 0;
        } else if (baseNoise < 0.3) {
          data[idx] = tiles[2] / 15;
          data[idx + 1] = tiles[1] / 15;
          data[idx + 2] = tiles[0] / 15;
          data[idx + 3] = 0;
        } else {
          data[idx] = tiles[3] / 15;
          data[idx + 1] = tiles[2] / 15;
          data[idx + 2] = tiles[1] / 15;
          data[idx + 3] = tiles[0] / 15;
        }

        const pathDist = createPaths(x, z, size);
        if (pathDist < 1.5) {
          data[idx] = 8 / 15;
          data[idx + 1] = 4 / 15;
          data[idx + 2] = 0;
          data[idx + 3] = 0;
        }
      }
    }

    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.needsUpdate = true;
    return tex;
  }
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
