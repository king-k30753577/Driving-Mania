// World.ts - Procedural city generation using Three.js

import * as THREE from 'three';

export interface RoadSegment {
  x: number;
  z: number;
  width: number;
  length: number;
  isHorizontal: boolean;
}

export interface BuildingBox {
  x: number; z: number;
  w: number; d: number; h: number;
}

export class World {
  public scene!: THREE.Scene;
  public roads: RoadSegment[] = [];
  public buildings: BuildingBox[] = [];
  private coinMeshes: THREE.Mesh[] = [];
  private trafficLights: THREE.Object3D[] = [];
  public coinPositions: THREE.Vector3[] = [];
  public colliders: THREE.Box3[] = [];

  private CITY_SIZE = 400;
  private BLOCK_SIZE = 60;
  private ROAD_WIDTH = 12;

  init(scene: THREE.Scene) {
    this.scene = scene;
    this.buildGround();
    this.buildRoadNetwork();
    this.buildBuildings();
    this.buildTrees();
    this.buildStreetLights();
    this.buildCoins();
  }

  private buildGround() {
    // Main road surface (asphalt)
    const groundGeo = new THREE.PlaneGeometry(this.CITY_SIZE * 2, this.CITY_SIZE * 2);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Grass patches
    const grassGeo = new THREE.PlaneGeometry(this.CITY_SIZE * 2, this.CITY_SIZE * 2);
    const grassMat = new THREE.MeshLambertMaterial({ color: 0x2d5a1b });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = -0.01;
    this.scene.add(grass);
  }

  private buildRoadNetwork() {
    const half = this.CITY_SIZE / 2;
    const step = this.BLOCK_SIZE;
    const rw = this.ROAD_WIDTH;
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const lineMat = new THREE.MeshLambertMaterial({ color: 0xffdd00 });
    const sideLineMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

    // Grid roads
    for (let x = -half; x <= half; x += step) {
      // Vertical road
      const roadGeo = new THREE.PlaneGeometry(rw, this.CITY_SIZE);
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(x, 0.01, 0);
      road.receiveShadow = true;
      this.scene.add(road);
      this.roads.push({ x, z: 0, width: rw, length: this.CITY_SIZE, isHorizontal: false });

      // Center line
      for (let z = -half; z < half; z += 8) {
        const lineGeo = new THREE.PlaneGeometry(0.2, 4);
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(x, 0.02, z + 2);
        this.scene.add(line);
      }

      // Side lines
      [-rw / 2, rw / 2].forEach(offset => {
        const sideGeo = new THREE.PlaneGeometry(0.15, this.CITY_SIZE);
        const side = new THREE.Mesh(sideGeo, sideLineMat);
        side.rotation.x = -Math.PI / 2;
        side.position.set(x + offset, 0.02, 0);
        this.scene.add(side);
      });

      // Horizontal road
      const hRoadGeo = new THREE.PlaneGeometry(this.CITY_SIZE, rw);
      const hRoad = new THREE.Mesh(hRoadGeo, roadMat);
      hRoad.rotation.x = -Math.PI / 2;
      hRoad.position.set(0, 0.01, x);
      hRoad.receiveShadow = true;
      this.scene.add(hRoad);
      this.roads.push({ x: 0, z: x, width: rw, length: this.CITY_SIZE, isHorizontal: true });

      for (let z = -half; z < half; z += 8) {
        const lineGeo = new THREE.PlaneGeometry(4, 0.2);
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(z + 2, 0.02, x);
        this.scene.add(line);
      }
    }

    // Sidewalks / curbs
    for (let x = -half; x <= half; x += step) {
      [-rw / 2 - 1.5, rw / 2 + 1.5].forEach(offset => {
        const curbGeo = new THREE.BoxGeometry(1, 0.15, this.CITY_SIZE);
        const curbMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const curb = new THREE.Mesh(curbGeo, curbMat);
        curb.position.set(x + offset, 0.075, 0);
        this.scene.add(curb);
      });
    }
  }

