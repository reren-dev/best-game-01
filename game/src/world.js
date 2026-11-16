// World simulation, entities, spawning, and game mechanics for Ember Drift
import { FIELD, PLAYER, WORLD } from './config.js';
import { Random } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_PICKUP = 1;
export const EVENT_HIT = 2;
export const EVENT_WAVE = 4;
export const EVENT_OVER = 8;

export class World {
  constructor(seed = 1) {
    this.random = new Random(seed);
    this.reset();
  }

  reset() {
    this.time = 0;
    this.score = 0;
    this.bestCombo = 1;
    this.combo = 1;
    this.comboTimer = 0;
    this.lives = WORLD.maxLives;
    this.wave = 1;
    this.waveTimer = 0;
    this.dashCooldownTimer = 0;
    this.invulnerableTimer = 0;
    this.screenShake = 0;

    this.player = {
      x: FIELD.width / 2,
      y: FIELD.height / 2,
      vx: 0,
      vy: 0,
      radius: PLAYER.radius,
      glow: 20,
      isDashing: false,
      dashTimer: 0,
    };

    this.motes = [];
    this.shades = [];
    this.particles = [];

    this.moteSpawnAcc = 0;
    this.shadeSpawnAcc = 0;

    // Initial spawn to make play scene rich
    for (let i = 0; i < 8; i++) {
      this.spawnMote();
    }
    for (let i = 0; i < 4; i++) {
      this.spawnShade();
    }
  }

  spawnMote() {
    this.motes.push({
      x: this.random.range(80, FIELD.width - 80),
      y: this.random.range(80, FIELD.height - 80),
      radius: 10,
      value: WORLD.moteBaseValue,
      life: 15, // seconds before fading
    });
  }

  spawnShade() {
    const edge = this.random.int(0, 3);
    let x, y;
    const speed = 140 + this.wave * 25;
    const angle = this.random.range(0, Math.PI * 2);

    if (edge === 0) { x = this.random.range(0, FIELD.width); y = -30; }
    else if (edge === 1) { x = FIELD.width + 30; y = this.random.range(0, FIELD.height); }
    else if (edge === 2) { x = this.random.range(0, FIELD.width); y = FIELD.height + 30; }
    else { x = -30; y = this.random.range(0, FIELD.height); }

    const targetX = FIELD.width / 2 + this.random.range(-300, 300);
    const targetY = FIELD.height / 2 + this.random.range(-200, 200);
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.hypot(dx, dy) || 1;

    this.shades.push({
      x,
      y,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      radius: 16,
      rotation: this.random.range(0, Math.PI * 2),
      rotSpeed: this.random.range(-2, 2),
    });
  }

  step(dt, input, isAutopilot = false) {
    let events = EVENT_NONE;
    if (this.lives <= 0) return EVENT_OVER;

    this.time += dt;
    this.waveTimer += dt;
    if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= dt;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 4);

    // Wave progression every 30s
    if (this.waveTimer >= WORLD.waveDuration) {
      this.waveTimer = 0;
      this.wave++;
      events |= EVENT_WAVE;
      // Spawn extra shades on wave change
      for (let i = 0; i < 2 + this.wave; i++) {
        this.spawnShade();
      }
    }

