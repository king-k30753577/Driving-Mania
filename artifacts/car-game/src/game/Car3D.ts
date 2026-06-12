// Car3D.ts - 3D car model builder using Three.js primitives

import * as THREE from 'three';

export const CAR_COLORS = [
  0xe81c00, 0x1a6aff, 0x00c840, 0xffd000,
  0xffffff, 0x111111, 0xff8800, 0x8844cc,
  0x00aacc, 0xcc2244, 0x44cc88, 0x886644,
];

export const CAR_DEFS = {
  sports:   { label: 'Sports GT',    price: 0,      bodyW: 2.0, bodyH: 0.55, bodyL: 4.2, roofH: 0.6, color: 0 },
  muscle:   { label: 'Muscle V8',    price: 2500,   bodyW: 2.2, bodyH: 0.6,  bodyL: 4.6, roofH: 0.65, color: 3 },
  suv:      { label: 'Urban SUV',    price: 4000,   bodyW: 2.4, bodyH: 0.75, bodyL: 4.8, roofH: 1.0,  color: 2 },
  supercar: { label: 'Supercar X',   price: 12000,  bodyW: 2.1, bodyH: 0.45, bodyL: 4.6, roofH: 0.5,  color: 4 },
};

export function buildCarMesh(carId: string, colorIndex: number): THREE.Group {
  const def = CAR_DEFS[carId as keyof typeof CAR_DEFS] ?? CAR_DEFS.sports;
  const ci = colorIndex ?? def.color;
  const bodyColor = CAR_COLORS[ci % CAR_COLORS.length];

  const group = new THREE.Group();

  const bodyMat   = new THREE.MeshLambertMaterial({ color: bodyColor });
  const darkMat   = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const glassMat  = new THREE.MeshLambertMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6 });
  const chromeMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
  const headlightMat = new THREE.MeshLambertMaterial({ color: 0xffffee, emissive: 0xffeeaa, emissiveIntensity: 2 });
  const taillightMat = new THREE.MeshLambertMaterial({ color: 0xff2200, emissive: 0xff0000, emissiveIntensity: 1 });
  const brakeLightMat = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 3 });
  const wheelMat  = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const rimMat    = new THREE.MeshLambertMaterial({ color: 0x999999 });

  const bW = def.bodyW, bH = def.bodyH, bL = def.bodyL;
  const rH = def.roofH;

  // Main body lower
  const body = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bL), bodyMat);
  body.position.y = 0.4 + bH / 2;
  body.castShadow = true;
  group.add(body);

  // Body sides detail
  const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.05, bH * 0.7, bL * 0.85), chromeMat);
  sideL.position.set(-bW / 2 - 0.025, 0.4 + bH / 2, 0);
  group.add(sideL);
  const sideR = sideL.clone();
  sideR.position.x = bW / 2 + 0.025;
  group.add(sideR);

  // Roof / cabin
  const roofW = bW * 0.78;
  const roofL = bL * 0.45;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(roofW, rH, roofL), bodyMat);
  roof.position.set(0, 0.4 + bH + rH / 2, -bL * 0.04);
  roof.castShadow = true;
  group.add(roof);

  // Windshield front
  const wsFront = new THREE.Mesh(new THREE.BoxGeometry(roofW * 0.85, rH * 0.8, 0.08), glassMat);
  wsFront.position.set(0, 0.4 + bH + rH * 0.45, roofL / 2 - 0.04);
  wsFront.rotation.x = -0.35;
  group.add(wsFront);

  // Windshield rear
  const wsRear = new THREE.Mesh(new THREE.BoxGeometry(roofW * 0.75, rH * 0.8, 0.08), glassMat);
  wsRear.position.set(0, 0.4 + bH + rH * 0.45, -roofL / 2 + 0.04);
  wsRear.rotation.x = 0.35;
  group.add(wsRear);

  // Side windows
  [-1, 1].forEach(side => {
    const sw = new THREE.Mesh(new THREE.BoxGeometry(0.05, rH * 0.75, roofL * 0.85), glassMat);
    sw.position.set(side * roofW / 2, 0.4 + bH + rH * 0.5, -bL * 0.04);
    group.add(sw);
  });

  // Hood
  const hood = new THREE.Mesh(new THREE.BoxGeometry(bW * 0.9, 0.08, bL * 0.28), bodyMat);
  hood.position.set(0, 0.4 + bH, bL * 0.36);
  hood.rotation.x = 0.07;
  group.add(hood);

  // Trunk
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(bW * 0.85, 0.08, bL * 0.22), bodyMat);
  trunk.position.set(0, 0.4 + bH, -bL * 0.38);
  trunk.rotation.x = -0.05;
  group.add(trunk);

  // Front bumper
  const bumperF = new THREE.Mesh(new THREE.BoxGeometry(bW * 1.02, bH * 0.5, 0.2), bodyMat);
  bumperF.position.set(0, 0.4 + bH * 0.28, bL / 2 + 0.1);
  group.add(bumperF);

  // Rear bumper
  const bumperR = bumperF.clone();
  bumperR.position.z = -bL / 2 - 0.1;
  group.add(bumperR);

  // Grille
  const grille = new THREE.Mesh(new THREE.BoxGeometry(bW * 0.6, bH * 0.25, 0.05), darkMat);
  grille.position.set(0, 0.4 + bH * 0.22, bL / 2 + 0.21);
  group.add(grille);

  // Headlights
  [[-bW * 0.3, bL / 2 + 0.16], [bW * 0.3, bL / 2 + 0.16]].forEach(([lx, lz]) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.08), headlightMat);
    hl.position.set(lx, 0.4 + bH * 0.75, lz);
    group.add(hl);
    const ptLight = new THREE.PointLight(0xffffff, 1.5, 25);
    ptLight.position.set(lx, 0.4 + bH * 0.75, lz + 0.5);
    group.add(ptLight);
  });

  // Taillights
  [[-bW * 0.32, -bL / 2 - 0.05], [bW * 0.32, -bL / 2 - 0.05]].forEach(([lx, lz]) => {
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.06), taillightMat);
    tl.position.set(lx, 0.4 + bH * 0.75, lz);
    tl.name = 'taillight';
    group.add(tl);
  });

  // Brake lights (separate, shown on braking)
  const brakeL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 0.06), brakeLightMat);
  brakeL.position.set(-bW * 0.3, 0.4 + bH * 0.65, -bL / 2 - 0.04);
  brakeL.name = 'brakelight';
  brakeL.visible = false;
  group.add(brakeL);
  const brakeR = brakeL.clone();
  brakeR.position.x = bW * 0.3;
  brakeR.name = 'brakelight';
  brakeR.visible = false;
  group.add(brakeR);

  // Exhaust pipes
  for (let i = -1; i <= 1; i += 2) {
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.25, 8), chromeMat);
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(i * 0.35, 0.28, -bL / 2 - 0.12);
    group.add(exhaust);
  }

  // Wheels (4)
  const wheelPositions = [
    { x: -bW / 2 - 0.12, z: bL * 0.32, front: true },
    { x:  bW / 2 + 0.12, z: bL * 0.32, front: true },
    { x: -bW / 2 - 0.12, z: -bL * 0.32, front: false },
    { x:  bW / 2 + 0.12, z: -bL * 0.32, front: false },
  ];

  wheelPositions.forEach(({ x, z, front }) => {
    const wGroup = new THREE.Group();

    // Tire
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.22, 16), wheelMat);
    tire.rotation.z = Math.PI / 2;
    wGroup.add(tire);

    // Rim
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.24, 12), rimMat);
    rim.rotation.z = Math.PI / 2;
    wGroup.add(rim);

    // Spokes
    for (let s = 0; s < 5; s++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.26, 0.04), chromeMat);
      spoke.rotation.z = (s / 5) * Math.PI * 2;
      spoke.position.y = 0.1;
      rim.add(spoke);
    }

    wGroup.position.set(x, 0.35, z);
    wGroup.name = front ? 'wheel_front' : 'wheel_rear';
    group.add(wGroup);
  });

  // Nitro effect particles (hidden by default)
  const nitroGeo = new THREE.SphereGeometry(0.12, 6, 6);
  const nitroMat = new THREE.MeshLambertMaterial({ color: 0x00aaff, emissive: 0x0055ff, emissiveIntensity: 3, transparent: true, opacity: 0.8 });
  for (let i = -1; i <= 1; i += 2) {
    const nParticle = new THREE.Mesh(nitroGeo, nitroMat);
    nParticle.position.set(i * 0.35, 0.28, -bL / 2 - 0.35);
    nParticle.name = 'nitro';
    nParticle.visible = false;
    group.add(nParticle);
  }

  group.castShadow = true;
  return group;
}

export function updateCarMesh(group: THREE.Group, wheelRotation: number, steeringAngle: number, braking: boolean, nitroActive: boolean) {
  group.traverse(child => {
    if (child.name === 'wheel_front') {
      // Wheel rotation + steering
      const steer = Math.atan2(child.position.x, 1) < 0 ? steeringAngle : steeringAngle;
      child.rotation.y = steer;
      const wheels = child.children;
      wheels.forEach(w => {
        if (w instanceof THREE.Mesh) {
          w.rotation.x = -wheelRotation;
        }
      });
    }
    if (child.name === 'wheel_rear') {
      const wheels = child.children;
      wheels.forEach(w => {
        if (w instanceof THREE.Mesh) {
          w.rotation.x = -wheelRotation;
        }
      });
    }
    if (child.name === 'brakelight') {
      child.visible = braking;
    }
    if (child.name === 'nitro') {
      child.visible = nitroActive;
      if (nitroActive) {
        child.position.z = -2.4 - Math.random() * 0.3;
        const s = 0.8 + Math.random() * 0.5;
        child.scale.setScalar(s);
      }
    }
  });
}
