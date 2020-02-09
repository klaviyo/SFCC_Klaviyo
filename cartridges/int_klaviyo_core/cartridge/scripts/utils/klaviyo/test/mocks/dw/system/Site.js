'use strict';

function getCurrent() {
  return {
    getCustomPreferenceValue: function(str) {
      if (str === 'klaviyo_account') {
        return 'XXxxXX';
      } else if (str === 'EgiftProduct-ID') {
        return 111111;
      }
    },
  };
}

module.exports = {
  getCurrent: getCurrent
};
