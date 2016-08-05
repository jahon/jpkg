/// <reference path="vendor/require.min.js" />
'use strict';

require.config({
    baseUrl: [STATIC_PATH, "/js/src/"].join(''),
    paths: {
        zepto: 'vendor/zepto',
        handlebars: "vendor/handlebars",
        travelController: 'controllers/travelController',
        travelService: 'services/travelService'

    },
    shim: {
        zepto: {
            exports: 'zepto'
        },
        travelController: {
            deps: ['zepto', 'travelService']
        },

        handlebars: {
            exports: "Handlebars"
        },
        orderController: {
            deps: ['zepto', 'orderService']
        }

    }
    //,
    //urlArgs: "v=" + (new Date()).getTime()
});

require([
    'zepto'
], function ($) {

    //console.log($.fn);
});
