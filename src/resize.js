'use strict';
const { CANVAS_WIDTH, CANVAS_HEIGHT } = require('./constants');

module.exports = {
   resizeCanvas: function (array, func = () => {}) {
      for (const canvas of array) {
         if (canvas.width !== CANVAS_WIDTH) canvas.width = CANVAS_WIDTH;
         if (canvas.height !== CANVAS_HEIGHT) canvas.height = CANVAS_HEIGHT;
         canvas.style.transform = `scale(${Math.min(
            window.innerWidth / CANVAS_WIDTH,
            window.innerHeight / CANVAS_HEIGHT
         )})`;
         canvas.style.left = `${(window.innerWidth - CANVAS_WIDTH) / 2}px`;
         canvas.style.top = `${(window.innerHeight - CANVAS_HEIGHT) / 2}px`;
      }
      func();
      return Math.min(window.innerWidth / CANVAS_WIDTH, window.innerHeight / CANVAS_HEIGHT);
   },
};
