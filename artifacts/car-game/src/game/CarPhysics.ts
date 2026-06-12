// CarPhysics.ts - Realistic arcade car physics

import * as THREE from 'three';

export interface CarConfig {
  maxSpeed: number;          // m/s
  acceleration: number;      // m/s²
  brakeForce: number;        // m/s²
  reverseSpeed: number;      // m/s
  steeringAngle: number;     // radians
  steeringSpeed: number;     // rad/s
  friction: number;          // lateral friction 0-1
  driftFriction: number;     // friction during drift
  mass: number;
  wheelBase: number;         // distance between front/rear axle
  nitroMultiplier: number;
  engineUpgrade: number;     // 1-5
  brakeUpgrade: number;
  handlingUpgrade: number;
  tiresUpgrade: number;
}

export const DEFAULT_CAR_CONFIGS: Record<string, Partial<CarConfig>> = {
  sports:   { maxSpeed: 55,  acceleration: 22, brakeForce: 28, steeringAngle: 0.55, mass: 1200, nitroMultiplier: 1.35 },
  muscle:   { maxSpeed: 58,  acceleration: 24, brakeForce: 24, steeringAngle: 0.48, mass: 1500, nitroMultiplier: 1.4 },
  suv:      { maxSpeed: 42,  acceleration: 16, brakeForce: 22, steeringAngle: 0.50, mass: 2000, nitroMultiplier: 1.2 },
  supercar: { maxSpeed: 75,  acceleration: 32, brakeForce: 35, steeringAngle: 0.52, mass: 1100, nitroMultiplier: 1.5 },
};

const BASE_CONFIG: CarConfig = {
  maxSpeed: 55,
  acceleration: 22,
  brakeForce: 28,
  reverseSpeed: 12,
  steeringAngle: 0.55,
  steeringSpeed: 2.5,
  friction: 0.88,
  driftFriction: 0.55,
  mass: 1200,
  wheelBase: 2.8,
  nitroMultiplier: 1.35,
  engineUpgrade: 1,
  brakeUpgrade: 1,
  handlingUpgrade: 1,
  tiresUpgrade: 1,
};

export function buildConfig(carId: string, upgrades: any): CarConfig {
  const specific = DEFAULT_CAR_CONFIGS[carId] ?? {};
  const cfg: CarConfig = { ...BASE_CONFIG, ...specific };

  // Apply upgrade multipliers
  const eng = (upgrades?.engine ?? 1);
  const brk = (upgrades?.brakes ?? 1);
  const hdl = (upgrades?.handling ?? 1);
  const tir = (upgrades?.tires ?? 1);

  cfg.engineUpgrade = eng;
  cfg.brakeUpgrade = brk;
  cfg.handlingUpgrade = hdl;
  cfg.tiresUpgrade = tir;

  cfg.maxSpeed *= 1 + (eng - 1) * 0.12;
  cfg.acceleration *= 1 + (eng - 1) * 0.15;
  cfg.brakeForce *= 1 + (brk - 1) * 0.14;
  cfg.steeringAngle *= 1 + (hdl - 1) * 0.08;
  cfg.friction *= 1 + (tir - 1) * 0.06;
  cfg.driftFriction *= 1 + (tir - 1) * 0.05;

  return cfg;
}

export class CarPhysics {
  public position: THREE.Vector3 = new THREE.Vector3(0, 0.6, 0);
  public rotation: number = 0;          // Y rotation in radians
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public speed: number = 0;             // signed, m/s
  public lateralVelocity: number = 0;
  public steeringAngle: number = 0;
  public rpm: number = 0;
  public isDrifting: boolean = false;
  public isNitroActive: boolean = false;
  public nitroDuration: number = 0;     // seconds remaining
  public nitroMax: number = 5;
  public wheelRotation: number = 0;
  public skidIntensity: number = 0;
  public damage: number = 0;            // 0-100
  public config: CarConfig;

  private nitroRefillTimer: number = 0;

  constructor(config: CarConfig) {
    this.config = config;
    this.nitroDuration = this.nitroMax;
  }

