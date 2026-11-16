// Deterministic screenshot staging for Ember Drift
import { EVENT_OVER } from './world.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER } from './render.js';

const STEP_TIME = 1 / 60;
const START_SECONDS = 3;
const PLAY_SECONDS = 18;
const END_LIMIT_SECONDS = 300;

export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'end') {
    for (let i = 0; i < START_SECONDS / STEP_TIME; i++) {
      world.step(STEP_TIME, { mouseX: 640, mouseY: 360, isDown: () => false, consumePressed: () => false }, true);
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }

  const limit = name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  for (let i = 0; i < limit / STEP_TIME; i++) {
    const events = world.step(STEP_TIME, { mouseX: 640, mouseY: 360, isDown: () => false, consumePressed: () => false }, true);
    if (name === 'end' && (events & EVENT_OVER || world.lives <= 0)) {
      break;
    }
  }

  const over = world.lives <= 0 || name === 'end';
  if (name === 'end' && !over) {
    world.lives = 0;
  }
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.score };
}
