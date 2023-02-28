"use strict";

function searchOrders(str, sortBy, id, bool) {
  return {
    asList: function () {
      return ["order 1", "order 2"];
    },
  };
}

module.exports = {
  searchOrders: searchOrders,
};
