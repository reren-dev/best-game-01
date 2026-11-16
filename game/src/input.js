// Input handling for mouse, touch, and keyboard (WASD/Arrows/Space/P/R)
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.mouseX = FIELD_WIDTH_DEFAULT => 640;
    this.mouseY = 360;
    this.mouseActive = false;
    this.keys = new Set();
    this.pressed = new Set();

    this.onMouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.mouseX = (e.clientX - rect.left) * scaleX;
      this.mouseY = (e.clientY - rect.top) * scaleY;
      this.mouseActive = true;
    };

    this.onKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (!this.keys.has(key)) {
        this.pressed.add(key);
      }
      this.keys.add(key);
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
      }
    };

    this.onKeyUp = (e) => {
      this.keys.delete(e.key.toLowerCase());
    };

    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        this.mouseX = (touch.clientX - rect.left) * scaleX;
        this.mouseY = (touch.clientY - rect.top) * scaleY;
        this.mouseActive = true;
      }
      e.preventDefault();
    }, { passive: false });
  }

  isDown(key) {
    return this.keys.has(key) || this.keys.has(key.toLowerCase());
  }

  consumePressed(key) {
    const k = key.toLowerCase();
    if (this.pressed.has(k)) {
      this.pressed.delete(k);
      return true;
    }
    return false;
  }

  clearPressed() {
    this.pressed.clear();
  }

  destroy() {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
