'use strict';

// prepares data for "Searched Site" event
function getData(term, count) {
    return {
        'Search Term'          : term,
        'Search Results Count' : count
    };
}


module.exports = {
    getData: getData
};
