// GameEngine.ts - Core Three.js game loop and scene management

import * as THREE from 'three';
import { World } from './World';
import { CarPhysics, buildConfig } from './CarPhysics';
import { buildCarMesh, updateCarMesh } from './Car3D';
import { Traffic } from './Traffic';
import { CameraSystem } from './Camera';
import { WeatherSystem, WeatherType } from './Weather';
import { Controls } from './Controls';
import { audioEngine } from './Audio';
import { saveSystem } from './SaveSystem';

export interface GameStats {
  speed: number;
  rpm: number;
  coins: number;
  xp: number;
  level: number;
  nitroFuel: number;
  nitroMax: number;
  isDrifting: boolean;
  isNitro: boolean;
  damage: number;
  distanceDriven: number;
  cameraMode: string;
  timeOfDay: number;
  weather: string;
  fps: number;
}

type GameEventCallback = (event: string, data?: any) => void;

export class GameEngine {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  public world = new World();
  private physics!: CarPhysics;
  private carMesh!: THREE.Group;
  private traffic = new Traffic();
  private camera!: CameraSystem;
  private weather = new WeatherSystem();
  private controls = new Controls();

  private animFrameId = 0;
  private lastTime = 0;
  private running = false;
  private paused = false;

  // Stats
  private distanceDriven = 0;
  private fpsSmooth = 60;
  private fpsTimer = 0;
  private frameCount = 0;

  // Skid marks / particles
  private skidMarks: THREE.Mesh[] = [];
  private maxSkidMarks = 100;
  private skidMat = new THREE.MeshLambertMaterial({ color: 0x111111, transparent: true, opacity: 0.6 });

  // Coin collection
  private collectedCoins = new Set<number>();

  private onEvent?: GameEventCallback;

