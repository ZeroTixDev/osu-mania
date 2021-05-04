'use strict';

module.exports = class Control {
   constructor(type) {
      this.lock = false;
      this.type = type;
   }
   lock() {
      this.lock = true;
   }
   unlock() {
      this.lock = false;
   }
};
