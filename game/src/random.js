// Seeded pseudo-random number generator (Mulberry32) for 100% deterministic runs
export class Random {
  constructor(seed = 1) {
    this.s = Math.floor(seed) >>> 0;
  }

  next() {
    let t = (this.s += 0x6d2b79f5);
    Math.imul;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min, max) {
    return min + this.next() * (max - min);
  }

  int(min, max) {
    return Math.floor(this.range(min, max + 1));
  }

  choice(arr) {
    if (arr.length === 0) return undefined;
    return arr[this.int(0, arr.length - 1)];
  }
}
