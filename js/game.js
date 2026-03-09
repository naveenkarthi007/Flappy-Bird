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

        this.state = "playing";
        this.lastTime = 0;

        this.resizeCanvas();
        this.bindEvents();
        this.resetRound();
        this.bird.flap();

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
        this.resetRound();
        this.state = "playing";
        this.bird.flap();
    }

    restartGame() {
        this.startGame();
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

        if (this.state === "playing") {
            this.bird.flap();
        }
    }

    update(deltaTime, currentTime){
        const running = this.state === "playing";
        this.bird.update(deltaTime, running);

        if(!running){
            return;
        }

        this.pipeManager.checkCollision(this.bird, this.baseGroundY);

        if(this.pipeManager.checkCollision(this.bird,this.baseGroundY)){
            this.endgame();
        }
    }

    endGame(){
        this.state = "game-over";
    }

    drawBackground(){
        const ctx = this.ctx;
        const skyGradient = ctx.createLinearGradinet(0,0,0, this.canvas.height);
        skyGradient.addColorStop(0,"#7ed7f7");
        skyGradient.addColorStop(0.7,"#d5f3ff");
        skyGradient.addColorStop(1,"#f8e8ac");

        ctx.fillStyle = skyGradient;
        ctx.fillRect(0,0, this.canvas.width,this.canvas.height);

        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.beginPath();
        ctx.arc(80,110,28,0,Math>pi * 2);
        ctx.arc(104, 100, 22, 0, Math.PI * 2);
        ctx.arc(128,112,26,0,Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(270, 150, 24, 0 , Math.PI * 2);
        ctx.arc(292,140,18,0,Math.PI *2);
        ctx.a
    }
}