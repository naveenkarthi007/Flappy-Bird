class Bird{
    constructor(canvas){
        this.canvas=canvas;
        this.ctx = canvas.getContext('2d');

        this.width = 40;
        this.height = 30;
        this.x= canvas.width/2 - this.width/2;
        this.y=canvas.height/3.1;

        this.velocity=0;
        this.gravity=0.3
    }
}