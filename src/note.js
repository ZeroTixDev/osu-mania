'use strict';

const { noteSize, targetY, scrollSpeed, CANVAS_HEIGHT } = require('./constants');

module.exports = class Note {
   constructor(x, time) {
      this.x = x;
      this.time = time;
   }
   render({ timer }, ctx, circleCanvas) {
      const y = targetY - (this.time - timer) * scrollSpeed;
      if (y - noteSize > CANVAS_HEIGHT) {
         this.missed = true;
      }
      if (y < -noteSize) {
         return false;
      }
      ctx.drawImage(circleCanvas, 
         this.x - noteSize, 
         Math.min(targetY, y) - noteSize, noteSize * 2, noteSize * 2);
      // ctx.strokeRect(this.x - noteSize, Math.min(targetY, y) -, circleCanvas.width, circleCanvas.height)
      // ctx.fillStyle = 'yellow';
      // ctx.beginPath();
      // ctx.arc(this.x, Math.min(targetY, y), noteSize, 0, Math.PI * 2);
      // ctx.fill();
      return true;
   }
};
