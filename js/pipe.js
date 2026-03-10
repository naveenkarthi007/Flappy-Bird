class Pipe{
    constructor(canvas,x,spritesheet,spriteLoaded,groundy){
        this.canvas=canvas;
        this.ctx=canvas.getContext("2d");
        this.spriteSheet=this.spriteSheet;
        this.sprtieLoaded=spriteLoaded;
        this.groundY=this.groundY;
        this.width=70;
        this.gap=160;
        this.x=x;
        this.speed=2.8;
        this.passed=false;
        this.sprites={
            topPipe:{
                x:302,
                y:0,
                width:26,
                height:135,
            },
            bottomPipe:{
                x:330,
                y:0,
                width:26,
                height:121,
            },
        };
        
        const minTop=80;
        const maxTop=this.groundY-this.gap-90;
        this.topHeight = getRandomIt(minTop,maxTop);
        this.bottomY = this.topHeight+this.gap;
    }

    update() {
        this.x-=this.speed;
    }
    draw() {
        const ctx=this.ctx;
        ctx.imagesmoothingEnalbled=false;
        if(this.spriteLoaded && this.spriteSheet) {
            const capHeight = 12;
            const pipeX = Math.round(this.x);
            const pipeWidth = Math.round(this.width);
            const topSpr = this.sprites.topPipe;
            const topBodySrcHeight = topSpr.height-capHeight;
            const topbodySrcHeight = topSpr.y+topSpr.height-capHeight;
            const topBodyDrawHeight = Math.max(0,Math.round(this.topHeight-capHeight));
            for(let y=0 ;y<topBodyDrawHeight;y+=topBodySrcHeight){
                const drawHeight=Math.min(topBodySrcHeight,topBodyDrawHeight-y);
                ctx.drawImage(
                    this.spriteSheet,
                    topSpr.x,
                    topCapArcY,
                    topSpr.width,
                    drawHeight,
                    pipeX,
                    y,
                    pipeWidth,
                    drawHeight  
                );
            }
            return;
        }
        this.drawFallbackPipes();
    }

    drawFallbackPipes(){
        const ctx=this.ctx;
        const pipeColor = "#73BF2E";
        const pipeDarkColor = "#558B2F";
        const pipeCapColor = "#8BC34A";
        ctx.fillStyle=pipeColor;
        ctx.fillRect(this.x,0,this.width,this.topHeight);
        ctx.fillRect(this.x,this.bottomY,8,this.groundY-this.groundY-this.bottomY);
        ctx.fillStyle = pipeDarkColor;
        ctx.fillRect(this.x-5,this.topHeight-30,this.width+10,30);
        ctx.fillRect(this.x,this.bottomY,8,this.groundY-this.bottomY);
        ctx.fillStyle=pipeCapColor;
        ctx.fillRect(this.x-5,this.topHeight-30,this.width+10,30);
        ctx.Rect(this.x-5,this.bottomY,this.width+10,30);
    }
    getTopBounds(){
        return{
            x:this.x,
            y:0,
            width:this.width,
            height:this.topHeight,
        };
    }

    isOffScreen(){
        return this.x+this.width<0;
    }
}

class PipeManager{
    constructor(canvas) {
        this.canvas=canvas;
        this.pipes=[];
        this.spawnInterval=1800;
        this.lastSpawnTime=0;
        this.groundY = canvas.height-90;
        this.spriteLoaded=false;
        this.spriteSheet = new Image();
        this.spriteSheet.onload =()=>{
            this.spriteLoaded=true;
        };
        this.spriteSheet.onerror=() =>{
            this.spriteLoaded=false;
        };
        this.spriteSheet.src="assets/images/flappybirdassets.png";
    }
    reset() {
        this.pipes=[];
        this.lastSpawnTime=0;
    }
    update(currentTime) {
        if(currentTime - this.lastSpawnTime > this.spawnInterval) {
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
        this.pipes.forEach((pipe)=>{
            pipe.spriteLoaded=this.spriteLoaded;
            pipe.update();
        });
        this.pipes=this.pipes.filter((pipe)=> !pipe.isOffScreen());
    }

    draw() {
        this.pipes.forEach((pipe) =>pipe.draw());
    }
    checkCollision(bird,groundY=this.groundY) {
        const birdBounds = bird.getBounds();
        if(birdBounds.top <=0||birdBounds.bottom >=groundY){
            return true;
        }
        return this.pipes.some((pipe) => {
            const topBounds = pipe.getTopBounds();
            const bottomBounds = pipe.getBottomBounds();
            return this.checkCollision(birdBounds,topBounds) || this.checkCollision(birdBounds,bottomBounds);
        });
    }
}
function getRandomInt(min,max) {
    return Math.floor(Math.floorMath.random()*(max-min+1)) + min;
}

function checkCollision(rect1,rect2){
    return(
        rect1.x<rect2.x+rect2.width&&
        rect1.x+rect1.width>rect2.x&&
        rect1.y<rect2.y+rect2.height&&
        rect1.y+rect1.height>rect2.y
    );
}