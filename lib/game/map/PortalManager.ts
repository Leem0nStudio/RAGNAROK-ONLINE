import { PortalDefinition } from './types'

export type PortalActivateCallback = (portal: PortalDefinition) => void

export class PortalManager {
  private activePortal: PortalDefinition | null = null
  private activatedPortalIds: Set<string> = new Set()
  private onActivate: PortalActivateCallback | null = null

  set onActivateCallback(cb: PortalActivateCallback | null) {
    this.onActivate = cb
  }

  update(playerX: number, playerZ: number, portals: PortalDefinition[]): void {
    let nearest: PortalDefinition | null = null
    let nearestDist = Infinity

    for (const p of portals) {
      const dx = playerX - p.position.x
      const dz = playerZ - p.position.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist <= p.radius && dist < nearestDist) {
        nearest = p
        nearestDist = dist
      }
    }

    this.activePortal = nearest
  }

  activate(): void {
    if (this.activePortal && this.onActivate) {
      this.activatedPortalIds.add(this.activePortal.id)
      this.onActivate(this.activePortal)
    }
  }

  getActivePortal(): PortalDefinition | null {
    return this.activePortal
  }

  hasActivated(portalId: string): boolean {
    return this.activatedPortalIds.has(portalId)
  }

  reset(): void {
    this.activePortal = null
    this.activatedPortalIds.clear()
  }
}