  private buildBuildings() {
    const half = this.CITY_SIZE / 2;
    const step = this.BLOCK_SIZE;
    const rw = this.ROAD_WIDTH;
    const margin = 8;

    const buildingColors = [0x4a6fa5, 0x8b4513, 0x5a7a5a, 0x8b7355, 0x6b6b9b, 0x9b6b6b, 0x4a8b7a];
    const windowMat = new THREE.MeshLambertMaterial({ color: 0xffffcc, emissive: 0x444400, emissiveIntensity: 0.3 });

    const seenPositions: THREE.Box3[] = [];

    for (let bx = -half + step / 2; bx < half; bx += step) {
      for (let bz = -half + step / 2; bz < half; bz += step) {
        // Block boundary check - skip road intersection zones
        const isNearRoadX = Math.abs(bx % step) < rw / 2 + margin;
        const isNearRoadZ = Math.abs(bz % step) < rw / 2 + margin;
        if (isNearRoadX || isNearRoadZ) continue;

        const blockW = step - rw - margin * 2;
        const blockD = step - rw - margin * 2;

        // Place 1-4 buildings per block
        const count = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
          const w = blockW * (0.3 + Math.random() * 0.4);
          const d = blockD * (0.3 + Math.random() * 0.4);
          const h = 5 + Math.random() * 40;

          const ox = bx + (Math.random() - 0.5) * (blockW - w);
          const oz = bz + (Math.random() - 0.5) * (blockD - d);

          const box = new THREE.Box3(
            new THREE.Vector3(ox - w / 2, 0, oz - d / 2),
            new THREE.Vector3(ox + w / 2, h, oz + d / 2)
          );

          // Avoid overlap with other buildings
          const overlapping = seenPositions.some(b => b.intersectsBox(box));
          if (overlapping) continue;
          seenPositions.push(box);

          const color = buildingColors[Math.floor(Math.random() * buildingColors.length)];
          const geo = new THREE.BoxGeometry(w, h, d);
          const mat = new THREE.MeshLambertMaterial({ color });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(ox, h / 2, oz);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          this.scene.add(mesh);

          // Windows
          const floors = Math.floor(h / 3.5);
          const winsPerRow = Math.floor(w / 2.5);
          if (floors > 1 && winsPerRow > 0) {
            const winW = 0.8;
            const winH = 1.0;
            for (let f = 0; f < Math.min(floors, 8); f++) {
              for (let wi = 0; wi < Math.min(winsPerRow, 5); wi++) {
                if (Math.random() < 0.7) {
                  const wGeo = new THREE.PlaneGeometry(winW, winH);
                  const wMesh = new THREE.Mesh(wGeo, windowMat);
                  const wx = ox - w / 2 + (wi + 0.5) * (w / winsPerRow) + 0.1;
                  const wy = 2 + f * 3.5;
                  wMesh.position.set(wx, wy, oz + d / 2 + 0.01);
                  this.scene.add(wMesh);
                }
              }
            }
          }

          this.buildings.push({ x: ox, z: oz, w, d, h });
          // Add as collider
          this.colliders.push(new THREE.Box3(
            new THREE.Vector3(ox - w / 2, 0, oz - d / 2),
            new THREE.Vector3(ox + w / 2, h, oz + d / 2)
          ));
        }
      }
    }
  }

  private buildTrees() {
    const half = this.CITY_SIZE / 2;
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5c3d1a });
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x2d7a2d });
    const leafMat2 = new THREE.MeshLambertMaterial({ color: 0x1a5c1a });

    const rng = (min: number, max: number) => min + Math.random() * (max - min);

    for (let i = 0; i < 200; i++) {
      const x = rng(-half, half);
      const z = rng(-half, half);

      // Don't place trees on roads
      const onRoad = this.isOnRoad(x, z);
      if (onRoad) continue;

      const group = new THREE.Group();
      // Trunk
      const trunkH = rng(2, 4);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, trunkH), trunkMat);
      trunk.position.y = trunkH / 2;
      group.add(trunk);
      // Canopy
      const leafH = rng(3, 6);
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(rng(2, 3), leafH, 7), Math.random() > 0.5 ? leafMat : leafMat2);
      leaf.position.y = trunkH + leafH * 0.4;
      group.add(leaf);
      group.position.set(x, 0, z);
      group.castShadow = true;
      this.scene.add(group);
    }
  }

  private buildStreetLights() {
    const half = this.CITY_SIZE / 2;
    const step = this.BLOCK_SIZE;
    const rw = this.ROAD_WIDTH;
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const lightMat = new THREE.MeshLambertMaterial({ color: 0xffffaa, emissive: 0xffee88, emissiveIntensity: 1.5 });

    for (let x = -half; x <= half; x += step) {
      for (let z = -half; z <= half; z += step) {
        const positions = [
          { px: x + rw / 2 + 2, pz: z + rw / 2 + 2 },
          { px: x - rw / 2 - 2, pz: z + rw / 2 + 2 },
          { px: x + rw / 2 + 2, pz: z - rw / 2 - 2 },
          { px: x - rw / 2 - 2, pz: z - rw / 2 - 2 },
        ];

        positions.forEach(({ px, pz }) => {
          const group = new THREE.Group();
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 6, 8), poleMat);
          pole.position.y = 3;
          group.add(pole);

          const arm = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.1), poleMat);
          arm.position.set(1, 6.1, 0);
          group.add(arm);

          const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), lightMat);
          lamp.position.set(2, 6, 0);
          group.add(lamp);

          // Point light
          const pt = new THREE.PointLight(0xffeeaa, 0.8, 20);
          pt.position.set(2, 6, 0);
          group.add(pt);

          group.position.set(px, 0, pz);
          this.scene.add(group);
        });
      }
    }
  }

  private buildCoins() {
    const coinGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 12);
    const coinMat = new THREE.MeshLambertMaterial({ color: 0xffcc00, emissive: 0x996600, emissiveIntensity: 0.4 });

    for (let i = 0; i < 80; i++) {
      const road = this.roads[Math.floor(Math.random() * this.roads.length)];
      let x, z;
      if (road.isHorizontal) {
        x = road.x + (Math.random() - 0.5) * road.length * 0.8;
        z = road.z;
      } else {
        x = road.x;
        z = road.z + (Math.random() - 0.5) * road.length * 0.8;
      }

      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.position.set(x, 1.2, z);
      coin.rotation.x = Math.PI / 2;
      this.scene.add(coin);
      this.coinMeshes.push(coin);
      this.coinPositions.push(new THREE.Vector3(x, 1.2, z));
    }
  }

  collectCoin(index: number) {
    if (index < 0 || index >= this.coinMeshes.length) return;
    const mesh = this.coinMeshes[index];
    if (mesh.visible) {
      mesh.visible = false;
      // Respawn after 30 seconds
      setTimeout(() => {
        mesh.visible = true;
      }, 30000);
    }
  }

  isOnRoad(x: number, z: number): boolean {
    const rw = this.ROAD_WIDTH + 4;
    for (const road of this.roads) {
      if (road.isHorizontal) {
        if (Math.abs(z - road.z) < rw / 2 &&
            Math.abs(x) < road.length / 2 + 10) return true;
      } else {
        if (Math.abs(x - road.x) < rw / 2 &&
            Math.abs(z) < road.length / 2 + 10) return true;
      }
    }
    return false;
  }

  update(dt: number) {
    // Animate coins
    const t = performance.now() * 0.001;
    this.coinMeshes.forEach((coin, i) => {
      if (coin.visible) {
        coin.position.y = 1.2 + Math.sin(t * 2 + i) * 0.15;
        coin.rotation.z = t * 1.5;
      }
    });
  }
}
