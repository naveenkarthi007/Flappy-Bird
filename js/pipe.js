class Pipe {
    constructor(canvas, x, spriteSheet, spriteLoaded, groundY) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.spriteSheet = spriteSheet;
        this.spriteLoaded = spriteLoaded;
        this.groundY = groundY;
        this.width = 70;
        this.gap = 160;
        this.x = x;
        this.speed = 3;
        this.sprites = {
            topPipe: {
                x: 302,
                y: 0,
                width: 26,
                height: 135,
            },
            bottomPipe: {
                x: 330,
                y: 0,
                width: 26,
                height: 121,
            },
        };

        const minTop = 80;
        const maxTop = this.groundY - this.gap - 90;
        this.topHeight = getRandomInt(minTop, maxTop);
        this.bottomY = this.topHeight + this.gap;

        this.passed = false;
        this.topDestroyed = false;
        this.bottomDestroyed = false;
    }

    update() {
        this.x -= this.speed;
    }

    draw() {
        const ctx = this.ctx;

        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;

        if (this.spriteLoaded && this.spriteSheet) {
            const capHeight = 12;

            if (!this.topDestroyed) {
                const topSpr = this.sprites.topPipe;
                const topBodySrcY = topSpr.y;
                const topBodySrcH = topSpr.height - capHeight;
                const topCapSrcY = topSpr.y + topSpr.height - capHeight;
                const pipeX = Math.round(this.x);
                const pipeWidth = Math.round(this.width);
                const topBodyDrawH = Math.round(this.topHeight - capHeight);

                if (topBodyDrawH > 0) {
                    for (let y = 0; y < topBodyDrawH; y += topBodySrcH) {
                        const height = Math.min(topBodySrcH, topBodyDrawH - y);
                        ctx.drawImage(
                            this.spriteSheet,
                            topSpr.x,
                            topBodySrcY,
                            topSpr.width,
                            height,
                            pipeX,
                            Math.round(y),
                            pipeWidth,
                            Math.round(height)
                        );
                    }
                }

                ctx.drawImage(
                    this.spriteSheet,
                    topSpr.x,
                    topCapSrcY,
                    topSpr.width,
                    capHeight,
                    Math.round(pipeX - 3),
                    Math.round(this.topHeight - capHeight),
                    Math.round(pipeWidth + 6),
                    capHeight
                );
            }

            if (!this.bottomDestroyed) {
                const bottomSpr = this.sprites.bottomPipe;
                const bottomCapSrcY = bottomSpr.y;
                const bottomBodySrcY = bottomSpr.y + capHeight;
                const bottomBodySrcH = bottomSpr.height - capHeight;
                const pipeX = Math.round(this.x);
                const pipeWidth = Math.round(this.width);
                const bottomY = Math.round(this.bottomY);

                ctx.drawImage(
                    this.spriteSheet,
                    bottomSpr.x,
                    bottomCapSrcY,
                    bottomSpr.width,
                    capHeight,
                    Math.round(pipeX - 3),
                    bottomY,
                    Math.round(pipeWidth + 6),
                    capHeight
                );

                const bottomBodyStartY = bottomY + capHeight;
                const bottomBodyDrawH = Math.round(this.groundY - bottomBodyStartY);

                if (bottomBodyDrawH > 0) {
                    for (let y = 0; y < bottomBodyDrawH; y += bottomBodySrcH) {
                        const height = Math.min(bottomBodySrcH, bottomBodyDrawH - y);
                        ctx.drawImage(
                            this.spriteSheet,
                            bottomSpr.x,
                            bottomBodySrcY,
                            bottomSpr.width,
                            height,
                            pipeX,
                            Math.round(bottomBodyStartY + y),
                            pipeWidth,
                            Math.round(height)
                        );
                    }
                }
            }
            return;
        }

        this.drawFallbackPipes();
    }

    drawFallbackPipes() {
        const ctx = this.ctx;
        const pipeColor = "#73BF2E";
        const pipeDarkColor = "#558B2F";
        const pipeCapColor = "#8BC34A";

        if (!this.topDestroyed) {
            ctx.fillStyle = pipeColor;
            ctx.fillRect(this.x, 0, this.width, this.topHeight);

            ctx.fillStyle = pipeDarkColor;
            ctx.fillRect(this.x, 0, 8, this.topHeight);

            ctx.fillStyle = pipeCapColor;
            ctx.fillRect(this.x - 5, this.topHeight - 30, this.width + 10, 30);
            ctx.fillStyle = pipeDarkColor;
            ctx.fillRect(this.x - 5, this.topHeight - 30, 8, 30);
        }

        if (!this.bottomDestroyed) {
            ctx.fillStyle = pipeColor;
            ctx.fillRect(this.x, this.bottomY, this.width, this.groundY - this.bottomY);

            ctx.fillStyle = pipeDarkColor;
            ctx.fillRect(this.x, this.bottomY, 8, this.groundY - this.bottomY);

            ctx.fillStyle = pipeCapColor;
            ctx.fillRect(this.x - 5, this.bottomY, this.width + 10, 30);
            ctx.fillStyle = pipeDarkColor;
            ctx.fillRect(this.x - 5, this.bottomY, 8, 30);
        }
    }

    getTopBounds() {
        if (this.topDestroyed) {
            return null;
        }

        return {
            x: this.x,
            y: 0,
            width: this.width,
            height: this.topHeight,
        };
    }

    getBottomBounds() {
        if (this.bottomDestroyed) {
            return null;
        }

        return {
            x: this.x,
            y: this.bottomY,
            width: this.width,
            height: this.groundY - this.bottomY,
        };
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }
}

class PipeManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.pipes = [];
        this.spawnInterval = 2200;
        this.lastSpawnTime = 0;
        this.groundY = canvas.height - 80;
        this.spriteLoaded = false;
        this.spriteSheet = new Image();
        this.spriteSheet.onload = () => {
            this.spriteLoaded = true;
        };
        this.spriteSheet.onerror = () => {
            this.spriteLoaded = false;
        };
        this.spriteSheet.src = "assets/images/flappybirdassets.png";
    }

    setGroundY(groundY) {
        this.groundY = groundY;
        this.pipes.forEach((pipe) => {
            pipe.groundY = groundY;
        });
    }

    reset() {
        this.pipes = [];
        this.lastSpawnTime = 0;
    }

    updateSpeed(speed) {
        this.pipes.forEach((pipe) => {
            pipe.speed = speed;
        });
    }

    update(currentTime) {
        if (currentTime - this.lastSpawnTime > this.spawnInterval) {
            this.pipes.push(
                new Pipe(
                    this.canvas,
                    this.canvas.width,
                    this.spriteSheet,
                    this.spriteLoaded,
                    this.groundY
                )
            );
            this.lastSpawnTime = currentTime;
        }

        this.pipes.forEach((pipe) => {
            pipe.spriteLoaded = this.spriteLoaded;
            pipe.groundY = this.groundY;
            pipe.update();
        });

        this.pipes = this.pipes.filter((pipe) => !pipe.isOffScreen());
    }

    draw() {
        this.pipes.forEach((pipe) => pipe.draw());
    }

    checkCollision(bird, groundY = this.groundY) {
        const birdBounds = bird.getBounds();

        if (birdBounds.top <= 0 || birdBounds.bottom >= groundY) {
            return true;
        }

        return this.pipes.some((pipe) => {
            const topBounds = pipe.getTopBounds();
            const bottomBounds = pipe.getBottomBounds();
            return (topBounds && checkCollision(birdBounds, topBounds)) ||
                (bottomBounds && checkCollision(birdBounds, bottomBounds));
        });
    }

    destroyCollidingPipe(bird) {
        const birdBounds = bird.getBounds();

        for (let index = 0; index < this.pipes.length; index += 1) {
            const pipe = this.pipes[index];
            const topBounds = pipe.getTopBounds();
            const bottomBounds = pipe.getBottomBounds();
            const hitTop = topBounds && checkCollision(birdBounds, topBounds);
            const hitBottom = bottomBounds && checkCollision(birdBounds, bottomBounds);

            if (hitTop || hitBottom) {
                const pipeInfo = {
                    x: pipe.x + pipe.width / 2,
                    topY: pipe.topHeight,
                    bottomY: pipe.bottomY,
                    width: pipe.width,
                    hitTop: Boolean(hitTop),
                    hitBottom: Boolean(hitBottom),
                };

                if (hitTop) {
                    pipe.topDestroyed = true;
                }

                if (hitBottom) {
                    pipe.bottomDestroyed = true;
                }

                return pipeInfo;
            }
        }

        return null;
    }

    checkScore(bird) {
        let scored = false;

        this.pipes.forEach((pipe) => {
            if (!pipe.passed && pipe.x + pipe.width < bird.x) {
                pipe.passed = true;
                scored = true;
            }
        });

        return scored;
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y;
}