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

// Shield system is defined in js/shield.js

// Rocket system is defined in js/rocket.js

// Gravity system is defined in js/gravity.js

// Power-Up system is defined in js/powerup.js

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

class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    this.ctx.imageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;

    this.canvas.width = 400;
    this.canvas.height = 600;
    this.resizeCanvas();
    this.spriteLoaded = false;

    // Sound folder is currently empty, so keep audio silent to avoid 404 noise.
    const audioFilesAvailable = false;

    const makeAudio = (src) => {
      const a = new Audio();
      a.addEventListener('error', () => {}, true);
      if (audioFilesAvailable) {
        a.src = src;
      }
      return a;
    };

    this.audioEnabled = audioFilesAvailable;

    this.sounds = {
      flap: makeAudio('assets/sound/flap.mp3'),
      point: makeAudio('assets/sound/point.mp3'),
      hit: makeAudio('assets/sound/flappy-bird-hit-sound.mp3'),
      die: makeAudio('assets/sound/die.mp3'),
      swoosh: makeAudio('assets/sound/swoosh.mp3'),
      blast: makeAudio('assets/sound/blast.mp3'),
    };

    this.sounds.flap.volume = 0.4;
    this.sounds.point.volume = 0.5;
    this.sounds.hit.volume = 0.5;
    this.sounds.die.volume = 0.5;
    this.sounds.swoosh.volume = 0.4;
    this.sounds.blast.volume = 0.6;

    this.music = makeAudio('assets/sound/MainTheme.mp3');
    this.music.loop = true;
    this.music.volume = 0.3;

    this.spriteSheet = new Image();
    this.spriteSheet.onload = () => {
      this.spriteLoaded = true;
    };
    this.spriteSheet.onerror = () => {
      console.error("Failed to load sprite sheet");
    };
    this.spriteSheet.src = "assets/images/flappybirdassets.png";

    this.backgroundSprite = {
      x: 0,
      y: 0,
      width: 144,
      height: 256,
    };

    this.bgX = 0;
    this.bgSpeed = 0.3;

    this.bird = new Bird(this.canvas);
    this.pipeManager = new PipeManager(this.canvas);

    this.gameState = "start";
    this.showSettings = false;
    this.isPaused = false;
    this.firstInputReceived = false;
    this.score = 0;
    this.highScore = getHighScore();

    this.gameOverTimeoutId = null;

    this.playerCoins = this.loadPlayerCoins();
    this.ownedItems = this.loadOwnedItems();

    this.shopPrices = {
      shield: 20,
      power: 15,
      antibomb: 10
    };

    this.screenShake = {
      intensity: 0,
      duration: 0,
      startTime: 0
    };

    this.groundY = this.canvas.height - 80;
    this.groundX = 0;

    this.resizeCanvas();

    this.bindEvents();

    coinSystem.init("coinDisplay");

    this.numberSprites = [
      { x: 288, y: 100, w: 7, h: 10 },
      { x: 291, y: 118, w: 5, h: 10 },
      { x: 289, y: 134, w: 7, h: 10 },
      { x: 289, y: 150, w: 7, h: 10 },
      { x: 287, y: 173, w: 7, h: 10 },
      { x: 287, y: 185, w: 7, h: 10 },
      { x: 165, y: 245, w: 7, h: 10 },
      { x: 175, y: 245, w: 7, h: 10 },
      { x: 185, y: 245, w: 7, h: 10 },
      { x: 195, y: 245, w: 7, h: 10 }
    ];

    this.inGameScoreElement = document.getElementById("inGameScore");
    coinSystem.reset();

    shieldSystem.init(this.bird, this.canvas);
    rocketSystem.init(this.bird, this.canvas);
    gravitySystem.init(this.canvas);
    gravitySystem.setGroundY(this.groundY);
    powerUpSystem.init(this.bird, this.canvas);
    portalSystem.init(this.bird, this.canvas);
    spaceWorldSystem.init(this.bird, this.canvas, (amount) => this.addCoins(amount));

    this.lastTime = null;
    this.simulatedTime = 0;
    this.accumulator = 0;

    this.spaceKeyHeld = false;
    this.lastInputTime = 0;

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  bindEvents() {
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        if (e.repeat || this.spaceKeyHeld) return;
        this.spaceKeyHeld = true;
        e.preventDefault();
        this.handleInput();
      } else if (e.code === "KeyR") {
        if (e.repeat) return;
        e.preventDefault();
        this.activateAntiGravityFromKey();
      } else if (e.code === "KeyE") {
        if (e.repeat) return;
        e.preventDefault();
        this.activateShieldFromKey();
      } else if (e.code === "KeyQ") {
        if (e.repeat) return;
        e.preventDefault();
        this.activatePowerUpFromKey();
      } else if (e.code === "KeyP" || e.code === "Escape") {
        e.preventDefault();
        this.togglePause();
      }
    });

    document.addEventListener("keyup", (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        this.spaceKeyHeld = false;
      }
    });

    this.canvas.addEventListener("click", () => this.handleInput());

    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.handleInput();
    }, { passive: false });

    const container = document.querySelector('.game-container');
    if (container) {
      const shouldIgnoreTarget = (target) => {
        if (!(target instanceof Element)) return false;

        const shopScreen = document.getElementById('shopScreen');
        if (shopScreen && !shopScreen.classList.contains('hidden')) return true;

        return !!target.closest(
          '#startBtn, #shopBtn, #restartBtn, #closeShopBtn, #toggleBtn, #powerBtn, #shieldBtn, #gravityBtn, .shop-item-card, .shop-item'
        );
      };

      container.addEventListener(
        'pointerdown',
        (e) => {
          if (e.pointerType === 'mouse' && typeof e.button === 'number' && e.button !== 0) {
            return;
          }

          if (shouldIgnoreTarget(e.target)) return;
          e.preventDefault();
          this.handleInput();
        },
        { capture: true, passive: false },
      );

      container.addEventListener(
        'touchstart',
        (e) => {
          if (shouldIgnoreTarget(e.target)) return;
          e.preventDefault();
          this.handleInput();
        },
        { capture: true, passive: false },
      );
    }

    window.addEventListener("resize", () => this.resizeCanvas());
    window.addEventListener("orientationchange", () => {
      setTimeout(() => this.resizeCanvas(), 100);
    });

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", () => this.resizeCanvas());
    }

    document.body.addEventListener("touchmove", (e) => {
      if (e.target.closest('.game-container')) {
        e.preventDefault();
      }
    }, { passive: false });


    const startBtn = document.getElementById("startBtn");
    if (startBtn) {
      startBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.handleInput();
      });
      startBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleInput();
      }, { passive: false });
    }

    const shopBtn = document.getElementById("shopBtn");
    if (shopBtn) {
      shopBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.openShop();
      });
      shopBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openShop();
      }, { passive: false });
    }

    const closeShopBtn = document.getElementById("closeShopBtn");
    if (closeShopBtn) {
      closeShopBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.closeShop();
      });
      closeShopBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.closeShop();
      }, { passive: false });
    }

    const powerBtn = document.getElementById("powerBtn");
    if(powerBtn) {
      powerBtn.addEventListener("click",(e)=> {
        e.stopPropagation();
        this.activatePowerUpFromKey();
      });
      powerBtn.addEventListener("touchstart",(e)=> {
        e.preventDefault();
        e.stopPropagation();
        this.activatePowerUpFromKey();
      },{passive:false});
    }
    const shieldBtn=document.getElementById("shieldBtn");
    if(shieldBtn) {
      shieldBtn.addEventListener("click",(e) => {
        e.stopPropagation()
        this.activateShieldFromKey();
      } , {passive:false});
    }
    const gravityBtn=document.getElementById("gravityBtn");
    if(gravityBtn) {
      gravityBtn.addEventListener("click",(e)=> {
        e.stopPropagation()
        this.activateAntiGravityFromKey();
      });
      gravityBtn.addEventListener("toucjstart",(e) => {
        e.preventDefault();
        e.stopPropagation();
        this.activateAntiGravityFromKey();
      },{passive:false});
    }

    this.setupShopItems();
     document.addEventListener(
      "pointerdown",
      (e) => {
        const target = e.target;
        const toggleBtn = target instanceof Element ? target.closest("#toggleBtn"):null;
        if(!toggleBtn) return;
        e.preventDefault();
        e.stopPropagation();
        this.togglePause();
      },
      {capture:true},
     )   
 
  }

  handleInput() {
    const now = performance.now();
    if (now - this.lastInputTime < 80) return;
    this.lastInputTime = now;

    if (this.showSettings) {
      this.showSettings = false;
      return;
    }

    if (this.gameState === "gameOver" || this.gameState === "dying" || this.gameState === "blasting") {
      return;
    }

    if (this.isPaused) {
      return;
    }

    if (this.gameState === "start") {
      this.startGame();
    } else if (this.gameState === "ready") {
      this.beginPlay();
    } else if (this.gameState === "playing") {
      if (portalSystem.isSuckingIn && portalSystem.isSuckingIn()) {
        return;
      }
      this.firstInputReceived = true;

      if (portalSystem.isAutopilotActive && portalSystem.isAutopilotActive()) {
        portalSystem.breakAutopilot();
      }

      if (!spaceWorldSystem.isActive) {
        this.bird.flap();
        this.playSound('flap');
      }
    }
  }

  activatePowerUpFromKey() {
    if (this.gameState !== "playing" || this.isPaused || !this.firstInputReceived) {
      return;
    }

    if ((this.ownedItems.power || 0) <= 0 || powerUpSystem.isInvincible()) {
      this.syncPowerButtons();
      return;
    }

    const activated = powerUpSystem.activate(this.simulatedTime || performance.now());
    if (!activated) return;

    this.ownedItems.power--;
    this.saveOwnedItems();
    this.updatePowerQuantities();
    this.syncPowerButtons();

    this.pipeManager.updateSpeed(powerUpSystem.getPipeSpeed());
    this.playSound('swoosh');
  }

  activateShieldFromKey() {
    if (this.gameState !== "playing" || this.isPaused || !this.firstInputReceived) {
      return;
    }

    if ((this.ownedItems.shield || 0) <= 0 && !shieldSystem.isProtecting()) {
      this.syncPowerButtons();
      return;
    }

    const activated = shieldSystem.activate();
    if (!activated) {
      this.syncPowerButtons();
      return;
    }

    this.ownedItems.shield--;
    this.saveOwnedItems();
    this.updatePowerQuantities();

    this.syncPowerButtons();
    this.playSound('swoosh');
  }

  activateAntiGravityFromKey() {
    if (this.gameState !== "playing" || this.isPaused || !this.firstInputReceived) {
      return;
    }

    if ((this.ownedItems.antibomb || 0) <= 0 || !gravitySystem.isReady()) {
      this.syncPowerButtons();
      return;
    }

    const activated = gravitySystem.activate();
    if (!activated) {
      this.syncPowerButtons();
      return;
    }

    this.ownedItems.antibomb--;
    this.saveOwnedItems();
    this.updatePowerQuantities();

    this.syncPowerButtons();
    this.playSound('swoosh');
  }

  toggleSettings() {
    this.showSettings = !this.showSettings;
  }

  playSound(name) {
    const sound = this.sounds[name];
    if (!sound) return;
    try {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    } catch (e) {}
  }

  loadPlayerCoins() {
    const saved = localStorage.getItem('flappybird_coins');
    return saved ? parseInt(saved, 10) : 0;
  }

  savePlayerCoins() {
    if (this.coinSaveTimeout) {
      clearTimeout(this.coinSaveTimeout);
    }

    this.coinSaveTimeout = setTimeout(() => {
      localStorage.setItem('flappybird_coins', this.playerCoins.toString());
    }, 500);
  }

  forceSaveCoins() {
    if (this.coinSaveTimeout) {
      clearTimeout(this.coinSaveTimeout);
    }
    localStorage.setItem('flappybird_coins', this.playerCoins.toString());
  }

  loadOwnedItems() {
    const saved = localStorage.getItem('flappybird_owned');
    if (saved) {
      const parsed = JSON.parse(saved);
      for (const key in parsed) {
        if (parsed[key] === true) parsed[key] = 1;
      }
      return parsed;
    }
    return { shield: 0, power: 0, antibomb: 0 };
  }

  saveOwnedItems() {
    localStorage.setItem('flappybird_owned', JSON.stringify(this.ownedItems));
  }

  updatePowerQuantities(){
    const powerQty = document.getElementById("powerQty");
    const shieldQty = document.getElementById("shieldQty");
    const gravityQty = document.getElementById("gravityQty");
    const powerCount = this.ownedItems.power ||0;
    const shieldCount=this.ownedItems.shield||0;
    const gravityCount=this.ownedItems.antibomb||0;
    if(powerQty){
     powerQty.textContent = powerCount;
    powerQty.classList.toggle("hidden", powerCount <= 0);
    }
    if(shieldQty) {
      shieldQty.textContent=shieldCount;
      shieldQty.classList.toggle("hidden",shieldCount<=0);
    }
    if(gravityQty){
      gravityQty.textContent = gravityCount;
      gravityQty.classList.toggle("hidden",gravityCount <=0);
    }
  }

  updateInGameCoins(){
    const coinsElement = document.getElementById("inGameCoinsAmount");
    if(coinsElement) {
      coinsElement.textContent = this.playerCoins;
    }
  }

  updateShieldButton(){
    const shieldBtn = document.getElementById("shieldBtn");
    if(!shieldBtn) return;
    const qty=this.ownedItems.shield||0;
    if(qty <=0 &&!shieldSystem.isProtecting()) {
      shieldBtn.classList.remove("shield-used","shield-ready","shield-cooldown");
      shieldBtn.classList.add("power-disabled");
      return;
    }
    shieldBtn.classList.remove("power-disabled");
    if(shieldSystem.isReady()) {
      shieldBtn.classList.remove("shield-used","shield-cooldown");
      shieldBtn.classList.add("shield-ready");
    } else if(shieldSystem.isProtecting()) {
      shieldBtn.classList.remove("shield-ready","shield-cooldown");
      shieldBtn.classList.add("shield-used");
    } else {
      shieldBtn.classList.remove("shield-ready","shield-used");
      shieldBtn.classList.add("shield-cooldown");
    }
  }

  updatePowerButton() {
    const powerBtn = document.getElementById("powerBtn");
    if (!powerBtn) return;
    const qty = this.ownedItems.power || 0;

    powerBtn.classList.remove("power-used", "power-disabled");

    if (powerUpSystem.isInvincible()) {
      powerBtn.classList.add("power-used");
      return;
    }

    if (qty <= 0) {
      powerBtn.classList.add("power-disabled");
    }
  }

  updateGravityButton() {
    const gravityBtn = document.getElementById("gravityBtn");
    if (!gravityBtn) return;
    const qty = this.ownedItems.antibomb || 0;

    gravityBtn.classList.remove("gravity-used", "power-disabled");

    if (gravitySystem.isActive || !gravitySystem.isReady()) {
      gravityBtn.classList.add("gravity-used");
      return;
    }

    if (qty <= 0) {
      gravityBtn.classList.add("power-disabled");
    }
  }

  syncPowerButtons() {
    this.updatePowerButton();
    this.updateShieldButton();
    this.updateGravityButton();
  }

  addCoins(amount) {
    this.playerCoins += amount;
    this.savePlayerCoins();
    this.updateInGameCoins();
  }

  openShop() {
    const shopScreen = document.getElementById("shopScreen");
    if (shopScreen) {
      shopScreen.classList.remove("hidden");
      this.updateShopDisplay();
    }
  }

  updateShopDisplay() {
    const coinsAmount = document.getElementById("shopCoinsAmount");
    if (coinsAmount) {
      coinsAmount.textContent = this.playerCoins;
    }

    const shopItems = document.querySelectorAll('.shop-item[data-item]');
    shopItems.forEach(item => {
      const itemName = item.getAttribute('data-item');
      const qty = this.ownedItems[itemName] || 0;

      const card = item.closest('.shop-item-card');
      if (!card) return;
      let badge = card.querySelector('.qty-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'qty-badge';
        card.appendChild(badge);
      }
      badge.textContent = qty;
      badge.style.display = qty > 0 ? '' : 'none';
    });
  }

  closeShop() {
    const shopScreen = document.getElementById("shopScreen");
    if (shopScreen) {
      shopScreen.classList.add("hidden");
    }

    const message = document.getElementById("shopMessage");
    if (message) message.classList.add("hidden");
  }

  purchaseItem(itemName, price) {
    if (this.playerCoins < price) {
      this.showShopMessage("Not enough coins!", "error");
      return false;
    }

    this.playerCoins -= price;
    if (!this.ownedItems[itemName]) this.ownedItems[itemName] = 0;
    this.ownedItems[itemName]++;
    this.playSound('swoosh');
    this.savePlayerCoins();
    this.saveOwnedItems();
    this.updateShopDisplay();
    this.updatePowerQuantities();
    this.syncPowerButtons();
    this.showShopMessage("Purchased! (x" + this.ownedItems[itemName] + ")", "success");
    return true;
  }

  showShopMessage(text, type) {
    const message = document.getElementById("shopMessage");
    if (message) {
      message.textContent = text;
      message.className = "shop-message " + type;

      message.style.animation = 'none';
      message.offsetHeight;
      message.style.animation = null;

      setTimeout(() => {
        message.classList.add("hidden");
      }, 2000);
    }
  }

  setupShopItems() {
    const shopCards = document.querySelectorAll('.shop-item-card');
    shopCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const item = card.querySelector('.shop-item[data-item]');
        if (!item) return;
        const itemName = item.getAttribute('data-item');
        const price = parseInt(item.getAttribute('data-price'), 10);
        this.purchaseItem(itemName, price);
      });
    });
  }


  resizeCanvas() {
    const container = document.querySelector('.game-container');
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    const BASE_W = 400;
    const BASE_H = 600;
    const gameAspect = BASE_W / BASE_H;
    let displayWidth, displayHeight;

    if (vw <= 480) {
      displayWidth = vw;
      displayHeight = vh;

      const displayAspect = displayWidth / displayHeight;
      const newInternalH = Math.round(BASE_W / displayAspect);

      if (this.canvas.width !== BASE_W || this.canvas.height !== newInternalH) {
        this.canvas.width = BASE_W;
        this.canvas.height = newInternalH;

        this.groundY = this.canvas.height - 80;

        if (typeof gravitySystem !== 'undefined' && gravitySystem && gravitySystem.setGroundY) {
          gravitySystem.setGroundY(this.groundY);
        }

        if (this.pipeManager && this.pipeManager.setGroundY) {
          this.pipeManager.setGroundY(this.groundY);
        }
      }

      if (this.bird) {
        const birdYFactor = 0.35;

        this.bird.baseY = this.canvas.height * birdYFactor;
        this.bird.x = this.canvas.width / 2 - this.bird.width / 2;
        if (this.gameState === 'start') {
          this.bird.y = this.canvas.height * birdYFactor;
        }
      }

      if (container) {
        container.style.width = '';
        container.style.height = '';
      }
      this.canvas.style.width = '';
      this.canvas.style.height = '';
    } else {
      displayHeight = vh;
      displayWidth = displayHeight * gameAspect;
      if (displayWidth > vw) {
        displayWidth = vw;
        displayHeight = displayWidth / gameAspect;
      }

      if (this.canvas.width !== BASE_W || this.canvas.height !== BASE_H) {
        this.canvas.width = BASE_W;
        this.canvas.height = BASE_H;
        this.groundY = this.canvas.height - 80;
        if (this.bird) {
          this.bird.baseY = this.canvas.height / 3.2;
          this.bird.x = this.canvas.width / 2 - this.bird.width / 2;
        }
        if (typeof gravitySystem !== 'undefined' && gravitySystem && gravitySystem.setGroundY) {
          gravitySystem.setGroundY(this.groundY);
        }

        if (this.pipeManager && this.pipeManager.setGroundY) {
          this.pipeManager.setGroundY(this.groundY);
        }
      }

      if (container) {
        container.style.width = displayWidth + 'px';
        container.style.height = displayHeight + 'px';
      }
      this.canvas.style.width = displayWidth + 'px';
      this.canvas.style.height = displayHeight + 'px';
    }

    this.ctx.imageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;
  }


  startGame() {
    this.clearGameOverTimeout();
    this.gameState = "ready";
    this.firstInputReceived = false;
    this.pipeManager.reset();
    this.playSound('swoosh');

    this.resizeCanvas();

    const startScreen = document.getElementById("startScreen");
    if (startScreen) startScreen.classList.add("hidden");

    const getReadyScreen = document.getElementById("getReadyScreen");
    if (getReadyScreen) getReadyScreen.classList.remove("hidden");
  }

  beginPlay() {
    this.clearGameOverTimeout();
    this.gameState = "playing";
    this.firstInputReceived = true;
    this.isPaused = false;

    this.music.currentTime = 0;
    this.music.play().catch(() => {});

    const getReadyScreen = document.getElementById("getReadyScreen");
    if (getReadyScreen) getReadyScreen.classList.add("hidden");

   const gameControls = document.getElementById("gameControls");
   if(gameControls) gameControls.classList.remove("hidden");
   const powersContainer = document.getElementById("powersContainer");
   if(powersContainer) powersContainer.classList.remove("hidden");
   this.updatePowerQuantities();
    if (this.inGameScoreElement) {
      this.inGameScoreElement.classList.remove("hidden");
      this.updateInGameScore();
    }

   const inGameCoins = document.getElementById("inGameCoins");
   if(inGameCoins) {
    inGameCoins.classList.remove("hidden");
    this.updateInGameCoins();
   }
  this.updatePowerQuantities();
  this.syncPowerButtons();
  this.syncToggleButton();

    this.bird.flap();
    this.playSound('flap');
  }

  syncToggleButton() {
    const toggleBtn = document.getElementById("toggleBtn");
    if(!toggleBtn) return;
    toggleBtn.classList.toggle("play-button-sprite",this.isPaused);
    toggleBtn.classList.toggle("pass-sprite",!this.isPaused);
    toggleBtn.title=this.isPaused?"Resume Game" : "Pause Game";
  }

  togglePause() {
    if (this.gameState !== "playing") return;
    this.isPaused = !this.isPaused;
    if(this.isPaused) {
      this.music.pause();
    } else {
      this.music.play().catch(() => {});
    }
    this.syncToggleButton();
  }

  gameOver() {
    if (this.gameState !== "dying" && this.gameState !== "blasting") {
      this.gameState = "dying";
      this.bird.die();
      this.isPaused = false;
      this.playSound('hit');
      this.music.pause();

      setTimeout(() => this.playSound('die'), 300);

      this.screenShake = {
        intensity: 8,
        duration: 300,
        startTime: Date.now()
      };

      const gameControls = document.getElementById("gameControls");
      if (gameControls) gameControls.classList.add("hidden");

      const powersContainer = document.getElementById("powersContainer");
      if (powersContainer) powersContainer.classList.add("hidden");

      this.syncToggleButton();

      powerUpSystem.deactivate();
      this.pipeManager.updateSpeed(1.5);
    }
  }

  gameOverByRocket() {
    if (this.gameState !== "dying" && this.gameState !== "blasting") {
      this.gameState = "blasting";
      this.bird.dieByRocket();
      this.isPaused = false;
      this.playSound('blast');
      this.music.pause();

      setTimeout(() => this.playSound('die'), 400);

      this.screenShake = {
        intensity: 15,
        duration: 400,
        startTime: Date.now()
      };

      const gameControls = document.getElementById("gameControls");
      if (gameControls) gameControls.classList.add("hidden");

      const powersContainer = document.getElementById("powersContainer");
      if (powersContainer) powersContainer.classList.add("hidden");

      this.syncToggleButton();

      powerUpSystem.deactivate();
      this.pipeManager.updateSpeed(1.5);
    }
  }

  showGameOverScreen() {
    this.gameState = "gameOver";

    const gameOverScreen = document.getElementById("gameOverScreen");
    if (gameOverScreen) gameOverScreen.classList.remove("hidden");

    this.forceSaveCoins();

    if (this.score > this.highScore) {
      this.highScore = this.score;
      saveHighScore(this.score);
    }

    if (this.inGameScoreElement) {
      this.inGameScoreElement.classList.add("hidden");
    }

    // Auto-restart after a short delay
    this.gameOverTimeoutId = setTimeout(() => this.returnToHome(), 2000);
  }

  generateSpriteNumberHTML(num) {
    const digits = String(num).split('');
    return digits.map(d => {
      const digit = parseInt(d, 10);
      return '<span class="num-digit num-' + digit + '"></span>';
    }).join('');
  }

  updateSpriteScore(elementId, score) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = this.generateSpriteNumberHTML(score);
    }
  }

  updateInGameScore() {
    if (this.inGameScoreElement) {
      this.inGameScoreElement.innerHTML = this.generateSpriteNumberHTML(this.score);
    }
  }

  clearGameOverTimeout() {
    if (this.gameOverTimeoutId != null) {
      clearTimeout(this.gameOverTimeoutId);
      this.gameOverTimeoutId = null;
    }
  }

  returnToHome() {
    this.clearGameOverTimeout();

    this.score = 0;
    this.firstInputReceived = false;
    this.isPaused = false;
    this.bird.reset();
    this.pipeManager.reset();
    this.bgX = 0;
    this.groundX = 0;

    this.screenShake = { intensity: 0, duration: 0, startTime: 0 };

    coinSystem.reset();
    powerUpSystem.reset();
    this.pipeManager.updateSpeed(1.5);
    shieldSystem.reset();
    rocketSystem.reset();
    gravitySystem.reset();
    portalSystem.reset();
    spaceWorldSystem.reset();

    this.updatePowerQuantities();
    this.syncPowerButtons();

    this.gameState = "start";

    this.resizeCanvas();

    if (this.inGameScoreElement) {
      this.inGameScoreElement.classList.add("hidden");
    }
    
    const inGameCoins = document.getElementById("inGameCoins");
    if(inGameCoins) inGameCoins.classList.add("hidden");
    const gameControls = document.getElementById("gameControls");
    if(gameControls) gameControls.classList.add("hidden");
    const powersContainer = document.getElementById("powersContainer");
    if(powersContainer) powersContainer.classList.add("hidden");
    this.syncToggleButton();


    const getReadyScreen = document.getElementById("getReadyScreen");
    if (getReadyScreen) getReadyScreen.classList.add("hidden");

    const gameOverScreen = document.getElementById("gameOverScreen");
    if (gameOverScreen) gameOverScreen.classList.add("hidden");

    const startScreen = document.getElementById("startScreen");
    if (startScreen) startScreen.classList.remove("hidden");

    this.updateStartScreenCoins();
  }

  updateStartScreenCoins() {
    // no-op: coins removed from start screen
  }

  update(currentTime) {
    if (this.gameState === "playing" && !this.isPaused) {
      this.bgX -= this.bgSpeed;
      if (this.bgX <= -this.backgroundSprite.width) {
        this.bgX = 0;
      }
    }

    if (this.gameState === "start" || this.gameState === "ready") {
      this.bird.updateAutoFly(currentTime);
    } else if (this.gameState === "playing" && !this.isPaused) {
      if (!this.firstInputReceived) {
        this.bird.updateAutoFly(currentTime);
      } else {
        if (portalSystem.isInNewWorld() && spaceWorldSystem.isActive) {
          this.bird.updateAnimation(currentTime);
          spaceWorldSystem.update(currentTime);
        } else if (portalSystem.isAutopilotActive && portalSystem.isAutopilotActive()) {
          this.bird.updateAnimation(currentTime);
        } else {
          this.bird.update(currentTime, true);

          if (portalSystem.isInNewWorld() && !spaceWorldSystem.isActive) {
            spaceWorldSystem.activate();
          }
        }

        if (!portalSystem.isInNewWorld() && spaceWorldSystem.isActive) {
          spaceWorldSystem.deactivate();
        }
      }

      if (this.firstInputReceived && portalSystem.shouldSpawnPipes()) {
        this.pipeManager.update(currentTime);
      }

      if (this.firstInputReceived) {
        powerUpSystem.update(currentTime);
        shieldSystem.update();
        this.pipeManager.updateSpeed(powerUpSystem.getPipeSpeed());

        if (portalSystem.shouldSpawnPipes()) {
          const isInvincible = powerUpSystem.isInvincible() || portalSystem.checkInvincibility();
          if (!isInvincible) {
            if (this.pipeManager.checkCollision(this.bird)) {
              if (shieldSystem.isProtecting()) {
                const pipeHitInfo = this.pipeManager.destroyCollidingPipe(this.bird);
                if (pipeHitInfo && shieldSystem.onPipeHit()) {
                  shieldSystem.spawnPipeBreakParticles(pipeHitInfo);
                  this.playSound('swoosh');
                } else {
                  this.gameOver();
                  return;
                }
              } else {
                this.gameOver();
                return;
              }
            }
          }

          if (this.pipeManager.checkScore(this.bird)) {
            this.score += portalSystem.getScoreMultiplier();
            this.updateInGameScore();
            this.playSound('point');
            this.addCoins(3 * portalSystem.getScoreMultiplier());
          }
        }

        const isBeingSuckedIn = portalSystem.isSuckingIn && portalSystem.isSuckingIn();
        const isPortalTransitioning = portalSystem.isTransitioning && portalSystem.isTransitioning();
        const isGroundInvincible = powerUpSystem.isInvincible() || portalSystem.checkInvincibility();
        if (!isGroundInvincible && !isBeingSuckedIn && !isPortalTransitioning) {
          if (this.bird.isOutOfBounds(this.groundY)) {
            this.gameOver();
            return;
          }
        }

        if (portalSystem.canTrigger(this.score)) {
          portalSystem.trigger();
          this.pipeManager.reset();
        }
        portalSystem.update();

        if (portalSystem.updateAutopilot) {
          portalSystem.updateAutopilot();
        }

        if (portalSystem.needsScreenShake) {
          this.screenShake = {
            intensity: portalSystem.screenShakeIntensity,
            duration: portalSystem.screenShakeDuration,
            startTime: Date.now()
          };
          portalSystem.needsScreenShake = false;
        }

        if (portalSystem.needsClearPipes) {
          this.pipeManager.reset();
          portalSystem.needsClearPipes = false;
        }

        rocketSystem.update(this.score);
        gravitySystem.update();
        this.syncPowerButtons();

        const isBeingSuckedInRocket = portalSystem.isSuckingIn && portalSystem.isSuckingIn();
        const isPortalTransitioningRocket = portalSystem.isTransitioning && portalSystem.isTransitioning();
        const isRocketInvincible = powerUpSystem.isInvincible() || portalSystem.checkInvincibility();
        if (!isRocketInvincible && !isBeingSuckedInRocket && !isPortalTransitioningRocket) {
          if (rocketSystem.checkCollision(this.bird)) {
            this.gameOverByRocket();
            return;
          }
        }
      }

      this.groundX -= 1.5;
      if (this.groundX <= -20) {
        this.groundX = 0;
      }
    }

    if (this.gameState === "blasting") {
      const blastComplete = this.bird.updateBlast();
      rocketSystem.updateExplosions();
      if (blastComplete) {
        this.gameState = "dying";
      }
    }

    if (this.gameState === "dying") {
      this.bird.updateDying(this.groundY);
      rocketSystem.updateExplosions();
      if (this.bird.hasFallenOut()) {
        this.showGameOverScreen();
      }
    }

    if (this.gameState === "gameOver") {
      rocketSystem.updateExplosions();
    }
  }

  drawBackground() {
    const ctx = this.ctx;

    ctx.fillStyle = "#70c5ce";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.spriteLoaded && this.spriteSheet) {
      const cropY = 60;
      const cropHeight = 150;

      const bgWidth = this.backgroundSprite.width;

      const scale = 2.7;
      const scaledWidth = bgWidth * scale;
      const scaledHeight = cropHeight * scale;

      const bgY = this.groundY - scaledHeight;

      const tilesNeeded = Math.ceil(this.canvas.width / scaledWidth) + 2;

      for (let i = 0; i < tilesNeeded; i++) {
        const xPos = this.bgX * scale + i * scaledWidth;

        ctx.drawImage(
          this.spriteSheet,
          this.backgroundSprite.x,
          this.backgroundSprite.y + cropY,
          this.backgroundSprite.width,
          cropHeight,
          xPos,
          bgY,
          scaledWidth,
          scaledHeight,
        );
      }
    }
  }

  drawGround() {
    const ctx = this.ctx;

    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;

    if (this.spriteLoaded && this.spriteSheet) {
      const groundSprite = {
        x: 146,
        y: 0,
        width: 154,
        height: 56,
      };

      const groundHeight = 80;
      const spriteWidth = groundSprite.width;
      const tilesNeeded = Math.ceil(this.canvas.width / spriteWidth) + 1;

      for (let i = 0; i < tilesNeeded; i++) {
        const xPos = Math.round(this.groundX + i * spriteWidth);

        ctx.drawImage(
          this.spriteSheet,
          groundSprite.x,
          groundSprite.y,
          groundSprite.width,
          groundSprite.height,
          xPos,
          Math.round(this.groundY),
          Math.round(spriteWidth),
          groundHeight,
        );
      }
    } else {
      ctx.fillStyle = "#DEB887";
      ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);

      ctx.fillStyle = "#8B4513";
      ctx.fillRect(0, this.groundY, this.canvas.width, 15);

      ctx.fillStyle = "#D2691E";
      for (let i = this.groundX; i < this.canvas.width + 20; i += 20) {
        ctx.fillRect(i, this.groundY + 15, 10, this.canvas.height - this.groundY - 15);
      }
    }
  }

  draw() {
    const ctx = this.ctx;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    let shakeX = 0, shakeY = 0;
    if (this.screenShake.intensity > 0) {
      const elapsed = Date.now() - this.screenShake.startTime;
      if (elapsed < this.screenShake.duration) {
        const progress = 1 - (elapsed / this.screenShake.duration);
        const currentIntensity = this.screenShake.intensity * progress;
        shakeX = (Math.random() - 0.5) * currentIntensity * 2;
        shakeY = (Math.random() - 0.5) * currentIntensity * 2;
      } else {
        this.screenShake.intensity = 0;
      }
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    if (portalSystem.isInNewWorld()) {
      portalSystem.drawNewWorldBackground(ctx);
    } else {
      this.drawBackground();
    }

    const shouldDrawPipes = this.gameState !== "start" && this.gameState !== "ready";
    if (shouldDrawPipes && portalSystem.shouldSpawnPipes()) {
      this.pipeManager.draw();
    }

    if (portalSystem.isInNewWorld()) {
      portalSystem.drawNewWorldGround(ctx, this.groundY);
    } else {
      this.drawGround();
    }

    this.bird.draw();

    if (this.gameState === "blasting" || this.bird.showBlast) {
      this.bird.drawBlast();
    }

    powerUpSystem.draw();
    shieldSystem.draw();
    rocketSystem.draw();
    gravitySystem.draw();
    portalSystem.draw();

    if (spaceWorldSystem.isActive) {
      spaceWorldSystem.draw(ctx);
    }

    ctx.restore();

    if (this.isPaused && this.gameState === "playing") {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.strokeStyle = "#000000";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.lineWidth = 3;

      ctx.font = "bold 36px Arial";
      ctx.strokeText("PAUSED", this.canvas.width / 2, this.canvas.height / 2 - 10);
      ctx.fillText("PAUSED", this.canvas.width / 2, this.canvas.height / 2 - 10);

      ctx.font = "bold 18px Arial";
      ctx.strokeText("Press Play to Resume", this.canvas.width / 2, this.canvas.height / 2 + 26);
      ctx.fillText("Press Play to Resume", this.canvas.width / 2, this.canvas.height / 2 + 26);
      ctx.restore();
    }

    if (this.bird.hitFlashAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = this.bird.hitFlashAlpha * 0.5;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.restore();
    }
  }

  gameLoop(currentTime) {
    if (this.lastTime === null) {
      this.lastTime = currentTime;
      this.simulatedTime = currentTime;
      this.accumulator = 0;
      requestAnimationFrame((t) => this.gameLoop(t));
      return;
    }

    if (this.isPaused && this.gameState === "playing") {
      this.lastTime = currentTime;
      this.accumulator = 0;
      this.draw();
      requestAnimationFrame((t) => this.gameLoop(t));
      return;
    }

    let deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (deltaTime > 200) deltaTime = 200;

    this.accumulator += deltaTime;

    const FIXED_STEP = 1000 / 60;

    while (this.accumulator >= FIXED_STEP) {
      this.simulatedTime += FIXED_STEP;
      this.update(this.simulatedTime);
      this.accumulator -= FIXED_STEP;
    }

    this.draw();

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

function getHighScore() {
  const score = localStorage.getItem("flappyBirdHighScore");
  return score ? parseInt(score, 10) : 0;
}

function saveHighScore(score) {
  localStorage.setItem("flappyBirdHighScore", score.toString());
}

function drawSettings(ctx, canvas) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Settings", canvas.width / 2, canvas.height / 2);
}

window.addEventListener("load", () => {
  new Game();
});