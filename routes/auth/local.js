var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var auth = require('../../db').dao('auth');

module.exports = function(provider) {
    // Local strategy
    passport.use(provider, new LocalStrategy(auth.local));

    var router = express.Router();
    router.post('/login', passport.authenticate(provider),
        function(req, res, next) {
            res.json(req.user);
        });
    return router;
};