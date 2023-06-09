'use strict';

// prepares data for "Viewed Category" event
function getData(categoryID) {
    return { 'Viewed Category': categoryID };
}


module.exports = {
    getData: getData
};
