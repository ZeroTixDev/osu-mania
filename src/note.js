'use strict';

const { noteSize, targetY, scrollSpeed, CANVAS_HEIGHT, RATE } = require('./constants');

module.exports = class Note {
   constructor(x, time) {
      this.x = x;
      this.time = time;
   }
   render({ timer }, ctx) {
      const y = targetY - (this.time - timer) * scrollSpeed;
      if (y > CANVAS_HEIGHT) {
         this.missed = true;
      }
      if (y < -noteSize) {
         return false;
      }
      ctx.beginPath();
      ctx.arc(this.x, Math.min(targetY, y), noteSize, 0, Math.PI * 2);
      ctx.fill();
      return true;
   }
};
