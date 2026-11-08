import * as THREE from 'three';

// First-person walker on a flat floor: walk, run, crouch, jump, smoothed look.
const STAND = 1.65, CROUCH = 1.0, RADIUS = 0.35;
const SPEED = { walk: 4.2, run: 7.6, crouch: 2.0 };

export class Player {
  constructor(camera) {
    this.camera = camera;
    this.pos = new THREE.Vector3();
    this.yaw = 0; this.pitch = 0;
    this.vy = 0; this.y = 0;
    this.eye = STAND;
    this.vel = new THREE.Vector2();
    this.bob = 0;
    this.radius = RADIUS;
    this.baseHeight = 0;
    this.seated = null;
  }

  place(x, z, yaw = this.yaw) { this.seated = null; this.pos.set(x, 0, z); this.yaw = yaw; this.pitch = 0; this.vel.set(0, 0); this.y = 0; this.vy = 0; }

  sit(seat, world) {
    if (!seat || this.seated || !seat.pos) return false;
    if (Math.hypot(this.pos.x-seat.pos.x,this.pos.z-seat.pos.z)>2.7) return false;
    // Never trap the visitor in solid furniture or teleport them through
    // walls: remember their already-walkable approach position.
    if (world?.hits?.(this.pos.x,this.pos.z,this.radius+.02)) return false;
    this.seated={key:seat.key, label:seat.label, back:{x:this.pos.x,z:this.pos.z},
      yaw:this.yaw, eyeHeight:seat.eyeHeight};
    this.pos.set(seat.pos.x,0,seat.pos.z);
    this.yaw=seat.yaw;
    this.y=0;this.vy=0;this.vel.set(0,0);
    return true;
  }
  stand(world) {
    if (!this.seated) return false;
    const {back}=this.seated;
    let target=back;
    if(world?.hits?.(target.x,target.z,this.radius+.02)) {
      // The approach may have become occupied. Find a nearby free exit,
      // instead of forcing the player into a wall.
      target=null;
      for(let r=.6;r<=2.4&&!target;r+=.4)for(let k=0;k<16;k++) {
        const x=back.x+Math.cos(k*Math.PI/8)*r,z=back.z+Math.sin(k*Math.PI/8)*r;
        if(!world?.hits?.(x,z,this.radius+.02)){target={x,z};break;}
      }
    }
    if(!target)return false;
    this.pos.set(target.x,0,target.z);
    this.seated=null;this.vel.set(0,0);this.y=0;this.vy=0;
    return true;
  }

  update(dt, input, world, sensitivity = 0.0032) {
    const look = input.takeLook();
    this.yaw -= look.dx * sensitivity;
    this.pitch = THREE.MathUtils.clamp(this.pitch - look.dy * sensitivity, -1.35, 1.35);
    const m = input.movement();
    if (this.seated) {
      const wantsStand=Math.hypot(m.x,m.z)>.16 || input.consume('jump');
      if(wantsStand) this.stand(world);
      if(this.seated){
        this.eye+=(this.seated.eyeHeight-this.eye)*Math.min(1,10*dt);
        this.camera.position.set(this.pos.x,this.baseHeight+this.eye,this.pos.z);
        this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ');
        return {moving:0,blocked:false,crouching:false,running:false,seated:true};
      }
      // First input stands up. Another frame is needed before walking or
      // jumping, preventing a single thumb tap from launching the player.
      this.eye+=(STAND-this.eye)*Math.min(1,10*dt);
      this.camera.position.set(this.pos.x,this.baseHeight+this.eye,this.pos.z);
      this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ');
      return {moving:0,blocked:false,crouching:false,running:false,seated:false};
    }
    const crouching = m.crouching && this.vy === 0;
    const speed = (crouching ? SPEED.crouch : m.running ? SPEED.run : SPEED.walk) * (this.speedFactor ?? 1);
    // Desired velocity in world space from camera-relative input.
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    const tx = (m.x * cos + m.z * sin) * speed, tz = (-m.x * sin + m.z * cos) * speed;
    const accel = this.y > 0 ? 4 : 14;
    this.vel.x += (tx - this.vel.x) * Math.min(1, accel * dt);
    this.vel.y += (tz - this.vel.y) * Math.min(1, accel * dt);
    const blocked = world.move(this.pos, this.vel.x * dt, this.vel.y * dt, this.radius, this.y);
    // Stand on whatever is underneath (furniture, roofs); walking off an edge drops you to the floor.
    const floor = world.groundAt ? world.groundAt(this.pos.x, this.pos.z, this.radius, this.y) : 0;
    const grounded = this.y <= floor + 1e-3 && this.vy <= 0;
    if (input.consume('jump') && grounded && !crouching) this.vy = this.jumpSpeed ?? 7.2;
    this.vy -= 22 * dt; this.y = Math.max(floor, this.y + this.vy * dt); if (this.y === floor) this.vy = Math.max(0, this.vy);
    this.eye += ((crouching ? CROUCH : STAND) - this.eye) * Math.min(1, 10 * dt);
    const moving = Math.hypot(this.vel.x, this.vel.y);
    this.bob += moving * dt * 2.1;
    const bobY = this.y === 0 ? Math.sin(this.bob) * Math.min(0.045, moving * 0.008) : 0;
    this.camera.position.set(this.pos.x, this.baseHeight + this.y + this.eye + bobY, this.pos.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    return { moving, blocked, crouching, running: m.running && !crouching };
  }

  forward() { return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); }
}
