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
    this.blastLoaded = false;
    this.blastSprite = new Image();
    this.blastSprite.onload = () => {
      this.blastLoaded = true;
    };
    this.blastSprite.onerror = () => {
      this.blastLoaded = false;
    };
    this.blastSprite.src = "assets/images/blast.png";

    this.rocketExplosion = null;
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

    this.rocketExplosion = null;
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
  const cx = this.x + this.width / 2;
  const cy = this.y + this.height / 2;
  const explosionX = cx;
  const explosionY = cy + this.height / 2;
  
  const explosion = {
    x: explosionX,
    y: explosionY,
    startTime: Date.now(),
    duration: 1000,
    scale: 1,
    alpha: 1,
    particles: [],
    shockwave: {
      radius: 0,
      maxRadius: 120,
      alpha: 0.8,
    },
    spriteFrame: Math.random() < 0.5 ? 0 : 1,
  };

  const colors = ['#ff4500', '#ffa500', '#ffd700', '#ff0000'];
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 / 12) * i;
    const speed =2 + Math.random() * 4;
    explosion.particles.push({
      x: explosionX,
      y: explosionY,
      vx: Math.cos(angle) * speed,
      vy: -Math.abs(Math.sin(angle) * speed) - 2,
      size: 3 + Math.random() * 4,
      alpha: 1,
      life: 35,
      maxLife: 35,
      color: colors[i % colors.length],
      gravity: 0.15,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
    });
  }

  this.rocketExplosion = explosion;
}
 updateBlast(){
 if(!this.rocketExplosion) {
  this.blastTimer++;
  this.hitFlashAlpha=Math.max(0,this.hitFlashAlpha-0.05);
  if(this.blastTimer>20){
    this.showBlast=false;
    this.isDying=true;
    this.velocity=-5;
    return true;
  }
  return false;
 }
 const explosion = this.rocketExplosion;
 const elapsed = Date.now()-explosion.startTime;
 const progress = elapsed / explosion.duration;
 if(progress>=1){
  this.showBlast=false;
  this.rocketExplosion=null;
  this.isDying=true;
  this.velocity=-5;
  return true;
 }
 if (progress<0.2){
  explosion.scale=0.1+ (progress/0.2)*0.9;
 } else {
  explosion.scale=1-((progress-0.2)/0.8)*0.3;
 }
 explosion.alpha=1-(progress*progress);
 explosion.shockwave.radius=explosion.shockwave.maxRadius*progress;
 explosion.shockwave.alpha=0.8*(1-progress);
 for(let j=explosion.particles.length-1;j>=0;j--) {
  const p=explosion.particles[j];
  p.x+=p.vx;
  p.y+=p.vy;
  p.vy+=p.gravity;
  p.vx*=0.98;
  p.life--;
  p.alpha=Math.max(0,p.life/p.maxLife);
  if(p.rotation !== undefined) {
    p.rotation+=p.rotationSpeed;
  }
  if(p.isSmoke){
    p.size+=0.3;
  }
  if(p.life<=0){
    explosion.particles.splice(j,1);
  }
 }
 this.hitFlashAlpha=Math.max(0,explosion.alpha);
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
  return this.y+this.height>=groundY||this.y<=0;
}
drawBlast(){
  const ctx=this.ctx;
  const cx=this.x+this.width/2;
  const cy=this.y+this.height/2;
  if(this.rocketExplosion) {
    const explosion = this.rocketExplosion;
    ctx.save();
    for(const p of explosion.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle=p.color;
      ctx.save();
      ctx.translate(p.x,p.y);
      if(p.rotation !== undefined) {
        ctx.rotate(p.rotation);
      }
      ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*0.6);
      ctx.restore();
    }
    ctx.globalAlpha=explosion.alpha;
    const spriteWidth = explosion.spriteFrame===0?174:174;
    const spriteHeight=explosion.spriteFrame===0?175:145;
    const spriteX=explosion.spriteFrame===0?183:3;
    const spriteY = explosion.spriteFrame===0?183:32;
    const drawWidth=spriteWidth*explosion.scale;
    const drawHeight=spriteHeight*explosion.scale;
    if(this.blastSprite&&this.blastSprite.complete && this.blastSprite.naturalWidth>0){
      ctx.drawImage(
        this.blastSprite,
        spriteX,spriteY,spriteWidth,spriteHeight,
        explosion.x-drawWidth/2,
        explosion.y-drawHeight,
        drawWidth,drawHeight 
      );
    } else{
      const gradient = ctx.createRadialGradient(
        explosion.x,explosion.y-drawHeight/2,
        0,
        explosion.x,explosion.y-drawHeight/2,
        drawWidth/2
      );
      gradient.addColorStop(0,'#FFFF00');
      gradient.addColorStop(0.3,'#FFA500');
      gradient.addColorStop(0.6,'#FF4500');
      gradient.addColorStop(1,'rgba(255,0,0,0)');
      ctx.fillStyle=gradient;
      ctx.beginPath();
      ctx.arc(explosion.x,explosion.y-drawHeight/2,drawWidth/2,0,Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }
  const spriteFrame=this.blastTimer>8?1:0;
  const spriteWidth=174;
  const spriteHeight=spriteFrame===0?175:145;
  const spriteX=spriteFrame===0?183:3;
  const spriteY = spriteFrame===0?183:32;
  const scale=0.45+this.blastTimer*0.03;
  const alpha = Math.max(0,1-(this.blastTimer/20));
  ctx.save();
  if(alpha>0.05){
    ctx.globalAlpha=alpha*0.7;
    ctx.strokeStyle='#FF6600';
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.arc(cx,cy,18+this.blastTimer*3,0,Math.PI*2);
    ctx.stroke();
  }
  ctx.globalAlpha=alpha;
  if(this.blastLoaded&&this.blastSprite&&this.blastSprite.complete&&this.blastSprite.naturalWidth>0){
    const drawWidth = spriteWidth*scale;
    const drawHeight=spriteHeight*scale;
    ctx.drawImage(
      this.blastSprite,
      spriteX,
      spriteY,
      spriteWidth,
      spriteHeight,
      cx-drawWidth/2,
      cy-drawHeight/2,
      drawWidth,
      drawHeight
    );
    ctx.restore();
    return;
  }
  const r=30+this.blastTimer*2;
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