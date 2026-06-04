export interface PortalDefinition {
  id: string
  position: { x: number; z: number }
  radius: number
  targetMapId: string
  targetSpawnId: string
  label: string
}

export interface SpawnDefinition {
  id: string
  position: { x: number; z: number }
}

export interface NPCSpawn {
  npcId: string
  position: { x: number; z: number }
}

export interface MonsterSpawn {
  monsterId: string
  position: { x: number; z: number }
  respawnSeconds: number
}

export interface PropSpawn {
  propId: string
  position: { x: number; z: number }
  rotation?: number
  scale?: number
}

export interface MapDefinition {
  id: string
  name: string
  width: number
  height: number
  biome: string
  music: string
  spawns: SpawnDefinition[]
  portals: PortalDefinition[]
  npcs: NPCSpawn[]
  monsters: MonsterSpawn[]
  props: PropSpawn[]
}

export type TransitionState = 'idle' | 'fading_out' | 'loading' | 'fading_in'
