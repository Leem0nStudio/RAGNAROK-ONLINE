import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const MC_BASE = 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21.4/assets/minecraft/textures/block';
const OUT = path.resolve('public/textures/tiles');

const TILES = [
  { name: 'grass_block_top.png',         label: 'grass'   }, // 0
  { name: 'dirt.png',                    label: 'dirt'     }, // 1
  { name: 'stone.png',                   label: 'stone'    }, // 2
  { name: 'cobblestone.png',             label: 'cobble'   }, // 3
  { name: 'oak_planks.png',              label: 'planks'   }, // 4
  { name: 'smooth_stone.png',            label: 'smooth'   }, // 5
  { name: 'stone_bricks.png',            label: 'brick'    }, // 6
  { name: 'gravel.png',                  label: 'gravel'   }, // 7
  { name: 'podzol_top.png',              label: 'podzol'   }, // 8
  { name: 'moss_block.png',              label: 'moss'     }, // 9
  { name: 'sand.png',                    label: 'sand'     }, // 10
  { name: 'red_sand.png',                label: 'red_sand' }, // 11
  { name: 'water_still.png',             label: 'water'    }, // 12
  { name: 'ice.png',                     label: 'ice'      }, // 13
  { name: 'blackstone.png',              label: 'basalt'   }, // 14
  { name: 'magma.png',                   label: 'magma'    }, // 15
];

const TILE_SIZE = 64;
const COLS = 4;
const ATLAS_SIZE = TILE_SIZE * COLS;

async function downloadTexture(name) {
  const url = `${MC_BASE}/${name}`;
  console.log(`  ${name}...`);
  try {
    const resp = await fetch(url);
    if (!resp.ok) { console.warn(`    FAILED ${resp.status}`); return null; }
    const buf = Buffer.from(await resp.arrayBuffer());
    // Convert to sRGB 3-channel, resize to 64x64
    const rgba = await sharp(buf)
      .resize(TILE_SIZE, TILE_SIZE, { fit: 'fill' })
      .ensureAlpha()
      .toColorspace('srgb')
      .raw()
      .toBuffer();
    return { rgba, width: TILE_SIZE, height: TILE_SIZE, channels: 4 };
  } catch (e) {
    console.warn(`    ERROR: ${e.message}`);
    return null;
  }
}

function createFallbackTile(i) {
  // Deterministic color per index
  const colors = [
    [45, 90, 39],   // grass green
    [90, 120, 50],  // light green
    [107, 128, 128], // stone gray
    [74, 86, 104],  // dark gray
    [139, 115, 85], // brown
    [160, 137, 106], // light brown
    [140, 120, 100], // tan
    [100, 100, 100], // gravel
    [26, 69, 42],   // dark forest
    [36, 90, 58],   // moss
    [61, 49, 36],   // sand brown
    [90, 74, 58],   // dark sand
    [30, 58, 95],   // water blue
    [42, 74, 122],  // ice blue
    [74, 55, 40],   // dark basalt
    [106, 74, 58],  // magma
  ];
  const c = colors[i] || [128, 128, 128];
  const rgba = Buffer.alloc(TILE_SIZE * TILE_SIZE * 4);
  for (let j = 0; j < rgba.length; j += 4) {
    const noise = (Math.random() - 0.5) * 30;
    rgba[j]     = Math.max(0, Math.min(255, c[0] + noise));
    rgba[j + 1] = Math.max(0, Math.min(255, c[1] + noise));
    rgba[j + 2] = Math.max(0, Math.min(255, c[2] + noise));
    rgba[j + 3] = 255;
  }
  return { rgba, width: TILE_SIZE, height: TILE_SIZE, channels: 4 };
}

async function buildAtlas(tiles, outputPath) {
  console.log(`\n→ ${path.basename(outputPath)}`);

  const composite = [];
  for (let i = 0; i < 16; i++) {
    const src = tiles[i] || createFallbackTile(i);
    const tx = i % COLS;
    const ty = Math.floor(i / COLS);

    const tilePng = await sharp(src.rgba, {
      raw: { width: src.width, height: src.height, channels: src.channels }
    }).png().toBuffer();

    composite.push({
      input: tilePng,
      left: tx * TILE_SIZE,
      top: ty * TILE_SIZE,
    });
  }

  const base = await sharp({
    create: {
      width: ATLAS_SIZE, height: ATLAS_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composite)
    .png()
    .toFile(outputPath);

  console.log(`  → ${base.size} bytes`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  // Download all base textures
  const baseTiles = [];
  for (const t of TILES) {
    const data = await downloadTexture(t.name);
    baseTiles.push(data || createFallbackTile(TILES.indexOf(t)));
  }

  // 1. terrain_atlas.png (standard)
  const terrain = baseTiles.map((d, i) => ({
    rgba: d.rgba, width: d.width, height: d.height, channels: d.channels
  }));
  // Swap tile 1 to coarse_dirt (index 1 → use dirt variant)
  await buildAtlas(terrain, path.join(OUT, 'terrain_atlas.png'));

  // 2. forest_atlas.png (mossy)
  const forest = [...terrain];
  forest[0] = terrain[8]; // grass → podzol
  forest[1] = terrain[9]; // dirt → moss
  forest[10] = terrain[8]; // sand → podzol
  forest[11] = terrain[9]; // red_sand → moss
  await buildAtlas(forest, path.join(OUT, 'forest_atlas.png'));

  // 3. desert_atlas.png (sandy)
  const desert = [...terrain];
  desert[0] = terrain[10]; // grass → sand
  desert[1] = terrain[11]; // dirt → red_sand
  desert[8] = terrain[10]; // podzol → sand
  desert[9] = terrain[11]; // moss → red_sand
  await buildAtlas(desert, path.join(OUT, 'desert_atlas.png'));

  // 4. snow_atlas.png (icy)
  const snow = [...terrain];
  snow[0] = terrain[13]; // grass → ice
  snow[1] = terrain[13]; // dirt → ice
  snow[12] = terrain[13]; // water → ice
  await buildAtlas(snow, path.join(OUT, 'snow_atlas.png'));

  // 5. dungeon_atlas.png (dark stone)
  const dungeon = [...terrain];
  dungeon[0] = terrain[2];  // grass → stone
  dungeon[1] = terrain[3];  // dirt → cobble
  dungeon[8] = terrain[14]; // podzol → blackstone
  dungeon[9] = terrain[15]; // moss → magma
  dungeon[10] = terrain[3]; // sand → cobble
  dungeon[11] = terrain[2]; // red_sand → stone
  await buildAtlas(dungeon, path.join(OUT, 'dungeon_atlas.png'));

  // 6. lava_atlas.png (volcanic)
  const lava = [...terrain];
  lava[0] = terrain[14]; // grass → blackstone
  lava[1] = terrain[15]; // dirt → magma
  lava[4] = terrain[14]; // planks → blackstone
  lava[5] = terrain[15]; // smooth → magma
  lava[8] = terrain[15]; // podzol → magma
  lava[9] = terrain[14]; // moss → blackstone
  lava[12] = terrain[15]; // water → magma
  await buildAtlas(lava, path.join(OUT, 'lava_atlas.png'));

  console.log('\n✅ All atlases generated!\n');
}

main().catch(console.error);
