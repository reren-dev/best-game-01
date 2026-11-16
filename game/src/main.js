// Main entry point for Ember Drift gameplay loop & state management
import { FIELD } from './config.js';
import { World } from './world.js';
import { Input } from './input.js';
import { AudioSystem } from './audio.js';
import { render, SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = FIELD.width;
canvas.height = FIELD.height;

const input = new Input(canvas);
const audio = new AudioSystem();
const world = new World(1);

let screen = SCREEN_TITLE;
let lastTime = performance.now();
const FIXED_DT = 1 / 60;
let accumulator = 0;

// Check query params for screenshot posing (?shot=start|play|end&seed=1)
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = params.get('seed');
if (seedParam) {
  world.random = new World(Number(seedParam)).random;
}

if (shotName) {
  const staged = stageShot(shotName, world);
  screen = staged.screen;
  render(ctx, world, screen, world.score);
} else {
  // Normal game loop
  function loop(timestamp) {
    const dt = Math.min(0.1, (timestamp - lastTime) / 1000);
    lastTime = timestamp;
    accumulator += dt;

    while (accumulator >= FIXED_DT) {
      accumulator -= FIXED_DT;

      // Handle screen state transitions
      if (screen === SCREEN_TITLE) {
        if (input.mouseActive || input.consumePressed(' ') || input.consumePressed('enter')) {
          audio.init();
          screen = SCREEN_PLAY;
          world.reset();
        }
      } else if (screen === SCREEN_PLAY) {
        if (input.consumePressed('p')) {
          // Pause toggle (or ignore for simplicity)
        }
        const events = world.step(FIXED_DT, input, false);
        if (events & 1) audio.playPickup(world.combo);
        if (events & 2) audio.playHit();
        if (events & 4) audio.playWave();
        if (events & 8) {
          screen = SCREEN_OVER;
        }
      } else if (screen === SCREEN_OVER) {
        if (input.consumePressed('r') || input.consumePressed(' ') || input.consumePressed('enter')) {
          world.reset();
          screen = SCREEN_PLAY;
        }
      }

      input.clearPressed();
    }

    render(ctx, world, screen, world.score);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}
