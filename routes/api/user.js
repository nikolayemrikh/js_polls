var express = require('express');
var router = express.Router();

var rest = require('../../db').dao('rest');

router.get('/', function(req, res, next) {
    var args = {
        model: 'user',
        filter: req.query.filter,
        sort: req.query.sort,
        skip: req.query.skip,
        limit: req.query.limit
    };
    switch (req.user.role) {
        case 3:
            break;
        default:
            return res.status(401).end();
    }
    rest.read(args, function(err, data) {
        if (err) return next(err);
        res.json(data);
    });
});

router.get('/:userId', function(req, res, next) {
    var args = {
        model: 'user',
        documentId: req.params.userId
    };
    switch (req.user.role) {
        case 2:
        case 3:
            break;
        default:
            return res.status(401).end();
    }
    rest.read(args, function(err, data) {
        if (err) return next(err);
        res.json(data);
    });
});

router.post('/', function(req, res, next) {
    var args = {
        model: 'user',
        data: req.body
    };
    switch (req.user.role) {
        case 3:
            break;
        default:
            return res.status(401).end();
    }
    rest.create(args, function(err, data) {
        if (err) return next(err);
        res.json(data);
    });
});

router.put('/:userId', function(req, res, next) {
    var args = {
        model: 'user',
        documentId: req.params.userId,
        data: req.body
    };
    switch (req.user.role) {
        case 3:
            break;
        default:
            return res.status(401).end();
    }
    rest.update(args, function(err, data) {
        if (err) return next(err);
        res.json(data);
    });
});

router.delete('/:userId', function(req, res, next) {
    var args = {
        model: 'user',
        documentId: req.params.userId
    };
    switch (req.user.role) {
        case 3:
            break;
        default:
            return res.status(401).end();
    }
    rest.delete(args, function(err, data) {
        if (err) return next(err);
        res.json(data);
    });
});

module.exports = router;