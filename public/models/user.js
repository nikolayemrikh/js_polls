/**
 * Модель управления пользовательской сессией.
 */

/* global webix */

define("models/user", [
    "models/time",
    "helpers/utils"
], function(time, utils) {
    'use strict';

    var profile;

    var user = {
        isAuth: function() {
            if (profile) return true;
            else return false;
        },
        isMe: function(id) {
            return profile.id === id;
        },
        get: function(path) {
            if (!path) return profile;
            var arr = path.split('.');
            return arr.reduce(function(obj, i) {
                if (obj) return obj[i];
            }, profile);
        },
        filter: function() {
            var out = {};
            for (var i = 0, l = arguments.length; i < l; i++) {
                var key = arguments[i];
                out[key] = user.get(key);
            }
            return out;
        },
        fetch: function() {
            var promise = webix.ajax().get("/auth");
            promise.then(function(data) {
                profile = data.json();
                time.sync();
            });
            return promise;
        },
        login: function(data) {
            var promise = webix.ajax().post("/auth/login", data);
            promise.then(function(data) {
                profile = data.json();
                time.sync();
            });
            return promise;
        },
        logout: function() {
            var promise = webix.ajax().post("/auth/logout");
            promise.then(function() {
                profile = null;
                utils.postMessage('clearCookies', '*');
            });
            return promise;
        }
    };

    return user;
});