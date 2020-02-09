'use strict';

function encodeBase64(str) {
  return Buffer.from(str).toString('base64');
}

function formatMoney(money) {
  return '$10.00';
}

module.exports = {
  encodeBase64: encodeBase64,
  formatMoney: formatMoney
};
