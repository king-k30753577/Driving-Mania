// Traffic.ts - AI traffic system

import * as THREE from 'three';
import { RoadSegment } from './World';

interface TrafficCar {
  mesh: THREE.Group;
  road: RoadSegment;
  position: THREE.Vector3;
  speed: number;
  targetSpeed: number;
  direction: number; // 1 or -1 along road
  lane: number; // -1 or 1 relative to center
  progress: number; // 0-1 along road
  waitTimer: number;
}

const TRAFFIC_COLORS = [
  0x3344cc, 0xcc3322, 0x22cc44, 0xcccc22,
  0x888888, 0xcc8833, 0x44cccc, 0xcc44cc,
];

function buildTrafficMesh(): THREE.Group {
  const g = new THREE.Group();
  const ci = Math.floor(Math.random() * TRAFFIC_COLORS.length);
  const bodyMat = new THREE.MeshLambertMaterial({ color: TRAFFIC_COLORS[ci] });
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const glMat = new THREE.MeshLambertMaterial({ color: 0x88aacc, transparent: true, opacity: 0.5 });
  const hlMat = new THREE.MeshLambertMaterial({ color: 0xffffcc, emissive: 0xffeeaa, emissiveIntensity: 1 });
  const tlMat = new THREE.MeshLambertMaterial({ color: 0xff2200, emissive: 0xff0000, emissiveIntensity: 0.8 });
  const wMat = new THREE.MeshLambertMaterial({ color: 0x222222 });

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 4.0), bodyMat);
  body.position.y = 0.55;
  body.castShadow = true;
  g.add(body);

  // Roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 1.8), bodyMat);
  roof.position.set(0, 1.1, -0.1);
  g.add(roof);

  // Windshield
  const ws = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.06), glMat);
  ws.position.set(0, 1.05, 0.8);
  ws.rotation.x = -0.3;
  g.add(ws);

  // Headlights
  [-0.6, 0.6].forEach(x => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.06), hlMat);
    hl.position.set(x, 0.7, 2.06);
    g.add(hl);
  });

  // Taillights
  [-0.6, 0.6].forEach(x => {
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.06), tlMat);
    tl.position.set(x, 0.7, -2.06);
    g.add(tl);
  });

  // Grille
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.05), darkMat);
  grille.position.set(0, 0.42, 2.07);
  g.add(grille);

  // Wheels
  const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.2, 12), wMat);
  [[-0.98, 1.3], [0.98, 1.3], [-0.98, -1.3], [0.98, -1.3]].forEach(([x, z]) => {
    const w = wh.clone();
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.32, z);
    g.add(w);
  });

  return g;
}

export class Traffic {
  private cars: TrafficCar[] = [];
  private scene!: THREE.Scene;

  init(scene: THREE.Scene, roads: RoadSegment[], count = 25) {
    this.scene = scene;
    this.cars = [];

    for (let i = 0; i < count; i++) {
      const road = roads[Math.floor(Math.random() * roads.length)];
      this.spawnCar(road, roads);
    }
  }

  private spawnCar(road: RoadSegment, _roads: RoadSegment[]) {
    const mesh = buildTrafficMesh();
    const direction = Math.random() < 0.5 ? 1 : -1;
    const lane = Math.random() < 0.5 ? -1 : 1;
    const laneOffset = lane * 2.8;
    const progress = Math.random();

    let px, pz, ry;
    if (road.isHorizontal) {
      px = road.x + (progress - 0.5) * road.length;
      pz = road.z + laneOffset;
      ry = direction > 0 ? 0 : Math.PI;
    } else {
      px = road.x + laneOffset;
      pz = road.z + (progress - 0.5) * road.length;
      ry = direction > 0 ? Math.PI / 2 : -Math.PI / 2;
    }

    mesh.position.set(px, 0, pz);
    mesh.rotation.y = ry;
    this.scene.add(mesh);

    const targetSpeed = 6 + Math.random() * 8;
    this.cars.push({
      mesh,
      road,
      position: new THREE.Vector3(px, 0, pz),
      speed: targetSpeed,
      targetSpeed,
      direction,
      lane,
      progress,
      waitTimer: 0,
    });
  }

  update(dt: number, playerPos: THREE.Vector3) {
    const laneOffset = 2.8;

    this.cars.forEach(car => {
      if (car.waitTimer > 0) {
        car.waitTimer -= dt;
        car.speed = 0;
        return;
      }

      // Slow down near player
      const distToPlayer = car.position.distanceTo(playerPos);
      if (distToPlayer < 12) {
        car.speed = Math.max(0, car.speed - 20 * dt);
        if (distToPlayer < 6) {
          car.waitTimer = 0.5;
          return;
        }
      } else {
        car.speed += (car.targetSpeed - car.speed) * 2 * dt;
      }

      // Move along road
      const halfLen = car.road.length / 2;
      if (car.road.isHorizontal) {
        car.position.x += car.direction * car.speed * dt;
        car.position.z = car.road.z + car.lane * laneOffset;

        // Wrap around
        const startX = car.road.x - halfLen;
        const endX = car.road.x + halfLen;
        if (car.position.x > endX) car.position.x = startX + 5;
        if (car.position.x < startX) car.position.x = endX - 5;
      } else {
        car.position.z += car.direction * car.speed * dt;
        car.position.x = car.road.x + car.lane * laneOffset;

        const startZ = car.road.z - halfLen;
        const endZ = car.road.z + halfLen;
        if (car.position.z > endZ) car.position.z = startZ + 5;
        if (car.position.z < startZ) car.position.z = endZ - 5;
      }

      car.mesh.position.copy(car.position);

      // Rotation
      let targetRY = 0;
      if (car.road.isHorizontal) {
        targetRY = car.direction > 0 ? 0 : Math.PI;
      } else {
        targetRY = car.direction > 0 ? Math.PI / 2 : -Math.PI / 2;
      }
      car.mesh.rotation.y = targetRY;

      // Wheel rotation animation
      car.mesh.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.rotation.x += car.speed * dt * 2;
        }
      });
    });
  }

  getCarPositions(): THREE.Vector3[] {
    return this.cars.map(c => c.position);
  }

  getCarBoundingBoxes(): THREE.Box3[] {
    return this.cars.map(c => {
      const box = new THREE.Box3();
      box.setFromObject(c.mesh);
      return box;
    });
  }

  destroy() {
    this.cars.forEach(c => this.scene.remove(c.mesh));
    this.cars = [];
  }
}
