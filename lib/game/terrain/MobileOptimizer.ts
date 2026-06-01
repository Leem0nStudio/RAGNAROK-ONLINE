import * as THREE from 'three';
import { MobileProfile } from '../types';

export class MobileOptimizer {
  private renderer: THREE.WebGLRenderer;
  private profile: MobileProfile;

  private frameTimings: number[] = [];
  private timingWindow = 30;
  private thermalCheckInterval: number;
  private thermalCheckId: ReturnType<typeof setInterval> | null = null;

  onProfileChange?: (profile: MobileProfile) => void;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.profile = this.detectProfile();
    this.thermalCheckInterval = 10000;

    this.applyProfile(this.profile);
    this.startThermalMonitoring();
  }

  private detectProfile(): MobileProfile {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const memLimit = (navigator as any).deviceMemory || 8;
    const cpuCores = navigator.hardwareConcurrency || 4;

    if (!isMobile) {
      return {
        lowPower: false,
        targetFPS: 60,
        pixelRatio: Math.min(window.devicePixelRatio, 2),
        shadowQuality: 2,
        vegetationDistance: 40,
        propDistance: 50,
        particleQuality: 1,
      };
    }

    if (memLimit <= 2 || cpuCores <= 2) {
      return {
        lowPower: true,
        targetFPS: 30,
        pixelRatio: 1,
        shadowQuality: 0,
        vegetationDistance: 15,
        propDistance: 25,
        particleQuality: 0,
      };
    }

    if (memLimit <= 4 || cpuCores <= 4) {
      return {
        lowPower: false,
        targetFPS: 30,
        pixelRatio: Math.min(window.devicePixelRatio, 1.5),
        shadowQuality: 1,
        vegetationDistance: 22,
        propDistance: 35,
        particleQuality: 0.5,
      };
    }

    return {
      lowPower: false,
      targetFPS: 60,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
      shadowQuality: 2,
      vegetationDistance: 40,
      propDistance: 50,
      particleQuality: 1,
    };
  }

  private applyProfile(profile: MobileProfile) {
    this.renderer.setPixelRatio(profile.pixelRatio);

    if (profile.shadowQuality === 0) {
      this.renderer.shadowMap.enabled = false;
    } else {
      this.renderer.shadowMap.enabled = true;
      const size = profile.shadowQuality === 1 ? 512 : 1024;
      this.renderer.shadowMap.type = profile.shadowQuality === 1
        ? THREE.PCFSoftShadowMap
        : THREE.PCFSoftShadowMap;
    }
  }

  getProfile(): MobileProfile {
    return { ...this.profile };
  }

  recordFrameTime(dt: number) {
    this.frameTimings.push(dt);
    if (this.frameTimings.length > this.timingWindow) {
      this.frameTimings.shift();
    }

    if (this.frameTimings.length === this.timingWindow) {
      const avg = this.frameTimings.reduce((a, b) => a + b, 0) / this.timingWindow;
      const fps = 1 / avg;

      if (fps < 20 && !this.profile.lowPower) {
        this.downgradeProfile();
      } else if (fps > 50 && this.profile.lowPower) {
        this.upgradeProfile();
      }
    }
  }

  private downgradeProfile() {
    const p = this.profile;

    if (p.shadowQuality > 0) {
      p.shadowQuality = (p.shadowQuality - 1) as 0 | 1 | 2;
    } else if (p.vegetationDistance > 15) {
      p.vegetationDistance = Math.max(10, p.vegetationDistance - 5);
      p.propDistance = Math.max(15, p.propDistance - 5);
    } else if (p.pixelRatio > 1) {
      p.pixelRatio = Math.max(0.75, p.pixelRatio - 0.25);
    } else {
      p.targetFPS = 30;
      p.lowPower = true;
    }

    this.applyProfile(p);
    this.onProfileChange?.(p);
  }

  private upgradeProfile() {
    const p = this.profile;
    p.lowPower = false;

    if (p.targetFPS < 60) p.targetFPS = 60;
    if (p.vegetationDistance < 40) p.vegetationDistance = Math.min(40, p.vegetationDistance + 5);
    if (p.propDistance < 50) p.propDistance = Math.min(50, p.propDistance + 5);
    if (p.shadowQuality < 2) p.shadowQuality = (p.shadowQuality + 1) as 0 | 1 | 2;
    if (p.pixelRatio < 2) p.pixelRatio = Math.min(2, p.pixelRatio + 0.25);

    this.applyProfile(p);
    this.onProfileChange?.(p);
  }

  private startThermalMonitoring() {
    if ('getBattery' in navigator) {
      this.thermalCheckId = setInterval(async () => {
        try {
          const battery = await (navigator as any).getBattery();
          if (battery.level < 0.2 && battery.charging === false && !this.profile.lowPower) {
            this.downgradeProfile();
          }
        } catch {
          // Battery API not available
        }
      }, this.thermalCheckInterval);
    }
  }

  stop() {
    if (this.thermalCheckId) {
      clearInterval(this.thermalCheckId);
      this.thermalCheckId = null;
    }
  }

  dispose() {
    this.stop();
    this.frameTimings = [];
  }
}
