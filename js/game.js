class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.ctx.imageSmoothingEnabled = false;

        this.canvas.width = 400;
        this.canvas.height = 600;
        this.groundHeight = 80;
        this.baseGroundY = this.canvas.height - this.groundHeight;
        this.sceneSpriteLoaded = false;
        this.sceneSpriteSheet = new Image();
        this.sceneSpriteSheet.onload = () => {
            this.sceneSpriteLoaded = true;
        };
        this.sceneSpriteSheet.onerror = () => {
            this.sceneSpriteLoaded = false;
        };
        this.sceneSpriteSheet.src = "assets/images/flappybirdassets.png";
        this.sceneSprites = {
            background: {
                x: 0,
                y: 0,
                width: 144,
                height: 256,
                cropY: 60,
                cropHeight: 150,
            },
            ground: {
                x: 146,
                y: 0,
                width: 154,
                height: 56,
            },
        };
        this.bgX = 0;
        this.bgSpeed = 0.3;
        this.groundX = 0;
        this.groundSpeed = 1.5;

        this.bird = new Bird(this.canvas);
        this.pipeManager = new PipeManager(this.canvas);
        this.pipeManager.groundY = this.baseGroundY;

        this.startScreen = document.getElementById("startScreen");
        this.shopScreen = document.getElementById("shopScreen");
        this.gameOverScreen = document.getElementById("gameOverScreen");
        this.startBtn = document.getElementById("startBtn");
        this.shopBtn = document.getElementById("shopBtn");
        this.closeShopBtn = document.getElementById("closeShopBtn");
        this.restartBtn = document.getElementById("restartBtn");

        this.state = "start";
        this.lastTime = 0;

        this.resizeCanvas();
        this.bindEvents();
        this.resetRound();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    bindEvents() {
        const trigger = () => this.handleInput();

        window.addEventListener("keydown", (event) => {
            if (event.code === "Space" || event.code === "ArrowUp" || event.code === "Tab") {
                event.preventDefault();
                trigger();
            }
        });

        this.canvas.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            trigger();
        });

        if (this.startBtn) {
            this.startBtn.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.startFromMenu();
            });
        }

        if (this.shopBtn) {
            this.shopBtn.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.openShop();
            });
        }

        if (this.closeShopBtn) {
            this.closeShopBtn.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.closeShop();
            });
        }

        if (this.restartBtn) {
            this.restartBtn.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.restartGame();
            });
        }

        window.addEventListener("resize", () => this.resizeCanvas());
    }

    resizeCanvas() {
        const maxWidth = Math.min(window.innerWidth - 32, 420);
        const maxHeight = window.innerHeight - 32;
        const aspect = this.canvas.width / this.canvas.height;

        let displayWidth = maxWidth;
        let displayHeight = displayWidth / aspect;

        if (displayHeight > maxHeight) {
            displayHeight = maxHeight;
            displayWidth = displayHeight * aspect;
        }

        this.canvas.style.width = `${Math.max(displayWidth, 260)}px`;
        this.canvas.style.height = `${Math.max(displayHeight, 390)}px`;
    }

    startGame() {
        if (this.state === "start") {
            this.startFromMenu();
            return;
        }

        if (this.state === "ready") {
            this.state = "playing";
            this.hideOverlays();
        }

        this.bird.flap();
    }

    startFromMenu() {
        this.closeShop();
        this.hideGameOverScreen();
        this.hideStartScreen();
        this.state = "ready";
    }

    restartGame() {
        this.resetRound();
        this.state = "start";
        this.hideGameOverScreen();
        this.closeShop();
        this.showStartScreen();
    }

    resetRound() {
        this.bird.reset();
        this.pipeManager.reset();
        this.bgX = 0;
        this.groundX = 0;
        this.lastTime = 0;
    }

    handleInput() {
        if (!this.shopScreen.classList.contains("hidden")) {
            return;
        }

        if (this.state === "game-over") {
            this.restartGame();
            return;
        }

        this.startGame();
    }

    update(deltaTime, currentTime) {
        const running = this.state === "playing";

        this.bird.update(deltaTime, running);

        if (!running) {
            return;
        }

        this.bgX -= this.bgSpeed;
        this.groundX -= this.groundSpeed;

        this.pipeManager.update(currentTime);

        if (this.pipeManager.checkCollision(this.bird, this.baseGroundY)) {
            this.endGame();
        }
    }

    endGame() {
        this.state = "game-over";
        this.showGameOverScreen();
    }

    openShop() {
        if (this.shopScreen) {
            this.shopScreen.classList.remove("hidden");
        }
    }

    closeShop() {
        if (this.shopScreen) {
            this.shopScreen.classList.add("hidden");
        }
    }

    showStartScreen() {
        if (this.startScreen) {
            this.startScreen.classList.remove("hidden");
        }
    }

    hideStartScreen() {
        if (this.startScreen) {
            this.startScreen.classList.add("hidden");
        }
    }

    showGameOverScreen() {
        if (this.gameOverScreen) {
            this.gameOverScreen.classList.remove("hidden");
        }
    }

    hideGameOverScreen() {
        if (this.gameOverScreen) {
            this.gameOverScreen.classList.add("hidden");
        }
    }

    hideOverlays() {
        this.hideStartScreen();
        this.hideGameOverScreen();
        this.closeShop();
    }

    drawBackground() {
        const ctx = this.ctx;

        if (this.sceneSpriteLoaded) {
            const sprite = this.sceneSprites.background;
            const scaledWidth = sprite.width * 2.7;
            const scaledHeight = sprite.cropHeight * 2.7;
            const bgY = this.baseGroundY - scaledHeight;
            const tilesNeeded = Math.ceil(this.canvas.width / scaledWidth) + 2;

            if (this.bgX <= -scaledWidth) {
                this.bgX = 0;
            }

            ctx.imageSmoothingEnabled = false;
            ctx.fillStyle = "#70c5ce";
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            for (let index = 0; index < tilesNeeded; index += 1) {
                const xPos = this.bgX + index * scaledWidth;

                ctx.drawImage(
                    this.sceneSpriteSheet,
                    sprite.x,
                    sprite.y + sprite.cropY,
                    sprite.width,
                    sprite.cropHeight,
                    xPos,
                    bgY,
                    scaledWidth,
                    scaledHeight
                );
            }
            return;
        }

        const skyGradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        skyGradient.addColorStop(0, "#7ed7f7");
        skyGradient.addColorStop(0.7, "#d5f3ff");
        skyGradient.addColorStop(1, "#f8e8ac");

        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.beginPath();
        ctx.arc(80, 110, 28, 0, Math.PI * 2);
        ctx.arc(104, 100, 22, 0, Math.PI * 2);
        ctx.arc(128, 112, 26, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(270, 150, 24, 0, Math.PI * 2);
        ctx.arc(292, 140, 18, 0, Math.PI * 2);
        ctx.arc(314, 152, 22, 0, Math.PI * 2);
        ctx.fill();
    }

    drawGround() {
        const ctx = this.ctx;

        if (this.sceneSpriteLoaded) {
            const sprite = this.sceneSprites.ground;
            const tilesNeeded = Math.ceil(this.canvas.width / sprite.width) + 2;

            if (this.groundX <= -sprite.width) {
                this.groundX = 0;
            }

            ctx.imageSmoothingEnabled = false;

            for (let index = 0; index < tilesNeeded; index += 1) {
                const xPos = Math.round(this.groundX + index * sprite.width);

                ctx.drawImage(
                    this.sceneSpriteSheet,
                    sprite.x,
                    sprite.y,
                    sprite.width,
                    sprite.height,
                    xPos,
                    this.baseGroundY,
                    sprite.width,
                    this.groundHeight
                );
            }
            return;
        }

        ctx.fillStyle = "#ded895";
        ctx.fillRect(0, this.baseGroundY, this.canvas.width, this.groundHeight);

        ctx.fillStyle = "#b6d96c";
        ctx.fillRect(0, this.baseGroundY, this.canvas.width, 18);

        ctx.strokeStyle = "#9b8f48";
        ctx.lineWidth = 2;

        for (let x = 0; x < this.canvas.width; x += 24) {
            ctx.beginPath();
            ctx.moveTo(x, this.baseGroundY + 18);
            ctx.lineTo(x + 12, this.baseGroundY + this.groundHeight);
            ctx.stroke();
        }
    }

    drawHud() {
        const ctx = this.ctx;

        if (this.state === "ready") {
            ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
            ctx.fillRect(36, 40, this.canvas.width - 72, 72);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 24px Segoe UI";
            ctx.textAlign = "center";
            ctx.fillText("Tap to Fly", this.canvas.width / 2, 70);
            ctx.font = "16px Segoe UI";
            ctx.fillText("Press Tab, Space or click", this.canvas.width / 2, 95);
        }

    }

    draw() {
        this.drawBackground();
        this.pipeManager.draw(this.ctx, this.groundHeight);
        this.drawGround();
        this.bird.draw();
        this.drawHud();
    }

    gameLoop(currentTime) {
        const deltaTime = this.lastTime === 0 ? 16.67 : currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime, currentTime);
        this.draw();

        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

window.addEventListener("DOMContentLoaded", () => {
    new Game();
});