// Configuration tuning constants for Ember Drift
export const FIELD = {
  width: 1280,
  height: 720,
};

export const PLAYER = {
  radius: 18,
  speed: 480, // pixels per second
  dashSpeed: 1100,
  dashDuration: 0.18, // seconds
  dashCooldown: 1.2, // seconds
  dashCost: 5, // glow / score points
  lag: 0.15, // smoothing factor for mouse follow
  hitboxPadding: 4, // pixels of collision forgiveness for hazards
};

export const WORLD = {
  maxLives: 3,
  waveDuration: 30, // seconds per gust wave
  moteSpawnInterval: 0.6, // seconds
  shadeSpawnInterval: 1.8, // seconds
  moteBaseValue: 10,
  comboDecay: 3.0, // seconds before combo resets
};
