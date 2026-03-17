class Bird{
  constructor(canvas){
    this.canvas=canvas;
    this.ctx=canvas.getContext("2d");
    this.width=40;
    this.height=30;
    this.gravity=0.3;
    this.jumpStrength=-7;
    this.frameInterval=100;
    this.autoFlySpeed=0.02;
    this.autoFlyAmplitude=15;
    this.spriteLoaded = false;
    this.spriteSheet=new Image();
    this.spriteSheet.onload = ()=>{
      this.spriteLoaded=true;
    };
    this.spriteSheet.onerror =() =>{
      this.spriteLoaded=false;
    };
    this.spriteSheet.src = "assets/images/flappybirdassets.png";
    this.frames=[
      {x:223,y:124,width:17,height:12},
      {x:264,y:90,width:17,height:12},
      {x:264,y:64,width:17,height:12}
    ];
    this.reset();
  }
  reset(){
    this.x=this.canvas.width/2-this.width/2;
    this.y=this.canvas.height/3.2;
    this.baseY=this.canvas.height/3.2;
    this.velocity =0;
    this.rotation=0;
    this.currentFrame=0;
    this.lastFrameTime=0;
    this.autoFlyTime=0;
    this.isDead=false;
    this.isDying=false;
    this.showBlast=false;
    this.blastTimer=0;
    this.hitFlashAlpha=0;
  }

  flap() {
    this.velocity=this.jumpStrength;
  }

  updateAnimation(currentTime){
    if(currentTime-this.lastFrameTime >=this.frameInterval) {
      this.currentFrame = (this.currentFrame+1) % this.frames.length;
      this.lastFrameTime=currentTime;
    }
  }

  updateAutoFly(currentTime){
    this.autoFlyTime += this.autoFlySpeed;
    this.y=this.baseY+Math.sin(this.autoFlyTime) * this.autoFlyAmplitude;
    this.rotation=0;
    this.updateAnimation(currentTime);
  }
  update(deltaTime,isRunning){
    const currentTime = performance.now();
    if(!isRunning){
      this.updateAutoFly(currentTime);
      return;
    }
    this.velocity+=this.gravity;
    if(this.velocity>8){
      this.velocity=8;
    }
    this.y+=this.velocity;
    this.rotation = Math.min(Math.max(this.velocity *3 , -30),90);
    this.updateAnimation(currentTime);
  }

  draw(){
    const ctx = this.ctx;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(this.x+this.width/2,this.y+this.height/2);
    ctx.rotate((this.rotation*Math.PI)/180);
    if(this.spriteLoaded) {
      const frame = this.frames[this.currentFrame];
      ctx.drawImage(
        this.spriteSheet,
        frame.x,
        frame.y,
        frame.width,
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
    ctx.fillStyle="#f4d03f";
    ctx.beginPath();
    ctx.ellipse(0,0,this.width/2,this.height/2,0,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle="#ffffff";
    ctx.beginPath();
    ctx.arc(10,-5,8,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle="#111111";
    ctx.beginPath();
    ctx.arc(12,-5,4,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.moveTo(15,2);
    ctx.lineTo(28,5);
    ctx.lineTo(15,10);
    ctx.closePath();
    ctx.fill();
  }
  getBounds(){
    return{
      x:this.x+8,
      y:this.y+8,
      width:this.width-16,
      height:this.height-16,
      left:this.x+8,
      right:this.x+this.width-8,
      top:this.y+8,
      bottom:this.y+this.height-8,
    };
  }


die(){
  this.isDead=true;
  this.isDying = true;
  this.blastTimer=0;
  this.hitFlashAlpha=1;
}

dieByRocket(){
  this.isDead=true;
  this.showBlast=true;
  this.blastTimer= 0;
  this.hitFlashAlpha=1;
}
 updateBlast(){
  this.blastTimer++;
  this.hitFlashAlpha=Math.max(0,this.hitFlashAlpha-0.05);
  if(this.blastTimer>20){
    this.showBlast=false;
    this.isDying= true;
    this.velocity=-5;
    return true;
  }
  return false;
 }
 updateDying(groundY){
  this.velocity+=this.gravity;
  this.y+=this.velocity;
  this.rotation=90;
  this.hitFlashAlpha=Math.max(0,this.hitFlashAlpha-0.02);
 }

 hasFallenOut(){
  return this.y>this.canvas.height+50;
 }

 isOutOfBounds(groundY){
  return this.y+this.height>=groundY || this.y<=0;
 }

 drawBlast(){
  const ctx=this.ctx;
  const cx=this.x+this.width/2;
  const cy=this.y+this.height/2;
  const r=30+this.blastTimer*2;
  ctx.save();
  const grad=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
  grad.addColorStop(0,'rgba(255,200,50,0.8)');
  grad.addColorStop(0.5,'rgba(255,100,0,0.4)');
  grad.addColorStop(1,'rgba(255,50,0,0)');
  ctx.fillStyle=grad;
  ctx.beginPath();
  ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
 }
 
}