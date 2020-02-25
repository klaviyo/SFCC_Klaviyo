'use strict';

function empty(obj) {
  if (obj === 0) {
    return;
  }
  if (obj === null) {
    return true;
  } else if (typeof obj === 'object') {
    if (Object.keys(obj).length === 0) {
      return true;
    }
  } else if (obj) {
      return;
  } else {
    return true;
  }
}

module.exports = empty;