  init(canvas: HTMLCanvasElement, onEvent?: GameEventCallback) {
    this.onEvent = onEvent;
    const save = saveSystem.get();
    const settings = save.settings;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: settings.graphicsQuality !== 'low',
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(settings.graphicsQuality === 'low' ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = settings.graphicsQuality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = null;

    // Camera
    this.camera = new CameraSystem(canvas.clientWidth / canvas.clientHeight);

    // World
    this.world.init(this.scene);

    // Traffic
    this.traffic.init(this.scene, this.world.roads, 20);

    // Weather
    this.weather.init(this.scene, this.renderer);

    // Controls
    this.controls.init(settings.controlMode, settings.tiltSensitivity, settings.steeringFlip);

    // Car
    const upgrades = saveSystem.getUpgrades(save.selectedCar);
    const cfg = buildConfig(save.selectedCar, upgrades);
    this.physics = new CarPhysics(cfg);
    this.physics.position.set(4, 0.6, 4);

    this.carMesh = buildCarMesh(save.selectedCar, save.selectedColor);
    this.scene.add(this.carMesh);

    // Audio
    audioEngine.init(settings.musicVolume, settings.sfxVolume);

    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private loop(ts: number) {
    if (!this.running) return;
    this.animFrameId = requestAnimationFrame(t => this.loop(t));

    const dt = Math.min((ts - this.lastTime) / 1000, 0.05);
    this.lastTime = ts;

    // FPS counter
    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.fpsSmooth = this.frameCount / this.fpsTimer;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    if (!this.paused) {
      this.update(dt);
    }

    this.render();
  }

  private update(dt: number) {
    // Controls
    this.controls.update();
    const ctrl = this.controls.state;

    // Handle one-shot events
    if (ctrl.pause) {
      this.onEvent?.('pause');
      this.controls.clearOneShot();
    }
    if (ctrl.cameraSwitch) {
      this.camera.nextMode();
      this.controls.clearOneShot();
    }
    if (ctrl.horn) {
      audioEngine.playHorn();
      this.controls.clearOneShot();
    }

    // Physics
    const prevPos = this.physics.position.clone();
    this.physics.update(dt, ctrl.throttle, ctrl.brake, ctrl.steering, ctrl.handbrake, ctrl.nitro);

    // Distance
    const moved = this.physics.position.distanceTo(prevPos);
    this.distanceDriven += moved;

    // Collision with buildings
    const carBox = new THREE.Box3().setFromCenterAndSize(
      this.physics.position,
      new THREE.Vector3(2.2, 1.2, 4.6)
    );
    for (const col of this.world.colliders) {
      if (carBox.intersectsBox(col)) {
        const center = new THREE.Vector3();
        col.getCenter(center);
        const normal = this.physics.position.clone().sub(center).normalize();
        normal.y = 0;
        this.physics.applyCollision(normal, this.physics.speedKmh / 80);
        if (this.physics.speedKmh > 15) {
          audioEngine.playCrash(Math.min(1, this.physics.speedKmh / 80));
        }
        break;
      }
    }

    // Collision with traffic
    const trafficBoxes = this.traffic.getCarBoundingBoxes();
    for (const tBox of trafficBoxes) {
      if (carBox.intersectsBox(tBox)) {
        const center = new THREE.Vector3();
        tBox.getCenter(center);
        const normal = this.physics.position.clone().sub(center).normalize();
        normal.y = 0;
        this.physics.applyCollision(normal, 0.5);
        if (this.physics.speedKmh > 10) {
          audioEngine.playCrash(0.3);
        }
        break;
      }
    }

    // World boundary
    const bound = this.world['CITY_SIZE'] / 2;
    if (Math.abs(this.physics.position.x) > bound) {
      this.physics.position.x = Math.sign(this.physics.position.x) * bound;
      this.physics.velocity.x *= -0.5;
    }
    if (Math.abs(this.physics.position.z) > bound) {
      this.physics.position.z = Math.sign(this.physics.position.z) * bound;
      this.physics.velocity.z *= -0.5;
    }

    // Coin collection
    this.world.coinPositions.forEach((coinPos, i) => {
      if (!this.collectedCoins.has(i) && this.physics.position.distanceTo(coinPos) < 2.5) {
        this.collectedCoins.add(i);
        this.world.collectCoin(i);
        const earned = 10 + Math.floor(this.physics.speedKmh / 20) * 5;
        saveSystem.addCoins(earned);
        saveSystem.addXP(15);
        audioEngine.playCollectCoin();
        this.onEvent?.('coin', { amount: earned });
        setTimeout(() => this.collectedCoins.delete(i), 30000);
      }
    });

    // Speed-based XP (every 200m)
    if (this.distanceDriven % 200 < moved * 60) {
      saveSystem.addXP(10);
      saveSystem.updateTopSpeed(this.physics.speedKmh);
    }

    // Drift XP
    if (this.physics.isDrifting) {
      const driftXP = Math.floor(this.physics.skidIntensity * 3);
      if (driftXP > 0 && Math.random() < 0.1) {
        saveSystem.addXP(driftXP);
        this.onEvent?.('drift', { score: driftXP });
      }
    }

    // Update car mesh
    this.carMesh.position.copy(this.physics.position);
    this.carMesh.rotation.y = this.physics.rotation;

    updateCarMesh(
      this.carMesh,
      this.physics.wheelRotation,
      this.physics.steeringAngle,
      ctrl.brake > 0.1,
      this.physics.isNitroActive
    );

    // Skid marks
    if (this.physics.isDrifting && this.physics.speedKmh > 15) {
      this.addSkidMark();
    }
    if (this.physics.skidIntensity > 0.3) {
      audioEngine.playTireSqueal(this.physics.skidIntensity);
    }

    // Audio engine
    audioEngine.updateEngine(
      this.physics.speedKmh,
      ctrl.throttle,
      this.physics.rpm
    );
    if (this.physics.isNitroActive && Math.random() < 0.05) {
      audioEngine.playNitroStart();
    }

    // Traffic
    this.traffic.update(dt, this.physics.position);

    // World
    this.world.update(dt);

    // Camera
    this.camera.update(dt, this.physics.position, this.physics.rotation, this.physics.speed);

    // Weather
    this.weather.update(dt, this.physics.position);
  }

  private addSkidMark() {
    if (this.skidMarks.length >= this.maxSkidMarks) {
      const old = this.skidMarks.shift();
      if (old) this.scene.remove(old);
    }
    const geo = new THREE.PlaneGeometry(0.25, 0.8);
    const mark = new THREE.Mesh(geo, this.skidMat);
    mark.rotation.x = -Math.PI / 2;
    mark.position.copy(this.physics.position);
    mark.position.y = 0.02;
    mark.rotation.y = this.physics.rotation + Math.PI / 2;
    this.scene.add(mark);
    this.skidMarks.push(mark);
  }

  private render() {
    this.renderer.render(this.scene, this.camera.camera);
  }

  getStats(): GameStats {
    const save = saveSystem.get();
    return {
      speed: Math.round(this.physics.speedKmh),
      rpm: this.physics.rpm,
      coins: save.coins,
      xp: save.xp,
      level: save.level,
      nitroFuel: this.physics.nitroDuration,
      nitroMax: this.physics.nitroMax,
      isDrifting: this.physics.isDrifting,
      isNitro: this.physics.isNitroActive,
      damage: this.physics.damage,
      distanceDriven: Math.round(this.distanceDriven),
      cameraMode: this.camera.mode,
      timeOfDay: this.weather.timeOfDay,
      weather: this.weather.weather,
      fps: Math.round(this.fpsSmooth),
    };
  }

  setPaused(p: boolean) {
    this.paused = p;
    if (!p) audioEngine.resume();
  }

  setWeather(w: WeatherType) {
    this.weather.setWeather(w);
  }

  setControlButton(name: string, pressed: boolean) {
    this.controls.setButton(name, pressed);
  }

  setSteeringWheel(angle: number) {
    this.controls.setSteeringWheel(angle);
  }

  resize(w: number, h: number) {
    this.renderer.setSize(w, h);
    this.camera.updateAspect(w / h);
  }

  resetCar() {
    this.physics.reset(new THREE.Vector3(4, 0.6, 4), 0);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.animFrameId);
    this.controls.destroy();
    this.traffic.destroy();
    audioEngine.destroy();
    this.renderer.dispose();
    this.skidMarks.forEach(m => this.scene.remove(m));
  }
}
