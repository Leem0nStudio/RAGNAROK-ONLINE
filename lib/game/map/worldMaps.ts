import { MapDefinition } from './types'
import { pronteraCity } from './map-definitions/prontera_city'
import { pronteraField } from './map-definitions/prontera_field'
import { trainingDungeon } from './map-definitions/training_dungeon'
import { laderasMolino } from './map-definitions/laderas_molino'
import { praderaAlba } from './map-definitions/pradera_alba'
import { caminoDelEste } from './map-definitions/camino_del_este'
import { bosqueUmbrio } from './map-definitions/bosque_umbrio'
import { colinasVentosas } from './map-definitions/colinas_ventosas'
import { ruinasAncestrales } from './map-definitions/ruinas_ancestrales'
import { costaDelEco } from './map-definitions/costa_del_eco'
import { cuevaSusurros } from './map-definitions/cueva_susurros'
import { cuevaCristal } from './map-definitions/cueva_cristal'
import { santuarioOlvidado } from './map-definitions/santuario_olvidado'
import { castilloOlvidado } from './map-definitions/castillo_olvidado'

export const WORLD_MAPS: MapDefinition[] = [
  pronteraCity,
  pronteraField,
  trainingDungeon,
  laderasMolino,
  praderaAlba,
  caminoDelEste,
  bosqueUmbrio,
  colinasVentosas,
  ruinasAncestrales,
  costaDelEco,
  cuevaSusurros,
  cuevaCristal,
  santuarioOlvidado,
  castilloOlvidado,
]

export const MAP_INDEX: Record<string, MapDefinition> = {}
for (const m of WORLD_MAPS) {
  MAP_INDEX[m.id] = m
}

export function getMapById(id: string): MapDefinition | undefined {
  return MAP_INDEX[id]
}

export function findSpawn(map: MapDefinition, spawnId: string): { x: number; z: number } | undefined {
  return map.spawns.find(s => s.id === spawnId)?.position
}
