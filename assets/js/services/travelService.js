/// <reference path="../vendor/zepto.js" />
/// <reference path="../baseConfig.js" />

/*!
 * description: 业务处理
 * date: 2014/08/30
 * author: Jahon
 */

'use strict';

define(function (require, exports, module) {

    var travelService = {
        _ajax: function (options) {
            var defer = $.Deferred();
            if (!options.type) options.type = 'POST';

            options.complete = function () {
                //Util.dialog.hideLoading();
            }
            options.error = function () {
                Util.dialog.hideLoading();
                Util.dialog.showMessage();
            }
            var request = $.ajax(options);
            var promise = request.then(function (response) {
                //console.log(response)
                return response;
            }, function (response) {
                defer.reject();
            });
            promise.fail = function (response) {
                return defer.resolve();
            }
            promise.done(function () {
                defer = request = promise = null;
            });

            return promise;
        },
        order: function (model) {
            return this._ajax({
                url: '/orderp/',
                headers: {serviceName: ''},
                data: model,
                beforeSend: function () {
                    Util.dialog.showLoading();
                }
            });
        }
    }

    exports.Service = travelService;

});
