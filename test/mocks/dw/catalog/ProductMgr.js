"use strict";

function getProduct(productId) {
  var product = {
    name: "red basketball shoe",
    // getPageURL: function() { return 'https://www.klaviyo.com' },
    UPC: "rbs123",
    allCategories: {
      toArray: function () {
        return ["shoes", "red", "basketball"];
      },
    },
    // getPrimaryCategory: function() { return {displayName: 'shoes'} },
    // getImage: function() { return { getAbsURL: function() { return ['https://www.klaviyo.com/wp-content/uploads/2019/07/reporting-ps-551x651-072019.png']; }}},
    // getPriceModel: function() { return {getPrice: function() { return {getValue: function() {}, value: '$10.00'}}}; }
  };

  product.getPrimaryCategory = function () {
    return { displayName: "shoes" };
  };

  product.getImage = function (str) {
    if (str === "large") {
      return {
        getAbsURL: function () {
          return "https://www.klaviyo.com";
        },
      };
    }
  };

  product.getPageURL = function () {
    return "https://www.klaviyo.com";
  };

  product.getPriceModel = function () {
    return {
      getPrice: function () {
        return {
          getValue: function () {
            return 4;
          },
        };
      },
      getMinPrice: function () {
        return {
          value: 4,
          getValue: function () {
            return 4;
          },
        };
      },
    };
  };

  return product;
}

module.exports = {
  getProduct: getProduct,
};
