'use strict';

// prepares data for "Viewed Category" event
function getData(categoryID) {
    // TODO: remove the following debugging comments...
    // instead of returning this obj...take this obj & return to res.viewData({}) .... in SFRA
    // in siteGen, we'd take the obj and return something like viewData in siteGen?....
    return { "Viewed Category": categoryID }
}

module.exports = {
    getData : getData
}
