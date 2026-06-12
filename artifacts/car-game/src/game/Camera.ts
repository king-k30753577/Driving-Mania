// Camera.ts - Multiple camera modes

import * as THREE from 'three';

export type CameraMode = 'chase' | 'cockpit' | 'hood' | 'cinematic';

export class CameraSystem {
  public camera: THREE.PerspectiveCamera;
  public mode: CameraMode = 'chase';
  private cinematicAngle = 0;
  private cinematicTimer = 0;
  private cinematicPhase = 0;

  // Chase camera smoothed state
  private chasePos = new THREE.Vector3();
  private lookAt = new THREE.Vector3();

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.set(0, 8, 14);
  }

  nextMode() {
    const modes: CameraMode[] = ['chase', 'cockpit', 'hood', 'cinematic'];
    const idx = modes.indexOf(this.mode);
    this.mode = modes[(idx + 1) % modes.length];
    this.cinematicTimer = 0;
    this.cinematicPhase = 0;
  }

  update(dt: number, carPos: THREE.Vector3, carRotation: number, carSpeed: number) {
    const forward = new THREE.Vector3(Math.sin(carRotation), 0, Math.cos(carRotation));
    const right = new THREE.Vector3(Math.cos(carRotation), 0, -Math.sin(carRotation));

    switch (this.mode) {
      case 'chase': {
        const speedFactor = Math.min(1, Math.abs(carSpeed) / 40);
        const camDist = 8 + speedFactor * 5;
        const camHeight = 3.5 + speedFactor * 1.5;

        const targetPos = new THREE.Vector3()
          .copy(carPos)
          .addScaledVector(forward, -camDist)
          .add(new THREE.Vector3(0, camHeight, 0));

        this.chasePos.lerp(targetPos, 1 - Math.pow(0.01, dt * 8));

        const targetLook = carPos.clone().add(forward.clone().multiplyScalar(4)).add(new THREE.Vector3(0, 1.5, 0));
        this.lookAt.lerp(targetLook, 1 - Math.pow(0.01, dt * 12));

        this.camera.position.copy(this.chasePos);
        this.camera.lookAt(this.lookAt);
        break;
      }

      case 'cockpit': {
        const cockpitPos = carPos.clone()
          .addScaledVector(forward, 0.8)
          .add(new THREE.Vector3(0, 1.4, 0));
        this.camera.position.copy(cockpitPos);

        const lookTarget = carPos.clone()
          .addScaledVector(forward, 20)
          .add(new THREE.Vector3(0, 0.3, 0));
        this.camera.lookAt(lookTarget);
        this.camera.fov = 75;
        this.camera.updateProjectionMatrix();
        break;
      }

      case 'hood': {
        const hoodPos = carPos.clone()
          .addScaledVector(forward, 1.8)
          .add(new THREE.Vector3(0, 0.9, 0));
        this.camera.position.copy(hoodPos);

        const lookTarget = carPos.clone()
          .addScaledVector(forward, 25)
          .add(new THREE.Vector3(0, 0.2, 0));
        this.camera.lookAt(lookTarget);
        this.camera.fov = 65;
        this.camera.updateProjectionMatrix();
        break;
      }

      case 'cinematic': {
        this.cinematicTimer += dt;
        // Switch cinematic angle every 8 seconds
        if (this.cinematicTimer > 8) {
          this.cinematicTimer = 0;
          this.cinematicPhase = (this.cinematicPhase + 1) % 4;
        }

        const t = this.cinematicTimer / 8;
        let targetPos: THREE.Vector3;
        let targetLook: THREE.Vector3;

        switch (this.cinematicPhase) {
          case 0: { // Side tracking
            targetPos = carPos.clone().addScaledVector(right, 12).add(new THREE.Vector3(0, 4, 0));
            targetLook = carPos.clone().add(new THREE.Vector3(0, 1.5, 0));
            break;
          }
          case 1: { // Low rear sweep
            const sweepAngle = carRotation + Math.PI + t * 0.5;
            targetPos = carPos.clone()
              .addScaledVector(new THREE.Vector3(Math.sin(sweepAngle), 0, Math.cos(sweepAngle)), 9)
              .add(new THREE.Vector3(0, 2, 0));
            targetLook = carPos.clone().add(new THREE.Vector3(0, 1, 0));
            break;
          }
          case 2: { // High overhead
            targetPos = carPos.clone().add(new THREE.Vector3(0, 20, 0));
            targetLook = carPos.clone();
            break;
          }
          case 3: { // Front low
            targetPos = carPos.clone()
              .addScaledVector(forward, 18)
              .add(new THREE.Vector3(0, 1.5, 0));
            targetLook = carPos.clone().add(new THREE.Vector3(0, 1.5, 0));
            break;
          }
          default:
            targetPos = this.camera.position.clone();
            targetLook = carPos.clone();
        }

        this.camera.position.lerp(targetPos, 1 - Math.pow(0.001, dt));
        this.lookAt.lerp(targetLook, 1 - Math.pow(0.001, dt));
        this.camera.lookAt(this.lookAt);
        this.camera.fov = 55;
        this.camera.updateProjectionMatrix();
        break;
      }
    }
  }

  updateAspect(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}
