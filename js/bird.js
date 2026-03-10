class Bird {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = 40;

    this.height = 30;
    this.x = canvas.width * 0.25;
    this.gravity = 0.45;
    this.jumpStrength = -8.2;
    this.spriteLoaded = false;
    this.spriteSheet = new Image();
    this.spriteSheet.onload = () => {
      this.spriteLoaded = true;
    };
    this.spriteSheet.onerror = () => {
      this.spriteLoaded = false;
    };
    this.spriteSheet.src = "assets/images/flappybirdassets.png";
    this.frames = [
      { x: 223, y: 124, width: 17, height: 12 },
      { x: 264, y: 90, width: 17, height: 12 },
      { x: 264, y: 64, width: 17, height: 12 },
    ];
    this.frameInterval = 120;
    this.lastFrameTime = 0;
    this.reset();
  }

  reset(){
    this.y = this.canvas.height*0.35;
    this.velocity=0;
    this.rotation=0;
    this.currentFrame=0;
    this.floatTime=0;
  }

  flap(){
    this.velocity=this.jumpStrength;
  }

  update(deltaTime,isRunning){
    if(!isRunning){
        this.floatTime += deltaTime *0.005;
        this.y = this.canvas.height * 0.35 + Math.sin(this.floatTime)*10;
        this.rotation=0;
        this.advanceFrame(performance.now());
        return;
    }
    this.velocity += this.gravity;
    this.y += this.velocity;
    this.rotation = Math.max(-0.5 , Math.min(1.2,this.velocity*0.08));
    this.advanceFrame(performance.now());
  }

  advanceFrame(currentTime) {
    if(currentTime-this.lastFrameTime >= this.frameInterval) {
        this.currentFrame = (this.currentFrame +1) % this.frames.length;
        this.lastFrameTime = currentTime;
    }
  }
  draw() {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.x+this.width/2,this.y+this.height/2);
    ctx.rotate(this.rotation);

    if(this.spriteLoaded) {
        const frame = this.frames[this.currentFrame];
        ctx.drawImage(
            this.spriteSheet,
            frame.x,
            frame.y,
            frame.width/2,
            frame.height,
            -this.width/2,
            -this.height/2,
            this.width,
            this.height
        );
    } else {
          this.drawFallbackBird(ctx);
    }
    ctx.restore();
  }


  drawFallbackBird(ctx) {
    ctx.fillStyle = "#f4d03f";
    ctx.beginPath();
    ctx.ellipse(0,0,this.width/2,this.height/2,0,0,Math.PI *2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(8,-6,7,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle="#111111";
    ctx.beginPath();
    ctx.arc(10,-6,3,0,Math.PI * 2);
    ctx.fill();
    ctx.fillStyle="#ff7f11";
    ctx.beginPath();
    ctx.moveTo(14,0);
    ctx.lineTo(26,5);
    ctx.lineTo(14,10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#f39c12";
    ctx.beginPath();
    ctx.ellipse(-6,3,10,7,-0.4,0,Math.PI * 2);
    ctx.fill();
  }


  getBounds(){
    return{
        left:this.x+6,
        right:this.x+this.width-6,
        top:this.y+6,
        bottom:this.y+this.height-6
    };

}
}

