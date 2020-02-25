'use strict';

function getLogger(tag, label) {
  return {
    info: function(str) {
      return label + '\n' + str;
    },
    error: function(str) {
      return label + '\n' + str;
    }
  };
}

module.exports = {
  getLogger: getLogger
};
