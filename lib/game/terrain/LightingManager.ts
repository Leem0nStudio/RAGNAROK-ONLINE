import * as THREE from 'three';
import { MapZone } from '../types';

export interface LightingState {
  ambientColor: string;
  directionalColor: string;
  hemisphereSky: string;
  hemisphereGround: string;
  fogColor: string;
  fogDensity: number;
  ambientIntensity: number;
  directionalIntensity: number;
}

export class LightingManager {
  private scene: THREE.Scene;
  private ambient: THREE.AmbientLight;
  private directional: THREE.DirectionalLight;
  private hemisphere: THREE.HemisphereLight;
  private fillLight: THREE.DirectionalLight;

  private targetState: LightingState;
  private currentState: LightingState;
  private transitionSpeed = 0.02;
  private isMobile = false;

  private shadowMapSize: number;

  private fogColor = new THREE.Color();

  constructor(scene: THREE.Scene, isMobile: boolean = false) {
    this.scene = scene;
    this.isMobile = isMobile;
    this.shadowMapSize = isMobile ? 0 : 1024;

    this.ambient = new THREE.AmbientLight(0xffffff, 0.30);
    this.scene.add(this.ambient);

    this.directional = new THREE.DirectionalLight(0xffedd5, 1.3);
    // Sol más bajo para sombras más largas y doradas
    this.directional.position.set(20, 35, -15);
    this.directional.castShadow = !isMobile;
    if (!isMobile) {
      this.directional.shadow.mapSize.width = this.shadowMapSize;
      this.directional.shadow.mapSize.height = this.shadowMapSize;
      this.directional.shadow.camera.near = 10;
      this.directional.shadow.camera.far = 100;
      this.directional.shadow.camera.left = -30;
      this.directional.shadow.camera.right = 30;
      this.directional.shadow.camera.top = 30;
      this.directional.shadow.camera.bottom = -30;
      this.directional.shadow.camera.updateProjectionMatrix();
      this.directional.shadow.bias = -0.001;
    }
    this.scene.add(this.directional);

    // Cielo azul media mañana, suelo verde reflejado del pasto
    this.hemisphere = new THREE.HemisphereLight(0x87ceeb, 0x4a8c3f, 0.40);
    this.scene.add(this.hemisphere);

    this.fillLight = new THREE.DirectionalLight(0xb0d8f0, 0.35);
    this.fillLight.position.set(-20, 15, 25);
    this.scene.add(this.fillLight);

    const defaultState: LightingState = {
      ambientColor: '#ffffff',
      directionalColor: '#ffedd5',
      hemisphereSky: '#87ceeb',
      hemisphereGround: '#4a8c3f',
      fogColor: '#c8d8c8',
      fogDensity: 0.012,
      ambientIntensity: 0.30,
      directionalIntensity: 1.3,
    };

    this.currentState = { ...defaultState };
    this.targetState = { ...defaultState };

    this.applyState(this.currentState);
  }

  setMobile(val: boolean) {
    this.isMobile = val;
    this.directional.castShadow = !val;
    if (val) {
      this.shadowMapSize = 0;
      this.directional.shadow.mapSize.width = 1;
      this.directional.shadow.mapSize.height = 1;
    }
  }

  applyZoneLighting(zone: MapZone) {
    this.targetState = {
      ambientColor: zone.lighting.ambientColor,
      directionalColor: zone.lighting.directionalColor,
      hemisphereSky: zone.lighting.hemisphereSky,
      hemisphereGround: zone.lighting.hemisphereGround,
      fogColor: zone.lighting.fogColor,
      fogDensity: zone.lighting.fogDensity,
      ambientIntensity: 0.35,
      directionalIntensity: 1.3,
    };
  }

  applyLightingValues(values: { ambientColor: string; directionalColor: string; hemisphereSky: string; hemisphereGround: string; fogColor: string; fogDensity: number }) {
    this.targetState = {
      ambientColor: values.ambientColor,
      directionalColor: values.directionalColor,
      hemisphereSky: values.hemisphereSky,
      hemisphereGround: values.hemisphereGround,
      fogColor: values.fogColor,
      fogDensity: values.fogDensity,
      ambientIntensity: 0.35,
      directionalIntensity: 1.3,
    };
  }

  setTimeOfDay(hours: number) {
    const t = hours / 24;
    const dayFactor = Math.sin(t * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5;

    this.targetState.ambientIntensity = 0.15 + dayFactor * 0.45;
    this.targetState.directionalIntensity = 0.2 + dayFactor * 1.4;
    this.targetState.fogDensity = 0.015 + (1 - dayFactor) * 0.025;
  }

  update() {
    const cs = this.currentState;
    const ts = this.targetState;
    const spd = this.transitionSpeed;

    cs.ambientIntensity += (ts.ambientIntensity - cs.ambientIntensity) * spd;
    cs.directionalIntensity += (ts.directionalIntensity - cs.directionalIntensity) * spd;
    cs.fogDensity += (ts.fogDensity - cs.fogDensity) * spd;

    // Transición suave de color de niebla
    this.fogColor.set(cs.fogColor);
    this.fogColor.lerp(new THREE.Color(ts.fogColor), spd);
    cs.fogColor = '#' + this.fogColor.getHexString();

    this.ambient.intensity = cs.ambientIntensity;
    this.directional.intensity = cs.directionalIntensity;

    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(this.fogColor);
      this.scene.fog.density = cs.fogDensity;
    }
  }

  getDirectionalLight(): THREE.DirectionalLight {
    return this.directional;
  }

  getShadowCamera(): THREE.OrthographicCamera | null {
    return this.directional.shadow.camera;
  }

  private applyState(state: LightingState) {
    this.ambient.color.set(state.ambientColor);
    this.directional.color.set(state.directionalColor);
    this.hemisphere.color.set(state.hemisphereSky);
    this.hemisphere.groundColor.set(state.hemisphereGround);
    this.ambient.intensity = state.ambientIntensity;
    this.directional.intensity = state.directionalIntensity;
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.set(state.fogColor);
      this.scene.fog.density = state.fogDensity;
    }
  }

  dispose() {
    this.scene.remove(this.ambient);
    this.scene.remove(this.directional);
    this.scene.remove(this.hemisphere);
    this.scene.remove(this.fillLight);
  }
}
