// Utility functions
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Coin System
const coinSystem = {
  element: null,
  init(elementId) {
    this.element = document.getElementById(elementId);
  },
  reset() {},
  updateCoin(score) {},
  show() {
    if (this.element) this.element.style.display = '';
  },
  hide() {
    if (this.element) this.element.style.display = 'none';
  }
};

// Shield System
const shieldSystem = {
  bird: null,
  canvas: null,
  _protecting: false,
  _health: 0,
  _cooldown: 0,
  _state: 'ready',
  init(bird, canvas) {
    this.bird = bird;
    this.canvas = canvas;
    this._state = 'ready';
    this._protecting = false;
    this._health = 0;
  },
  reset() {
    this._state = 'ready';
    this._protecting = false;
    this._health = 0;
  },
  activate() {
    if (this._state !== 'ready') return false;
    this._state = 'active';
    this._protecting = true;
    this._health = 3;
    return true;
  },
  isReady() { return this._state === 'ready'; },
  isProtecting() { return this._protecting; },
  getShieldHealth() { return this._health; },
  getCooldownProgress() { return 1; },
  onPipeHit() {
    if (!this._protecting) return false;
    this._health--;
    if (this._health <= 0) {
      this._protecting = false;
      this._state = 'ready';
    }
    return true;
  },
  spawnPipeBreakParticles(pipe) {},
  update() {},
  draw() {}
};

// Rocket System
const rocketSystem = {
  init(bird, canvas) {},
  reset() {},
  update(score) {},
  updateExplosions() {},
  checkCollision(bird) { return false; },
  draw() {}
};

// Gravity System
const gravitySystem = {
  isActive: false,
  init(canvas) {},
  setGroundY(y) {},
  reset() { this.isActive = false; },
  activate() {
    this.isActive = true;
    return true;
  },
  update() {},
  draw() {}
};

// Power-Up System
const powerUpSystem = {
  isActive: false,
  init(bird, canvas) {},
  reset() { this.isActive = false; },
  activate(time) {
    this.isActive = true;
    return true;
  },
  deactivate() { this.isActive = false; },
  update(time) {},
  isInvincible() { return false; },
  getPipeSpeed() { return 1.5; },
  draw() {}
};

// Portal System
const portalSystem = {
  init(bird, canvas) {},
  reset() {},
  update() {},
  trigger() {},
  canTrigger(score) { return false; },
  isInNewWorld() { return false; },
  shouldSpawnPipes() { return true; },
  checkInvincibility() { return false; },
  getScoreMultiplier() { return 1; },
  isSuckingIn() { return false; },
  isTransitioning() { return false; },
  isAutopilotActive() { return false; },
  breakAutopilot() {},
  updateAutopilot() {},
  drawNewWorldBackground(ctx) {},
  drawNewWorldGround(ctx, groundY) {},
  draw() {},
  needsScreenShake: false,
  screenShakeIntensity: 0,
  screenShakeDuration: 0,
  needsClearPipes: false
};

// Space World System
const spaceWorldSystem = {
  isActive: false,
  init(bird, canvas, addCoins) {},
  reset() { this.isActive = false; },
  activate() { this.isActive = true; },
  deactivate() { this.isActive = false; },
  update(time) {},
  draw(ctx) {}
};
