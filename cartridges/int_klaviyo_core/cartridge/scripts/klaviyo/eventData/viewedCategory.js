'use strict';

/**
     * KL EVENT TRACKING: Prepares data for "Viewed Catagory" event
     * Very simple event, but to keep a consistent architecture with other events we give it its own file
     *
     * @param categoryID - category ID (string)
     * @returns data object to be passed to the KL API
**/
function getData(categoryID) {
    return { 'Viewed Category': categoryID };
}


module.exports = {
    getData: getData
};
