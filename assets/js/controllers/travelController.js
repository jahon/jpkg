/**
 * @description:
 * @authot: jahon
 * @date: 2015/10/12
 */

define(function (require, exports, module) {
    var travelService = require('travelService').Service;
    var travelController;
    travelController = {
        clearSession: function (keys) {
            keys = keys || ['options:order', 'options:price', 'options:product'];

            keys.forEach(function (k) {sessionStorage.removeItem(k)});

        }
    };

    exports.Controller = travelController;
});