    // Combo decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 1;
      }
    }

    // Player Movement
    let targetX = input.mouseX;
    let targetY = input.mouseY;

    if (isAutopilot) {
      // Autopilot steers toward closest mote or center
      let closestMote = null;
      let minDist = Infinity;
      for (const m of this.motes) {
        const d = Math.hypot(m.x - this.player.x, m.y - this.player.y);
        if (d < minDist) {
          minDist = d;
          closestMote = m;
        }
      }
      if (closestMote) {
        targetX = closestMote.x;
        targetY = closestMote.y;
      } else {
        targetX = FIELD.width / 2;
        targetY = FIELD.height / 2;
      }
    }

    const dx = targetX - this.player.x;
    const dy = targetY - this.player.y;
    const dist = Math.hypot(dx, dy);

    // Keyboard fallback movement
    let kx = 0;
    let ky = 0;
    if (input.isDown('w') || input.isDown('arrowup')) ky -= 1;
    if (input.isDown('s') || input.isDown('arrowdown')) ky += 1;
    if (input.isDown('a') || input.isDown('arrowleft')) kx -= 1;
    if (input.isDown('d') || input.isDown('arrowright')) kx += 1;

    let moveSpeed = PLAYER.speed;
    if (this.player.isDashing) {
      moveSpeed = PLAYER.dashSpeed;
      this.player.dashTimer -= dt;
      if (this.player.dashTimer <= 0) {
        this.player.isDashing = false;
      }
    } else if (kx !== 0 || ky !== 0) {
      const len = Math.hypot(kx, ky);
      this.player.x += (kx / len) * moveSpeed * dt;
      this.player.y += (ky / len) * moveSpeed * dt;
    } else if (dist > 2) {
      this.player.x += dx * (1 - Math.pow(PLAYER.lag, dt * 60));
      this.player.y += dy * (1 - Math.pow(PLAYER.lag, dt * 60));
    }

    // Dash activation (Space)
    if ((input.consumePressed(' ') || (isAutopilot && this.dashCooldownTimer <= 0 && this.random.next() < 0.05)) && this.dashCooldownTimer <= 0) {
      this.player.isDashing = true;
      this.player.dashTimer = PLAYER.dashDuration;
      this.dashCooldownTimer = PLAYER.dashCooldown;
      this.invulnerableTimer = 0.25;
      events |= EVENT_HIT; // placeholder sound cue
    }

    // Clamp player within bounds
    this.player.x = Math.max(PLAYER.radius, Math.min(FIELD.width - PLAYER.radius, this.player.x));
    this.player.y = Math.max(PLAYER.radius, Math.min(FIELD.height - PLAYER.radius, this.player.y));

    // Spawning Motes & Shades
    this.moteSpawnAcc += dt;
    if (this.moteSpawnAcc >= WORLD.moteSpawnInterval) {
      this.moteSpawnAcc = 0;
      this.spawnMote();
    }

    this.shadeSpawnAcc += dt;
    const shadeInterval = Math.max(0.6, WORLD.shadeSpawnInterval - this.wave * 0.15);
    if (this.shadeSpawnAcc >= shadeInterval) {
      this.shadeSpawnAcc = 0;
      this.spawnShade();
    }

    // Update Motes
    for (let i = this.motes.length - 1; i >= 0; i--) {
      const m = this.motes[i];
      m.life -= dt;
      if (m.life <= 0) {
        this.motes.splice(i, 1);
        continue;
      }
      // Collision with player
      const d = Math.hypot(m.x - this.player.x, m.y - this.player.y);
      if (d < this.player.radius + m.radius) {
        this.score += m.value * this.combo;
        this.combo = Math.min(10, this.combo + 1);
        if (this.combo > this.bestCombo) this.bestCombo = this.combo;
        this.comboTimer = WORLD.comboDecay;
        this.player.glow = Math.min(60, this.player.glow + 3);
        this.motes.splice(i, 1);
        events |= EVENT_PICKUP;
      }
    }

    // Update Shades
    for (let i = this.shades.length - 1; i >= 0; i--) {
      const s = this.shades[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rotation += s.rotSpeed * dt;

      // Remove offscreen shades
      if (s.x < -100 || s.x > FIELD.width + 100 || s.y < -100 || s.y > FIELD.height + 100) {
        this.shades.splice(i, 1);
        continue;
      }

      // Collision with player
      if (this.invulnerableTimer <= 0 && !this.player.isDashing) {
        const d = Math.hypot(s.x - this.player.x, s.y - this.player.y);
        if (d < this.player.radius + s.radius - PLAYER.hitboxPadding) {
          this.lives--;
          this.invulnerableTimer = 1.5;
          this.screenShake = 0.5;
          this.combo = 1;
          events |= EVENT_HIT;
          this.shades.splice(i, 1);
          if (this.lives <= 0) {
            events |= EVENT_OVER;
          }
        }
      }
    }

    return events;
  }
}
