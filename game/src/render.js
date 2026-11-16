// Canvas rendering for Ember Drift: dusk atmosphere, glowing spirits, HUD, menus
import { FIELD } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

export function render(ctx, world, screen, bestScore = 0) {
  ctx.save();

  // Screen shake effect
  if (world.screenShake > 0) {
    const ox = (Math.random() - 0.5) * world.screenShake * 16;
    const oy = (Math.random() - 0.5) * world.screenShake * 16;
    ctx.translate(ox, oy);
  }

  // Dusk background gradient
  const bgGrad = ctx.createRadialGradient(FIELD.width / 2, FIELD.height / 2, 100, FIELD.width / 2, FIELD.height / 2, FIELD.width);
  bgGrad.addColorStop(0, '#15132b');
  bgGrad.addColorStop(0.5, '#0c0a1a');
  bgGrad.addColorStop(1, '#05040a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);

  // Background stars / fireflies
  ctx.fillStyle = 'rgba(255, 255, 200, 0.25);';
  ctx.fillStyle = '#fffae6';
  for (let i = 0; i < 40; i++) {
    const fx = (Math.sin(i * 99 + world.time * 0.2) * 0.5 + 0.5) * FIELD.width;
    const fy = (Math.cos(i * 33 + world.time * 0.15) * 0.5 + 0.5) * FIELD.height;
    ctx.fillRect(fx, fy, 2, 2);
  }

  // Render Motes (light-motes)
  for (const m of world.motes) {
    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#ffd700';
    ctx.fillStyle = '#ffe853';
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.radius + Math.sin(world.time * 6 + m.x) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Render Shades (thorn-shades)
  for (const s of world.shades) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rotation);
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ff3366';
    ctx.fillStyle = '#8a2be2';
    ctx.strokeStyle = '#ff3366';
    ctx.lineWidth = 3;

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const r = i % 2 === 0 ? s.radius : s.radius * 0.5;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Render Player (ember-spirit)
  const p = world.player;
  ctx.save();
  ctx.shadowBlur = 25 + p.glow;
  ctx.shadowColor = p.isDashing ? '#00ffff' : '#ff7b25';
  const playerGrad = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.radius + p.glow);
  playerGrad.addColorStop(0, '#ffffff');
  playerGrad.addColorStop(0.4, p.isDashing ? '#00ffff' : '#ffb347');
  playerGrad.addColorStop(1, 'rgba(255, 80, 0, 0)');
  ctx.fillStyle = playerGrad;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius + p.glow * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // HUD (Score, Lives, Combo, Wave, Dash Cooldown)
  if (screen === SCREEN_PLAY || screen === SCREEN_OVER) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${Math.floor(world.score)}`, 40, 50);

    ctx.textAlign = 'center';
    ctx.fillText(`WAVE ${world.wave}`, FIELD.width / 2, 50);

    ctx.textAlign = 'right';
    const livesText = '♥ '.repeat(Math.max(0, world.lives)).trim();
    ctx.fillStyle = '#ff4466';
    ctx.fillText(livesText || '—', FIELD.width - 40, 50);

    // Combo & Dash indicator
    ctx.font = '20px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd700';
    if (world.combo > 1) {
      ctx.fillText(`COMBO x${world.combo}`, 40, 90);
    }

    ctx.fillStyle = world.dashCooldownTimer <= 0 ? '#00ffff' : '#666688';
    ctx.fillText(`DASH [SPACE]: ${world.dashCooldownTimer <= 0 ? 'READY' : world.dashCooldownTimer.toFixed(1) + 's'}`, 40, 130);
  }

  // Title Screen Overlay
  if (screen === SCREEN_TITLE) {
    ctx.fillStyle = 'rgba(8, 7, 18, 0.85)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff8833';
    ctx.font = '900 72px system-ui, sans-serif';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ff7b25';
    ctx.fillText('EMBER DRIFT', FIELD.width / 2, FIELD.height / 2 - 80);

    ctx.fillStyle = '#f0f0ff';
    ctx.font = '24px system-ui, sans-serif';
    ctx.shadowBlur = 0;
    ctx.fillText('Pilot your ember spirit through the dusk garden', FIELD.width / 2, FIELD.height / 2 - 10);
    ctx.fillText('Move with Mouse / WASD • Dash with SPACE • Avoid Thorn Shades', FIELD.width / 2, FIELD.height / 2 + 35);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillText('CLICK OR PRESS ANY KEY TO START', FIELD.width / 2, FIELD.height / 2 + 120);
  }

  // Game Over Screen Overlay
  if (screen === SCREEN_OVER) {
    ctx.fillStyle = 'rgba(5, 4, 10, 0.9)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff3366';
    ctx.font = '900 64px system-ui, sans-serif';
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#ff3366';
    ctx.fillText('FLAME EXTINGUISHED', FIELD.width / 2, FIELD.height / 2 - 90);

    ctx.fillStyle = '#f0f0ff';
    ctx.font = '28px system-ui, sans-serif';
    ctx.shadowBlur = 0;
    ctx.fillText(`Final Score: ${Math.floor(world.score)}`, FIELD.width / 2, FIELD.height / 2 - 20);
    ctx.fillText(`Best Combo: x${world.bestCombo}`, FIELD.width / 2, FIELD.height / 2 + 25);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillText('PRESS [R] TO RESTART', FIELD.width / 2, FIELD.height / 2 + 105);
  }

  ctx.restore();
}
