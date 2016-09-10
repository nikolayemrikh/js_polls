var express = require('express');
var config = require('nconf');
var ejs = require('ejs');
var passport = require('passport');
var passportOAuth = require('passport-oauth');

var auth = require('../../db').dao('auth');

module.exports = function(provider) {
    // OAuth2 strategy
    passport.use(provider, new passportOAuth.OAuth2Strategy(config.get('auth:' + provider),
        function(accessToken, refreshToken, prof, done) {
            var userProfileURL = config.get('auth:' + provider + ':userProfileURL');
            this._oauth2._useAuthorizationHeaderForGET = true;
            this._oauth2.get(userProfileURL, accessToken, function(err, body, res) {
                if (err) {
                    var InternalOAuthError = passportOAuth.InternalOAuthError;
                    return done(new InternalOAuthError('failed to fetch user profile', err));
                }
                try {
                    var profile = JSON.parse(body);
                }
                catch (e) {
                    return done(e);
                }
                var userData = {};
                var profileFields = config.get('auth:' + provider + ':userProfileFields');
                for (var key in profileFields) {
                    try {
                        userData[key] = ejs.render(profileFields[key], profile);
                    }
                    catch (e) {}
                }
                auth.external(provider, userData, done);
            });
        }));

    var router = express.Router();
    router.get('/' + provider, passport.authenticate(provider));
    router.get('/' + provider + '/callback', passport.authenticate(provider, {
        failureRedirect: '/#login'
    }), function(req, res, next) {
        res.redirect('/');
    });
    return router;
};