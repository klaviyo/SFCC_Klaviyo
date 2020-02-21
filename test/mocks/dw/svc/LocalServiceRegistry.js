'use strict';

function createService() {
    return {
        createRequest : function () {},
        parseResponse : function () {},
        addParam      : function () {},
        call          : function () {
            return {
                object: 1
            };
        }
    };
}

module.exports = {
    createService: createService
};
