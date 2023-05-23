'use strict';

/***
 * KL EVENT TRACKING: Prepares data for "Searched Site" event
 * Very simple event, but to keep a consistent architecture with other events we give it its own file
 *
 * @param term - search term (string)
 * @param count - number of search results returned (string)
 * @returns data object to be passed to the KL API
***/

function getData(term, count) {
    return {
        "Search Term": term,
        "Search Results Count": count
    }
}


module.exports = {
    getData : getData
};
