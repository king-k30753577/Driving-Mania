// Weather.ts - Day/night cycle and dynamic weather

import * as THREE from 'three';

export type WeatherType = 'clear' | 'rain' | 'fog' | 'storm';

export class WeatherSystem {
  private scene!: THREE.Scene;
  private renderer!: THREE.WebGLRenderer;
  private sun!: THREE.DirectionalLight;
  private ambient!: THREE.AmbientLight;
  private sky!: THREE.Mesh;
  private rainParticles: THREE.Points | null = null;
  private rainGeo: THREE.BufferGeometry | null = null;
  private fogEnabled = false;

  public timeOfDay = 0.5;  // 0 = midnight, 0.5 = noon, 1 = next midnight
  public weather: WeatherType = 'clear';
  public timeScale = 0.002; // speed of day cycle

  private rainPositions: Float32Array | null = null;

  init(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.renderer = renderer;

    // Sky dome
    const skyGeo = new THREE.SphereGeometry(900, 16, 8);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x87ceeb, side: THREE.BackSide });
    this.sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(this.sky);

    // Sun / directional light
    this.sun = new THREE.DirectionalLight(0xfff5e0, 1.5);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.width = 1024;
    this.sun.shadow.mapSize.height = 1024;
    this.sun.shadow.camera.near = 0.5;
    this.sun.shadow.camera.far = 300;
    this.sun.shadow.camera.left = -100;
    this.sun.shadow.camera.right = 100;
    this.sun.shadow.camera.top = 100;
    this.sun.shadow.camera.bottom = -100;
    scene.add(this.sun);

    // Ambient
    this.ambient = new THREE.AmbientLight(0x404060, 0.4);
    scene.add(this.ambient);

    // Stars (simple points)
    const starGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 850;
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.cos(phi);
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5 });
    const stars = new THREE.Points(starGeo, starMat);
    stars.name = 'stars';
    scene.add(stars);
  }

  setWeather(type: WeatherType) {
    if (this.weather === type) return;
    this.weather = type;
    this.updateWeatherEffects();
  }

  private updateWeatherEffects() {
    // Remove existing rain
    if (this.rainParticles) {
      this.scene.remove(this.rainParticles);
      this.rainParticles = null;
      this.rainGeo = null;
    }

    // Remove fog
    this.scene.fog = null;
    this.fogEnabled = false;

    switch (this.weather) {
      case 'rain':
      case 'storm':
        this.createRain();
        break;
      case 'fog':
        this.scene.fog = new THREE.FogExp2(0xaabbcc, 0.012);
        this.fogEnabled = true;
        break;
    }
  }

  private createRain() {
    const count = 3000;
    this.rainGeo = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * 200;
      this.rainPositions[i * 3 + 1] = Math.random() * 60;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }
    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({ color: 0xaaccff, size: 0.15, transparent: true, opacity: 0.6 });
    this.rainParticles = new THREE.Points(this.rainGeo, rainMat);
    this.scene.add(this.rainParticles);
  }

  update(dt: number, playerPos: THREE.Vector3) {
    this.timeOfDay = (this.timeOfDay + this.timeScale * dt) % 1.0;
    const t = this.timeOfDay;

    // Sun arc
    const sunAngle = (t - 0.25) * Math.PI * 2;
    this.sun.position.set(
      Math.cos(sunAngle) * 200,
      Math.sin(sunAngle) * 200,
      100
    );

    // Day/night sky color interpolation
    let skyColor: THREE.Color;
    let sunIntensity: number;
    let ambientIntensity: number;

    if (t > 0.25 && t < 0.75) {
      // Daytime
      const dayT = (t - 0.25) / 0.5;
      const sunHeight = Math.sin(dayT * Math.PI);
      skyColor = new THREE.Color().lerpColors(
        new THREE.Color(0xff7040), // sunrise/sunset
        new THREE.Color(0x4488ff), // noon
        Math.pow(sunHeight, 0.4)
      );
      sunIntensity = 0.3 + sunHeight * 1.5;
      ambientIntensity = 0.2 + sunHeight * 0.4;
    } else {
      // Nighttime
      skyColor = new THREE.Color(0x050510);
      sunIntensity = 0;
      ambientIntensity = 0.05;
    }

    // Weather overrides
    if (this.weather === 'storm') {
      skyColor = new THREE.Color(0x1a1a2a);
      sunIntensity *= 0.1;
      ambientIntensity *= 0.3;
    } else if (this.weather === 'rain') {
      skyColor.lerp(new THREE.Color(0x445566), 0.5);
      sunIntensity *= 0.4;
    } else if (this.weather === 'fog') {
      skyColor.lerp(new THREE.Color(0x99aabb), 0.6);
      sunIntensity *= 0.5;
    }

    (this.sky.material as THREE.MeshBasicMaterial).color = skyColor;
    this.sun.intensity = sunIntensity;
    this.ambient.intensity = ambientIntensity;

    // Renderer background color
    this.renderer.setClearColor(skyColor, 1);

    // Stars visibility
    const stars = this.scene.getObjectByName('stars');
    if (stars) {
      stars.visible = t < 0.22 || t > 0.78;
    }

    // Move rain with player
    if (this.rainParticles && this.rainPositions && this.rainGeo) {
      const arr = this.rainPositions;
      const fallSpeed = this.weather === 'storm' ? 40 : 18;
      for (let i = 0; i < arr.length / 3; i++) {
        arr[i * 3 + 1] -= fallSpeed * dt;
        if (arr[i * 3 + 1] < 0) {
          arr[i * 3] = playerPos.x + (Math.random() - 0.5) * 200;
          arr[i * 3 + 1] = 50 + Math.random() * 20;
          arr[i * 3 + 2] = playerPos.z + (Math.random() - 0.5) * 200;
        } else {
          arr[i * 3] += (Math.random() - 0.5) * 0.05;
        }
      }
      this.rainGeo.attributes.position.needsUpdate = true;
      this.rainParticles.position.set(playerPos.x, 0, playerPos.z);
    }

    // Lightning in storms
    if (this.weather === 'storm' && Math.random() < 0.001) {
      this.ambient.intensity = 2;
      setTimeout(() => {
        if (this.ambient) this.ambient.intensity = ambientIntensity;
      }, 80);
    }
  }

  get isDaytime(): boolean {
    return this.timeOfDay > 0.25 && this.timeOfDay < 0.75;
  }
}