  update(dt: number, throttle: number, brake: number, steeringInput: number, handbrake: boolean, nitroPressed: boolean) {
    const cfg = this.config;
    dt = Math.min(dt, 0.05); // Cap delta time

    // Nitro system
    const hasNitro = cfg.engineUpgrade >= 3 || (this.config as any).nitroUpgrade > 0;
    if (nitroPressed && hasNitro && this.nitroDuration > 0) {
      this.isNitroActive = true;
      this.nitroDuration -= dt;
      this.nitroRefillTimer = 0;
    } else {
      this.isNitroActive = false;
      if (this.nitroDuration < this.nitroMax) {
        this.nitroRefillTimer += dt;
        if (this.nitroRefillTimer > 2) {
          this.nitroDuration = Math.min(this.nitroMax, this.nitroDuration + dt * 0.8);
        }
      }
    }

    const nitroBoost = this.isNitroActive ? cfg.nitroMultiplier : 1;
    const effectiveMaxSpeed = cfg.maxSpeed * nitroBoost;

    // Forward direction vector
    const forward = new THREE.Vector3(
      Math.sin(this.rotation),
      0,
      Math.cos(this.rotation)
    );

    // Right direction
    const right = new THREE.Vector3(
      Math.cos(this.rotation),
      0,
      -Math.sin(this.rotation)
    );

    // Current longitudinal speed
    const longVel = this.velocity.dot(forward);
    const latVel = this.velocity.dot(right);

    // Throttle / brake force
    let driveForce = 0;
    if (throttle > 0) {
      if (longVel >= 0) {
        driveForce = cfg.acceleration * throttle * nitroBoost;
        if (longVel > effectiveMaxSpeed) driveForce = 0;
      } else {
        // Moving backward, throttle acts as forward brake
        driveForce = cfg.brakeForce * throttle;
      }
    } else if (brake > 0) {
      if (longVel > 0.5) {
        driveForce = -cfg.brakeForce * brake;
      } else if (longVel > -cfg.reverseSpeed) {
        driveForce = -cfg.acceleration * 0.6 * brake;
      }
    }

    // Drag / rolling resistance
    const drag = longVel * Math.abs(longVel) * 0.015 + longVel * 0.3;
    const longAccel = driveForce - drag;

    // Steering
    const maxSteer = cfg.steeringAngle * (1 - Math.abs(longVel) * 0.004);
    const targetSteer = steeringInput * maxSteer;
    this.steeringAngle += (targetSteer - this.steeringAngle) * 8 * dt;

    // Drift / handbrake
    const speedKmh = Math.abs(longVel) * 3.6;
    const driftThreshold = 25 + (5 - cfg.tiresUpgrade) * 5;
    const lateralFriction = handbrake
      ? cfg.driftFriction * 0.4
      : speedKmh > driftThreshold && Math.abs(steeringInput) > 0.5
        ? cfg.driftFriction
        : cfg.friction;

    this.isDrifting = handbrake || (speedKmh > driftThreshold && Math.abs(latVel) > 2);
    this.skidIntensity = this.isDrifting ? Math.min(1, Math.abs(latVel) / 10) : 0;

    // Lateral velocity damping (cornering)
    const newLatVel = latVel * Math.pow(lateralFriction, dt * 60);

    // Yaw from Ackermann steering
    if (Math.abs(longVel) > 0.5) {
      const steerFactor = this.isDrifting ? 0.5 : 1;
      const yawRate = (longVel / cfg.wheelBase) * Math.tan(this.steeringAngle) * steerFactor;
      this.rotation += yawRate * dt;
    }

    // Rebuild velocity from updated components
    const newLongVel = Math.max(-cfg.reverseSpeed, Math.min(effectiveMaxSpeed, longVel + longAccel * dt));
    this.velocity.copy(forward).multiplyScalar(newLongVel);
    this.velocity.addScaledVector(right, newLatVel);

    // Apply to position
    this.position.addScaledVector(this.velocity, dt);
    this.position.y = 0.6; // Flat terrain

    // State
    this.speed = longVel;
    this.lateralVelocity = latVel;
    this.wheelRotation += (longVel / 0.35) * dt;
    this.rpm = Math.max(0.1, Math.min(1, Math.abs(longVel) / effectiveMaxSpeed + throttle * 0.3));
  }

  applyCollision(normal: THREE.Vector3, strength: number) {
    const bounce = this.velocity.dot(normal);
    if (bounce < 0) {
      this.velocity.addScaledVector(normal, -bounce * 1.4);
      this.velocity.multiplyScalar(0.6);
    }
    this.damage = Math.min(100, this.damage + strength * 2);
  }

  reset(position: THREE.Vector3, rotation: number) {
    this.position.copy(position);
    this.rotation = rotation;
    this.velocity.set(0, 0, 0);
    this.speed = 0;
    this.steeringAngle = 0;
    this.damage = 0;
  }

  get speedKmh(): number {
    return Math.abs(this.speed) * 3.6;
  }
}
