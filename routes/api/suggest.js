var express = require('express');
var router = express.Router();
var config = require('nconf');

var auth = require('../auth');
var rest = require('../../db').dao('rest');

router.get('/users', auth.isAdministrator, function(req, res, next) {
    var filter = req.query.filter || {};
    var args = {
        model: 'user',
        filter: {
            role: filter.role,
            '$or': [{
                fullname: new RegExp(filter.value, 'i')
            }, {
                username: new RegExp(filter.value, 'i')
            }]
        },
        limit: 100,
        select: 'username lastname firstname middlename fullname',
        sort: 'fullname username'
    };
    rest.read(args, function(err, data) {
        if (err) return next(err);
        res.json(data.map(function(o) {
            return {
                id: o.id,
                value: [o.fullname, '(' + o.username + ')'].join(' ')
            };
        }));
    });
});

router.get('/providers', function(req, res, next) {
    var providers = config.get('auth') || {};
    res.json(Object.keys(providers).map(function(provider) {
        return {
            id: provider,
            value: [provider, '(' + providers[provider].strategy + ')'].join(' ')
        };
    }));
});

module.exports = router;