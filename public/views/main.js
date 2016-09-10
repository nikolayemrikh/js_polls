/* global webix, $$ */

define("views/main", [
    "app",
    "locale",
    "models/time",
    "models/user",
    "components/sidebar"
], function(app, locale, time, user) {
    'use strict';
    
    var uid = webix.uids('CLOCK', 'MENU');
    var timer;

    function getMenuData() {
        switch (user.get('role')) {
            case 1:
                return [{
                    id: "student.room",
                    icon: "calendar-o",
                    value: locale.t("main.sessions")
                }/*, {
                    id: "student.profile",
                    icon: "pencil-square-o",
                    value: locale.t("main.profile")
                }, {
                    id: "check",
                    icon: "dashboard",
                    value: locale.t("main.check")
                }*/];
            case 3:
                return [{
                    id: "admin.rooms",
                    icon: "tags",
                    value: locale.t("main.room")
                }/*, {
                    id: "admin.users",
                    icon: "users",
                    value: locale.t("main.users")
                }, {
                    id: "admin.schedules",
                    icon: "calendar",
                    value: locale.t("main.schedules")
                }, {
                    id: "admin.blanks",
                    icon: "files-o",
                    value: locale.t("main.blanks")
                }, {
                    id: "admin.stats",
                    icon: "bar-chart",
                    value: locale.t("main.stats")
                }, {
                    id: "admin.jobs",
                    icon: "tasks",
                    value: locale.t("main.jobs")
                }*/];
        }
    }

    var ui = {
        rows: [{
            view: "toolbar",
            elements: [{
                view: "button",
                type: "icon",
                icon: "bars",
                width: 37,
                align: "left",
                click: function() {
                    $$(uid.MENU).toggle();
                }
            }, {
                view: "label",
                label: "Polls"
            }, {}, {
                id: uid.CLOCK,
                view: "template",
                css: "datetime",
                template: "<span title='#date#'>#time#</span>",
                data: {
                    date: time.now('%l, %j %B %Y'),
                    time: time.now(webix.i18n.timeFormat)
                },
                borderless: true
            }, {
                view: "button",
                type: "icon",
                width: 45,
                icon: "sign-out",
                tabFocus: false,
                tooltip: locale.t("main.logout"),
                click: function() {
                    user.logout().then(function() {
                        app.show("login");
                    });
                }
            }]
        }, {
            cols: [{
                id: uid.MENU,
                view: "sidebar",
                collapsed: true,
                width: 200,
                on: {
                    onItemClick: function(id) {
                        app.show('main/' + id);
                    }
                }
            }, {
                $subview: true
            }]
        }]
    };

    return {
        $ui: ui,
        $menu: function() {
            return $$(uid.MENU);
        },
        $onurlchange: function() {
            var menu = this.$menu();
            menu.define({
                data: getMenuData()
            });
            menu.refresh();
        },
        $oninit: function(view, $scope) {
            var $clock = $$(uid.CLOCK);
            timer = setInterval(function() {
                $clock.setValues({
                    date: time.now('%l, %j %B %Y'),
                    time: time.now(webix.i18n.timeFormat)
                });
            }, 1000);
        },
        $ondestroy: function() {
            clearInterval(timer);
        }
    };
});
