var express = require('express');
var router = express.Router();
var config = require('nconf');
var passport = require('passport');

var rest = require('../../db').dao('rest');

function checkRole(req, res, next, role) {
    if (req.isAuthenticated()) {
        if (role && req.user.role < role) {
            res.status(403).end();
        }
        else next();
    }
    else res.status(401).end();
}

passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(user, done) {
    done(null, user);
});

// User logout
router.post('/logout', function(req, res) {
    req.logout();
    res.end();
});
// Get user profile from session
router.get('/', function(req, res) {
    req.isAuthenticated() ? res.json(req.user) : res.status(401).end();
});
// Update user profile and session by id
router.put('/', function(req, res) {
    var args = {
        model: 'user',
        documentId: req.user.id,
        data: req.body
    };
    delete args.data.username;
    delete args.data.provider;
    delete args.data.hashedPassword;
    delete args.data.salt;
    delete args.data.role;
    delete args.data.active;
    delete args.data.lastLogon;
    rest.update(args, function(err, data) {
        if (!err && data) {
            req.login(data, function(err) {
                if (err) res.status(400).end();
                else res.json(data);
            });
        }
        else res.status(400).end();
    });
});

router.isAuth = function(req, res, next) {
    checkRole(req, res, next);
};
router.isStudent = function(req, res, next) {
    checkRole(req, res, next, 1);
};
router.isProctor = function(req, res, next) {
    checkRole(req, res, next, 2);
};
router.isAdministrator = function(req, res, next) {
    checkRole(req, res, next, 3);
};

// List of providers
router.get('/providers', function(req, res) {
    var providers = config.get('auth') || {};
    res.json(Object.keys(providers).map(function(provider) {
        return {
            provider: provider,
            strategy: providers[provider].strategy
        };
    }));
});

// Custom authorization
if (config.get('auth')) {
    var providers = config.get('auth') || {};
    Object.keys(providers).forEach(function(provider) {
        var strategy = require('./' + providers[provider].strategy);
        router.use(strategy(provider));
    });
}

module.exports = router;