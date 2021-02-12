'use strict';

module.exports = class Control {
   constructor() {
      this.lock = false;
   }
   lock() {
      this.lock = true;
   }
   unlock() {
      this.lock = false;
   }
};
