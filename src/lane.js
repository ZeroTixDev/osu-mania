'use strict';

const { loadSound } = require('./loadAsset');
const { noteSize } = require('./constants');
const missSound = loadSound('miss.wav');
const Particle = require('./particle');

module.exports = class Lane {
   constructor(key, index) {
      this.notes = [];
      this.key = key;
      this.index = index;
      this.playingMiss = false;
      this.circle = document.createElement('canvas');
      this.circleCtx = this.circle.getContext('2d');
      this.circle.width = noteSize * 2;
      this.circle.height = noteSize * 2;
      (this.index === 0 || this.index === 3) ? (() => {
         // blue
         this.circleCtx.fillStyle = '#1f9ff1'
      })(): (() => {
         // red
         this.circleCtx.fillStyle = '#ff4040'
      })();
      this.circleCtx.beginPath();
      this.circleCtx.arc(noteSize, noteSize, noteSize, 0, Math.PI * 2);
      this.circleCtx.fill();
      this.particles = [];
   }
   addParticle(data) {
      this.particles.push(new Particle(data));
   }
   updateParticles(delta) {
      for(let i = 0; i < this.particles.length; i++) {
         this.particles[i].update(delta);
      }
   }
   render(game, ctx) {
      for(let i = this.particles.length - 1; i >= 0; i--) {
         if (this.particles[i].delete) {
            this.particles.splice(i, 1);
            continue;
         }
         this.particles[i].render(ctx);
      }
      const indexes = [];
      for (let i = 0; i < this.notes.length; i++) {
         if (this.notes[i].missed) {
            game.notesMiss += 1;
            game.scoreUp = null;
            indexes.push(i);
         }
         if (!this.notes[i].render(game, ctx, this.circle)) {
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
            missSound.volume = 0.6;
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
