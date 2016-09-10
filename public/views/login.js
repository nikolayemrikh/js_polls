/* global webix, $$ */

define("views/login", [
    "app",
    "locale",
    "models/user"
], function(app, locale, user) {
    'use strict';

    var uid = webix.uids('LOGIN_FROM', 'PROVIDERS');

    var loginForm = {
        view: "form",
        width: 300,
        elements: [{
            name: "username",
            view: "text",
            placeholder: locale.t("login.username"),
            attributes: {
                required: "true"
            },
            on: {
                'onAfterRender': function(e) {
                    this.focus();
                }
            }
        }, {
            name: "password",
            view: "text",
            type: "password",
            placeholder: locale.t("login.password")
        }, {
            margin: 5,
            cols: [{
                view: "button",
                value: locale.t("login.submit"),
                type: "form",
                click: function() {
                    var $form = this.getFormView();
                    if (!$form.validate()) return;
                    var values = $form.getValues();
                    user.login(values).then(function() {
                        app.render();
                    }).fail(function() {
                        $form.clear();
                        $form.clearValidation();
                        $form.focus();
                    });
                },
                hotkey: "enter"
            }]
        }, {
            id: uid.LOGIN_FROM,
            css: "login_from",
            hidden: true,
            rows: [{
                view: "template",
                template: locale.t("login.from"),
                type: "section"
            }, {
                id: uid.PROVIDERS,
                borderless: true,
                autoheight: true,
                template: function(obj) {
                    var providers = obj.providers || [];
                    var html = "";
                    for (var i = 0, l = providers.length; i < l; i++) {
                        var provider = providers[i].provider;
                        html += "<a class='login_provider' href='/auth/" + provider +
                            "'><img src='/images/auth/" + provider + ".png' alt='" + 
                            provider + "' onload='$$(" + uid.PROVIDERS + ").resize();'></a>";
                    }
                    return html;
                }
            }]
        }],
        rules: {
            "username": webix.rules.isNotEmpty,
            "password": webix.rules.isNotEmpty
        },
        elementsConfig: {
            labelAlign: "left",
            on: {
                onChange: function(old_v, new_v) {
                    this.getParentView().validate();
                }
            }
        }
    };

    var ui = {
        id: webix.uid(),
        hidden: true,
        rows: [{
            cols: [{
                type: "space"
            }, {
                type: "space"
            }, {
                type: "space"
            }]
        }, {
            cols: [{
                type: "space"
            }, {
                rows: [{
                    view: "toolbar",
                    type: "header",
                    elements: [{
                        view: "label",
                        label: "Polls"
                    }, {
                        view: "button",
                        type: "image",
                        image: "/images/flag-russia.png",
                        width: 35,
                        click: function() {
                            locale.setLang('ru');
                        }
                    }, {
                        view: "button",
                        type: "image",
                        image: "/images/flag-usa.png",
                        width: 35,
                        click: function() {
                            locale.setLang('en');
                        }
                    }, {
                        width: 3
                    }]
                }, loginForm]
            }, {
                type: "space"
            }]
        }, {
            cols: [{
                type: "space"
            }, {
                type: "space"
            }, {
                type: "space"
            }]
        }]
    };

    return {
        $ui: ui,
        $oninit: function() {
            webix.ajax().get('/auth/providers').then(function(data) {
                var providers = data.json();
                if (!providers) return;
                providers = providers.filter(function(item) {
                    return (item.strategy === 'oauth2');
                });
                if (providers.length) {
                    $$(uid.PROVIDERS).setValues({
                        providers: providers
                    });
                    $$(uid.LOGIN_FROM).show();
                }
            });
        },
        $onurlchange: function(config) {
            var username = config.username;
            var password = config.password;
            if (username && password) {
                user.login({
                    username: username,
                    password: password
                }).then(function() {
                    app.render();
                }).fail(function() {
                    $$(ui.id).show();
                });
            }
            else $$(ui.id).show();
        }
    };
});