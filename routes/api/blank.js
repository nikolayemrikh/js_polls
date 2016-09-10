var express = require('express');
var router = express.Router();

var rest = require('../../db').dao('rest');

router.get('/', function(req, res, next) {
    var args = {
        model: 'blank',
        filter: req.query.filter,
        skip: req.query.skip,
        limit: req.query.limit,
        sort: req.query.sort
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

router.get('/:blankId', function(req, res, next) {
    var args = {
        model: 'blank',
        documentId: req.params.blankId
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

router.post('/', function(req, res, next) {
    var args = {
        model: 'blank',
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

router.put('/:blankId', function(req, res, next) {
    var args = {
        model: 'blank',
        documentId: req.params.blankId,
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

router.delete('/:blankId', function(req, res, next) {
    var args = {
        model: 'blank',
        documentId: req.params.blankId
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