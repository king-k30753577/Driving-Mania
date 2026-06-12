// Controls.ts - Keyboard, touch, and tilt input handling

export interface ControlState {
  throttle: number;    // 0-1
  brake: number;       // 0-1
  steering: number;    // -1 to 1 (left negative, right positive)
  handbrake: boolean;
  nitro: boolean;
  horn: boolean;
  cameraSwitch: boolean;
  pause: boolean;
}

export class Controls {
  public state: ControlState = {
    throttle: 0,
    brake: 0,
    steering: 0,
    handbrake: false,
    nitro: false,
    horn: false,
    cameraSwitch: false,
    pause: false,
  };

  private keys: Set<string> = new Set();
  private touchButtons: Record<string, boolean> = {};
  private steeringWheelAngle = 0;
  private tiltEnabled = false;
  private tiltSensitivity = 0.5;
  private steeringFlip = false;

  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundDeviceOrientation: (e: DeviceOrientationEvent) => void;

  constructor() {
    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
    this.boundDeviceOrientation = this.onDeviceOrientation.bind(this);
  }

  init(controlMode: string, tiltSensitivity: number, steeringFlip: boolean) {
    this.tiltSensitivity = tiltSensitivity;
    this.steeringFlip = steeringFlip;
    this.tiltEnabled = controlMode === 'tilt';

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);

    if (this.tiltEnabled) {
      if (typeof DeviceOrientationEvent !== 'undefined' &&
          typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        (DeviceOrientationEvent as any).requestPermission().then((perm: string) => {
          if (perm === 'granted') {
            window.addEventListener('deviceorientation', this.boundDeviceOrientation);
          }
        }).catch(() => {});
      } else {
        window.addEventListener('deviceorientation', this.boundDeviceOrientation);
      }
    }
  }

  private onKeyDown(e: KeyboardEvent) {
    this.keys.add(e.code);
    if (e.code === 'Escape') this.state.pause = true;
    if (e.code === 'KeyC') this.state.cameraSwitch = true;
    if (e.code === 'KeyH') this.state.horn = true;
    e.preventDefault?.();
  }

  private onKeyUp(e: KeyboardEvent) {
    this.keys.delete(e.code);
    if (e.code === 'KeyC') this.state.cameraSwitch = false;
    if (e.code === 'KeyH') this.state.horn = false;
    if (e.code === 'Escape') this.state.pause = false;
  }

  private onDeviceOrientation(e: DeviceOrientationEvent) {
    if (e.gamma === null) return;
    const flip = this.steeringFlip ? -1 : 1;
    const raw = (e.gamma / 45) * this.tiltSensitivity * flip;
    this.steeringWheelAngle = Math.max(-1, Math.min(1, raw));
  }

  // Called by touch UI components
  setButton(name: string, pressed: boolean) {
    this.touchButtons[name] = pressed;
  }

  setSteeringWheel(angle: number) {
    // angle: -1 to 1
    this.steeringWheelAngle = Math.max(-1, Math.min(1, angle));
  }

  clearOneShot() {
    this.state.pause = false;
    this.state.cameraSwitch = false;
    this.state.horn = false;
  }

  update() {
    // Keyboard
    const kbThrottle = this.keys.has('ArrowUp') || this.keys.has('KeyW') ? 1 : 0;
    const kbBrake = this.keys.has('ArrowDown') || this.keys.has('KeyS') ? 1 : 0;
    const kbLeft = this.keys.has('ArrowLeft') || this.keys.has('KeyA') ? 1 : 0;
    const kbRight = this.keys.has('ArrowRight') || this.keys.has('KeyD') ? 1 : 0;
    const kbHandbrake = this.keys.has('Space') ? true : false;
    const kbNitro = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? true : false;

    // Touch buttons
    const tbThrottle = this.touchButtons['gas'] ? 1 : 0;
    const tbBrake = this.touchButtons['brake'] ? 1 : 0;
    const tbLeft = this.touchButtons['left'] ? 1 : 0;
    const tbRight = this.touchButtons['right'] ? 1 : 0;
    const tbHandbrake = this.touchButtons['handbrake'] ?? false;
    const tbNitro = this.touchButtons['nitro'] ?? false;

    this.state.throttle = Math.max(kbThrottle, tbThrottle);
    this.state.brake = Math.max(kbBrake, tbBrake);
    this.state.handbrake = kbHandbrake || tbHandbrake;
    this.state.nitro = kbNitro || tbNitro;

    // Steering
    const kbSteering = kbRight - kbLeft;
    const tbSteering = tbRight - tbLeft;

    if (this.tiltEnabled) {
      this.state.steering = this.steeringWheelAngle;
    } else {
      // Wheel drag or button steering
      const buttonSteering = kbSteering !== 0 ? kbSteering : tbSteering;
      if (this.steeringWheelAngle !== 0) {
        // Steering wheel drag mode active
        this.state.steering = this.steeringWheelAngle;
      } else {
        // Snap steering from buttons with smoothing
        const target = buttonSteering;
        const speed = 3;
        if (Math.abs(target - this.state.steering) < 0.01) {
          this.state.steering = target;
        } else {
          this.state.steering += (target - this.state.steering) * 0.15 * speed;
        }
      }
    }
  }

  destroy() {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('deviceorientation', this.boundDeviceOrientation);
  }
}
