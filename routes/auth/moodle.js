var express = require('express');
var passport = require('passport');
var request = require('request');
var url = require('url');
var config = require('nconf');
var LocalStrategy = require('passport-local').Strategy;

var auth = require('../../db').dao('auth');

/**
 * Получить профиль из Moodle серез WebServices.
 * 
 * @param {String} provider - Провайдер авторизации.
 * @param {String} profile - Логин (username) и пароль (password), введенные при авторизации.
 * @param {function} done(err, user, message)
 */
function getProfile(provider, profile, done) {
    var serverURL = config.get('auth:' + provider + ':serverURL');
    var wsToken = config.get('auth:' + provider + ':wsToken');
    var uri = url.resolve(serverURL, "webservice/rest/server.php?wstoken=" + wsToken +
        "&moodlewsrestformat=json&wsfunction=core_user_get_users_by_field&field=username&values[0]=" +
        profile.username);
    request(uri, function(err, res, body) {
        if (!err && res.statusCode == 200) {
            try {
                var json = JSON.parse(body);
            }
            catch (err) {
                return done(err);
            }
            done(null, json[0]);
        }
        else done(err, false);
    });
}

/**
 * Проверить логин и пароль в Moodle через попытку получить токен сервиса.
 * Если пользователь логин и пароль неверные, то ответ содержит 
 * подстроку "invalidlogin", а если верные - "usernotallowed".
 * 
 * @param {String} provider - Провайдер авторизации.
 * @param {String} username - Логин пользователя.
 * @param {String} password - Пароль пользователя.
 * @param {function} done(err, user, message)
 */
function authUser(provider, username, password, done) {
    var serverURL = config.get('auth:' + provider + ':serverURL');
    var wsShortName = config.get('auth:' + provider + ':wsShortName');
    var uri = url.resolve(serverURL, 'login/token.php?service=' + wsShortName);
    request.post({
        uri: uri,
        formData: {
            username: username,
            password: password
        }
    }, function(err, res, body) {
        if (err || res.statusCode != 200) return done(err, false);
        if (body && ~body.indexOf('usernotallowed')) {
            getProfile(provider, {
                username: username,
                password: password
            }, function(err, profile) {
                if (err) return done(err);
                auth.external(provider, {
                    username: profile.username,
                    email: profile.email,
                    firstname: profile.firstname,
                    lastname: profile.lastname,
                    address: profile.address,
                    citizenship: profile.country
                }, done);
            });
        }
        else done(err, false);
    });
}

module.exports = function(provider) {
    // Local strategy
    passport.use(provider, new LocalStrategy(authUser.bind(null, provider)));

    var router = express.Router();
    router.post('/login', passport.authenticate(provider),
        function(req, res, next) {
            res.json(req.user);
        });
    return router;
};