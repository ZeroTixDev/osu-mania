'use strict';

module.exports = class Particle {
    constructor({ x, y, color, speed, time, fadeTime, radiusRange }) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.time = time;
        this.fadeTime = fadeTime;
        this.currentTime = 0;
        this.alpha = 1;
        this.radius = 
            radiusRange[0] + Math.floor(Math.random() * (radiusRange[1] - radiusRange[0]))
        this.angle = Math.random() * Math.PI;
        this.xv = Math.cos(this.angle) * speed;
        this.yv = Math.sin(this.angle) * speed;
        this.particle = document.createElement('canvas');
        this.particleCtx = this.particle.getContext('2d');
        this.particle.width = this.radius * 2;
        this.particle.height = this.radius * 2;
        this.particleCtx.fillStyle = this.color;
        this.particleCtx.beginPath();
        this.particleCtx.arc(this.radius, this.radius, this.radius, 0, Math.PI * 2);
        this.particleCtx.fill();
    }
    update(delta) {
        this.x += this.xv * delta;
        this.y += this.yv * delta;
        this.currentTime += delta;
        if (this.currentTime > this.time) {
            this.alpha = 1 - ((this.currentTime - this.time) / (this.fadeTime - this.time));
        }
        if (this.alpha <= 0) {
            this.delete = true;
        }
    }
    render(ctx) {
        ctx.globalAlpha = this.alpha;
        ctx.drawImage(this.particle, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
        ctx.globalAlpha = 1;
    }
}