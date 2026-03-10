class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");

        this.canvas.width = 400;
        this.canvas.height = 600;
        this.groundHeight = 90;
        this.baseGroundY = this.canvas.height - this.groundHeight;

        this.bird = new Bird(this.canvas);
        this.pipeManager = new PipeManager(this.canvas);

        this.state = "ready";
        this.lastTime = 0;

        this.resizeCanvas();
        this.bindEvents();
        this.resetRound();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    bindEvents() {
        const trigger = () => this.handleInput();

        window.addEventListener("keydown", (event) => {
            if (event.code === "Space" || event.code === "ArrowUp") {
                event.preventDefault();
                trigger();
            }
        });

        this.canvas.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            trigger();
        });

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
        if (this.state === "ready") {
            this.state = "playing";
        }

        this.bird.flap();
    }

    restartGame() {
        this.resetRound();
        this.state = "ready";
    }

    resetRound() {
        this.bird.reset();
        this.pipeManager.reset();
        this.lastTime = 0;
    }

    handleInput() {
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

        this.pipeManager.update(currentTime);

        if (this.pipeManager.checkCollision(this.bird, this.baseGroundY)) {
            this.endGame();
        }
    }

    endGame() {
        this.state = "game-over";
    }

    drawBackground() {
        const ctx = this.ctx;
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
            ctx.fillStyle = "rgba(22, 50, 79, 0.82)";
            ctx.fillRect(36, 40, this.canvas.width - 72, 72);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 24px Segoe UI";
            ctx.textAlign = "center";
            ctx.fillText("Tap to Fly", this.canvas.width / 2, 70);
            ctx.font = "16px Segoe UI";
            ctx.fillText("Press Space or click", this.canvas.width / 2, 95);
        }

        if (this.state === "game-over") {
            ctx.fillStyle = "rgba(22, 50, 79, 0.85)";
            ctx.fillRect(55, 210, this.canvas.width - 110, 110);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 28px Segoe UI";
            ctx.textAlign = "center";
            ctx.fillText("Game Over", this.canvas.width / 2, 252);
            ctx.font = "16px Segoe UI";
            ctx.fillText("Tap to restart", this.canvas.width / 2, 285);
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