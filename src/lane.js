'use strict';

const { loadSound } = require('./loadAsset');
const missSound = loadSound('miss.wav');

module.exports = class Lane {
   constructor(key, index) {
      this.notes = [];
      this.key = key;
      this.index = index;
      this.playingMiss = false;
   }
   render(game, ctx) {
      const indexes = [];
      ctx.fillStyle = this.index === 0 || this.index === 3 ? '#1f9ff1' : '#ff4040';
      for (let i = 0; i < this.notes.length; i++) {
         if (this.notes[i].missed) {
            game.notesMiss += 1;
            game.scoreUp = null;
            indexes.push(i);
         }
         if (!this.notes[i].render(game, ctx, this.index)) {
            break;
         }
      }
      if (indexes.length != 0) {
         game.show = { type: 'miss', timer: 0, size: 0.08 };
         game.score = 0;
         for (const index of indexes) {
            this.notes.splice(index, 1);
         }
         if (!this.playingMiss) {
            missSound.play();
            this.playingMiss = true;
            missSound.addEventListener(
               'ended',
               (() => {
                  this.playingMiss = false;
               }).bind(this)
            );
         }
      }
   }
};
