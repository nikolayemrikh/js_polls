require.config({
    paths: {
        webix: './bower_components/webix/codebase/webix',
        socket: '/socket.io/socket.io',
        polyglot: './bower_components/polyglot/build/polyglot',
        mobiledetect: './bower_components/mobile-detect/mobile-detect'
    },
    shim: {
        'webix': {
            exports: 'webix'
        }
    }
});

define("app", [
    "webix",
    "core",
    "plugins/locale",
    "plugins/menu",
    "plugins/user"
], function(webix, core, locale, menu, user) {
    'use strict';

    // Webix config
    webix.codebase = "./";
    webix.extend(webix, {
        // Генерация идентификаторов для компонентов
        uids: function() {
            var args = Array.prototype.slice.call(arguments, 0);
            return args.reduce(function(a, b) {
                a[b] = webix.uid();
                return a;
            }, {});
        }
    });
    webix.extend(webix.ui.list, webix.OverlayBox);
    webix.ui.fullScreen();
    webix.require('bower_components/font-awesome/css/font-awesome.css');
    //enabling CustomScroll
    if (webix.CustomScroll && !webix.env.touch && webix.ui.scrollSize)
        webix.CustomScroll.init();

    //configuration
    var app = core.create({
        name: "js_polls"
        //debug: true,
        //layout: "main"
    });

    app.use(locale);
    app.use(menu);
    app.use(user);

    return app;
});