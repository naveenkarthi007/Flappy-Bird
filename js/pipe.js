class PipeManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = 68;
        this.gap = 150;
        this.speed = 2.6;
        this.spawnInterval = 1450;
        this.minTopHeight = 70;
        this.reset();
    }

    reset() {
        this.pipes = [];
        this.lastSpawnTime = 0;
    }

    update(currentTime) {
        if (currentTime - this.lastSpawnTime >= this.spawnInterval) {
            this.spawnPipe();
            this.lastSpawnTime = currentTime;
        }

        for (const pipe of this.pipes) {
            pipe.x -= this.speed;
        }

        this.pipes = this.pipes.filter((pipe) => pipe.x + this.width > 0);
    }

    spawnPipe() {
        const maxTopHeight = this.canvas.height - 170 - this.gap;
        const topHeight = this.minTopHeight + Math.random() * (maxTopHeight - this.minTopHeight);

        this.pipes.push({
            x: this.canvas.width + 20,
            topHeight,
            bottomY: topHeight + this.gap
        });
    }

    draw(ctx, groundHeight) {
        const pipeBody = "#54b948";
        const pipeCap = "#3d8d35";

        for (const pipe of this.pipes) {
            const bottomHeight = this.canvas.height - groundHeight - pipe.bottomY;

            ctx.fillStyle = pipeBody;
            ctx.fillRect(pipe.x, 0, this.width, pipe.topHeight);
            ctx.fillRect(pipe.x, pipe.bottomY, this.width, bottomHeight);

            ctx.fillStyle = pipeCap;
            ctx.fillRect(pipe.x - 4, pipe.topHeight - 18, this.width + 8, 18);
            ctx.fillRect(pipe.x - 4, pipe.bottomY, this.width + 8, 18);
        }
    }

    checkCollision(bird, groundY) {
        const bounds = bird.getBounds();

        if (bounds.top <= 0 || bounds.bottom >= groundY) {
            return true;
        }

        return this.pipes.some((pipe) => {
            const overlapsX = bounds.right > pipe.x && bounds.left < pipe.x + this.width;
            const hitsTop = bounds.top < pipe.topHeight;
            const hitsBottom = bounds.bottom > pipe.bottomY;
            return overlapsX && (hitsTop || hitsBottom);
        });
    }

}